console.log('%c🔧 Sistema Averías', 'color:#00c6ff; font-size:18px; font-weight:bold');

let chart;

/* ───── UTILIDADES ───── */
function volver() {
    window.location.href = "../index.html";
}

function getData() {
    return JSON.parse(localStorage.getItem("averias")) || [];
}

function saveData(data) {
    localStorage.setItem("averias", JSON.stringify(data));
}

function si(v) { return v ? "Sí" : "No"; }

function val(v, unidad) {
    if (!v && v !== 0) return "—";
    return unidad ? v + " " + unidad : v;
}

/* ───── INIT ───── */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAverias");

    mostrarTodo(getData());

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const registro = {
            conectorMecanico: document.getElementById("conectorMecanico").value,
            rg6: document.getElementById("rg6").value,
            coaxial: document.getElementById("coaxial").value,
            drop: document.getElementById("drop").value,
            fuente: document.getElementById("fuente").value,
            router: document.getElementById("router").value,

            grapas: document.getElementById("grapas").checked,
            wincha: document.getElementById("wincha").checked,
            empalmadora: document.getElementById("empalmadora").checked,
            manguitas: document.getElementById("manguitas").checked,
            cortadora: document.getElementById("cortadora").checked,
            tester: document.getElementById("tester").checked,

            fechaISO: new Date().toISOString(), // 🔥 clave para filtrar bien
            fecha: new Date().toLocaleDateString("es-PE"),
            hora: new Date().toLocaleTimeString("es-PE")
        };

        const datos = getData();
        datos.push(registro);
        saveData(datos);

        form.reset();
        mostrarTodo(datos);
    });
});

/* ───── MOSTRAR TODO ───── */
function mostrarTodo(datos) {
    mostrarHistorial(datos);
    mostrarTotales(datos);
    mostrarGrafico(datos);
}

/* ───── HISTORIAL ───── */
function mostrarHistorial(datos) {
    const historial = document.getElementById("historial");

    if (!datos.length) {
        historial.innerHTML = "<p>Sin registros</p>";
        return;
    }

    historial.innerHTML = datos.slice().reverse().map((item, index) => `
        <div class="registro-item">
            <div class="reg-header">
                <strong>#${index + 1}</strong>
                <span>${item.fecha} ${item.hora}</span>
                <button class="btn-del" onclick="eliminarRegistro(${datos.length - 1 - index})">X</button>
            </div>

            <div class="reg-grid">
                <div class="reg-row"><span>Mec:</span> ${val(item.conectorMecanico)}</div>
                <div class="reg-row"><span>RG6:</span> ${val(item.rg6)}</div>
                <div class="reg-row"><span>Coax:</span> ${val(item.coaxial,"m")}</div>
                <div class="reg-row"><span>Drop:</span> ${val(item.drop,"m")}</div>
                <div class="reg-row"><span>Fuente:</span> ${val(item.fuente)}</div>
                <div class="reg-row"><span>Router:</span> ${val(item.router)}</div>

                <div class="reg-row"><span>Grapas:</span> ${si(item.grapas)}</div>
                <div class="reg-row"><span>Wincha:</span> ${si(item.wincha)}</div>
                <div class="reg-row"><span>Emp:</span> ${si(item.empalmadora)}</div>
                <div class="reg-row"><span>Mang:</span> ${si(item.manguitas)}</div>
                <div class="reg-row"><span>Cort:</span> ${si(item.cortadora)}</div>
                <div class="reg-row"><span>Tester:</span> ${si(item.tester)}</div>
            </div>
        </div>
    `).join("");
}

/* ───── TOTALES ───── */
function mostrarTotales(datos) {
    const t = {
        mec: 0, rg6: 0, coax: 0, drop: 0, fuente: 0, router: 0
    };

    datos.forEach(r => {
        t.mec += Number(r.conectorMecanico) || 0;
        t.rg6 += Number(r.rg6) || 0;
        t.coax += Number(r.coaxial) || 0;
        t.drop += Number(r.drop) || 0;
        t.fuente += Number(r.fuente) || 0;
        t.router += Number(r.router) || 0;
    });

    document.getElementById("totales").innerHTML = `
        <div class="total-item">Mec: ${t.mec}</div>
        <div class="total-item">RG6: ${t.rg6}</div>
        <div class="total-item">Coax: ${t.coax} m</div>
        <div class="total-item">Drop: ${t.drop} m</div>
        <div class="total-item">Fuente: ${t.fuente}</div>
        <div class="total-item">Router: ${t.router}</div>
    `;
}

/* ───── GRÁFICO ───── */
function mostrarGrafico(datos) {
    const ctx = document.getElementById("graficoMateriales");

    const t = {
        mec: 0, rg6: 0, coax: 0, drop: 0, fuente: 0, router: 0
    };

    datos.forEach(r => {
        t.mec += Number(r.conectorMecanico) || 0;
        t.rg6 += Number(r.rg6) || 0;
        t.coax += Number(r.coaxial) || 0;
        t.drop += Number(r.drop) || 0;
        t.fuente += Number(r.fuente) || 0;
        t.router += Number(r.router) || 0;
    });

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Mecánicos", "RG6", "Coaxial", "Drop", "Fuente", "Router"],
            datasets: [{
                label: "Uso total",
                data: [t.mec, t.rg6, t.coax, t.drop, t.fuente, t.router],
                backgroundColor: ["#00c6ff","#36a2eb","#ff6384","#ffce56","#4bc0c0","#9966ff"]
            }]
        }
    });
}

/* ───── FILTRO ───── */
function filtrarPorFecha() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    let datos = getData();

    const filtrados = datos.filter(item => {
        const fecha = new Date(item.fechaISO);
        return (!inicio || fecha >= new Date(inicio)) &&
               (!fin || fecha <= new Date(fin));
    });

    mostrarTodo(filtrados);
}

function limpiarFiltro() {
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";
    mostrarTodo(getData());
}

/* ───── ELIMINAR ───── */
function eliminarRegistro(i) {
    let data = getData();
    data.splice(i, 1);
    saveData(data);
    mostrarTodo(data);
}

function borrarHistorial() {
    if (!confirm("¿Borrar todo?")) return;
    localStorage.removeItem("averias");
    mostrarTodo([]);
}

/* ───── EXCEL ───── */
function exportarExcel() {
    const datos = getData();
    if (!datos.length) return alert("No hay datos");

    const limpio = datos.map(d => ({
        Fecha: d.fecha,
        Hora: d.hora,
        Mecánicos: d.conectorMecanico,
        RG6: d.rg6,
        Coaxial: d.coaxial,
        Drop: d.drop,
        Fuente: d.fuente,
        Router: d.router
    }));

    const hoja = XLSX.utils.json_to_sheet(limpio);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Averias");

    XLSX.writeFile(libro, "reporte_averias.xlsx");
}