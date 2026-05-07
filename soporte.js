import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

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
let historialNocturno = [];
let panelAbierto = "";

function iniciarSincronizacionRealTime() {
    const qPendientes = query(collection(db, "Administrador"), where("Estado", "==", "pendiente"));
    onSnapshot(qPendientes, (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (panelAbierto === "admin") actualizarMonitorAdmin();
        if (panelAbierto === "tecnico") renderizarClientesTecnico();
    });

    const qHistorial = query(collection(db, "Soporte"), orderBy("Fecha", "desc"));
    onSnapshot(qHistorial, (snapshot) => {
        historialNocturno = snapshot.docs.map(doc => doc.data());
        if (panelAbierto === "tecnico") mostrarHistorial();
    });
}

async function agregarCliente() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    if(nombre) {
        try {
            await addDoc(collection(db, "Administrador"), {
                Cliente: nombre,
                Estado: "pendiente",
                Fecha: serverTimestamp(),
                SNV2: "Pendiente"
            });
            input.value = "";
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

async function guardarTodoElSoporte() {
    const tecnicoNombre = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnicoNombre) { alert("Ingrese su nombre de técnico."); return; }

    let huboCambio = false;
    for (let i = 0; i < clientesNocturnos.length; i++) {
        const textoArea = document.getElementById(`texto-${i}`);
        const datosCliente = clientesNocturnos[i];
        
        if(textoArea && textoArea.value.trim() !== "") {
            try {
                await addDoc(collection(db, "Soporte"), {
                    Cliente: datosCliente.Cliente,
                    Fecha: serverTimestamp(),
                    Solucion: textoArea.value.trim(),
                    Soporte: tecnicoNombre
                });

                const docRef = doc(db, "Administrador", datosCliente.id);
                await updateDoc(docRef, {
                    Estado: "Atendido",
                    SNV2: "JC" 
                });
                huboCambio = true;
            } catch (error) { console.error(error); }
        }
    }
    if(huboCambio) alert("✅ Guardado correctamente.");
}

function checkLogin() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        panelAbierto = "admin";
        iniciarSincronizacionRealTime();
    } else { alert("Contraseña incorrecta"); }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    panelAbierto = "tecnico";
    iniciarSincronizacionRealTime();
}

function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = clientesNocturnos.map((c, i) => `
        <div class="soporte-card">
            <h4>Cliente: ${c.Cliente}</h4>
            <textarea id="texto-${i}" placeholder="Escribe la solución aquí..."></textarea>
        </div>
    `).join('');
}

function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    contenedor.innerHTML = historialNocturno.map(h => `
        <div style="border-bottom: 1px solid #444; padding: 10px;">
            <small>${h.Fecha ? h.Fecha.toDate().toLocaleString() : ''}</small><br>
            <b>${h.Cliente}</b> - Atendido por: ${h.Soporte}<br>
            <p>${h.Solucion}</p>
        </div>
    `).join('');
}

function actualizarMonitorAdmin() {
    const contenedor = document.getElementById('monitor-lista');
    contenedor.innerHTML = clientesNocturnos.map(c => `
        <div class="monitor-item">
            <span>${c.Cliente}</span>
            <span style="color: #ff9f43;">PENDIENTE</span>
        </div>
    `).join('');
}

// Vinculamos funciones al objeto window para el HTML
window.checkLogin = checkLogin;
window.showUserPanel = showUserPanel;
window.agregarCliente = agregarCliente;
window.guardarTodoElSoporte = guardarTodoElSoporte;
