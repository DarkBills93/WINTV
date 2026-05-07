import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBg15QlVDXJMjBT7_1B-e-S3NYfvjHJ7FI",
    authDomain: "soporte-nocturno.firebaseapp.com",
    projectId: "soporte-nocturno",
    storageBucket: "soporte-nocturno.firebasestorage.app",
    messagingSenderId: "3084476740",
    appId: "1:3084476740:web:ac10d0975886599af3f711"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let clientesNocturnos = [];
let historialSoporte = [];
const FECHA_HOY = new Date().toLocaleDateString('en-CA');

// --- FUNCIONES DE SINCRONIZACIÓN ---

function iniciarSincronizacion() {
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (!document.getElementById('admin-panel').classList.contains('hidden')) {
            const fechaFiltro = document.getElementById('filtro-calendario').value;
            window.filtrarPorFecha(fechaFiltro);
        }
        
        if (!document.getElementById('user-panel').classList.contains('hidden')) {
            renderizarClientesTecnico();
        }
    });

    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        historialSoporte = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarHistorialLog();
    });
}

function actualizarHistorialLog() {
    const contenedor = document.getElementById('log-historial-nocturno');
    if (contenedor) {
        const deHoy = historialSoporte.filter(h => {
            if(!h.Fecha) return false;
            const fechaH = h.Fecha.seconds ? new Date(h.Fecha.seconds * 1000) : new Date();
            return fechaH.toLocaleDateString('en-CA') === FECHA_HOY;
        });

        contenedor.innerHTML = `
            <h4 style="color: #96c93d; margin-bottom:15px; text-align:left;">
                Trabajos de Hoy (Total: ${deHoy.length}):
            </h4>
            ${deHoy.map(h => `
                <div style="border-bottom: 1px solid rgba(150, 201, 61, 0.2); padding: 12px; font-size: 0.95em; text-align:left;">
                    <b style="color:#ffffff;">${h.Cliente}</b> 
                    <span style="color:#96c93d;">(${h.Soporte})</span>: 
                    <span style="color:#e6f1f5;">${h.Solucion}</span>
                </div>`).join('')}
        `;
    }
}

function renderizarClientesTecnico() {
    const lista = clientesNocturnos.filter(c => c.Estado === "pendiente");
    const contenedor = document.getElementById('lista-clientes-soporte');
    if (contenedor) {
        contenedor.innerHTML = lista.map((c) => `
            <div class="soporte-card">
                <b class="user-tag">USUARIO: ${c.Cliente}</b>
                <textarea id="texto-${c.id}" placeholder="Escribe la solución..."></textarea>
            </div>`).join('');
    }
}

// --- VINCULACIÓN CON EL HTML (OBJETO WINDOW) ---

window.checkLogin = function() {
    const pass = document.getElementById('pass-admin').value;
    if(pass === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        iniciarSincronizacion();
    } else { 
        alert("Clave Incorrecta"); 
    }
};

window.showUserPanel = function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    iniciarSincronizacion();
};

window.agregarCliente = async function() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    if(nombre) {
        try {
            await addDoc(collection(db, "Administrador"), { 
                Cliente: nombre, 
                Estado: "pendiente", 
                Fecha: serverTimestamp(), 
                SNV2: "JC", 
                Solucion: "" 
            });
            input.value = "";
        } catch (e) { console.error("Error al agregar:", e); }
    }
};

window.eliminarFila = async function(id) {
    if(confirm("¿Deseas eliminar este registro?")) {
        await deleteDoc(doc(db, "Administrador", id));
    }
};

