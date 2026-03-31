const form = document.getElementById("formAverias");
const historial = document.getElementById("historial");

document.addEventListener("DOMContentLoaded", mostrarHistorial);

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const registro = {
        fecha: new Date().toLocaleString(),
        conectorMecanico: document.getElementById("conectorMecanico").value || 0,
        rg6: document.getElementById("rg6").value || 0,
        coaxial: document.getElementById("coaxial").value || 0,
        drop: document.getElementById("drop").value || 0,
        fuente: document.getElementById("fuente").value || 0,
        router: document.getElementById("router").value || 0,
        grapas: document.getElementById("grapas").checked,
        wincha: document.getElementById("wincha").checked,
        empalmadora: document.getElementById("empalmadora").checked,
        manguitas: document.getElementById("manguitas").checked,
        cortadora: document.getElementById("cortadora").checked,
        tester: document.getElementById("tester").checked
    };

    let datos = JSON.parse(localStorage.getItem("averias")) || [];
    datos.push(registro);
    localStorage.setItem("averias", JSON.stringify(datos));

    form.reset();
    mostrarHistorial();
});

function mostrarHistorial() {
    let datos = JSON.parse(localStorage.getItem("averias")) || [];
    historial.innerHTML = "";

    if (datos.length === 0) {
        historial.innerHTML = "<p>No hay registros guardados.</p>";
        return;
    }

    datos.forEach((item, index) => {
        historial.innerHTML += `
            <div class="registro-item">
                <strong>Registro ${index + 1}</strong><br>
                Fecha: ${item.fecha}<br>
                Conectores Mecánicos: ${item.conectorMecanico}<br>
                RG6: ${item.rg6}<br>
                Coaxial: ${item.coaxial} m<br>
                Drop: ${item.drop} m<br>
                Fuente: ${item.fuente}<br>
                Router / Modem: ${item.router}<br>
                Grapas: ${item.grapas ? "Sí" : "No"}<br>
                Wincha: ${item.wincha ? "Sí" : "No"}<br>
                Empalmadora: ${item.empalmadora ? "Sí" : "No"}<br>
                Manguitas: ${item.manguitas ? "Sí" : "No"}<br>
                Cortadora: ${item.cortadora ? "Sí" : "No"}<br>
                Tester: ${item.tester ? "Sí" : "No"}
            </div>
            <hr>
        `;
    });
}

function volver() {
    window.location.href = "../index.html";
}
