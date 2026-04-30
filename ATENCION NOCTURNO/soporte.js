let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];

function checkLogin() {
    const pass = document.getElementById('pass-admin').value;
    if(pass === "admin123") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        actualizarMonitorAdmin();
    } else {
        alert("Contraseña incorrecta");
    }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    renderizarClientesTecnico();
}

// LÓGICA ADMINISTRADOR
function agregarCliente() {
    const nombreInput = document.getElementById('nombre-cliente');
    const nombre = nombreInput.value.trim();
    
    if(nombre) {
        clientesNocturnos.push({ 
            nombre: nombre, 
            concepto: "", 
            fecha: new Date().toLocaleString() 
        });
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        nombreInput.value = "";
        actualizarMonitorAdmin();
    }
}

function actualizarMonitorAdmin() {
    const lista = document.getElementById('monitor-lista');
    lista.innerHTML = "";
    
    clientesNocturnos.forEach(cliente => {
        const item = document.createElement('div');
        item.className = "monitor-item";
        // Si tiene contenido en concepto pone ✅, si no ❌
        const icono = cliente.concepto.trim() !== "" ? "✅" : "❌";
        item.innerHTML = `<span>${cliente.nombre}</span> <span>${icono}</span>`;
        lista.appendChild(item);
    });
}

// LÓGICA TÉCNICO
function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";

    if(clientesNocturnos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5;'>No hay clientes asignados.</p>";
        return;
    }

    clientesNocturnos.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3>👤 ${cliente.nombre}</h3>
            <textarea id="concepto-${index}" placeholder="Redacte el soporte...">${cliente.concepto}</textarea>
        `;
        contenedor.appendChild(div);
    });
}

function guardarTodoElSoporte() {
    let completo = true;

    clientesNocturnos.forEach((cliente, index) => {
        const texto = document.getElementById(`concepto-${index}`).value;
        clientesNocturnos[index].concepto = texto;
        if(texto.trim() === "") completo = false;
    });

    localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
    
    if(!completo) {
        alert("Atención: Algunos reportes están vacíos (se marcarán con ❌ para el admin).");
    } else {
        alert("✅ Todos los reportes guardados correctamente.");
    }
}

function logout() {
    window.location.href = "../index.html";
}
