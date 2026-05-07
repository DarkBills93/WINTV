import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const FECHA_HOY = new Date().toLocaleDateString('en-CA'); // Detecta automáticamente el día actual

function iniciarSincronizacion() {
    onSnapshot(query(collection(db, "Administrador"), orderBy("Fecha", "desc")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarInterfaz();
    });
}

function actualizarInterfaz() {
    // Monitor Administrador
    const monitor = document.getElementById('monitor-lista');
    if(monitor) {
        monitor.innerHTML = clientesNocturnos.map(c => `
            <tr>
                <td>${c.Cliente}</td>
                <td>${c.Estado === 'ATENDIDO' ? '✅' : '⏳'}</td>
                <td><button class="btn-delete" onclick="eliminarFila('${c.id}')">Eliminar</button></td>
            </tr>`).join('');
    }

    // Panel Soporte (Pendientes)
    const listaSop = document.getElementById('lista-clientes-soporte');
    if(listaSop && !document.getElementById('user-panel').classList.contains('hidden')) {
        const pendientes = clientesNocturnos.filter(c => c.Estado === "pendiente");
        listaSop.innerHTML = pendientes.map(c => `
            <div class="soporte-card">
                <b>USUARIO: ${c.Cliente}</b>
                <textarea id="texto-${c.id}" placeholder="Escribe la solución dada..."></textarea>
            </div>`).join('');
    }

    // Historial Solo Hoy
    const logHoy = document.getElementById('log-hoy');
    if(logHoy) {
        const hoyAtendidos = clientesNocturnos.filter(c => {
            if(!c.Fecha) return false;
            const fDoc = new Date(c.Fecha.seconds * 1000).toLocaleDateString('en-CA');
            return fDoc === FECHA_HOY && c.Estado === "ATENDIDO";
        });
        logHoy.innerHTML = hoyAtendidos.length ? hoyAtendidos.map(h => `
            <div style="padding:10px; border-bottom:1px solid rgba(0,198,255,0.1); text-align:left;">
                <b style="color:#00c6ff;">${h.Cliente}</b> <span style="color:#2ecc71;">(${h.Soporte || 'JC'})</span>: ${h.Solucion}
            </div>`).join('') : '<p style="padding:10px; opacity:0.5;">No hay registros de hoy.</p>';
    }
}

window.checkLogin = () => {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        iniciarSincronizacion();
    } else { alert("Contraseña incorrecta"); }
};

window.showUserPanel = () => {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    iniciarSincronizacion();
};

window.agregarCliente = async () => {
    const input = document.getElementById('nombre-cliente');
    const nom = input.value.toUpperCase().trim();
    if(nom) {
        await addDoc(collection(db, "Administrador"), { Cliente: nom, Estado: "pendiente", Fecha: serverTimestamp(), SNV2: "JC" });
        input.value = "";
    }
};

window.eliminarFila = async (id) => {
    if(confirm("¿Eliminar este registro permanentemente?")) { await deleteDoc(doc(db, "Administrador", id)); }
};

window.guardarTodoElSoporte = async () => {
    const tecnico = document.getElementById('nombre-tecnico').value.trim().toUpperCase();
    if(!tecnico) return alert("Por favor, ingresa tu nombre");
    
    for (let c of clientesNocturnos.filter(x => x.Estado === "pendiente")) {
        const sol = document.getElementById(`texto-${c.id}`).value.trim();
        if(sol) {
            await addDoc(collection(db, "Soporte"), { Cliente: c.Cliente, Solucion: sol, Soporte: tecnico, Fecha: serverTimestamp() });
            await updateDoc(doc(db, "Administrador", c.id), { Estado: "ATENDIDO", Solucion: sol, Soporte: tecnico, SNV2: "JC" });
        }
    }
    alert("Sincronización exitosa.");
};

window.exportarPDF = (esHistorico) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const img = new Image();
    img.src = 'img/logo.png';

    // Encabezado Profesional
    doc.addImage(img, 'PNG', 15, 10, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INFORME DE ATENCIONES", 65, 25);
    doc.text("NOCTURNAS - WNTV", 65, 35);
    
    doc.setLineWidth(0.5); doc.line(15, 55, 195, 55);
    doc.setFontSize(11);
    doc.text("ADMINISTRADOR: JC", 15, 65);
    doc.text(`TIPO: ${esHistorico ? 'REPORTE HISTÓRICO' : 'REPORTE DIARIO ('+FECHA_HOY+')'}`, 15, 72);

    const filtrados = esHistorico ? clientesNocturnos : clientesNocturnos.filter(c => {
        if(!c.Fecha) return false;
        const fFiltro = document.getElementById('filtro-calendario').value || FECHA_HOY;
        return new Date(c.Fecha.seconds * 1000).toLocaleDateString('en-CA') === fFiltro;
    });

    doc.autoTable({
        startY: 80,
        head: [['CLIENTE', 'TÉCNICO', 'SOLUCIÓN']],
        body: filtrados.map(c => [c.Cliente, c.Soporte || 'JC', c.Solucion || 'Pendiente']),
        headStyles: { fillColor: [0, 114, 255] },
        theme: 'striped'
    });

    doc.save(esHistorico ? "Reporte_JC_Historico.pdf" : `Reporte_Diario_${FECHA_HOY}.pdf`);
};
