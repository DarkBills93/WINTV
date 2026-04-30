// Simulación de base de datos local
let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];

function checkLogin() {
    const pass = document.getElementById('pass-admin').value;
    if(pass === "admin123") { // Puedes cambiar la clave aquí
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        alert("Contraseña incorrecta");
    }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    renderizarClientes();
}

function agregarCliente() {
    const nombre = document.getElementById('nombre-cliente').value;
    if(nombre) {
        clientesNocturnos.push({ nombre: nombre, concepto: "" });
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        document.getElementById('nombre-cliente').value = "";
        alert("Cliente agregado a la lista nocturna");
    }
}

function renderizarClientes() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";

    clientesNocturnos.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3>👤 ${cliente.nombre}</h3>
            <textarea id="concepto-${index}" placeholder="Redacte lo que hizo..." 
                style="width:100%; height:80px; margin-top:10px; background:rgba(0,0,0,0.3); color:white; border-radius:8px; padding:10px; border:1px solid #7000ff;">${cliente.concepto}</textarea>
            <button onclick="guardarSoporte(${index})" class="btn-guardar" style="margin-top:10px; padding:5px 15px;">💾 Guardar Concepto</button>
        `;
        contenedor.appendChild(div);
    });
}

function guardarSoporte(index) {
    const concepto = document.getElementById(`concepto-${index}`).value;
    clientesNocturnos[index].concepto = concepto;
    localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
    alert(`Guardado con éxito para: ${clientesNocturnos[index].nombre}`);
}

function logout() {
    location.reload();
}
