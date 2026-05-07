import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, serverTimestamp, orderBy } from "firebase/firestore";

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
    onSnapshot(query(collection(db, "Administrador"), where("Estado", "==", "pendiente")), (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (panelAbierto === "admin") actualizarMonitorAdmin();
        if (panelAbierto === "tecnico") renderizarClientesTecnico();
    });

    onSnapshot(query(collection(db, "Soporte"), orderBy("Fecha", "desc")), (snapshot) => {
        historialNocturno = snapshot.docs.map(doc => doc.data());
        if (panelAbierto === "tecnico") mostrarHistorial();
    });
}

// Hacemos las funciones globales para que el HTML las encuentre
window.checkLogin = function() {
    if(document.getElementById('pass-admin').value === "SOPORTENOCTURNO") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        panelAbierto = "admin";
        iniciarSincronizacionRealTime();
    } else { alert("Contraseña incorrecta"); }
};

window.showUserPanel = function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    panelAbierto = "tecnico";
    iniciarSincronizacionRealTime();
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
    if(!tecnico) return alert("Por favor, ingrese su nombre de técnico.");
    
    let cambios = false;
    for (let i = 0; i < clientesNocturnos.length; i++) {
        const texto = document.getElementById(`texto-${i}`).value.trim();
        if(texto) {
            await addDoc(collection(db, "Soporte"), { 
                Cliente: clientesNocturnos[i].Cliente, 
                Solucion: texto, 
                Soporte: tecnico, 
                Fecha: serverTimestamp() 
            });
            await updateDoc(doc(db, "Administrador", clientesNocturnos[i].id), { 
                Estado: "Atendido", 
                SNV2: "JC" 
            });
            cambios = true;
        }
    }
    if(cambios) alert("Datos guardados correctamente.");
};

function renderizarClientesTecnico() {
    document.getElementById('lista-clientes-soporte').innerHTML = clientesNocturnos.map((c, i) => `
        <div class="soporte-card">
            <h4>Cliente: ${c.Cliente}</h4>
            <textarea id="texto-${i}" placeholder="Escriba la solución..."></textarea>
        </div>
    `).join('');
}

function actualizarMonitorAdmin() {
    document.getElementById('monitor-lista').innerHTML = clientesNocturnos.map(c => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin:5px; border-radius:5px; display:flex; justify-content:space-between;">
            <span>${c.Cliente}</span>
            <span style="color:#00c6ff;">PENDIENTE</span>
        </div>
    `).join('');
}

function mostrarHistorial() {
    document.getElementById('log-historial-nocturno').innerHTML = historialNocturno.map(h => `
        <div style="border-bottom:1px solid #444; padding:10px;">
            <b>${h.Cliente}</b> - ${h.Soporte}<br>
            <p>${h.Solucion}</p>
        </div>
    `).join('');
}
