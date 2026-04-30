let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];
let historialNocturno = JSON.parse(localStorage.getItem('historialNocturno')) || [];
let panelAbierto = "";

// SINCRONIZACIÓN CADA 5 SEGUNDOS
setInterval(() => {
    if (panelAbierto !== "") {
        clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];
        historialNocturno = JSON.parse(localStorage.getItem('historialNocturno')) || [];
        
        if (panelAbierto === "admin") actualizarMonitorAdmin();
        if (panelAbierto === "tecnico") {
            const borradores = {};
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el) borradores[i] = el.value;
            });
            renderizarClientesTecnico();
            mostrarHistorial();
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el && borradores[i] !== undefined) el.value = borradores[i];
            });
        }
    }
}, 5000);

// 1. CONTROL DE ACCESO
function checkLogin() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        panelAbierto = "admin";
        actualizarMonitorAdmin();
    } else { alert("Contraseña incorrecta"); }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    panelAbierto = "tecnico";
    renderizarClientesTecnico();
    mostrarHistorial();
}

// 2. LÓGICA ADMINISTRADOR
function agregarCliente() {
    const input = document.getElementById('nombre-cliente');
    if(input.value.trim()) {
        clientesNocturnos.push({ 
            nombre: input.value.trim(), 
            fechaIngreso: new Date().toLocaleDateString(),
            guardado: false 
        });
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        input.value = "";
        actualizarMonitorAdmin();
    }
}

function actualizarMonitorAdmin() {
    const lista = document.getElementById('monitor-lista');
    lista.innerHTML = "";
    clientesNocturnos.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = "monitor-item";
        const status = c.guardado ? "<span style='color:#00ff88;'>✅ Atendido</span>" : "<span style='color:#ff4d4d;'>❌ Pendiente</span>";
        item.innerHTML = `
            <span><b>${c.fechaIngreso}</b> - 👤 ${c.nombre}</span>
            <div>
                <span style="margin-right: 15px;">${status}</span>
                <button onclick="eliminarPendiente(${i})" style="background:none; border:none; cursor:pointer;">🗑️</button>
            </div>`;
        lista.appendChild(item);
    });
}

function eliminarPendiente(i) {
    if(confirm("¿Eliminar usuario?")) {
        clientesNocturnos.splice(i, 1);
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        actualizarMonitorAdmin();
    }
}

// 3. EXPORTAR PDF
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 198, 255);
    doc.text("INFORME DE SOPORTE NOCTURNO - WNTV", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleString()}`, 15, 30);
    const filas = historialNocturno.map(h => [h.fecha, h.tecnico, h.usuario, h.reporte]);
    doc.autoTable({ startY: 40, head: [['Fecha/Hora', 'Técnico', 'Cliente', 'Fundamento']], body: filas });
    doc.save(`Informe_Soporte_${new Date().toLocaleDateString()}.pdf`);
}

// 4. LÓGICA TÉCNICO
function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";
    const pendientes = clientesNocturnos.filter(c => !c.guardado);
    if(pendientes.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5;'>No hay usuarios pendientes.</p>";
        return;
    }
    clientesNocturnos.forEach((c, i) => {
        if(!c.guardado) {
            const div = document.createElement('div');
            div.className = "soporte-card";
            div.innerHTML = `<h3>👤 ${c.nombre}</h3><textarea id="texto-${i}" placeholder="Escriba la solucion brindada..."></textarea>`;
            contenedor.appendChild(div);
        }
    });
}

function guardarTodoElSoporte() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnico) { alert("Por favor, ingrese su nombre."); return; }
    let huboCambio = false;
    clientesNocturnos.forEach((c, i) => {
        const textoArea = document.getElementById(`texto-${i}`);
        if(textoArea && textoArea.value.trim() !== "") {
            historialNocturno.push({ tecnico, usuario: c.nombre, reporte: textoArea.value.trim(), fecha: new Date().toLocaleString() });
            clientesNocturnos[i].guardado = true;
            huboCambio = true;
        }
    });
    if(huboCambio) {
        localStorage.setItem('historialNocturno', JSON.stringify(historialNocturno));
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        alert("✅ Soporte guardado.");
        renderizarClientesTecnico();
        mostrarHistorial();
    }
}

// Historial con botón de Papelera funcional
function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    if (!contenedor) return;
    contenedor.innerHTML = "";
    [...historialNocturno].reverse().forEach((log, i) => {
        const realIndex = historialNocturno.length - 1 - i;
        const div = document.createElement('div');
        div.className = "soporte-card historial-item";
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <small>${log.fecha}</small><br>
                    <b>Técnico:</b> ${log.tecnico} | <b>Cliente:</b> ${log.usuario}<br>
                    <p style="margin-top:10px; font-style:italic;">"${log.reporte}"</p>
                </div>
                <button onclick="eliminarHistorial(${realIndex})" style="background:none; border:none; cursor:pointer; color:#ff4d4d; font-size:1.2em;">🗑️</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function eliminarHistorial(index) {
    if(confirm("¿Eliminar este registro del historial?")) {
        historialNocturno.splice(index, 1);
        localStorage.setItem('historialNocturno', JSON.stringify(historialNocturno));
        mostrarHistorial();
    }
}
