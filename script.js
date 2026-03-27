// Navegación
function irPagina(pagina) {
    window.location.href = pagina;
}

function volver() {
    window.location.href = "index.html";
}

// Guardar datos
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPlanta");

    if (form) {
        cargarHistorial();

        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const data = {
                preformados: document.getElementById("preformados").value,
                splitter: document.getElementById("splitter").value,
                fibra: document.getElementById("fibra").value,
                empalmadora: document.getElementById("empalmadora").checked,
                manguitas: document.getElementById("manguitas").checked,
                cortadora: document.getElementById("cortadora").checked,
                fibraActiva: document.getElementById("fibraActiva").checked,
                fecha: new Date().toLocaleString()
            };

            let registros = JSON.parse(localStorage.getItem("planta")) || [];
            registros.push(data);
            localStorage.setItem("planta", JSON.stringify(registros));

            form.reset();
            cargarHistorial();
        });
    }
});

// Mostrar historial
function cargarHistorial() {
    const contenedor = document.getElementById("historial");
    const registros = JSON.parse(localStorage.getItem("planta")) || [];

    contenedor.innerHTML = "";

    registros.forEach((item, index) => {
        contenedor.innerHTML += `
            <div class="card">
                <p><b>Fecha:</b> ${item.fecha}</p>
                <p>Preformados: ${item.preformados}</p>
                <p>Splitter: ${item.splitter}</p>
                <p>Fibra: ${item.fibra}</p>
                <p>
                    ${item.empalmadora ? "Empalmadora ✔️" : ""}
                    ${item.manguitas ? " Manguitas ✔️" : ""}
                    ${item.cortadora ? " Cortadora ✔️" : ""}
                    ${item.fibraActiva ? " Fibra Activa ✔️" : ""}
                </p>
                <button onclick="eliminar(${index})">🗑 Eliminar</button>
            </div>
        `;
    });
}

// Eliminar registro
function eliminar(index) {
    let registros = JSON.parse(localStorage.getItem("planta")) || [];
    registros.splice(index, 1);
    localStorage.setItem("planta", JSON.stringify(registros));
    cargarHistorial();
}
