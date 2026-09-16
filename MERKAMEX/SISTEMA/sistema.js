function abrirArea(area) {
    // === RUTA CORREGIDA HACIA LA SUBCARPETA ===
    if (area === 'ESTRUCTURAS') {
        window.location.href = 'ESTRUCTURAS/ESTRUCTURAS.HTML';
        return;
    }
    
    // El resto sigue igual para las otras áreas:
    const nombreArchivo = area.toLowerCase().replace(/\s+/g, '-') + '.html';
    window.location.href = nombreArchivo;
}

function irAPanelAdmin() {
    window.location.href = "PANEL ADMINISTRATIVO/PANEL DE ADMINISTRACION.HTML";
}

let operadorData = { nombre: "", codigo: "", puesto: "OPERADOR", vacaciones: 0, estado: "ACTIVO", foto: "", password: "", tipo: "OPERADOR", permisos: {modulos:{}, especiales:{}} };
let edicionTemporal = {};
let codigoEditandoActual = ""; 

document.addEventListener("DOMContentLoaded", () => {
    const nombreGuardado = localStorage.getItem("operadorActivo");
    const codigoGuardado = localStorage.getItem("codigoActivo");
    
    if(codigoGuardado) {
        operadorData = obtenerInfoCompleta(codigoGuardado, nombreGuardado);
    }
    cargarInterfazUsuario();
});

function obtenerInfoCompleta(codigoBuscado, nombreFallback) {
    const datosPersistentes = localStorage.getItem("perfil_MERKAMEX_" + codigoBuscado);
    if(datosPersistentes) {
        return JSON.parse(datosPersistentes);
    }

    let puestoInicial = "OPERADOR";
    let passInicial = "";
    let tipoInicial = "OPERADOR";
    
    if(codigoBuscado === "1799") { 
        puestoInicial = "ADMINISTRADOR"; 
        tipoInicial = "ADMINISTRADOR";
        passInicial = "2684";
    } 

    const iniciales = nombreFallback ? nombreFallback.split(" ").map(n => n[0]).join("").substring(0,2) : "OP";
    
    return {
        nombre: nombreFallback || "NUEVO OPERADOR",
        codigo: codigoBuscado,
        puesto: puestoInicial,
        vacaciones: 0,
        estado: "ACTIVO",
        password: passInicial,
        tipo: tipoInicial,
        permisos: {modulos:{}, especiales:{}},
        foto: `https://ui-avatars.com/api/?name=${iniciales}&background=D4AF37&color=050505&size=150`
    };
}

function esAdministrador() {
    return operadorData.tipo === "ADMINISTRADOR" || operadorData.puesto === "ADMINISTRADOR";
}

function cargarInterfazUsuario() {
    document.getElementById('panel-nombre').textContent = operadorData.nombre;
    document.getElementById('panel-vacaciones').textContent = operadorData.vacaciones + " DÍAS DE VACACIONES";
    document.getElementById('panel-puesto').textContent = operadorData.puesto; 
    document.getElementById('panel-codigo').textContent = operadorData.codigo;
    document.getElementById('panel-avatar').src = operadorData.foto;

    document.getElementById('btn-admin-panel').style.display = esAdministrador() ? "block" : "none";
    
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    if(btnEditarPerfil) {
        btnEditarPerfil.style.display = esAdministrador() ? "flex" : "none";
    }

    actualizarVistaPerfil(operadorData);
}

function actualizarVistaPerfil(datosMostrados) {
    document.getElementById('view-nombre').textContent = datosMostrados.nombre;
    document.getElementById('view-codigo').textContent = datosMostrados.codigo;
    document.getElementById('view-puesto').textContent = datosMostrados.puesto;
    document.getElementById('view-vacaciones').textContent = datosMostrados.vacaciones + (datosMostrados.vacaciones == 1 ? " DÍA" : " DÍAS");
    document.getElementById('view-avatar').src = datosMostrados.foto;
    
    const statusBadge = document.getElementById('view-estado');
    statusBadge.textContent = datosMostrados.estado;
    statusBadge.className = 'status-badge ' + datosMostrados.estado.toLowerCase();
}

const modal = document.getElementById('profile-modal');
        function cerrarSesion() {
    if(confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem("operadorActivo");
        localStorage.removeItem("codigoActivo");
        window.location.href = "../index.html";
    }
}

function abrirModal() { modal.classList.add('active'); cancelarEdicion(); }
function cerrarModal() { modal.classList.remove('active'); }
modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

