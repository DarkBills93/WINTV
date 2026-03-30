function volver() {
    window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("instamat");
    const registroDiv = document.getElementById("registro");

    mostrarRegistros();

    form.addEventListener("submit", function (e) {
        e.preventDefault();


        let mecanico = document.getElementById("mecanico").value;
        let rg6 = document.getElementById("rg6").value;
        let coaxial = document.getElementById("coaxial").value;
        let drop = document.getElementById("drop").value;

        let contrato = document.getElementById("contrato").checked;
        let grapas = document.getElementById("grapas").checked;
        let duo = document.getElementById("duo").checked;
        let internet = document.getElementById("internet").checked;
        let cable = document.getElementById("cable").checked;
        let wincha = document.getElementById("wincha").checked;
       
        let ahora = new Date();

        let datos = {
            mecanico,
            rg6,
            coaxial,
            drop,
            contrato,
            grapas,
            duo,
            internet,
            cable,
            wincha,
            fecha: ahora.toLocaleDateString("es-PE"),
            hora: ahora.toLocaleTimeString("es-PE")
        };

        let registros = JSON.parse(localStorage.getItem("registros")) || [];

        registros.push(datos);
        localStorage.setItem("registros", JSON.stringify(registros));

        mostrarRegistros();

        form.reset();
    });

    function mostrarRegistros() {
        let registros = JSON.parse(localStorage.getItem("registros")) || [];

        registroDiv.innerHTML = "";

        registros.forEach((item, index) => {
            registroDiv.innerHTML += `
                <div style="margin-bottom:15px; padding:10px; background:rgba(255,255,255,0.1); border-radius:10px;">
                    
                    <strong>Registro #${index + 1}</strong>
                    
                    <p><strong>Fecha:</strong> ${item.fecha || "No disponible"}</p>
                    <p><strong>Hora:</strong> ${item.hora || "No disponible"}</p>

                    <p><strong>Conectores Mecánicos:</strong> ${item.mecanico || "No ingresado"}</p>
                    <p><strong>Conectores RG6:</strong> ${item.rg6 || "No ingresado"}</p>
                    <p><strong>Cable Coaxial:</strong> ${item.coaxial || "No ingresado"}</p>
                    <p><strong>Fibra Drop:</strong> ${item.drop || "No ingresado"}</p>

                    <p><strong>Contrato</strong> ${item.contrato ? "Sí" : "No"}</p>
                    <p><strong>Grapas:</strong> ${item.grapas ? "Sí" : "No"}</p>
                    <p><strong>Equipos Duo:</strong> ${item.duo ? "Sí" : "No"}</p>
                    <p><strong>Equipos solo Internet:</strong> ${item.internet ? "Sí" : "No"}</p>
                    <p><strong>Equipos solo Cable: </strong> ${item.cable ? "Sí" : "No"}</p>
                    <p><strong>Wincha:</strong> ${item.wincha ? "Sí" : "No"}</p>

                    <button onclick="eliminarRegistro(${index})">Eliminar</button>
                </div>
            `;
        });
    }

});


function eliminarRegistro(index) {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    registros.splice(index, 1);

    localStorage.setItem("registros", JSON.stringify(registros));

    location.reload();
}


function exportarCSV() {
    let registros = JSON.parse(localStorage.getItem("registros")) || [];

    if (registros.length === 0) {
        alert("No hay datos para exportar");
        return;
    }

    let csv = "\uFEFF";

    csv += "Fecha;Hora;Mecánicos;RG6;Coaxial;Drop;Contrato;Grapas;Duo;Internet;Cable;Wincha\n";

    registros.forEach(item => {

        let mecanico = item.mecanico || "0";
        let rg6 = item.rg6 || "0";
        let coaxial = item.coaxial || "0";
        let drop = item.drop || "0";

        let contrato = item.contrato ? "Sí" : "No";
        let grapas = item.grapas ? "Sí" : "No";
        let duo = item.duo ? "Sí" : "No";
        let internet = item.internet ? "Sí" : "No";
        let cable = item.cable ? "Sí" : "No";
        let wincha = item.wincha ? "Sí" : "No";

        csv += `${item.fecha};${item.hora};${mecanico};${rg6};${coaxial};${drop};${contrato};${grapas};${duo};${internet};${cable};${wincha}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "reporte_instalaciones.csv";
    a.click();
}