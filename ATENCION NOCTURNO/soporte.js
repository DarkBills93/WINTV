let clientesNocturnos = JSON.parse(localStorage.getItem('clientesNocturnos')) || [];
let historialNocturno = JSON.parse(localStorage.getItem('historialNocturno')) || [];

// 1. CONTROL DE ACCESO
function checkLogin() {
    const pass = document.getElementById('pass-admin').value;
    if(pass === "admin123") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        actualizarMonitorAdmin();
    } else { alert("Contraseña incorrecta"); }
}

function showUserPanel() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('user-panel').classList.remove('hidden');
    renderizarClientesTecnico();
    mostrarHistorial();
}

// 2. LÓGICA ADMINISTRADOR
function agregarCliente() {
    const nombreInput = document.getElementById('nombre-cliente');
    const nombre = nombreInput.value.trim();
    if(nombre) {
        clientesNocturnos.push({ 
            nombre: nombre, 
            concepto: "", 
            fechaAsignada: new Date().toLocaleString() 
        });
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        nombreInput.value = "";
        actualizarMonitorAdmin();
    }
}

function actualizarMonitorAdmin() {
    const lista = document.getElementById('monitor-lista');
    lista.innerHTML = "";
    clientesNocturnos.forEach((cliente, index) => {
        const item = document.createElement('div');
        item.className = "monitor-item";
        const icono = (cliente.concepto && cliente.concepto.trim() !== "") ? "✅" : "❌";
        item.innerHTML = `
            <span>👤 ${cliente.nombre}</span>
            <div>
                <span style="margin-right: 15px;">${icono}</span>
                <button onclick="eliminarPendiente(${index})" class="btn-delete">🗑️</button>
            </div>`;
        lista.appendChild(item);
    });
}

function eliminarPendiente(index) {
    if(confirm("¿Eliminar este usuario de la lista de pendientes?")) {
        clientesNocturnos.splice(index, 1);
        localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos));
        actualizarMonitorAdmin();
    }
}

// 3. LÓGICA TÉCNICO
function renderizarClientesTecnico() {
    const contenedor = document.getElementById('lista-clientes-soporte');
    contenedor.innerHTML = "";
    if(clientesNocturnos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; opacity:0.5;'>No hay usuarios pendientes de soporte.</p>";
        return;
    }
    clientesNocturnos.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = "soporte-card";
        div.innerHTML = `
            <h3>👤 ${cliente.nombre}</h3>
            <textarea id="concepto-${index}" placeholder="Redacte el soporte realizado...">${cliente.concepto}</textarea>
        `;
        contenedor.appendChild(div);
    });
}

function guardarTodoElSoporte() {
    const tecnico = document.getElementById('nombre-tecnico').value.trim();
    if(!tecnico) { alert("Por favor, ingrese su nombre de técnico."); return; }

    let atencionesEfectuadas = [];
    clientesNocturnos.forEach((cliente, index) => {
        const texto = document.getElementById(`concepto-${index}`).value;
        clientesNocturnos[index].concepto = texto;
        if(texto.trim() !== "") {
            atencionesEfectuadas.push({ usuario: cliente.nombre, reporte: texto });
        }
    });

    if(atencionesEfectuadas.length === 0) { alert("Debe redactar al menos un reporte."); return; }

    const nuevoRegistro = {
        tecnico: tecnico,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        atenciones: atencionesEfectuadas
    };

    historialNocturno.push(nuevoRegistro);
    localStorage.setItem('historialNocturno', JSON.stringify(historialNocturno));
    localStorage.setItem('clientesNocturnos', JSON.stringify(clientesNocturnos)); // Sincroniza conceptos con el admin
    
    alert("✅ Registro guardado exitosamente.");
    mostrarHistorial();
}

function mostrarHistorial() {
    const contenedor = document.getElementById('log-historial-nocturno');
    contenedor.innerHTML = "";
    
    // Mostramos del más reciente al más antiguo
    [...historialNocturno].reverse().forEach((log, index) => {
        const div = document.createElement('div');
        div.className = "soporte-card historial-item";
        
        let listaAtenciones = log.atenciones.map(a => `<li><b>${a.usuario}:</b> ${a.reporte}</li>`).join("");

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
                <span style="color:#00c6ff; font-size:0.9em;">📅 ${log.fecha} - ⏰ ${log.hora}</span>
                <button onclick="eliminarHistorial(${historialNocturno.length - 1 - index})" class="btn-delete">🗑️</button>
            </div>
            <h3 style="color:#fff; margin-bottom:10px;">Atendido por: <span style="color:#7000ff;">${log.tecnico}</span></h3>
            <ul style="color:#ccc; font-size:0.95em; line-height:1.4;">${listaAtenciones}</ul>
        `;
        contenedor.appendChild(div);
    });
}

function eliminarHistorial(index) {
    if(confirm("¿Desea eliminar este registro del historial?")) {
        historialNocturno.splice(index, 1);
        localStorage.setItem('historialNocturno', JSON.stringify(historialNocturno));
        mostrarHistorial();
    }
}

function logout() { window.location.href = "../index.html"; }
