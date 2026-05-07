import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    // MONITOR: Trae todos para que no se borren de la vista de administrador
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const panelAdmin = document.getElementById('admin-panel');
        const panelUser = document.getElementById('user-panel');
        
        if (!panelAdmin.classList.contains('hidden')) actualizarMonitorAdmin();
        if (!panelUser.classList.contains('hidden')) renderizarClientesTecnico();
    });

    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        const historial = snapshot.docs.map(doc => doc.data());
        const contenedor = document.getElementById('log-historial-nocturno');
        if (contenedor) {
            contenedor.innerHTML = historial.map(h => `
                <div style="border-bottom: 1px solid #333; padding: 10px; background: rgba(255,255,255,0.02); margin-bottom: 5px;">
                    <b style="color:#00c6ff;">${h.Cliente}</b> - Atendido por: <span style="color:#2ecc71;">${h.Soporte}</span><br>
                    <p style="margin:5px 0 0 0;">${h.Solucion}</p>
                </div>
            `).join('');
        }
    });
}

// --- FUNCIONES GLOBALES ---

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
            SNV2: "Pendiente" 
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
            await addDoc(collection(db, "Soporte"), { 
                Cliente: c.Cliente, 
                Solucion: texto, 
                Soporte: tecnico, 
                Fecha: serverTimestamp() 
            });
            await updateDoc(doc(db, "Administrador", c.id), { 
                Estado: "Atendido", 
                SNV2: tecnico 
            });
        }
    }
    alert("Registro guardado con éxito.");
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

function actualizarMonitorAdmin() {
    document.getElementById('monitor-lista').innerHTML = `
        <table style="width:100%; color:white; border-collapse: collapse;">
            <tr style="border-bottom: 2px solid #00c6ff;">
                <th style="text-align:left; padding:10px;">Usuario</th>
                <th style="text-align:center; padding:10px;">Estado</th>
                <th style="text-align:center; padding:10px;">Técnico</th>
            </tr>
            ${clientesNocturnos.map(c => `
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

// FUNCIÓN EXPORTAR PDF JC
window.exportarPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString();

    // Diseño de Encabezado
    doc.setFillColor(0, 198, 255);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("REPORTE SOPORTE NOCTURNO", 15, 25);
    
    doc.setFontSize(10);
    doc.text(`ADMINISTRADOR: JC`, 15, 33);
    doc.text(`FECHA: ${fechaActual}`, 160, 33);

    // Preparar Datos
    const filas = clientesNocturnos.map(c => [
        c.Cliente,
        c.Estado.toUpperCase(),
        c.SNV2 || 'PENDIENTE',
        c.Fecha ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---'
    ]);

    // Crear Tabla
    doc.autoTable({
        startY: 50,
        head: [['USUARIO', 'ESTADO', 'TÉCNICO', 'FECHA']],
        body: filas,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 9 }
    });

    doc.save(`Reporte_Nocturno_JC_${fechaActual}.pdf`);
};
