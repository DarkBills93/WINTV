// Navegación
function irPagina(pagina) {
    window.location.href = pagina;
}

function volver() {
    window.location.href = "index.html";
}

// Formulario Planta
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPlanta");

    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const preformados = document.getElementById("preformados").value;
            const splitter = document.getElementById("splitter").value;
            const fibra = document.getElementById("fibra").value;

            const empalmadora = document.getElementById("empalmadora").checked;
            const manguitas = document.getElementById("manguitas").checked;
            const cortadora = document.getElementById("cortadora").checked;
            const fibraActiva = document.getElementById("fibraActiva").checked;

            const resultado = `
                <h3>Resumen:</h3>
                <p><b>Preformados:</b> ${preformados}</p>
                <p><b>Splitter:</b> ${splitter}</p>
                <p><b>Fibra:</b> ${fibra} hilos</p>
                <p><b>Equipos:</b> 
                ${empalmadora ? "Empalmadora, " : ""}
                ${manguitas ? "Manguitas, " : ""}
                ${cortadora ? "Cortadora, " : ""}
                ${fibraActiva ? "Fibra Activa" : ""}
                </p>
            `;

            document.getElementById("resultado").innerHTML = resultado;
        });
    }
});
