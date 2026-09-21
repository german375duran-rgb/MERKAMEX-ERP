function iniciarGrid() {
    const tbody = document.getElementById('excel-grid-body');
    if(!tbody) return;
    limpiarGrid();
    
    tbody.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        const rows = text.split(/\r?\n/);
        
        tbody.innerHTML = '';
        
        rows.forEach(row => {
            if(!row.trim()) return;
            const cols = row.split('\t');
            const tr = document.createElement('tr');
            for(let i=0; i<9; i++) {
                const td = document.createElement('td');
                td.contentEditable = "true";
                td.innerText = cols[i] !== undefined ? cols[i] : '';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
    });
}

function limpiarGrid() {
    const tbody = document.getElementById('excel-grid-body');
    tbody.innerHTML = '';
    for(let r=0; r<15; r++) {
        const tr = document.createElement('tr');
        for(let i=0; i<9; i++) {
            const td = document.createElement('td');
            td.contentEditable = "true";
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
        alert("No se detectaron datos válidos. Asegúrese de pegar las columnas correctamente.");
        return;
    }
    
    for(let art in nuevasRutas) {
        appDb.rutas = appDb.rutas.filter(r => r.id_articulo !== art);
        appDb.rutas.push(nuevasRutas[art]);
        
        if(!appDb.articulos.find(a => a.id === art)) {
            appDb.articulos.push({ id: art, nombre: "Art. " + art, desc: "Importado automáticamente", unidad: "PZA", familia: "General" });
        }
    }
    
    await guardarDB();
    renderRutas();
    cerrarModal('modal-importacion');
    showToast("Se cargaron " + Object.keys(nuevasRutas).length + " rutas con éxito.");
}
