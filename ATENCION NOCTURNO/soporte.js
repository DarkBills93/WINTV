const API_URL = "https://sheetdb.io/api/v1/rqnh53f674hz4";

let clientesNocturnos = [];
let historialNocturno = [];
let panelAbierto = "";

// 1. SISTEMA DE SINCRONIZACIÓN CON LA NUBE (CADA 5 SEGUNDOS)
setInterval(() => {
    if (panelAbierto !== "") {
        sincronizarConNube();
    }
}, 5000);

async function sincronizarConNube() {
    try {
        const response = await fetch(API_URL);
        const datos = await response.json();

        // Clasificamos los datos según la columna 'estado' de tu Google Sheet
        clientesNocturnos = datos.filter(d => d.estado === "pendiente");
        historialNocturno = datos.filter(d => d.estado === "atendido");

        if (panelAbierto === "admin") {
            actualizarMonitorAdmin();
        } else if (panelAbierto === "tecnico") {
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
    } catch (error) {
        console.error("Error sincronizando con Soporte JC Cloud:", error);
    }
}

// 2. CONTROL DE ACCESO
function checkLogin() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        panelAbierto = "admin";
        sincronizarConNube();
    } else { alert("Contraseña incorrecta"); }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    panelAbierto = "tecnico";
    sincronizarConNube();
}

// 3. LÓGICA ADMINISTRADOR (ESCRITURA EN GOOGLE SHEETS)
async function agregarCliente() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim();
    
    if(nombre) {
        const nuevoRegistro = {
            fecha: new Date().toLocaleDateString(),
            tecnico: "Pendiente",
            usuario: nombre,
            reporte: "",
            estado: "pendiente"
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [nuevoRegistro] })
            });
            input.value = "";
            sincronizarConNube();
        } catch (error) {
            alert("Error al conectar con la base de datos.");
        }
    }
}

function actualizarMonitorAdmin() {
    const lista = document.getElementById('monitor-lista');
    if (!lista) return;
    lista.innerHTML = "";
    clientesNocturnos.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = "monitor-item";
        item.innerHTML = `
            <span><b>${c.fecha}</b> - 👤 ${c.usuario}</span>
            <div>
                <span style='color:#ff4d4d;'>❌ Pendiente</span>
                <button onclick="eliminarFila('${c.usuario}')" style="background:none; border:none; cursor:pointer; font-size:1.2em; margin-left:10px;">🗑️</button>
            </div>`;
        lista.appendChild(item);
    });
}

// 4. LÓGICA TÉCNICO (ACTUALIZACIÓN DE FILA)
function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    if (!contenedor) return;
    contenedor.innerHTML = "";
    
    if(clientesNocturnos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5; color:#00c6ff;'>No hay usuarios nuevos por atender.</p>";
        return;
    }

    clientesNocturnos.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3>👤 ${c.usuario} <small style="font-size:0.6em; opacity:0.5;">(Ingreso: ${c.fecha})</small></h3>
            <textarea id="texto-${i}" placeholder="Escriba la solución brindada..."></textarea>
        `;
        contenedor.appendChild(div);
    });
}

async function guardarTodoElSoporte() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnico) { alert("Por favor, ingrese su nombre de técnico."); return; }

    let huboCambio = false;
    for (let i = 0; i < clientesNocturnos.length; i++) {
        const textoArea = document.getElementById(`texto-${i}`);
        if(textoArea && textoArea.value.trim() !== "") {
            try {
                await fetch(`${API_URL}/usuario/${clientesNocturnos[i].usuario}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            tecnico: tecnico,
                            reporte: textoArea.value.trim(),
                            estado: "atendido",
                            fecha: new Date().toLocaleString()
                        }
                    })
                });
                huboCambio = true;
            } catch (error) { console.error("Error al guardar fila:", error); }
        }
    }

    if(huboCambio) {
        alert("✅ Sincronizado en todos los dispositivos de Soporte JC.");
        sincronizarConNube();
    } else {
        alert("No hay información nueva para guardar.");
    }
}

// 5. HISTORIAL Y PDF
function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    [...historialNocturno].reverse().forEach((log) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.style.borderLeftColor = "#28a745";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <small style="color:#aaa;">📅 ${log.fecha}</small><br>
                    <b>Técnico:</b> <span style="color:#00c6ff;">${log.tecnico}</span> | 
                    <b>Cliente:</b> <span style="color:#00c6ff;">${log.usuario}</span><br>
                    <p style="margin-top:10px; font-style:italic; color:#eee;">"${log.reporte}"</p>
                </div>
                <button onclick="eliminarFila('${log.usuario}')" style="background:none; border:none; cursor:pointer; font-size:1.3em; color:#ff4d4d;">🗑️</button>
            </div>`;
        contenedor.appendChild(div);
    });
}

async function eliminarFila(usuario) {
    if(confirm(`¿Deseas eliminar permanentemente a ${usuario} de la nube?`)) {
        try {
            await fetch(`${API_URL}/usuario/${usuario}`, { method: 'DELETE' });
            sincronizarConNube();
        } catch (error) { alert("Error al eliminar."); }
    }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 198, 255);
    doc.text("INFORME DE SOPORTE NOCTURNO - WNTV", 105, 20, { align: 'center' });
    
    const filas = historialNocturno.map(h => [h.fecha, h.tecnico, h.usuario, h.reporte]);
    doc.autoTable({
        startY: 35,
        head: [['Fecha/Hora', 'Técnico', 'Cliente', 'Fundamento del Soporte']],
        body: filas,
        theme: 'striped'
    });
    doc.save(`Reporte_JC_${new Date().toLocaleDateString()}.pdf`);
}
