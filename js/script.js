document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPlanta");
    if (form) {
        cargarHistorial();
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const registro = {
                preformados: document.getElementById("preformados").value,
                splitter: document.getElementById("splitter").value,
                fibra: document.getElementById("fibra").value,
                empalmadora: document.getElementById("empalmadora").checked,
                manguitas: document.getElementById("manguitas").checked,
                cortadora: document.getElementById("cortadora").checked,
                fibraActiva: document.getElementById("fibraActiva").checked,
                fecha: new Date().toLocaleString()
            };
            let datos = JSON.parse(localStorage.getItem("planta")) || [];
            datos.push(registro);
            localStorage.setItem("planta", JSON.stringify(datos));
            form.reset();
            cargarHistorial();
        });
    }
});

function cargarHistorial() {
    const lista = document.getElementById("historial");
    const datos = JSON.parse(localStorage.getItem("planta")) || [];
    lista.innerHTML = "";
    [...datos].reverse().forEach((item, index) => {
        const originalIdx = datos.length - 1 - index;
        lista.innerHTML += `
            <div class="card">
                <p><strong>📅 ${item.fecha}</strong></p>
                <p>Mat: ${item.preformados} | Spl: ${item.splitter} | Fibra: ${item.fibra}</p>
                <p>${item.empalmadora ? "✔️ Empalmadora " : ""}${item.manguitas ? "✔️ Manguitas " : ""}${item.cortadora ? "✔️ Cortadora " : ""}${item.fibraActiva ? "✔️ Activa" : ""}</p>
                <button onclick="eliminar(${originalIdx})" style="color:#ff4d4d; background:none; border:none; cursor:pointer; margin-top:5px;">🗑 Eliminar</button>
            </div>`;
    });
}

function eliminar(index) {
    let datos = JSON.parse(localStorage.getItem("planta")) || [];
    datos.splice(index, 1);
    localStorage.setItem("planta", JSON.stringify(datos));
    cargarHistorial();
}

function exportarExcel() {
    const datos = JSON.parse(localStorage.getItem("planta")) || [];
    if (datos.length === 0) return alert("No hay datos para exportar");
    
    const ws = XLSX.utils.json_to_sheet(datos.map(r => ({
        Fecha: r.fecha,
        Preformados: r.preformados,
        Splitter: r.splitter,
        Fibra: r.fibra,
        Empalmadora: r.empalmadora ? "SÍ" : "NO",
        Manguitas: r.manguitas ? "SÍ" : "NO",
        Cortadora: r.cortadora ? "SÍ" : "NO",
        FibraActiva: r.fibraActiva ? "SÍ" : "NO"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materiales Planta");
    XLSX.writeFile(wb, "Reporte_Planta_Externa.xlsx");
}

function volver() { window.location.href = "index.html"; }
