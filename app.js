/* ============================================================
   ¿Cuánto Me Toca? — lógica de la calculadora
   Fórmulas del Código de Trabajo de RD (Ley 16-92).
   Todo corre en el navegador: nada se envía ni se guarda.
   ============================================================ */

"use strict";

/* ---------- Formateadores de moneda dominicana ---------- */
const fmtRD = new Intl.NumberFormat("es-DO", {
  style: "currency", currency: "DOP", minimumFractionDigits: 2, maximumFractionDigits: 2
});
const fmtDias = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 1 });

/* Constante legal: salario diario = salario mensual / 23.83 */
const DIVISOR_DIARIO = 23.83;

/* ============================================================
   Utilidades de fechas
   ============================================================ */

/** Diferencia calendario entre dos fechas -> { años, meses, dias }. */
function diferenciaFechas(inicio, fin) {
  let años = fin.getFullYear() - inicio.getFullYear();
  let meses = fin.getMonth() - inicio.getMonth();
  let dias = fin.getDate() - inicio.getDate();
  if (dias < 0) {
    // Pedimos prestado del mes anterior a la fecha final.
    meses -= 1;
    const diasMesPrevio = new Date(fin.getFullYear(), fin.getMonth(), 0).getDate();
    dias += diasMesPrevio;
  }
  if (meses < 0) {
    años -= 1;
    meses += 12;
  }
  return { años, meses, dias };
}

/** Meses trabajados (decimal) entre dos fechas, aproximando el día como /30. */
function mesesDecimales(inicio, fin) {
  let meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
  meses += (fin.getDate() - inicio.getDate()) / 30;
  return Math.max(0, meses);
}

/** Parsea un input type="date" (YYYY-MM-DD) como fecha local, sin desfase de zona. */
function parseFechaLocal(valor) {
  const [a, m, d] = valor.split("-").map(Number);
  return new Date(a, m - 1, d);
}

/* ============================================================
   Fórmulas de cada concepto
   ============================================================ */

/**
 * PREAVISO (solo motivos a y b).
 * 3–6 meses = 7 días · 6–12 meses = 14 días · más de 1 año = 28 días.
 */
function calcPreaviso(años, mesesTotalesPrimerAño) {
  if (años >= 1) return 28;
  if (mesesTotalesPrimerAño >= 6) return 14;
  if (mesesTotalesPrimerAño >= 3) return 7;
  return 0;
}

/**
 * AUXILIO DE CESANTÍA (motivos a, b, c).
 * 3–6 meses = 6 días · 6–12 meses = 13 días.
 * Desde 1 año se acumula por cada año completo: años 1–5 = 21 días/año;
 * a partir del 6to (más de 5 años) = 23 días/año.
 * Fracción final de año (Art. 80, párrafo): mayor de 3 y hasta 6 meses = 6 días;
 * mayor de 6 y menos de 12 meses = 13 días. NO se paga a la tasa anual de 21/23.
 */
function calcCesantiaDias(años, mesesRestantes, mesesTotalesPrimerAño) {
  if (años < 1) {
    if (mesesTotalesPrimerAño >= 6) return 13;
    if (mesesTotalesPrimerAño >= 3) return 6;
    return 0;
  }
  let dias = 0;
  for (let i = 1; i <= años; i++) {
    dias += i <= 5 ? 21 : 23;
  }
  // Art. 80, párrafo: "Toda fracción de un año mayor de tres meses debe pagarse
  // de conformidad con los ordinales 1o. y 2o." -> 6 días (3–6 meses) o 13 días (6–12 meses).
  if (mesesRestantes > 6) {
    dias += 13;
  } else if (mesesRestantes > 3) {
    dias += 6;
  }
  return dias;
}

/**
 * VACACIONES.
 * 1–5 años = 14 días · más de 5 años = 18 días · menos de 1 año = proporcional (14 * meses/12).
 * Se suman los días pendientes que indique el usuario.
 */
function calcVacacionesDias(años, mesesTotales, diasPendientes) {
  let base;
  if (años < 1) base = 14 * (mesesTotales / 12);
  else if (años <= 5) base = 14;
  else base = 18;
  return base + (diasPendientes || 0);
}

/**
 * REGALÍA PASCUAL (salario de Navidad) proporcional.
 * Solo si NO se ha pagado este año.
 * monto = (salario_mensual / 12) * meses trabajados en el año en curso.
 */
function calcRegalia(salarioMensual, ingreso, salida) {
  const añoSalida = salida.getFullYear();
  const inicioPeriodo = ingreso.getFullYear() < añoSalida
    ? new Date(añoSalida, 0, 1)   // 1 de enero del año de salida
    : ingreso;
  let meses = mesesDecimales(inicioPeriodo, salida);
  meses = Math.min(12, meses);
  return { monto: (salarioMensual / 12) * meses, meses };
}

