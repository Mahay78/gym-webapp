/* =====================================================
   FitnessCut · Funciones puras compartidas
   Sin dependencias del DOM: usadas por app.js en el
   navegador y por los tests de Node (node --test).
   ===================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else if (root) {
    Object.assign(root, api);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ---------- Fechas ---------- */
  function hoyISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function fmtFecha(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  /* ---------- Seguridad ---------- */
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Cargas y series ---------- */
  const MAQUINAS_GRANDES = /(prensa|hack|hip thrust|rumano|smith|sentadilla|banca|deadlift)/i;

  function sugerirCarga(nombre, ultimo) {
    if (!ultimo) return null;
    const delta = MAQUINAS_GRANDES.test(nombre) ? 2.5 : 0.5;
    return Math.round((ultimo.peso + delta) * 2) / 2;
  }

  function parsearNumSeries(seriesStr) {
    const m = (seriesStr || "").match(/^(\d+)\s*[x×]/i);
    return m ? parseInt(m[1], 10) : 3;
  }

  function calcularDiscosBarra(pesoTotal, barra = 20) {
    if (!pesoTotal || pesoTotal <= barra) return "Solo barra (20 kg) o mancuerna";
    let lado = (pesoTotal - barra) / 2;
    const discos = [20, 15, 10, 5, 2.5, 1.25];
    const res = [];
    discos.forEach(d => {
      while (lado >= d - 0.01) {
        res.push(d);
        lado -= d;
      }
    });
    return res.length ? `Por lado (barra 20 kg): ${res.map(x => `${x}kg`).join(" + ")}` : "Peso inferior a barra estándar";
  }

  function calcularAproximacion(peso) {
    if (!peso || peso <= 15) return "1×10 ligero para calentar";
    const r = v => Math.max(5, Math.round(v / 2.5) * 2.5);
    return `Aprox: ${r(peso * 0.5)}kg×6 · ${r(peso * 0.75)}kg×3 · ${r(peso * 0.9)}kg×1`;
  }

  /* ---------- Rachas ---------- */
  function fechaLocalISO(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function restarDiasISO(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 12); // mediodía: evita bordes de DST
    dt.setDate(dt.getDate() - n);
    return fechaLocalISO(dt);
  }

  function calcularRacha(entrenos) {
    // Permite 1 día de descanso entre sesiones; se corta con 2 días sin entrenar
    let racha = 0, fallos = 0;
    let iso = hoyISO();
    if (!entrenos[iso]) iso = restarDiasISO(iso, 1);
    while (fallos < 2) {
      if (entrenos[iso]) { racha++; fallos = 0; }
      else fallos++;
      iso = restarDiasISO(iso, 1);
    }
    return racha;
  }

  /* ---------- Texto de planes ---------- */
  function formatearPlanTexto(plan) {
    return `${plan.titulo}\n\n` + plan.dias.map(d =>
      `${d.dia}\n` + d.ejercicios.map(e => `- ${e[0]}: ${e[2]} (${e[3] || "RIR 1-2"}, ${e[4] || 90}s)`).join("\n")
    ).join("\n\n");
  }

  /* ---------- Voz: normalizar y parsear comandos de carga ---------- */
  const PALABRAS_NUM = {
    "cero": 0, "un": 1, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5,
    "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12,
    "trece": 13, "catorce": 14, "quince": 15, "dieciséis": 16, "dieciseis": 16,
    "diecisiete": 17, "dieciocho": 18, "diecinueve": 19, "veinte": 20, "veintiuno": 21,
    "veintidós": 22, "veintidos": 22, "veintitrés": 23, "veintitres": 23, "veinticinco": 25,
    "treinta": 30, "treinta y cinco": 35, "cuarenta": 40, "cuarenta y cinco": 45,
    "cincuenta": 50, "cincuenta y cinco": 55, "sesenta": 60, "sesenta y cinco": 65,
    "setenta": 70, "setenta y cinco": 75, "ochenta": 80, "ochenta y cinco": 85,
    "noventa": 90, "noventa y cinco": 95, "cien": 100
  };

  // Las frases compuestas ("cincuenta y cinco") deben reemplazarse ANTES
  // que las palabras sueltas ("cincuenta", "cinco"), si no se destruyen
  // entre ellas y el número resultante queda mal (p. ej. "50 y 5").
  const PALABRAS_NUM_ORDENADAS = Object.entries(PALABRAS_NUM)
    .sort((a, b) => b[0].length - a[0].length);

  function normalizarTextoVoz(str) {
    let s = (str || "").toLowerCase().trim();
    for (const [palabra, num] of PALABRAS_NUM_ORDENADAS) {
      const reg = new RegExp(`\\b${palabra}\\b`, "gi");
      s = s.replace(reg, num);
    }
    return s;
  }

  function parsearComandoCarga(raw) {
    const norm = normalizarTextoVoz(raw);
    if (/completar|hecha|hecho|terminad[ao]|siguiente/i.test(norm)) {
      return { accion: "completar_serie" };
    }
    let peso = null;
    let reps = null;

    const m1 = norm.match(/(\d+(?:[.,]\d+)?)\s*(?:kilos?|kg|k)\b/i);
    if (m1) peso = parseFloat(m1[1].replace(",", "."));

    const m2 = norm.match(/(\d+)\s*(?:repeticiones|repes|reps|veces)\b/i);
    if (m2) reps = parseInt(m2[1], 10);

    if (peso === null && reps === null) {
      const m3 = norm.match(/(\d+(?:[.,]\d+)?)\s*(?:por|[x×]|con)\s*(\d+)/i);
      if (m3) {
        peso = parseFloat(m3[1].replace(",", "."));
        reps = parseInt(m3[2], 10);
      }
    }

    if (peso === null && reps === null) {
      const m4 = norm.match(/(\d+(?:[.,]\d+)?)\s+(\d+)/);
      if (m4) {
        peso = parseFloat(m4[1].replace(",", "."));
        reps = parseInt(m4[2], 10);
      }
    }

    if (peso === null && norm.match(/\b\d+(?:[.,]\d+)?\b/)) {
      const soloNum = norm.match(/\b(\d+(?:[.,]\d+)?)\b/);
      if (soloNum) peso = parseFloat(soloNum[1].replace(",", "."));
    }

    return { accion: "guardar_carga", peso, reps, original: raw };
  }

  /* ---------- Biomecánica ---------- */
  function calcularAngulo(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return Math.round(angle);
  }

  /* ---------- Nutrición ---------- */
  function calcularTdee(p) {
    // Mifflin–St Jeor
    const base = 10 * p.peso + 6.25 * p.altura - 5 * p.edad + (p.sexo === "h" ? 5 : -161);
    return { bmr: base, tdee: base * p.actividad };
  }

  function calcularMacros(peso, objetivoKcal) {
    const protG = Math.round(peso * 2);
    const grasaG = Math.round(peso * 0.9);
    const restoKcal = Math.max(objetivoKcal - protG * 4 - grasaG * 9, 0);
    const carbG = Math.round(restoKcal / 4);
    return { protG, grasaG, restoKcal, carbG };
  }

  function categoriaImc(imc) {
    if (imc < 18.5)      return { cat: "Bajo peso",        color: "var(--blue)" };
    if (imc < 25)        return { cat: "Peso normal",      color: "var(--green)" };
    if (imc < 30)        return { cat: "Sobrepeso",        color: "var(--accent)" };
    if (imc < 35)        return { cat: "Obesidad grado I",   color: "#ff7b7b" };
    if (imc < 40)        return { cat: "Obesidad grado II",  color: "#ff7b7b" };
    return                       { cat: "Obesidad grado III", color: "#ff7b7b" };
  }

  return {
    hoyISO,
    fmtFecha,
    escapeHtml,
    sugerirCarga,
    parsearNumSeries,
    calcularDiscosBarra,
    calcularAproximacion,
    calcularRacha,
    formatearPlanTexto,
    normalizarTextoVoz,
    parsearComandoCarga,
    calcularAngulo,
    calcularTdee,
    calcularMacros,
    categoriaImc
  };
});
