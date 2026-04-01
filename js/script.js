document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPlanta");

    if (form) {
        cargarHistorial();

        form.addEventListener("submit", function(e) {
            e.preventDefault();

            // Validación simple: al menos un campo debe tener texto
            if(!document.getElementById("preformados").value && !document.getElementById("splitter").value) {
                alert("⚠️ Por favor, completa al menos los campos principales.");
                return;
            }

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

            alert("✅ Guardado correctamente");
        });
    }
});

// FUNCIÓN PARA VOLVER AL MENÚ
function volver() {
    // Asegúrate de que index.html sea tu archivo principal
    window.location.href = "index.html"; 
}

/* HISTORIAL */
function cargarHistorial() {
    const contenedor = document.getElementById("historial");
    const registros = JSON.parse(localStorage.getItem("planta")) || [];

    contenedor.innerHTML = "";

    // Invertimos el array para que lo más reciente aparezca arriba
    [...registros].reverse().forEach((item, index) => {
        // Calculamos el index real para la función eliminar
        const realIndex = registros.length - 1 - index;
        
        contenedor.innerHTML += `
            <div class="card">
                <p><b>📅 ${item.fecha}</b></p>
                <p><b>Materiales:</b> Preformados: ${item.preformados || '-'} | Splitter: ${item.splitter || '-'} | Hilos: ${item.fibra || '0'}</p>
                <p>
                    ${item.empalmadora ? "✔️ Empalmadora" : ""}
                    ${item.manguitas ? " ✔️ Manguitas" : ""}
                    ${item.cortadora ? " ✔️ Cortadora" : ""}
                    ${item.fibraActiva ? " ✔️ Fibra Activa" : ""}
                </p>
                <button onclick="eliminar(${realIndex})" style="background: #ff4d4d; margin-top:10px; padding: 5px 15px;">🗑 Eliminar</button>
            </div>
        `;
    });
}

/* ELIMINAR */
function eliminar(index) {
    if (!confirm("¿Eliminar este registro?")) return;

    let registros = JSON.parse(localStorage.getItem("planta")) || [];
    registros.splice(index, 1);
    localStorage.setItem("planta", JSON.stringify(registros));
    cargarHistorial();
}

/* EXPORTAR A EXCEL (Mejorado con XLSX) */
function exportarExcel() {
    let registros = JSON.parse(localStorage.getItem("planta")) || [];
    if (registros.length === 0) {
        alert("No hay datos para exportar");
        return;
    }

    // Convertir booleanos a texto para el Excel
    const datosProcesados = registros.map(r => ({
        Fecha: r.fecha,
        Preformados: r.preformados,
        Splitter: r.splitter,
        Hilos_Fibra: r.fibra,
        Empalmadora: r.empalmadora ? "SÍ" : "NO",
        Manguitas: r.manguitas ? "SÍ" : "NO",
        Cortadora: r.cortadora ? "SÍ" : "NO",
        Fibra_Activa: r.fibraActiva ? "SÍ" : "NO"
    }));

    const ws = XLSX.utils.json_to_sheet(datosProcesados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planta Externa");
    XLSX.writeFile(wb, "Reporte_Planta_Externa.xlsx");
}
