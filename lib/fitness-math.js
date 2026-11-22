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

  /* ---------- IDs canónicos de ejercicios y Volumen Semanal ---------- */
  const REGLAS_CANONICAS = [
    [/gemelo\s+en\s+prensa|elevaci[oó]n\s+de\s+gemelos\s+en\s+m[aá]quina/i, "Gemelo en prensa", "Gemelos"],
    [/gemelo\s+sentado/i, "Gemelo sentado en máquina", "Gemelos"],
    [/gemelo|pantorrilla/i, "Gemelo de pie en máquina", "Gemelos"],
    [/prensa\s+con\s+pies\s+altos/i, "Prensa con pies altos", "Glúteo"],
    [/prensa/i, "Prensa de piernas", "Cuádriceps"],
    [/hack/i, "Sentadilla en máquina Hack", "Cuádriceps"],
    [/b[uú]lgara|zancada/i, "Sentadilla búlgara con barra Smith", "Cuádriceps"],
    [/sentadilla/i, "Sentadilla con barra o Sentadilla Goblet", "Cuádriceps"],
    [/extensi[oó]n\s+de\s+cu[aá]driceps/i, "Extensión de cuádriceps", "Cuádriceps"],
    [/curl\s+femoral\s+tumbado/i, "Curl femoral tumbado", "Isquios"],
    [/curl\s+femoral/i, "Curl femoral sentado", "Isquios"],
    [/peso\s+muerto|rumano|pull-through/i, "Peso muerto rumano con barra Smith", "Isquios"],
    [/hip\s+thrust|puente\s+de\s+gl[uú]teo/i, "Hip thrust en máquina", "Glúteo"],
    [/abducci[oó]n|patada\s+de\s+gl[uú]teo/i, "Abducción en máquina", "Glúteo"],
    [/hiperextension/i, "Hiperextensiones en máquina 45°", "Glúteo"],
    [/pec\s+deck\s+inverso|deltoide\s+posterior|face\s+pull/i, "Face pull en polea", "Hombros"],
    [/pec\s+deck|apertura|contractor|cruce\s+de\s+poleas/i, "Pec deck (aperturas en máquina)", "Pecho"],
    [/press\s+inclinado.*mancuerna/i, "Press inclinado con mancuernas", "Pecho"],
    [/press\s+inclinado/i, "Press inclinado en máquina", "Pecho"],
    [/press\s+de\s+banca.*mancuerna|press\s+plano.*mancuerna/i, "Press de banca con mancuernas", "Pecho"],
    [/fondos/i, "Fondos en máquina asistida", "Pecho"],
    [/press.*pecho|press\s+de\s+banca|press\s+en\s+m[aá]quina/i, "Press de pecho en máquina", "Pecho"],
    [/press\s+militar.*mancuerna/i, "Press militar con mancuernas", "Hombros"],
    [/press.*hombro|press\s+militar/i, "Press de hombros en máquina", "Hombros"],
    [/elevaciones\s+laterales/i, "Elevaciones laterales en polea", "Hombros"],
    [/jal[oó]n.*estrecho|jal[oó]n.*neutro/i, "Jalón al pecho agarre estrecho", "Espalda"],
    [/jal[oó]n|dominada/i, "Jalón al pecho en polea", "Espalda"],
    [/remo.*polea\s+baja/i, "Remo en polea baja con apoyo", "Espalda"],
    [/remo.*barra|remo.*mancuerna/i, "Remo con barra o mancuerna", "Espalda"],
    [/remo/i, "Remo sentado en máquina", "Espalda"],
    [/pullover/i, "Pullover en polea o máquina", "Espalda"],
    [/superset\s+b[ií]ceps\s*\/\s*tr[ií]ceps/i, "Superset bíceps/tríceps en polea", "Brazos"],
    [/press\s+franc[eé]s|tr[ií]ceps\s+sobre\s+cabeza/i, "Press francés en máquina o polea", "Tríceps"],
    [/tr[ií]ceps.*cuerda/i, "Extensión de tríceps en polea con cuerda", "Tríceps"],
    [/tr[ií]ceps/i, "Extensión de tríceps en polea", "Tríceps"],
    [/curl\s+martillo/i, "Curl martillo en polea con cuerda", "Bíceps"],
    [/curl.*banco\s+inclinado/i, "Curl con mancuernas en banco inclinado", "Bíceps"],
    [/curl.*b[ií]ceps|curl.*polea|curl.*mancuerna|curl\s+en\s+m[aá]quina/i, "Curl de bíceps en polea baja", "Bíceps"],
    [/pallof|plancha/i, "Press Pallof en polea media", "Core"],
    [/crunch.*polea|silla\s+romana/i, "Crunch en polea alta", "Core"],
    [/abdominal/i, "Abdominal en máquina", "Core"]
  ];

  function normalizarEjercicioCanonico(nombre) {
    const raw = String(nombre || "").trim();
    if (!raw) return "";
    for (const [rx, canon] of REGLAS_CANONICAS) {
      if (rx.test(raw)) return canon;
    }
    return raw;
  }

  function calcularVolumenPorMusculo(plan) {
    const vol = {
      Pecho: 0,
      Espalda: 0,
      Hombros: 0,
      Bíceps: 0,
      Tríceps: 0,
      Cuádriceps: 0,
      Isquios: 0,
      Glúteo: 0,
      "Isquios/Glúteo": 0,
      Gemelos: 0,
      Core: 0
    };
    if (!plan || !Array.isArray(plan.dias)) return vol;

    plan.dias.forEach(d => {
      (d.ejercicios || []).forEach(ej => {
        const nom = String(ej[0] || "");
        const grp = String(ej[1] || "");
        if (/cardio|neat|recuperaci[oó]n/i.test(grp) || /cardio|hiit|caminata|liss/i.test(nom)) return;
        const nS = parsearNumSeries(ej[2]);

        if (/superset\s+b[ií]ceps\s*\/\s*tr[ií]ceps/i.test(nom)) {
          vol.Bíceps += nS;
          vol.Tríceps += nS;
          return;
        }

        let asignado = false;
        for (const [rx, , musc] of REGLAS_CANONICAS) {
          if (rx.test(nom)) {
            if (musc === "Brazos") {
              vol.Bíceps += nS;
              vol.Tríceps += nS;
            } else if (vol[musc] !== undefined) {
              vol[musc] += nS;
            }
            asignado = true;
            break;
          }
        }
        if (asignado) return;

        const g = grp.toLowerCase();
        if (g.includes("pecho")) vol.Pecho += nS;
        else if (g.includes("espalda") || g.includes("dorsal")) vol.Espalda += nS;
        else if (g.includes("hombro")) vol.Hombros += nS;
        else if (g.includes("bíceps") || g.includes("biceps")) vol.Bíceps += nS;
        else if (g.includes("tríceps") || g.includes("triceps")) vol.Tríceps += nS;
        else if (g.includes("brazos")) { vol.Bíceps += nS; vol.Tríceps += nS; }
        else if (g.includes("femoral") || g.includes("isquio")) vol.Isquios += nS;
        else if (g.includes("glúteo") || g.includes("gluteo")) vol.Glúteo += nS;
        else if (g.includes("gemelo")) vol.Gemelos += nS;
        else if (g.includes("cuádriceps") || g.includes("cuadriceps") || g.includes("pierna")) vol.Cuádriceps += nS;
        else if (g.includes("core") || g.includes("abdomen")) vol.Core += nS;
      });
    });
    vol["Isquios/Glúteo"] = vol.Isquios + vol.Glúteo;
    return vol;
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
    categoriaImc,
    normalizarEjercicioCanonico,
    calcularVolumenPorMusculo
  };
});
