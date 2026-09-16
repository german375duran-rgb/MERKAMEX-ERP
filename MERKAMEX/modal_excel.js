function iniciarGrid() {
    limpiarGrid();
}

function limpiarGrid() {
    const tbody = document.getElementById('excel-grid-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    // Agregamos filas vacías para diseño inicial
    for(let r=0; r<10; r++) {
        const tr = document.createElement('tr');
        for(let i=0; i<9; i++) {
            const td = document.createElement('td');
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function manejarCargaExcel(event) {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        // Asume que los datos están en la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convierte a array de arrays
        const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        llenarGridDesdeJson(json);
    };
    reader.readAsArrayBuffer(file);
}

function llenarGridDesdeJson(rows) {
    const tbody = document.getElementById('excel-grid-body');
    tbody.innerHTML = '';
    
    // Saltarse la primera fila si es encabezado (asumiendo que tiene la palabra ARTICULO o similar)
    let startIndex = 0;
    if(rows[0] && rows[0][0] && typeof rows[0][0] === 'string' && rows[0][0].toUpperCase().includes('ART')) {
        startIndex = 1;
    }

    for (let r = startIndex; r < rows.length; r++) {
        const row = rows[r];
        if(!row || row.length === 0) continue;
        
        const tr = document.createElement('tr');
        for(let i=0; i<9; i++) {
            const td = document.createElement('td');
            td.innerText = row[i] !== undefined ? row[i] : '';
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

async function procesarExcelGrid() {
    const tbody = document.getElementById('excel-grid-body');
    const trs = tbody.querySelectorAll('tr');
    let procesadas = 0;
    let currentArticulo = "";
    
    let nuevasRutas = {}; 
    
    trs.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if(tds.length < 9) return;
        
        const art = tds[0].innerText.trim();
        if(art) currentArticulo = art; 
        
        if(!currentArticulo) return;
        
        const seq = parseInt(tds[1].innerText.trim());
        const ct = tds[2].innerText.trim();
        const cr = tds[3].innerText.trim();
        const tiempo = parseFloat(tds[6].innerText.trim()) || 0;
        
        if(isNaN(seq) || !ct || !cr) return; 
        
        if(!nuevasRutas[currentArticulo]) {
            nuevasRutas[currentArticulo] = {
                id_ruta: "RT-" + currentArticulo + "-" + Math.floor(Math.random()*1000), 
                id_articulo: currentArticulo,
                estado: "ACTIVA",
                operaciones: []
            };
        }
        
        nuevasRutas[currentArticulo].operaciones.push({
            seq: seq,
            ct: ct,
            cr: cr,
            tiempo: tiempo
        });
        procesadas++;
    });
    
    if(procesadas === 0) {
        alert("No se detectaron datos válidos. Asegúrese de que el archivo tenga las columnas correctas.");
        return;
    }
    
    // asumiendo que appDb.rutas existe en el contexto global de la aplicación
    for(let art in nuevasRutas) {
        if(typeof appDb !== 'undefined') {
            appDb.rutas = appDb.rutas.filter(r => r.id_articulo !== art);
            appDb.rutas.push(nuevasRutas[art]);
            
            if(!appDb.articulos.find(a => a.id === art)) {
                appDb.articulos.push({ id: art, nombre: "Art. " + art, desc: "Importado automáticamente", unidad: "PZA", familia: "General" });
            }
        }
    }
    
    if(typeof guardarDB === 'function') await guardarDB();
    if(typeof renderRutas === 'function') renderRutas();
    if(typeof cerrarModal === 'function') cerrarModal('modal-importacion');
    if(typeof showToast === 'function') showToast("Se cargaron " + Object.keys(nuevasRutas).length + " rutas con éxito.");
}
