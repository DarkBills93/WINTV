let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];
let historialNocturno = JSON.parse(localStorage.getItem('historialNocturno')) || [];
let ultimaFechaRef = localStorage.getItem('fechaLimpiezaNocturna') || "";
let panelAbierto = ""; // Variable para saber qué panel refrescar

// LIMPIEZA AUTOMÁTICA DIARIA SELECTIVA
function verificarLimpiezaDiaria() {
    const hoy = new Date().toLocaleDateString();
    if (ultimaFechaRef !== hoy) {
        clientesNocturnos = [];
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        localStorage.setItem('fechaLimpiezaNocturna', hoy);
        ultimaFechaRef = hoy;
    }
}
verificarLimpiezaDiaria();

// --- SISTEMA DE SINCRONIZACIÓN AUTOMÁTICA (CADA 5 SEGUNDOS) ---
setInterval(() => {
    // Solo refrescamos si hay un panel activo para no consumir recursos innecesarios
    if (panelAbierto !== "") {
        clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];
        historialNocturno = JSON.parse(localStorage.getItem('historialNocturno')) || [];

        if (panelAbierto === "admin") {
            actualizarMonitorAdmin();
        } else if (panelAbierto === "tecnico") {
            // Guardamos el contenido actual de los textareas para que el refresco no borre lo que el técnico está escribiendo
            const borradores = {};
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el) borradores[i] = el.value;
            });

            renderizarClientesTecnico();
            mostrarHistorial();

            // Restauramos lo que el técnico estaba escribiendo
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el && borradores[i] !== undefined) el.value = borradores[i];
            });
        }
    }
}, 5000); // 5000ms = 5 segundos

// 1. CONTROL DE ACCESO
function checkLogin() {
    if(document.getElementById('pass-admin').value === "admin123") {
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
        clientesNocturnos.push({ nombre: input.value.trim(), concepto: "", guardado: false });
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
        const icono = c.guardado ? "✅" : "❌";
        item.innerHTML = `
            <span>👤 ${c.nombre}</span>
            <div>
                <span style="margin-right: 15px;">${icono}</span>
                <button onclick="eliminarPendiente(${i})" class="btn-delete" style="display:inline;">🗑️</button>
            </div>`;
        lista.appendChild(item);
    });
}

function eliminarPendiente(index) {
    if(confirm("¿Eliminar este usuario de la lista?")) {
        clientesNocturnos.splice(index, 1);
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        actualizarMonitorAdmin();
    }
}

// 3. LÓGICA TÉCNICO
function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";
    if(clientesNocturnos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5;'>No hay usuarios pendientes.</p>";
        return;
    }
    clientesNocturnos.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3>👤 ${c.nombre} ${c.guardado ? '<small style="color:#00ff88;">(Guardado ✅)</small>' : ''}</h3>
            <textarea id="texto-${i}" placeholder="Redacte el soporte...">${c.concepto}</textarea>
        `;
        contenedor.appendChild(div);
    });
}

function guardarTodoElSoporte() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnico) { alert("Ingrese su nombre de técnico."); return; }

    let huboCambio = false;
    clientesNocturnos.forEach((c, i) => {
        const textoArea = document.getElementById(`texto-${i}`);
        if(textoArea && textoArea.value.trim() !== "" && !c.guardado) {
            historialNocturno.push({
                tecnico: tecnico,
                usuario: c.nombre,
                reporte: textoArea.value.trim(),
                fecha: new Date().toLocaleString()
            });
            clientesNocturnos[i].guardado = true;
            textoArea.value = ""; 
            huboCambio = true;
        }
    });

    if(huboCambio) {
        localStorage.setItem('historialNocturno', JSON.stringify(historialNocturno));
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        alert("✅ Registros guardados correctamente.");
        renderizarClientesTecnico();
        mostrarHistorial();
    }
}

function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    if (!contenedor) return;
    contenedor.innerHTML = "";
    [...historialNocturno].reverse().forEach((log, i) => {
        const realIndex = historialNocturno.length - 1 - i;
        const div = document.createElement('div');
        div.className = "soporte-card historial-item";
        div.innerHTML = `
            <div style="font-weight:bold; margin-bottom:10px;">📅 ${log.fecha}</div>
            <div style="font-size:0.95em; color:#ccc; line-height:1.4;">
                <b>Atendido por:</b> <span style="color:#00c6ff;">${log.tecnico}</span><br>
                <b>Usuario:</b> ${log.usuario}<br>
                <b>Reporte:</b> ${log.reporte}
            </div>
            <button onclick="eliminarHistorial(${realIndex})" class="btn-delete" style="margin-top:15px;">
                🗑️ Eliminar
            </button>
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

function logout() { window.location.href = "../index.html"; }
