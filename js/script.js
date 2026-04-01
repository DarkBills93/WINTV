document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPlanta");
    if (form) {
        cargarHistorial();
        form.addEventListener("submit", (e) => {
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
            alert("✅ Registro Guardado");
        });
    }
});

function cargarHistorial() {
    const contenedor = document.getElementById("historial");
    const registros = JSON.parse(localStorage.getItem("planta")) || [];
    contenedor.innerHTML = "";
    [...registros].reverse().forEach((item, index) => {
        const realIdx = registros.length - 1 - index;
        contenedor.innerHTML += `
            <div class="card">
                <p><strong>📅 ${item.fecha}</strong></p>
                <p>Mat: ${item.preformados} | Spl: ${item.splitter} | Hilos: ${item.fibra}</p>
                <p>${item.empalmadora ? "✔️ Empalmadora " : ""}${item.manguitas ? "✔️ Manguitas " : ""}${item.cortadora ? "✔️ Cortadora " : ""}${item.fibraActiva ? "✔️ Activa" : ""}</p>
                <button onclick="eliminar(${realIdx})" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">🗑 Eliminar</button>
            </div>`;
    });
}

function eliminar(index) {
    if (!confirm("¿Eliminar registro?")) return;
    let registros = JSON.parse(localStorage.getItem("planta")) || [];
    registros.splice(index, 1);
    localStorage.setItem("planta", JSON.stringify(registros));
    cargarHistorial();
}

// FUNCIÓN DE EXCEL CORREGIDA
function exportarExcel() {
    const registros = JSON.parse(localStorage.getItem("planta")) || [];
    if (registros.length === 0) return alert("No hay datos");
    const ws = XLSX.utils.json_to_sheet(registros.map(r => ({
        Fecha: r.fecha,
        Preformados: r.preformados,
        Splitter: r.splitter,
        Fibra: r.fibra,
        Empalmadora: r.empalmadora ? "SÍ" : "NO",
        Manguitas: r.manguitas ? "SÍ" : "NO",
        Cortadora: r.cortadora ? "SÍ" : "NO",
        Fibra_Activa: r.fibraActiva ? "SÍ" : "NO"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materiales");
    XLSX.writeFile(wb, "Reporte_Planta.xlsx");
}

function volver() { window.location.href = "index.html"; }
