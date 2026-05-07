import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Sincronización en tiempo real
function iniciarSincronizacion() {
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const panelAdmin = document.getElementById('admin-panel');
        const panelUser = document.getElementById('user-panel');
        
        if (!panelAdmin.classList.contains('hidden')) actualizarMonitorAdmin();
        if (!panelUser.classList.contains('hidden')) renderizarClientesTecnico();
    });
}

// --- FUNCIONES DE INTERFAZ ---

window.checkLogin = function() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        iniciarSincronizacion();
    } else { alert("Contraseña incorrecta"); }
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
        await addDoc(collection(db, "Administrador"), { 
            Cliente: nombre, 
            Estado: "pendiente", 
            Fecha: serverTimestamp(), 
            SNV2: "Pendiente",
            Solucion: "" // Inicializado vacío
        });
        input.value = "";
    }
};

window.guardarTodoElSoporte = async function() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim().toUpperCase();
    if(!tecnico) return alert("Ingrese su nombre.");
    
    const pendientes = clientesNocturnos.filter(c => c.Estado === "pendiente");
    
    for (let c of pendientes) {
        const texto = document.getElementById(`texto-${c.id}`).value.trim();
        if(texto) {
            // Guardar en colección Soporte (Historial)
            await addDoc(collection(db, "Soporte"), { 
                Cliente: c.Cliente, 
                Solucion: texto, 
                Soporte: tecnico, 
                Fecha: serverTimestamp() 
            });
            // Actualizar el documento original para el reporte PDF
            await updateDoc(doc(db, "Administrador", c.id), { 
                Estado: "Atendido", 
                SNV2: tecnico,
                Solucion: texto // Ahora el reporte puede leerlo directamente
            });
        }
    }
    alert("Registros guardados con éxito.");
};

function renderizarClientesTecnico() {
    const lista = clientesNocturnos.filter(c => c.Estado === "pendiente");
    document.getElementById('lista-clientes-soporte').innerHTML = lista.map((c) => `
        <div class="soporte-card">
            <h4>Cliente: ${c.Cliente}</h4>
            <textarea id="texto-${c.id}" placeholder="Escriba la solución..."></textarea>
        </div>
    `).join('');
}

// Renderiza la tabla en el panel Admin (con opción de filtro)
function actualizarMonitorAdmin(listaFiltrada = null) {
    const datos = listaFiltrada || clientesNocturnos;
    document.getElementById('monitor-lista').innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse;">
            <tr style="border-bottom: 2px solid #00c6ff;">
                <th style="padding:10px; text-align:left;">Usuario</th>
                <th style="padding:10px; text-align:center;">Estado</th>
                <th style="padding:10px; text-align:center;">Técnico</th>
            </tr>
            ${datos.map(c => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding:10px;">${c.Cliente}</td>
                    <td style="padding:10px; text-align:center;">
                        ${c.Estado === 'Atendido' ? '✅ <span style="color:#2ecc71;">Atendido</span>' : '⏳ <span style="color:#ff9f43;">Pendiente</span>'}
                    </td>
                    <td style="padding:10px; text-align:center; color:#aaa;">${c.SNV2}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

// Filtro del Calendario
window.filtrarPorFecha = function(fechaSeleccionada) {
    if (!fechaSeleccionada) {
        actualizarMonitorAdmin();
        return;
    }
    const filtrados = clientesNocturnos.filter(c => {
        const fechaDoc = new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA');
        return fechaDoc === fechaSeleccionada;
    });
    actualizarMonitorAdmin(filtrados);
};

// --- EXPORTACIÓN PDF ESTILO FACTURA JC ---
window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fechaFiltro = document.getElementById('filtro-calendario').value;
    const fechaActual = new Date().toLocaleDateString();

    let datos = clientesNocturnos;
    
    // Filtrar por fecha si no es "Exportar Todo"
    if (!todo && fechaFiltro) {
        datos = clientesNocturnos.filter(c => {
            const f = new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA');
            return f === fechaFiltro;
        });
    }

    // Ordenar por Técnico de Turno
    datos.sort((a, b) => (a.SNV2 || "").localeCompare(b.SNV2 || ""));

    // Diseño de Encabezado Corporativo
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("INFORME TÉCNICO DE SOPORTE", 15, 25);
    
    doc.setFontSize(10);
    doc.text(`ADMINISTRADOR: JC`, 15, 34);
    doc.text(`FECHA REPORTE: ${fechaActual}`, 160, 34);

    // Preparar filas: [Cliente, Estado, Técnico, Fecha, Solución]
    const filas = datos.map(c => [
        c.Cliente,
        c.Estado.toUpperCase(),
        c.SNV2 || '---',
        c.Fecha ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---',
        c.Solucion || 'Sin comentarios'
    ]);

    doc.autoTable({
        startY: 45,
        head: [['CLIENTE', 'ESTADO', 'TÉCNICO DE TURNO', 'FECHA', 'TRABAJO REALIZADO']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 4: { cellWidth: 55 } } // Espacio extra para los comentarios
    });

    const nombreFinal = todo ? `Reporte_General_JC.pdf` : `Reporte_Soporte_JC_${fechaActual}.pdf`;
    doc.save(nombreFinal);
};
