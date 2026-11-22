const test = require("node:test");
const assert = require("node:assert/strict");
const fm = require("../lib/fitness-math.js");

/* ---------- Fechas ---------- */
test("fmtFecha convierte ISO a dd/mm/aaaa", () => {
  assert.equal(fm.fmtFecha("2026-01-05"), "05/01/2026");
  assert.equal(fm.fmtFecha("2026-12-31"), "31/12/2026");
});

test("hoyISO devuelve la fecha local en formato ISO", () => {
  const d = new Date();
  const esperado = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.equal(fm.hoyISO(), esperado);
});

/* ---------- escapeHtml ---------- */
test("escapeHtml neutraliza HTML en etiquetas y atributos", () => {
  assert.equal(
    fm.escapeHtml(`<img src=x onerror="alert(1)"> & cosa`),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; cosa"
  );
  assert.equal(fm.escapeHtml(null), "");
  assert.equal(fm.escapeHtml(undefined), "");
});

/* ---------- Series y cargas ---------- */
test("parsearNumSeries lee el número de series o asume 3", () => {
  assert.equal(fm.parsearNumSeries("4×10"), 4);
  assert.equal(fm.parsearNumSeries("3x8"), 3);
  assert.equal(fm.parsearNumSeries("sentadilla"), 3);
  assert.equal(fm.parsearNumSeries(""), 3);
});

test("sugerirCarga aplica +2,5 kg en máquinas grandes y +0,5 en el resto", () => {
  assert.equal(fm.sugerirCarga("Prensa de piernas 45°", { peso: 100 }), 102.5);
  assert.equal(fm.sugerirCarga("Elevaciones laterales", { peso: 10 }), 10.5);
  assert.equal(fm.sugerirCarga("Curl femoral", null), null);
});

test("calcularDiscosBarra reparte el peso por lado", () => {
  assert.equal(fm.calcularDiscosBarra(60), "Por lado (barra 20 kg): 20kg");
  assert.equal(fm.calcularDiscosBarra(100), "Por lado (barra 20 kg): 20kg + 20kg");
  assert.equal(fm.calcularDiscosBarra(57.5), "Por lado (barra 20 kg): 15kg + 2.5kg + 1.25kg");
  assert.equal(fm.calcularDiscosBarra(10), "Solo barra (20 kg) o mancuerna");
  assert.equal(fm.calcularDiscosBarra(20), "Solo barra (20 kg) o mancuerna");
});

test("calcularAproximacion genera la pirámide de calentamiento", () => {
  assert.equal(fm.calcularAproximacion(100), "Aprox: 50kg×6 · 75kg×3 · 90kg×1");
  assert.equal(fm.calcularAproximacion(20), "Aprox: 10kg×6 · 15kg×3 · 17.5kg×1");
  assert.equal(fm.calcularAproximacion(10), "1×10 ligero para calentar");
});

/* ---------- Rachas ---------- */
function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("calcularRacha: sin registros es 0", () => {
  assert.equal(fm.calcularRacha({}), 0);
});

test("calcularRacha: cuenta hoy y permite 1 día de descanso", () => {
  assert.equal(fm.calcularRacha({ [diasAtras(0)]: 1 }), 1);
  assert.equal(fm.calcularRacha({ [diasAtras(0)]: 1, [diasAtras(2)]: 1 }), 2);
  assert.equal(fm.calcularRacha({ [diasAtras(0)]: 1, [diasAtras(1)]: 1, [diasAtras(2)]: 1, [diasAtras(4)]: 1 }), 4);
});

test("calcularRacha: 2 días seguidos sin entrenar corta la racha", () => {
  assert.equal(fm.calcularRacha({ [diasAtras(2)]: 1 }), 1);
  assert.equal(fm.calcularRacha({ [diasAtras(3)]: 1, [diasAtras(0)]: 1 }), 1);
});

/* ---------- Voz ---------- */
test("normalizarTextoVoz convierte números escritos (frases compuestas primero)", () => {
  assert.equal(fm.normalizarTextoVoz("cincuenta y cinco kilos"), "55 kilos");
  assert.equal(fm.normalizarTextoVoz("treinta y cinco"), "35");
  assert.equal(fm.normalizarTextoVoz("sesenta y cinco kilos"), "65 kilos");
  assert.equal(fm.normalizarTextoVoz("dieciocho repeticiones"), "18 repeticiones");
});

test("parsearComandoCarga extrae peso y repeticiones", () => {
  assert.deepEqual(
    fm.parsearComandoCarga("60 kilos 10 repeticiones"),
    { accion: "guardar_carga", peso: 60, reps: 10, original: "60 kilos 10 repeticiones" }
  );
  assert.equal(fm.parsearComandoCarga("cincuenta y cinco kilos").peso, 55);
  assert.equal(fm.parsearComandoCarga("82,5 kilos").peso, 82.5);
  assert.equal(fm.parsearComandoCarga("4 por 10").reps, 10);
  assert.equal(fm.parsearComandoCarga("completar serie").accion, "completar_serie");
});

/* ---------- Biomecánica ---------- */
test("calcularAngulo devuelve grados de 0 a 180", () => {
  assert.equal(fm.calcularAngulo({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }), 90);
  assert.equal(fm.calcularAngulo({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }), 180);
  assert.equal(fm.calcularAngulo({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }), 45);
});

/* ---------- Nutrición ---------- */
test("calcularTdee usa la fórmula Mifflin–St Jeor", () => {
  const { bmr, tdee } = fm.calcularTdee({ peso: 80, altura: 175, edad: 30, sexo: "h", actividad: 1.55 });
  assert.equal(bmr, 10 * 80 + 6.25 * 175 - 5 * 30 + 5);
  assert.ok(Math.abs(tdee - bmr * 1.55) < 1e-9);
  const mujer = fm.calcularTdee({ peso: 60, altura: 165, edad: 25, sexo: "m", actividad: 1.2 });
  assert.equal(mujer.bmr, 10 * 60 + 6.25 * 165 - 5 * 25 - 161);
});

test("calcularMacros reparte proteína 2 g/kg y grasa 0,9 g/kg", () => {
  const m = fm.calcularMacros(80, 2200);
  assert.equal(m.protG, 160);
  assert.equal(m.grasaG, 72);
  assert.equal(m.restoKcal, 2200 - 160 * 4 - 72 * 9);
  assert.equal(m.carbG, Math.round(m.restoKcal / 4));
  // Objetivo demasiado bajo: los carbohidratos no bajan de 0
  assert.equal(fm.calcularMacros(80, 1000).restoKcal, 0);
});

test("categoriaImc clasifica según los rangos OMS", () => {
  assert.equal(fm.categoriaImc(17).cat, "Bajo peso");
  assert.equal(fm.categoriaImc(18.5).cat, "Peso normal");
  assert.equal(fm.categoriaImc(24.9).cat, "Peso normal");
  assert.equal(fm.categoriaImc(25).cat, "Sobrepeso");
  assert.equal(fm.categoriaImc(30).cat, "Obesidad grado I");
  assert.equal(fm.categoriaImc(35).cat, "Obesidad grado II");
  assert.equal(fm.categoriaImc(42).cat, "Obesidad grado III");
});

/* ---------- Planes ---------- */
test("formatearPlanTexto exporta el plan en texto plano", () => {
  const txt = fm.formatearPlanTexto({
    titulo: "Full Body",
    dias: [
      { dia: "Día 1", ejercicios: [["Prensa", "Pierna", "4x10", "RIR 2", 90]] }
    ]
  });
  assert.equal(txt, "Full Body\n\nDía 1\n- Prensa: 4x10 (RIR 2, 90s)");
});