window.guardarTodoElSoporte = async function() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim().toUpperCase();
    if(!tecnico) return alert("Escribe tu nombre de técnico");

    const pendientes = clientesNocturnos.filter(c => c.Estado === "pendiente");
    if(pendientes.length === 0) return alert("No hay reportes pendientes.");

    let guardados = 0;
    for (let c of pendientes) {
        const textarea = document.getElementById(`texto-${c.id}`);
        const texto = textarea ? textarea.value.trim() : "";
        
        if(texto) {
            await addDoc(collection(db, "Soporte"), { 
                Cliente: c.Cliente, 
                Solucion: texto, 
                Soporte: tecnico, 
                Fecha: serverTimestamp() 
            });
            await updateDoc(doc(db, "Administrador", c.id), { 
                Estado: "ATENDIDO", 
                Soporte: tecnico, 
                Solucion: texto 
            });
            guardados++;
        }
    }
    
    if(guardados > 0) alert("Sincronización completa");
    else alert("Por favor, escribe la solución antes de enviar.");
};

window.filtrarPorFecha = function(fecha) {
    const contenedor = document.getElementById('monitor-lista');
    if(!contenedor) return;

    const datos = !fecha ? clientesNocturnos : clientesNocturnos.filter(c => {
        if(!c.Fecha || !c.Fecha.seconds) return false;
        const d = new Date(c.Fecha.seconds * 1000);
        return d.toISOString().split('T')[0] === fecha;
    });

    contenedor.innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse; font-size: 0.85em;">
            <tr style="background: #1a2a3a; color: #00c6ff;">
                <th style="padding:12px; text-align:left;">CLIENTE</th>
                <th style="padding:12px; text-align:center;">ESTADO</th>
                <th style="padding:12px; text-align:center;">ACCIÓN</th>
            </tr>
            ${datos.map(c => `
                <tr style="border-bottom: 1px solid #1a2a3a;">
                    <td style="padding:10px;">${c.Cliente} <br><small style="color:#aaa;">${c.Fecha?.seconds ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---'}</small></td>
                    <td style="padding:10px; text-align:center;">${c.Estado === 'ATENDIDO' ? '✅' : '⏳'}</td>
                    <td style="padding:10px; text-align:center;">
                        <button class="btn-del" onclick="window.eliminarFila('${c.id}')">Eliminar</button>
                    </td>
                </tr>`).join('')}
        </table>`;
};

window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const docPDF = new jsPDF('p', 'mm', 'a4');
    const fechaCalendario = document.getElementById('filtro-calendario')?.value;
    
    let datosParaPDF = [...historialSoporte];

    if (!todo) {
        const fechaABuscar = fechaCalendario || FECHA_HOY;
        datosParaPDF = datosParaPDF.filter(h => {
            if(!h.Fecha) return false;
            const fechaH = new Date(h.Fecha.seconds * 1000).toLocaleDateString('en-CA');
            return fechaH === fechaABuscar;
        });
        if(datosParaPDF.length === 0) return alert("No hay datos para la fecha seleccionada.");
    }

    docPDF.addImage('img/logo.png', 'PNG', 15, 10, 45, 25); 
    docPDF.setFont("helvetica", "bold");
    docPDF.setFontSize(22);
    docPDF.text("INFORME DE ATENCIONES", 110, 22, { align: "center" });
    docPDF.text("NOCTURNAS", 110, 32, { align: "center" });
    docPDF.setDrawColor(52, 152, 219);
    docPDF.setLineWidth(1);
    docPDF.line(15, 45, 195, 45);
    
    docPDF.setFontSize(11);
    docPDF.text(`RESPONSABLE: JC`, 15, 55);
    docPDF.text(`SEDES: TINGO MARIA – HUANUCO – LIMA`, 15, 62);
    docPDF.text(`FECHA REPORTE: ${todo ? "HISTÓRICO GENERAL" : (fechaCalendario || FECHA_HOY)}`, 15, 69);

    const filas = datosParaPDF.map(h => [
        h.Fecha?.seconds ? new Date(h.Fecha.seconds * 1000).toLocaleDateString('es-PE') : '---',
        h.Cliente,
        h.Soporte,
        h.Solucion
    ]);

    docPDF.autoTable({
        startY: 75,
        head: [['FECHA', 'CLIENTE', 'ATENDIDO POR', 'TRABAJO REALIZADO']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 40 }, 2: { cellWidth: 35 } }
    });

    docPDF.save(`Informe_JC_${todo ? 'Historico' : (fechaCalendario || FECHA_HOY)}.pdf`);
};
