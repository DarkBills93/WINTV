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
let historialSoporte = []; // Nueva variable para cruzar datos

function iniciarSincronizacion() {
    // Escuchar colección Administrador
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!document.getElementById('admin-panel').classList.contains('hidden')) actualizarMonitorAdmin();
        if (!document.getElementById('user-panel').classList.contains('hidden')) renderizarClientesTecnico();
    });

    // Escuchar colección Soporte (Aquí es donde está el nombre real del técnico)
    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        historialSoporte = snapshot.docs.map(doc => doc.data());
        const contenedor = document.getElementById('log-historial-nocturno');
        if (contenedor) {
            contenedor.innerHTML = `<h4 style="color: #00c6ff;">Historial Reciente:</h4>` + historialSoporte.slice(0,10).map(h => `
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
            Cliente: nombre, 
            Estado: "pendiente", 
            Fecha: serverTimestamp(), 
            SNV2: "JC", // En Administrador siempre eres tú
            Solucion: "" 
        });
        input.value = "";
    }
};

window.guardarTodoElSoporte = async function() {
    const nombreDelTecnico = document.getElementById('nombre-tecnico').value.trim().toUpperCase();
    if(!nombreDelTecnico) return alert("Escribe tu nombre de técnico");

    const pendientes = clientesNocturnos.filter(c => c.Estado === "pendiente");
    for (let c of pendientes) {
        const texto = document.getElementById(`texto-${c.id}`).value.trim();
        if(texto) {
            // Se guarda en la colección Soporte con el nombre del que atiende
            await addDoc(collection(db, "Soporte"), { 
                Cliente: c.Cliente, 
                Solucion: texto, 
                Soporte: nombreDelTecnico, // Campo correcto según tu Firebase
                Fecha: serverTimestamp() 
            });
            // Se actualiza Administrador manteniendo SNV2 como JC
            await updateDoc(doc(db, "Administrador", c.id), { 
                Estado: "ATENDIDO", 
                SNV2: "JC", 
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
    document.getElementById('monitor-lista').innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse; font-size: 0.85em;">
            <tr style="background: #1a2a3a; color: #00c6ff;">
                <th style="padding:12px; text-align:left;">CLIENTE</th>
                <th style="padding:12px; text-align:center;">ESTADO</th>
                <th style="padding:12px; text-align:center;">ADMIN SISTEMA</th>
            </tr>
            ${datos.map(c => `
                <tr style="border-bottom: 1px solid #1a2a3a;">
                    <td style="padding:10px;">${c.Cliente}</td>
                    <td style="padding:10px; text-align:center;">${c.Estado === 'ATENDIDO' ? '✅' : '⏳'}</td>
                    <td style="padding:10px; text-align:center; color:#f1c40f;">${c.SNV2}</td>
                </tr>`).join('')}
        </table>`;
}

window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaFiltro = document.getElementById('filtro-calendario')?.value;
    
    // Usamos el historial de Soporte para el PDF porque ahí están los nombres reales
    let datosParaPDF = [...historialSoporte];

    if (!todo && fechaFiltro) {
        datosParaPDF = datosParaPDF.filter(h => {
            if(!h.Fecha) return false;
            const fDoc = new Date(h.Fecha.seconds * 1000).toLocaleDateString('en-CA');
            return fDoc === fechaFiltro;
        });
    }

    doc.setFontSize(20);
    doc.setTextColor(0, 123, 255); 
    doc.text("REPORTE DE ACTIVIDADES WNTV", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ADMINISTRADOR GENERAL: JC`, 14, 35);
    doc.text(`FECHA REPORTE: ${fechaFiltro || new Date().toLocaleDateString()}`, 14, 40);
    doc.line(14, 45, 196, 45);

    // Mapeamos las filas usando el campo 'Soporte' (María, Frank, etc.)
    const filas = datosParaPDF.map(h => [
        h.Cliente, 
        h.Soporte, // <--- Aquí va el nombre del técnico de la colección Soporte
        h.Fecha ? new Date(h.Fecha.seconds * 1000).toLocaleDateString() : '---',
        h.Solucion
    ]);

    doc.autoTable({
        startY: 50,
        head: [['CLIENTE', 'TÉCNICO', 'FECHA', 'SOLUCIÓN']],
        body: filas,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] }
    });

    doc.save(`Reporte_WNTV_${fechaFiltro || 'Historial'}.pdf`);
};

window.filtrarPorFecha = function(fecha) {
    if (!fecha) return actualizarMonitorAdmin();
    const filtrados = clientesNocturnos.filter(c => {
        if(!c.Fecha) return false;
        const fDoc = new Date(c.Fecha.seconds * 1000).toLocaleDateString('en-CA');
        return fDoc === fecha;
    });
    actualizarMonitorAdmin(filtrados);
};