function activarEdicion(targetCodigo = operadorData.codigo, datosExtra = null) {
    codigoEditandoActual = targetCodigo;
    document.getElementById('modal-main-title').textContent = "EDITAR OPERADOR";
    edicionTemporal = datosExtra ? JSON.parse(JSON.stringify(datosExtra)) : JSON.parse(JSON.stringify(operadorData));
    
    document.getElementById('input-codigo').disabled = true; 
    document.getElementById('input-codigo').style.opacity = "0.7";
    document.getElementById('input-codigo').style.cursor = "not-allowed";

    const inputEstado = document.getElementById('input-estado');
    const inputPuesto = document.getElementById('input-puesto');
    const inputVacaciones = document.getElementById('input-vacaciones');

    if (!esAdministrador()) {
        inputEstado.disabled = true; inputPuesto.disabled = true; inputVacaciones.disabled = true;
        inputEstado.style.opacity = "0.7"; inputPuesto.style.opacity = "0.7"; inputVacaciones.style.opacity = "0.7";
    } else {
        inputEstado.disabled = false; inputPuesto.disabled = false; inputVacaciones.disabled = false;
        inputEstado.style.opacity = "1"; inputPuesto.style.opacity = "1"; inputVacaciones.style.opacity = "1";
    }
    
    document.getElementById('input-nombre').value = edicionTemporal.nombre;
    document.getElementById('input-codigo').value = edicionTemporal.codigo;
    document.getElementById('input-estado').value = edicionTemporal.estado;
    document.getElementById('input-puesto').value = edicionTemporal.puesto;
    document.getElementById('input-vacaciones').value = edicionTemporal.vacaciones;
    document.getElementById('input-password').value = edicionTemporal.password || "";
    document.getElementById('edit-avatar').src = edicionTemporal.foto;

    if (edicionTemporal.tipo === "ADMINISTRADOR" || edicionTemporal.tipo === "ENCARGADO") {
        document.getElementById('group-edit-password').style.display = "block";
    } else {
        document.getElementById('group-edit-password').style.display = "none";
    }

    document.getElementById('view-mode').style.display = 'none';
    document.getElementById('edit-mode').style.display = 'flex';
}

function cancelarEdicion() {
    document.getElementById('edit-mode').style.display = 'none';
    document.getElementById('view-mode').style.display = 'flex';
    document.getElementById('modal-main-title').textContent = "PERFIL DEL OPERADOR";
    edicionTemporal = {}; 
    codigoEditandoActual = "";
    cargarInterfazUsuario(); 
}

function guardarCambios() {
    const nombreForm = document.getElementById('input-nombre').value.trim();
    const codigoForm = document.getElementById('input-codigo').value.trim();
    const vacacionesForm = document.getElementById('input-vacaciones').value;
    const puestoForm = document.getElementById('input-puesto').value;
    
    if(!nombreForm || !codigoForm) {
        alert("El nombre y código son obligatorios."); return;
    }

    let passA_Guardar = edicionTemporal.password;
    if (edicionTemporal.tipo === "ADMINISTRADOR" || edicionTemporal.tipo === "ENCARGADO") {
        passA_Guardar = document.getElementById('input-password').value.trim();
        if (!passA_Guardar) {
            alert("Es OBLIGATORIO establecer una contraseña para mantener tu nivel de acceso."); return;
        }
    } else {
        passA_Guardar = "";
    }

    const datosActualizados = {
        nombre: nombreForm,
        codigo: codigoForm,
        estado: document.getElementById('input-estado').value,
        puesto: puestoForm,
        vacaciones: parseInt(vacacionesForm) || 0,
        password: passA_Guardar,
        foto: document.getElementById('edit-avatar').src,
        tipo: edicionTemporal.tipo || "OPERADOR", 
        permisos: edicionTemporal.permisos || { modulos: {}, especiales: {} } 
    };

    // Guardar localmente
    localStorage.setItem("perfil_MERKAMEX_" + codigoForm, JSON.stringify(datosActualizados));

    if(codigoForm === operadorData.codigo) {
        operadorData = datosActualizados;
        localStorage.setItem("operadorActivo", operadorData.nombre); 
    }

    cancelarEdicion();
    mostrarNotificacion();
}

function cambiarFotografia(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('edit-avatar').src = e.target.result; }
        reader.readAsDataURL(file);
    }
}

function mostrarNotificacion() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

/* -----------------------------------------
   Animación del Fondo Canvas
   ----------------------------------------- */
const canvas = document.getElementById('gold-network');
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
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, radius: Math.random() * 1.5 + 0.5 
        });
    }
}

function animateCanvas() {
    requestAnimationFrame(animateCanvas);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
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
            if (distance < 130) {
                ctx.beginPath(); const opacity = (1 - (distance / 130)) * 0.3;
                ctx.strokeStyle = `rgba(212, 175, 55, ${opacity})`; ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
            }
        }
    }
}
initCanvas(); animateCanvas(); window.addEventListener('resize', initCanvas);
