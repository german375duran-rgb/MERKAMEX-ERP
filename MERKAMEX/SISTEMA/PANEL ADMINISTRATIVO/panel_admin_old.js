
    <script>
        /* =========================================
           BASE DE DATOS Y ESTADO GLOBAL
           ========================================= */
        let usuariosApp = [];
        let usuarioEditandoActual = "NUEVO";

        // Módulos del ERP para los permisos
        const modulosERP = ["DASHBOARD", "ESTRUCTURAS", "PINTURA", "PAILERIA", "EXIBIDORES", "MECANIZACIONES", "CORTE LASER", "PLASTICO", "TORNOS", "ALAMBRE", "INVENTARIO", "VENTAS", "REPORTES"];
        const permisosEsp = ["VER", "CREAR", "EDITAR", "ELIMINAR", "AUTORIZAR"];

        /* -----------------------------------------
           INICIALIZACIÓN
           ----------------------------------------- */
        document.addEventListener("DOMContentLoaded", () => {
            // Identificar al Admin que abrió el panel
            const nombreAdmin = localStorage.getItem("operadorActivo") || "ADMINISTRADOR";
            document.getElementById('admin-name').textContent = nombreAdmin;
            const ini = nombreAdmin.split(" ").map(n=>n[0]).join("").substring(0,2);
            document.getElementById('admin-avatar').src = `https://ui-avatars.com/api/?name=${ini}&background=D4AF37&color=050505`;

            cargarTodosLosUsuarios();
            renderizarInterruptoresPermisos();
        });

        /* -----------------------------------------
           LÓGICA DE DATOS (FUSIONAR BD FIJA + LOCAL)
           ----------------------------------------- */
        function cargarTodosLosUsuarios() {
            usuariosApp = [];
            let dbFija = (typeof baseOperadores !== 'undefined') ? baseOperadores : {};
            let dbNuevos = JSON.parse(localStorage.getItem("MERKAMEX_nuevos_operadores")) || {};
            let todosLosCodigos = { ...dbFija, ...dbNuevos };

            // Validar si el código maestro 1799 existe
            if(!todosLosCodigos["1799"]) todosLosCodigos["1799"] = "ARQ. JUAN GERMÁN SÁNCHEZ DURÁN";

            for (let cod in todosLosCodigos) {
                let nombreFallback = todosLosCodigos[cod];
                let dataLocal = localStorage.getItem("perfil_MERKAMEX_" + cod);
                
                if (dataLocal) {
                    let parsedUser = JSON.parse(dataLocal);
                    // PARCHE: Si el usuario guardado no tiene "tipo", se lo asignamos por defecto para evitar "undefined"
                    if (!parsedUser.tipo) parsedUser.tipo = (cod === "1799") ? "ADMINISTRADOR" : "OPERADOR";
                    usuariosApp.push(parsedUser);
                } else {
                    // Generar perfil base si nunca ha entrado
                    let esAdmin = (cod === "1799");
                    usuariosApp.push({
                        codigo: cod,
                        nombre: nombreFallback,
                        tipo: esAdmin ? "ADMINISTRADOR" : "OPERADOR",
                        puesto: esAdmin ? "ADMINISTRADOR" : "OPERADOR",
                        estado: "ACTIVO",
                        vacaciones: 0,
                        password: esAdmin ? "2684" : "",
                        permisos: { modulos: {}, especiales: {} },
                        foto: `https://ui-avatars.com/api/?name=${nombreFallback.substring(0,2)}&background=D4AF37&color=050505&size=150`
                    });
                }
            }
            mostrarUsuarios();
            llenarSelectsSecundarios();
        }

        /* -----------------------------------------
           NAVEGACIÓN Y PANELES
           ----------------------------------------- */
        function showSection(sectionId, btnElement) {
            document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            btnElement.classList.add('active');

            if (sectionId === 'sec-usuarios') { document.getElementById('page-title').textContent = "USUARIOS REGISTRADOS"; mostrarUsuarios(); }
            if (sectionId === 'sec-nuevo') { 
                document.getElementById('page-title').textContent = "GESTOR DE USUARIOS";
                prepararFormularioCreacion(); 
            }
            if (sectionId === 'sec-vacaciones') { document.getElementById('page-title').textContent = "ADMINISTRACIÓN DE VACACIONES"; }
            if (sectionId === 'sec-permisos') { document.getElementById('page-title').textContent = "CONFIGURACIÓN DE ACCESOS"; }
        }

        function cerrarPanelAdmin() {
            window.location.href = "../sistema.html";
        }

        function mostrarToast(msg) {
            const t = document.getElementById('admin-toast');
            document.getElementById('admin-toast-msg').textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        /* -----------------------------------------
           SECCIÓN: USUARIOS REGISTRADOS
           ----------------------------------------- */
        function mostrarUsuarios() {
            const container = document.getElementById('users-container');
            const search = document.getElementById('search-user').value.toLowerCase();
            const filterType = document.getElementById('filter-type').value;
            const filterStatus = document.getElementById('filter-status').value;

            container.innerHTML = "";

            let filtrados = usuariosApp.filter(u => {
                let matchSearch = u.nombre.toLowerCase().includes(search) || u.codigo.toLowerCase().includes(search);
                let matchType = (filterType === "TODOS") || ((u.tipo || 'OPERADOR') === filterType);
                let matchStatus = (filterStatus === "TODOS") || (u.estado === filterStatus);
                return matchSearch && matchType && matchStatus;
            });

            filtrados.forEach(u => {
                let card = document.createElement('div');
                card.className = "user-card";
                
                // VERIFICAMOS SI EL USUARIO ES ADMIN O ENCARGADO PARA MOSTRAR EL BOTÓN
                let btnPermisosHTML = "";
                let tipoVisual = u.tipo || 'OPERADOR';
                
                if (tipoVisual === 'ADMINISTRADOR' || tipoVisual === 'ENCARGADO') {
                    btnPermisosHTML = `<button class="btn btn-outline btn-sm" onclick="irAPermisos('${u.codigo}')">🔐 PERMISOS</button>`;
                }

                card.innerHTML = `
                    <span class="status-badge ${u.estado.toLowerCase()}">${u.estado}</span>
                    <div class="card-header">
                        <img src="${u.foto}" class="card-avatar">
                        <div class="card-info">
                            <div class="card-name">${u.nombre}</div>
                            <div class="card-code">${u.codigo} | ${tipoVisual}</div>
                            <div class="card-role">${u.puesto}</div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-outline btn-sm" onclick="editarUsuarioDesdeLista('${u.codigo}')">✏️ EDITAR</button>
                        ${btnPermisosHTML}
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function filtrarUsuarios() { mostrarUsuarios(); }

        /* -----------------------------------------
           SECCIÓN: FORMULARIO ALTA/EDICIÓN
           ----------------------------------------- */
        function prepararFormularioCreacion() {
            usuarioEditandoActual = "NUEVO";
            document.getElementById('form-main-title').textContent = "DAR DE ALTA NUEVO USUARIO";
            document.getElementById('btn-eliminar-usuario').style.display = 'none'; // Escondemos botón eliminar en perfil nuevo
            
            document.getElementById('f-nombre').value = "";
            document.getElementById('f-codigo').value = "";
            document.getElementById('f-codigo').disabled = false;
            document.getElementById('f-correo').value = "";
            document.getElementById('f-vacaciones').value = "0";
            document.getElementById('f-tipo').value = "OPERADOR";
            document.getElementById('f-estado').value = "ACTIVO";
            document.getElementById('f-puesto').value = "OPERADOR";
            document.getElementById('f-pass').value = "";
            checkTipoUsuario();
        }

        function editarUsuarioDesdeLista(codigo) {
            let u = usuariosApp.find(user => user.codigo === codigo);
            if(!u) return;
            
            // Forzamos el click virtual en la pestaña de Nuevo/Editar
            document.querySelectorAll('.nav-item')[1].click();
            
            usuarioEditandoActual = codigo;
            document.getElementById('form-main-title').textContent = "EDITAR USUARIO EXISTENTE";
            document.getElementById('btn-eliminar-usuario').style.display = 'block'; // Mostramos botón eliminar
            
            document.getElementById('f-nombre').value = u.nombre;
            document.getElementById('f-codigo').value = u.codigo;
            document.getElementById('f-codigo').disabled = true; // No cambiar código existente
            document.getElementById('f-vacaciones').value = u.vacaciones;
            document.getElementById('f-tipo').value = u.tipo || "OPERADOR";
            document.getElementById('f-estado').value = u.estado;
            document.getElementById('f-puesto').value = u.puesto;
            document.getElementById('f-pass').value = u.password || "";
            checkTipoUsuario();
        }

        function checkTipoUsuario() {
            let t = document.getElementById('f-tipo').value;
            document.getElementById('warn-admin').style.display = (t === "ADMINISTRADOR") ? "flex" : "none";
            document.getElementById('warn-encargado').style.display = (t === "ENCARGADO") ? "flex" : "none";
            document.getElementById('f-group-pass').style.display = (t === "ADMINISTRADOR" || t === "ENCARGADO") ? "block" : "none";
        }

        function guardarUsuario() {
            const nom = document.getElementById('f-nombre').value.trim();
            const cod = document.getElementById('f-codigo').value.trim();
            const tipo = document.getElementById('f-tipo').value;
            
            if(!nom || !cod) { alert("Nombre y código obligatorios."); return; }

            let pass = document.getElementById('f-pass').value;
            if((tipo === "ADMINISTRADOR" || tipo === "ENCARGADO") && !pass) {
                alert("Debes asignar una contraseña para niveles superiores."); return;
            }

            let uIndex = usuariosApp.findIndex(x => x.codigo === cod);
            let userObj = (uIndex >= 0) ? usuariosApp[uIndex] : { permisos: { modulos: {}, especiales: {} } };

            userObj.nombre = nom;
            userObj.codigo = cod;
            userObj.tipo = tipo;
            userObj.puesto = document.getElementById('f-puesto').value;
            userObj.estado = document.getElementById('f-estado').value;
            userObj.vacaciones = parseInt(document.getElementById('f-vacaciones').value) || 0;
            userObj.password = pass;
            if(!userObj.foto) userObj.foto = `https://ui-avatars.com/api/?name=${nom.substring(0,2)}&background=D4AF37&color=050505&size=150`;

            // Guardar localmente
            localStorage.setItem("perfil_MERKAMEX_" + cod, JSON.stringify(userObj));

            if(usuarioEditandoActual === "NUEVO") {
                let dbNuevos = JSON.parse(localStorage.getItem("MERKAMEX_nuevos_operadores")) || {};
                dbNuevos[cod] = nom;
                localStorage.setItem("MERKAMEX_nuevos_operadores", JSON.stringify(dbNuevos));
            }

            mostrarToast("USUARIO GUARDADO CORRECTAMENTE");
            cargarTodosLosUsuarios(); // Refrescar listas
            document.querySelectorAll('.nav-item')[0].click(); // Volver a lista
        }

        // FUNCION NUEVA: ELIMINAR USUARIO
        function eliminarUsuario() {
            if(usuarioEditandoActual === "NUEVO") return;
            if(usuarioEditandoActual === "1799") { 
                alert("Por seguridad del sistema, no puedes eliminar al administrador maestro."); 
                return; 
            }

            if(confirm("⚠️ ¿Estás seguro de que deseas eliminar a este usuario permanentemente? Esta acción no se puede deshacer.")) {
                
                // Borrar perfil individual
                localStorage.removeItem("perfil_MERKAMEX_" + usuarioEditandoActual);
                
                // Borrarlo de la lista de operadores "nuevos" creados si es que estaba ahí
                let dbNuevos = JSON.parse(localStorage.getItem("MERKAMEX_nuevos_operadores")) || {};
                if(dbNuevos[usuarioEditandoActual]) {
                    delete dbNuevos[usuarioEditandoActual];
                    localStorage.setItem("MERKAMEX_nuevos_operadores", JSON.stringify(dbNuevos));
                }
                
                mostrarToast("USUARIO ELIMINADO CORRECTAMENTE");
                cargarTodosLosUsuarios();
                document.querySelectorAll('.nav-item')[0].click(); // Regresa a usuarios registrados
            }
        }


        /* -----------------------------------------
           SECCIÓN: VACACIONES CON BUSCADOR INTELIGENTE
           ----------------------------------------- */
        function llenarSelectsSecundarios() {
            const selPerm = document.getElementById('perm-operador');
            selPerm.innerHTML = '<option value="" disabled selected>SELECCIONAR USUARIO...</option>';
            
            usuariosApp.forEach(u => {
                let opt = `<option value="${u.codigo}">[${u.codigo}] ${u.nombre}</option>`;
                if(u.tipo === "ENCARGADO" || u.tipo === "ADMINISTRADOR") {
                    selPerm.innerHTML += opt;
                }
            });
        }

        // FILTRO DE BUSQUEDA EN TIEMPO REAL
        function filtrarAutocompleteVacaciones() {
            const inputVal = document.getElementById('vac-operador-input').value.toLowerCase();
            const lista = document.getElementById('vac-autocomplete-list');
            lista.innerHTML = '';
            
            if(!inputVal) { lista.style.display = 'none'; return; }
            
            let filtrados = usuariosApp.filter(u => 
                u.nombre.toLowerCase().includes(inputVal) || u.codigo.toLowerCase().includes(inputVal)
            );

            if(filtrados.length > 0) {
                lista.style.display = 'block';
                filtrados.forEach(u => {
                    let div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `[${u.codigo}] ${u.nombre}`;
                    div.onclick = function() {
                        document.getElementById('vac-operador-input').value = `[${u.codigo}] ${u.nombre}`;
                        document.getElementById('vac-operador-hidden').value = u.codigo;
                        lista.style.display = 'none';
                        cargarInfoVacaciones();
                    };
                    lista.appendChild(div);
                });
            } else {
                lista.style.display = 'none';
            }
        }

        // Si se borra el input, reseteamos la info
        document.getElementById('vac-operador-input').addEventListener('input', function() {
            if(this.value.trim() === '') {
                document.getElementById('vac-operador-hidden').value = '';
                document.getElementById('vac-disponibles').textContent = '0';
            }
        });

        function cargarInfoVacaciones() {
            let cod = document.getElementById('vac-operador-hidden').value;
            let u = usuariosApp.find(x => x.codigo === cod);
            document.getElementById('vac-disponibles').textContent = u ? u.vacaciones : 0;
        }

        function registrarVacaciones() {
            let cod = document.getElementById('vac-operador-hidden').value;
            let fIni = document.getElementById('vac-inicio').value;
            let fFin = document.getElementById('vac-fin').value;

            if(!cod) { alert("Por favor, selecciona un operador de la lista."); return;}
            if(!fIni || !fFin) { alert("Llena las fechas de inicio y finalización."); return; }

            let d1 = new Date(fIni); let d2 = new Date(fFin);
            let diffTime = Math.abs(d2 - d1);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            let u = usuariosApp.find(x => x.codigo === cod);
            if (u.vacaciones < diffDays) {
                alert(`El usuario solo tiene ${u.vacaciones} días. Este periodo solicita ${diffDays} días.`); return;
            }

            u.vacaciones -= diffDays;
            localStorage.setItem("perfil_MERKAMEX_" + cod, JSON.stringify(u));
            cargarInfoVacaciones();
            mostrarToast(`PERIODO REGISTRADO. SE DESCONTARON ${diffDays} DÍAS.`);
            
            document.getElementById('vac-inicio').value = ""; document.getElementById('vac-fin').value = "";
        }

        /* -----------------------------------------
           SECCIÓN: PERMISOS DE ACCESO
           ----------------------------------------- */
        function irAPermisos(codigo) {
            let u = usuariosApp.find(x => x.codigo === codigo);
            if(u.tipo === "OPERADOR" || !u.tipo) { alert("Los operadores normales no tienen módulo de permisos."); return; }
            document.querySelectorAll('.nav-item')[3].click();
            document.getElementById('perm-operador').value = codigo;
            cargarPermisosUsuario();
        }

        function renderizarInterruptoresPermisos() {
            const modCont = document.getElementById('modules-container');
            const espCont = document.getElementById('special-container');
            modCont.innerHTML = ""; espCont.innerHTML = "";

            modulosERP.forEach(mod => {
                modCont.innerHTML += `
                    <div class="perm-card">
                        <span class="perm-name">${mod}</span>
                        <label class="switch"><input type="checkbox" id="perm-mod-${mod}"><span class="slider"></span></label>
                    </div>`;
            });

            permisosEsp.forEach(esp => {
                espCont.innerHTML += `
                    <div class="perm-card">
                        <span class="perm-name">${esp}</span>
                        <label class="switch"><input type="checkbox" id="perm-esp-${esp}"><span class="slider"></span></label>
                    </div>`;
            });
        }

        function cargarPermisosUsuario() {
            let cod = document.getElementById('perm-operador').value;
            let u = usuariosApp.find(x => x.codigo === cod);
            if(!u || !u.permisos) return;

            modulosERP.forEach(mod => {
                let chk = document.getElementById(`perm-mod-${mod}`);
                chk.checked = u.permisos.modulos ? !!u.permisos.modulos[mod] : false;
            });
            permisosEsp.forEach(esp => {
                let chk = document.getElementById(`perm-esp-${esp}`);
                chk.checked = u.permisos.especiales ? !!u.permisos.especiales[esp] : false;
            });
        }

        function guardarPermisos() {
            let cod = document.getElementById('perm-operador').value;
            if(!cod) { alert("Selecciona un usuario primero."); return; }
            
            let u = usuariosApp.find(x => x.codigo === cod);
            if(!u.permisos) u.permisos = { modulos: {}, especiales: {} };

            modulosERP.forEach(mod => { u.permisos.modulos[mod] = document.getElementById(`perm-mod-${mod}`).checked; });
            permisosEsp.forEach(esp => { u.permisos.especiales[esp] = document.getElementById(`perm-esp-${esp}`).checked; });

            localStorage.setItem("perfil_MERKAMEX_" + cod, JSON.stringify(u));
            mostrarToast("PERMISOS ACTUALIZADOS CORRECTAMENTE");
        }

        /* -----------------------------------------
           ANIMACIÓN CANVAS (Fondo)
           ----------------------------------------- */
        const canvas = document.getElementById('gold-network');
        const ctx = canvas.getContext('2d');
        let width, height, particles;

        function initCanvas() {
            width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight;
            particles = []; const pCount = width < 768 ? 40 : 90;
            for (let i = 0; i < pCount; i++) {
                particles.push({
                    x: Math.random() * width, y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, radius: Math.random() * 1.5 + 0.5 
                });
            }
        }

        function animateCanvas() {
            requestAnimationFrame(animateCanvas);
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            });
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        ctx.beginPath(); ctx.strokeStyle = `rgba(212, 175, 55, ${(1 - distance / 150) * 0.2})`; 
                        ctx.lineWidth = 1; ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
                    }
                }
