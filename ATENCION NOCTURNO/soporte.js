// Rutas específicas para cada pestaña de tu Google Sheet
const API_ADMIN = "https://sheetdb.io/api/v1/rqnh53f674hz4?sheet=ADMINISTRADOR";
const API_SOPORTE = "https://sheetdb.io/api/v1/rqnh53f674hz4?sheet=SOPORTE";

let clientesNocturnos = [];
let historialNocturno = [];
let panelAbierto = "";

// 1. SINCRONIZACIÓN AUTOMÁTICA (CADA 5 SEGUNDOS)
setInterval(() => {
    if (panelAbierto !== "") {
        sincronizarConNube();
    }
}, 5000);

async function sincronizarConNube() {
    try {
        // Consultamos la hoja ADMINISTRADOR para ver quién está pendiente
        const response = await fetch(API_ADMIN);
        const datos = await response.json();

        // Filtramos pendientes para el técnico y el monitor
        clientesNocturnos = datos.filter(d => d.estado === "pendiente");

        // Consultamos la hoja SOPORTE para el historial detallado
        const responseHistorial = await fetch(API_SOPORTE);
        historialNocturno = await responseHistorial.json();

        if (panelAbierto === "admin") {
            actualizarMonitorAdmin();
        } else if (panelAbierto === "tecnico") {
            // Guardamos lo que el técnico está escribiendo para que no se borre al refrescar
            const borradores = {};
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el) borradores[i] = el.value;
            });

            renderizarClientesTecnico();
            mostrarHistorial();

            // Restauramos los borradores
            clientesNocturnos.forEach((c, i) => {
                const el = document.getElementById(`texto-${i}`);
                if (el && borradores[i] !== undefined) el.value = borradores[i];
            });
        }
    } catch (error) {
        console.error("Error de sincronización:", error);
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

// 3. LÓGICA ADMINISTRADOR (Escritura inicial)
async function agregarCliente() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    
    if(nombre) {
        const nuevoRegistro = {
            fecha: new Date().toLocaleDateString(),
            tecnico: "Pendiente",
            usuario: nombre,
            reporte: "",
            estado: "pendiente"
        };

        try {
            await fetch(API_ADMIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [nuevoRegistro] })
            });
            input.value = "";
            sincronizarConNube();
        } catch (error) {
            alert("Error al registrar cliente.");
        }
    }
}

function actualizarMonitorAdmin() {
    const lista = document.getElementById('monitor-lista');
    if (!lista) return;
    lista.innerHTML = "";
    clientesNocturnos.forEach((c) => {
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

// 4. LÓGICA TÉCNICO (LA PARTE CLAVE QUE SOLICITASTE)
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
    const tecnicoNombre = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnicoNombre) { alert("Por favor, ingrese su nombre de técnico."); return; }

    let huboCambio = false;
    for (let i = 0; i < clientesNocturnos.length; i++) {
        const textoArea = document.getElementById(`texto-${i}`);
        
        if(textoArea && textoArea.value.trim() !== "") {
            const clienteNombre = clientesNocturnos[i].usuario;
            const solucion = textoArea.value.trim();

            try {
                // A. ACTUALIZAMOS ADMINISTRADOR: Cambiamos estado y reporte en la fila existente
                await fetch(`${API_ADMIN}/usuario/${clienteNombre}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            tecnico: tecnicoNombre,
                            reporte: solucion,
                            estado: "atendido"
                        }
                    })
                });

                // B. LLENAMOS HOJA SOPORTE: Creamos una fila NUEVA con tus columnas de la imagen
                await fetch(API_SOPORTE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: [{
                            fecha: new Date().toLocaleString(),
                            soporte: tecnicoNombre,
                            cliente: clienteNombre,
                            solucion: solucion
                        }]
                    })
                });
                huboCambio = true;
            } catch (error) { console.error("Error al procesar registro:", error); }
        }
    }

    if(huboCambio) {
        alert("✅ Registrado: Estado actualizado en Administrador y detalle guardado en Soporte.");
        sincronizarConNube();
    } else {
        alert("No hay información nueva para guardar.");
    }
}

// 5. HISTORIAL (Lee de la hoja SOPORTE)
function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    if (!contenedor) return;
    contenedor.innerHTML = "";

    // Mostramos los últimos registros de la hoja SOPORTE
    [...historialNocturno].reverse().forEach((log) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.style.borderLeftColor = "#28a745";
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <small style="color:#aaa;">📅 ${log.fecha}</small><br>
                    <b>Soporte:</b> <span style="color:#00c6ff;">${log.soporte}</span> | 
                    <b>Cliente:</b> <span style="color:#00c6ff;">${log.cliente}</span><br>
                    <p style="margin-top:10px; font-style:italic; color:#eee;">"${log.solucion}"</p>
                </div>
            </div>`;
        contenedor.appendChild(div);
    });
}

async function eliminarFila(usuario) {
    if(confirm(`¿Deseas eliminar a ${usuario} de la lista de espera?`)) {
        try {
            await fetch(`${API_ADMIN}/usuario/${usuario}`, { method: 'DELETE' });
            sincronizarConNube();
        } catch (error) { alert("Error al eliminar."); }
    }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("INFORME DE SOPORTE NOCTURNO", 105, 20, { align: 'center' });
    const filas = historialNocturno.map(h => [h.fecha, h.soporte, h.cliente, h.solucion]);
    doc.autoTable({
        startY: 30,
        head: [['Fecha', 'Soporte', 'Cliente', 'Solución']],
        body: filas
    });
    doc.save(`Reporte_Soporte_${new Date().toLocaleDateString()}.pdf`);
}
