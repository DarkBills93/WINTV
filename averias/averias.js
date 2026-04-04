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
    window.location.href = "index.html";
}

function exportarExcel() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    let datos = JSON.parse(localStorage.getItem("averias")) || [];

    const filtrados = datos.filter(item => {
        const fechaItem = new Date(item.fecha);
        const fechaInicio = inicio ? new Date(inicio) : null;
        const fechaFin = fin ? new Date(fin) : null;

        return (
            (!fechaInicio || fechaItem >= fechaInicio) &&
            (!fechaFin || fechaItem <= fechaFin)
        );
    });

    if (filtrados.length === 0) {
        alert("No hay datos en ese rango");
        return;
    }

    const datosExcel = filtrados.map(item => ({
        Fecha: item.fecha,
        Mecánicos: item.conectorMecanico,
        RG6: item.rg6,
        Coaxial: item.coaxial,
        Drop: item.drop,
        Fuente: item.fuente,
        Router: item.router
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Filtrado");

    const fecha = new Date().toISOString().split("T")[0];
    XLSX.writeFile(libro, `reporte_filtrado_${fecha}.xlsx`);
}

function filtrarPorFecha() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    let datos = JSON.parse(localStorage.getItem("averias")) || [];

    if (!inicio && !fin) {
        mostrarHistorial();
        return;
    }

    const filtrados = datos.filter(item => {
        const fechaItem = new Date(item.fecha);
        const fechaInicio = inicio ? new Date(inicio) : null;
        const fechaFin = fin ? new Date(fin) : null;

        return (
            (!fechaInicio || fechaItem >= fechaInicio) &&
            (!fechaFin || fechaItem <= fechaFin)
        );
    });

    mostrarHistorialFiltrado(filtrados);
   mostrarTotales(filtrados);
    mostrarGrafico(filtrados);
}

function mostrarHistorialFiltrado(datos) {
    historial.innerHTML = "";

    if (datos.length === 0) {
        historial.innerHTML = "<p>No hay registros en ese rango.</p>";
        return;
    }

    datos.slice().reverse().forEach(item => {
        historial.innerHTML += `
        <div class="registro-item">
            <strong>📅 ${item.fecha}</strong><br>
            🔌 Mecánicos: ${item.conectorMecanico} | RG6: ${item.rg6}<br>
            📏 Coaxial: ${item.coaxial}m | Drop: ${item.drop}m<br>
            ⚡ Fuente: ${item.fuente} | Router: ${item.router}<br>
        </div>
        `;
    });
}

function limpiarFiltro() {
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";
    mostrarHistorial();
}

function calcularTotales(datos) {
    let totales = {
        conectorMecanico: 0,
        rg6: 0,
        coaxial: 0,
        drop: 0,
        fuente: 0,
        router: 0
    };

    datos.forEach(item => {
        totales.conectorMecanico += Number(item.conectorMecanico);
        totales.rg6 += Number(item.rg6);
        totales.coaxial += Number(item.coaxial);
        totales.drop += Number(item.drop);
        totales.fuente += Number(item.fuente);
        totales.router += Number(item.router);
    });

    return totales;
}

function mostrarTotales(datos) {
    const totalesDiv = document.getElementById("totales");
    const t = calcularTotales(datos);

    totalesDiv.innerHTML = `
        <div class="total-item">🔌 Mecánicos: ${t.conectorMecanico}</div>
        <div class="total-item">📡 RG6: ${t.rg6}</div>
        <div class="total-item">📏 Coaxial: ${t.coaxial} m</div>
        <div class="total-item">🧵 Drop: ${t.drop} m</div>
        <div class="total-item">⚡ Fuente: ${t.fuente}</div>
        <div class="total-item">📶 Router: ${t.router}</div>
    `;
}

let chart; // variable global

function mostrarGrafico(datos) {
    const ctx = document.getElementById("graficoMateriales");

    const totales = calcularTotales(datos);

    const data = {
        labels: [
            "Mecánicos",
            "RG6",
            "Coaxial",
            "Drop",
            "Fuente",
            "Router"
        ],
        datasets: [{
            label: "Cantidad usada",
            data: [
                totales.conectorMecanico,
                totales.rg6,
                totales.coaxial,
                totales.drop,
                totales.fuente,
                totales.router
            ],
            borderWidth: 1
        }]
    };

    if (chart) {
        chart.destroy(); // evita duplicados
    }

    chart = new Chart(ctx, {
        type: "bar", // puedes cambiar a pie, line, etc.
        data: data,
        options: {
            responsive: true
        }
    });
}