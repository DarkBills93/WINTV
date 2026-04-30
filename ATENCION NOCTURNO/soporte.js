// Recuperamos datos guardados o iniciamos vacío
let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];

// 1. Manejo de Roles
function checkLogin() {
    const pass = document.getElementById('pass-admin').value;
    if(pass === "admin123") { // Cambia esta clave a tu gusto
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Contraseña de administrador incorrecta");
    }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    renderizarClientes();
}

// 2. Funciones de Administrador
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
        alert("Cliente añadido: " + nombre);
    } else {
        alert("Por favor ingrese un nombre");
    }
}

// 3. Funciones de Técnico (Dinámico)
function renderizarClientes() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";

    if(clientesNocturnos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5;'>No hay clientes asignados para hoy.</p>";
        return;
    }

    clientesNocturnos.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3 style="color: #fff; margin-bottom: 5px;">👤 ${cliente.nombre}</h3>
            <small style="color: #00c6ff; opacity: 0.7;">Asignado el: ${cliente.fecha}</small>
            <textarea id="concepto-${index}" placeholder="Redacte aquí el soporte realizado...">${cliente.concepto}</textarea>
            <button onclick="guardarSoporte(${index})" class="btn-guardar" style="margin-top:10px; padding: 8px 20px; font-size: 0.9em;">
                💾 Guardar para ${cliente.nombre}
            </button>
        `;
        contenedor.appendChild(div);
    });
}

function guardarSoporte(index) {
    const texto = document.getElementById(`concepto-${index}`).value;
    clientesNocturnos[index].concepto = texto;
    localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
    alert("Concepto guardado con éxito.");
}

// 4. Navegación
function logout() {
    // Regresa al archivo principal en la raíz
    window.location.href = "../index.html";
}
