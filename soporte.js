import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, doc, query, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIGURACIÓN DE FIREBASE
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

// 2. SINCRONIZACIÓN TOTAL (Monitor + Historial)
function iniciarSincronizacion() {
    // Escucha la tabla de administración (Pendientes y Atendidos)
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const panelAdmin = document.getElementById('admin-panel');
        const panelUser = document.getElementById('user-panel');
        
        if (panelAdmin && !panelAdmin.classList.contains('hidden')) actualizarMonitorAdmin();
        if (panelUser && !panelUser.classList.contains('hidden')) renderizarClientesTecnico();
    });

    // Escucha el historial visual de "Soporte Nocturno" (Log de abajo)
    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        const historial = snapshot.docs.map(doc => doc.data());
        const contenedor = document.getElementById('log-historial-nocturno');
        if (contenedor) {
            contenedor.innerHTML = historial.map(h => `
                <div style="border-bottom: 1px solid #333; padding: 10px; background: rgba(255,255,255,0.02); margin-bottom: 5px;">
                    <b style="color:#00c6ff;">${h.Cliente}</b> - Atendido por: <span style="color:#2ecc71;">${h.Soporte}</span><br>
                    <p style="margin:5px 0 0 0; color: #eee;">${h.Solucion}</p>
                </div>
            `).join('');
        }
    });
}

// 3. LOGICA DE ACCESO
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

// 4. ACCIONES TÉCNICAS
window.agregarCliente = async function() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    if(nombre) {
        await addDoc(collection(db, "Administrador"), { 
            Cliente: nombre, 
            Estado: "pendiente", 
            Fecha: serverTimestamp(), 
            SNV2: "Pendiente",
            Solucion: "" 
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
            // Guardar en el Log de Soporte
            await addDoc(collection(db, "Soporte"), { 
                Cliente: c.Cliente, 
                Solucion: texto, 
                Soporte: tecnico, 
                Fecha: serverTimestamp() 
            });
            // Actualizar registro en Administrador (para el reporte de JC)
            await updateDoc(doc(db, "Administrador", c.id), { 
                Estado: "Atendido", 
                SNV2: tecnico,
                Solucion: texto 
            });
        }
    }
    alert("Registros actualizados con éxito.");
};

// 5. RENDERIZADO DE TABLAS
function renderizarClientesTecnico() {
    const lista = clientesNocturnos.filter(c => c.Estado === "pendiente");
    const cont = document.getElementById('lista-clientes-soporte');
    if(cont) {
        cont.innerHTML = lista.map((c) => `
            <div class="soporte-card">
                <h4>Cliente: ${c.Cliente}</h4>
                <textarea id="texto-${c.id}" placeholder="Escriba la solución..."></textarea>
            </div>
        `).join('');
    }
}

function actualizarMonitorAdmin(listaFiltrada = null) {
    const datos = listaFiltrada || clientesNocturnos;
    const cont = document.getElementById('monitor-lista');
    if(!cont) return;

    cont.innerHTML = `
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

// 6. FILTRO Y EXPORTACIÓN JC
window.filtrarPorFecha = function(fecha) {
    if (!fecha) return actualizarMonitorAdmin();
    const filtrados = clientesNocturnos.filter(c => {
        const fDoc = new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA');
        return fDoc === fecha;
    });
    actualizarMonitorAdmin(filtrados);
};

window.exportarPDF = function(todo = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fechaFiltro = document.getElementById('filtro-calendario')?.value;
    const fechaActual = new Date().toLocaleDateString();

    let datos = clientesNocturnos;
    if (!todo && fechaFiltro) {
        datos = clientesNocturnos.filter(c => {
            const fDoc = new Date(c.Fecha?.seconds * 1000).toLocaleDateString('en-CA');
            return fDoc === fechaFiltro;
        });
    }

    datos.sort((a, b) => (a.SNV2 || "").localeCompare(b.SNV2 || ""));

    // ENCABEZADO ESTILO INFORME
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("INFORME TÉCNICO DE SOPORTE", 15, 25);
    doc.setFontSize(10);
    doc.text(`ADMINISTRADOR: JC`, 15, 34);
    doc.text(`FECHA REPORTE: ${fechaActual}`, 160, 34);

    const filas = datos.map(c => [
        c.Cliente,
        c.Estado.toUpperCase(),
        c.SNV2 || '---',
        c.Fecha ? new Date(c.Fecha.seconds * 1000).toLocaleDateString() : '---',
        c.Solucion || 'Sin comentarios'
    ]);

    doc.autoTable({
        startY: 45,
        head: [['CLIENTE', 'ESTADO', 'TÉCNICO TURNO', 'FECHA', 'TRABAJO REALIZADO']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 8 },
        columnStyles: { 4: { cellWidth: 50 } }
    });

    doc.save(todo ? "Reporte_General_JC.pdf" : `Reporte_JC_${fechaActual}.pdf`);
};
    const nombreFinal = todo ? `Reporte_General_JC.pdf` : `Reporte_Soporte_JC_${fechaActual}.pdf`;
    doc.save(nombreFinal);
};
