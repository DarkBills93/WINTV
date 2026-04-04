
console.log('%c🔧 ¡Hola!', 'color: #ff6b6b; font-size: 20px; font-weight: bold');
console.log('%cCreador: Dany CB.', 'color: #0f3bcc; font-size: 14px');

function volver() {
    window.location.href = "../index.html";
}

function getData() {
    try {
        return JSON.parse(localStorage.getItem("registros")) || [];
    } catch (e) {
        return [];
    }
}

function saveData(data) {
    localStorage.setItem("registros", JSON.stringify(data));
}

function si(v) { return v ? "Sí" : "No"; }

function val(v, unidad) {
    if (!v && v !== 0) return "—";
    return unidad ? v + " " + unidad : v;
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("instamat");
    mostrarRegistros();

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const mecanico = document.getElementById("mecanico").value;
        const rg6      = document.getElementById("rg6").value;
        const coaxial  = document.getElementById("coaxial").value;
        const drop     = document.getElementById("drop").value;

        const contrato = document.getElementById("contrato").checked;
        const grapas   = document.getElementById("grapas").checked;
        const duo      = document.getElementById("duo").checked;
        const internet = document.getElementById("internet").checked;
        const cable    = document.getElementById("cable").checked;
        const wincha   = document.getElementById("wincha").checked;

        const ahora = new Date();

        const datos = {
            mecanico, rg6, coaxial, drop,
            contrato, grapas, duo, internet, cable, wincha,
            fecha: ahora.toLocaleDateString("es-PE"),
            hora:  ahora.toLocaleTimeString("es-PE")
        };

        const registros = getData();
        registros.push(datos);
        saveData(registros);

        mostrarRegistros();
        form.reset();
    });
});

function mostrarRegistros() {
    const registros   = getData();
    const registroDiv = document.getElementById("registro");

    if (!registros.length) {
        registroDiv.innerHTML = '<p class="empty-msg">Sin registros aún</p>';
        return;
    }

    registroDiv.innerHTML = registros.map((item, index) => `
        <div class="registro-item">
            <div class="reg-header">
                <span class="reg-num">Registro #${index + 1}</span>
                <span class="reg-fecha">${item.fecha || "—"} · ${item.hora || "—"}</span>
                <button class="btn-del" onclick="eliminarRegistro(${index})">Eliminar</button>
            </div>
            <div class="reg-grid">
                <div class="reg-row"><span>Mecánicos:</span> ${val(item.mecanico)}</div>
                <div class="reg-row"><span>RG6:</span> ${val(item.rg6)}</div>
                <div class="reg-row"><span>Coaxial:</span> ${val(item.coaxial, "m")}</div>
                <div class="reg-row"><span>Fibra Drop:</span> ${val(item.drop, "m")}</div>
                <div class="reg-row"><span>Contrato:</span> ${si(item.contrato)}</div>
                <div class="reg-row"><span>Grapas:</span> ${si(item.grapas)}</div>
                <div class="reg-row"><span>Equip. Duo:</span> ${si(item.duo)}</div>
                <div class="reg-row"><span>Solo Internet:</span> ${si(item.internet)}</div>
                <div class="reg-row"><span>Solo Cable:</span> ${si(item.cable)}</div>
                <div class="reg-row"><span>Wincha:</span> ${si(item.wincha)}</div>
            </div>
        </div>
    `).join("");
}

/* ── Eliminar registro ── */
function eliminarRegistro(index) {
    const confirmar = confirm(`¿Eliminar el Registro #${index + 1}?\nEsta acción no se puede deshacer.`);
    
    if (!confirmar) return;

    const registros = getData();
    registros.splice(index, 1);
    saveData(registros);
    mostrarRegistros();
}

function exportarCSV() {
    const registros = getData();

    if (!registros.length) {
        alert("No hay datos para exportar");
        return;
    }

    if (typeof XLSX === "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js";
        script.onload = () => generarExcel(registros);
        script.onerror = () => alert("No se pudo cargar la librería de Excel. Verifica tu conexión.");
        document.head.appendChild(script);
    } else {
        generarExcel(registros);
    }
}