/* Qué componentes aplican según el motivo. */
const MAPA_MOTIVO = {
  a: { preaviso: true,  cesantia: true,  etiqueta: "Desahucio del empleador" },
  b: { preaviso: true,  cesantia: true,  etiqueta: "Despido injustificado" },
  c: { preaviso: true,  cesantia: true,  etiqueta: "Dimisión justificada" },
  d: { preaviso: false, cesantia: false, etiqueta: "Renuncia del trabajador" },
  e: { preaviso: false, cesantia: false, etiqueta: "Despido justificado" }
};

/* ============================================================
   Cálculo integral
   ============================================================ */
function calcularLiquidacion(datos) {
  const { salario, ingreso, salida, motivo, vacacionesPendientes, regaliaPagada } = datos;

  const salarioDiario = salario / DIVISOR_DIARIO;
  const { años, meses, dias } = diferenciaFechas(ingreso, salida);
  const mesesTotales = años * 12 + meses + dias / 30;
  const mesesPrimerAño = meses + dias / 30; // usado solo cuando años === 0
  const reglas = MAPA_MOTIVO[motivo];

  const items = [];

  // Preaviso
  if (reglas.preaviso) {
    const d = calcPreaviso(años, mesesPrimerAño);
    items.push({
      clave: "preaviso", nombre: "Preaviso",
      dias: d, monto: d * salarioDiario,
      detalle: `${fmtDias.format(d)} días × ${fmtRD.format(salarioDiario)}`
    });
  }

  // Auxilio de cesantía
  if (reglas.cesantia) {
    const d = calcCesantiaDias(años, meses + dias / 30, mesesPrimerAño);
    items.push({
      clave: "cesantia", nombre: "Auxilio de cesantía",
      dias: d, monto: d * salarioDiario,
      detalle: `${fmtDias.format(d)} días × ${fmtRD.format(salarioDiario)}`
    });
  }

  // Vacaciones (siempre corresponden)
  const dVac = calcVacacionesDias(años, mesesTotales, vacacionesPendientes);
  items.push({
    clave: "vacaciones", nombre: "Vacaciones",
    dias: dVac, monto: dVac * salarioDiario,
    detalle: `${fmtDias.format(dVac)} días × ${fmtRD.format(salarioDiario)}`
      + (vacacionesPendientes ? ` · incluye ${vacacionesPendientes} pendientes` : "")
  });

  // Regalía pascual (siempre corresponde si no está pagada)
  if (!regaliaPagada) {
    const reg = calcRegalia(salario, ingreso, salida);
    items.push({
      clave: "regalia", nombre: "Regalía pascual (proporcional)",
      dias: null, monto: reg.monto,
      detalle: `${fmtDias.format(reg.meses)} meses del año en curso`
    });
  } else {
    items.push({
      clave: "regalia", nombre: "Regalía pascual",
      dias: null, monto: 0, muted: true,
      detalle: "Ya fue pagada este año — no se incluye"
    });
  }

  const total = items.reduce((s, it) => s + (it.muted ? 0 : it.monto), 0);

  return { items, total, salarioDiario, años, meses, dias, etiquetaMotivo: reglas.etiqueta };
}

/* ============================================================
   Interfaz
   ============================================================ */
const form = document.getElementById("form");
const receiptSlot = document.getElementById("receipt-slot");
const resultEmpty = document.getElementById("result-empty");

/** Muestra u oculta un mensaje de error para un campo. */
function setError(inputId, mensaje) {
  const input = document.getElementById(inputId);
  const err = document.getElementById("err-" + inputId);
  if (mensaje) {
    input.setAttribute("aria-invalid", "true");
    if (err) { err.textContent = mensaje; err.hidden = false; }
  } else {
    input.removeAttribute("aria-invalid");
    if (err) { err.hidden = true; }
  }
}

/** Valida el formulario. Devuelve los datos limpios o null. */
function validar() {
  let ok = true;
  ["salario", "ingreso", "salida", "motivo"].forEach((id) => setError(id, ""));

  const salario = parseFloat(document.getElementById("salario").value);
  if (!(salario > 0)) { setError("salario", "Escribe un salario mensual válido."); ok = false; }

  const ingresoVal = document.getElementById("ingreso").value;
  const salidaVal = document.getElementById("salida").value;
  if (!ingresoVal) { setError("ingreso", "Indica la fecha de ingreso."); ok = false; }
  if (!salidaVal) { setError("salida", "Indica la fecha de salida."); ok = false; }

  const motivo = document.getElementById("motivo").value;
  if (!motivo) { setError("motivo", "Elige el motivo de la terminación."); ok = false; }

  if (!ok) return null;

  const ingreso = parseFechaLocal(ingresoVal);
  const salida = parseFechaLocal(salidaVal);
  if (salida <= ingreso) {
    setError("salida", "La salida debe ser posterior al ingreso.");
    return null;
  }

  const vacacionesPendientes = Math.max(0, parseInt(document.getElementById("vacaciones").value, 10) || 0);
  const regaliaPagada = document.getElementById("regalia").value === "si";

  return { salario, ingreso, salida, motivo, vacacionesPendientes, regaliaPagada };
}

