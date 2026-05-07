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
    onSnapshot(query(collection(db, "Administrador"), where("Estado", "==", "pendiente")), (snapshot) => {
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
                <div style="border-bottom: 1px solid #333; padding: 10px;">
                    <b>${h.Cliente}</b> - Atendido por: ${h.Soporte}<br>
                    <p>${h.Solucion}</p>
                </div>
            `).join('');
        }
    });
}

// FUNCIONES GLOBALES PARA LOS BOTONES
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
        await addDoc(collection(db, "Administrador"), { Cliente: nombre, Estado: "pendiente", Fecha: serverTimestamp(), SNV2: "Pendiente" });
        input.value = "";
    }
};

window.guardarTodoElSoporte = async function() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnico) return alert("Ingrese su nombre.");
    
    for (let i = 0; i < clientesNocturnos.length; i++) {
        const texto = document.getElementById(`texto-${i}`).value.trim();
        if(texto) {
            await addDoc(collection(db, "Soporte"), { Cliente: clientesNocturnos[i].Cliente, Solucion: texto, Soporte: tecnico, Fecha: serverTimestamp() });
            await updateDoc(doc(db, "Administrador", clientesNocturnos[i].id), { Estado: "Atendido", SNV2: "JC" });
        }
    }
    alert("Registro guardado.");
};

function renderizarClientesTecnico() {
    document.getElementById('lista-clientes-soporte').innerHTML = clientesNocturnos.map((c, i) => `
        <div class="soporte-card">
            <h4>Cliente: ${c.Cliente}</h4>
            <textarea id="texto-${i}" placeholder="Describa la solución..."></textarea>
        </div>
    `).join('');
}

function actualizarMonitorAdmin() {
    document.getElementById('monitor-lista').innerHTML = clientesNocturnos.map(c => `
        <div style="background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:5px;">
            ${c.Cliente} - <span style="color:#ff9f43;">PENDIENTE</span>
        </div>
    `).join('');
}
