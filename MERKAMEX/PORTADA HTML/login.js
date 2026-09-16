const canvas = document.getElementById('tech-background');
const ctx = canvas.getContext('2d');
let width, height, particles;

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    const particleCount = width < 768 ? 40 : 80;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width, y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 0.5
        });
    }
}

function animateCanvas() {
    requestAnimationFrame(animateCanvas);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 150, 94, ${0.15 - distance/120})`;
                ctx.lineWidth = 1; ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
            }
        }
    }
}
initCanvas(); animateCanvas(); window.addEventListener('resize', initCanvas);

const togglePwdBtn = document.getElementById('toggle-pwd');
const codigoInput = document.getElementById('codigoUsuario');
togglePwdBtn.addEventListener('click', () => {
    const type = codigoInput.getAttribute('type') === 'password' ? 'text' : 'password';
    codigoInput.setAttribute('type', type);
    togglePwdBtn.style.color = type === 'text' ? 'var(--emerald-green)' : 'var(--text-silver)';
});

const togglePassBtn = document.getElementById('toggle-pass');
const passInput = document.getElementById('passUsuario');
togglePassBtn.addEventListener('click', () => {
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    togglePassBtn.style.color = type === 'text' ? 'var(--emerald-green)' : 'var(--text-silver)';
});

let pasoLogin = 1;
let infoSesionGlobal = { codigo: "", nombre: "" };

async function iniciarSesion(event) {
    event.preventDefault(); 
    
    if (pasoLogin === 1) {
        const codigo = document.getElementById('codigoUsuario').value.trim(); 
        
        if(codigo) {
            const btn = document.getElementById('btn-submit');
            btn.classList.add('loading');
            
            try {
                // Revisar Firestore primero
                const userDoc = await db.collection("usuarios").doc(codigo).get();
                btn.classList.remove('loading');
                
                let data = null;
                if (userDoc.exists) {
                    data = userDoc.data();
                } else if (typeof baseOperadores !== 'undefined' && baseOperadores[codigo]) {
                    // Fallback a db_operadores local
                    data = {
                        nombre: baseOperadores[codigo],
                        password: codigo === "1799" ? "2684" : ""
                    };
                }
                
                if (data) {
                    infoSesionGlobal.codigo = codigo;
                    infoSesionGlobal.nombre = data.nombre;
                    
                    let requierePassword = false;
                    // Verifica si el usuario tiene un email y password en Firebase Auth
                    // Por simplicidad en la migración, si tiene contraseña guardada significa que debe validarla
                    if (data.password && data.password.trim() !== "") {
                        requierePassword = true;
                    }

                    if (requierePassword) {
                        pasoLogin = 2;
                        document.getElementById('group-codigo').style.display = 'none';
                        document.getElementById('codigoUsuario').removeAttribute('required');
                        
                        document.getElementById('group-password').style.display = 'block';
                        document.getElementById('passUsuario').setAttribute('required', 'true');
                        document.getElementById('passUsuario').focus();
                        document.getElementById('btn-submit').querySelector('.btn-text').textContent = "VALIDAR";
                    } else {
                        // Usuario sin contraseña registrada
                        localStorage.setItem("operadorActivo", infoSesionGlobal.nombre);
                        localStorage.setItem("codigoActivo", codigo); 
                        window.location.href = "../SISTEMA/sistema.html";
                    }
                } else {
                    alert("Acceso Denegado: Código no reconocido.");
                    document.getElementById('codigoUsuario').value = "";
                }
            } catch (error) {
                console.error("Error al conectar con Firebase:", error);
                btn.classList.remove('loading');
                alert("Error al conectar con la Nube. Revisa tu conexión a internet.");
            }
        }
    } else if (pasoLogin === 2) {
        const passIngresada = document.getElementById('passUsuario').value;
        const btn = document.getElementById('btn-submit');
        btn.classList.add('loading');
        
        try {
            // Utilizamos un email ficticio basado en el código para Firebase Auth
            const email = infoSesionGlobal.codigo + "@merkamex.com";
            
            let authExitoso = false;
            try {
                await auth.signInWithEmailAndPassword(email, passIngresada);
                authExitoso = true;
            } catch (authError) {
                // Fallback de migración: Si Firebase Auth falla (ej. usuario no existe aún), verificamos contra Firestore o db local
                const userDoc = await db.collection("usuarios").doc(infoSesionGlobal.codigo).get();
                let passAlmacenada = "";
                if (userDoc.exists) {
                    passAlmacenada = userDoc.data().password;
                } else if (infoSesionGlobal.codigo === "1799") {
                    passAlmacenada = "2684";
                }
                
                if (passAlmacenada === passIngresada) {
                    console.warn("Bypass temporal: Autenticado localmente (Firebase Auth no configurado).");
                    authExitoso = true;
                } else {
                    throw authError;
                }
            }
            
            if (authExitoso) {
                btn.classList.remove('loading');
                localStorage.setItem("operadorActivo", infoSesionGlobal.nombre);
                localStorage.setItem("codigoActivo", infoSesionGlobal.codigo); 
                window.location.href = "../SISTEMA/sistema.html";
            }
        } catch (error) {
            btn.classList.remove('loading');
            console.error("Error de acceso:", error);
            alert("Contraseña de acceso incorrecta o servicio no disponible.");
            document.getElementById('passUsuario').value = "";
            document.getElementById('passUsuario').focus();
        }
    }
}
