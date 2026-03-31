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

    alert("✅ Registro guardado correctamente");
});
