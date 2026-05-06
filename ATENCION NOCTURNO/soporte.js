import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

// 1. Tu Configuración de Firebase
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

// 2. ESCUCHA EN TIEMPO REAL (Reemplaza a setInterval)
// Firebase es tan rápido que no necesitas consultar cada 5 segundos,
// se actualiza solo cuando hay un cambio.
function iniciarSincronizacionRealTime() {
    // Escuchar Pendientes en la colección Administrador
    const qPendientes = query(collection(db, "Administrador"), where("Estado", "==", "pendiente"));
    onSnapshot(qPendientes, (snapshot) => {
        clientesNocturnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (panelAbierto === "admin") actualizarMonitorAdmin();
        if (panelAbierto === "tecnico") renderizarClientesTecnico();
    });

    // Escuchar Historial en la colección Soporte
    const qHistorial = query(collection(db, "Soporte"), orderBy("Fecha", "desc"));
    onSnapshot(qHistorial, (snapshot) => {
        historialNocturno = snapshot.docs.map(doc => doc.data());
        if (panelAbierto === "tecnico") mostrarHistorial();
    });
}

// 3. LÓGICA ADMINISTRADOR (Crear Ticket)
async function agregarCliente() {
    const input = document.getElementById('nombre-cliente');
    const nombre = input.value.trim().toUpperCase();
    
    if(nombre) {
        try {
            await addDoc(collection(db, "Administrador"), {
                Cliente: nombre,
                Estado: "pendiente",
                Fecha: serverTimestamp(), // Hora oficial de Firebase
                SNV2: "Pendiente"
            });
            input.value = "";
        } catch (error) {
            console.error("Error al registrar:", error);
            alert("Error al registrar cliente.");
        }
    }
}

// 4. LÓGICA TÉCNICO (Guardar Atención)
async function guardarTodoElSoporte() {
    const tecnicoNombre = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnicoNombre) { alert("Por favor, ingrese su nombre de técnico."); return; }

    let huboCambio = false;

    for (let i = 0; i < clientesNocturnos.length; i++) {
        const textoArea = document.getElementById(`texto-${i}`);
        const datosCliente = clientesNocturnos[i];
        
        if(textoArea && textoArea.value.trim() !== "") {
            const solucionText = textoArea.value.trim();

            try {
                // A. Guardar en Colección SOPORTE (Historial)
                await addDoc(collection(db, "Soporte"), {
                    Cliente: datosCliente.Cliente,
                    Fecha: serverTimestamp(),
                    Solucion: solucionText,
                    Soporte: tecnicoNombre
                });

                // B. Actualizar Colección ADMINISTRADOR (Marcar como atendido)
                const docRef = doc(db, "Administrador", datosCliente.id);
                await updateDoc(docRef, {
                    Estado: "Atendido",
                    SNV2: "JC" // O el código que desees para identificar la versión
                });

                huboCambio = true;
            } catch (error) {
                console.error("Error procesando:", error);
            }
        }
    }

    if(huboCambio) alert("✅ Guardado correctamente en Firebase.");
}

// 5. CONTROL DE PANELES (Modificados para activar tiempo real)
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

// Nota: Las funciones renderizarClientesTecnico, mostrarHistorial y actualizarMonitorAdmin 
// se mantienen casi iguales, solo asegúrate de que usen las mayúsculas: 
// Ejemplo: c.Cliente en lugar de c.usuario.
