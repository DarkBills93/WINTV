const form = document.getElementById("formAverias");
const historial = document.getElementById("historial");

document.addEventListener("DOMContentLoaded", mostrarHistorial);

// Funciones helper (código limpio)
function getValue(id) {
    return document.getElementById(id).value || 0;
}

function getCheck(id) {
    return document.getElementById(id).checked;
}

// Evitar doble click
let bloqueado = false;

form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (bloqueado) return;
    bloqueado = true;
    setTimeout(() => bloqueado = false, 1000);

    // Validación
    if (
        !getValue("conectorMecanico") &&
        !getValue("rg6") &&
        !getValue("coaxial") &&
        !getValue("drop") &&
        !getValue("fuente") &&
        !getValue("router")
    ) {
        alert("Debes ingresar al menos un material");
        return;
    }

    const registro = {
        fecha: new Date().toLocaleString(),
        conectorMecanico: getValue("conectorMecanico"),
        rg6: getValue("rg6"),
        coaxial: getValue("coaxial"),
        drop: getValue("drop"),
        fuente: getValue("fuente"),
        router: getValue("router"),
        grapas: getCheck("grapas"),
        wincha: getCheck("wincha"),
        empalmadora: getCheck("empalmadora"),
        manguitas: getCheck("manguitas"),
        cortadora: getCheck("cortadora"),
        tester: getCheck("tester")
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

    // 👉 Mostrar totales primero
   
    mostrarGrafico(datos);

    if (datos.length === 0) {
        historial.innerHTML = "<p>No hay registros guardados.</p>";
        return;
    }

    let html = "";

    datos.slice().reverse().forEach((item) => {
        html += `
        <div class="registro-item">
            <strong>📅 ${item.fecha}</strong><br>
            🔌 Mecánicos: ${item.conectorMecanico} | RG6: ${item.rg6}<br>
            📏 Coaxial: ${item.coaxial}m | Drop: ${item.drop}m<br>
            ⚡ Fuente: ${item.fuente} | Router: ${item.router}<br>
            🧰 
            ${item.grapas ? "Grapas " : ""}
            ${item.wincha ? "Wincha " : ""}
            ${item.empalmadora ? "Empalmadora " : ""}
            ${item.manguitas ? "Manguitas " : ""}
            ${item.cortadora ? "Cortadora " : ""}
            ${item.tester ? "Tester " : ""}
        </div>
        `;
    });

    historial.innerHTML = html;
}

function borrarHistorial() {
    if (confirm("¿Seguro que quieres borrar todo?")) {
        localStorage.removeItem("averias");
        mostrarHistorial();
    }
}

function volver() {
    window.location.href = "../index.html";
}