function generarExcel(registros) {
    const wb = XLSX.utils.book_new();

    /* ── Paleta WinTV ── */
    const C = {
        azulOscuro : "0D5472",
        azulMedio  : "1A3D4D",
        azulClaro  : "1A6B8A",
        cyan       : "00C6FF",
        blanco     : "FFFFFF",
        grisPar    : "E8F4F8",
        textOscuro : "0D2B38",
        verde      : "0A6E3F",
        rojo       : "8B1A1A",
        borde      : "A8D4E0"
    };

    function c(valor, estilo) {
        const tipo = typeof valor === "number" ? "n" : "s";
        return { v: valor, t: tipo, s: estilo };
    }

    function bordeBase() {
        return {
            top:    { style: "thin", color: { rgb: C.borde } },
            bottom: { style: "thin", color: { rgb: C.borde } },
            left:   { style: "thin", color: { rgb: C.borde } },
            right:  { style: "thin", color: { rgb: C.borde } }
        };
    }

    const sTitulo = {
        fill:      { patternType: "solid", fgColor: { rgb: C.azulOscuro } },
        font:      { name: "Segoe UI", sz: 14, bold: true, color: { rgb: C.cyan } },
        alignment: { horizontal: "center", vertical: "center" },
        border:    { bottom: { style: "medium", color: { rgb: C.cyan } } }
    };

    const sSubtitulo = {
        fill:      { patternType: "solid", fgColor: { rgb: C.azulMedio } },
        font:      { name: "Segoe UI", sz: 9, italic: true, color: { rgb: "A8D8E8" } },
        alignment: { horizontal: "center", vertical: "center" }
    };

    const sEncabezado = {
        fill:      { patternType: "solid", fgColor: { rgb: C.azulOscuro } },
        font:      { name: "Segoe UI", sz: 10, bold: true, color: { rgb: C.cyan } },
        alignment: { horizontal: "center", vertical: "center" },
        border:    bordeBase()
    };

    function sDato(fila) {
        const bg = fila % 2 === 0 ? C.grisPar : C.blanco;
        return {
            fill:      { patternType: "solid", fgColor: { rgb: bg } },
            font:      { name: "Segoe UI", sz: 10, color: { rgb: C.textOscuro } },
            alignment: { horizontal: "center", vertical: "center" },
            border:    bordeBase()
        };
    }

    function sSiNo(valor, fila) {
        const bg = fila % 2 === 0 ? C.grisPar : C.blanco;
        return {
            fill:      { patternType: "solid", fgColor: { rgb: bg } },
            font:      { name: "Segoe UI", sz: 10, bold: valor === "Sí",
                         color: { rgb: valor === "Sí" ? C.verde : C.rojo } },
            alignment: { horizontal: "center", vertical: "center" },
            border:    bordeBase()
        };
    }

    const sTotal = {
        fill:   { patternType: "solid", fgColor: { rgb: C.azulClaro } },
        font:   { name: "Segoe UI", sz: 10, bold: true, color: { rgb: C.blanco } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top:    { style: "medium", color: { rgb: C.cyan } },
            bottom: { style: "thin",   color: { rgb: C.borde } },
            left:   { style: "thin",   color: { rgb: C.borde } },
            right:  { style: "thin",   color: { rgb: C.borde } }
        }
    };

    /* ── Filas especiales ── */
    const NUM_COLS = 13;
    const fechaExport = new Date().toLocaleDateString("es-PE", {
        day: "2-digit", month: "long", year: "numeric"
    });

    const filaTitulo    = [c("WinTV E.I.R.L — Reporte de Materiales para Instalaciones", sTitulo)];
    const filaSubtitulo = [c(`Exportado el ${fechaExport}  ·  Total registros: ${registros.length}`, sSubtitulo)];

    const columnas = [
        "#", "Fecha", "Hora",
        "Mecánicos", "RG6", "Coaxial (m)", "Fibra Drop (m)",
        "Contrato", "Grapas", "Equip. Duo",
        "Solo Internet", "Solo Cable", "Wincha"
    ];
    const filaEncabezado = columnas.map(col => c(col, sEncabezado));

    /* ── Filas de datos ── */
    const filasDatos = registros.map((item, i) => {
        const f = i + 1;
        const d = (v) => c(v !== "" && v !== undefined ? Number(v) || 0 : 0, sDato(f));
        const t = (v) => c(v || "—", sDato(f));
        const b = (v) => { const s = si(v); return c(s, sSiNo(s, f)); };

        return [
            c(f,             sDato(f)),
            t(item.fecha),
            t(item.hora),
            d(item.mecanico),
            d(item.rg6),
            d(item.coaxial),
            d(item.drop),
            b(item.contrato),
            b(item.grapas),
            b(item.duo),
            b(item.internet),
            b(item.cable),
            b(item.wincha)
        ];
    });

    /* ── Fila de totales ── */
    const sumar    = (k) => registros.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const contarSi = (k) => registros.filter(r => r[k]).length;

    const filaTotal = [
        c("TOTAL",                          sTotal),
        c("",                               sTotal),
        c("",                               sTotal),
        c(sumar("mecanico"),                sTotal),
        c(sumar("rg6"),                     sTotal),
        c(sumar("coaxial"),                 sTotal),
        c(sumar("drop"),                    sTotal),
        c(contarSi("contrato") + " reg.",   sTotal),
        c(contarSi("grapas")   + " reg.",   sTotal),
        c(contarSi("duo")      + " reg.",   sTotal),
        c(contarSi("internet") + " reg.",   sTotal),
        c(contarSi("cable")    + " reg.",   sTotal),
        c(contarSi("wincha")   + " reg.",   sTotal)
    ];

    /* ── Construir hoja ── */
    const aoa = [filaTitulo, filaSubtitulo, filaEncabezado, ...filasDatos, filaTotal];
    const ws  = XLSX.utils.aoa_to_sheet(aoa);

    /* ── Ancho de columnas ── */
    ws["!cols"] = [
        { wch: 5  },
        { wch: 13 },
        { wch: 12 },
        { wch: 13 },
        { wch: 9  },
        { wch: 13 },
        { wch: 15 },
        { wch: 11 },
        { wch: 10 },
        { wch: 13 },
        { wch: 14 },
        { wch: 12 },
        { wch: 10 }
    ];

    /* ── Alto de filas ── */
    ws["!rows"] = [
        { hpt: 30 },
        { hpt: 18 },
        { hpt: 22 },
        ...registros.map(() => ({ hpt: 18 })),
        { hpt: 22 }
    ];

    /* ── Combinar celdas título y subtítulo ── */
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Instalaciones");

    const fechaArchivo = new Date().toLocaleDateString("es-PE").replace(/\//g, "-");
    XLSX.writeFile(wb, `reporte_instalaciones_${fechaArchivo}.xlsx`);
}