/** Notas contextuales según el motivo elegido. */
function notasPorMotivo(motivo) {
  const notas = [
    "Las fracciones de año y los casos especiales los confirma el Ministerio de Trabajo.",
    "La participación en los beneficios (bonificación) no se incluye: puede corresponderte hasta 45–60 días si la empresa tuvo beneficios; consúltalo aparte."
  ];
  if (motivo === "a" || motivo === "b") {
    notas.unshift("Por este motivo te corresponden preaviso, cesantía, vacaciones y regalía.");
  } else if (motivo === "c") {
    notas.unshift("En la dimisión justificada te corresponden preaviso, cesantía, vacaciones y regalía: la ley la equipara al despido injustificado.");
  } else if (motivo === "d" || motivo === "e") {
    notas.unshift("Por este motivo no corresponde preaviso ni cesantía, pero sí tus vacaciones no disfrutadas y la regalía proporcional.");
  }
  return notas;
}

/** Renderiza el recibo con el resultado. */
function renderRecibo(r, datos) {
  const antiguedad = `${r.años} año${r.años === 1 ? "" : "s"}, ${r.meses} mes${r.meses === 1 ? "" : "es"} y ${r.dias} día${r.dias === 1 ? "" : "s"}`;

  const lineasHTML = r.items.map((it) => {
    const clases = ["rc__line"];
    if (it.muted) clases.push("rc__line--muted");
    return `
      <li class="${clases.join(" ")}">
        <span class="rc__line-name">${it.nombre}</span>
        <span class="rc__line-detail">${it.detalle}</span>
        <span class="rc__line-amount">${fmtRD.format(it.monto)}</span>
      </li>`;
  }).join("");

  const notasHTML = notasPorMotivo(datos.motivo)
    .map((n) => `<li>${n}</li>`).join("");

  const waTexto = encodeURIComponent(
    `Hola, calculé mis prestaciones (${r.etiquetaMotivo}) y me dio un total estimado de ${fmtRD.format(r.total)}. Quisiera confirmarlo.`
  );

  receiptSlot.innerHTML = `
    <div class="rc">
      <div class="rc__head">
        <div>
          <p class="rc__eyebrow">Liquidación estimada</p>
          <h3 class="rc__title">Tu recibo de prestaciones</h3>
        </div>
        <span class="rc__stamp">RD · Ley 16-92</span>
      </div>

      <dl class="rc__meta">
        <div><dt>Motivo</dt><dd>${r.etiquetaMotivo}</dd></div>
        <div><dt>Antigüedad</dt><dd>${antiguedad}</dd></div>
        <div><dt>Salario mensual</dt><dd>${fmtRD.format(datos.salario)}</dd></div>
        <div><dt>Salario diario</dt><dd>${fmtRD.format(r.salarioDiario)}</dd></div>
      </dl>

      <ul class="rc__lines">${lineasHTML}</ul>

      <div class="rc__total">
        <span class="rc__total-label">Total estimado</span>
        <span class="rc__total-amount">${fmtRD.format(r.total)}</span>
      </div>

      <div class="rc__notes">
        <h4>Notas importantes</h4>
        <ul>${notasHTML}</ul>
      </div>

      <div class="rc__actions">
        <button type="button" class="btn btn--primary" id="btn-print">Descargar / Imprimir PDF</button>
        <a class="btn btn--wa" href="https://wa.me/18294418256?text=${waTexto}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
      </div>

      <p class="rc__legal">
        No es asesoría legal. Cálculo estimado según el Código de Trabajo (Ley 16-92).
        Las fracciones y casos especiales los confirma el Ministerio de Trabajo o un abogado.
        No guardamos tus datos: todo se calculó en tu navegador.
      </p>
    </div>
  `;

  receiptSlot.hidden = false;
  if (resultEmpty) resultEmpty.hidden = true;

  document.getElementById("btn-print").addEventListener("click", () => window.print());
}

/* ---------- Eventos ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const datos = validar();
  if (!datos) {
    // Enfoca el primer campo con error para accesibilidad.
    const primerError = form.querySelector('[aria-invalid="true"], select:invalid');
    if (primerError) primerError.focus();
    return;
  }
  const resultado = calcularLiquidacion(datos);
  renderRecibo(resultado, datos);
  // Lleva la vista al recibo en móvil.
  if (window.matchMedia("(max-width: 900px)").matches) {
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

form.addEventListener("reset", () => {
  ["salario", "ingreso", "salida"].forEach((id) => setError(id, ""));
  receiptSlot.hidden = true;
  receiptSlot.innerHTML = "";
  if (resultEmpty) resultEmpty.hidden = false;
});

/* Desplazamiento suave para enlaces internos con data-scroll. */
document.querySelectorAll("[data-scroll]").forEach((a) => {
  a.addEventListener("click", (e) => {
    const destino = document.querySelector(a.getAttribute("href"));
    if (destino) {
      e.preventDefault();
      destino.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* ============================================================
   Service Worker — habilita el uso offline (PWA)
   ============================================================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("No se pudo registrar el Service Worker:", err);
    });
  });
}
