import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, serverTimestamp, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

function iniciarSincronizacion() {
    // Sincronizar Clientes (Panel Admin y Técnico)
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!document.getElementById('admin-panel').classList.contains('hidden')) {
            const fechaFiltro = document.getElementById('filtro-calendario').value;
            filtrarPorFecha(fechaFiltro); // Mantiene el filtro si existe
        }
        if (!document.getElementById('user-panel').classList.contains('hidden')) renderizarClientesTecnico();
    });

    // Sincronizar Historial Real (Colección Soporte)
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
            <h4 style="color: #00c6ff; margin-bottom:15px; text-align:left;">
                Trabajos de Hoy (Total: ${deHoy.length}):
            </h4>
            ${deHoy.map(h => `
                <div style="border-bottom: 1px solid rgba(0, 198, 255, 0.2); padding: 12px; font-size: 0.95em; text-align:left;">
                    <b style="color:#ffffff;">${h.Cliente}</b> 
                    <span style="color:#2ecc71;">(${h.Soporte})</span>: 
                    <span style="color:#e6f1f5;">${h.Solucion}</span>
                </div>`).join('')}
        `;
    }
}

// LOGIN Y NAVEGACIÓN
window.checkLogin = function() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        iniciarSincronizacion();
    } else { alert("Clave Incorrecta"); }
};

window.showUserPanel = function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    iniciarSincronizacion();
};

// GESTIÓN DE CLIENTES
window.agregarCliente = async function() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    if(nombre) {
        await addDoc(collection(db, "Administrador"), { 
            Cliente: nombre, 
            Estado: "pendiente", 
            Fecha: serverTimestamp(), 
            SNV2: "JC", 
            Solucion: "" 
        });
        input.value = "";
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
    if(pendientes.length === 0) return alert("No hay reportes pendientes por guardar.");

    for (let c of pendientes) {
        const texto = document.getElementById(`texto-${c.id}`).value.trim();
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
        }
    }
    alert("Sincronización completa");
};

function renderizarClientesTecnico() {
    const lista = clientesNocturnos.filter(c => c.Estado === "pendiente");
    document.getElementById('lista-clientes-soporte').innerHTML = lista.map((c) => `
        <div class="soporte-card">
            <b>USUARIO: ${c.Cliente}</b>
            <textarea id="texto-${c.id}" placeholder="Escribe la solución..."></textarea>
        </div>`).join('');
}

function actualizarMonitorAdmin(listaFiltrada = null) {
    const datos = listaFiltrada || clientesNocturnos;
    const contenedor = document.getElementById('monitor-lista');
    if(!contenedor) return;

    contenedor.innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse; font-size: 0.85em;">
            <tr style="background: #1a2a3a; color: #00c6ff;">
                <th style="padding:12px; text-align:left;">CLIENTE</th>
                <th style="padding:12px; text-align:center;">ESTADO</th>
                <th style="padding:12px; text-align:center;">ACCIÓN</th>
            </tr>
            ${datos.map(c => {
                const fechaStr = c.Fecha?.seconds ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---';
                return `
                <tr style="border-bottom: 1px solid #1a2a3a;">
                    <td style="padding:10px;">${c.Cliente} <br><small style="color:#aaa;">${fechaStr}</small></td>
                    <td style="padding:10px; text-align:center;">${c.Estado === 'ATENDIDO' ? '✅' : '⏳'}</td>
                    <td style="padding:10px; text-align:center;">
                        <button class="btn-del" onclick="eliminarFila('${c.id}')">Eliminar</button>
                    </td>
                </tr>`}).join('')}
        </table>`;
}

// FILTRO CALENDARIO DINÁMICO
window.filtrarPorFecha = function(fecha) {
    if (!fecha) {
        actualizarMonitorAdmin(clientesNocturnos);
        return;
    }
    const filtrados = clientesNocturnos.filter(c => {
        if(!c.Fecha) return false;
        const fechaC = new Date(c.Fecha.seconds * 1000).toLocaleDateString('en-CA');
        return fechaC === fecha;
    });
    actualizarMonitorAdmin(filtrados);
};

// EXPORTACIÓN PDF PROFESIONAL CON FILTRO DE FECHA
window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaCalendario = document.getElementById('filtro-calendario')?.value;
    
    let datosParaPDF = [...historialSoporte];

    // Si es "PDF Diario" (todo = false), filtramos por la fecha del calendario o por hoy
    if (!todo) {
        const fechaABuscar = fechaCalendario || FECHA_HOY;
        datosParaPDF = datosParaPDF.filter(h => {
            if(!h.Fecha) return false;
            const fechaH = new Date(h.Fecha.seconds * 1000).toLocaleDateString('en-CA');
            return fechaH === fechaABuscar;
        });
        if(datosParaPDF.length === 0) return alert("No hay datos para la fecha: " + fechaABuscar);
    }

    // Logo y Título según diseño solicitado
    doc.addImage('img/logo.png', 'PNG', 15, 10, 45, 25); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INFORME DE ATENCIONES", 110, 22, { align: "center" });
    doc.text("NOCTURNAS", 110, 32, { align: "center" });

    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.line(15, 45, 195, 45);

    doc.setFontSize(11);
    doc.text(`RESPONSABLE: JC`, 15, 55);
    doc.text(`SEDES: TINGO MARIA – HUANUCO – LIMA`, 15, 62);
    
    const etiquetaFecha = todo ? "HISTÓRICO GENERAL" : (fechaCalendario || FECHA_HOY);
    doc.text(`FECHA REPORTE: ${etiquetaFecha}`, 15, 69);

    // Mapear datos para la tabla
    const filas = datosParaPDF.map(h => {
        const f = h.Fecha?.seconds ? new Date(h.Fecha.seconds * 1000).toLocaleDateString('es-PE') : '---';
        return [f, h.Cliente, h.Soporte, h.Solucion];
    });

    doc.autoTable({
        startY: 75,
        head: [['FECHA', 'CLIENTE', 'ATENDIDO POR', 'TRABAJO REALIZADO']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 40 }, 2: { cellWidth: 35 } }
    });

    doc.save(`Informe_WNTV_${todo ? 'Historico' : (fechaCalendario || FECHA_HOY)}.pdf`);
};
