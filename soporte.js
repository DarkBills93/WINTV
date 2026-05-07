import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, query, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

function iniciarSincronizacion() {
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!document.getElementById('admin-panel').classList.contains('hidden')) actualizarMonitorAdmin();
        if (!document.getElementById('user-panel').classList.contains('hidden')) renderizarClientesTecnico();
    });

    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        const historial = snapshot.docs.map(doc => doc.data());
        const contenedor = document.getElementById('log-historial-nocturno');
        if (contenedor) {
            contenedor.innerHTML = `<h4 style="color: #555;">Historial Reciente:</h4>` + historial.slice(0,10).map(h => `
                <div style="border-bottom: 1px solid #1a2a3a; padding: 10px; font-size: 0.9em; text-align:left;">
                    <b style="color:#00c6ff;">${h.Cliente}</b> <span style="color:#2ecc71;">(${h.Soporte})</span>: ${h.Solucion}
                </div>`).join('');
        }
    });
}

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

window.agregarCliente = async function() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    if(nombre) {
        await addDoc(collection(db, "Administrador"), { 
            Cliente: nombre, Estado: "pendiente", Fecha: serverTimestamp(), SNV2: "PENDIENTE", Solucion: "" 
        });
        input.value = "";
    }
};

window.guardarTodoElSoporte = async function() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim().toUpperCase();
    if(!tecnico) return alert("Escribe tu nombre");
    const pendientes = clientesNocturnos.filter(c => c.Estado === "pendiente");
    for (let c of pendientes) {
        const texto = document.getElementById(`texto-${c.id}`).value.trim();
        if(texto) {
            await addDoc(collection(db, "Soporte"), { Cliente: c.Cliente, Solucion: texto, Soporte: tecnico, Fecha: serverTimestamp() });
            await updateDoc(doc(db, "Administrador", c.id), { Estado: "ATENDIDO", SNV2: tecnico, Solucion: texto });
        }
    }
    alert("Datos sincronizados");
};

function renderizarClientesTecnico() {
    const lista = clientesNocturnos.filter(c => c.Estado === "pendiente");
    document.getElementById('lista-clientes-soporte').innerHTML = lista.map((c) => `
        <div class="soporte-card">
            <b>USUARIO: ${c.Cliente}</b>
            <textarea id="texto-${c.id}" placeholder="Solución brindada..."></textarea>
        </div>`).join('');
}

function actualizarMonitorAdmin(listaFiltrada = null) {
    const datos = listaFiltrada || clientesNocturnos;
    document.getElementById('monitor-lista').innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse; font-size: 0.85em;">
            <tr style="background: #1a2a3a; color: #00c6ff;">
                <th style="padding:12px; text-align:left;">CLIENTE</th>
                <th style="padding:12px; text-align:center;">ESTADO</th>
                <th style="padding:12px; text-align:center;">TÉCNICO</th>
            </tr>
            ${datos.map(c => `
                <tr style="border-bottom: 1px solid #1a2a3a;">
                    <td style="padding:10px;">${c.Cliente}</td>
                    <td style="padding:10px; text-align:center;">${c.Estado.toUpperCase() === 'ATENDIDO' ? '✅' : '⏳'}</td>
                    <td style="padding:10px; text-align:center; color:#2ecc71;">${c.SNV2 || '---'}</td>
                </tr>`).join('')}
        </table>`;
}

window.filtrarPorFecha = function(fecha) {
    if (!fecha) return actualizarMonitorAdmin();
    const filtrados = clientesNocturnos.filter(c => {
        const fDoc = new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA');
        return fDoc === fecha;
    });
    actualizarMonitorAdmin(filtrados);
};

// MODELO DE PDF ESTILO FACTURA (NO CAMBIADO)
window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaFiltro = document.getElementById('filtro-calendario')?.value;
    let datos = clientesNocturnos;

    if (!todo && fechaFiltro) {
        datos = clientesNocturnos.filter(c => 
            new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA') === fechaFiltro
        );
    }

    doc.setFontSize(22);
    doc.setTextColor(0, 123, 255); 
    doc.text("REPORTE DE SOPORTE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("WNTV - EXPERIENCIA SIN LÍMITES", 105, 27, { align: "center" });
    doc.setDrawColor(0, 123, 255);
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`FECHA: ${fechaFiltro || new Date().toLocaleDateString()}`, 14, 45);
    doc.text(`RESPONSABLE: JC (ADMIN)`, 14, 52);

    const filas = datos.map(c => [
        c.Cliente, 
        c.SNV2 && c.SNV2 !== 'PENDIENTE' ? c.SNV2 : '---', 
        c.Fecha ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---',
        c.Solucion || 'SIN DETALLES'
    ]);

    doc.autoTable({
        startY: 65,
        head: [['CLIENTE', 'ATENDIDO POR', 'FECHA', 'TRABAJO REALIZADO']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], halign: 'center' },
        styles: { fontSize: 9, overflow: 'linebreak' },
        columnStyles: {
            1: { halign: 'center', textColor: [39, 174, 96] },
            3: { cellWidth: 'auto' }
        }
    });

    doc.save(todo ? "Reporte_General.pdf" : `Reporte_${fechaFiltro || 'Soporte'}.pdf`);
};
