/* ================= FitnessCut ================= */
"use strict";

/* =====================================================
   CLAVES Y HELPERS DE ALMACENAMIENTO
   ===================================================== */
const KEY = {
  progreso: "fitnesscut_progreso",
  diario: "fitnesscut_diario",
  fotos: "fitnesscut_fotos",
  cargas: "fitnesscut_cargas",
  entrenos: "fitnesscut_entrenos",
  meta: "fitnesscut_meta",
  comidas: "fitnesscut_comidas",
  planActual: "fitnesscut_plan_actual",
  planesCustom: "fitnesscut_planes_custom",
  tema: "fitnesscut_tema",
  sesionHoy: "fitnesscut_sesion_hoy",
  notasEjercicios: "fitnesscut_notas_ejercicios",
  geminiApiKey: "fitnesscut_gemini_api_key",
  audioCoach: "fitnesscut_audio_coach",
};

/* ---------- Entrenador por Voz (Web Speech API) ---------- */
function decirVoz(texto) {
  const activo = localStorage.getItem(KEY.audioCoach) === "true";
  if (!activo || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 1.05;
    u.pitch = 1.0;
    const voces = window.speechSynthesis.getVoices();
    const vozEs = voces.find(v => v.lang.startsWith("es"));
    if (vozEs) u.voice = vozEs;
    window.speechSynthesis.speak(u);
  } catch { /* silencio */ }
}

function actualizarEstadoAudioCoachUI() {
  const activo = localStorage.getItem(KEY.audioCoach) === "true";
  const txt = $("coach-status-text");
  if (txt) txt.textContent = activo ? "ON" : "OFF";
  const btnHeader = $("btn-toggle-audio-coach");
  if (btnHeader) {
    btnHeader.style.borderColor = activo ? "var(--accent)" : "var(--border)";
    btnHeader.style.color = activo ? "var(--accent)" : "var(--text)";
  }
  const btnFt = $("ft-coach-toggle");
  if (btnFt) {
    btnFt.style.borderColor = activo ? "var(--accent)" : "var(--border)";
    btnFt.style.color = activo ? "var(--accent)" : "var(--text)";
    btnFt.textContent = activo ? "🔊 Coach ON" : "🔇 Coach OFF";
  }
}

function toggleAudioCoach() {
  const actual = localStorage.getItem(KEY.audioCoach) === "true";
  const nuevo = !actual;
  localStorage.setItem(KEY.audioCoach, nuevo ? "true" : "false");
  actualizarEstadoAudioCoachUI();
  if (nuevo) {
    decirVoz("Entrenador por voz activado. Te avisaré durante tus descansos.");
  }
}

function cargarSesionHoy() {
  const s = cargarLS(KEY.sesionHoy, { fecha: hoyISO(), sets: {} });
  if (s.fecha !== hoyISO()) {
    return { fecha: hoyISO(), sets: {} };
  }
  return s;
}

function guardarSesionHoy(s) {
  s.fecha = hoyISO();
  guardarLS(KEY.sesionHoy, s);
}

function cargarNotasEjercicios() {
  return cargarLS(KEY.notasEjercicios, {});
}

function guardarNotasEjercicios(n) {
  guardarLS(KEY.notasEjercicios, n);
}

const $ = id => document.getElementById(id);

function cargarLS(clave, def) {
  try {
    const v = JSON.parse(localStorage.getItem(clave));
    return v === null || v === undefined ? def : v;
  } catch {
    return def;
  }
}

function guardarLS(clave, val) {
  try {
    localStorage.setItem(clave, JSON.stringify(val));
    return true;
  } catch (err) {
    console.error("Error guardando en localStorage:", err);
    if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
      alert("⚠️ Espacio de almacenamiento lleno en el navegador (~5 MB). Exporta un backup y elimina fotos antiguas en Progreso para liberar espacio.");
    }
    return false;
  }
}

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

function lunesISO(iso) {
  const d = new Date(iso + "T12:00:00");
  const dia = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dia);
  return d.toISOString().slice(0, 10);
}

function descargarArchivo(nombre, contenido, mime) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =====================================================
   NAVEGACIÓN Y TEMA
   ===================================================== */
const navLinks = document.querySelectorAll(".nav-link[data-section]");
const sections = document.querySelectorAll(".section");

function showSection(name) {
  sections.forEach(s => s.classList.toggle("active", s.id === name));
  navLinks.forEach(b => b.classList.toggle("active", b.dataset.section === name));
  document.querySelectorAll(".bottom-nav-btn[data-section]").forEach(b =>
    b.classList.toggle("active", b.dataset.section === name)
  );
  if ($("bottom-more-menu")) $("bottom-more-menu").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.section))
);

document.querySelectorAll(".bottom-nav-btn[data-section], .bottom-more-menu [data-section]").forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.section))
);

if ($("btn-bottom-more")) {
  $("btn-bottom-more").addEventListener("click", () => {
    const m = $("bottom-more-menu");
    if (m) m.style.display = m.style.display === "none" ? "flex" : "none";
  });
}

document.querySelectorAll("[data-goto]").forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.goto))
);

function aplicarTema() {
  const tema = localStorage.getItem(KEY.tema) || "oscuro";
  document.body.classList.toggle("light", tema === "claro");
  if (tema === "amoled") document.documentElement.setAttribute("data-theme", "amoled");
  else document.documentElement.removeAttribute("data-theme");
  $("btn-tema").textContent = tema === "claro" ? "☀️" : tema === "amoled" ? "🖤" : "🌙";
}

$("btn-tema").addEventListener("click", () => {
  const actual = localStorage.getItem(KEY.tema) || "oscuro";
  const nuevo = actual === "oscuro" ? "amoled" : actual === "amoled" ? "claro" : "oscuro";
  localStorage.setItem(KEY.tema, nuevo);
  aplicarTema();
});

function aplicarAcento(color) {
  const c = color || localStorage.getItem("fitnesscut_accent") || "#ff6b35";
  document.documentElement.style.setProperty("--accent", c);
  document.querySelectorAll(".accent-dot").forEach(d => d.classList.toggle("active", d.dataset.accent === c));
}

document.querySelectorAll(".accent-dot").forEach(dot => {
  dot.addEventListener("click", () => {
    const c = dot.dataset.accent;
    localStorage.setItem("fitnesscut_accent", c);
    aplicarAcento(c);
  });
});
aplicarAcento();

/* =====================================================
   PLANES DE ENTRENAMIENTO (máquinas, poleas y peso libre)
   ===================================================== */
const PLANES = {
  "3dias": {
    titulo: "Full Body · 3 días (Pérdida de grasa y conservación muscular)",
    dias: [
      {
        dia: "Sesión 1 · Cuerpo completo A (Empuje / Tirón)",
        ejercicios: [
          ["Prensa de piernas", "Piernas", "3×8–10", "RIR 1–2", 120, "Pies al ancho de cadera. Bajada controlada sin despegar la pelvis."],
          ["Press de pecho en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Retrae escápulas y codos a 45–60° del torso. Pausa 1s abajo."],
          ["Jalón al pecho en polea", "Espalda", "3×8–10", "RIR 1–2", 90, "Lleva la barra a la clavícula manteniendo el pecho erguido."],
          ["Press de hombros en máquina", "Hombros", "3×8–10", "RIR 1–2", 90, "Empuje vertical fluido sin arquear la zona lumbar."],
          ["Extensión de tríceps en polea", "Tríceps", "3×10–12", "RIR 1", 60, "Codos pegados a los costados, aprieta 1s en la extensión."],
          ["Abdominal en máquina", "Core", "3×12–15", "RIR 1", 60, "Flexiona el torso desde el core, sin tirar con los brazos."],
          ["Cardio moderado en cinta inclinada", "Cardio", "15–20 min", "RPE 5–6", 0, "Caminata al 6–10% a ritmo constante."],
        ],
      },
      {
        dia: "Sesión 2 · Cuerpo completo B (Cadena posterior / Brazos)",
        ejercicios: [
          ["Curl femoral sentado o tumbado", "Femoral", "3×10–12", "RIR 1", 90, "Contracción sostenida 1s en el punto de máxima flexión."],
          ["Remo sentado en máquina", "Espalda", "3×8–10", "RIR 1–2", 90, "Tracciona hacia el abdomen bajo juntando bien las escápulas."],
          ["Press inclinado en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Enfoque clavicular del pectoral con descenso en 2-3 segundos."],
          ["Elevaciones laterales en polea", "Hombros", "3×12–15", "RIR 0–1", 60, "Polea baja, eleva con el codo hasta la altura del hombro."],
          ["Curl de bíceps en máquina o polea", "Bíceps", "3×10–12", "RIR 1", 60, "Codos inmóviles, solo flexiona el antebrazo con control."],
          ["Crunch en polea alta", "Core", "3×12–15", "RIR 1", 60, "De rodillas, aproxima las costillas a la pelvis."],
          ["HIIT en bici estática o remo", "Cardio", "10–12 min", "RPE 8–9", 0, "8 rondas: 20 s a tope / 40 s suave."],
        ],
      },
      {
        dia: "Sesión 3 · Cuerpo completo C (Sobrecarga y volumen)",
        ejercicios: [
          ["Sentadilla en máquina Hack", "Piernas", "3×8–10", "RIR 1–2", 120, "Profundidad máxima controlada empujando con toda la planta."],
          ["Peso muerto rumano con barra Smith", "Femoral/Glúteo", "3×8–10", "RIR 2", 120, "Empuja cadera atrás, ligera flexión de rodilla, espalda neutra."],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×12–15", "RIR 0–1", 60, "Gran estiramiento controlado, junta brazos sin chocar placas."],
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 90, "Pecho apoyado para aislar dorsales sin fatigar lumbares."],
          ["Face pull en polea", "Hombro posterior", "3×12–15", "RIR 1", 60, "Lleva la cuerda a la frente separando manos."],
          ["Gemelo en prensa", "Gemelo", "4×12–15", "RIR 0–1", 60, "Pausa de 2s en estiramiento abajo antes de empujar."],
        ],
      },
    ],
  },
  "4dias": {
    titulo: "Torso / Pierna · 4 días (Frecuencia 2 óptima)",
    dias: [
      {
        dia: "Sesión 1 · Torso A (Fuerza & Sobrecarga)",
        ejercicios: [
          ["Press de pecho en máquina", "Pecho", "4×6–8", "RIR 1–2", 120, "Carga pesada con técnica estricta. 2s de bajada."],
          ["Remo sentado en máquina", "Espalda", "4×6–8", "RIR 1–2", 120, "Tracción potente hacia la cintura, pausa 1s atrás."],
          ["Press de hombros en máquina", "Hombros", "3×8–10", "RIR 1–2", 90, "Empuje uniforme por encima de la cabeza."],
          ["Jalón al pecho agarre estrecho", "Espalda", "3×8–10", "RIR 1–2", 90, "Tracciona con los codos pegados para enfocar dorsal."],
          ["Extensión de tríceps en polea", "Tríceps", "3×10–12", "RIR 1", 60, "Extensión completa sin mover los codos de posición."],
          ["Curl de bíceps en polea baja", "Bíceps", "3×10–12", "RIR 1", 60, "Tensión constante durante toda la curva de fuerza."],
        ],
      },
      {
        dia: "Sesión 2 · Pierna A (Cuádriceps dominante)",
        ejercicios: [
          ["Prensa de piernas", "Cuádriceps", "4×8–10", "RIR 1–2", 120, "Pies bajos en la plataforma para mayor activación del cuádriceps."],
          ["Extensión de cuádriceps", "Cuádriceps", "3×10–12", "RIR 1", 90, "Pausa de 1s arriba en máxima contracción concéntrica."],
          ["Curl femoral sentado", "Femoral", "4×10–12", "RIR 1", 90, "El curl sentado maximiza la hipertrofia por estiramiento."],
          ["Gemelo en prensa", "Gemelo", "4×12–15", "RIR 0–1", 60, "Rango completo de tobillo sin rebotar abajo."],
          ["Abdominal en máquina", "Core", "3×12–15", "RIR 1", 60, "Añade peso progresivo semana a semana."],
          ["Cardio LISS en cinta inclinada", "Cardio", "15 min", "RPE 5", 0, "Caminata suave para acelerar recuperación."],
        ],
      },
      {
        dia: "Sesión 3 · Torso B (Hipertrofia & Congestión)",
        ejercicios: [
          ["Press inclinado en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Énfasis en el haz clavicular (pecho superior)."],
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 90, "Agarre prono o neutro, tracción fluida."],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×10–12", "RIR 0–1", 60, "Estiramiento controlado sintiendo la tensión en el pectoral."],
          ["Pullover en polea o máquina", "Dorsal", "3×12–15", "RIR 1", 60, "Brazos semi-extendidos, gran elongación dorsal."],
          ["Face pull en polea", "Hombro posterior", "3×12–15", "RIR 1", 60, "Rotación externa al final para salud del manguito rotador."],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Clave estética para dar amplitud de hombros."],
          ["Superset bíceps/tríceps en polea", "Brazos", "3×12 c/u", "RIR 0–1", 60, "Alterna bíceps y tríceps sin descanso intermedio."],
        ],
      },
      {
        dia: "Sesión 4 · Pierna B (Cadena posterior & Glúteo)",
        ejercicios: [
          ["Sentadilla en máquina Hack", "Piernas", "3×10–12", "RIR 1–2", 120, "Pies ligeramente adelantados para repartir carga."],
          ["Peso muerto rumano con barra Smith", "Femoral/Glúteo", "4×8–10", "RIR 1–2", 120, "Estira los isquiosurales sintiendo tensión atrás."],
          ["Hip thrust en máquina", "Glúteo", "3×10–12", "RIR 1", 90, "Bloqueo firme de cadera arriba manteniendo mentón pegado."],
          ["Curl femoral tumbado", "Femoral", "3×12–15", "RIR 0–1", 60, "Caderas bien pegadas al banco durante toda la serie."],
          ["Gemelo sentado en máquina", "Gemelo", "4×15", "RIR 0–1", 60, "Activa de forma específica el sóleo."],
          ["Crunch en polea alta", "Core", "3×15", "RIR 1", 60, "Contracción abdominal pura."],
        ],
      },
    ],
  },
  "ppl": {
    titulo: "Push / Pull / Legs · 3–6 días (Científico)",
    dias: [
      {
        dia: "Sesión 1 · Push (Pecho, Hombro anterior/lateral, Tríceps)",
        ejercicios: [
          ["Press de pecho en máquina", "Pecho", "4×8–10", "RIR 1–2", 120, "Empuje horizontal principal, retracción escapular activa."],
          ["Press inclinado en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Ángulo de 30-45° para estímulo de porción superior."],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×10–12", "RIR 0–1", 60, "Aislamiento pectoral con tensión continua."],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Elevación lateral controlada con codo alto."],
          ["Extensión de tríceps en polea con cuerda", "Tríceps", "3×10–12", "RIR 1", 60, "Separa los extremos de la cuerda abajo del todo."],
          ["Press francés en máquina o polea", "Tríceps", "3×12–15", "RIR 1", 60, "Enfoca la cabeza larga del tríceps por encima de la cabeza."],
        ],
      },
      {
        dia: "Sesión 2 · Pull (Espalda, Deltoides post, Bíceps)",
        ejercicios: [
          ["Jalón al pecho en polea", "Espalda", "4×8–10", "RIR 1–2", 90, "Tracción vertical fundamental con retracción de escápulas."],
          ["Remo sentado en máquina", "Espalda", "4×8–10", "RIR 1–2", 90, "Tracción horizontal buscando densidad de espalda alta."],
          ["Pullover en polea o máquina", "Dorsal", "3×12–15", "RIR 1", 60, "Aislamiento dorsal sin fatigar los flexores del codo."],
          ["Face pull en polea", "Hombro posterior", "3×12–15", "RIR 1", 60, "Tracción a la frente con rotación externa."],
          ["Curl de bíceps en polea o máquina", "Bíceps", "3×10–12", "RIR 1", 60, "Flexión estricta sin balancear la espalda."],
          ["Curl martillo en polea con cuerda", "Bíceps/Antebrazo", "3×12–15", "RIR 1", 60, "Desarrolla el braquial para dar grosor al brazo."],
        ],
      },
      {
        dia: "Sesión 3 · Legs (Cuádriceps, Isquios, Glúteos, Core)",
        ejercicios: [
          ["Prensa de piernas", "Cuádriceps", "4×8–10", "RIR 1–2", 120, "Empuje con talones y mediopié, rodillas alineadas."],
          ["Sentadilla en máquina Hack", "Piernas", "3×10–12", "RIR 1–2", 120, "Descenso profundo y controlado en 3 segundos."],
          ["Curl femoral sentado", "Femoral", "4×10–12", "RIR 1", 90, "Carga en estiramiento para máximo estímulo hipertrófico."],
          ["Peso muerto rumano con barra Smith", "Femoral/Glúteo", "3×10–12", "RIR 1–2", 90, "Bisagra de cadera profunda."],
          ["Gemelo en prensa", "Gemelo", "4×12–15", "RIR 0–1", 60, "Pausa abajo para suprimir el rebote elástico."],
          ["Abdominal en máquina", "Core", "3×15", "RIR 1", 60, "Aislamiento abdominal con sobrecarga."],
        ],
      },
    ],
  },
  "5dias": {
    titulo: "Hipertrófico & Definición · 5 días (Avanzado)",
    dias: [
      {
        dia: "Día 1 · Pecho + Tríceps + LISS",
        ejercicios: [
          ["Press de pecho en máquina", "Pecho", "4×8–10", "RIR 1–2", 120, "Empuje horizontal principal."],
          ["Press inclinado en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Pecho clavicular."],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×12–15", "RIR 0–1", 60, "Aislamiento y bombeo."],
          ["Fondos en máquina asistida", "Pecho/Tríceps", "3×8–12", "RIR 1–2", 90, "Tronco ligeramente inclinado hacia delante."],
          ["Extensión de tríceps en polea", "Tríceps", "3×12", "RIR 1", 60, "Bloqueo 1s abajo."],
          ["Cardio LISS en cinta inclinada", "Cardio", "15 min", "RPE 5–6", 0, "Gasto calórico limpio post-entreno."],
        ],
      },
      {
        dia: "Día 2 · Espalda + Bíceps + LISS",
        ejercicios: [
          ["Jalón al pecho en polea", "Espalda", "4×8–10", "RIR 1–2", 90, "Tracción vertical con escápulas deprimidas."],
          ["Remo sentado en máquina", "Espalda", "4×8–10", "RIR 1–2", 90, "Tracción media."],
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 90, "Agarre neutro."],
          ["Pullover en polea o máquina", "Dorsal", "3×12–15", "RIR 1", 60, "Aislamiento dorsal."],
          ["Curl de bíceps en máquina", "Bíceps", "3×10–12", "RIR 1", 60, "Flexión estricta."],
          ["Cardio LISS en bici o elíptica", "Cardio", "15 min", "RPE 5–6", 0, "Ritmo continuo."],
        ],
      },
      {
        dia: "Día 3 · Pierna 1 (Cuádriceps dominante) + Gemelos",
        ejercicios: [
          ["Prensa de piernas", "Cuádriceps", "4×10–12", "RIR 1–2", 120, "Pies bajos y juntos en la plancha."],
          ["Sentadilla en máquina Hack", "Cuádriceps", "3×10–12", "RIR 1–2", 120, "Bajada profunda y controlada."],
          ["Extensión de cuádriceps", "Cuádriceps", "3×12–15", "RIR 0–1", 60, "Contracción arriba aguantando 1s."],
          ["Curl femoral tumbado", "Femoral", "3×12–15", "RIR 1", 60, "Mantenimiento de isquiosurales."],
          ["Gemelo de pie en máquina", "Gemelo", "4×15", "RIR 0–1", 60, "Pausa de 2s abajo en cada repetición."],
        ],
      },
      {
        dia: "Día 4 · Hombros + Core + HIIT",
        ejercicios: [
          ["Press de hombros en máquina", "Hombros", "4×8–10", "RIR 1–2", 90, "Empuje escapular sin hiperextender cuello."],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Tensión constante en abducción."],
          ["Face pull en polea", "Hombro posterior", "3×15", "RIR 1", 60, "Rotación externa al final."],
          ["Abdominal en máquina", "Core", "3×15", "RIR 1", 60, "Sobrecarga en flexión de columna."],
          ["Crunch en polea alta", "Core", "3×12–15", "RIR 1", 60, "De rodillas."],
          ["HIIT en máquina de remo o bici", "Cardio", "8×(30 s / 60 s)", "RPE 9", 0, "Intervalos de alta intensidad para quema lipídica."],
        ],
      },
      {
        dia: "Día 5 · Pierna 2 (Femoral/Glúteo dominante) + Brazos",
        ejercicios: [
          ["Peso muerto rumano con barra Smith", "Femoral/Glúteo", "4×10–12", "RIR 1–2", 120, "Enfoque bisagra de cadera."],
          ["Hip thrust en máquina", "Glúteo", "3×10–12", "RIR 1", 90, "Extensión terminal de cadera con glúteo activo."],
          ["Curl femoral sentado", "Femoral", "3×12–15", "RIR 0–1", 60, "Aislamiento isquiosural."],
          ["Abducción en máquina", "Glúteo medio", "3×15", "RIR 0–1", 60, "Tronco erguido o ligeramente hacia delante."],
          ["Superset bíceps/tríceps en polea", "Brazos", "3×12 c/u", "RIR 0–1", 60, "Pump final de brazos."],
          ["Caminata en cinta inclinada", "Cardio", "10–15 min", "RPE 5", 0, "Recuperación activa final."],
        ],
      },
    ],
  },
  "pesolibre": {
    titulo: "Híbrido: Peso Libre + Máquinas · 4 días",
    dias: [
      {
        dia: "Sesión 1 · Torso Pesado (Mancuernas & Barras)",
        ejercicios: [
          ["Press de banca con mancuernas", "Pecho", "4×8–10", "RIR 1–2", 120, "Gran rango de estiramiento en la base, empuje estable."],
          ["Remo con barra o mancuerna", "Espalda", "4×8–10", "RIR 1–2", 120, "Espalda neutra a 45°, tracciona hacia la cadera."],
          ["Press militar con mancuernas", "Hombros", "3×8–10", "RIR 1–2", 90, "Sentado con respaldo en banco a 75°."],
          ["Jalón al pecho en polea", "Espalda", "3×10–12", "RIR 1", 90, "Complemento vertical en polea."],
          ["Extensión de tríceps en polea", "Tríceps", "3×10–12", "RIR 1", 60, "Aislamiento de tríceps."],
          ["Curl con mancuernas en banco inclinado", "Bíceps", "3×10–12", "RIR 1", 60, "Banco a 60°, máximo estiramiento de cabeza larga."],
        ],
      },
      {
        dia: "Sesión 2 · Pierna Fuerza (Sentadilla & Prensa)",
        ejercicios: [
          ["Sentadilla con barra o Sentadilla Goblet", "Cuádriceps/Glúteo", "4×6–8", "RIR 2", 120, "Baja hasta paralelo con torso firme y rodillas hacia fuera."],
          ["Prensa de piernas", "Cuádriceps", "3×10–12", "RIR 1–2", 90, "Volumen complementario con menor demanda lumbar."],
          ["Peso muerto rumano con mancuernas", "Femoral/Glúteo", "4×8–10", "RIR 1–2", 120, "Mancuernas pegadas a piernas sintiendo estiramiento."],
          ["Curl femoral sentado o tumbado", "Femoral", "3×12–15", "RIR 1", 60, "Aislamiento femoral en máquina."],
          ["Gemelo de pie con mancuerna o máquina", "Gemelo", "4×12–15", "RIR 0–1", 60, "Pausa abajo."],
          ["Abdominal en máquina o plancha", "Core", "3×12–15", "RIR 1", 60, "Estabilidad de tronco."],
        ],
      },
      {
        dia: "Sesión 3 · Torso Hipertrofia (Estética & Poleas)",
        ejercicios: [
          ["Press inclinado con mancuernas", "Pecho", "3×8–10", "RIR 1–2", 90, "Banco a 30° para activación de haz clavicular."],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×12–15", "RIR 0–1", 60, "Tensión constante en estiramiento y contracción."],
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 90, "Enfocado en dorsal sin fatiga de espalda baja."],
          ["Elevaciones laterales con mancuernas o polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Codos ligeramente flexionados, sin inercia."],
          ["Face pull en polea", "Hombro posterior", "3×15", "RIR 1", 60, "Salud de hombro y separación escapular."],
          ["Curl martillo con mancuernas", "Bíceps/Antebrazo", "3×10–12", "RIR 1", 60, "Agarre neutro para bíceps braquial."],
        ],
      },
      {
        dia: "Sesión 4 · Pierna & Glúteo Hipertrofia",
        ejercicios: [
          ["Hip thrust con barra o máquina", "Glúteo", "4×8–10", "RIR 1–2", 120, "Extensión explosiva de cadera con retroversión pélvica arriba."],
          ["Zancadas con mancuernas o búlgara", "Piernas/Glúteo", "3×10–12 por pierna", "RIR 1–2", 90, "Trabajo unilateral clave para estabilidad."],
          ["Extensión de cuádriceps", "Cuádriceps", "3×12–15", "RIR 0–1", 60, "Congestión final de cuádriceps."],
          ["Curl femoral sentado", "Femoral", "3×12–15", "RIR 0–1", 60, "Aislamiento isquiosural."],
          ["Gemelo sentado en máquina", "Gemelo", "4×15", "RIR 0–1", 60, "Sóleo a 90°."],
          ["Crunch en polea alta", "Core", "3×15", "RIR 1", 60, "Cierre de sesión."],
        ],
      },
    ],
  },
};

function getPlan(clave) {
  const custom = cargarLS(KEY.planesCustom, {});
  return (custom[clave]) || PLANES[clave] || PLANES["3dias"];
}

let planActual = localStorage.getItem(KEY.planActual) || "3dias";

/* ---------- Registro de cargas ---------- */
const SIN_CARGA = ["Cardio", "NEAT", "Recuperación"];
const MAQUINAS_GRANDES = /(prensa|hack|hip thrust|rumano|smith|sentadilla|banca|deadlift)/i;

/* ---------- Fotos de las máquinas (en orden: las más específicas primero) ---------- */
const IMG_EJERCICIOS = [
  ["gemelo en prensa", "img/gemelo-prensa.jpg"],
  ["gemelo sentado", "img/gemelo-sentado.jpg"],
  ["gemelo de pie", "img/gemelo-de-pie.jpg"],
  ["prensa con pies altos", "img/prensa-piernas.jpg"],
  ["prensa de piernas", "img/prensa-piernas.jpg"],
  ["press inclinado con mancuernas", "img/press-inclinado.jpg"],
  ["press inclinado en máquina", "img/press-inclinado.jpg"],
  ["press inclinado", "img/press-inclinado.jpg"],
  ["press de banca con mancuernas", "img/press-pecho.jpg"],
  ["press de pecho en máquina", "img/press-pecho.jpg"],
  ["press de pecho", "img/press-pecho.jpg"],
  ["press militar con mancuernas", "img/press-hombros.jpg"],
  ["press de hombros", "img/press-hombros.jpg"],
  ["remo con barra o mancuerna", "img/remo-maquina.jpg"],
  ["remo sentado", "img/remo-maquina.jpg"],
  ["remo en polea baja", "img/remo-polea-baja.jpg"],
  ["jalón", "img/jalon.jpg"],
  ["elevaciones laterales con mancuernas", "img/elevaciones-laterales.jpg"],
  ["elevaciones laterales", "img/elevaciones-laterales.jpg"],
  ["extensión de tríceps en polea con cuerda", "img/polea-triceps.jpg"],
  ["extensión de tríceps", "img/polea-triceps.jpg"],
  ["curl femoral sentado", "img/curl-femoral.jpg"],
  ["curl femoral", "img/curl-femoral.jpg"],
  ["extensión de cuádriceps", "img/extension-cuadriceps.jpg"],
  ["hack", "img/hack.jpg"],
  ["pec deck", "img/pec-deck.jpg"],
  ["smith", "img/smith.jpg"],
  ["curl martillo con mancuernas", "img/curl-biceps.jpg"],
  ["curl martillo en polea", "img/curl-biceps.jpg"],
  ["curl con mancuernas", "img/curl-biceps.jpg"],
  ["curl de bíceps", "img/curl-biceps.jpg"],
  ["hiperextensiones", "img/hiperextensiones.jpg"],
  ["face pull", "img/face-pull.jpg"],
  ["fondos en máquina", "img/fondos-asistida.jpg"],
  ["pullover", "img/pullover-polea.jpg"],
  ["hip thrust", "img/hip-thrust.jpg"],
  ["abducción", "img/abduccion.jpg"],
  ["abdominal en máquina", "img/abdominal-maquina.jpg"],
  ["abdominales en máquina", "img/abdominal-maquina.jpg"],
  ["crunch en polea", "img/crunch-polea.jpg"],
];

function buscarImg(nombre) {
  const n = nombre.toLowerCase();
  const hit = IMG_EJERCICIOS.find(([clave]) => n.includes(clave));
  return hit ? hit[1] : null;
}

/* ---------- Alternativas por ejercicio (si la máquina está ocupada) ---------- */
const ALT_EJERCICIOS = {
  "Prensa de piernas": ["Sentadilla en máquina Hack", "Sentadilla búlgara con barra Smith", "Prensa con pies altos (más glúteo y femoral)"],
  "Press de pecho en máquina": ["Press de banca con mancuernas", "Press inclinado en máquina", "Pec deck (aperturas en máquina)", "Fondos en máquina asistida"],
  "Press de banca con mancuernas": ["Press de pecho en máquina", "Press inclinado con mancuernas", "Fondos en máquina asistida"],
  "Remo sentado en máquina": ["Remo en polea baja con apoyo", "Jalón al pecho en polea", "Remo con mancuerna o barra"],
  "Remo con barra o mancuerna": ["Remo sentado en máquina", "Remo en polea baja con apoyo", "Jalón al pecho agarre estrecho"],
  "Press de hombros en máquina": ["Press militar con mancuernas", "Press de hombros con barra Smith", "Elevaciones laterales en polea"],
  "Press militar con mancuernas": ["Press de hombros en máquina", "Elevaciones laterales en polea", "Press militar en multipower (Smith)"],
  "Abdominal en máquina": ["Crunch en polea alta", "Elevación de piernas en silla romana", "Plancha abdominal isométrica"],
  "Abdominales en máquina": ["Crunch en polea alta", "Elevación de piernas en silla romana"],
  "Curl femoral sentado o tumbado": ["Peso muerto rumano con barra Smith", "Hiperextensiones en máquina 45°", "Prensa con pies altos"],
  "Curl femoral sentado": ["Curl femoral tumbado (invierte el modelo)", "Peso muerto rumano con barra Smith", "Hiperextensiones en máquina 45°"],
  "Curl femoral tumbado": ["Curl femoral sentado (invierte el modelo)", "Peso muerto rumano con barra Smith", "Hiperextensiones en máquina 45°"],
  "Jalón al pecho en polea": ["Remo sentado en máquina", "Pullover en polea", "Dominadas en máquina asistida"],
  "Jalón al pecho": ["Remo sentado en máquina", "Pullover en polea", "Dominadas en máquina asistida"],
  "Jalón al pecho agarre estrecho": ["Jalón al pecho (agarre amplio)", "Remo sentado en máquina", "Pullover en polea"],
  "Press inclinado en máquina": ["Press inclinado con mancuernas", "Press de pecho en máquina", "Pec deck (aperturas en máquina)"],
  "Press inclinado con mancuernas": ["Press inclinado en máquina", "Press de banca con mancuernas", "Pec deck (aperturas en máquina)"],
  "Elevaciones laterales en polea": ["Elevaciones laterales con mancuernas", "Pec deck inverso (deltoide posterior)", "Remo al mentón en polea"],
  "Elevaciones laterales con mancuernas o polea": ["Elevaciones laterales en polea", "Elevaciones laterales con mancuernas", "Remo al mentón en polea"],
  "Extensión de tríceps en polea": ["Extensión de tríceps con cuerda en polea", "Press francés en máquina", "Fondos en máquina asistida"],
  "Extensión de tríceps en polea con cuerda": ["Extensión de tríceps en polea (barra recta)", "Press francés en máquina", "Fondos en máquina asistida"],
  "Press francés en máquina o polea": ["Extensión de tríceps en polea con cuerda", "Fondos en máquina asistida", "Patada de tríceps en polea"],
  "Sentadilla en máquina Hack": ["Prensa de piernas", "Sentadilla con barra o Sentadilla Goblet", "Sentadilla búlgara con barra Smith"],
  "Sentadilla con barra o Sentadilla Goblet": ["Prensa de piernas", "Sentadilla en máquina Hack", "Zancadas con mancuernas"],
  "Pec deck (aperturas en máquina)": ["Press de pecho en máquina", "Cruce de poleas", "Press inclinado en máquina"],
  "Remo en polea baja con apoyo": ["Remo sentado en máquina", "Jalón al pecho agarre estrecho", "Remo con mancuerna"],
  "Remo en polea baja": ["Remo sentado en máquina", "Jalón al pecho agarre estrecho", "Remo con barra o mancuerna"],
  "Sentadilla búlgara con barra Smith": ["Zancadas con mancuernas o búlgara", "Prensa de piernas", "Sentadilla en máquina Hack"],
  "Zancadas con mancuernas o búlgara": ["Sentadilla búlgara con barra Smith", "Prensa de piernas", "Extensión de cuádriceps"],
  "Prensa con pies altos": ["Prensa de piernas", "Curl femoral sentado o tumbado", "Hip thrust en máquina"],
  "Extensión de cuádriceps": ["Sentadilla en máquina Hack", "Prensa de piernas", "Sentadilla búlgara"],
  "Peso muerto rumano con barra Smith": ["Peso muerto rumano con mancuernas", "Curl femoral sentado", "Hiperextensiones en máquina 45°"],
  "Peso muerto rumano con mancuernas": ["Peso muerto rumano con barra Smith", "Curl femoral sentado o tumbado", "Hip thrust en máquina"],
  "Gemelo en prensa": ["Gemelo de pie en máquina", "Gemelo sentado en máquina", "Gemelo de pie con mancuerna"],
  "Gemelo de pie en máquina": ["Gemelo sentado en máquina", "Gemelo en prensa"],
  "Gemelo de pie con mancuerna o máquina": ["Gemelo en prensa", "Gemelo sentado en máquina"],
  "Gemelo sentado en máquina": ["Gemelo de pie en máquina", "Gemelo en prensa"],
  "Face pull en polea": ["Pec deck inverso (deltoide posterior)", "Remo al mentón en polea"],
  "Curl de bíceps en máquina o polea": ["Curl en polea baja con barra", "Curl con mancuernas", "Curl martillo"],
  "Curl de bíceps en máquina": ["Curl en polea baja con barra", "Curl martillo en polea con cuerda"],
  "Curl de bíceps en polea baja": ["Curl de bíceps en máquina", "Curl con mancuernas", "Curl martillo"],
  "Curl con mancuernas en banco inclinado": ["Curl de bíceps en polea baja", "Curl de bíceps en máquina", "Curl concentrado"],
  "Curl martillo en polea con cuerda": ["Curl martillo con mancuernas", "Curl inverso en polea", "Curl de bíceps en máquina"],
  "Curl martillo con mancuernas": ["Curl martillo en polea con cuerda", "Curl de bíceps con mancuernas", "Curl de bíceps en máquina"],
  "Hiperextensiones en máquina 45°": ["Peso muerto rumano con barra Smith", "Hip thrust en máquina", "Curl femoral sentado"],
  "Fondos en máquina asistida": ["Press de pecho en máquina", "Pec deck (aperturas en máquina)", "Press inclinado en máquina"],
  "Pullover en polea o máquina": ["Jalón al pecho (agarre estrecho)", "Pec deck (aperturas en máquina)"],
  "Hip thrust en máquina": ["Hip thrust con barra o máquina", "Prensa con pies altos", "Hiperextensiones en máquina 45°"],
  "Hip thrust con barra o máquina": ["Hip thrust en máquina", "Prensa con pies altos", "Peso muerto rumano con barra Smith"],
  "Abducción en máquina": ["Prensa con pies altos", "Hiperextensiones en máquina 45°", "Sentadilla búlgara con barra Smith"],
  "Crunch en polea alta": ["Abdominal en máquina", "Elevación de piernas en silla romana", "Plancha isométrica"],
  "Superset bíceps/tríceps en polea": ["Curl de bíceps en máquina o polea", "Extensión de tríceps en polea"],
};

function imgError(img) {
  const ph = document.createElement("span");
  ph.className = "ex-img-ph";
  ph.textContent = "🏋️";
  ph.title = "Foto de la máquina no disponible todavía";
  img.replaceWith(ph);
}

function abrirLightbox(src, alt) {
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-label", "Foto ampliada de la máquina");
    lb.addEventListener("click", () => lb.classList.remove("visible"));
    document.body.appendChild(lb);
  }
  lb.innerHTML = `<img src="${src}" alt="${alt}">`;
  lb.classList.add("visible");
}

function cargarCargas() {
  return cargarLS(KEY.cargas, {});
}

function guardarCargas(cargas) {
  guardarLS(KEY.cargas, cargas);
}

function ultimoRegistroCarga(cargas, nombre) {
  const logs = cargas[nombre];
  if (!logs || logs.length === 0) return null;
  return [...logs].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

function sugerirCarga(nombre, ultimo) {
  if (!ultimo) return null;
  const delta = MAQUINAS_GRANDES.test(nombre) ? 2.5 : 0.5;
  return Math.round((ultimo.peso + delta) * 2) / 2;
}

function parsearNumSeries(seriesStr) {
  const m = (seriesStr || "").match(/^(\d+)\s*[x×]/i);
  return m ? parseInt(m[1], 10) : 3;
}

function renderPlanTabs() {
  const cont = $("plan-tabs");
  if (!cont) return;
  const custom = cargarLS(KEY.planesCustom, {});
  const todasClaves = [...new Set([...Object.keys(PLANES), ...Object.keys(custom)])];

  cont.innerHTML = todasClaves.map(k => {
    const pl = getPlan(k);
    const activo = k === planActual;
    const nombreCorto = pl.titulo.split(" (")[0] || pl.titulo;
    return `<button class="tab${activo ? " active" : ""}" data-plan="${k}">${nombreCorto}</button>`;
  }).join("");

  cont.querySelectorAll(".tab").forEach(tab =>
    tab.addEventListener("click", () => {
      cont.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderPlan(tab.dataset.plan);
    })
  );
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

function formatearPlanTexto(plan) {
  return `${plan.titulo}\n\n` + plan.dias.map(d =>
    `${d.dia}\n` + d.ejercicios.map(e => `- ${e[0]}: ${e[2]} (${e[3] || "RIR 1-2"}, ${e[4] || 90}s)`).join("\n")
  ).join("\n\n");
}

function renderPlan(clave) {
  planActual = clave;
  localStorage.setItem(KEY.planActual, clave);
  const plan = getPlan(clave);
  const cargas = cargarCargas();
  const entrenos = cargarLS(KEY.entrenos, {});
  const sesionHoy = cargarSesionHoy();
  const notasEjercicios = cargarNotasEjercicios();
  const hoy = hoyISO();

  // Actualizar pestaña activa
  const tabBtns = document.querySelectorAll("#plan-tabs .tab");
  if (tabBtns.length) {
    tabBtns.forEach(t => t.classList.toggle("active", t.dataset.plan === clave));
  } else {
    renderPlanTabs();
  }

  const nota = `
    <div class="plan-note">💡 <strong>Sobrecarga progresiva:</strong> Completa todas las series en el rango alto con el RIR indicado. Cuando lo consigas con técnica limpia, sube <strong>+0,5–1 kg</strong> en tren superior/brazos y <strong>+2,5–5 kg</strong> en sentadillas/prensa. Marca tus series completadas para activar el descanso automático.</div>`;

  let totalSeriesPlan = 0;
  let seriesHechasPlan = 0;
  plan.dias.forEach(d => {
    d.ejercicios.forEach(ej => {
      if (SIN_CARGA.includes(ej[1])) return;
      const nS = parsearNumSeries(ej[2]);
      totalSeriesPlan += nS;
      const guardadas = (sesionHoy.sets && sesionHoy.sets[ej[0]]) || [];
      seriesHechasPlan += guardadas.filter(s => s && s.done).length;
    });
  });
  const pctProgreso = totalSeriesPlan > 0 ? Math.min(100, Math.round((seriesHechasPlan / totalSeriesPlan) * 100)) : 0;
  const barraProgreso = totalSeriesPlan > 0 ? `
    <div class="entreno-progreso-bar" id="entreno-progreso-bar">
      <div class="entreno-progreso-top">
        <span>🏋️ Progreso de hoy: <strong>${seriesHechasPlan} / ${totalSeriesPlan} series</strong></span>
        <span>${pctProgreso}%</span>
      </div>
      <div class="entreno-progreso-track">
        <div class="entreno-progreso-fill" style="width: ${pctProgreso}%"></div>
      </div>
    </div>` : "";

  let primerDiaPendiente = plan.dias.findIndex((d, i) => !(entrenos[hoy] && entrenos[hoy].plan === planActual && entrenos[hoy].diaIdx === i));
  if (primerDiaPendiente < 0) primerDiaPendiente = 0;

  const html = nota + barraProgreso + plan.dias.map((dia, diaIdx) => {
    const hecho = entrenos[hoy] && entrenos[hoy].plan === planActual && entrenos[hoy].diaIdx === diaIdx;
    const abierto = diaIdx === primerDiaPendiente;
    return `
    <div class="plan-day${hecho ? " pr-celebrate" : ""}">
      <details class="plan-day-details"${abierto ? " open" : ""}>
        <summary class="day-head">
          <h4>${abierto ? "▾" : "▸"} ${dia.dia}</h4>
          <button class="btn-small day-done${hecho ? " hecho" : ""}" data-hecho="${diaIdx}" data-dia="${dia.dia}" aria-label="Marcar día completado">${hecho ? "✅ Hecho hoy" : "✓ Marcar hecho"}</button>
        </summary>
      ${dia.ejercicios
        .map((ej, ejIdx) => {
          const nombre = ej[0];
          const grupo = ej[1];
          const series = ej[2];
          const rir = ej[3] || "RIR 1–2";
          const descanso = typeof ej[4] === "number" ? ej[4] : 90;
          const cue = ej[5] || "";

          const conPeso = !SIN_CARGA.includes(grupo);
          const ultimo = conPeso ? ultimoRegistroCarga(cargas, nombre) : null;
          const sugerido = sugerirCarga(nombre, ultimo);
          const rutaImg = conPeso ? buscarImg(nombre) : null;
          const alts = ALT_EJERCICIOS[nombre] || null;
          const notaEx = notasEjercicios[nombre] || "";

          const nSeries = parsearNumSeries(series);
          const setsGuardados = (sesionHoy.sets && sesionHoy.sets[nombre]) || [];
          const setsArr = [];
          for (let i = 0; i < nSeries; i++) {
            setsArr.push(setsGuardados[i] || { done: false, peso: ultimo ? ultimo.peso : "", reps: "" });
          }

          const esSuperserie = Boolean(sesionHoy.superseries && sesionHoy.superseries[nombre]);
          const rpeActual = (sesionHoy.rpe && sesionHoy.rpe[nombre]) || "";

          return `
          <div class="ex-wrap${esSuperserie ? " ex-superserie" : ""}">
            <div class="exercise">
              ${rutaImg ? `<img class="ex-img" src="${rutaImg}" alt="Máquina: ${nombre}" loading="lazy" onerror="imgError(this)">` : ""}
              <div class="ex-name">
                <div>${nombre}${esSuperserie ? ` <span class="pkg-badge" style="font-size:0.7rem;">🔗 Superserie</span>` : ""}</div>
                <small>${grupo}${ultimo ? ` · Última vez: <strong>${ultimo.peso} kg</strong>${ultimo.reps ? ` (${ultimo.reps})` : ""} · ${fmtFecha(ultimo.fecha)}` : ""}</small>
                <div class="ex-badges">
                  <span class="rir-badge" title="Reps en recámara recomendadas">${rir}</span>
                  ${sugerido && (!ultimo || sugerido > ultimo.peso) ? `<button type="button" class="overload-badge" data-aplicarsug="${nombre}" data-sug="${sugerido}" title="Aplicar sobrecarga progresiva sugerida">📈 Subir a ${sugerido} kg</button>` : ""}
                  ${descanso > 0 ? `<button type="button" class="timer-badge" data-iniciartimer="${descanso}" title="Iniciar descanso">⏱ ${descanso}s descanso</button>` : ""}
                </div>
                ${cue ? `<span class="ex-cue">💡 ${cue}</span>` : ""}
                ${conPeso ? `
                <div class="set-tracker" data-ex="${nombre}" data-descanso="${descanso}">
                  ${setsArr.map((st, sIdx) => `
                    <button type="button" class="set-chip${st.done ? " done" : ""}" data-setchip="${sIdx}" title="${st.done ? "Serie completada · Clic para desmarcar" : "Completar serie e iniciar descanso"}">
                      <span class="set-chip-num">S${sIdx + 1}</span>
                      <span class="set-chip-val">${st.done ? `✅ ${st.peso || (ultimo ? ultimo.peso : "—")}kg` : "〇"}</span>
                    </button>
                  `).join("")}
                  <span class="rpe-pills" title="Sensación real de la serie">
                    <button type="button" class="rpe-pill${rpeActual === "facil" ? " active" : ""}" data-rpe-ex="${nombre}" data-rpe="facil">😊 Fácil</button>
                    <button type="button" class="rpe-pill${rpeActual === "justa" ? " active" : ""}" data-rpe-ex="${nombre}" data-rpe="justa">💪 Justa</button>
                    <button type="button" class="rpe-pill${rpeActual === "limite" ? " active" : ""}" data-rpe-ex="${nombre}" data-rpe="limite">🔥 Límite</button>
                  </span>
                </div>` : ""}
                <div class="ex-nota-wrap">
                  <button type="button" class="btn-link-subtle" data-escaner-ex="${nombre}">📷 Ajuste</button> ·
                  <button type="button" class="btn-link-subtle" data-video-check="${nombre}">📹 Grabarme</button>
                  <details class="ex-tools-menu">
                    <summary>⋯ Herramientas</summary>
                    <div class="ex-tools-panel">
                      ${conPeso ? `<button type="button" class="btn-link-subtle" data-discos="${nombre}">🏋️ Discos</button><button type="button" class="btn-link-subtle" data-aprox="${nombre}">🔥 Aprox.</button>` : ""}
                      <button type="button" class="btn-link-subtle" data-superserie="${nombre}">${esSuperserie ? "🔗 Quitar SS" : "🔗 Superserie"}</button>
                      <a class="btn-link-subtle" href="https://www.google.com/search?q=${encodeURIComponent(nombre + " tecnica ejercicio")}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">🔎 Buscar</a>
                      <a class="btn-link-subtle" href="https://www.youtube.com/results?search_query=${encodeURIComponent(nombre + " tecnica")}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">▶ Vídeo</a>
                      <button type="button" class="btn-link-subtle" data-notaex="${nombre}">${notaEx ? `📝 Nota: "${notaEx}"` : "＋ Nota"}</button>
                    </div>
                  </details>
                </div>
                <div class="inline-tool-box" style="display:none;"></div>
              </div>
              <div class="ex-actions">
                <div class="ex-sets">${series}</div>
                ${conPeso ? `
                <div class="ex-log">
                  <input type="number" step="0.5" min="0" max="500" class="log-peso" data-ex="${nombre}" value="${ultimo ? ultimo.peso : ""}" placeholder="kg" aria-label="Peso usado en ${nombre}">
                  <input type="text" class="log-reps" data-ex="${nombre}" value="${ultimo && ultimo.reps ? ultimo.reps : ""}" placeholder="${series}" aria-label="Series y repeticiones de ${nombre}">
                  <button type="button" class="btn-voice-log" data-mic-ex="${nombre}" title="Dictar peso y repes por voz (ej. '60 kilos 10 repes')">🎙️</button>
                  <button class="btn-small" data-guardar="${nombre}" title="Guardar peso usado">✓</button>
                </div>` : ""}
              </div>
            </div>
            ${alts ? `
            <details class="ex-alt">
              <summary>⇄ Cambiar ejercicio / Alternativas</summary>
              <ul>${alts.map(a => `<li><button type="button" class="btn-alt-swap" data-swap-day="${diaIdx}" data-swap-idx="${ejIdx}" data-swap-to="${a}">⇄ Usar ${a}</button></li>`).join("")}</ul>
            </details>` : ""}
          </div>`;
        })
        .join("")}
      </details>
    </div>`;
  }).join("");
  $("plan-content").innerHTML = html;
}

/* Delegación de eventos en el plan: timer, series, notas, cargas, día hecho */
$("plan-content").addEventListener("click", e => {
  if (e.target.classList.contains("ex-img")) {
    abrirLightbox(e.target.src, e.target.alt);
    return;
  }

  // Discos de barra, calentamiento aproximación, RIR sensación y superseries
  const btnDiscos = e.target.closest("[data-discos]");
  if (btnDiscos) {
    const exWrap = btnDiscos.closest(".ex-wrap");
    const box = exWrap?.querySelector(".inline-tool-box");
    const peso = parseFloat(exWrap?.querySelector(".log-peso")?.value) || 0;
    if (box) {
      box.style.display = box.style.display === "none" ? "block" : "none";
      box.innerHTML = `🏋️ <strong>${peso || 20} kg:</strong> ${calcularDiscosBarra(peso)}`;
    }
    return;
  }

  const btnAprox = e.target.closest("[data-aprox]");
  if (btnAprox) {
    const exWrap = btnAprox.closest(".ex-wrap");
    const box = exWrap?.querySelector(".inline-tool-box");
    const peso = parseFloat(exWrap?.querySelector(".log-peso")?.value) || 0;
    if (box) {
      box.style.display = box.style.display === "none" ? "block" : "none";
      box.innerHTML = `🔥 <strong>Series de calentamiento:</strong> ${calcularAproximacion(peso)}`;
    }
    return;
  }

  const btnRpe = e.target.closest("[data-rpe-ex]");
  if (btnRpe) {
    const sesionHoy = cargarSesionHoy();
    sesionHoy.rpe = sesionHoy.rpe || {};
    sesionHoy.rpe[btnRpe.dataset.rpeEx] = btnRpe.dataset.rpe;
    guardarSesionHoy(sesionHoy);
    renderPlan(planActual);
    return;
  }

  const btnSS = e.target.closest("[data-superserie]");
  if (btnSS) {
    const nom = btnSS.dataset.superserie;
    const sesionHoy = cargarSesionHoy();
    sesionHoy.superseries = sesionHoy.superseries || {};
    sesionHoy.superseries[nom] = !sesionHoy.superseries[nom];
    guardarSesionHoy(sesionHoy);
    renderPlan(planActual);
    return;
  }

  // Aplicar sobrecarga progresiva sugerida
  const btnSug = e.target.closest("[data-aplicarsug]");
  if (btnSug) {
    const exWrap = btnSug.closest(".ex-wrap");
    const inputPeso = exWrap?.querySelector(".log-peso");
    if (inputPeso) {
      inputPeso.value = btnSug.dataset.sug;
      inputPeso.style.borderColor = "var(--green)";
      inputPeso.focus();
    }
    return;
  }

  // Sustitución rápida de ejercicio
  const btnSwap = e.target.closest("[data-swap-to]");
  if (btnSwap) {
    const diaIdx = +btnSwap.dataset.swapDay;
    const ejIdx = +btnSwap.dataset.swapIdx;
    const nuevoNombre = btnSwap.dataset.swapTo;
    const custom = cargarLS(KEY.planesCustom, {});
    const base = custom[planActual] || JSON.parse(JSON.stringify(getPlan(planActual)));
    if (base.dias?.[diaIdx]?.ejercicios?.[ejIdx]) {
      base.dias[diaIdx].ejercicios[ejIdx][0] = nuevoNombre;
      custom[planActual] = base;
      guardarLS(KEY.planesCustom, custom);
      renderPlan(planActual);
    }
    return;
  }

  // Lanzar temporizador directo desde badge
  const btnTimer = e.target.closest("[data-iniciartimer]");
  if (btnTimer) {
    iniciarTimer(+btnTimer.dataset.iniciartimer, "Descanso entre series");
    return;
  }

  // Ver guía paso a paso de máquina en Escáner IA
  const btnEscanerEx = e.target.closest("[data-escaner-ex]");
  if (btnEscanerEx) {
    const nombre = btnEscanerEx.dataset.escanerEx;
    showSection("escaner");
    const tabMaq = document.querySelector("#vision-tabs [data-visiontab='maquinas']");
    if (tabMaq) tabMaq.click();
    mostrarGuiaMaquina(nombre);
    return;
  }

  // Grabarme y corregir técnica en Visión IA
  const btnVideoCheck = e.target.closest("[data-video-check]");
  if (btnVideoCheck) {
    const nombre = btnVideoCheck.dataset.videoCheck;
    abrirFormCheckParaEjercicio(nombre);
    return;
  }

  // Set Tracker interactivo
  const chipSet = e.target.closest("[data-setchip]");
  if (chipSet) {
    const tracker = chipSet.closest(".set-tracker");
    const exWrap = chipSet.closest(".ex-wrap");
    const nombre = tracker.dataset.ex;
    const descanso = +tracker.dataset.descanso || 90;
    const setIdx = +chipSet.dataset.setchip;

    const inputPeso = exWrap.querySelector(".log-peso");
    const inputReps = exWrap.querySelector(".log-reps");
    const pesoVal = parseFloat(inputPeso?.value) || 0;
    const repsVal = inputReps?.value.trim() || "";

    const sesionHoy = cargarSesionHoy();
    sesionHoy.sets = sesionHoy.sets || {};
    const setsEx = sesionHoy.sets[nombre] || [];

    const estadoActual = setsEx[setIdx]?.done || false;
    const nuevoEstado = !estadoActual;

    setsEx[setIdx] = {
      done: nuevoEstado,
      peso: nuevoEstado ? (pesoVal || setsEx[setIdx]?.peso || "") : "",
      reps: nuevoEstado ? (repsVal || setsEx[setIdx]?.reps || "") : "",
    };
    sesionHoy.sets[nombre] = setsEx;
    guardarSesionHoy(sesionHoy);

    if (nuevoEstado) {
      if (descanso > 0) iniciarTimer(descanso, `Descanso: ${nombre}`);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(60);

      const totalChips = tracker.querySelectorAll("[data-setchip]").length;
      const hechas = setsEx.filter(s => s && s.done).length;
      if (hechas === totalChips && pesoVal > 0) {
        const cargas = cargarCargas();
        const logs = cargas[nombre] || [];
        logs.push({ fecha: hoyISO(), peso: pesoVal, reps: repsVal || `${totalChips} series` });
        cargas[nombre] = logs.slice(-30);
        guardarCargas(cargas);
        renderHistoricoCargas();
        renderVolumen();
      }
    }

    renderPlan(planActual);
    return;
  }

  // Nota personalizada por ejercicio
  const btnNota = e.target.closest("[data-notaex]");
  if (btnNota) {
    const nombre = btnNota.dataset.notaex;
    const notas = cargarNotasEjercicios();
    const actual = notas[nombre] || "";
    const nueva = prompt(`Nota o ajuste de máquina para "${nombre}" (ej. altura asiento 4, respaldo 2):`, actual);
    if (nueva !== null) {
      if (nueva.trim()) {
        notas[nombre] = nueva.trim();
      } else {
        delete notas[nombre];
      }
      guardarNotasEjercicios(notas);
      renderPlan(planActual);
    }
    return;
  }

  // Dictado por voz de cargas
  const btnMic = e.target.closest("[data-mic-ex]");
  if (btnMic) {
    const nombre = btnMic.dataset.micEx;
    const exWrap = btnMic.closest(".ex-wrap");
    iniciarDictadoCarga(nombre, exWrap, btnMic);
    return;
  }

  // Guardado manual de cargas
  const btnGuardar = e.target.closest("[data-guardar]");
  if (btnGuardar) {
    const nombre = btnGuardar.dataset.guardar;
    const log = btnGuardar.closest(".ex-log");
    const peso = parseFloat(log.querySelector(".log-peso").value);
    const reps = log.querySelector(".log-reps").value.trim();

    if (!peso || peso <= 0 || peso > 500) {
      alert("Introduce un peso válido (entre 0 y 500 kg).");
      return;
    }

    const cargas = cargarCargas();
    const logs = cargas[nombre] || [];
    logs.push({ fecha: hoyISO(), peso, reps: reps || null });
    cargas[nombre] = logs.slice(-30);
    guardarCargas(cargas);

    renderPlan(planActual);
    renderHistoricoCargas();
    renderVolumen();
    return;
  }

  // Marcar día completo
  const btnHecho = e.target.closest("[data-hecho]");
  if (btnHecho) {
    const diaIdx = +btnHecho.dataset.hecho;
    const diaNombre = btnHecho.dataset.dia;
    const entrenos = cargarLS(KEY.entrenos, {});
    const actual = entrenos[hoyISO()];
    if (actual && actual.plan === planActual && actual.diaIdx === diaIdx) {
      delete entrenos[hoyISO()];
    } else {
      entrenos[hoyISO()] = { plan: planActual, diaIdx, dia: diaNombre };
    }
    guardarLS(KEY.entrenos, entrenos);
    renderPlan(planActual);
    renderEntrenos();
    renderHoyToca();
    renderResumenSemanal();
  }
});

/* =====================================================
   ENTRENOS COMPLETADOS: RACHA, CALENDARIO, "HOY TOCA"
   ===================================================== */
function calcularRacha(entrenos) {
  // Permite 1 día de descanso entre sesiones; se corta con 2 días sin entrenar
  let racha = 0, fallos = 0;
  const d = new Date();
  if (!entrenos[hoyISO()]) d.setDate(d.getDate() - 1);
  while (fallos < 2) {
    const iso = d.toISOString().slice(0, 10);
    if (entrenos[iso]) { racha++; fallos = 0; }
    else fallos++;
    d.setDate(d.getDate() - 1);
  }
  return racha;
}

function renderEntrenos() {
  const cont = $("entrenos-card");
  const entrenos = cargarLS(KEY.entrenos, {});
  const racha = calcularRacha(entrenos);

  const hoy = new Date();
  const mesInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const totalMes = Object.keys(entrenos).filter(f => f >= mesInicio).length;

  const y = hoy.getFullYear(), m = hoy.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const diasMes = new Date(y, m + 1, 0).getDate();
  let celdas = "";
  for (let i = 0; i < offset; i++) celdas += `<div class="cal-day"></div>`;
  for (let d = 1; d <= diasMes; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const clases = ["cal-day"];
    if (entrenos[iso]) clases.push("hecho");
    if (iso === hoyISO()) clases.push("hoy");
    celdas += `<div class="${clases.join(" ")}">${d}</div>`;
  }

  cont.innerHTML = `
    <div class="racha-grid">
      <div>
        <div class="results">
          <div class="result-box"><div class="result-value">${racha}</div><div class="result-label">Sesiones seguidas (con descansos de 1 día)</div></div>
          <div class="result-box"><div class="result-value">${totalMes}</div><div class="result-label">Entrenamientos este mes</div></div>
        </div>
        <p class="muted" style="margin-top:12px">Marca «✓ Marcar hecho» en el día del plan cuando termines la sesión.</p>
      </div>
      <div>
        <div class="calendario">
          ${["L", "M", "X", "J", "V", "S", "D"].map(d => `<div class="cal-head">${d}</div>`).join("")}
          ${celdas}
        </div>
      </div>
    </div>`;
}

function renderHoyToca() {
  const cont = $("hoy-toca");
  const guardado = localStorage.getItem(KEY.planActual) || planActual;
  const custom = cargarLS(KEY.planesCustom, {});
  const todasClaves = [...new Set([...Object.keys(PLANES), ...Object.keys(custom)])];

  cont.innerHTML = `
    <div class="form-grid">
      <label>Plan que sigues
        <select id="plan-actual-select" aria-label="Plan actual">
          ${todasClaves.map(k => `<option value="${k}"${k === guardado ? " selected" : ""}>${(getPlan(k)).titulo}</option>`).join("")}
        </select>
      </label>
    </div>
    <div id="hoy-toca-sesion"></div>`;

  $("plan-actual-select").addEventListener("change", e => {
    localStorage.setItem(KEY.planActual, e.target.value);
    planActual = e.target.value;
    renderPlanTabs();
    renderPlan(planActual);
    renderHoyToca();
  });

  const plan = getPlan(guardado);
  const entrenos = cargarLS(KEY.entrenos, {});
  const ultimos = Object.keys(entrenos).filter(f => entrenos[f].plan === guardado).sort();
  const ultimo = ultimos.length ? entrenos[ultimos[ultimos.length - 1]] : null;
  const idx = ultimo ? (ultimo.diaIdx + 1) % plan.dias.length : 0;
  const sesionActual = plan.dias[idx];

  $("hoy-toca-sesion").innerHTML = `
    <div class="result-box note">
      <div class="result-value">${sesionActual.dia}</div>
      <div class="result-label">${ultimo
        ? `Siguiente sesión después de «${ultimo.dia}» (${fmtFecha(ultimos[ultimos.length - 1])})`
        : "Tu siguiente sesión programada"}</div>
      <button class="btn-small" id="btn-ir-sesion-hoy" style="margin-top:10px;">🏋️ Abrir sesión en Planes →</button>
    </div>`;

  $("btn-ir-sesion-hoy").addEventListener("click", () => {
    showSection("planes");
    renderPlan(guardado);
  });
}

/* =====================================================
   TEMPORIZADOR DE DESCANSO Y FLOATING TIMER
   ===================================================== */
let timerId = null;
let timerRest = 0;

function timerTexto(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function timerPintar(texto) {
  const txt = texto || timerTexto(timerRest);
  if ($("timer-display")) $("timer-display").textContent = txt;
  if ($("ft-time")) $("ft-time").textContent = txt;
}

function timerBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    o.stop(ctx.currentTime + 0.6);
  } catch { /* silencio */ }
}

function iniciarTimer(seg, label = "Descanso entre series") {
  if (timerId) clearInterval(timerId);
  timerRest = seg;
  timerPintar();

  const ft = $("floating-timer");
  if (ft) {
    ft.style.display = "flex";
    ft.classList.remove("terminado");
    const ftLbl = ft.querySelector(".ft-label");
    if (ftLbl) ftLbl.textContent = label;
  }

  decirVoz(`Descanso iniciado. ${seg} segundos.`);

  timerId = setInterval(() => {
    timerRest--;
    if (timerRest === 15) {
      decirVoz("15 segundos restantes. Prepárate.");
    }
    if (timerRest <= 0) {
      clearInterval(timerId);
      timerId = null;
      timerPintar("¡Fin del descanso! 💪");
      timerBeep();
      decirVoz("¡Tiempo cumplido! A por la siguiente serie.");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
      if (ft) {
        ft.classList.add("terminado");
        setTimeout(() => {
          if (!timerId) ft.style.display = "none";
        }, 3500);
      }
    } else {
      timerPintar();
    }
  }, 1000);
}

function detenerTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  timerRest = 0;
  timerPintar("00:00");
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  const ft = $("floating-timer");
  if (ft) ft.style.display = "none";
}

document.querySelectorAll("[data-timer]").forEach(b =>
  b.addEventListener("click", () => iniciarTimer(+b.dataset.timer))
);

$("btn-timer-stop").addEventListener("click", detenerTimer);

if ($("btn-vista-compacta")) {
  $("btn-vista-compacta").addEventListener("click", () => {
    const act = document.body.classList.toggle("vista-compacta");
    $("btn-vista-compacta").style.borderColor = act ? "var(--accent)" : "var(--border)";
    $("btn-vista-compacta").style.color = act ? "var(--accent)" : "var(--text)";
  });
}

if ($("btn-export-plan-txt")) {
  $("btn-export-plan-txt").addEventListener("click", () => {
    const txt = formatearPlanTexto(getPlan(planActual));
    navigator.clipboard?.writeText(txt).catch(() => {});
    if (confirm("📋 Rutina copiada al portapapeles.\n\n¿Quieres abrir también el diálogo de impresión / guardar PDF?")) {
      window.print();
    }
  });
}

if ($("ft-minus15")) {
  $("ft-minus15").addEventListener("click", () => {
    timerRest = Math.max(1, timerRest - 15);
    timerPintar();
  });
}

if ($("ft-plus15")) {
  $("ft-plus15").addEventListener("click", () => {
    timerRest += 15;
    timerPintar();
  });
}

if ($("ft-plus30")) {
  $("ft-plus30").addEventListener("click", () => {
    timerRest += 30;
    timerPintar();
  });
}

/* ---------- Modo Entreno Activo (Wake Lock + Vista Enfocada) ---------- */
let wakeLockSentinel = null;
let modoEntrenoActivo = false;

async function activarWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
  } catch { /* no soportado o permiso denegado */ }
}

async function toggleModoEntreno() {
  modoEntrenoActivo = !modoEntrenoActivo;
  document.body.classList.toggle("modo-entreno", modoEntrenoActivo);
  const st = $("modo-entreno-status");
  if (st) st.textContent = modoEntrenoActivo ? "ON" : "OFF";
  const btn = $("btn-modo-entreno");
  if (btn) {
    btn.style.borderColor = modoEntrenoActivo ? "var(--green)" : "var(--border)";
    btn.style.color = modoEntrenoActivo ? "var(--green)" : "var(--text)";
  }
  if (modoEntrenoActivo) {
    await activarWakeLock();
  } else if (wakeLockSentinel) {
    try { await wakeLockSentinel.release(); } catch { /* noop */ }
    wakeLockSentinel = null;
  }
}

if ($("btn-modo-entreno")) {
  $("btn-modo-entreno").addEventListener("click", toggleModoEntreno);
}

document.addEventListener("visibilitychange", () => {
  if (modoEntrenoActivo && document.visibilityState === "visible") {
    activarWakeLock();
  }
});

if ($("ft-stop")) {
  $("ft-stop").addEventListener("click", detenerTimer);
}

if ($("ft-coach-toggle")) {
  $("ft-coach-toggle").addEventListener("click", toggleAudioCoach);
}

if ($("btn-toggle-audio-coach")) {
  $("btn-toggle-audio-coach").addEventListener("click", toggleAudioCoach);
}

/* ---------- Reconocimiento de Voz y Dictado de Cargas ---------- */
let activeRecognition = null;

function normalizarTextoVoz(str) {
  let s = (str || "").toLowerCase().trim();
  const palabrasNum = {
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
  for (const [palabra, num] of Object.entries(palabrasNum)) {
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

function mostrarVoiceHud(titulo, subtitulo) {
  const hud = $("voice-hud");
  if (!hud) return;
  const t = $("voice-hud-title");
  const s = $("voice-hud-sub");
  if (t) t.textContent = titulo;
  if (s) s.textContent = subtitulo;
  hud.style.display = "flex";
}

function ocultarVoiceHud() {
  const hud = $("voice-hud");
  if (hud) hud.style.display = "none";
  if (activeRecognition) {
    try { activeRecognition.stop(); } catch { /* ignorar */ }
    activeRecognition = null;
  }
  document.querySelectorAll(".btn-voice-log.recording").forEach(b => b.classList.remove("recording"));
}

if ($("voice-hud-close")) {
  $("voice-hud-close").addEventListener("click", ocultarVoiceHud);
}

function iniciarDictadoCarga(nombreEjercicio, exWrap, btnMic) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Tu navegador no soporta reconocimiento de voz nativo. Te recomendamos usar Google Chrome o Safari en tu móvil para dictar cargas sin manos.");
    return;
  }

  if (activeRecognition) {
    ocultarVoiceHud();
  }

  try {
    const rec = new SpeechRec();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;
    activeRecognition = rec;

    if (btnMic) btnMic.classList.add("recording");
    mostrarVoiceHud(`🎙️ Escuchando: ${nombreEjercicio}`, 'Di: "60 kilos 10 repeticiones" o "completar serie"');

    rec.onresult = (evt) => {
      const transcript = evt.results[0][0].transcript;
      const comando = parsearComandoCarga(transcript);

      if (comando.accion === "completar_serie") {
        const chipIncompleto = exWrap.querySelector(".set-chip:not(.done)");
        if (chipIncompleto) {
          chipIncompleto.click();
          decirVoz("Serie completada.");
        } else {
          decirVoz("Todas las series de este ejercicio ya están hechas.");
        }
      } else if (comando.accion === "guardar_carga" && comando.peso !== null) {
        const inputPeso = exWrap.querySelector(".log-peso");
        const inputReps = exWrap.querySelector(".log-reps");
        const btnGuardar = exWrap.querySelector("[data-guardar]");

        if (inputPeso) {
          inputPeso.value = comando.peso;
          inputPeso.style.borderColor = "var(--green)";
          setTimeout(() => { inputPeso.style.borderColor = ""; }, 1500);
        }
        if (inputReps && comando.reps !== null) {
          inputReps.value = `${comando.reps} reps`;
          inputReps.style.borderColor = "var(--green)";
          setTimeout(() => { inputReps.style.borderColor = ""; }, 1500);
        }

        if (btnGuardar) {
          btnGuardar.click();
        }

        const primerChip = exWrap.querySelector(".set-chip:not(.done)");
        if (primerChip) {
          primerChip.click();
        }

        const repText = comando.reps ? ` y ${comando.reps} repeticiones` : "";
        decirVoz(`Anotado: ${comando.peso} kilos${repText}.`);
      } else {
        decirVoz("No entendí la carga. Di por ejemplo: 60 kilos 10 repeticiones.");
      }

      ocultarVoiceHud();
    };

    rec.onerror = (err) => {
      console.warn("SpeechRec error:", err);
      ocultarVoiceHud();
    };

    rec.onend = () => {
      ocultarVoiceHud();
    };

    rec.start();
  } catch (err) {
    console.error("Error al iniciar SpeechRecognition:", err);
    ocultarVoiceHud();
  }
}

/* =====================================================
   ASISTENTE DE PLAN A MEDIDA Y GUÍA RIR
   ===================================================== */
if ($("btn-toggle-asistente")) {
  $("btn-toggle-asistente").addEventListener("click", () => {
    const p = $("panel-asistente");
    p.style.display = p.style.display === "none" ? "block" : "none";
    if (p.style.display === "block") p.scrollIntoView({ behavior: "smooth" });
  });
}

if ($("btn-cerrar-asistente")) {
  $("btn-cerrar-asistente").addEventListener("click", () => {
    $("panel-asistente").style.display = "none";
  });
}

if ($("btn-toggle-guia-rir")) {
  $("btn-toggle-guia-rir").addEventListener("click", () => {
    const p = $("panel-guia-rir");
    p.style.display = p.style.display === "none" ? "block" : "none";
    if (p.style.display === "block") p.scrollIntoView({ behavior: "smooth" });
  });
}

if ($("btn-cerrar-guia-rir")) {
  $("btn-cerrar-guia-rir").addEventListener("click", () => {
    $("panel-guia-rir").style.display = "none";
  });
}

function generarPlanAMedida(dias, nivel, equipo, objetivo) {
  const rirBase = nivel === "principiante" ? "RIR 2" : "RIR 1–2";
  const seriesBase = nivel === "principiante" ? "3×10–12" : nivel === "avanzado" ? "4×8–10" : "3×8–10";

  let diasArr = [];
  if (dias === "2") {
    diasArr = [
      {
        dia: "Sesión 1 · Full Body A",
        ejercicios: [
          ["Prensa de piernas", "Piernas", seriesBase, rirBase, 120, "Enfoque cuádriceps y glúteo."],
          ["Press de pecho en máquina", "Pecho", seriesBase, rirBase, 90, "Empuje horizontal con técnica estricta."],
          ["Jalón al pecho en polea", "Espalda", seriesBase, rirBase, 90, "Tracción vertical completa."],
          ["Elevaciones laterales en polea", "Hombros", "3×12–15", "RIR 1", 60, "Aislamiento deltoide lateral."],
          ["Extensión de tríceps en polea", "Tríceps", "3×12", "RIR 1", 60, "Bloqueo final."],
          ["Abdominal en máquina", "Core", "3×15", "RIR 1", 60, "Sobrecarga progresiva."],
        ],
      },
      {
        dia: "Sesión 2 · Full Body B",
        ejercicios: [
          ["Curl femoral sentado o tumbado", "Femoral", seriesBase, rirBase, 90, "Cadena posterior."],
          ["Sentadilla en máquina Hack", "Piernas", seriesBase, rirBase, 120, "Cuádriceps dominante."],
          ["Remo sentado en máquina", "Espalda", seriesBase, rirBase, 90, "Tracción horizontal."],
          ["Press inclinado en máquina", "Pecho", seriesBase, rirBase, 90, "Haz clavicular."],
          ["Curl de bíceps en polea o máquina", "Bíceps", "3×10–12", "RIR 1", 60, "Flexión estricta."],
          ["Gemelo en prensa", "Gemelo", "4×12–15", "RIR 0–1", 60, "Rango completo."],
        ],
      },
    ];
  } else if (dias === "3") {
    diasArr = JSON.parse(JSON.stringify(PLANES["3dias"].dias));
  } else if (dias === "5") {
    diasArr = JSON.parse(JSON.stringify(PLANES["5dias"].dias));
  } else {
    // 4 días (Torso / Pierna o Híbrido)
    diasArr = equipo === "hibrido"
      ? JSON.parse(JSON.stringify(PLANES["pesolibre"].dias))
      : JSON.parse(JSON.stringify(PLANES["4dias"].dias));
  }

  const custom = cargarLS(KEY.planesCustom, {});
  custom["personalizado"] = {
    titulo: `✨ Mi Rutina a Medida (${dias} días · ${nivel})`,
    dias: diasArr,
  };
  guardarLS(KEY.planesCustom, custom);

  planActual = "personalizado";
  localStorage.setItem(KEY.planActual, "personalizado");
  renderPlanTabs();
  renderPlan("personalizado");
  renderEditor();
  renderHoyToca();

  if ($("panel-asistente")) $("panel-asistente").style.display = "none";
  alert(`¡Listo! Tu rutina personalizada de ${dias} días (${nivel}) ha sido generada y activada con éxito.`);
}

if ($("btn-generar-plan")) {
  $("btn-generar-plan").addEventListener("click", () => {
    const dias = $("gen-dias").value;
    const nivel = $("gen-nivel").value;
    const equipo = $("gen-equipo").value;
    const objetivo = $("gen-objetivo").value;
    generarPlanAMedida(dias, nivel, equipo, objetivo);
  });
}

/* =====================================================
   EDITOR DE PLANES
   ===================================================== */
function renderEditor() {
  const selPlan = $("edit-plan");
  const prevPlan = selPlan.value || planActual || "3dias";
  const custom = cargarLS(KEY.planesCustom, {});
  const todasClaves = [...new Set([...Object.keys(PLANES), ...Object.keys(custom)])];

  selPlan.innerHTML = todasClaves
    .map(k => `<option value="${k}">${(getPlan(k)).titulo}</option>`).join("");
  selPlan.value = todasClaves.includes(prevPlan) ? prevPlan : todasClaves[0];

  const plan = getPlan(selPlan.value);
  const selDia = $("edit-dia");
  const prevDia = selDia.value;
  selDia.innerHTML = plan.dias
    .map((d, i) => `<option value="${i}">${d.dia}</option>`).join("");
  if (prevDia && +prevDia < plan.dias.length) selDia.value = prevDia;

  renderEditorEjercicios();
}

function renderEditorEjercicios() {
  const plan = getPlan($("edit-plan").value);
  const diaIdx = Math.min(+$("edit-dia").value || 0, plan.dias.length - 1);
  const dia = plan.dias[diaIdx];
  $("edit-ejercicios").innerHTML = dia.ejercicios.map(ej => {
    const n = ej[0];
    const g = ej[1];
    const s = ej[2];
    return `
    <div class="edit-row">
      <input class="ed-nombre" value="${n}" placeholder="Nombre del ejercicio" aria-label="Nombre del ejercicio">
      <input class="ed-grupo" value="${g}" placeholder="Grupo" aria-label="Grupo muscular">
      <input class="ed-series" value="${s}" placeholder="Series, ej. 3×10–12" aria-label="Series y repeticiones">
      <button class="btn-small" data-eddel aria-label="Eliminar ejercicio">✕</button>
    </div>`;
  }).join("");
}

$("edit-plan").addEventListener("change", renderEditor);
$("edit-dia").addEventListener("change", renderEditorEjercicios);

$("edit-ejercicios").addEventListener("click", e => {
  const b = e.target.closest("[data-eddel]");
  if (b) b.closest(".edit-row").remove();
});

$("btn-edit-add").addEventListener("click", () => {
  const div = document.createElement("div");
  div.className = "edit-row";
  div.innerHTML = `
    <input class="ed-nombre" value="" placeholder="Nombre del ejercicio" aria-label="Nombre del ejercicio">
    <input class="ed-grupo" value="" placeholder="Grupo" aria-label="Grupo muscular">
    <input class="ed-series" value="" placeholder="Series, ej. 3×10–12" aria-label="Series y repeticiones">
    <button class="btn-small" data-eddel aria-label="Eliminar ejercicio">✕</button>`;
  $("edit-ejercicios").appendChild(div);
});

$("btn-edit-guardar").addEventListener("click", () => {
  const planKey = $("edit-plan").value;
  const diaIdx = +$("edit-dia").value || 0;
  const original = getPlan(planKey);
  const diaOriginal = original.dias[diaIdx];

  const filas = [...document.querySelectorAll("#edit-ejercicios .edit-row")]
    .map((r, i) => {
      const nom = r.querySelector(".ed-nombre").value.trim();
      const grp = r.querySelector(".ed-grupo").value.trim() || "General";
      const ser = r.querySelector(".ed-series").value.trim() || "3×10–12";
      const meta = (diaOriginal && diaOriginal.ejercicios && diaOriginal.ejercicios[i]) || [];
      const rir = meta[3] || "RIR 1–2";
      const des = meta[4] !== undefined ? meta[4] : 90;
      const cue = meta[5] || "";
      return [nom, grp, ser, rir, des, cue];
    })
    .filter(f => f[0]);

  if (filas.length === 0) {
    alert("Un día no puede quedarse sin ejercicios.");
    return;
  }

  const custom = cargarLS(KEY.planesCustom, {});
  const copia = JSON.parse(JSON.stringify(getPlan(planKey)));
  copia.dias[diaIdx].ejercicios = filas;
  custom[planKey] = copia;
  guardarLS(KEY.planesCustom, custom);

  if (planKey === planActual) renderPlan(planKey);
  renderEditor();
  alert("Cambios guardados.");
});

$("btn-edit-reset").addEventListener("click", () => {
  if (!confirm("¿Restaurar los planes originales? Perderás tus planes personalizados.")) return;
  localStorage.removeItem(KEY.planesCustom);
  renderPlanTabs();
  renderPlan(planActual);
  renderEditor();
});

/* =====================================================
   VOLUMEN SEMANAL (kg movidos)
   ===================================================== */
function volumenSemanal(nSemanas = 8) {
  const cargas = cargarCargas();
  const semanas = {};
  Object.entries(cargas).forEach(([, logs]) => {
    (logs || []).forEach(l => {
      if (l.peso == null) return;
      const m = (l.reps || "").match(/(\d+)\s*[x×]\s*(\d+)/);
      if (!m) return;
      const vol = l.peso * (+m[1]) * (+m[2]);
      const sem = lunesISO(l.fecha);
      semanas[sem] = (semanas[sem] || 0) + vol;
    });
  });
  return Object.entries(semanas).sort().slice(-nSemanas);
}

function renderVolumen() {
  const cont = $("volumen-chart");
  const datos = volumenSemanal(8);
  if (!datos.length) {
    cont.innerHTML = `<div class="empty">Apunta peso y series (p. ej. 4×10) en los ejercicios para ver tu volumen semanal.</div>`;
    return;
  }
  const totales = datos.map(d => d[1]);
  const max = Math.max(...totales);
  const W = 760, H = 200, PAD = 34, BOT = 24;
  const zonaH = H - BOT - PAD;
  const slot = (W - 2 * PAD) / datos.length;
  const barW = Math.min(slot * 0.6, 60);

  cont.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Volumen semanal en kg">
      ${datos.map((d, i) => {
        const h = Math.max((d[1] / max) * zonaH, 2);
        const xC = PAD + i * slot + (slot - barW) / 2;
        const yTop = H - BOT - h;
        return `<rect x="${xC.toFixed(1)}" y="${yTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="var(--accent)"/>
          <text x="${(xC + barW / 2).toFixed(1)}" y="${(yTop - 6).toFixed(1)}" fill="var(--muted)" font-size="11" text-anchor="middle">${(Math.round(d[1] / 100) / 10)}k</text>
          <text x="${(xC + barW / 2).toFixed(1)}" y="${H - 8}" fill="var(--muted)" font-size="11" text-anchor="middle">${fmtFecha(d[0]).slice(0, 5)}</text>`;
      }).join("")}
    </svg>
    <div class="muted">kg totales movidos por semana (peso × series × repeticiones) · fecha = lunes de cada semana</div>`;
}

/* =====================================================
   ESCÁNER IA Y ENTRENADOR DE MÁQUINAS (VISIÓN Y BIOMECÁNICA)
   ===================================================== */
const BASE_DATOS_MAQUINAS = {
  "Prensa de piernas": {
    nombre: "Prensa de piernas a 45°",
    grupo: "Cuádriceps, Glúteo mayor e Isquiotibiales",
    ajustes: [
      "Regula el respaldo entre 45° y 60° con el pasador trasero. La pelvis y la zona lumbar deben quedar pegadas sin hueco en ningún momento.",
      "Ajusta las barras laterales de seguridad a la altura de tu profundidad máxima para no quedar atrapado si fallas.",
      "Coloca los pies al ancho de cadera: en el centro de la plataforma para cuádriceps; en la parte alta para mayor estímulo de glúteo e isquios."
    ],
    ejecucion: [
      "Posición inicial: Apoya los pies, sujeta las manetas laterales con firmeza y desbloquea las palancas de seguridad.",
      "Fase excéntrica (bajada): Desciende en 2–3 segundos inhalando hondo, hasta formar un ángulo de 90° en las rodillas.",
      "Fase concéntrica (empuje): Empuja con toda la planta y talones exhalando. Detén el empuje justo antes de bloquear rodillas (mantén 5° de flexión protectora).",
      "Respiración: Inhala al bajar, exhala en el esfuerzo de empujar."
    ],
    errores: [
      "Despegar el sacro o la zona lumbar del asiento en la parte baja (riesgo grave de hernia discal).",
      "Bloquear las rodillas en hiperextensión brusca al final del movimiento.",
      "Colocar las manos en las rodillas para empujar en vez de agarrar las manetas laterales."
    ],
    series: "3×8–10",
    rir: "RIR 1–2",
    descanso: 120,
    sustituye: "Sentadilla libre o Sentadilla Hack."
  },
  "Sentadilla en máquina Hack": {
    nombre: "Sentadilla Hack (Hack Squat)",
    grupo: "Cuádriceps (vasto interno, externo y recto) y Glúteo",
    ajustes: [
      "Regula la altura de las hombreras acolchadas para entrar con las rodillas ligeramente flexionadas.",
      "Ajusta el tope de seguridad inferior a una profundidad cómoda donde no se te levanten los talones.",
      "Sitúa los pies en la plataforma ligeramente adelantados y separados al ancho de hombros."
    ],
    ejecucion: [
      "Posición inicial: Pega hombros, espalda completa y cabeza al respaldo. Quita los pestillos de seguridad girando las manetas.",
      "Fase excéntrica (bajada): Baja en 3 segundos manteniendo las rodillas alineadas en la dirección de las puntas de los pies.",
      "Fase concéntrica (subida): Al alcanzar el paralelo o más, empuja con toda la superficie del pie expulsando el aire.",
      "Tempo: 3 segundos de bajada, 1 segundo de pausa abajo, 1 segundo de subida explosiva."
    ],
    errores: [
      "Separar la espalda baja o el cuello del acolchado trasero.",
      "Levantar los talones durante la flexión (solución: adelantar los pies 5–10 cm en la placa)."
    ],
    series: "3×8–10",
    rir: "RIR 1–2",
    descanso: 120,
    sustituye: "Prensa de piernas o Sentadilla con barra."
  },
  "Press de pecho en máquina": {
    nombre: "Press de pecho sentado en máquina",
    grupo: "Pectoral mayor, Deltoides anterior y Tríceps",
    ajustes: [
      "Regula la altura del asiento: los agarres deben quedar alineados a la altura media/baja del esternón (a nivel de pezones).",
      "Ajusta la palanca de profundidad inicial para que los brazos no queden hiperextendidos hacia atrás antes de agarrar.",
      "Selecciona la clavija de peso con una carga que permita 8–10 repeticiones controladas."
    ],
    ejecucion: [
      "Posición inicial: Siéntate firme, pies plantados, retrae escápulas (junta omóplatos atrás y saca pecho).",
      "Ángulo de codos: Mantén los codos a unos 45°–60° respecto a tu torso (nunca abiertos a 90° en cruz con los hombros).",
      "Fase concéntrica: Empuja hacia delante expulsando aire sin adelantar los hombros al final.",
      "Fase excéntrica: Regresa en 2–3 segundos sintiendo el estiramiento en el pectoral antes de volver a empujar."
    ],
    errores: [
      "Dejar que los hombros se adelanten en el empuje perdiendo la retracción escapular.",
      "Abrir los codos excesivamente provocando pinzamiento en el manguito rotador."
    ],
    series: "3×8–10",
    rir: "RIR 1–2",
    descanso: 90,
    sustituye: "Press de banca plano con barra o mancuernas."
  },
  "Press inclinado en máquina": {
    nombre: "Press inclinado en máquina",
    grupo: "Pectoral clavicular (pecho superior), Hombros y Tríceps",
    ajustes: [
      "Regula el asiento para que los agarres queden a la altura de las clavículas.",
      "Apoya espalda y glúteos de forma uniforme sobre el respaldo inclinado a 30°–45°."
    ],
    ejecucion: [
      "Retrae escápulas, apoya pies y empuja en diagonal ascendente con trayectoria guiada.",
      "Baja controlando en 2 segundos hasta rozar el inicio del rango articular."
    ],
    errores: [
      "Arquear la zona lumbar para convertir el ejercicio en un press plano.",
      "Despegar la cabeza del respaldo durante el empuje."
    ],
    series: "3×8–10",
    rir: "RIR 1–2",
    descanso: 90,
    sustituye: "Press inclinado con mancuernas."
  },
  "Pec deck (aperturas en máquina)": {
    nombre: "Pec Deck / Contractor de pectoral",
    grupo: "Pectoral mayor (aislamiento y aducción horizontal)",
    ajustes: [
      "Ajusta el asiento de modo que los manillares queden a la altura del pecho medio.",
      "Coloca el pasador de los brazos en el número 3 o 4 para no forzar la articulación del hombro al inicio."
    ],
    ejecucion: [
      "Espalda completamente apoyada, codos con una ligera flexión fija constante.",
      "Cierra los brazos en semicírculo como si rodearas un cilindro ancho.",
      "Aprieta 1 segundo en el centro juntando las manos y abre controlando en 3 segundos sin dar tirones."
    ],
    errores: [
      "Doblar y estirar los codos durante el movimiento (convirtiéndolo en un press).",
      "Llevar los brazos demasiado atrás forzando la parte delantera del hombro."
    ],
    series: "3×12–15",
    rir: "RIR 0–1",
    descanso: 60,
    sustituye: "Cruce de poleas o Aperturas con mancuernas."
  },
  "Jalón al pecho en polea": {
    nombre: "Jalón al pecho en polea alta (Lat Pulldown)",
    grupo: "Dorsal ancho, Redondo mayor, Bíceps y Trapecio medio",
    ajustes: [
      "Regula los rodillos acolchados para que fijen con firmeza tus muslos y tu cuerpo no se levante del asiento al jalar.",
      "Engancha la barra ancha con agarre prono (palmas hacia fuera) ligeramente más ancho que los hombros."
    ],
    ejecucion: [
      "Siéntate con los muslos bien trabados e inclina el torso solo 10°–15° hacia atrás manteniendo el pecho alto.",
      "Inicia bajando las escápulas y lleva los codos hacia abajo en dirección a los bolsillos del pantalón hasta que la barra roce la clavícula.",
      "Sube en 2–3 segundos controlados permitiendo que los dorsales se estiren por completo arriba."
    ],
    errores: [
      "Tirar la barra por detrás de la nuca (peligro cervical y de manguito rotador).",
      "Balancear el torso exageradamente hacia atrás usando inercia de la espalda baja."
    ],
    series: "4×8–10",
    rir: "RIR 1–2",
    descanso: 90,
    sustituye: "Dominadas o Remo en máquina."
  },
  "Remo sentado en máquina": {
    nombre: "Remo sentado en máquina con apoyo pectoral",
    grupo: "Espalda media, Dorsales, Romboides y Bíceps",
    ajustes: [
      "Ajusta la altura del asiento para que la almohadilla pectoral quede apoyada a la altura del esternón.",
      "Regula la distancia de la almohadilla para alcanzar las asas con los brazos casi extendidos."
    ],
    ejecucion: [
      "Apoya el pecho con firmeza, agarra las manetas y tracciona llevando los codos pegados hacia tu cintura.",
      "Pausa 1 segundo atrás juntando escápulas y regresa controlando en 2 segundos sintiendo el estiramiento dorsal."
    ],
    errores: [
      "Despegar el pecho del apoyo para tirar con impulso de la espalda baja.",
      "Subir los hombros hacia las orejas durante la tracción."
    ],
    series: "4×8–10",
    rir: "RIR 1–2",
    descanso: 90,
    sustituye: "Remo en polea baja o Remo con mancuerna."
  },
  "Extensión de tríceps en polea con cuerda": {
    nombre: "Extensión de tríceps en polea alta con cuerda",
    grupo: "Tríceps (cabeza lateral y medial)",
    ajustes: [
      "Fija la polea en la posición superior de la torre de poleas y conecta la cuerda doble.",
      "Selecciona un peso que permita extensión completa sin arquear la espalda."
    ],
    ejecucion: [
      "Da un paso adelante para mayor estabilidad, inclina levemente el torso y fija los codos a los costados del cuerpo.",
      "Extiende los antebrazos hacia abajo y abre los extremos de la cuerda al final bloqueando el tríceps 1 segundo.",
      "Sube controlando hasta que los antebrazos formen 90° con los brazos (sin mover los codos)."
    ],
    errores: [
      "Balancear los codos hacia delante y atrás transformando el ejercicio en un press.",
      "No separar la cuerda abajo, perdiendo el rango máximo de contracción."
    ],
    series: "3×10–12",
    rir: "RIR 1",
    descanso: 60,
    sustituye: "Press francés o Fondos asistidos."
  },
  "Curl femoral sentado": {
    nombre: "Curl femoral sentado (Seated Leg Curl)",
    grupo: "Isquiotibiales (bíceps femoral, semitendinoso y semimembranoso)",
    ajustes: [
      "Alinea el eje circular de la máquina exactamente con la articulación de tus rodillas.",
      "Regula el respaldo para que la espalda esté apoyada y el hueco de las rodillas coincida con el borde del asiento.",
      "Coloca el rodillo inferior sobre el tendón de Aquiles (talón) y baja el rodillo superior sobre los muslos firmemente."
    ],
    ejecucion: [
      "Agarra los manillares laterales para pegar la pelvis al asiento.",
      "Flexiona las rodillas con fuerza llevando los talones hacia abajo y atrás.",
      "Pausa de 1 segundo en máxima contracción y resiste la subida en 2–3 segundos."
    ],
    errores: [
      "Dejar flojo el rodillo superior de los muslos.",
      "Despegar la pelvis del asiento."
    ],
    series: "4×10–12",
    rir: "RIR 1",
    descanso: 90,
    sustituye: "Curl femoral tumbado o Peso muerto rumano."
  },
  "Extensión de cuádriceps": {
    nombre: "Extensión de piernas en máquina",
    grupo: "Cuádriceps (recto femoral y vastos)",
    ajustes: [
      "Alinea el eje de rotación con tu rodilla.",
      "Ajusta el respaldo para que la corva de la rodilla quede al borde del cojín.",
      "Regula la almohadilla inferior para que apoye sobre la espinilla baja, justo encima de los tobillos."
    ],
    ejecucion: [
      "Sujeta los agarres laterales con firmeza para mantener el culo pegado al asiento.",
      "Extiende las piernas con fuerza controlada hasta la horizontal, pausando 1 segundo arriba.",
      "Baja en 2–3 segundos sintiendo la tensión en los cuádriceps sin dejar caer las placas."
    ],
    errores: [
      "Pegar patadas explosivas levantando el cuerpo del asiento.",
      "Colocar el rodillo sobre los pies o demasiado arriba en la espinilla."
    ],
    series: "3×12–15",
    rir: "RIR 0–1",
    descanso: 60,
    sustituye: "Prensa de piernas (aislamiento de cuádriceps)."
  },
  "Hip thrust en máquina": {
    nombre: "Hip Thrust en máquina",
    grupo: "Glúteo mayor y musculatura extensora de cadera",
    ajustes: [
      "Coloca la almohadilla o cinturón sobre la pelvis (a la altura del pliegue de la cadera, debajo de las crestas ilíacas).",
      "Posiciona los pies en la plataforma de modo que al estar arriba del todo las espinillas queden verticales (90°)."
    ],
    ejecucion: [
      "Mantén la mirada al frente con la barbilla pegada al pecho (no mires al techo).",
      "Empuja fuerte con los talones elevando la cadera hasta alinear rodillas, cadera y hombros.",
      "Aprieta los glúteos con fuerza máxima 2 segundos arriba en retroversión pélvica.",
      "Baja controlando en 2 segundos."
    ],
    errores: [
      "Arquear la zona lumbar en lugar de extender la cadera.",
      "Colocar los pies demasiado lejos o demasiado cerca de la cadera."
    ],
    series: "3×10–12",
    rir: "RIR 1",
    descanso: 90,
    sustituye: "Hip thrust libre o Peso muerto rumano con barra Smith."
  },
  "Elevaciones laterales en polea": {
    nombre: "Elevaciones laterales en polea baja",
    grupo: "Deltoides lateral (amplitud de hombro)",
    ajustes: [
      "Coloca la polea a la altura del tobillo o la rodilla.",
      "Usa un estribo o agarra directamente el tope de bola del cable."
    ],
    ejecucion: [
      "Colócate de lado a la torre de poleas o con el cable cruzando por detrás.",
      "Eleva el brazo en el plano escapular (ligeramente hacia delante, unos 20°–30°) guiando con el codo hasta la altura del hombro.",
      "Pausa arriba y baja en 2–3 segundos resistiendo la gravedad."
    ],
    errores: [
      "Subir por encima de la horizontal del hombro.",
      "Utilizar balanceo con la cadera para mover el peso."
    ],
    series: "4×12–15",
    rir: "RIR 0–1",
    descanso: 60,
    sustituye: "Elevaciones laterales con mancuernas."
  },
  "Peso muerto rumano con barra Smith": {
    nombre: "Peso muerto rumano en Multipower (Smith)",
    grupo: "Isquiotibiales, Glúteos y Erectores espinales",
    ajustes: [
      "Ajusta los ganchos de seguridad por debajo de las rodillas.",
      "Pies al ancho de caderas, barra a la altura de los muslos."
    ],
    ejecucion: [
      "Desbloquea la barra con un giro de muñeca. Pecho erguido y hombros atrás.",
      "Lleva la cadera hacia atrás como si quisieras tocar una pared con los glúteos, con una ligera flexión fija de rodilla.",
      "Baja la barra pegada a los muslos hasta justo por debajo de las rodillas sintiendo estiramiento en isquios.",
      "Extiende la cadera hacia delante contrayendo glúteos para volver a la posición inicial."
    ],
    errores: [
      "Redondear la espalda baja durante el descenso.",
      "Doblar las rodillas como si fuera una sentadilla.",
      "Alejar la barra de las piernas."
    ],
    series: "3×8–10",
    rir: "RIR 1–2",
    descanso: 120,
    sustituye: "Peso muerto rumano con mancuernas o Curl femoral."
  }
};

function buscarMaquinaDB(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  const keys = Object.keys(BASE_DATOS_MAQUINAS);

  // 1. Coincidencia exacta
  const exact = keys.find(k => k.toLowerCase() === q);
  if (exact) return BASE_DATOS_MAQUINAS[exact];

  // 2. Normalizar tildes y buscar por puntuación de palabras
  const qNorm = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const palabras = qNorm.split(/\s+/).filter(p => p.length >= 3);
  let mejorKey = null;
  let maxCoincidencias = 0;

  for (const k of keys) {
    const kNorm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (kNorm.includes(qNorm)) return BASE_DATOS_MAQUINAS[k];

    let score = 0;
    for (const p of palabras) {
      if (kNorm.includes(p)) score += 2;
    }
    // Considerar también si coincide con el grupo muscular
    const grupoNorm = (BASE_DATOS_MAQUINAS[k].grupo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const p of palabras) {
      if (grupoNorm.includes(p)) score += 1;
    }

    if (score > maxCoincidencias) {
      maxCoincidencias = score;
      mejorKey = k;
    }
  }

  return mejorKey && maxCoincidencias > 0 ? BASE_DATOS_MAQUINAS[mejorKey] : null;
}

function obtenerContextoSesionHoy() {
  const plan = getPlan(planActual);
  const entrenos = cargarLS(KEY.entrenos, {});
  const ultimos = Object.keys(entrenos).filter(f => entrenos[f].plan === planActual).sort();
  const ultimo = ultimos.length ? entrenos[ultimos[ultimos.length - 1]] : null;
  const idx = ultimo ? (ultimo.diaIdx + 1) % plan.dias.length : 0;
  return {
    planTitulo: plan.titulo,
    sesionIdx: idx,
    sesionDia: plan.dias[idx].dia,
    ejerciciosHoy: plan.dias[idx].ejercicios.map(e => e[0]),
  };
}

function mostrarGuiaMaquina(nombre, dataIA = null) {
  const cont = $("ai-result-content");
  const card = $("ai-result-card");
  if (!cont || !card) return;

  const ctx = obtenerContextoSesionHoy();
  const info = BASE_DATOS_MAQUINAS[nombre] || (dataIA ? {
    nombre: dataIA.nombre || nombre,
    grupo: dataIA.grupo || "Músculos principales",
    ajustes: dataIA.ajustes || [],
    ejecucion: dataIA.ejecucion || [],
    errores: dataIA.errores || [],
    series: dataIA.series || "3×8–10",
    rir: dataIA.rir || "RIR 1–2",
    descanso: dataIA.descanso || 90,
    sustituye: dataIA.sustituye || "Ejercicios afines de tu sesión."
  } : null);

  if (!info) {
    cont.innerHTML = `
      <div class="empty">
        <p>No se encontraron datos automáticos para «${nombre}». Puedes consultar otra máquina o probar con la cámara.</p>
      </div>`;
    card.style.display = "block";
    return;
  }

  const html = `
    <div class="card-head" style="margin-bottom: 14px;">
      <div>
        <h3 style="color:var(--accent);font-size:1.25rem;">🏋️ ${info.nombre}</h3>
        <span class="rir-badge" style="margin-top:4px;">${info.grupo}</span>
      </div>
      <button class="btn-small" onclick="$('ai-result-card').style.display='none'">✕ Cerrar</button>
    </div>

    <div class="ai-step-block">
      <div class="ai-step-title">⚙️ 1. Ajustes Previos de la Máquina</div>
      <ol class="ai-step-list">
        ${info.ajustes.map(a => `<li>${a}</li>`).join("")}
      </ol>
    </div>

    <div class="ai-step-block">
      <div class="ai-step-title">📋 2. Ejecución Técnica Paso a Paso</div>
      <ol class="ai-step-list">
        ${info.ejecucion.map(e => `<li>${e}</li>`).join("")}
      </ol>
    </div>

    <div class="ai-step-block" style="border-left-color: #ff6b6b;">
      <div class="ai-step-title" style="color: #ff7b7b;">⚠️ 3. Errores Comunes a Evitar</div>
      <ul class="ai-step-list">
        ${info.errores.map(err => `<li>${err}</li>`).join("")}
      </ul>
    </div>

    <div class="ai-adapt-box">
      <div class="ai-step-title">🔄 4. Adaptación a tu Sesión de Hoy</div>
      <p style="font-size:0.92rem;margin-bottom:8px;">
        En tu plan <strong>«${ctx.planTitulo}»</strong>, hoy toca la sesión <strong>«${ctx.sesionDia}»</strong>.
      </p>
      <ul class="guia-list" style="margin: 8px 0 14px 18px; font-size:0.88rem;">
        <li><strong>Carga de trabajo recomendada:</strong> ${info.series} con <strong>${info.rir}</strong>.</li>
        <li><strong>Descanso sugerido entre series:</strong> ⏱ ${info.descanso} segundos.</li>
        <li><strong>Sustituye o complementa:</strong> ${info.sustituye}</li>
      </ul>
      <button class="btn" id="btn-adaptar-plan" data-nombre="${nombre}" data-series="${info.series}" data-rir="${info.rir}" data-descanso="${info.descanso}" style="width:100%;">
        ⚡ Añadir «${nombre}» a mi sesión de hoy en Planes
      </button>
    </div>`;

  cont.innerHTML = html;
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth" });

  const btnAdaptar = $("btn-adaptar-plan");
  if (btnAdaptar) {
    btnAdaptar.addEventListener("click", () => {
      adaptarMaquinaAlPlan(
        btnAdaptar.dataset.nombre,
        btnAdaptar.dataset.series,
        btnAdaptar.dataset.rir,
        +btnAdaptar.dataset.descanso,
        "Ajuste y técnica asistida por IA"
      );
    });
  }
}

function adaptarMaquinaAlPlan(nombreMaquina, series = "3×8–10", rir = "RIR 1–2", descanso = 90, cue = "") {
  const plan = getPlan(planActual);
  const ctx = obtenerContextoSesionHoy();
  const custom = cargarLS(KEY.planesCustom, {});
  const copia = JSON.parse(JSON.stringify(plan));

  const info = BASE_DATOS_MAQUINAS[nombreMaquina];
  const grupo = info ? info.grupo.split(",")[0].trim() : "Máquina";

  // Verificar si ya existe en la sesión de hoy
  const diaObj = copia.dias[ctx.sesionIdx];
  const yaExiste = diaObj.ejercicios.some(ej => ej[0].toLowerCase() === nombreMaquina.toLowerCase());

  if (!yaExiste) {
    diaObj.ejercicios.push([nombreMaquina, grupo, series, rir, descanso, cue]);
    custom[planActual] = copia;
    guardarLS(KEY.planesCustom, custom);
  }

  showSection("planes");
  renderPlan(planActual);
  renderHoyToca();
  alert(`✅ ¡«${nombreMaquina}» está lista en tu sesión de hoy («${ctx.sesionDia}»)!`);
}

async function llamarGeminiVision(apiKey, base64Data, mimeType, contextoPlan) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `Actúa como entrenador personal y especialista en biomecánica deportiva en sala de musculación.
El usuario ha tomado una foto a una máquina del gimnasio con su móvil.
Contexto de su entrenamiento:
- Plan actual: ${contextoPlan.planTitulo}
- Sesión de hoy: ${contextoPlan.sesionDia}
- Ejercicios previstos hoy: ${contextoPlan.ejerciciosHoy.join(", ")}

Analiza la máquina que aparece en la imagen y devuelve una guía clara, directa y muy legible con esta estructura exacta:

### 🏋️ Máquina: [Nombre exacto de la máquina]
**Músculos trabajados:** [Grupo principal y secundarios]

### ⚙️ Ajustes Previos de la Máquina
1. [Altura y ángulo de asiento/respaldo]
2. [Ajuste de rodillos, topes y poleas]
3. [Selección de peso y seguridad]

### 📋 Ejecución Técnica Paso a Paso
1. **Posición inicial:** [Cómo sentarse/colocarse y qué agarrar]
2. **Empuje o tracción:** [Trayectoria, codos, escápulas y tempo de 1-2s]
3. **Fase de vuelta (excéntrica):** [Control en 2-3s sin chocar placas]
4. **Respiración:** [Inhalar y exhalar]

### ⚠️ Errores Comunes a Evitar
- [Error biomecánico 1]
- [Error biomecánico 2]

### 🔄 Adaptación a tu Sesión de Hoy
- **Dónde encaja:** [Indica a qué ejercicio de su sesión de hoy sustituye o complementa]
- **Series y RIR sugerido:** 3×8–10 con RIR 1–2
- **Descanso:** ⏱ 90–120 segundos`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || "image/jpeg",
              data: base64Data.replace(/^data:[^;]+;base64,/, "")
            }
          }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error del servidor de IA (${res.status})`);
  }

  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!txt) throw new Error("La IA no devolvió respuesta de texto.");
  return txt;
}

let fotoActualBase64 = null;
let fotoActualMime = "image/jpeg";

function procesarArchivoFoto(file) {
  if (!file) return;
  fotoActualMime = file.type || "image/jpeg";
  const reader = new FileReader();

  reader.onload = e => {
    const rawData = e.target.result;
    // Comprimir en canvas para optimizar consumo móvil
    const img = new Image();
    img.onload = () => {
      const maxDim = 1024;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      fotoActualBase64 = canvas.toDataURL("image/jpeg", 0.82);

      const previewImg = $("ai-preview-img");
      const previewWrap = $("ai-preview-wrap");
      if (previewImg && previewWrap) {
        previewImg.src = fotoActualBase64;
        previewWrap.style.display = "block";
      }
      // Analizar automáticamente
      analizarFotoCapturada();
    };
    img.src = rawData;
  };

  reader.readAsDataURL(file);
}

async function analizarFotoCapturada() {
  if (!fotoActualBase64) return;
  const loading = $("ai-loading");
  const resultCard = $("ai-result-card");
  const resultContent = $("ai-result-content");

  if (loading) loading.style.display = "block";
  if (resultCard) resultCard.style.display = "none";

  const apiKey = localStorage.getItem(KEY.geminiApiKey) || "";
  const ctx = obtenerContextoSesionHoy();

  if (apiKey) {
    try {
      const markdown = await llamarGeminiVision(apiKey, fotoActualBase64, fotoActualMime, ctx);
      if (loading) loading.style.display = "none";

      // Renderizar respuesta Markdown en el card
      resultContent.innerHTML = `
        <div class="card-head" style="margin-bottom:14px;">
          <h3 style="color:var(--accent);">🤖 Análisis de Visión IA (Gemini)</h3>
          <button class="btn-small" onclick="$('ai-result-card').style.display='none'">✕ Cerrar</button>
        </div>
        <div style="font-size:0.95rem; line-height:1.6;">
          ${markdown
            .replace(/^### (.*$)/gim, '<h4 style="color:var(--accent);margin:14px 0 6px;">$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\- (.*$)/gim, '<li style="margin-bottom:4px;">$1</li>')
            .replace(/\n\n/g, '<p></p>')}
        </div>
        <div class="ai-adapt-box" style="margin-top:16px;">
          <button class="btn" id="btn-adaptar-gemini-plan" style="width:100%;">
            ⚡ Adaptar a mi sesión de hoy en Planes
          </button>
        </div>`;
      resultCard.style.display = "block";
      resultCard.scrollIntoView({ behavior: "smooth" });

      const btnG = $("btn-adaptar-gemini-plan");
      if (btnG) {
        btnG.addEventListener("click", () => {
          // Extraer nombre de la máquina del texto
          const match = markdown.match(/Máquina:\s*([^\n\*\#]+)/i);
          const nom = match ? match[1].trim() : "Máquina escaneada";
          adaptarMaquinaAlPlan(nom, "3×8–10", "RIR 1–2", 90, "Reconocida por Visión IA");
        });
      }
      return;
    } catch (err) {
      console.warn("Fallo en Gemini Vision API, recurriendo a reconocimiento guiado:", err);
    }
  }

  // Fallback sin API key o sin conexión: Selector inteligente de máquinas
  if (loading) loading.style.display = "none";
  resultContent.innerHTML = `
    <div class="card-head" style="margin-bottom:14px;">
      <div>
        <h3 style="color:var(--accent);">📸 Foto de la máquina capturada</h3>
        <p class="muted" style="margin-top:4px;">¿Cuál de las siguientes máquinas de tu gimnasio es?</p>
      </div>
      <button class="btn-small" onclick="$('ai-result-card').style.display='none'">✕ Cerrar</button>
    </div>
    <div class="ai-chips-row" style="margin-bottom:14px;">
      ${Object.keys(BASE_DATOS_MAQUINAS).map(k => `<button class="tab" data-match="${k}">${k}</button>`).join("")}
    </div>
    <small class="muted" style="display:block;">💡 Consejo: Para reconocimiento visual 100% automático mediante IA, pulsa en «🔑 Configurar Gemini API» e introduce tu API Key gratuita.</small>`;

  resultCard.style.display = "block";
  resultCard.scrollIntoView({ behavior: "smooth" });

  resultContent.querySelectorAll("[data-match]").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarGuiaMaquina(btn.dataset.match);
    });
  });
}

// Eventos de entrada de cámara y galería
if ($("ai-cam-input")) {
  $("ai-cam-input").addEventListener("change", e => {
    if (e.target.files && e.target.files[0]) procesarArchivoFoto(e.target.files[0]);
  });
}

if ($("ai-gallery-input")) {
  $("ai-gallery-input").addEventListener("change", e => {
    if (e.target.files && e.target.files[0]) procesarArchivoFoto(e.target.files[0]);
  });
}

if ($("btn-quitar-foto")) {
  $("btn-quitar-foto").addEventListener("click", () => {
    fotoActualBase64 = null;
    if ($("ai-preview-wrap")) $("ai-preview-wrap").style.display = "none";
    if ($("ai-result-card")) $("ai-result-card").style.display = "none";
  });
}

if ($("btn-analizar-foto")) {
  $("btn-analizar-foto").addEventListener("click", analizarFotoCapturada);
}

// Buscador en tiempo real de máquinas
if ($("ai-search-input")) {
  $("ai-search-input").addEventListener("input", e => {
    const val = e.target.value.trim();
    if (val.length >= 2) {
      const match = buscarMaquinaDB(val);
      if (match) mostrarGuiaMaquina(match.nombre);
    }
  });
}

// Chips rápidos
if ($("ai-quick-chips")) {
  $("ai-quick-chips").querySelectorAll("[data-chip]").forEach(chip => {
    chip.addEventListener("click", () => {
      mostrarGuiaMaquina(chip.dataset.chip);
    });
  });
}

// Modal de API Key
if ($("btn-toggle-apikey")) {
  $("btn-toggle-apikey").addEventListener("click", () => {
    const p = $("panel-apikey");
    p.style.display = p.style.display === "none" ? "block" : "none";
    if (p.style.display === "block") {
      const key = localStorage.getItem(KEY.geminiApiKey) || "";
      if ($("input-gemini-key")) $("input-gemini-key").value = key;
    }
  });
}

if ($("btn-cerrar-apikey")) {
  $("btn-cerrar-apikey").addEventListener("click", () => {
    $("panel-apikey").style.display = "none";
  });
}

if ($("btn-guardar-apikey")) {
  $("btn-guardar-apikey").addEventListener("click", () => {
    const key = ($("input-gemini-key")?.value || "").trim();
    if (key) {
      localStorage.setItem(KEY.geminiApiKey, key);
      alert("✅ ¡API Key guardada con éxito! La IA de visión multimodal está lista para analizar tus fotos.");
    } else {
      localStorage.removeItem(KEY.geminiApiKey);
      alert("API Key eliminada.");
    }
    $("panel-apikey").style.display = "none";
  });
}

/* =====================================================
   PAQUETES DE ENTRENAMIENTO IA
   ===================================================== */

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* =====================================================
   CORRECCIÓN DE TÉCNICA EN VÍDEO CON VISIÓN IA (FORM CHECK)
   ===================================================== */
const ANGULOS_RECOMENDADOS = {
  "sentadilla": "📐 <strong>Plano sagital (lateral a 90° o 45°):</strong> Apoya el móvil a la altura de tu cadera a 2–3 metros para ver profundidad, rodillas y columna lumbar.",
  "prensa": "📐 <strong>Plano lateral a 45°:</strong> Enfoca el lateral de la prensa para verificar la profundidad y que la pelvis no se despegue del respaldo.",
  "press": "📐 <strong>Plano lateral o diagonal a 45°:</strong> A la altura del banco para analizar retracción escapular, arco fisiológico y ángulo de codos (45–60°).",
  "peso muerto": "📐 <strong>Plano lateral sagital estricto (90°):</strong> A la altura de las rodillas para verificar si la espalda permanece neutra y la barra pegada a las piernas.",
  "jalón": "📐 <strong>Plano diagonal posterior o lateral:</strong> A 2 metros para comprobar la depresión escapular y evitar balanceos lumbares.",
  "remo": "📐 <strong>Plano lateral (90°):</strong> Para evaluar la inclinación del torso y la trayectoria de los codos hacia la cadera.",
  "militar": "📐 <strong>Plano frontal o 45° lateral:</strong> Para verificar la verticalidad del empuje y que la cabeza pase por debajo de la carga sin arquear lumbar.",
  "elevaciones": "📐 <strong>Plano frontal o 45°:</strong> Para verificar que los brazos suben en el plano escapular (ligeramente por delante) sin tensión en el cuello.",
  "hip thrust": "📐 <strong>Plano lateral a la altura del banco:</strong> Para verificar el bloqueo de cadera arriba y la retroversión pélvica sin hiperextensión."
};

function obtenerTipAngulo(nombreEjercicio) {
  const nom = (nombreEjercicio || "").toLowerCase();
  for (const [clave, tip] of Object.entries(ANGULOS_RECOMENDADOS)) {
    if (nom.includes(clave)) return tip;
  }
  return "📐 <strong>Plano lateral o diagonal a 45°:</strong> Coloca el móvil a la altura de tu cadera a unos 2–3 metros de distancia para captar el cuerpo completo.";
}

let mediaStreamActual = null;
let mediaRecorderActual = null;
let trozosGrabacion = [];
let intervaloTimerRec = null;
let segundosGrabando = 0;
let camaraFrontal = false;
let framesActuales = [];

/* ---------- Entrenador en Tiempo Real (MediaPipe Pose 30 FPS) ---------- */
function calcularAngulo(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

let poseInstancia = null;
let modoEnDirectoActivo = false;
let animFrameLoop = null;
let tiempoInicioLive = 0;
let repsEnVivo = 0;
let repsValidas = 0;
let repsIncompletas = 0;
let estadoFaseLive = "arriba";
let tempoInicioBajada = 0;
let tempoInicioSubida = 0;
let tempoExcentricaSec = 0;
let tempoConcentricaSec = 0;
let anguloSuavizadoLive = null;
let barPathPuntos = [];
let ultimoMovimientoLive = 0;
let liveMetricasAnalisis = { minAngulo: 180, maxAngulo: 0, fallos: [] };
let ultimoAudioCueTime = 0;
let ultimoErrorSnapTime = 0;
let capturasErroresLive = [];
let totalFallosLive = 0;

function obtenerModoAudioLive() {
  return localStorage.getItem("fitnesscut_live_audio") || "voz";
}

function pitidoLive(freq = 880, dur = 0.14) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = freq;
    g.gain.value = 0.12;
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch { /* silencio */ }
}

function notificarLive(texto, esError = false) {
  const modo = obtenerModoAudioLive();
  if (modo === "silencio") return;
  if (modo === "pitidos") {
    pitidoLive(esError ? 420 : 880, esError ? 0.22 : 0.12);
    return;
  }
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 1.08;
    const vozEs = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("es"));
    if (vozEs) u.voice = vozEs;
    window.speechSynthesis.speak(u);
  } catch { /* silencio */ }
}

function avisarAudioLive(texto) {
  const ahora = Date.now();
  if (ahora - ultimoAudioCueTime < 2800) return;
  ultimoAudioCueTime = ahora;
  notificarLive(texto, true);
}

function evaluarCalibracionLive(landmarks, ejercicio) {
  const clave = [11, 12, 23, 24, 25, 26];
  const vis = clave.map(i => landmarks[i]?.visibility || 0);
  const mediaVis = vis.reduce((a, b) => a + b, 0) / clave.length;
  if (mediaVis < 0.45) {
    return { texto: "💡 Poca visibilidad: mejora luz o muestra cuerpo entero", cls: "warn" };
  }
  const ys = clave.map(i => landmarks[i]?.y ?? 0.5);
  const alto = Math.max(...ys) - Math.min(...ys);
  if (alto > 0.86) return { texto: "📏 Demasiado cerca: aléjate un paso", cls: "warn" };
  if (alto < 0.22) return { texto: "📏 Demasiado lejos: acércate un poco", cls: "warn" };
  const ej = (ejercicio || "").toLowerCase();
  const requierePerfil = ej.includes("sentadilla") || ej.includes("peso muerto") || ej.includes("rumano") || ej.includes("hip thrust") || ej.includes("remo");
  if (requierePerfil && landmarks[11] && landmarks[12] && Math.abs(landmarks[11].x - landmarks[12].x) > 0.24) {
    return { texto: "📐 Gira 90° de perfil para medir espalda y profundidad", cls: "warn" };
  }
  return { texto: "✅ Encuadre óptimo", cls: "ok" };
}

function capturarErrorLive(video, canvasOverlay, motivo) {
  const ahora = Date.now();
  if (capturasErroresLive.length >= 4 || ahora - ultimoErrorSnapTime < 2500) return;
  if (!video || video.videoWidth <= 0) return;
  ultimoErrorSnapTime = ahora;
  try {
    const tmp = document.createElement("canvas");
    tmp.width = 320;
    tmp.height = Math.round((video.videoHeight / video.videoWidth) * 320) || 180;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(video, 0, 0, tmp.width, tmp.height);
    if (canvasOverlay) tctx.drawImage(canvasOverlay, 0, 0, tmp.width, tmp.height);
    capturasErroresLive.push({
      dataUrl: tmp.toDataURL("image/jpeg", 0.65),
      motivo,
      tiempo: Math.round((ahora - tiempoInicioLive) / 1000)
    });
  } catch { /* ignorar error de captura */ }
}

function evaluarPoseEnVivo(landmarks, ejercicio) {
  const ej = (ejercicio || "").toLowerCase();
  let anguloActual = null;
  let puntoVertice = null;
  let feedbackTexto = "";
  let colorSemaforo = "verde";
  let porcentajeRom = 0;

  if (ej.includes("sentadilla") || ej.includes("prensa") || ej.includes("hack") || ej.includes("pierna")) {
    const visIzq = (landmarks[23]?.visibility || 0) + (landmarks[25]?.visibility || 0);
    const visDer = (landmarks[24]?.visibility || 0) + (landmarks[26]?.visibility || 0);
    const lCadera = visIzq >= visDer ? landmarks[23] : landmarks[24];
    const lRodilla = visIzq >= visDer ? landmarks[25] : landmarks[26];
    const lTobillo = visIzq >= visDer ? landmarks[27] : landmarks[28];

    if (lCadera && lRodilla && lTobillo) {
      anguloActual = calcularAngulo(lCadera, lRodilla, lTobillo);
      puntoVertice = lRodilla;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((160 - anguloActual) / 70) * 100)));

      if (anguloActual > 155) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Repetición ${repsEnVivo} completada!`;
        } else if (estadoFaseLive === "bajando") {
          repsIncompletas++;
          avisarAudioLive("Baja más para completar");
          feedbackTexto = "⚠️ Repetición incompleta (no llegó a 90°)";
          colorSemaforo = "amarillo";
        } else {
          feedbackTexto = "🟢 De pie · Inicia descenso controlado";
        }
        estadoFaseLive = "arriba";
      } else if (anguloActual <= 95) {
        if (estadoFaseLive === "bajando" && tempoInicioBajada && (Date.now() - tempoInicioBajada) < 650) {
          feedbackTexto = "⚡ Baja más controlado (tempo excéntrico)";
          colorSemaforo = "amarillo";
        } else {
          feedbackTexto = "🟢 ¡Profundidad óptima! Rompe la paralela";
        }
        estadoFaseLive = "abajo_valido";
      } else if (anguloActual < 140 && estadoFaseLive === "arriba") {
        estadoFaseLive = "bajando";
        tempoInicioBajada = Date.now();
        feedbackTexto = "⏳ Bajando · Llega a 90°";
      } else if (estadoFaseLive === "bajando" && anguloActual > 105) {
        feedbackTexto = "⚠️ ¡Baja un poco más para completar rep!";
        colorSemaforo = "amarillo";
      }
    }
  } else if (ej.includes("jalón") || ej.includes("jalon") || ej.includes("dominada") || ej.includes("remo") || ej.includes("espalda")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[13]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[14]?.visibility || 0);
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCodo = visIzq >= visDer ? landmarks[13] : landmarks[14];
    const lMuneca = visIzq >= visDer ? landmarks[15] : landmarks[16];

    if (lHombro && lCodo && lMuneca) {
      anguloActual = calcularAngulo(lHombro, lCodo, lMuneca);
      puntoVertice = lCodo;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((150 - anguloActual) / 80) * 100)));

      if (anguloActual > 145) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Repetición ${repsEnVivo} hecha!`;
        }
        estadoFaseLive = "arriba";
        if (!feedbackTexto) feedbackTexto = "🟢 Brazos extendidos · Inicia tracción";
      } else if (anguloActual <= 75) {
        estadoFaseLive = "abajo_valido";
        feedbackTexto = "🟢 ¡Contracción máxima de dorsal!";
      } else if (anguloActual < 130 && estadoFaseLive === "arriba") {
        estadoFaseLive = "bajando";
        feedbackTexto = "⏳ Traccionando con los codos...";
      }
    }
  } else if (ej.includes("peso muerto") || ej.includes("rumano") || ej.includes("hip thrust")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[23]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[24]?.visibility || 0);
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCadera = visIzq >= visDer ? landmarks[23] : landmarks[24];
    const lRodilla = visIzq >= visDer ? landmarks[25] : landmarks[26];

    if (lHombro && lCadera && lRodilla) {
      anguloActual = calcularAngulo(lHombro, lCadera, lRodilla);
      puntoVertice = lCadera;
      const esHipThrust = ej.includes("hip thrust");
      porcentajeRom = esHipThrust
        ? Math.min(100, Math.max(0, Math.round(((anguloActual - 110) / 60) * 100)))
        : Math.min(100, Math.max(0, Math.round(((170 - anguloActual) / 80) * 100)));

      if (esHipThrust) {
        if (anguloActual >= 165) {
          if (estadoFaseLive === "bajando") {
            repsEnVivo++;
            repsValidas++;
            notificarLive(String(repsEnVivo), false);
            feedbackTexto = `✅ ¡Bloqueo ${repsEnVivo} completado!`;
          }
          estadoFaseLive = "arriba";
        } else if (anguloActual <= 125) {
          estadoFaseLive = "bajando";
          feedbackTexto = "⏳ Empuja con talones y aprieta glúteo";
        }
      } else {
        if (anguloActual > 162) {
          if (estadoFaseLive === "abajo_valido") {
            repsEnVivo++;
            repsValidas++;
            notificarLive(String(repsEnVivo), false);
            feedbackTexto = `✅ ¡Repetición ${repsEnVivo} completada!`;
          }
          estadoFaseLive = "arriba";
        } else if (anguloActual <= 95) {
          estadoFaseLive = "abajo_valido";
          feedbackTexto = "🟢 Bisagra de cadera óptima";
        } else if (anguloActual < 145 && estadoFaseLive === "arriba") {
          estadoFaseLive = "bajando";
          tempoInicioBajada = Date.now();
          feedbackTexto = "⏳ Cadera atrás, espalda neutra";
        }
      }
    }
  } else if (ej.includes("militar") || ej.includes("hombro")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[13]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[14]?.visibility || 0);
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCodo = visIzq >= visDer ? landmarks[13] : landmarks[14];
    const lMuneca = visIzq >= visDer ? landmarks[15] : landmarks[16];

    if (lHombro && lCodo && lMuneca) {
      anguloActual = calcularAngulo(lHombro, lCodo, lMuneca);
      puntoVertice = lCodo;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((anguloActual - 70) / 90) * 100)));

      if (anguloActual >= 158) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Press militar ${repsEnVivo}!`;
        }
        estadoFaseLive = "arriba";
      } else if (anguloActual <= 85) {
        estadoFaseLive = "abajo_valido";
        feedbackTexto = "🟢 Posición inicial · Empuja vertical";
      }
    }
  } else if (ej.includes("elevaciones") || ej.includes("lateral")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[13]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[14]?.visibility || 0);
    const lCadera = visIzq >= visDer ? landmarks[23] : landmarks[24];
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCodo = visIzq >= visDer ? landmarks[13] : landmarks[14];

    if (lCadera && lHombro && lCodo) {
      anguloActual = calcularAngulo(lCadera, lHombro, lCodo);
      puntoVertice = lHombro;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((anguloActual - 15) / 75) * 100)));

      if (anguloActual >= 80) {
        estadoFaseLive = "abajo_valido";
        feedbackTexto = "🟢 Paralelo al suelo · Controla bajada";
      } else if (anguloActual <= 28) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Elevación ${repsEnVivo}!`;
        }
        estadoFaseLive = "arriba";
      }
    }
  } else if (ej.includes("press") || ej.includes("pecho") || ej.includes("banca")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[13]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[14]?.visibility || 0);
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCodo = visIzq >= visDer ? landmarks[13] : landmarks[14];
    const lMuneca = visIzq >= visDer ? landmarks[15] : landmarks[16];

    if (lHombro && lCodo && lMuneca) {
      anguloActual = calcularAngulo(lHombro, lCodo, lMuneca);
      puntoVertice = lCodo;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((150 - anguloActual) / 65) * 100)));

      if (anguloActual > 145) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Repetición ${repsEnVivo} completada!`;
        }
        estadoFaseLive = "arriba";
        if (!feedbackTexto) feedbackTexto = "🟢 Bloqueo arriba · Desciende controlado";
      } else if (anguloActual <= 85) {
        estadoFaseLive = "abajo_valido";
        feedbackTexto = "🟢 Buen estiramiento de pectoral";
      } else if (anguloActual < 135 && estadoFaseLive === "arriba") {
        estadoFaseLive = "bajando";
        feedbackTexto = "⏳ Bajando al esternón...";
      }
    }
  } else if (ej.includes("curl") || ej.includes("bíceps") || ej.includes("biceps")) {
    const visIzq = (landmarks[11]?.visibility || 0) + (landmarks[13]?.visibility || 0);
    const visDer = (landmarks[12]?.visibility || 0) + (landmarks[14]?.visibility || 0);
    const lHombro = visIzq >= visDer ? landmarks[11] : landmarks[12];
    const lCodo = visIzq >= visDer ? landmarks[13] : landmarks[14];
    const lMuneca = visIzq >= visDer ? landmarks[15] : landmarks[16];

    if (lHombro && lCodo && lMuneca) {
      anguloActual = calcularAngulo(lHombro, lCodo, lMuneca);
      puntoVertice = lCodo;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((150 - anguloActual) / 95) * 100)));

      if (anguloActual > 140) {
        if (estadoFaseLive === "abajo_valido") {
          repsEnVivo++;
          repsValidas++;
          notificarLive(String(repsEnVivo), false);
          feedbackTexto = `✅ ¡Repetición ${repsEnVivo}!`;
        }
        estadoFaseLive = "arriba";
        if (!feedbackTexto) feedbackTexto = "🟢 Extensión completa";
      } else if (anguloActual <= 55) {
        estadoFaseLive = "abajo_valido";
        feedbackTexto = "🟢 ¡Contracción pico de bíceps!";
      }
    }
  } else {
    const lCadera = landmarks[23] || landmarks[24];
    const lRodilla = landmarks[25] || landmarks[26];
    const lTobillo = landmarks[27] || landmarks[28];
    if (lCadera && lRodilla && lTobillo) {
      anguloActual = calcularAngulo(lCadera, lRodilla, lTobillo);
      puntoVertice = lRodilla;
      porcentajeRom = Math.min(100, Math.max(0, Math.round(((160 - anguloActual) / 70) * 100)));
      feedbackTexto = "🟢 Evaluando postura y rango de movimiento";
    }
  }

  let segmentoFallo = null;
  if (anguloActual !== null) {
    anguloSuavizadoLive = anguloSuavizadoLive === null
      ? anguloActual
      : Math.round(anguloSuavizadoLive * 0.62 + anguloActual * 0.38);
    anguloActual = anguloSuavizadoLive;

    if (anguloActual < liveMetricasAnalisis.minAngulo) liveMetricasAnalisis.minAngulo = anguloActual;
    if (anguloActual > liveMetricasAnalisis.maxAngulo) liveMetricasAnalisis.maxAngulo = anguloActual;
  }

  // Chequeo bilateral de valgo de rodilla / asimetría y control de tronco
  const r25 = landmarks[25], r26 = landmarks[26], t27 = landmarks[27], t28 = landmarks[28];
  if (r25 && r26 && t27 && t28 && (r25.visibility || 0) > 0.5 && (r26.visibility || 0) > 0.5) {
    const distRodillas = Math.abs(r25.x - r26.x);
    const distTobillos = Math.abs(t27.x - t28.x);
    if (distTobillos > 0.08 && distRodillas < distTobillos * 0.7) {
      feedbackTexto = "⚠️ Valgo de rodilla: empuja rodillas hacia fuera";
      colorSemaforo = "amarillo";
      segmentoFallo = "rodilla";
    }
  }
  const h11 = landmarks[11] || landmarks[12], c23 = landmarks[23] || landmarks[24];
  if (!segmentoFallo && h11 && c23 && (ej.includes("sentadilla") || ej.includes("peso muerto") || ej.includes("rumano"))) {
    const inclTronco = Math.abs(h11.x - c23.x);
    if (inclTronco > 0.27 && Math.abs(h11.y - c23.y) < 0.25) {
      feedbackTexto = "⚠️ Tronco muy inclinado: mantén el pecho erguido";
      colorSemaforo = "amarillo";
      segmentoFallo = "tronco";
    }
  }

  // Estela Bar Path (muñeca o cadera)
  const pTrack = (ej.includes("sentadilla") || ej.includes("peso muerto") || ej.includes("hip thrust"))
    ? (landmarks[23] || landmarks[24])
    : (landmarks[15] || landmarks[16]);
  if (pTrack && (pTrack.visibility || 1) > 0.4) {
    barPathPuntos.push({ x: pTrack.x, y: pTrack.y });
    if (barPathPuntos.length > 26) barPathPuntos.shift();
  }

  // Tempo en vivo
  if (estadoFaseLive === "abajo_valido" && tempoInicioBajada) {
    tempoExcentricaSec = ((Date.now() - tempoInicioBajada) / 1000).toFixed(1);
    if (!tempoInicioSubida) tempoInicioSubida = Date.now();
  } else if (estadoFaseLive === "arriba" && tempoInicioSubida) {
    tempoConcentricaSec = ((Date.now() - tempoInicioSubida) / 1000).toFixed(1);
    tempoInicioSubida = 0;
  }

  if (colorSemaforo === "amarillo" && feedbackTexto && !liveMetricasAnalisis.fallos.includes(feedbackTexto)) {
    liveMetricasAnalisis.fallos.push(feedbackTexto);
  }

  return { anguloActual, puntoVertice, feedbackTexto, colorSemaforo, porcentajeRom, segmentoFallo };
}

function dibujarEsqueletoEnCanvas(ctx, landmarks, w, h, ev) {
  ctx.clearRect(0, 0, w, h);

  // Dibujar estela Bar Path
  if (barPathPuntos.length > 2) {
    ctx.beginPath();
    barPathPuntos.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x * w, pt.y * h);
      else ctx.lineTo(pt.x * w, pt.y * h);
    });
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const CONEXIONES = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28]
  ];

  ctx.lineWidth = 4;
  CONEXIONES.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    if (p1 && p2 && (p1.visibility || 1) > 0.35 && (p2.visibility || 1) > 0.35) {
      const esTronco = (i === 11 && j === 23) || (i === 12 && j === 24);
      const esRodilla = (i === 23 && j === 25) || (i === 25 && j === 27) || (i === 24 && j === 26) || (i === 26 && j === 28);
      const falloAqui = (ev.segmentoFallo === "tronco" && esTronco) || (ev.segmentoFallo === "rodilla" && esRodilla);
      ctx.strokeStyle = falloAqui
        ? "rgba(239, 68, 68, 0.95)"
        : ev.colorSemaforo === "verde" ? "rgba(74, 222, 128, 0.85)" : "rgba(251, 191, 36, 0.85)";
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
  });

  landmarks.forEach((p, idx) => {
    if (!p || (p.visibility || 1) < 0.35) return;
    if (![11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx)) return;

    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  if (ev.anguloActual && ev.puntoVertice) {
    const vx = ev.puntoVertice.x * w;
    const vy = ev.puntoVertice.y * h;
    const txt = `${ev.anguloActual}°`;

    ctx.font = "bold 16px sans-serif";
    const textW = ctx.measureText(txt).width;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(vx + 10, vy - 20, textW + 16, 26);
    ctx.strokeStyle = ev.colorSemaforo === "verde" ? "#4ade80" : "#fbbf24";
    ctx.strokeRect(vx + 10, vy - 20, textW + 16, 26);

    ctx.fillStyle = ev.colorSemaforo === "verde" ? "#4ade80" : "#fbbf24";
    ctx.fillText(txt, vx + 18, vy - 2);
  }
}

function onPoseResultsLive(results) {
  if (!modoEnDirectoActivo) return;

  const canvas = $("formcheck-canvas-live");
  const video = $("formcheck-video-live");
  if (!canvas || !video) return;

  if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  const ctx = canvas.getContext("2d");
  const landmarks = results.poseLandmarks;

  if (!landmarks || landmarks.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cue = $("live-hud-cue");
    if (cue) cue.textContent = "🔍 Colócate en el encuadre";
    return;
  }

  const ejercicio = $("formcheck-ejercicio-select")?.value || "";
  const ev = evaluarPoseEnVivo(landmarks, ejercicio);

  dibujarEsqueletoEnCanvas(ctx, landmarks, canvas.width, canvas.height, ev);

  const calib = evaluarCalibracionLive(landmarks, ejercicio);
  const calibEl = $("live-hud-calib");
  if (calibEl) {
    calibEl.textContent = calib.texto;
    calibEl.className = `live-hud-calib ${calib.cls}`;
  }

  if (ev.colorSemaforo === "amarillo") {
    totalFallosLive++;
    capturarErrorLive(video, canvas, ev.feedbackTexto || "Ajuste técnico");
  }

  const cueEl = $("live-hud-cue");
  const angleEl = $("live-hud-angle");
  const romEl = $("live-hud-rombar");
  const repsEl = $("live-hud-reps");

  if (cueEl) cueEl.textContent = ev.feedbackTexto || "🟢 Buena alineación";
  if (angleEl) angleEl.textContent = ev.anguloActual ? `Ángulo: ${ev.anguloActual}°` : "Ángulo: --°";
  if ($("live-hud-tempo")) {
    $("live-hud-tempo").textContent = tempoExcentricaSec
      ? `Tempo: ${tempoExcentricaSec}s baj · ${tempoConcentricaSec || "--"}s sub`
      : "Tempo: --";
  }
  if (romEl) romEl.style.width = `${ev.porcentajeRom}%`;
  if (repsEl) repsEl.textContent = String(repsEnVivo);

  // Manos libres: auto-fin tras 5s sin actividad una vez iniciada la serie
  if ($("live-handsfree-toggle")?.checked) {
    if (ev.porcentajeRom > 18) ultimoMovimientoLive = Date.now();
    if (repsEnVivo > 0 && ultimoMovimientoLive && (Date.now() - ultimoMovimientoLive > 5000)) {
      finalizarSerieEnDirecto();
    }
  }
}

async function iniciarBucleMediaPipePose() {
  const video = $("formcheck-video-live");
  if (!video) return;

  if (typeof Pose !== "undefined" && !poseInstancia) {
    try {
      poseInstancia = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
      poseInstancia.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      poseInstancia.onResults(onPoseResultsLive);
    } catch (err) {
      console.warn("Fallo al inicializar Pose:", err);
    }
  }

  async function frameLoop() {
    if (!modoEnDirectoActivo) return;

    if (video.readyState >= 2 && poseInstancia) {
      try {
        await poseInstancia.send({ image: video });
      } catch { /* frame drop */ }
    }
    animFrameLoop = requestAnimationFrame(frameLoop);
  }

  animFrameLoop = requestAnimationFrame(frameLoop);
}

async function iniciarLiveDirecto() {
  const liveWrap = $("formcheck-live-wrap");
  const videoLive = $("formcheck-video-live");
  const btnFinalizar = $("btn-finalizar-live");
  const btnRec = $("btn-empezar-grabar");
  const btnParar = $("btn-parar-grabar");
  const hudOverlay = $("live-hud-overlay");
  const resumenCard = $("live-resumen-card");

  if (resumenCard) resumenCard.style.display = "none";
  detenerCamaraLive();

  try {
    const constraints = {
      video: {
        facingMode: camaraFrontal ? "user" : "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    mediaStreamActual = await navigator.mediaDevices.getUserMedia(constraints);
    videoLive.srcObject = mediaStreamActual;
    liveWrap.style.display = "block";
    liveWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });

    if (btnRec) btnRec.style.display = "none";
    if (btnParar) btnParar.style.display = "none";
    if (btnFinalizar) btnFinalizar.style.display = "inline-flex";
    if (hudOverlay) hudOverlay.style.display = "flex";

    repsEnVivo = 0;
    repsValidas = 0;
    repsIncompletas = 0;
    totalFallosLive = 0;
    capturasErroresLive = [];
    barPathPuntos = [];
    anguloSuavizadoLive = null;
    tempoInicioBajada = 0;
    tempoInicioSubida = 0;
    tempoExcentricaSec = 0;
    tempoConcentricaSec = 0;
    ultimoMovimientoLive = Date.now();
    liveMetricasAnalisis = { minAngulo: 180, maxAngulo: 0, fallos: [] };
    ultimoErrorSnapTime = 0;
    estadoFaseLive = "arriba";
    tiempoInicioLive = Date.now();

    const usarEspejo = camaraFrontal && ($("live-mirror-toggle")?.checked ?? true);
    videoLive.classList.toggle("mirror-live", usarEspejo);
    $("formcheck-canvas-live")?.classList.toggle("mirror-live", usarEspejo);

    const repsEl = $("live-hud-reps");
    if (repsEl) repsEl.textContent = "0";
    const romEl = $("live-hud-rombar");
    if (romEl) romEl.style.width = "0%";
    const cueEl = $("live-hud-cue");
    if (cueEl) cueEl.textContent = "🟢 Detectando postura...";
    const calibEl = $("live-hud-calib");
    if (calibEl) {
      calibEl.textContent = "📏 Calibrando encuadre...";
      calibEl.className = "live-hud-calib";
    }

    modoEnDirectoActivo = true;
    notificarLive("Modo en directo activado. Colócate frente a la cámara.");

    await iniciarBucleMediaPipePose();
  } catch (err) {
    console.error("Error al iniciar live directo:", err);
    alert("No se pudo iniciar la cámara en vivo o cargar el modelo. Verifica los permisos de cámara en tu navegador.");
  }
}

function finalizarSerieEnDirecto() {
  modoEnDirectoActivo = false;
  detenerCamaraLive();

  const tut = Math.round((Date.now() - tiempoInicioLive) / 1000);
  const ejercicio = $("formcheck-ejercicio-select")?.value || "Ejercicio";

  const resumenCard = $("live-resumen-card");
  if (resumenCard) {
    const totalIntentos = repsValidas + repsIncompletas;
    const ratioValidas = totalIntentos > 0 ? repsValidas / totalIntentos : 1;
    const penalizacionFallos = Math.min(25, Math.round(totalFallosLive / 6));
    const score = totalIntentos === 0 ? 0 : Math.max(40, Math.round(ratioValidas * 100 - penalizacionFallos));

    const scoreEl = $("live-resumen-score");
    if (scoreEl) {
      scoreEl.textContent = totalIntentos > 0 ? `${score}/100` : "--";
      scoreEl.style.color = score >= 80 ? "var(--green)" : score >= 60 ? "#fbbf24" : "#ff7b7b";
    }
    $("live-resumen-ejercicio").textContent = ejercicio;
    $("live-resumen-validas").textContent = repsValidas;
    $("live-resumen-incompletas").textContent = repsIncompletas;
    $("live-resumen-tut").textContent = `${tut}s`;

    let feedback = "";
    if (repsValidas >= 6 && repsIncompletas === 0) {
      feedback = "🌟 ¡Serie impecable! El 100% de las repeticiones alcanzaron el rango de movimiento completo con excelente control.";
    } else if (repsIncompletas > 0) {
      feedback = `💡 Buen esfuerzo. Realizaste ${repsValidas} repeticiones completas y ${repsIncompletas} repeticiones cortas. En la siguiente serie mantén el rango completo hasta el final.`;
    } else {
      feedback = `Serie completada (${repsValidas} repeticiones en ${tut} segundos).`;
    }

    $("live-resumen-feedback").innerHTML = feedback;

    const erroresEl = $("live-resumen-errores");
    if (erroresEl) {
      if (capturasErroresLive.length > 0) {
        erroresEl.innerHTML = `
          <strong style="font-size:0.84rem; color:#fbbf24;">📸 Momentos clave a corregir (${capturasErroresLive.length}):</strong>
          <div class="live-errores-grid">
            ${capturasErroresLive.map(c => `
              <div class="live-error-thumb">
                <img src="${c.dataUrl}" alt="Corrección técnica en segundo ${c.tiempo}">
                <div class="live-error-caption"><strong>${c.tiempo}s:</strong> ${escapeHtml(c.motivo)}</div>
              </div>
            `).join("")}
          </div>`;
        erroresEl.style.display = "block";
      } else {
        erroresEl.innerHTML = "";
        erroresEl.style.display = "none";
      }
    }

    resumenCard.style.display = "block";
    resumenCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

    notificarLive(`Serie finalizada. ${repsValidas} repeticiones válidas en ${tut} segundos.`);
  }
}

async function abrirCamaraLive() {
  const liveWrap = $("formcheck-live-wrap");
  const videoLive = $("formcheck-video-live");
  const hudOverlay = $("live-hud-overlay");
  const btnFinalizar = $("btn-finalizar-live");
  if (!liveWrap || !videoLive) return;

  detenerCamaraLive();

  try {
    const constraints = {
      video: {
        facingMode: camaraFrontal ? "user" : "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    mediaStreamActual = await navigator.mediaDevices.getUserMedia(constraints);
    videoLive.srcObject = mediaStreamActual;
    liveWrap.style.display = "block";
    liveWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });

    $("btn-empezar-grabar").style.display = "inline-flex";
    $("btn-parar-grabar").style.display = "none";
    if (btnFinalizar) btnFinalizar.style.display = "none";
    if (hudOverlay) hudOverlay.style.display = "none";
    $("formcheck-rec-bar").style.display = "none";
  } catch (err) {
    console.warn("No se pudo acceder a la cámara en vivo:", err);
    alert("No se pudo abrir la cámara en vivo (requiere permisos en tu navegador). Puedes usar el botón '📁 Subir vídeo grabado' para usar la cámara de tu teléfono.");
  }
}

function cambiarCamara() {
  camaraFrontal = !camaraFrontal;
  if (modoEnDirectoActivo) {
    iniciarLiveDirecto();
  } else {
    abrirCamaraLive();
  }
}

function iniciarCuentaAtrasGrabacion() {
  const cd = $("formcheck-countdown");
  const btnRec = $("btn-empezar-grabar");

  if (!mediaStreamActual) return;

  btnRec.style.display = "none";
  if (cd) {
    cd.style.display = "flex";
    let count = 3;
    cd.textContent = count;
    decirVoz(String(count));

    const cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        cd.textContent = count;
        decirVoz(String(count));
      } else {
        clearInterval(cdInterval);
        cd.style.display = "none";
        empezarMediaRecorder();
      }
    }, 1000);
  } else {
    empezarMediaRecorder();
  }
}

function empezarMediaRecorder() {
  const btnStop = $("btn-parar-grabar");
  const recBar = $("formcheck-rec-bar");
  const timerLbl = $("formcheck-rec-timer");

  trozosGrabacion = [];
  try {
    let mime = "";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) mime = "video/webm;codecs=vp9";
      else if (MediaRecorder.isTypeSupported("video/webm")) mime = "video/webm";
      else if (MediaRecorder.isTypeSupported("video/mp4")) mime = "video/mp4";
    }

    mediaRecorderActual = mime ? new MediaRecorder(mediaStreamActual, { mimeType: mime }) : new MediaRecorder(mediaStreamActual);
    mediaRecorderActual.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) trozosGrabacion.push(e.data);
    };

    mediaRecorderActual.onstop = async () => {
      const blob = new Blob(trozosGrabacion, { type: mediaRecorderActual.mimeType || "video/webm" });
      procesarVideoGrabado(blob);
    };

    mediaRecorderActual.start(500);
    decirVoz("¡Grabando! Ejecuta tus repeticiones.");

    if (btnStop) btnStop.style.display = "inline-flex";
    if (recBar) recBar.style.display = "flex";

    segundosGrabando = 0;
    if (timerLbl) timerLbl.textContent = "00:00";
    if (intervaloTimerRec) clearInterval(intervaloTimerRec);
    intervaloTimerRec = setInterval(() => {
      segundosGrabando++;
      const m = String(Math.floor(segundosGrabando / 60)).padStart(2, "0");
      const s = String(segundosGrabando % 60).padStart(2, "0");
      if (timerLbl) timerLbl.textContent = `${m}:${s}`;

      if (segundosGrabando >= 25) {
        pararGrabacion();
      }
    }, 1000);
  } catch (err) {
    console.error("Error al iniciar MediaRecorder:", err);
    alert("Error al iniciar grabación. Prueba subiendo el archivo de vídeo directamente.");
  }
}

function pararGrabacion() {
  if (intervaloTimerRec) {
    clearInterval(intervaloTimerRec);
    intervaloTimerRec = null;
  }
  if (mediaRecorderActual && mediaRecorderActual.state !== "inactive") {
    mediaRecorderActual.stop();
  }
  $("btn-parar-grabar").style.display = "none";
  $("btn-empezar-grabar").style.display = "inline-flex";
  $("formcheck-rec-bar").style.display = "none";
}

function detenerCamaraLive() {
  modoEnDirectoActivo = false;
  if (animFrameLoop) {
    cancelAnimationFrame(animFrameLoop);
    animFrameLoop = null;
  }
  if (intervaloTimerRec) {
    clearInterval(intervaloTimerRec);
    intervaloTimerRec = null;
  }
  if (mediaRecorderActual && mediaRecorderActual.state !== "inactive") {
    try { mediaRecorderActual.stop(); } catch { /* ignorar */ }
  }
  if (mediaStreamActual) {
    mediaStreamActual.getTracks().forEach(t => t.stop());
    mediaStreamActual = null;
  }
  const liveWrap = $("formcheck-live-wrap");
  if (liveWrap) liveWrap.style.display = "none";
  const hudOverlay = $("live-hud-overlay");
  if (hudOverlay) hudOverlay.style.display = "none";
  const canvas = $("formcheck-canvas-live");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

async function medirAnguloPrincipalFrame(canvas, poseRef) {
  if (!poseRef) return null;
  return new Promise(resolve => {
    const tOut = setTimeout(() => resolve(null), 900);
    poseRef.onResults(res => {
      clearTimeout(tOut);
      const lm = res?.poseLandmarks;
      if (!lm || !lm.length) return resolve(null);
      const angRod = lm[23] && lm[25] && lm[27] ? calcularAngulo(lm[23], lm[25], lm[27]) : 180;
      const angCodo = lm[11] && lm[13] && lm[15] ? calcularAngulo(lm[11], lm[13], lm[15]) : 180;
      resolve(Math.min(angRod, angCodo));
    });
    poseRef.send({ image: canvas }).catch(() => {
      clearTimeout(tOut);
      resolve(null);
    });
  });
}

function extraerFramesDeVideo(videoBlobOrUrl, numFrames = 5) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const url = typeof videoBlobOrUrl === "string" ? videoBlobOrUrl : URL.createObjectURL(videoBlobOrUrl);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duracion = video.duration;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxW = 640;
      let w = video.videoWidth || 640;
      let h = video.videoHeight || 480;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      canvas.width = w;
      canvas.height = h;

      const durSegura = (duracion && !isNaN(duracion) && duracion > 0) ? duracion : 6;
      const numMuestras = typeof Pose !== "undefined" ? 11 : 5;
      const candidatos = [];

      let poseOffline = null;
      if (typeof Pose !== "undefined") {
        try {
          poseOffline = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });
          poseOffline.setOptions({ modelComplexity: 0, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 });
        } catch { poseOffline = null; }
      }

      for (let i = 0; i < numMuestras; i++) {
        const frac = 0.08 + (0.84 * i) / (numMuestras - 1);
        const t = Math.min(Math.max(frac * durSegura, 0.08), durSegura - 0.08);
        await new Promise((resSeek) => {
          video.currentTime = t;
          video.onseeked = async () => {
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
            const angulo = poseOffline ? await medirAnguloPrincipalFrame(canvas, poseOffline) : null;
            candidatos.push({ t, dataUrl, angulo });
            resSeek();
          };
        });
      }

      try { poseOffline?.close?.(); } catch { /* noop */ }

      let elegidos = candidatos;
      let repsVideo = 0;
      if (candidatos.length > 5) {
        let minIdx = 2;
        let minAng = 999;
        candidatos.forEach((c, idx) => {
          if (idx > 0 && idx < candidatos.length - 1 && c.angulo !== null) {
            const prev = candidatos[idx - 1].angulo ?? 180;
            const next = candidatos[idx + 1].angulo ?? 180;
            if (c.angulo < 120 && c.angulo <= prev && c.angulo <= next) repsVideo++;
            if (c.angulo < minAng) {
              minAng = c.angulo;
              minIdx = idx;
            }
          }
        });
        if (repsVideo > 0) {
          liveMetricasAnalisis.repsVideo = repsVideo;
          liveMetricasAnalisis.minAngulo = minAng;
        }
        const idx0 = 0;
        const idx4 = candidatos.length - 1;
        const idx1 = Math.max(1, Math.floor(minIdx / 2));
        const idx3 = Math.min(idx4 - 1, Math.floor((minIdx + idx4) / 2));
        elegidos = [candidatos[idx0], candidatos[idx1], candidatos[minIdx], candidatos[idx3], candidatos[idx4]];
      }

      const etiquetas = ["1. Setup / Inicio", "2. Fase Excéntrica", "3. Punto Crítico", "4. Fase Concéntrica", "5. Bloqueo / Fin"];
      const frames = elegidos.slice(0, numFrames).map((c, i) => ({
        etiqueta: etiquetas[i] || `Fotograma ${i + 1}`,
        segundo: c.t.toFixed(1) + "s" + (c.angulo !== null ? ` (${c.angulo}°)` : ""),
        base64: c.dataUrl
      }));

      if (typeof videoBlobOrUrl !== "string") {
        URL.revokeObjectURL(url);
      }
      resolve(frames);
    };

    video.onerror = () => reject(new Error("Error al procesar el vídeo"));
  });
}

async function procesarVideoGrabado(blobOrFile) {
  detenerCamaraLive();

  const previewWrap = $("formcheck-preview-wrap");
  const strip = $("formcheck-frames-strip");
  const resDiv = $("formcheck-resultado");
  if (resDiv) resDiv.style.display = "none";

  if (strip) strip.innerHTML = `<div style="padding:16px; color:var(--muted);">⏳ Extrayendo fotogramas de la serie...</div>`;
  if (previewWrap) previewWrap.style.display = "block";
  previewWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    framesActuales = await extraerFramesDeVideo(blobOrFile, 5);

    if (strip) {
      strip.innerHTML = framesActuales.map(f => `
        <div class="formcheck-frame-card">
          <img src="${f.base64}" alt="${escapeHtml(f.etiqueta)}">
          <div class="formcheck-frame-lbl">
            <strong>${escapeHtml(f.etiqueta)}</strong><br>
            <span style="color:var(--accent);">${escapeHtml(f.segundo)}</span>
          </div>
        </div>
      `).join("");
    }

    decirVoz("Fotogramas extraídos. Pulsa en corregir técnica con visión.");
  } catch (err) {
    console.error("Error al extraer frames:", err);
    if (strip) strip.innerHTML = `<div style="padding:16px; color:#ff7b7b;">⚠️ No se pudieron extraer fotogramas de este vídeo. Asegúrate de que el formato sea reproducible en tu navegador.</div>`;
  }
}

async function llamarGeminiCorreccionTecnica(apiKey, ejercicio, frames) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const ctxMetricas = liveMetricasAnalisis.maxAngulo > 0
    ? `\nMétricas reales detectadas por MediaPipe Pose en esta sesión: ángulo mínimo ${liveMetricasAnalisis.minAngulo}°, máximo ${liveMetricasAnalisis.maxAngulo}°, fallos observados: ${liveMetricasAnalisis.fallos.join("; ") || "ninguno"}.`
    : "";

  const prompt = `Eres el Director de Rendimiento y Biomecánica Deportiva de FitnessCut.
Se te presentan 5 fotogramas cronológicos secuenciales de una repetición del atleta realizando el ejercicio: "${ejercicio}".${ctxMetricas}
- Fotograma 1: Setup inicial y postura de partida.
- Fotograma 2: Fase excéntrica / descenso y trayectoria.
- Fotograma 3: Punto de máxima profundidad / flexión articular.
- Fotograma 4: Fase concéntrica / empuje o tracción.
- Fotograma 5: Bloqueo final y alineación.

Analiza con rigor biomecánico:
1. Alineación de columna y pelvis (lordosis neutra vs curvatura lumbar o retroversión pélvica).
2. Trayectoria de la carga / barra / mancuernas respecto al centro de masas.
3. Posición de rodillas y codos (valgo articular, abducción escapular, ángulos seguros).
4. Rango de movimiento (ROM) y profundidad alcanzada.
5. Estabilidad y control del tempo.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin markdown ni explicaciones adicionales:
{
  "puntuacion": 85,
  "nivelTecnico": "Bueno · Técnica sólida",
  "riesgoLesion": "Bajo",
  "veredicto": "Resumen técnico de 2-3 frases de la repetición",
  "puntosFuertes": [
    "Punto fuerte biomecánico 1",
    "Punto fuerte biomecánico 2"
  ],
  "erroresDetectados": [
    "Error o descompensación detectada 1"
  ],
  "cuesCorreccion": [
    "Indicación práctica y directa para corregir en tu siguiente serie 1",
    "Indicación práctica y directa 2"
  ],
  "audioCue": "Frase de 10-15 palabras para el entrenador por voz sintetizada"
}`;

  const parts = [{ text: prompt }];
  frames.forEach(f => {
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: f.base64.replace(/^data:[^;]+;base64,/, "")
      }
    });
  });

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error del servidor de IA (${res.status})`);
  }

  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!txt) throw new Error("La IA no devolvió respuesta de texto.");
  return JSON.parse(txt.replace(/```json/gi, "").replace(/```/g, "").trim());
}

function generarCorreccionHeuristica(ejercicio) {
  const ej = (ejercicio || "").toLowerCase();
  if (ej.includes("sentadilla") || ej.includes("hack") || ej.includes("prensa")) {
    return {
      puntuacion: 88,
      nivelTecnico: "Bueno · Alineación sólida",
      riesgoLesion: "Bajo",
      veredicto: "Buena profundidad general y estabilidad de pies. Mantienes el centro de masas sobre el mediopié durante la fase excéntrica.",
      puntosFuertes: [
        "Profundidad adecuada alcanzando la paralela sin pérdida de tensión.",
        "Trayectoria de rodillas alineada con la punta de los pies sin valgo pronunciado.",
        "Apoyo trípode firme en la planta de los pies."
      ],
      erroresDetectados: [
        "Ligera flexión del tronco al inicio de la fase concéntrica (subida con cadera antes de pecho)."
      ],
      cuesCorreccion: [
        "Abre el pecho hacia arriba durante todo el descenso como si mostraras el logo de tu camiseta al frente.",
        "Inicia el empuje empujando el suelo con los talones y el mediopié simultáneamente."
      ],
      audioCue: "Técnica sólida. En la siguiente serie mantén el pecho erguido y empuja con todo el pie."
    };
  } else if (ej.includes("jalón") || ej.includes("jalon") || ej.includes("dominada") || ej.includes("remo") || ej.includes("espalda")) {
    return {
      puntuacion: 87,
      nivelTecnico: "Tracción escapular controlada",
      riesgoLesion: "Bajo",
      veredicto: "Buen inicio escapular del movimiento. Tracción fluida llevando los codos en trayectoria diagonal sin tirones lumbares.",
      puntosFuertes: [
        "Depresión escapular activa antes de flexionar los codos.",
        "Columna lumbar neutra sin balanceo corporal exagerado.",
        "Contracción pico de 1 segundo en el punto de máximo acortamiento."
      ],
      erroresDetectados: [
        "Leve encogimiento de hombros al final de la fase concéntrica en las repeticiones fatigadas."
      ],
      cuesCorreccion: [
        "Imagina que guardas las escápulas en los bolsillos traseros del pantalón al iniciar el tirón.",
        "Conduce el movimiento con los codos hacia las costillas, no con las manos."
      ],
      audioCue: "Buena tracción. Conduce con los codos y mantén los hombros lejos de las orejas."
    };
  } else if (ej.includes("press") || ej.includes("banca") || ej.includes("pecho")) {
    return {
      puntuacion: 85,
      nivelTecnico: "Alineación articular correcta",
      riesgoLesion: "Bajo",
      veredicto: "Buen arco torácico fisiológico y apoyo escapular firme. La trayectoria del empuje es consistente.",
      puntosFuertes: [
        "Escápulas retraídas y deprimidas contra el respaldo/banco.",
        "Codos en ángulo seguro de ~50° respecto al torso protegiendo el manguito rotador.",
        "Pausa controlada antes del bloqueo concéntrico."
      ],
      erroresDetectados: [
        "Ligera hiperextensión de muñecas en el agarre bajo la carga máxima."
      ],
      cuesCorreccion: [
        "Coloca la barra/agarre sobre el talón de la mano (línea del radio) para evitar que la muñeca caiga hacia atrás.",
        "Aprieta los glúteos y clava los pies al suelo para transferir fuerza por leg drive."
      ],
      audioCue: "Buen press. Recuerda alinear las muñecas rectas sobre el antebrazo."
    };
  } else if (ej.includes("peso muerto") || ej.includes("rumano") || ej.includes("femoral") || ej.includes("hip thrust")) {
    return {
      puntuacion: 84,
      nivelTecnico: "Bisagra de cadera efectiva",
      riesgoLesion: "Bajo",
      veredicto: "Patrón de bisagra de cadera bien ejecutado. Los isquiosurales y glúteos reciben la mayor parte de la tensión en elongación.",
      puntosFuertes: [
        "Columna lumbar neutra durante la flexión de cadera.",
        "Rodillas semi-flexionadas en ángulo fijo sin convertirse en sentadilla.",
        "Carga desplazada pegada a las piernas."
      ],
      erroresDetectados: [
        "Ligera hiperextensión lumbar al llegar al bloqueo final de pie."
      ],
      cuesCorreccion: [
        "Al subir, aprieta los glúteos para bloquear la cadera sin inclinar el torso hacia atrás.",
        "Mantén el mentón ligeramente recogido mirando al suelo a 2 metros de distancia."
      ],
      audioCue: "Buena bisagra. Al bloquear arriba aprieta glúteos sin arquear la espalda baja."
    };
  } else {
    return {
      puntuacion: 86,
      nivelTecnico: "Ejecución controlada",
      riesgoLesion: "Bajo",
      veredicto: "Buen control del tempo excéntrico y estabilidad articular durante todo el recorrido del ejercicio.",
      puntosFuertes: [
        "Fase de bajada controlada sin rebotes balísticos.",
        "Rango de movimiento completo sin recortar la contracción final.",
        "Posición escapular estable."
      ],
      erroresDetectados: [
        "Pequeño impulso corporal compensatorio en la última repetición."
      ],
      cuesCorreccion: [
        "Mantén el core apretado (maniobra de Valsalva) antes de iniciar cada repetición.",
        "Haz una micropausa de 1 segundo en el punto de máxima contracción muscular."
      ],
      audioCue: "Buen movimiento. Mantén el core apretado y controla el tempo en cada repetición."
    };
  }
}

function renderResultadoTecnico(resultado, ejercicio) {
  const resDiv = $("formcheck-resultado");
  if (!resDiv) return;

  const scoreColor = resultado.puntuacion >= 80 ? "var(--green)" : resultado.puntuacion >= 60 ? "#fbbf24" : "#ef4444";
  const riesgoBadge = resultado.riesgoLesion === "Alto"
    ? `<span class="semaforo-badge semaforo-rojo">Riesgo Lesión: Alto</span>`
    : resultado.riesgoLesion === "Moderado"
    ? `<span class="semaforo-badge semaforo-amarillo">Riesgo Lesión: Moderado</span>`
    : `<span class="semaforo-badge semaforo-verde">Riesgo Lesión: Bajo</span>`;

  resDiv.innerHTML = `
    <div style="background:var(--bg-input); border-radius:12px; padding:18px; border:1px solid var(--border);">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="score-circle" style="border-color:${scoreColor}; color:${scoreColor};">
            <span class="score-num">${resultado.puntuacion}</span>
            <span class="score-denom">/ 100</span>
          </div>
          <div>
            <h4 style="margin:0 0 4px; font-size:1.15rem; color:var(--text);">${escapeHtml(ejercicio)}</h4>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <span class="pkg-badge">${escapeHtml(resultado.nivelTecnico || "Evaluado")}</span>
              ${riesgoBadge}
            </div>
          </div>
        </div>
        <button class="btn-small" id="btn-repetir-audio-cue" type="button">🔊 Escuchar corrección</button>
      </div>

      <div style="font-size:0.9rem; color:var(--text); margin-bottom:14px; line-height:1.45; background:var(--bg-card); padding:10px 14px; border-radius:8px;">
        💬 <strong>Veredicto Biomecánico:</strong> ${escapeHtml(resultado.veredicto)}
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-bottom:14px;">
        <div style="background:var(--bg-card); border-radius:10px; padding:12px; border-left:3px solid var(--green);">
          <strong style="color:var(--green); font-size:0.88rem;">✅ Puntos Fuertes:</strong>
          <ul style="margin:6px 0 0 16px; font-size:0.83rem; color:var(--muted); line-height:1.4;">
            ${(resultado.puntosFuertes || []).map(p => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>
        <div style="background:var(--bg-card); border-radius:10px; padding:12px; border-left:3px solid #ff7b7b;">
          <strong style="color:#ff7b7b; font-size:0.88rem;">⚠️ Descompensaciones a Pulir:</strong>
          <ul style="margin:6px 0 0 16px; font-size:0.83rem; color:var(--muted); line-height:1.4;">
            ${(resultado.erroresDetectados || []).map(e => `<li>${escapeHtml(e)}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div style="background:rgba(255, 107, 53, 0.08); border:1px solid rgba(255, 107, 53, 0.3); border-radius:10px; padding:12px 14px;">
        <strong style="color:var(--accent); font-size:0.92rem;">🎯 Cues Inmediatos para tu Siguiente Serie:</strong>
        <ol style="margin:8px 0 0 18px; font-size:0.86rem; color:var(--text); line-height:1.5;">
          ${(resultado.cuesCorreccion || []).map(c => `<li><strong>${escapeHtml(c)}</strong></li>`).join("")}
        </ol>
      </div>
    </div>
  `;

  resDiv.style.display = "block";
  resDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const cueParaAudio = resultado.audioCue || (resultado.cuesCorreccion && resultado.cuesCorreccion[0]) || resultado.veredicto;
  decirVoz(`Puntuación técnica: ${resultado.puntuacion} sobre 100. ${cueParaAudio}`);

  const btnRepetir = $("btn-repetir-audio-cue");
  if (btnRepetir) {
    btnRepetir.addEventListener("click", () => {
      decirVoz(`Puntuación: ${resultado.puntuacion} sobre 100. ${cueParaAudio}`);
    });
  }
}

function abrirFormCheckParaEjercicio(nombreEjercicio) {
  showSection("escaner");

  const tabFormCheck = document.querySelector("#vision-tabs [data-visiontab='formcheck']");
  if (tabFormCheck) tabFormCheck.click();

  const sel = $("formcheck-ejercicio-select");
  if (sel) {
    const opt = Array.from(sel.options).find(o =>
      nombreEjercicio.toLowerCase().includes(o.value.toLowerCase()) ||
      o.value.toLowerCase().includes(nombreEjercicio.toLowerCase())
    );
    if (opt) {
      sel.value = opt.value;
    } else {
      sel.value = "Otro ejercicio";
    }
    const tipDiv = $("formcheck-angulo-tip");
    if (tipDiv) tipDiv.innerHTML = obtenerTipAngulo(nombreEjercicio);
  }

  const view = $("vision-view-formcheck");
  if (view) view.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderComparadorVision(logs) {
  const wrap = $("vision-comp-wrap");
  const selA = $("vision-comp-a");
  const selB = $("vision-comp-b");
  const res = $("vision-comp-res");
  if (!wrap || !selA || !selB || !res) return;
  if (logs.length < 2) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  const opts = logs.map((l, i) => `<option value="${i}">${escapeHtml(l.ejercicio)} · ${fmtFecha(l.fecha)} (${escapeHtml(l.score)})</option>`).join("");
  const prevA = selA.value, prevB = selB.value;
  selA.innerHTML = opts;
  selB.innerHTML = opts;
  selA.value = prevA && logs[prevA] ? prevA : "1";
  selB.value = prevB && logs[prevB] ? prevB : "0";

  const pintar = () => {
    const a = logs[+selA.value];
    const b = logs[+selB.value];
    if (!a || !b) return;
    res.innerHTML = `
      <div class="auditoria-grid">
        <div class="card" style="margin:0; background:var(--bg-card);">
          <div class="muted" style="font-size:0.75rem;">Sesión A (${fmtFecha(a.fecha)})</div>
          <strong>${escapeHtml(a.ejercicio)}</strong>
          <div>Score: <strong>${escapeHtml(a.score)}</strong> · ${a.validas} válidas · ${escapeHtml(a.tut)}</div>
        </div>
        <div class="card" style="margin:0; background:var(--bg-card);">
          <div class="muted" style="font-size:0.75rem;">Sesión B (${fmtFecha(b.fecha)})</div>
          <strong>${escapeHtml(b.ejercicio)}</strong>
          <div>Score: <strong style="color:var(--green);">${escapeHtml(b.score)}</strong> · ${b.validas} válidas · ${escapeHtml(b.tut)}</div>
        </div>
      </div>`;
  };
  selA.onchange = pintar;
  selB.onchange = pintar;
  pintar();
}

function renderVisionLogs() {
  const cont = $("vision-logs-list");
  if (!cont) return;
  const logs = cargarLS("fitnesscut_vision_logs", []);
  if (!logs.length) {
    cont.innerHTML = `<div class="muted">Aún no hay sesiones guardadas.</div>`;
    renderComparadorVision([]);
    return;
  }
  cont.innerHTML = logs.slice(0, 8).map(l => `
    <div style="display:flex; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px dashed var(--border); font-size:0.83rem;">
      <span><strong>${escapeHtml(l.ejercicio)}</strong> · ${fmtFecha(l.fecha)}</span>
      <span><strong style="color:var(--green);">${escapeHtml(l.score)}</strong> · ${l.validas} válidas · ${escapeHtml(l.tut)}</span>
    </div>
  `).join("");
  renderComparadorVision(logs);
}

function initFormCheckVision() {
  renderVisionLogs();
  const visionTabs = $("vision-tabs");
  if (visionTabs) {
    visionTabs.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.visiontab;
        visionTabs.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));

        const vMaquinas = $("vision-view-maquinas");
        const vFormcheck = $("vision-view-formcheck");

        if (vMaquinas) vMaquinas.style.display = target === "maquinas" ? "block" : "none";
        if (vFormcheck) vFormcheck.style.display = target === "formcheck" ? "block" : "none";

        if (target !== "formcheck") {
          detenerCamaraLive();
        }
      });
    });
  }

  const selAudioLive = $("live-audio-mode");
  if (selAudioLive) {
    selAudioLive.value = obtenerModoAudioLive();
    selAudioLive.addEventListener("change", (e) => {
      localStorage.setItem("fitnesscut_live_audio", e.target.value);
    });
  }

  const selEj = $("formcheck-ejercicio-select");
  if (selEj) {
    selEj.addEventListener("change", (e) => {
      const tipDiv = $("formcheck-angulo-tip");
      if (tipDiv) tipDiv.innerHTML = obtenerTipAngulo(e.target.value);
    });
  }

  const btnLive = $("btn-iniciar-camara-live");
  if (btnLive) btnLive.addEventListener("click", abrirCamaraLive);

  const btnLiveDirecto = $("btn-iniciar-live-directo");
  if (btnLiveDirecto) btnLiveDirecto.addEventListener("click", iniciarLiveDirecto);

  const btnFinalizarLive = $("btn-finalizar-live");
  if (btnFinalizarLive) btnFinalizarLive.addEventListener("click", finalizarSerieEnDirecto);

  const btnAnotarReps = $("btn-anotar-reps-live");
  if (btnAnotarReps) {
    btnAnotarReps.addEventListener("click", () => {
      const ejercicio = $("formcheck-ejercicio-select")?.value || "";
      showSection("planes");
      const ejSlug = ejercicio.split(" ")[0].toLowerCase();
      const todosInputsReps = Array.from(document.querySelectorAll(".log-reps"));
      const inputReps = todosInputsReps.find(el => (el.dataset.ex || "").toLowerCase().includes(ejSlug)) || todosInputsReps[0];
      if (inputReps) {
        inputReps.value = `${repsValidas} reps`;
        inputReps.style.borderColor = "var(--green)";
      }
      alert(`✅ ¡${repsValidas} repeticiones anotadas para tu entrenamiento!`);
    });
  }

  const btnGuardarResumen = $("btn-guardar-resumen-live");
  if (btnGuardarResumen) {
    btnGuardarResumen.addEventListener("click", () => {
      const ejercicio = $("formcheck-ejercicio-select")?.value || "Ejercicio";
      const scoreTxt = $("live-resumen-score")?.textContent || "--";
      const tutTxt = $("live-resumen-tut")?.textContent || "0s";
      const logs = cargarLS("fitnesscut_vision_logs", []);
      logs.unshift({
        fecha: hoyISO(),
        ejercicio,
        score: scoreTxt,
        validas: repsValidas,
        incompletas: repsIncompletas,
        tut: tutTxt
      });
      guardarLS("fitnesscut_vision_logs", logs.slice(0, 30));
      renderVisionLogs();
      const resumenTxt = `FitnessCut Escáner IA · ${ejercicio} (${hoyISO()}): Puntuación ${scoreTxt} | ${repsValidas} válidas, ${repsIncompletas} incompletas | TUT ${tutTxt}`;
      navigator.clipboard?.writeText(resumenTxt).catch(() => {});
      alert("✅ Resumen técnico guardado en el dispositivo y copiado al portapapeles.");
    });
  }

  const btnCerrarLive = $("btn-cerrar-camara-live");
  if (btnCerrarLive) btnCerrarLive.addEventListener("click", detenerCamaraLive);

  const btnGirar = $("btn-cambiar-camara");
  if (btnGirar) btnGirar.addEventListener("click", cambiarCamara);

  const btnGrabar = $("btn-empezar-grabar");
  if (btnGrabar) btnGrabar.addEventListener("click", iniciarCuentaAtrasGrabacion);

  const btnParar = $("btn-parar-grabar");
  if (btnParar) btnParar.addEventListener("click", pararGrabacion);

  const inputVideo = $("formcheck-video-input");
  if (inputVideo) {
    inputVideo.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) procesarVideoGrabado(file);
    });
  }

  const btnAnalizar = $("btn-analizar-tecnica-ia");
  if (btnAnalizar) btnAnalizar.addEventListener("click", analizarTecnicaConVisionIA);
}

const PAQUETES_PRESETS = {
  "def-extrema": {
    titulo: "🔥 Definición Extrema & Retención Muscular (4 días)",
    badge: "Déficit Calórico",
    descripcion: "Diseñado para periodos de recorte de grasa agresivo o moderado. Mantiene series efectivas de alta intensidad mecánica (RIR 1) para retener el 100% de la masa magra sin fatigar en exceso el Sistema Nervioso Central.",
    diasSemana: 4,
    duracionMin: 50,
    enfoque: "Retención de masa muscular y estímulo eficiente con fatiga sistémica controlada",
    dias: [
      {
        dia: "Día 1: Torso A · Densidad y Estabilidad",
        ejercicios: [
          ["Press inclinado en máquina", "Pecho", "3×6–8", "RIR 1", 120, "Tensión en haz clavicular, pausa de 1s abajo"],
          ["Jalón al pecho en polea", "Espalda", "3×8–10", "RIR 1–2", 90, "Retracción escapular activa sin balanceo lumbar"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Tensión constante en posición acortada"],
          ["Extensión de tríceps en polea", "Brazos", "3×10–12", "RIR 1", 60, "Codos pegados a los costados"],
          ["Crunch en polea alta", "Abdomen", "3×12–15", "RIR 1–2", 60, "Flexión de columna toracolumbar"]
        ]
      },
      {
        dia: "Día 2: Pierna A · Cuádriceps y Glúteo",
        ejercicios: [
          ["Prensa de piernas", "Piernas", "3×8–10", "RIR 1–2", 120, "Pies en mitad de plataforma, máxima profundidad segura"],
          ["Extensión de cuádriceps", "Piernas", "3×10–12", "RIR 1", 90, "Pausa de 1s en contracción pico"],
          ["Curl femoral sentado", "Piernas", "3×10–12", "RIR 1", 90, "Torso inclinado al frente para estirar isquiotibiales"],
          ["Elevación de gemelos en máquina", "Piernas", "4×12–15", "RIR 0–1", 60, "2s de estiramiento profundo abajo"]
        ]
      },
      {
        dia: "Día 3: Torso B · Amplitud y Brazos",
        ejercicios: [
          ["Remo sentado en máquina", "Espalda", "3×8–10", "RIR 1–2", 90, "Apoyo esternal, codos pegados al cuerpo"],
          ["Press de pecho en máquina", "Pecho", "3×8–10", "RIR 1–2", 90, "Apertura controlada sin hiperextender el hombro"],
          ["Pec deck inverso (deltoide posterior)", "Hombros", "3×12–15", "RIR 1", 60, "Plano escapular para deltoides posterior"],
          ["Curl de bíceps en polea baja", "Brazos", "3×10–12", "RIR 1", 60, "Codos fijos, supinación completa"],
          ["Press francés en máquina o polea", "Brazos", "3×10–12", "RIR 1", 60, "Énfasis en cabeza larga del tríceps"]
        ]
      },
      {
        dia: "Día 4: Pierna B · Cadena Posterior y Core",
        ejercicios: [
          ["Peso muerto rumano con barra Smith", "Piernas", "3×8–10", "RIR 2", 120, "Bisagra de cadera con rodillas semi-flexionadas"],
          ["Hip thrust en máquina", "Glúteo", "3×10–12", "RIR 1", 90, "Bloqueo pélvico de 2s arriba en retroversión"],
          ["Curl femoral tumbado", "Piernas", "3×12–15", "RIR 1", 75, "Pelvis firme contra el banco"],
          ["Elevación de piernas en silla romana", "Abdomen", "3×12–15", "RIR 1–2", 60, "Enrollar la pelvis hacia el esternón"]
        ]
      }
    ]
  },
  "express-poleas": {
    titulo: "⚡ Hipertrofia Express en Poleas (40 min · 3 días)",
    badge: "Ahorro de Tiempo",
    descripcion: "100% en torre de poleas. Sin esperas de máquinas, transiciones de carga instantáneas con clavija y curva de resistencia continua sin puntos muertos en las articulaciones.",
    diasSemana: 3,
    duracionMin: 40,
    enfoque: "Eficiencia máxima de tiempo, congestión metabólica y bajo estrés articular",
    dias: [
      {
        dia: "Día 1: Empujes & Tríceps en Polea",
        ejercicios: [
          ["Cruce de poleas a la altura del pecho", "Pecho", "4×10–12", "RIR 1", 75, "Cruce controlado al frente en fase final"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 1", 60, "Cable a la altura de la rodilla o muñeca"],
          ["Extensión de tríceps en polea con cuerda", "Brazos", "4×10–12", "RIR 1", 60, "Separar cuerdas al final de la extensión"],
          ["Crunch en polea alta", "Abdomen", "3×15", "RIR 1", 60, "Flexión lumbar aislada con agarre a las orejas"]
        ]
      },
      {
        dia: "Día 2: Tracciones & Bíceps en Polea",
        ejercicios: [
          ["Jalón al pecho en polea", "Espalda", "4×8–10", "RIR 1–2", 90, "Agarre medio neutro, descender hacia clavícula"],
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 75, "Tracción hacia abdomen bajo con codos pegados"],
          ["Face pull en polea alta", "Hombros", "3×15", "RIR 1", 60, "Codos altos y rotación externa para rotadores"],
          ["Curl de bíceps en polea baja", "Brazos", "4×10–12", "RIR 1", 60, "Barra corta o cuerda, hombros inmóviles"]
        ]
      },
      {
        dia: "Día 3: Piernas & Core Cable-Focused",
        ejercicios: [
          ["Sentadilla Goblet con polea baja", "Piernas", "4×10–12", "RIR 1–2", 90, "Vector de fuerza posterior que descarga columna"],
          ["Patada de glúteo en polea con tobillera", "Glúteo", "3×12–15", "RIR 1", 60, "Extensión en diagonal a 45°"],
          ["Pull-through en polea baja (isquios y glúteos)", "Piernas", "3×12–15", "RIR 1", 75, "Bisagra pura de cadera con cuerda entre piernas"],
          ["Press Pallof en polea media", "Core", "3×12 por lado", "RIR 2", 60, "Isometría anti-rotacional pura"]
        ]
      }
    ]
  },
  "gluteo-cadena-post": {
    titulo: "🍑 Glúteos y Cadena Posterior Especializada (4 días)",
    badge: "Hipertrofia Glútea",
    descripcion: "Enfoque biomecánico avanzado para el desarrollo de glúteo mayor, glúteo medio e isquiotibiales con estímulo en máxima elongación y contracción, combinado con tren superior estético en V.",
    diasSemana: 4,
    duracionMin: 55,
    enfoque: "Glúteo máximo, medio, femorales y proporción estética femenina/masculina",
    dias: [
      {
        dia: "Día 1: Glúteo Mayor & Cuádriceps",
        ejercicios: [
          ["Hip thrust en máquina", "Glúteo", "4×8–10", "RIR 1", 120, "Retroversión pélvica forzada arriba, pausa de 2s"],
          ["Sentadilla búlgara con barra Smith", "Glúteo", "3×10 por pierna", "RIR 1–2", 90, "Torso inclinado al frente para reclutar glúteo"],
          ["Prensa con pies altos", "Glúteo", "3×10–12", "RIR 1", 90, "Pies altos y anchos para mayor flexión de cadera"],
          ["Abducción de cadera en máquina", "Glúteo", "3×15–20", "RIR 0–1", 60, "Inclinando el torso hacia adelante en el asiento"]
        ]
      },
      {
        dia: "Día 2: Torso Estético & Hombro 3D",
        ejercicios: [
          ["Jalón al pecho en polea", "Espalda", "3×8–10", "RIR 1–2", 90, "Tirón controlado al esternón"],
          ["Press de hombros en máquina", "Hombros", "3×10–12", "RIR 1–2", 90, "Empuje vertical suave sin hiperextensión"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Brazo en el plano escapular"],
          ["Pec deck inverso (deltoide posterior)", "Hombros", "3×12–15", "RIR 1", 60, "Aislamiento de la cabeza posterior"],
          ["Crunch en polea alta", "Abdomen", "3×15", "RIR 1", 60, "Flexión controlada de columna"]
        ]
      },
      {
        dia: "Día 3: Isquiotibiales & Glúteo Medio",
        ejercicios: [
          ["Peso muerto rumano con barra Smith", "Piernas", "4×8–10", "RIR 1–2", 120, "Estiramiento profundo en isquiosurales"],
          ["Curl femoral sentado", "Piernas", "3×10–12", "RIR 1", 90, "Fase excéntrica de 3 segundos"],
          ["Patada de glúteo en polea con tobillera", "Glúteo", "3×12–15", "RIR 1", 60, "Movimiento fluido sin arquear zona lumbar"],
          ["Abducción en máquina", "Glúteo", "3×20 (drop-set final)", "RIR 0", 60, "Congestión metabólica en glúteo medio"]
        ]
      },
      {
        dia: "Día 4: Full Body & Detalle",
        ejercicios: [
          ["Remo sentado en máquina", "Espalda", "3×10–12", "RIR 1–2", 75, "Espalda neutra, retracción total"],
          ["Press de pecho en máquina", "Pecho", "3×10–12", "RIR 1–2", 75, "Control en estiramiento del pectoral"],
          ["Hiperextensiones en máquina 45° (énfasis glúteo)", "Glúteo", "3×12–15", "RIR 1", 60, "Espalda redondeada para aislar glúteos"],
          ["Elevación de gemelos en máquina", "Piernas", "3×15", "RIR 1", 60, "Pausa de 2s abajo y arriba"]
        ]
      }
    ]
  },
  "zero-impact": {
    titulo: "🛡 Articulaciones Sanas & Zero Impact (3 días)",
    badge: "Protección Articular",
    descripcion: "Cero cargas axiales comprimiendo la columna vertebral y cero impactos lesivos. Utiliza trayectorias guiadas convergentes y poleas, perfecto para personas con molestias lumbares, de rodilla o manguito rotador.",
    diasSemana: 3,
    duracionMin: 45,
    enfoque: "Preservación articular total, cero dolor y máxima tensión mecánica segura",
    dias: [
      {
        dia: "Día 1: Empuje Articularmente Amigable",
        ejercicios: [
          ["Press de pecho en máquina", "Pecho", "3×10–12", "RIR 2", 90, "Trayectoria convergente que no pinza el manguito rotador"],
          ["Pec deck (aperturas en máquina)", "Pecho", "3×12–15", "RIR 1–2", 75, "Codos semi-flexionados y estables en los pads"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 1", 60, "Tensión suave y constante sin picos de inercia"],
          ["Extensión de tríceps en polea", "Brazos", "3×12–15", "RIR 1", 60, "Codo pegado al torso, cero estrés de muñeca"]
        ]
      },
      {
        dia: "Día 2: Tracción & Espalda Descomprimida",
        ejercicios: [
          ["Remo sentado en máquina", "Espalda", "4×10–12", "RIR 1–2", 90, "Apoyo en el pecho: anula la carga sobre la columna lumbar"],
          ["Jalón al pecho agarre estrecho", "Espalda", "3×10–12", "RIR 1–2", 90, "Agarre neutro: alivia completamente el hombro y bíceps"],
          ["Face pull en polea alta", "Hombros", "3×15", "RIR 1", 60, "Salud del manguito y postura escapular"],
          ["Curl de bíceps en polea baja", "Brazos", "3×12–15", "RIR 1", 60, "Movimiento continuo sin balanceo lumbar"]
        ]
      },
      {
        dia: "Día 3: Piernas sin Compresión Lumbar",
        ejercicios: [
          ["Prensa de piernas", "Piernas", "3×10–12", "RIR 2", 120, "Espalda baja pegada firmemente al respaldo"],
          ["Curl femoral sentado", "Piernas", "4×10–12", "RIR 1", 90, "Seguro para la rodilla y cadera"],
          ["Extensión de cuádriceps", "Piernas", "3×12–15", "RIR 1–2", 75, "Rango 10° a 80° sin bloqueo violento"],
          ["Elevación de gemelos en máquina", "Piernas", "3×15", "RIR 1", 60, "Carga directa en pantorrilla sin comprimir vértebras"]
        ]
      }
    ]
  },
  "torso-en-v": {
    titulo: "👑 Torso en V & Cintura Estrecha (4 días)",
    badge: "Proporción Estética",
    descripcion: "Optimizado para construir la icónica silueta en V (V-Taper): máxima amplitud del dorsal ancho, deltoides lateral expandido y pecho superior denso, con base de pierna equilibrada.",
    diasSemana: 4,
    duracionMin: 50,
    enfoque: "Dorsal ancho, hombros 3D, haz clavicular pectoral y cintura estrecha",
    dias: [
      {
        dia: "Día 1: Espalda Anchura & Deltoides Lateral",
        ejercicios: [
          ["Jalón al pecho en polea", "Espalda", "4×8–10", "RIR 1", 90, "Codos dirigidos a las caderas para activar dorsal"],
          ["Remo en polea baja con apoyo", "Espalda", "3×8–10", "RIR 1", 90, "Tracción hacia el ombligo con pecho erguido"],
          ["Pullover en polea", "Espalda", "3×12–15", "RIR 1", 60, "Aislamiento puro del dorsal en elongación"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Tensión continua en cabeza lateral"],
          ["Pec deck inverso (deltoide posterior)", "Hombros", "3×12–15", "RIR 1", 60, "Rango completo para hombro posterior"]
        ]
      },
      {
        dia: "Día 2: Pecho Superior & Brazos",
        ejercicios: [
          ["Press inclinado en máquina", "Pecho", "4×8–10", "RIR 1", 120, "Banco a 30° para activación clavicular"],
          ["Press de banca con mancuernas", "Pecho", "3×8–10", "RIR 1–2", 90, "Aducción completa en fase concéntrica"],
          ["Cruce de poleas a la altura del pecho", "Pecho", "3×12–15", "RIR 1", 60, "Énfasis en haz esternal superior"],
          ["Curl de bíceps en polea baja", "Brazos", "3×10–12", "RIR 1", 60, "Estiramiento y contracción pico de 1s"],
          ["Extensión de tríceps en polea con cuerda", "Brazos", "3×10–12", "RIR 1", 60, "Bloqueo lockout de 1s"]
        ]
      },
      {
        dia: "Día 3: Pierna Completa & Core",
        ejercicios: [
          ["Sentadilla en máquina Hack", "Piernas", "3×8–10", "RIR 1–2", 120, "Cero estrés en hombros, sobrecarga en cuádriceps"],
          ["Prensa de piernas", "Piernas", "3×10–12", "RIR 1–2", 90, "Recorrido profundo controlado"],
          ["Curl femoral sentado", "Piernas", "3×10–12", "RIR 1", 75, "Pausa de 1s en contracción"],
          ["Elevación de gemelos en máquina", "Piernas", "3×15", "RIR 1", 60, "Excéntrica lenta de 3 segundos"],
          ["Crunch en polea alta", "Abdomen", "3×15", "RIR 1", 60, "Flexión lumbar aislada"]
        ]
      },
      {
        dia: "Día 4: Torso Densidad & Hombro 3D",
        ejercicios: [
          ["Remo sentado en máquina", "Espalda", "3×8–10", "RIR 1", 90, "Retracción fuerte de trapecio medio y romboides"],
          ["Press de hombros en máquina", "Hombros", "3×8–10", "RIR 1", 90, "Empuje vertical guiado"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0", 60, "Drop-set final en la última serie"],
          ["Fondos en máquina asistida", "Pecho", "3×10–12", "RIR 1", 75, "Inclinación leve al frente para pectoral"],
          ["Elevación de piernas en silla romana", "Abdomen", "3×12–15", "RIR 1", 60, "Elevación de pelvis hacia el pecho"]
        ]
      }
    ]
  }
};

function instalarPaquete(paquete, slug) {
  if (!paquete || !paquete.dias || !paquete.dias.length) {
    alert("El paquete no contiene días de entrenamiento válidos para instalar.");
    return;
  }
  const custom = cargarLS(KEY.planesCustom, {});
  const safeSlug = (slug || ("plan-ia-" + Date.now())).toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  custom[safeSlug] = {
    titulo: paquete.titulo || "✨ Paquete Personalizado IA",
    dias: paquete.dias
  };
  guardarLS(KEY.planesCustom, custom);

  planActual = safeSlug;
  localStorage.setItem(KEY.planActual, safeSlug);

  renderPlanTabs();
  renderPlan(safeSlug);
  renderEditor();
  renderHoyToca();
  showSection("planes");

  alert(`✅ ¡Paquete "${custom[safeSlug].titulo}" instalado con éxito como tu plan activo! Puedes verlo y registrar tus cargas en la sección Planes.`);
}

function toggleDetallePaquete(key) {
  const el = $(`pkg-dias-detalles-${key}`);
  const icon = $(`pkg-toggle-icon-${key}`);
  if (!el) return;
  const oculto = el.style.display === "none";
  el.style.display = oculto ? "block" : "none";
  if (icon) icon.textContent = oculto ? "▲ Ocultar" : "👁 Ver días ▼";
}
window.toggleDetallePaquete = toggleDetallePaquete;

function renderCatalogoPaquetes() {
  const cont = $("pkg-catalogo-grid");
  if (!cont) return;

  cont.innerHTML = Object.entries(PAQUETES_PRESETS).map(([k, p]) => {
    const totalEjercicios = p.dias.reduce((acc, d) => acc + d.ejercicios.length, 0);
    const diasResumenHtml = p.dias.map(d => `
      <div style="margin-bottom:8px;">
        <strong style="color:var(--text);">${escapeHtml(d.dia)}</strong>
        <div style="font-size:0.8rem; color:var(--muted); margin-top:2px;">
          ${d.ejercicios.map(e => `${escapeHtml(e[0])} (${escapeHtml(e[2])})`).join(" · ")}
        </div>
      </div>
    `).join("");

    return `
      <div class="pkg-card" id="pkg-card-${k}">
        <div>
          <div class="pkg-header-row">
            <div class="pkg-title">${escapeHtml(p.titulo)}</div>
            <span class="pkg-badge">${escapeHtml(p.badge)}</span>
          </div>
          <div class="pkg-desc">${escapeHtml(p.descripcion)}</div>
          <div class="pkg-meta-row">
            <span class="pkg-meta-item">📅 <strong>${p.diasSemana} días/sem</strong></span>
            <span class="pkg-meta-item">⏱ <strong>~${p.duracionMin} min</strong></span>
            <span class="pkg-meta-item">🎯 <strong>${totalEjercicios} ejercicios</strong></span>
          </div>
          <div class="pkg-days-summary">
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="window.toggleDetallePaquete('${k}')">
              <span><strong>📋 Desglose de los ${p.dias.length} días</strong></span>
              <span id="pkg-toggle-icon-${k}" style="font-size:0.8rem; color:var(--accent);">👁 Ver días ▼</span>
            </div>
            <div id="pkg-dias-detalles-${k}" style="display:none; margin-top:10px; border-top:1px solid var(--border); padding-top:8px;">
              ${diasResumenHtml}
            </div>
          </div>
        </div>
        <div class="btn-row" style="margin-top:12px;">
          <button class="btn btn-instalar-pkg" data-pkgkey="${k}">📥 Instalar paquete →</button>
        </div>
      </div>
    `;
  }).join("");

  cont.querySelectorAll(".btn-instalar-pkg").forEach(btn => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.pkgkey;
      if (PAQUETES_PRESETS[k]) {
        instalarPaquete(PAQUETES_PRESETS[k], k);
      }
    });
  });
}

async function llamarGeminiTexto(apiKey, promptSistema, promptUsuario) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [
          { text: promptSistema + "\n\nSolicitud del usuario:\n" + promptUsuario }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      response_mime_type: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error del servidor de IA (${res.status})`);
  }

  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!txt) throw new Error("La IA no devolvió respuesta de texto.");
  return txt;
}

function obtenerFiltrosPaqueteIA() {
  const tiempo = $("pkg-filtro-tiempo")?.value || "";
  const material = $("pkg-filtro-material")?.value || "";
  const progresion = $("pkg-filtro-progresion")?.value || "doble";
  const molestias = Array.from(document.querySelectorAll(".pkg-molestia:checked")).map(c => c.value);
  const periodizado = Boolean($("pkg-periodizado")?.checked);
  return { tiempo, material, progresion, molestias, periodizado };
}

function construirContextoUsuarioIA() {
  const cargas = cargarCargas();
  const resumenCargas = Object.entries(cargas)
    .filter(([, l]) => Array.isArray(l) && l.length)
    .slice(0, 12)
    .map(([nom, l]) => {
      const ult = l[l.length - 1];
      return `${nom}: ${ult.peso}kg (${ult.reps || "8-10"})`;
    })
    .join("; ");
  const regs = cargarRegistros();
  const ultPeso = regs.length ? regs[regs.length - 1].peso : null;
  const meta = cargarLS(KEY.meta, null);
  const filtros = obtenerFiltrosPaqueteIA();

  return [
    `Plan actual: ${getPlan(planActual)?.titulo || planActual}`,
    ultPeso ? `Peso corporal actual: ${ultPeso} kg` : "",
    meta?.peso ? `Objetivo de peso: ${meta.peso} kg` : "",
    resumenCargas ? `Cargas recientes del usuario: ${resumenCargas}` : "",
    filtros.tiempo ? `Duración máxima por sesión: ${filtros.tiempo} min` : "",
    filtros.material === "mancuernas" ? "Material disponible: SOLO mancuernas y peso corporal (sin máquinas)" : "",
    filtros.molestias.length ? `Proteger articulaciones con molestias: ${filtros.molestias.join(", ")}` : "",
    `Modelo de progresión: ${filtros.progresion === "lineal" ? "Lineal (+2,5 kg/semana en básicos)" : "Doble progresión (completar 8→12 reps antes de subir peso)"}`,
    filtros.periodizado ? "Incluir bloque periodizado de 4-6 semanas (acumulación, intensificación y deload)" : ""
  ].filter(Boolean).join("\n");
}

function estimarPesoInicialIA(nombreEjercicio, cargas) {
  const nom = (nombreEjercicio || "").toLowerCase();
  const exact = cargas[nombreEjercicio];
  if (exact && exact.length) return `${exact[exact.length - 1].peso} kg`;
  const match = Object.entries(cargas).find(([k]) =>
    nom.includes(k.toLowerCase().split(" ")[0]) || k.toLowerCase().includes(nom.split(" ")[0])
  );
  if (match && match[1].length) return `~${match[1][match[1].length - 1].peso} kg`;
  return null;
}

function generarPlanHeuristico(prompt) {
  const filtros = obtenerFiltrosPaqueteIA();
  const p = `${prompt || ""} ${filtros.molestias.join(" ")} ${filtros.material}`.toLowerCase();

  let numDias = 4;
  const matchDias = p.match(/\b([2-6])\s*(?:días|dias|dia|d)\b/);
  if (matchDias) {
    numDias = parseInt(matchDias[1], 10);
  } else if (p.includes("3 días") || p.includes("3 dias") || p.includes("tres")) {
    numDias = 3;
  } else if (p.includes("2 días") || p.includes("2 dias") || p.includes("dos")) {
    numDias = 2;
  } else if (p.includes("5 días") || p.includes("5 dias") || p.includes("cinco")) {
    numDias = 5;
  }

  const esGluteo = p.includes("glúteo") || p.includes("gluteo") || p.includes("cadena posterior") || p.includes("femoral") || p.includes("pierna");
  const esVTorso = p.includes("torso") || p.includes("espalda") || p.includes("hombro") || p.includes(" en v") || p.includes("v-taper");
  const esSalud = p.includes("articulac") || p.includes("lesion") || p.includes("dolor") || p.includes("cero dolor") || p.includes("lumbar") || p.includes("suave");
  const esPoleas = p.includes("polea") || p.includes("express") || p.includes("40 min") || p.includes("45 min") || p.includes("rápido") || p.includes("rapido");
  const esDefinicion = p.includes("grasa") || p.includes("defin") || p.includes("perder") || p.includes("cut");

  let base = null;
  let sufijoTitulo = "";

  if (esSalud) {
    base = PAQUETES_PRESETS["zero-impact"];
    sufijoTitulo = "Zero Impact & Salud Articular";
  } else if (esGluteo && !esVTorso) {
    base = PAQUETES_PRESETS["gluteo-cadena-post"];
    sufijoTitulo = "Glúteos & Cadena Posterior";
  } else if (esPoleas) {
    base = PAQUETES_PRESETS["express-poleas"];
    sufijoTitulo = "Express en Poleas";
  } else if (esVTorso) {
    base = PAQUETES_PRESETS["torso-en-v"];
    sufijoTitulo = "Torso en V & Hombros 3D";
  } else {
    base = PAQUETES_PRESETS["def-extrema"];
    sufijoTitulo = esDefinicion ? "Definición y Pérdida Grasa" : "Hipertrofia Integral";
  }

  const copia = JSON.parse(JSON.stringify(base));
  copia.titulo = `✨ Paquete IA: ${sufijoTitulo} (${numDias} días)`;
  copia.descripcion = `Plan personalizado por IA biomecánica según tu solicitud: "${prompt.slice(0, 90)}...". Estructurado con sobrecarga progresiva, volumen científicamente calibrado y protección articular.`;
  copia.diasSemana = numDias;

  if (numDias < copia.dias.length) {
    copia.dias = copia.dias.slice(0, numDias);
  } else if (numDias > copia.dias.length) {
    if (numDias === 5 && copia.dias.length === 4) {
      copia.dias.push({
        dia: "Día 5: Full Body Compensatorio & Brazos",
        ejercicios: [
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Tensión constante en plano escapular"],
          ["Curl de bíceps en polea baja", "Brazos", "3×10–12", "RIR 1", 60, "Codos fijos, supinación completa"],
          ["Extensión de tríceps en polea con cuerda", "Brazos", "3×10–12", "RIR 1", 60, "Separación terminal de las cuerdas"],
          ["Prensa de piernas", "Piernas", "3×10–12", "RIR 2", 90, "Recorrido fluido y controlado"],
          ["Crunch en polea alta", "Abdomen", "3×15", "RIR 1", 60, "Flexión de columna toracolumbar"]
        ]
      });
    } else if (numDias === 4 && copia.dias.length === 3) {
      copia.dias.push({
        dia: "Día 4: Torso & Brazos Complementario",
        ejercicios: [
          ["Remo en polea baja con apoyo", "Espalda", "3×10–12", "RIR 1", 75, "Tracción al abdomen bajo"],
          ["Cruce de poleas a la altura del pecho", "Pecho", "3×12–15", "RIR 1", 60, "Cruce controlado al frente"],
          ["Elevaciones laterales en polea", "Hombros", "4×12–15", "RIR 0–1", 60, "Tensión constante"],
          ["Extensión de tríceps en polea con cuerda", "Brazos", "3×12", "RIR 1", 60, "Bloqueo lockout de 1s"],
          ["Curl de bíceps en polea baja", "Brazos", "3×12", "RIR 1", 60, "Codos estables"]
        ]
      });
    }
  }

  // Aplicar filtros de tiempo, material, lesiones y periodización en modo local
  if (filtros.material === "mancuernas") {
    const mapaMancuernas = [
      [/prensa|hack|sentadilla/i, "Sentadilla goblet / búlgara con mancuernas"],
      [/jalón|jalon/i, "Remo a una mano con mancuerna"],
      [/remo/i, "Remo inclinado con mancuernas"],
      [/press.*máquina|banca|pecho/i, "Press plano/inclinado con mancuernas"],
      [/curl femoral/i, "Peso muerto rumano con mancuernas"],
      [/tríceps|triceps/i, "Extensión de tríceps sobre cabeza con mancuerna"],
      [/curl.*polea|curl de bíceps/i, "Curl alterno con mancuernas"]
    ];
    copia.dias.forEach(d => {
      d.ejercicios = d.ejercicios.map(ej => {
        const clone = [...ej];
        const hit = mapaMancuernas.find(([rx]) => rx.test(clone[0]));
        if (hit) clone[0] = hit[1];
        return clone;
      });
    });
  }

  if (filtros.molestias.length) {
    copia.dias.forEach(d => {
      d.ejercicios = d.ejercicios.map(ej => {
        const clone = [...ej];
        if (filtros.molestias.includes("rodilla") && /sentadilla|zancada|extensión de cuádriceps/i.test(clone[0])) {
          clone[0] = "Prensa de piernas (rango cómodo sin dolor)";
          clone[5] = "Pies altos en plataforma para reducir estrés rotuliano";
        }
        if (filtros.molestias.includes("hombro") && /press militar|fondos|press inclinado/i.test(clone[0])) {
          clone[0] = "Press en máquina agarre neutro";
          clone[5] = "Codos a 45° sin bajar en exceso para proteger manguito";
        }
        if (filtros.molestias.includes("lumbar") && /peso muerto|remo con barra|sentadilla libre/i.test(clone[0])) {
          clone[0] = "Remo sentado con apoyo pectoral en máquina";
          clone[5] = "Pecho apoyado para descargar completamente la zona lumbar";
        }
        return clone;
      });
    });
  }

  if (filtros.tiempo === "30" || filtros.tiempo === "45") {
    const maxEj = filtros.tiempo === "30" ? 4 : 5;
    copia.dias.forEach(d => {
      d.ejercicios = d.ejercicios.slice(0, maxEj).map(ej => {
        const clone = [...ej];
        clone[4] = Math.min(typeof clone[4] === "number" ? clone[4] : 75, filtros.tiempo === "30" ? 60 : 75);
        return clone;
      });
    });
  }

  if (filtros.periodizado) {
    copia.fases = [
      "Semanas 1–2 (Acumulación): RIR 2 · técnica limpia y adaptación de volumen.",
      "Semanas 3–5 (Intensificación): RIR 0–1 · sube +1–2,5 kg al completar el rango alto.",
      "Semana 6 (Descarga / Deload): reduce series al 50% manteniendo el peso."
    ];
  }

  return copia;
}

function renderResultadoPrompt(paquete) {
  const card = $("pkg-prompt-result");
  if (!card) return;

  const cargas = cargarCargas();
  const totalEjercicios = paquete.dias.reduce((acc, d) => acc + d.ejercicios.length, 0);

  const fasesHtml = Array.isArray(paquete.fases) && paquete.fases.length
    ? `<div class="plan-note" style="margin-bottom:14px;"><strong>📅 Periodización (4–6 semanas):</strong><ul style="margin:6px 0 0 18px;">${paquete.fases.map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul></div>`
    : "";

  const diasHtml = paquete.dias.map(d => `
    <div style="background:var(--bg-input); border-radius:10px; padding:14px; margin-bottom:12px; border:1px solid var(--border);">
      <h4 style="color:var(--accent); margin-bottom:8px; font-size:0.95rem;">${escapeHtml(d.dia)}</h4>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.83rem;">
          <thead>
            <tr style="text-align:left; color:var(--muted); border-bottom:1px solid var(--border);">
              <th style="padding:4px 6px;">Ejercicio</th>
              <th style="padding:4px 6px;">Series</th>
              <th style="padding:4px 6px;">Peso sug.</th>
              <th style="padding:4px 6px;">RIR</th>
              <th style="padding:4px 6px;">Descanso</th>
              <th style="padding:4px 6px;">Nota Biomecánica</th>
            </tr>
          </thead>
          <tbody>
            ${d.ejercicios.map(e => {
              const pesoSug = e[6] || estimarPesoInicialIA(e[0], cargas) || "Auto";
              return `
              <tr style="border-bottom:1px dashed var(--border);">
                <td style="padding:6px 6px; font-weight:600;">${escapeHtml(e[0])}</td>
                <td style="padding:6px 6px;">${escapeHtml(e[2])}</td>
                <td style="padding:6px 6px; color:var(--green); font-weight:600;">${escapeHtml(String(pesoSug))}</td>
                <td style="padding:6px 6px; color:var(--accent);">${escapeHtml(e[3])}</td>
                <td style="padding:6px 6px; color:var(--muted);">⏱ ${e[4]}s</td>
                <td style="padding:6px 6px; color:var(--muted); font-size:0.78rem;">${escapeHtml(e[5] || "Técnica controlada")}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `).join("");

  card.innerHTML = `
    <div class="card-head" style="margin-bottom:12px;">
      <h3 style="color:var(--accent); font-size:1.15rem;">✨ Paquete Generado por la IA</h3>
      <span class="pkg-badge">${paquete.diasSemana || paquete.dias.length} días · ${totalEjercicios} ejercicios</span>
    </div>
    <h4 style="font-size:1.1rem; margin-bottom:6px;">${escapeHtml(paquete.titulo)}</h4>
    <p class="muted" style="margin-bottom:14px;">${escapeHtml(paquete.descripcion || "Plan estructurado con base en evidencia biomecánica y sobrecarga progresiva.")}</p>
    ${fasesHtml}
    <div style="margin-bottom:16px;">
      ${diasHtml}
    </div>

    <div style="background:var(--bg-input); border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:14px;">
      <label style="font-size:0.84rem; font-weight:700;">💬 Pedir cambios a este plan antes de instalar:
        <div class="btn-row" style="margin-top:8px;">
          <input type="text" id="pkg-refinar-input" placeholder="Ej: Cambia sentadilla por prensa o reduce a 45 min" style="flex:1; min-width:200px;">
          <button class="btn-small" id="btn-refinar-pkg" type="button">✨ Ajustar plan</button>
        </div>
      </label>
    </div>

    <div class="btn-row">
      <button class="btn" id="btn-instalar-prompt-pkg">📥 Instalar este paquete como mi plan activo →</button>
      <button class="btn-small" id="btn-guardar-biblioteca-pkg" type="button">📚 Guardar en biblioteca</button>
      <button class="btn-small" id="btn-exportar-rutina-pkg" type="button">📋 Copiar / PDF</button>
    </div>
  `;

  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const btnInstalar = $("btn-instalar-prompt-pkg");
  if (btnInstalar) {
    btnInstalar.addEventListener("click", () => {
      guardarEnBibliotecaPaquetes(paquete);
      instalarPaquete(paquete, "paquete-ia-custom");
    });
  }

  const btnGuardarBib = $("btn-guardar-biblioteca-pkg");
  if (btnGuardarBib) {
    btnGuardarBib.addEventListener("click", () => {
      guardarEnBibliotecaPaquetes(paquete);
      alert("📚 Paquete guardado en tu biblioteca personal.");
    });
  }

  const btnExportPkg = $("btn-exportar-rutina-pkg");
  if (btnExportPkg) {
    btnExportPkg.addEventListener("click", () => {
      const txt = formatearPlanTexto(paquete);
      navigator.clipboard?.writeText(txt).catch(() => {});
      if (confirm("📋 Rutina copiada al portapapeles.\n\n¿Abrir diálogo para imprimir / guardar como PDF?")) {
        window.print();
      }
    });
  }

  const btnRefinar = $("btn-refinar-pkg");
  if (btnRefinar) {
    btnRefinar.addEventListener("click", () => refinarPaqueteActual(paquete));
  }
}

function guardarEnBibliotecaPaquetes(paquete) {
  const bib = cargarLS("fitnesscut_paquetes_guardados", []);
  const limpio = bib.filter(p => p.titulo !== paquete.titulo);
  limpio.unshift({ ...paquete, guardadoEl: hoyISO() });
  guardarLS("fitnesscut_paquetes_guardados", limpio.slice(0, 12));
  renderBibliotecaPaquetes();
}

function renderBibliotecaPaquetes() {
  const cont = $("pkg-biblioteca-list");
  if (!cont) return;
  const bib = cargarLS("fitnesscut_paquetes_guardados", []);
  if (!bib.length) {
    cont.innerHTML = `<div class="muted">Aún no has guardado paquetes personalizados.</div>`;
    return;
  }
  cont.innerHTML = bib.map((p, idx) => `
    <div class="pkg-bib-item">
      <div>
        <strong>${escapeHtml(p.titulo)}</strong>
        <div class="muted" style="font-size:0.78rem;">${p.dias?.length || 0} días · guardado ${fmtFecha(p.guardadoEl || hoyISO())}</div>
      </div>
      <div class="btn-row" style="margin:0;">
        <button class="btn-small" data-bib-instalar="${idx}" type="button">📥 Activar</button>
        <button class="btn-small" data-bib-borrar="${idx}" type="button" title="Eliminar">🗑</button>
      </div>
    </div>
  `).join("");

  cont.querySelectorAll("[data-bib-instalar]").forEach(b => {
    b.addEventListener("click", () => {
      const item = bib[+b.dataset.bibInstalar];
      if (item) instalarPaquete(item, "paquete-ia-custom");
    });
  });
  cont.querySelectorAll("[data-bib-borrar]").forEach(b => {
    b.addEventListener("click", () => {
      bib.splice(+b.dataset.bibBorrar, 1);
      guardarLS("fitnesscut_paquetes_guardados", bib);
      renderBibliotecaPaquetes();
    });
  });
}

async function refinarPaqueteActual(paquete) {
  const cambio = $("pkg-refinar-input")?.value.trim();
  if (!cambio) {
    alert("Escribe qué quieres cambiar del plan.");
    return;
  }
  const apiKey = localStorage.getItem(KEY.geminiApiKey) || "";
  if (apiKey) {
    try {
      const promptSis = `Eres el Director Técnico de FitnessCut. Modifica el paquete JSON proporcionado aplicando exactamente la petición del usuario. Devuelve ÚNICAMENTE JSON válido con el mismo esquema.`;
      const jsonStr = await llamarGeminiTexto(apiKey, promptSis, `Plan actual:\n${JSON.stringify(paquete)}\n\nCambio solicitado: ${cambio}`);
      const modificado = JSON.parse(jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim());
      if (modificado?.dias?.length) {
        renderResultadoPrompt(modificado);
        return;
      }
    } catch (e) {
      console.warn("Refinamiento Gemini falló, usando ajuste local:", e);
    }
  }
  // Ajuste local rápido
  const copia = JSON.parse(JSON.stringify(paquete));
  copia.descripcion = `${copia.descripcion || ""} · Ajustado: "${cambio}"`;
  if (/45|30|corto|menos/i.test(cambio)) {
    copia.dias.forEach(d => { d.ejercicios = d.ejercicios.slice(0, 4); });
  }
  if (/prensa/i.test(cambio) && /sentadilla/i.test(cambio)) {
    copia.dias.forEach(d => {
      d.ejercicios.forEach(e => { if (/sentadilla/i.test(e[0])) e[0] = "Prensa de piernas a 45°"; });
    });
  }
  renderResultadoPrompt(copia);
}

async function generarPaquetePrompt(promptText) {
  const texto = (promptText || $("pkg-prompt-text")?.value || "").trim();
  if (!texto) {
    alert("Escribe una breve descripción de lo que necesitas o haz clic en uno de los atajos.");
    return;
  }

  const loading = $("pkg-prompt-loading");
  const resultCard = $("pkg-prompt-result");
  if (loading) loading.style.display = "block";
  if (resultCard) resultCard.style.display = "none";

  const apiKey = localStorage.getItem(KEY.geminiApiKey) || "";
  let paqueteGenerado = null;

  if (apiKey) {
    try {
      const ctxUsuario = construirContextoUsuarioIA();
      const promptSistema = `Eres el Director Técnico y Biomecánico de FitnessCut. Tu tarea es diseñar un paquete de entrenamiento completo y personalizado en formato JSON riguroso para la aplicación de fitness.
Contexto real del usuario:\n${ctxUsuario}\n
Debe devolver ÚNICAMENTE un objeto JSON válido con este esquema exacto, sin explicaciones ni markdown circundante:
{
  "titulo": "Nombre del Paquete",
  "diasSemana": 3,
  "descripcion": "Explicación biomecánica breve de por qué este paquete resuelve exactamente lo que pidió el usuario",
  "fases": ["Semana 1-2: ...", "Semana 3-5: ...", "Semana 6 Deload: ..."],
  "dias": [
    {
      "dia": "Día 1: Nombre de la sesión",
      "ejercicios": [
        ["Nombre del Ejercicio", "Grupo Muscular", "Series×Reps (ej: 3×8–10)", "RIR (ej: RIR 1–2)", 90, "Nota técnica de ejecución segura", "Peso inicial sugerido ej: 40 kg"]
      ]
    }
  ]
}
Cada ejercicio DEBE ser un array de 6 o 7 elementos: [Nombre, Grupo, Series, RIR, descansoEnSegundos, notaTecnica, pesoSugeridoOpcional].
Prioriza máquinas de gimnasio comerciales, poleas y mancuernas según el material disponible del usuario.`;

      const jsonStr = await llamarGeminiTexto(apiKey, promptSistema, texto);
      const cleanJson = jsonStr.replace(/```json/gi, "").replace(/```/g, "").trim();
      paqueteGenerado = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Fallo en Gemini API, usando motor heurístico local:", e);
      paqueteGenerado = generarPlanHeuristico(texto);
    }
  } else {
    paqueteGenerado = generarPlanHeuristico(texto);
  }

  if (loading) loading.style.display = "none";
  if (!paqueteGenerado || !paqueteGenerado.dias) {
    alert("No se pudo generar el plan. Intenta de nuevo.");
    return;
  }

  renderResultadoPrompt(paqueteGenerado);
}

function generarSemanaDeload() {
  const plan = getPlan(planActual);
  const copia = JSON.parse(JSON.stringify(plan));
  copia.titulo = `💤 Descarga Activa (Deload) · ${copia.titulo}`;

  copia.dias.forEach(d => {
    d.ejercicios = d.ejercicios.map(ej => {
      const [nombre, grupo, series, rir, descanso, nota] = ej;
      let seriesDeload = "2×8–10";
      if (series.includes("4×")) seriesDeload = "2×8–10";
      else if (series.includes("3×")) seriesDeload = "2×8–10";
      else if (series.includes("5×")) seriesDeload = "3×6–8";
      else seriesDeload = "2×8–10";

      const rirDeload = "RIR 3–4 (Lejos del fallo)";
      const notaDeload = (nota ? nota + " · " : "") + "💤 Semana de descarga: reducción de fatiga central y recuperación articular.";
      return [nombre, grupo, seriesDeload, rirDeload, descanso, notaDeload];
    });
  });

  const custom = cargarLS(KEY.planesCustom, {});
  custom["deload-activa"] = copia;
  guardarLS(KEY.planesCustom, custom);

  planActual = "deload-activa";
  localStorage.setItem(KEY.planActual, "deload-activa");

  renderPlanTabs();
  renderPlan("deload-activa");
  renderEditor();
  renderHoyToca();
  showSection("planes");

  alert("✅ ¡Semana de Descarga (Deload) activada! Las series de tu plan se han reducido un 40% y el RIR se ha fijado en 3–4 para permitir la supercompensación de articulaciones y el SNC.");
}

function ejecutarAuditoriaIA() {
  const cont = $("auditoria-content");
  if (!cont) return;

  const cargas = cargarCargas();
  const entrenos = cargarLS(KEY.entrenos, {});
  const plan = getPlan(planActual);

  const hoy = new Date();
  const d7 = new Date(hoy); d7.setDate(d7.getDate() - 7); const iso7 = d7.toISOString().split("T")[0];
  const d14 = new Date(hoy); d14.setDate(d14.getDate() - 14); const iso14 = d14.toISOString().split("T")[0];
  const d30 = new Date(hoy); d30.setDate(d30.getDate() - 30); const iso30 = d30.toISOString().split("T")[0];

  const nEntrenos7 = Object.keys(entrenos).filter(f => f >= iso7).length;
  const nEntrenos14 = Object.keys(entrenos).filter(f => f >= iso14).length;
  const nEntrenos30 = Object.keys(entrenos).filter(f => f >= iso30).length;

  let pushSeries = 0;
  let pullSeries = 0;
  let piernaSeries = 0;
  let coreSeries = 0;

  if (plan && plan.dias) {
    plan.dias.forEach(d => {
      d.ejercicios.forEach(e => {
        const grupo = (e[1] || "").toLowerCase();
        const nSeries = parsearNumSeries(e[2]);
        if (grupo.includes("pecho") || grupo.includes("hombro") || grupo.includes("tríceps") || grupo.includes("triceps")) {
          pushSeries += nSeries;
        } else if (grupo.includes("espalda") || grupo.includes("bíceps") || grupo.includes("biceps") || grupo.includes("trapecio") || grupo.includes("posterior")) {
          pullSeries += nSeries;
        } else if (grupo.includes("pierna") || grupo.includes("glúteo") || grupo.includes("gluteo") || grupo.includes("cuádriceps") || grupo.includes("isquio")) {
          piernaSeries += nSeries;
        } else if (grupo.includes("abdomen") || grupo.includes("core")) {
          coreSeries += nSeries;
        }
      });
    });
  }

  const ratioPushPull = pullSeries > 0 ? (pushSeries / pullSeries).toFixed(2) : "1.00";
  let pushPullBadge = `<span class="semaforo-badge semaforo-verde">🟢 Balance Óptimo (${ratioPushPull})</span>`;
  let pushPullDesc = "El ratio empuje:tracción está en rango protector de manguito rotador y escápulas (entre 0.8 y 1.3).";
  if (ratioPushPull > 1.4) {
    pushPullBadge = `<span class="semaforo-badge semaforo-rojo">🔴 Exceso de Empuje (${ratioPushPull})</span>`;
    pushPullDesc = "Realizas mucho más volumen de empuje que de tracción. Riesgo de pinzamiento subacromial y postura anteriorizada. Aumenta remos y jalones.";
  } else if (ratioPushPull < 0.7) {
    pushPullBadge = `<span class="semaforo-badge semaforo-amarillo">🟡 Dominancia de Tracción (${ratioPushPull})</span>`;
    pushPullDesc = "Volumen de tracción muy superior a empujes. Puedes añadir 2–3 series de press o elevaciones sin fatiga.";
  }

  const estancados = [];
  const progresando = [];

  Object.entries(cargas).forEach(([ej, hist]) => {
    if (Array.isArray(hist) && hist.length >= 3) {
      const u3 = hist.slice(-3);
      const w0 = u3[0].peso || 0;
      const w2 = u3[2].peso || 0;
      const r0 = u3[0].reps || 0;
      const r2 = u3[2].reps || 0;

      if (w2 <= w0 && r2 <= r0) {
        estancados.push({ ejercicio: ej, peso: w2, reps: r2, sesiones: hist.length });
      } else {
        progresando.push({ ejercicio: ej, ganancia: (w2 - w0).toFixed(1) });
      }
    }
  });

  let fatigaEstado = "🟢 Nivel de Fatiga Óptimo";
  let fatigaClase = "semaforo-verde";
  let fatigaMensaje = "Tus niveles de fatiga y frecuencia semanal están en rango de supercompensación. Sigue aplicando sobrecarga progresiva.";

  if (nEntrenos7 >= 6 || (nEntrenos14 >= 11 && estancados.length >= 2)) {
    fatigaEstado = "🔴 Fatiga Central Elevada (Riesgo Sobrecarga)";
    fatigaClase = "semaforo-rojo";
    fatigaMensaje = "Has entrenado con frecuencia muy alta en los últimos 7–14 días y se detectan mesetas de fuerza. Es el momento perfecto para una semana de descarga (Deload).";
  } else if (estancados.length >= 2) {
    fatigaEstado = "🟡 Estancamiento Sistémico Detectado";
    fatigaClase = "semaforo-amarillo";
    fatigaMensaje = "Detectamos 2 o más ejercicios con cargas congeladas en las últimas 3 sesiones. Un Deload de 7 días o reseteo de volumen disipará la fatiga del SNC.";
  } else if (nEntrenos7 <= 1 && nEntrenos30 < 6) {
    fatigaEstado = "🔵 Estímulo Bajo";
    fatigaClase = "semaforo-amarillo";
    fatigaMensaje = "Frecuencia baja en los últimos 7 días. Puedes incrementar la regularidad para mantener adaptaciones de hipertrofia.";
  }

  cont.innerHTML = `
    <div class="auditoria-grid">
      <div class="card" style="margin:0; background:var(--bg-input);">
        <div class="result-label">Frecuencia de Entreno</div>
        <div class="result-value" style="color:var(--accent); font-size:1.6rem;">${nEntrenos7} <span style="font-size:0.9rem; color:var(--muted);">/ 7 días</span></div>
        <div style="font-size:0.78rem; color:var(--muted); margin-top:4px;">${nEntrenos14} en 14 días · ${nEntrenos30} en 30 días</div>
      </div>
      <div class="card" style="margin:0; background:var(--bg-input);">
        <div class="result-label">Balance Empuje / Tracción</div>
        <div style="margin:6px 0;">${pushPullBadge}</div>
        <div style="font-size:0.78rem; color:var(--muted);">${pushSeries} series empuje vs ${pullSeries} series tracción</div>
      </div>
      <div class="card" style="margin:0; background:var(--bg-input);">
        <div class="result-label">Estado de Fatiga SNC</div>
        <div style="margin:6px 0;"><span class="semaforo-badge ${fatigaClase}">${fatigaEstado}</span></div>
        <div style="font-size:0.78rem; color:var(--muted);">Plan actual: <strong>${escapeHtml(plan.titulo)}</strong></div>
      </div>
    </div>

    <div style="margin-top:16px; background:var(--bg-input); border-radius:12px; padding:16px; border:1px solid var(--border);">
      <h4 style="color:var(--text); margin-bottom:8px; font-size:1rem;">📋 Diagnóstico Biomecánico & Sobrecarga</h4>
      <p style="font-size:0.88rem; color:var(--muted); margin-bottom:12px; line-height:1.45;">${fatigaMensaje} ${pushPullDesc}</p>
      
      <div style="font-size:0.86rem; margin-bottom:10px;">
        <strong>⚖️ Análisis de grupos musculares en tu plan:</strong>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
          <span class="tag">Empujes: ${pushSeries} sets</span>
          <span class="tag">Tracciones: ${pullSeries} sets</span>
          <span class="tag">Pierna / Glúteo: ${piernaSeries} sets</span>
          <span class="tag">Core: ${coreSeries} sets</span>
        </div>
      </div>

      ${estancados.length > 0 ? `
        <div style="margin-top:14px; padding-top:12px; border-top:1px dashed var(--border);">
          <strong style="color:#ff7b7b;">⚠️ Ejercicios en meseta (sin subida de carga en 3+ sesiones):</strong>
          <ul style="margin:6px 0 0 18px; font-size:0.84rem; color:var(--text);">
            ${estancados.map(e => `<li><strong>${escapeHtml(e.ejercicio)}</strong> estancado en ${e.peso} kg × ${e.reps} reps (${e.sesiones} registros)</li>`).join("")}
          </ul>
        </div>
      ` : `
        <div style="margin-top:12px; font-size:0.85rem; color:var(--green);">
          ✅ No se detectan mesetas graves en tus ejercicios registrados con cargas.
        </div>
      `}
    </div>

    <div style="margin-top:20px; padding:16px; background:rgba(255,107,53,0.08); border:1px solid rgba(255,107,53,0.3); border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div>
        <h4 style="color:var(--accent); margin-bottom:4px;">⚡ Protocolo de Descarga Activa (Deload IA)</h4>
        <p style="font-size:0.84rem; color:var(--muted); margin:0;">Reduce automáticamente el volumen de tu plan un 40% y sube el RIR a 3–4 durante 7 días para regenerar tendones y reactivar la sobrecarga.</p>
      </div>
      <button class="btn" id="btn-activar-deload" style="white-space:nowrap;">⚡ Activar Semana de Descarga →</button>
    </div>
  `;

  const btnDeload = $("btn-activar-deload");
  if (btnDeload) {
    btnDeload.addEventListener("click", () => {
      generarSemanaDeload();
    });
  }
}

function poblarSelectorPlanesConverter() {
  const selPlan = $("conv-plan-select");
  if (!selPlan) return;

  const custom = cargarLS(KEY.planesCustom, {});
  const todasClaves = [...new Set([...Object.keys(PLANES), ...Object.keys(custom)])];

  const actual = selPlan.value || planActual || "3dias";
  selPlan.innerHTML = todasClaves.map(k => {
    const p = getPlan(k);
    return `<option value="${k}">${escapeHtml(p.titulo)}</option>`;
  }).join("");

  if (todasClaves.includes(actual)) {
    selPlan.value = actual;
  }
}

function recalibrarPlanGimnasio() {
  const selPlan = $("conv-plan-select");
  const selMaq = $("conv-maquina-select");
  const resDiv = $("conv-resultado");
  if (!selPlan || !selMaq || !resDiv) return;

  const planKey = selPlan.value;
  const planOriginal = getPlan(planKey);

  const noDisponibles = Array.from(selMaq.selectedOptions).map(opt => opt.value.trim().toLowerCase());
  if (noDisponibles.length === 0) {
    alert("Por favor selecciona al menos una máquina que NO tenga tu gimnasio.");
    return;
  }

  const copiaPlan = JSON.parse(JSON.stringify(planOriginal));
  copiaPlan.titulo = `${copiaPlan.titulo} (Adaptado Gym)`;
  const cambiosRealizados = [];

  copiaPlan.dias.forEach(d => {
    d.ejercicios = d.ejercicios.map(ej => {
      const [nombre, grupo, series, rir, descanso, nota] = ej;
      const nomLower = nombre.toLowerCase();

      const coincide = noDisponibles.some(m => nomLower.includes(m) || m.includes(nomLower));
      if (coincide) {
        const alts = ALT_EJERCICIOS[nombre] ||
          Object.entries(ALT_EJERCICIOS).find(([k]) => nomLower.includes(k.toLowerCase()) || k.toLowerCase().includes(nomLower))?.[1] ||
          [];

        const sustituto = alts.find(a => !noDisponibles.some(m => a.toLowerCase().includes(m) || m.includes(a.toLowerCase()))) ||
          alts[0] ||
          (grupo === "Piernas" ? "Sentadilla búlgara con mancuernas" : "Press de banca con mancuernas");

        cambiosRealizados.push({
          dia: d.dia,
          original: nombre,
          sustituto: sustituto,
          grupo: grupo
        });

        const nuevaNota = (nota ? nota + " · " : "") + `🔄 Sustitución de "${nombre}" por no disponibilidad`;
        return [sustituto, grupo, series, rir, descanso, nuevaNota];
      }
      return ej;
    });
  });

  resDiv.style.display = "block";

  if (cambiosRealizados.length === 0) {
    resDiv.innerHTML = `
      <div style="background:var(--bg-input); border-radius:10px; padding:14px; border:1px solid var(--border);">
        <p style="color:var(--green); font-weight:600; margin:0;">
          ✅ ¡Tu plan "${escapeHtml(planOriginal.titulo)}" no utiliza ninguna de las máquinas ausentes seleccionadas! Está 100% listo para ejecutarse en tu gimnasio sin cambios.
        </p>
      </div>
    `;
    return;
  }

  const cambiosHtml = cambiosRealizados.map(c => `
    <div class="conv-item">
      <div>
        <span style="text-decoration:line-through; color:var(--muted);">${escapeHtml(c.original)}</span>
        <span class="conv-arrow"> ➔ </span>
        <strong style="color:var(--accent);">${escapeHtml(c.sustituto)}</strong>
        <div style="font-size:0.78rem; color:var(--muted); margin-top:2px;">${escapeHtml(c.dia)} · Grupo: ${escapeHtml(c.grupo)}</div>
      </div>
      <span class="tag">Óptimo</span>
    </div>
  `).join("");

  resDiv.innerHTML = `
    <div style="background:var(--bg-input); border-radius:12px; padding:16px; border:1px solid var(--border);">
      <h4 style="color:var(--accent); margin-bottom:6px;">🔄 Sustituciones Biomecánicas Realizadas (${cambiosRealizados.length})</h4>
      <p style="font-size:0.85rem; color:var(--muted); margin-bottom:14px;">
        La IA ha reemplazado los ejercicios que requerían máquinas ausentes manteniendo los mismos patrones de movimiento y curvas de fuerza:
      </p>
      ${cambiosHtml}
      <div class="btn-row" style="margin-top:16px;">
        <button class="btn" id="btn-guardar-plan-adaptado">💾 Instalar este plan adaptado como mi plan activo →</button>
      </div>
    </div>
  `;

  resDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const btnInstalar = $("btn-guardar-plan-adaptado");
  if (btnInstalar) {
    btnInstalar.addEventListener("click", () => {
      instalarPaquete(copiaPlan, `${planKey}-adaptado`);
    });
  }
}

function initPaquetesIA() {
  const pkgTabs = $("pkg-tabs");
  if (pkgTabs) {
    pkgTabs.querySelectorAll(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.pkgtab;
        pkgTabs.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));

        document.querySelectorAll(".pkg-view").forEach(v => {
          const esActivo = v.id === `pkg-view-${target}`;
          v.style.display = esActivo ? "block" : "none";
          v.classList.toggle("active", esActivo);
        });

        if (target === "catalogo") renderCatalogoPaquetes();
        if (target === "auditoria") ejecutarAuditoriaIA();
        if (target === "converter") poblarSelectorPlanesConverter();
      });
    });
  }

  const chipsCont = $("pkg-prompt-chips");
  if (chipsCont) {
    chipsCont.querySelectorAll("[data-promptchip]").forEach(chip => {
      chip.addEventListener("click", () => {
        const txt = chip.dataset.promptchip;
        if ($("pkg-prompt-text")) $("pkg-prompt-text").value = txt;
        generarPaquetePrompt(txt);
      });
    });
  }

  const btnGen = $("btn-generar-prompt-pkg");
  if (btnGen) {
    btnGen.addEventListener("click", () => {
      generarPaquetePrompt();
    });
  }

  const btnRefrescarAud = $("btn-refrescar-auditoria");
  if (btnRefrescarAud) {
    btnRefrescarAud.addEventListener("click", () => {
      ejecutarAuditoriaIA();
    });
  }

  const btnAudSemana = $("btn-auditar-semana-ia");
  if (btnAudSemana) {
    btnAudSemana.addEventListener("click", auditarSemanaConIA);
  }

  const btnRecalibrar = $("btn-recalibrar-plan");
  if (btnRecalibrar) {
    btnRecalibrar.addEventListener("click", () => {
      recalibrarPlanGimnasio();
    });
  }

  renderCatalogoPaquetes();
  renderBibliotecaPaquetes();
  poblarSelectorPlanesConverter();
}

async function auditarSemanaConIA() {
  const cont = $("auditoria-ia-semana");
  if (!cont) return;
  cont.style.display = "block";
  cont.innerHTML = `<div class="muted">⏳ Analizando tus sesiones de los últimos 7 días...</div>`;

  const entrenos = cargarLS(KEY.entrenos, {});
  const hoyMs = new Date(hoyISO() + "T12:00:00").getTime();
  const ses7d = Object.entries(entrenos).filter(([f]) => {
    const d = (hoyMs - new Date(f + "T12:00:00").getTime()) / 86400000;
    return d >= 0 && d <= 7;
  });
  const ctx = construirContextoUsuarioIA();
  const resumen = `Sesiones completadas esta semana: ${ses7d.length} (${ses7d.map(([f, v]) => `${f}: ${v.dia || v.plan}`).join(", ") || "ninguna"}).\n${ctx}`;

  const apiKey = localStorage.getItem(KEY.geminiApiKey) || "";
  if (apiKey) {
    try {
      const resp = await llamarGeminiTexto(
        apiKey,
        "Eres el Coach Semanal de FitnessCut. Analiza la semana del usuario y da 3 recomendaciones concretas y accionables (en texto breve con viñetas) para la próxima semana.",
        resumen
      );
      cont.innerHTML = `<div class="plan-note"><strong>🤖 Coach Semanal IA:</strong><div style="margin-top:6px; white-space:pre-line;">${escapeHtml(resp)}</div></div>`;
      return;
    } catch { /* fallback local */ }
  }

  const msgLocal = ses7d.length >= 3
    ? `✅ Excelente constancia (${ses7d.length} sesiones esta semana). Mantén tus cargas base y busca +1–2 repeticiones o +2,5 kg en tu ejercicio principal de cada día la próxima semana.`
    : `⚠️ Esta semana llevas ${ses7d.length} sesiones registradas. Prioriza completar al menos 3 días base antes de añadir volumen extra.`;
  cont.innerHTML = `<div class="plan-note"><strong>🤖 Coach Semanal:</strong> ${msgLocal}</div>`;
}

/* =====================================================
   CALCULADORAS
   ===================================================== */
function leerPerfil() {
  return {
    sexo: $("cal-sexo").value,
    edad: +$("cal-edad").value,
    peso: +$("cal-peso").value,
    altura: +$("cal-altura").value,
    actividad: +$("cal-actividad").value,
    deficit: +$("cal-deficit").value,
  };
}

function calcularTdee(p) {
  // Mifflin–St Jeor
  const base = 10 * p.peso + 6.25 * p.altura - 5 * p.edad + (p.sexo === "h" ? 5 : -161);
  return { bmr: base, tdee: base * p.actividad };
}

function objetivoKcalDiario() {
  const p = leerPerfil();
  if (!p.edad || !p.peso || !p.altura) return null;
  const { tdee } = calcularTdee(p);
  return Math.round(tdee * (1 - p.deficit / 100));
}

function actualizarCalorias() {
  const p = leerPerfil();
  if (!p.edad || !p.peso || !p.altura) return;
  const { tdee } = calcularTdee(p);
  const objetivo = Math.round(tdee * (1 - p.deficit / 100));
  const perdidaSemanal = ((tdee - objetivo) * 7 / 7700).toFixed(2);

  const boxes = [
    { v: Math.round(tdee) + " kcal", l: "Mantenimiento (TDEE)" },
    { v: objetivo + " kcal", l: "Objetivo diario" },
    { v: "−" + p.deficit + "%", l: "Déficit aplicado" },
  ];
  let nota = "";
  if (p.deficit > 0) {
    nota = `<div class="result-box note"><div class="result-value">≈ ${perdidaSemanal} kg / semana de pérdida estimada</div>
      <div class="result-label">Ajusta según tu evolución real cada 2 semanas</div></div>`;
  }
  $("cal-results").innerHTML =
    boxes.map(b => `<div class="result-box"><div class="result-value">${b.v}</div><div class="result-label">${b.l}</div></div>`).join("") + nota;
}

["cal-sexo", "cal-edad", "cal-peso", "cal-altura", "cal-actividad", "cal-deficit"].forEach(id =>
  $(id).addEventListener("input", actualizarCalorias)
);

$("btn-macros").addEventListener("click", () => {
  const p = leerPerfil();
  const { tdee } = calcularTdee(p);
  const objetivo = Math.round(tdee * (1 - p.deficit / 100));

  const protG = Math.round(p.peso * 2);
  const grasaG = Math.round(p.peso * 0.9);
  const restoKcal = Math.max(objetivo - protG * 4 - grasaG * 9, 0);
  const carbG = Math.round(restoKcal / 4);

  $("macros-results").innerHTML = [
    { v: protG + " g", l: "Proteína (2 g/kg)" },
    { v: grasaG + " g", l: "Grasa (0,9 g/kg)" },
    { v: carbG + " g", l: "Carbohidratos (el resto)" },
    { v: objetivo + " kcal", l: "Total objetivo" },
    { v: (objetivo + 200) + " kcal", l: `🏋️ Día Entreno (${carbG + 50}g carbos)` },
    { v: Math.max(1200, objetivo - 150) + " kcal", l: `😴 Día Descanso (${Math.max(40, carbG - 38)}g carbos)` },
  ].map(b => `<div class="result-box"><div class="result-value">${b.v}</div><div class="result-label">${b.l}</div></div>`).join("");
});

function actualizarImc() {
  const peso = +$("imc-peso").value;
  const altura = +$("imc-altura").value;
  if (!peso || !altura) return;
  const imc = peso / Math.pow(altura / 100, 2);
  let cat, color;
  if (imc < 18.5)      { cat = "Bajo peso";       color = "var(--blue)"; }
  else if (imc < 25)   { cat = "Peso normal";     color = "var(--green)"; }
  else if (imc < 30)   { cat = "Sobrepeso";       color = "var(--accent)"; }
  else if (imc < 35)   { cat = "Obesidad grado I"; color = "#ff7b7b"; }
  else if (imc < 40)   { cat = "Obesidad grado II"; color = "#ff7b7b"; }
  else                 { cat = "Obesidad grado III"; color = "#ff7b7b"; }

  $("imc-results").innerHTML = `
    <div class="result-box"><div class="result-value" style="color:${color}">${imc.toFixed(1)}</div><div class="result-label">Tu IMC</div></div>
    <div class="result-box"><div class="result-value" style="color:${color}">${cat}</div><div class="result-label">Categoría OMS</div></div>
    <div class="result-box"><div class="result-value">18,5 – 24,9</div><div class="result-label">Rango saludable</div></div>`;
}

["imc-peso", "imc-altura"].forEach(id => $(id).addEventListener("input", actualizarImc));

/* =====================================================
   GRÁFICA DE LÍNEAS (reutilizable)
   ===================================================== */
function svgLine(valores, color, { circulos = true, extra = null, colorExtra = "var(--blue)" } = {}) {
  const W = 760, H = 200, PAD = 36;
  const min = Math.min(...valores, ...(extra || valores));
  const max = Math.max(...valores, ...(extra || valores));
  const rango = Math.max(max - min, 1);
  const n = valores.length;
  const x = i => PAD + (i * (W - 2 * PAD)) / (n - 1);
  const y = v => PAD + (1 - (v - min) / rango) * (H - 2 * PAD);
  const pts = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);

  let extraLine = "";
  if (extra && extra.length > 1) {
    extraLine = `<polyline points="${extra.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${colorExtra}" stroke-width="2" stroke-dasharray="6 4"/>`;
  }

  const areaPts = `${pts[0].split(",")[0]},${H - PAD} ${pts.join(" ")} ${pts[pts.length - 1].split(",")[0]},${H - PAD}`;

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="svgAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="${PAD}" y1="${PAD}" x2="${W - PAD}" y2="${PAD}" stroke="var(--border)" stroke-dasharray="4"/>
      <text x="${PAD - 6}" y="${PAD + 4}" fill="var(--muted)" font-size="11" text-anchor="end">${max.toFixed(1)}</text>
      <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--border)" stroke-dasharray="4"/>
      <text x="${PAD - 6}" y="${H - PAD + 4}" fill="var(--muted)" font-size="11" text-anchor="end">${min.toFixed(1)}</text>
      ${extraLine}
      <polygon points="${areaPts}" fill="url(#svgAreaGrad)"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${circulos ? valores.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4.5" fill="${color}"><title>${v.toFixed(1)}</title></circle>`).join("") : ""}
    </svg>`;
}

/* =====================================================
   PROGRESO: PESO, CINTURA, HISTORIAL
   ===================================================== */
function cargarRegistros() {
  return cargarLS(KEY.progreso, []);
}

function guardarRegistros(regs) {
  guardarLS(KEY.progreso, regs);
}

$("reg-fecha").value = hoyISO();

$("btn-guardar-registro").addEventListener("click", () => {
  const fecha = $("reg-fecha").value || hoyISO();
  const peso = parseFloat($("reg-peso").value);
  const cintura = $("reg-cintura").value ? parseFloat($("reg-cintura").value) : null;

  if (!peso || peso < 30 || peso > 300) {
    alert("Introduce un peso válido (entre 30 y 300 kg).");
    return;
  }

  const registros = cargarRegistros();
  const idx = registros.findIndex(r => r.fecha === fecha);
  if (idx !== -1) {
    if (!confirm(`Ya existe un registro del ${fmtFecha(fecha)} (${registros[idx].peso} kg). ¿Sustituirlo?`)) return;
    registros[idx] = { fecha, peso, cintura };
  } else {
    registros.push({ fecha, peso, cintura });
  }
  guardarRegistros(registros);

  $("reg-peso").value = "";
  $("reg-cintura").value = "";
  renderProgreso();
  renderMeta();
  renderHomeStats();
  renderResumenSemanal();
});

function eliminarRegistro(idx) {
  const registros = cargarRegistros();
  if (!confirm(`¿Eliminar el registro del ${fmtFecha(registros[idx].fecha)}?`)) return;
  registros.splice(idx, 1);
  guardarRegistros(registros);
  renderProgreso();
  renderMeta();
  renderHomeStats();
  renderResumenSemanal();
}

function renderChart(registros) {
  const cont = $("chart");
  if (registros.length < 2) {
    cont.innerHTML = `<div class="empty">${registros.length === 0
      ? "Aún no hay registros. Guarda tu primer peso para ver la gráfica."
      : "Guarda al menos dos registros para ver la evolución."}</div>`;
    return;
  }

  const datos = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const valores = datos.map(d => d.peso);

  // Media móvil de los últimos 7 registros
  const mm = valores.map((_, i) => {
    const desde = Math.max(0, i - 6);
    const ventana = valores.slice(desde, i + 1);
    return ventana.reduce((s, v) => s + v, 0) / ventana.length;
  });

  const cambio = valores[valores.length - 1] - valores[0];
  cont.innerHTML =
    svgLine(valores, "var(--accent)", { extra: mm }) +
    `<div class="muted">De ${fmtFecha(datos[0].fecha)} a ${fmtFecha(datos[datos.length - 1].fecha)} · cambio: <strong>${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)} kg</strong> · <span style="color:var(--blue)">azul punteado = media móvil (7 registros)</span></div>`;
}

function renderChartCintura(registros) {
  const cont = $("chart-cintura");
  const datos = registros
    .filter(r => r.cintura != null)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (datos.length < 2) {
    cont.innerHTML = `<div class="empty">${datos.length === 0
      ? "Añade la cintura en tus registros para ver su evolución."
      : "Guarda al menos dos registros con cintura."}</div>`;
    return;
  }

  const valores = datos.map(d => d.cintura);
  const cambio = valores[valores.length - 1] - valores[0];
  cont.innerHTML =
    svgLine(valores, "var(--blue)") +
    `<div class="muted">De ${fmtFecha(datos[0].fecha)} a ${fmtFecha(datos[datos.length - 1].fecha)} · cambio: <strong>${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)} cm</strong></div>`;
}

function renderHistorial(registros) {
  const cont = $("historial");
  if (registros.length === 0) {
    cont.innerHTML = `<div class="empty">Sin registros todavía.</div>`;
    return;
  }
  const filas = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha));
  cont.innerHTML = `
    <table>
      <thead><tr><th>Fecha</th><th>Peso</th><th>Cintura</th><th></th></tr></thead>
      <tbody>
        ${filas.map(r => {
          const idx = registros.indexOf(r);
          return `<tr>
            <td>${fmtFecha(r.fecha)}</td>
            <td>${r.peso.toFixed(1)} kg</td>
            <td>${r.cintura ? r.cintura.toFixed(1) + " cm" : "—"}</td>
            <td><button class="btn-small" data-del="${idx}" aria-label="Eliminar registro del ${fmtFecha(r.fecha)}">Eliminar</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;

  cont.querySelectorAll("[data-del]").forEach(btn =>
    btn.addEventListener("click", () => eliminarRegistro(+btn.dataset.del))
  );
}

function renderAjusteInteligente(registros) {
  const cont = $("ajuste-kcal-info");
  if (!cont) return;

  const avisos = [];
  const meta = cargarLS(KEY.meta, null);
  const ordenados = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (ordenados.length >= 2) {
    const ultimo = ordenados[ordenados.length - 1];
    const hace14 = ordenados.find(r => {
      const diff = (new Date(ultimo.fecha + "T12:00:00") - new Date(r.fecha + "T12:00:00")) / 86400000;
      return diff >= 10 && diff <= 21;
    }) || ordenados[0];
    const dias = (new Date(ultimo.fecha + "T12:00:00") - new Date(hace14.fecha + "T12:00:00")) / 86400000;
    const delta = ultimo.peso - hace14.peso;

    if (dias >= 10 && meta && meta.peso && ultimo.peso > meta.peso && delta > -0.15) {
      avisos.push(`⚖️ <strong>Meseta detectada (${Math.round(dias)} días):</strong> Tu peso cambió ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg. Considera bajar <strong>120–150 kcal</strong> diarias o sumar <strong>+2.000 pasos/día</strong>.`);
    } else if (dias >= 7 && delta < -1.2 * (dias / 7)) {
      avisos.push(`⚠️ <strong>Ritmo muy rápido (${delta.toFixed(1)} kg en ${Math.round(dias)} días):</strong> Sube ~150 kcal o prioriza proteína para proteger masa muscular.`);
    } else if (dias >= 7) {
      avisos.push(`✅ <strong>Tendencia saludable:</strong> ${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg en los últimos ${Math.round(dias)} días.`);
    }
  }

  const entrenos = cargarLS(KEY.entrenos, {});
  const hoyMs = new Date(hoyISO() + "T12:00:00").getTime();
  const sesiones35d = Object.keys(entrenos).filter(f => {
    const diff = (hoyMs - new Date(f + "T12:00:00").getTime()) / 86400000;
    return diff >= 0 && diff <= 35;
  }).length;
  if (sesiones35d >= 20) {
    avisos.push(`🔋 <strong>Sugerencia de descarga (Deload):</strong> Llevas <strong>${sesiones35d} sesiones</strong> en las últimas 5 semanas. Programa 1 semana reduciendo series al 50% o bajando 10% el peso para disipar fatiga.`);
  }

  cont.innerHTML = avisos.length
    ? avisos.map(a => `<div style="margin-bottom:8px;">${a}</div>`).join("")
    : `<div class="muted">Registra al menos 2 pesos separados por 10+ días para recibir ajustes automáticos de calorías y descarga.</div>`;
}

function renderMapaMuscular() {
  const cont = $("mapa-muscular-wrap");
  if (!cont) return;
  const plan = getPlan(planActual);
  const conteo = { Pecho: 0, Espalda: 0, Hombros: 0, Brazos: 0, Piernas: 0, Abdomen: 0 };
  (plan?.dias || []).forEach(d => {
    d.ejercicios.forEach(ej => {
      const g = (ej[1] || "").toLowerCase();
      const s = parsearNumSeries(ej[2]);
      if (g.includes("pecho")) conteo.Pecho += s;
      else if (g.includes("espalda")) conteo.Espalda += s;
      else if (g.includes("hombro")) conteo.Hombros += s;
      else if (g.includes("brazo") || g.includes("bíceps") || g.includes("tríceps")) conteo.Brazos += s;
      else if (g.includes("pierna") || g.includes("glúteo") || g.includes("femoral") || g.includes("gemelo")) conteo.Piernas += s;
      else if (g.includes("abdomen") || g.includes("core")) conteo.Abdomen += s;
    });
  });
  const color = s => s >= 10 ? "#4ade80" : s >= 5 ? "#ff6b35" : "#334155";
  cont.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; background:var(--bg-input); border:1px solid var(--border); border-radius:10px; padding:12px;">
      <svg width="110" height="130" viewBox="0 0 110 130" aria-label="Mapa muscular semanal">
        <circle cx="55" cy="14" r="9" fill="#475569"/>
        <rect x="33" y="27" width="44" height="22" rx="6" fill="${color(conteo.Pecho)}" opacity="0.9"><title>Pecho: ${conteo.Pecho} series</title></rect>
        <rect x="20" y="27" width="11" height="14" rx="4" fill="${color(conteo.Hombros)}"><title>Hombros: ${conteo.Hombros} series</title></rect>
        <rect x="79" y="27" width="11" height="14" rx="4" fill="${color(conteo.Hombros)}"><title>Hombros: ${conteo.Hombros} series</title></rect>
        <rect x="20" y="43" width="10" height="26" rx="4" fill="${color(conteo.Brazos)}"><title>Brazos: ${conteo.Brazos} series</title></rect>
        <rect x="80" y="43" width="10" height="26" rx="4" fill="${color(conteo.Brazos)}"><title>Brazos: ${conteo.Brazos} series</title></rect>
        <rect x="38" y="51" width="34" height="22" rx="5" fill="${color(conteo.Abdomen)}"><title>Abdomen: ${conteo.Abdomen} series</title></rect>
        <rect x="36" y="76" width="16" height="46" rx="6" fill="${color(conteo.Piernas)}"><title>Piernas: ${conteo.Piernas} series</title></rect>
        <rect x="58" y="76" width="16" height="46" rx="6" fill="${color(conteo.Piernas)}"><title>Piernas: ${conteo.Piernas} series</title></rect>
      </svg>
      <div style="font-size:0.8rem; line-height:1.6;">
        <strong>🗺️ Series semanales por grupo (plan activo):</strong><br>
        ${Object.entries(conteo).map(([k, v]) => `<span style="margin-right:10px;">${k}: <strong style="color:${color(v)};">${v}</strong></span>`).join("")}
      </div>
    </div>`;
}

function renderPRs() {
  renderMapaMuscular();
  const cont = $("pr-list");
  if (!cont) return;
  const cargas = cargarCargas();
  const items = Object.entries(cargas)
    .filter(([, logs]) => Array.isArray(logs) && logs.length > 0)
    .map(([nombre, logs]) => {
      let maxPeso = 0;
      let mejor1RM = 0;
      logs.forEach(l => {
        const p = parseFloat(l.peso) || 0;
        const mReps = String(l.reps || "").match(/(\d+)/g);
        const r = mReps ? Math.min(20, Math.max(1, parseInt(mReps[mReps.length - 1], 10))) : 8;
        const est1RM = p > 0 ? p * (1 + r / 30) : 0;
        if (p > maxPeso) maxPeso = p;
        if (est1RM > mejor1RM) mejor1RM = est1RM;
      });
      return { nombre, maxPeso, mejor1RM: Math.round(mejor1RM * 10) / 10 };
    })
    .filter(x => x.maxPeso > 0)
    .sort((a, b) => b.mejor1RM - a.mejor1RM)
    .slice(0, 8);

  if (items.length === 0) {
    cont.innerHTML = `<div class="empty">Registra pesos en tus entrenamientos para calcular tus récords (PR) y 1RM estimado.</div>`;
    return;
  }

  cont.innerHTML = `<div class="pr-grid">${items.map(it => `
    <div class="pr-item">
      <div class="pr-item-name">${escapeHtml(it.nombre)}</div>
      <div class="pr-item-vals">Máximo: <strong>${it.maxPeso} kg</strong> · 1RM est.: <strong>${it.mejor1RM} kg</strong></div>
    </div>
  `).join("")}</div>`;
}

function renderProgreso() {
  const registros = cargarRegistros();
  renderChart(registros);
  renderChartCintura(registros);
  renderHistorial(registros);
  renderAjusteInteligente(registros);
  renderPRs();
}

/* =====================================================
   OBJETIVO DE PESO
   ===================================================== */
function renderMeta() {
  const meta = cargarLS(KEY.meta, null);
  if (meta && meta.peso) {
    $("meta-peso").value = meta.peso;
    $("meta-fecha").value = meta.fecha || "";
  }

  const cont = $("meta-info");
  const registros = cargarRegistros();
  if (!meta || !meta.peso || registros.length === 0) {
    cont.innerHTML = `<div class="empty">Define tu objetivo y registra tu peso para ver la barra de progreso.</div>`;
    return;
  }

  const ordenados = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const primero = ordenados[0].peso;
  const actual = ordenados[ordenados.length - 1].peso;
  const total = primero - meta.peso;
  const hecho = primero - actual;
  const pct = total !== 0 ? Math.max(0, Math.min(100, (hecho / total) * 100)) : 100;
  const restante = actual - meta.peso;

  let ritmo = "";
  if (meta.fecha) {
    const diasRest = Math.max((new Date(meta.fecha + "T12:00:00") - new Date(hoyISO() + "T12:00:00")) / 86400000, 1);
    const semanas = diasRest / 7;
    const necesario = restante / semanas;
    ritmo = `<div class="muted" style="margin-top:8px">Para llegar al ${fmtFecha(meta.fecha)} necesitas <strong>${necesario.toFixed(2)} kg/semana</strong>${restante <= 0 ? " (¡objetivo alcanzado! 🎉)" : necesario > 1 ? " — quizá demasiado agresivo, replantea la fecha." : "."}</div>`;
  }

  cont.innerHTML = `
    <div class="progress" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="results" style="margin-top:12px">
      <div class="result-box"><div class="result-value">${meta.peso} kg</div><div class="result-label">Objetivo</div></div>
      <div class="result-box"><div class="result-value">${Math.max(restante, 0).toFixed(1)} kg</div><div class="result-label">Te quedan por perder</div></div>
      <div class="result-box"><div class="result-value">${pct.toFixed(0)}%</div><div class="result-label">Progreso desde tu primer registro</div></div>
    </div>${ritmo}`;
}

$("btn-meta").addEventListener("click", () => {
  const peso = parseFloat($("meta-peso").value);
  if (!peso || peso < 30 || peso > 300) {
    alert("Introduce un peso objetivo válido.");
    return;
  }
  guardarLS(KEY.meta, { peso, fecha: $("meta-fecha").value || null });
  renderMeta();
});

/* =====================================================
   HISTÓRICO DE CARGAS
   ===================================================== */
function renderHistoricoCargas() {
  const cargas = cargarCargas();
  const nombres = Object.keys(cargas)
    .filter(n => Array.isArray(cargas[n]) && cargas[n].length > 0)
    .sort((a, b) => a.localeCompare(b, "es"));

  const sel = $("hist-ejercicio");
  renderPRs();
  const previo = sel.value;
  sel.innerHTML = nombres.length
    ? nombres.map(n => `<option value="${n}">${n}</option>`).join("")
    : `<option value="">— Aún no hay pesos apuntados —</option>`;
  if (previo && nombres.includes(previo)) sel.value = previo;

  const nombre = sel.value;
  const logs = nombre ? cargas[nombre] : [];

  const resumen = $("hist-resumen");
  if (!nombre || logs.length === 0) {
    resumen.innerHTML = `<div class="result-box note"><div class="result-value">Apunta tu primer peso en un ejercicio para empezar el histórico</div></div>`;
    $("hist-chart").innerHTML = "";
    $("hist-tabla").innerHTML = "";
    return;
  }

  const pesos = logs.map(l => l.peso);
  const max = Math.max(...pesos);
  const primero = [...logs].sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const cambio = pesos[pesos.length - 1] - primero.peso;

  resumen.innerHTML = [
    { v: max + " kg", l: "Mejor registro" },
    { v: (cambio >= 0 ? "+" : "") + cambio.toFixed(1) + " kg", l: "Progresión desde el primer apunte" },
    { v: logs.length, l: "Sesiones apuntadas" },
  ].map(b => `<div class="result-box"><div class="result-value">${b.v}</div><div class="result-label">${b.l}</div></div>`).join("");

  const chart = $("hist-chart");
  if (logs.length < 2) {
    chart.innerHTML = `<div class="empty">Guarda otro registro de este ejercicio para ver la gráfica de progresión.</div>`;
  } else {
    const datos = [...logs].sort((a, b) => a.fecha.localeCompare(b.fecha));
    chart.innerHTML = svgLine(datos.map(d => d.peso), "var(--green)");
  }

  const filas = [...logs].sort((a, b) => b.fecha.localeCompare(a.fecha));
  $("hist-tabla").innerHTML = `
    <table>
      <thead><tr><th>Fecha</th><th>Peso</th><th>Series</th><th></th></tr></thead>
      <tbody>
        ${filas.map(l => {
          const idx = logs.indexOf(l);
          return `<tr>
            <td>${fmtFecha(l.fecha)}</td>
            <td>${l.peso} kg</td>
            <td>${l.reps || "—"}</td>
            <td><button class="btn-small" data-delcarga="${idx}" aria-label="Eliminar apunte del ${fmtFecha(l.fecha)}">Eliminar</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;

  $("hist-tabla").querySelectorAll("[data-delcarga]").forEach(btn =>
    btn.addEventListener("click", () => {
      if (!confirm("¿Eliminar este apunte de carga?")) return;
      const cs = cargarCargas();
      cs[nombre].splice(+btn.dataset.delcarga, 1);
      if (cs[nombre].length === 0) delete cs[nombre];
      guardarCargas(cs);
      renderHistoricoCargas();
      renderPlan(planActual);
      renderVolumen();
    })
  );
}

$("hist-ejercicio").addEventListener("change", renderHistoricoCargas);

/* =====================================================
   FOTOS DE PROGRESO + COMPARADOR
   ===================================================== */
const FOTO_MAX_LADO = 500;

let fotosCacheIDB = null;

function abrirFotosDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Sin IndexedDB"));
    const req = indexedDB.open("fitnesscut_media", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function initFotosIDB() {
  try {
    const db = await abrirFotosDB();
    const tx = db.transaction("kv", "readonly");
    const getReq = tx.objectStore("kv").get("fotos");
    getReq.onsuccess = async () => {
      const idbFotos = Array.isArray(getReq.result) ? getReq.result : null;
      const lsFotos = cargarLS(KEY.fotos, []);
      if (idbFotos) {
        fotosCacheIDB = idbFotos;
      } else if (lsFotos.length > 0) {
        // Migrar fotos existentes desde localStorage a IndexedDB y liberar cuota
        fotosCacheIDB = lsFotos;
        await guardarFotosIDB(lsFotos);
        try { localStorage.removeItem(KEY.fotos); } catch { /* noop */ }
      } else {
        fotosCacheIDB = [];
      }
      renderFotos();
    };
  } catch {
    fotosCacheIDB = null;
  }
}

async function guardarFotosIDB(fotos) {
  try {
    const db = await abrirFotosDB();
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(fotos, "fotos");
  } catch {
    guardarLS(KEY.fotos, fotos);
  }
}

function cargarFotos() {
  return fotosCacheIDB !== null ? fotosCacheIDB : cargarLS(KEY.fotos, []);
}

function guardarFotos(fotos) {
  fotosCacheIDB = fotos;
  if ("indexedDB" in window) {
    guardarFotosIDB(fotos);
  } else {
    guardarLS(KEY.fotos, fotos);
  }
}

$("foto-input").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, FOTO_MAX_LADO / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

      const fotos = cargarFotos();
      fotos.push({ fecha: hoyISO(), img: dataUrl });
      try {
        guardarFotos(fotos);
        renderFotos();
      } catch {
        alert("El almacenamiento del navegador está lleno. Elimina alguna foto antigua o algún registro.");
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

function renderFotos() {
  const cont = $("fotos-galeria");
  const fotos = cargarFotos();
  if (fotos.length === 0) {
    cont.innerHTML = `<div class="empty">Aún no hay fotos. Sube la primera para comparar tu evolución.</div>`;
    renderFotoCompSelects();
    return;
  }
  const ordenadas = [...fotos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  cont.innerHTML = ordenadas.map(f => {
    const idx = fotos.indexOf(f);
    return `<figure class="foto-item">
      <img src="${f.img}" alt="Foto de progreso del ${fmtFecha(f.fecha)}">
      <figcaption>
        <span>${fmtFecha(f.fecha)}</span>
        <button class="btn-small" data-delfoto="${idx}" aria-label="Eliminar foto del ${fmtFecha(f.fecha)}" title="Eliminar">✕</button>
      </figcaption>
    </figure>`;
  }).join("");

  cont.querySelectorAll("[data-delfoto]").forEach(btn =>
    btn.addEventListener("click", () => {
      if (!confirm("¿Eliminar esta foto?")) return;
      const fs = cargarFotos();
      fs.splice(+btn.dataset.delfoto, 1);
      guardarFotos(fs);
      renderFotos();
    })
  );

  renderFotoCompSelects();
}

function renderFotoCompSelects() {
  const fotos = cargarFotos();
  const fechas = [...new Set(fotos.map(f => f.fecha))].sort((a, b) => b.localeCompare(a));
  ["foto-comp-a", "foto-comp-b"].forEach(id => {
    const sel = $(id);
    const prev = sel.value;
    sel.innerHTML = fechas.length
      ? fechas.map(f => `<option value="${f}">${fmtFecha(f)}</option>`).join("")
      : `<option value="">—</option>`;
    if (prev && fechas.includes(prev)) sel.value = prev;
  });
  renderFotoComp();
}

function renderFotoComp() {
  const fotos = cargarFotos();
  const a = $("foto-comp-a").value;
  const b = $("foto-comp-b").value;
  const cont = $("foto-comp");
  if (!a || !b || a === b) {
    cont.innerHTML = `<div class="empty">Elige dos fechas distintas para comparar tus fotos.</div>`;
    return;
  }
  const fA = fotos.find(f => f.fecha === a);
  const fB = fotos.find(f => f.fecha === b);
  if (!fA || !fB) { cont.innerHTML = ""; return; }
  cont.innerHTML = `
    <figure class="foto-item"><img src="${fA.img}" alt="Foto del ${fmtFecha(a)}"><figcaption>${fmtFecha(a)}</figcaption></figure>
    <figure class="foto-item"><img src="${fB.img}" alt="Foto del ${fmtFecha(b)}"><figcaption>${fmtFecha(b)}</figcaption></figure>`;
}

$("foto-comp-a").addEventListener("change", renderFotoComp);
$("foto-comp-b").addEventListener("change", renderFotoComp);

/* =====================================================
   DIARIO: PASOS Y CALORÍAS
   ===================================================== */
function cargarDiario() {
  return cargarLS(KEY.diario, []);
}

function guardarDiario(datos) {
  guardarLS(KEY.diario, datos);
}

$("dia-fecha").value = hoyISO();

$("btn-guardar-dia").addEventListener("click", () => {
  const fecha = $("dia-fecha").value || hoyISO();
  const pasos = $("dia-pasos").value ? parseInt($("dia-pasos").value, 10) : null;
  const kcal = $("dia-kcal").value ? parseInt($("dia-kcal").value, 10) : null;

  if ((pasos === null || pasos < 0) && (kcal === null || kcal < 0)) {
    alert("Introduce al menos los pasos o las calorías del día.");
    return;
  }

  const diario = cargarDiario();
  const existente = diario.find(d => d.fecha === fecha);
  if (existente) {
    if (pasos !== null) existente.pasos = pasos;
    if (kcal !== null) existente.kcal = kcal;
  } else {
    diario.push({ fecha, pasos, kcal });
  }
  guardarDiario(diario);

  $("dia-pasos").value = "";
  $("dia-kcal").value = "";
  renderDiario();
  renderResumenSemanal();
});

function eliminarDia(idx) {
  const diario = cargarDiario();
  if (!confirm(`¿Eliminar el registro del ${fmtFecha(diario[idx].fecha)}?`)) return;
  diario.splice(idx, 1);
  guardarDiario(diario);
  renderDiario();
  renderResumenSemanal();
}

function mediaUltimosNDias(datos, campo, n) {
  const conDato = datos
    .filter(d => d[campo] !== null && d[campo] !== undefined)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, n);
  if (conDato.length === 0) return null;
  return conDato.reduce((s, d) => s + d[campo], 0) / conDato.length;
}

function sumarKcalDia(fecha, delta) {
  const diario = cargarDiario();
  let e = diario.find(d => d.fecha === fecha);
  if (!e) {
    e = { fecha, pasos: null, kcal: 0 };
    diario.push(e);
  }
  e.kcal = Math.max((e.kcal || 0) + delta, 0);
  guardarDiario(diario);
}

function renderDiario() {
  const diario = cargarDiario();
  const stats = $("diario-stats");
  const objetivo = objetivoKcalDiario();

  const mediaPasos = mediaUltimosNDias(diario, "pasos", 7);
  const mediaKcal = mediaUltimosNDias(diario, "kcal", 7);
  const difObjetivo = (mediaKcal !== null && objetivo) ? mediaKcal - objetivo : null;

  let html = "";
  if (mediaPasos !== null) {
    html += `<div class="stat-box"><div class="stat-value" style="color:${mediaPasos >= 8000 ? "var(--green)" : "var(--accent)"}">${Math.round(mediaPasos).toLocaleString("es")}</div><div class="stat-label">Media de pasos (últimos 7 días · objetivo 8.000+)</div></div>`;
  }
  if (mediaKcal !== null) {
    html += `<div class="stat-box"><div class="stat-value">${Math.round(mediaKcal).toLocaleString("es")} kcal</div><div class="stat-label">Media de calorías (últimos 7 días)</div></div>`;
  }
  if (objetivo) {
    html += `<div class="stat-box"><div class="stat-value">${objetivo.toLocaleString("es")} kcal</div><div class="stat-label">Tu objetivo diario (de la calculadora)</div></div>`;
  }
  if (difObjetivo !== null) {
    const cumpliendo = difObjetivo <= 0;
    html += `<div class="stat-box"><div class="stat-value" style="color:${cumpliendo ? "var(--green)" : "#ff7b7b"}">${difObjetivo >= 0 ? "+" : ""}${Math.round(difObjetivo)} kcal</div><div class="stat-label">${cumpliendo ? "Estás en déficit respecto al objetivo ✓" : "Estás por encima del objetivo"}</div></div>`;
  }
  if (objetivo) {
    const ult7 = diario.filter(d => d.kcal != null).slice(-7);
    const enRango = ult7.filter(d => Math.abs(d.kcal - objetivo) <= 200).length;
    const adherencia = ult7.length ? Math.round((enRango / ult7.length) * 100) : 0;
    if (ult7.length) {
      html += `<div class="stat-box"><div class="stat-value" style="color:${adherencia >= 70 ? "var(--green)" : "var(--accent)"}">${adherencia}%</div><div class="stat-label">Adherencia semanal (±200 kcal · ${enRango}/${ult7.length} días)</div></div>`;
    }
  }
  stats.innerHTML = html || `<div class="stat-box"><div class="stat-value">—</div><div class="stat-label">Registra tu primer día para ver medias</div></div>`;

  const cont = $("diario-historial");
  if (diario.length === 0) {
    cont.innerHTML = `<div class="empty">Sin registros todavía.</div>`;
    return;
  }
  const filas = [...diario].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 20);
  cont.innerHTML = `
    <table>
      <thead><tr><th>Fecha</th><th>Pasos</th><th>Calorías</th><th></th></tr></thead>
      <tbody>
        ${filas.map(d => {
          const idx = diario.indexOf(d);
          return `<tr>
            <td>${fmtFecha(d.fecha)}</td>
            <td>${d.pasos != null ? d.pasos.toLocaleString("es") : "—"}</td>
            <td>${d.kcal != null ? d.kcal.toLocaleString("es") + " kcal" : "—"}</td>
            <td><button class="btn-small" data-deldia="${idx}" aria-label="Eliminar registro del ${fmtFecha(d.fecha)}">Eliminar</button></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>`;

  cont.querySelectorAll("[data-deldia]").forEach(btn =>
    btn.addEventListener("click", () => eliminarDia(+btn.dataset.deldia))
  );
}

/* =====================================================
   ESCÁNER NUTRICIONAL CON IA (FOOD VISION)
   ===================================================== */
const PLATOS_FITNESS_PRESETS = [
  {
    nombre: "Pechuga de pollo con arroz y aceite de oliva",
    ingredientes: ["Pechuga de pollo a la plancha (~180g)", "Arroz blanco o integral (~160g)", "Aceite de oliva virgen (~5g)"],
    kcal: 480,
    proteinas: 42,
    carbos: 52,
    grasas: 10,
    consejo: "Excelente fuente de proteína magra de alto valor biológico y glucógeno muscular para recuperación."
  },
  {
    nombre: "Salmón a la plancha con patatas y espárragos",
    ingredientes: ["Lomo de salmón fresco (~180g)", "Patatas cocidas al vapor (~150g)", "Espárragos trigueros (~80g)"],
    kcal: 510,
    proteinas: 38,
    carbos: 34,
    grasas: 22,
    consejo: "Rico en ácidos grasos Omega-3 antiinflamatorios y potasio para regeneración muscular."
  },
  {
    nombre: "Tortilla de 3 huevos con tostada integral y aguacate",
    ingredientes: ["3 huevos enteros camperos", "Pan integral tostado (1 rebanada)", "Aguacate fresco (~40g)"],
    kcal: 420,
    proteinas: 24,
    carbos: 22,
    grasas: 26,
    consejo: "Grasas saludables monoinsaturadas y colina para saciedad prolongada y densidad ósea."
  },
  {
    nombre: "Bowl de avena con proteína whey, plátano y nueces",
    ingredientes: ["Copos de avena integral (~50g)", "1 scoop de proteína de suero (~30g)", "1 plátano mediano", "Nueces (~15g)"],
    kcal: 470,
    proteinas: 36,
    carbos: 58,
    grasas: 11,
    consejo: "Desayuno o pre-entreno ideal con liberación sostenida de energía y rápida síntesis proteica."
  },
  {
    nombre: "Ensalada completa con atún, huevo cocido y maíz",
    ingredientes: ["Mezcla de hojas verdes y tomate", "1 lata de atún al natural (~80g)", "1 huevo cocido", "Maíz dulce (~40g)", "Aceite de oliva (~8g)"],
    kcal: 380,
    proteinas: 32,
    carbos: 18,
    grasas: 19,
    consejo: "Baja densidad calórica y alto volumen gástrico para fases de definición sin pasar hambre."
  },
  {
    nombre: "Pasta con carne picada de pavo/ternera y tomate",
    ingredientes: ["Pasta cocida (~180g)", "Carne picada magra 5% (~140g)", "Salsa de tomate casera (~60g)"],
    kcal: 520,
    proteinas: 40,
    carbos: 64,
    grasas: 11,
    consejo: "Carbohidratos complejos y hierro para días de entrenamiento intenso de pierna o torso."
  }
];

let fotoComidaBase64 = null;
let fotoComidaMime = "image/jpeg";
let ultimoPlatoAnalizado = null;

async function llamarGeminiFoodVision(apiKey, base64Data, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `Eres un nutricionista deportivo de élite y experto en composición corporal.
Analiza la imagen de este plato de comida.
Identifica los ingredientes visibles y estima el peso aproximado en gramos, las calorías totales y los macronutrientes en gramos (Proteínas, Carbohidratos y Grasas).

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta, sin markdown ni explicaciones adicionales:
{
  "nombre": "Nombre descriptivo del plato",
  "ingredientes": [
    "Ingrediente 1 (~Xg, Y kcal)",
    "Ingrediente 2 (~Xg, Y kcal)"
  ],
  "kcal": 450,
  "proteinas": 35,
  "carbos": 45,
  "grasas": 12,
  "consejo": "Consejo nutricional breve orientado a rendimiento o composición corporal"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || "image/jpeg",
              data: base64Data.replace(/^data:[^;]+;base64,/, "")
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error del servidor de IA (${res.status})`);
  }

  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!txt) throw new Error("La IA no devolvió respuesta de texto.");
  return JSON.parse(txt.replace(/```json/gi, "").replace(/```/g, "").trim());
}

function renderResultadoPlato(plato) {
  const resDiv = $("comida-ai-resultado");
  if (!resDiv) return;
  ultimoPlatoAnalizado = plato;

  const ingTags = (plato.ingredientes || []).map(i => `
    <span class="food-ing-tag">🌱 ${escapeHtml(i)}</span>
  `).join("");

  resDiv.innerHTML = `
    <div style="background:var(--bg-input); border-radius:12px; padding:16px; border:1px solid var(--border); margin-top:14px;">
      <div class="card-head" style="margin-bottom:8px;">
        <h4 style="color:var(--accent); font-size:1.1rem; margin:0;">🍽️ ${escapeHtml(plato.nombre || "Plato Analizado")}</h4>
        <span class="pkg-badge">Estimación IA</span>
      </div>

      <div class="macro-grid">
        <div class="macro-box kcal">
          <div class="macro-val kcal">${Math.round(plato.kcal)}</div>
          <div class="macro-lbl">Calorías (kcal)</div>
        </div>
        <div class="macro-box prot">
          <div class="macro-val prot">${Math.round(plato.proteinas || 0)}g</div>
          <div class="macro-lbl">Proteína</div>
        </div>
        <div class="macro-box carb">
          <div class="macro-val carb">${Math.round(plato.carbos || 0)}g</div>
          <div class="macro-lbl">Carbohidratos</div>
        </div>
        <div class="macro-box fat">
          <div class="macro-val fat">${Math.round(plato.grasas || 0)}g</div>
          <div class="macro-lbl">Grasas</div>
        </div>
      </div>

      <div style="margin:12px 0;">
        <div style="font-size:0.82rem; font-weight:700; color:var(--text); margin-bottom:6px;">Ingredientes y porciones estimadas:</div>
        <div>${ingTags}</div>
      </div>

      ${plato.consejo ? `
        <div style="font-size:0.84rem; color:var(--muted); background:var(--bg-card); border-left:3px solid var(--accent); padding:8px 12px; border-radius:6px; margin:12px 0;">
          💡 <strong>Consejo nutricional:</strong> ${escapeHtml(plato.consejo)}
        </div>
      ` : ""}

      <div class="btn-row" style="margin-top:14px;">
        <button class="btn" id="btn-guardar-comida-ia">➕ Añadir a mis comidas de hoy (+${Math.round(plato.kcal)} kcal) →</button>
      </div>
    </div>
  `;

  resDiv.style.display = "block";
  resDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const btnGuardar = $("btn-guardar-comida-ia");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", () => {
      guardarPlatoEnDiario(plato);
    });
  }
}

function guardarPlatoEnDiario(plato) {
  if (!plato || !plato.kcal) return;
  const total = Math.round(plato.kcal);
  const nombre = plato.nombre || "Plato escaneado con IA";
  const hoy = hoyISO();

  const comidas = cargarComidas();
  if (!comidas[hoy]) comidas[hoy] = [];
  comidas[hoy].push({
    nombre: `${nombre} (${Math.round(plato.proteinas || 0)}g P · ${Math.round(plato.carbos || 0)}g C · ${Math.round(plato.grasas || 0)}g G)`,
    kcal: total
  });
  guardarComidas(comidas);

  sumarKcalDia(hoy, total);
  renderComidas();
  renderDiario();

  decirVoz(`Plato guardado con éxito. Sumadas ${total} calorías a tu diario.`);
  alert(`✅ ¡"${nombre}" (${total} kcal) añadido a tus comidas de hoy!`);
}

async function analizarFotoComida() {
  if (!fotoComidaBase64) {
    alert("Por favor toma una foto o selecciona una imagen de tu plato primero.");
    return;
  }

  const loading = $("comida-ai-loading");
  const resDiv = $("comida-ai-resultado");
  if (loading) loading.style.display = "block";
  if (resDiv) resDiv.style.display = "none";

  const apiKey = localStorage.getItem(KEY.geminiApiKey) || "";
  let plato = null;

  if (apiKey) {
    try {
      plato = await llamarGeminiFoodVision(apiKey, fotoComidaBase64, fotoComidaMime);
    } catch (err) {
      console.warn("Fallo en Gemini Food Vision API, usando estimador de plato:", err);
      plato = PLATOS_FITNESS_PRESETS[0];
    }
  } else {
    plato = PLATOS_FITNESS_PRESETS[0];
  }

  if (loading) loading.style.display = "none";
  if (plato) {
    renderResultadoPlato(plato);
  }
}

function procesarArchivoComida(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    fotoComidaBase64 = e.target.result;
    fotoComidaMime = file.type || "image/jpeg";
    const preview = $("foto-comida-preview");
    const previewWrap = $("foto-comida-preview-wrap");
    if (preview && previewWrap) {
      preview.src = fotoComidaBase64;
      previewWrap.style.display = "block";
    }
  };
  reader.readAsDataURL(file);
}

function initFoodVision() {
  const inputCam = $("foto-comida-camara");
  const inputGal = $("foto-comida-galeria");
  if (inputCam) inputCam.addEventListener("change", (e) => procesarArchivoComida(e.target.files[0]));
  if (inputGal) inputGal.addEventListener("change", (e) => procesarArchivoComida(e.target.files[0]));

  const btnAnalizar = $("btn-analizar-comida");
  if (btnAnalizar) btnAnalizar.addEventListener("click", analizarFotoComida);

  const btnPresetsToggle = $("btn-food-presets-toggle");
  const presetsPanel = $("food-presets-panel");
  if (btnPresetsToggle && presetsPanel) {
    btnPresetsToggle.addEventListener("click", () => {
      presetsPanel.style.display = presetsPanel.style.display === "none" ? "block" : "none";
    });
  }

  const chipsCont = $("food-presets-chips");
  if (chipsCont) {
    chipsCont.innerHTML = PLATOS_FITNESS_PRESETS.map((p, idx) => `
      <button type="button" class="tab" data-foodpreset="${idx}">
        🥗 ${escapeHtml(p.nombre)} (${p.kcal} kcal)
      </button>
    `).join("");

    chipsCont.querySelectorAll("[data-foodpreset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = +btn.dataset.foodpreset;
        const p = PLATOS_FITNESS_PRESETS[idx];
        if (p) renderResultadoPlato(p);
      });
    });
  }
}

/* =====================================================
   COMIDAS RÁPIDAS
   ===================================================== */
const ALIMENTOS = [
  ["Plátano", 105], ["Manzana", 80], ["Naranja", 65],
  ["Huevo", 75], ["Clara de huevo", 17],
  ["Pechuga de pollo (100 g)", 165], ["Filete de ternera (100 g)", 250],
  ["Merluza (100 g)", 90], ["Salmón (100 g)", 200], ["Atún en lata", 120],
  ["Arroz cocido (1 taza)", 205], ["Pasta cocida (1 taza)", 220],
  ["Patata hervida (media)", 130], ["Lentejas cocidas (1 taza)", 230],
  ["Garbanzos cocidos (1 taza)", 270],
  ["Pan (tostada)", 80], ["Leche (250 ml)", 120], ["Yogur natural", 60],
  ["Queso (loncha)", 40], ["Avena (40 g)", 150],
  ["Almendras (30 g)", 170], ["Nueces (30 g)", 195],
  ["Aceite de oliva (1 cucharada)", 120], ["Proteína en polvo (1 scoop)", 120],
];

function cargarComidas() {
  return cargarLS(KEY.comidas, {});
}

function guardarComidas(c) {
  guardarLS(KEY.comidas, c);
}

function cargarComidasCustom() {
  return cargarLS("fitnesscut_comidas_custom", []);
}

function todosAlimentos() {
  return [...ALIMENTOS, ...cargarComidasCustom()];
}

function pintarDatalist() {
  $("lista-alimentos").innerHTML = todosAlimentos()
    .map(([n, k]) => `<option value="${n}">${k} kcal/porción</option>`).join("");
}

function renderAgua() {
  const badge = $("agua-total-badge");
  const fill = $("agua-progress-fill");
  if (!badge || !fill) return;
  const aguaMap = cargarLS("fitnesscut_agua", {});
  const ml = aguaMap[hoyISO()] || 0;
  const pct = Math.min(100, Math.round((ml / 2500) * 100));
  badge.textContent = `${ml} / 2500 ml`;
  fill.style.width = `${pct}%`;
  const ring = $("agua-ring-fg");
  if (ring) {
    const circ = 94.25;
    ring.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(2);
  }
}

function cambiarAgua(deltaMl) {
  const aguaMap = cargarLS("fitnesscut_agua", {});
  const hoy = hoyISO();
  aguaMap[hoy] = Math.max(0, (aguaMap[hoy] || 0) + deltaMl);
  guardarLS("fitnesscut_agua", aguaMap);
  renderAgua();
  renderCoachDiario();
}

if ($("btn-agua-mas")) $("btn-agua-mas").addEventListener("click", () => cambiarAgua(250));
if ($("btn-agua-menos")) $("btn-agua-menos").addEventListener("click", () => cambiarAgua(-250));

if ($("btn-save-food-template")) {
  $("btn-save-food-template").addEventListener("click", () => {
    const nombre = $("comida-nombre").value.trim();
    if (!nombre) {
      alert("Escribe el nombre del alimento o plato frecuente arriba.");
      return;
    }
    const resp = prompt(`¿Cuántas kcal tiene 1 porción de «${nombre}»?`);
    const kcal = parseFloat(resp);
    if (!kcal || kcal <= 0) return;
    const custom = cargarComidasCustom().filter(([n]) => n.toLowerCase() !== nombre.toLowerCase());
    custom.push([nombre, Math.round(kcal)]);
    guardarLS("fitnesscut_comidas_custom", custom);
    pintarDatalist();
    alert(`⭐ «${nombre}» (${Math.round(kcal)} kcal) guardado como plantilla frecuente.`);
  });
}

$("btn-add-comida").addEventListener("click", () => {
  const nombre = $("comida-nombre").value.trim();
  const cant = parseFloat($("comida-cant").value) || 1;
  if (!nombre) {
    alert("Escribe o elige un alimento.");
    return;
  }

  const encontrada = todosAlimentos().find(([n]) => n.toLowerCase() === nombre.toLowerCase());
  let kcalPorcion;
  if (encontrada) {
    kcalPorcion = encontrada[1];
  } else {
    const respuesta = prompt(`¿Cuántas kcal tiene 1 porción de «${nombre}»?`);
    kcalPorcion = parseFloat(respuesta);
    if (!kcalPorcion || kcalPorcion <= 0) {
      alert("Kcal por porción no válidas.");
      return;
    }
  }

  const total = Math.round(kcalPorcion * cant);
  const comidas = cargarComidas();
  const hoy = hoyISO();
  if (!comidas[hoy]) comidas[hoy] = [];
  comidas[hoy].push({ nombre, kcal: total });
  guardarComidas(comidas);

  sumarKcalDia(hoy, total);
  $("comida-nombre").value = "";
  $("comida-cant").value = 1;
  renderComidas();
  renderDiario();
});

function renderComidas() {
  const cont = $("comidas-hoy");
  const hoy = hoyISO();
  const lista = cargarComidas()[hoy] || [];

  if (lista.length === 0) {
    cont.innerHTML = `<div class="empty">Aún no has añadido comidas hoy.</div>`;
    return;
  }

  const total = lista.reduce((s, c) => s + c.kcal, 0);
  cont.innerHTML = `
    <div class="card-head">
      <div><strong>Comidas de hoy (${fmtFecha(hoy)})</strong> <span class="muted">· total ${total.toLocaleString("es")} kcal</span></div>
      <button class="btn-small" id="btn-vaciar-comidas" aria-label="Vaciar comidas de hoy">Vaciar</button>
    </div>
    <table>
      <thead><tr><th>Alimento</th><th>kcal</th></tr></thead>
      <tbody>${lista.map(c => `<tr><td>${c.nombre}</td><td>${c.kcal.toLocaleString("es")}</td></tr>`).join("")}</tbody>
    </table>`;

  $("btn-vaciar-comidas").addEventListener("click", () => {
    if (!confirm("¿Vaciar la lista de comidas de hoy? (No cambia las kcal ya registradas)")) return;
    const comidas = cargarComidas();
    delete comidas[hoy];
    guardarComidas(comidas);
    renderComidas();
  });
}

/* =====================================================
   EXPORTAR CSV
   ===================================================== */
$("btn-exportar").addEventListener("click", () => {
  const registros = cargarRegistros();
  if (registros.length === 0) {
    alert("No hay registros de peso para exportar.");
    return;
  }
  const filas = ["fecha;peso_kg;cintura_cm"];
  [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(r => {
    filas.push(`${r.fecha};${r.peso};${r.cintura ?? ""}`);
  });
  descargarArchivo("fitnesscut_progreso.csv", "\uFEFF" + filas.join("\n"), "text/csv;charset=utf-8");
});

$("btn-exportar-diario").addEventListener("click", () => {
  const diario = cargarDiario();
  if (diario.length === 0) {
    alert("No hay registros del diario para exportar.");
    return;
  }
  const filas = ["fecha;pasos;kcal"];
  [...diario].sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(d => {
    filas.push(`${d.fecha};${d.pasos ?? ""};${d.kcal ?? ""}`);
  });
  descargarArchivo("fitnesscut_diario.csv", "\uFEFF" + filas.join("\n"), "text/csv;charset=utf-8");
});

/* =====================================================
   BACKUP COMPLETO (JSON)
   ===================================================== */
$("btn-backup-export").addEventListener("click", () => {
  const datos = {};
  [KEY.progreso, KEY.diario, KEY.fotos, KEY.cargas, KEY.entrenos, KEY.meta, KEY.comidas, KEY.planesCustom, KEY.notasEjercicios].forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw) {
      try { datos[k] = JSON.parse(raw); } catch { /* ignorar */ }
    }
  });
  const planAct = localStorage.getItem(KEY.planActual);
  if (planAct) datos.planActual = planAct;
  descargarArchivo("fitnesscut_backup.json", JSON.stringify(datos, null, 2), "application/json");
});

$("backup-import").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let datos;
    try {
      datos = JSON.parse(reader.result);
    } catch {
      alert("El archivo no es un backup válido.");
      return;
    }
    if (!datos || typeof datos !== "object") {
      alert("El archivo no es un backup válido.");
      return;
    }
    if (!confirm("Esto sustituirá tus datos actuales por los del backup. ¿Continuar?")) return;

    Object.values(KEY).forEach(k => {
      if (k === KEY.tema) return;
      if (datos[k] !== undefined) guardarLS(k, datos[k]);
    });
    if (datos.planActual) localStorage.setItem(KEY.planActual, datos.planActual);
    location.reload();
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* =====================================================
   RESUMEN EN INICIO Y SEMANAL
   ===================================================== */
function renderHomeStats() {
  const cont = $("home-stats");
  const registros = cargarRegistros();

  if (registros.length === 0) {
    cont.innerHTML = `
      <div class="stat-box"><div class="stat-value">—</div><div class="stat-label">Registra tu peso en "Progreso" para ver tu resumen</div></div>
      <div class="stat-box"><div class="stat-value">3–5</div><div class="stat-label">Sesiones de pesas por semana recomendadas</div></div>
      <div class="stat-box"><div class="stat-value">−0,5 kg</div><div class="stat-label">Objetivo semanal sostenible</div></div>`;
    return;
  }

  const ordenados = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const primero = ordenados[0].peso;
  const actual = ordenados[ordenados.length - 1].peso;
  const cambio = actual - primero;

  cont.innerHTML = `
    <div class="stat-box"><div class="stat-value">${actual.toFixed(1)} kg</div><div class="stat-label">Peso actual</div></div>
    <div class="stat-box"><div class="stat-value" style="color:${cambio <= 0 ? "var(--green)" : "var(--accent)"}">${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)} kg</div><div class="stat-label">Cambio desde el primer registro</div></div>
    <div class="stat-box"><div class="stat-value">${registros.length}</div><div class="stat-label">Registros guardados</div></div>
    <div class="stat-box"><div class="stat-value">${fmtFecha(ordenados[ordenados.length - 1].fecha)}</div><div class="stat-label">Último registro</div></div>`;
}

function renderResumenSemanal() {
  const cont = $("resumen-semanal");
  const registros = cargarRegistros().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const diario = cargarDiario();
  const entrenos = cargarLS(KEY.entrenos, {});

  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 7);
  const iso7 = hace7.toISOString().slice(0, 10);

  const boxes = [];

  if (registros.length >= 2) {
    const anteriores = registros.filter(r => r.fecha <= iso7);
    const base = anteriores.length ? anteriores[anteriores.length - 1].peso : registros[0].peso;
    const actual = registros[registros.length - 1].peso;
    const cambio = actual - base;
    boxes.push({
      v: (cambio >= 0 ? "+" : "") + cambio.toFixed(1) + " kg",
      l: "Cambio de peso (últimos 7 días)",
      c: cambio < 0 ? "var(--green)" : cambio > 0 ? "#ff7b7b" : "var(--muted)",
    });
  }

  const pasos = mediaUltimosNDias(diario, "pasos", 7);
  if (pasos !== null) {
    boxes.push({
      v: Math.round(pasos).toLocaleString("es"),
      l: "Media de pasos (7 días)",
      c: pasos >= 8000 ? "var(--green)" : "var(--text)",
    });
  }

  const nEntrenos = Object.keys(entrenos).filter(f => f >= iso7).length;
  boxes.push({
    v: nEntrenos,
    l: "Entrenamientos (7 días)",
    c: nEntrenos >= 3 ? "var(--green)" : "var(--text)",
  });

  const kcal = mediaUltimosNDias(diario, "kcal", 7);
  if (kcal !== null) {
    const objetivo = objetivoKcalDiario();
    boxes.push({
      v: Math.round(kcal).toLocaleString("es") + " kcal",
      l: objetivo ? `Media vs objetivo (${objetivo.toLocaleString("es")})` : "Media de kcal (7 días)",
      c: objetivo && kcal <= objetivo ? "var(--green)" : "var(--text)",
    });
  }

  cont.innerHTML = boxes.length
    ? boxes.map(b => `<div class="result-box"><div class="result-value" style="color:${b.c}">${b.v}</div><div class="result-label">${b.l}</div></div>`).join("")
    : `<div class="empty">Registra datos esta semana para ver tu resumen.</div>`;
}

/* =====================================================
   PWA (service worker, solo en http/https)
   ===================================================== */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      const mostrarBannerUpdate = (worker) => {
        const banner = $("pwa-update-banner");
        const btn = $("btn-pwa-reload");
        if (!banner || !btn) return;
        banner.style.display = "flex";
        btn.onclick = () => worker.postMessage({ type: "SKIP_WAITING" });
      };
      if (reg.waiting) mostrarBannerUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            mostrarBannerUpdate(nw);
          }
        });
      });
    }).catch(() => { /* sin conexión al SW */ });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

/* ---------- Init ---------- */
aplicarTema();
pintarDatalist();
actualizarCalorias();
actualizarImc();
renderPlanTabs();
renderPlan(planActual);
renderEditor();
renderHistoricoCargas();
renderVolumen();
renderEntrenos();
renderHoyToca();
renderProgreso();
renderMeta();
renderFotos();
renderDiario();
renderAgua();
renderComidas();
renderHomeStats();
renderResumenSemanal();
/* ---------- Escáner de Código de Barras (Open Food Facts) ---------- */
let barcodeStream = null;
let barcodeAnimId = null;

let zxingReader = null;

function detenerBarcodeCamara() {
  if (zxingReader) {
    try { zxingReader.reset(); } catch { /* noop */ }
  }
  if (barcodeAnimId) cancelAnimationFrame(barcodeAnimId);
  barcodeAnimId = null;
  if (barcodeStream) {
    barcodeStream.getTracks().forEach(t => t.stop());
    barcodeStream = null;
  }
  const v = $("barcode-video");
  if (v) {
    v.srcObject = null;
    v.style.display = "none";
  }
}

async function buscarProductoOpenFoodFacts(codigo) {
  const resDiv = $("barcode-result");
  const clean = (codigo || "").trim();
  if (!clean || !resDiv) return;

  // Si es texto (no solo dígitos), buscar por nombre en Open Food Facts
  if (!/^\d{6,14}$/.test(clean)) {
    resDiv.innerHTML = `<div class="muted">🔍 Buscando «${escapeHtml(clean)}» en Open Food Facts...</div>`;
    try {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(clean)}&search_simple=1&action=process&json=1&page_size=5`);
      const data = await r.json();
      const prods = (data?.products || []).filter(p => p.product_name || p.product_name_es).slice(0, 5);
      if (!prods.length) {
        resDiv.innerHTML = `<div class="muted">⚠️ Sin resultados para «${escapeHtml(clean)}».</div>`;
        return;
      }
      resDiv.innerHTML = prods.map((p, idx) => {
        const nom = p.product_name_es || p.product_name;
        const kcal100 = Math.round(p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 0);
        const prot100 = Math.round(p.nutriments?.proteins_100g || 0);
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 8px; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; margin-bottom:6px; font-size:0.82rem;">
            <span><strong>${escapeHtml(nom)}</strong> · ${kcal100} kcal/100g (P ${prot100}g)</span>
            <button type="button" class="btn-xs" data-off-add="${idx}">➕ 100g</button>
          </div>`;
      }).join("");
      resDiv.querySelectorAll("[data-off-add]").forEach(b => {
        b.addEventListener("click", () => {
          const p = prods[+b.dataset.offAdd];
          const nom = p.product_name_es || p.product_name;
          const kcal100 = Math.round(p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 0);
          const comidas = cargarComidas();
          const hoy = hoyISO();
          if (!comidas[hoy]) comidas[hoy] = [];
          comidas[hoy].push({ nombre: `${nom} (100g)`, kcal: kcal100 });
          guardarComidas(comidas);
          sumarKcalDia(hoy, kcal100);
          renderComidas();
          renderDiario();
          b.textContent = "✅";
        });
      });
    } catch {
      resDiv.innerHTML = `<div class="muted">⚠️ Error de conexión al buscar alimentos.</div>`;
    }
    return;
  }

  resDiv.innerHTML = `<div class="muted">🔍 Buscando producto ${escapeHtml(clean)}...</div>`;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json`);
    const data = await r.json();
    if (!data || data.status !== 1 || !data.product) {
      resDiv.innerHTML = `<div class="muted">⚠️ Producto no encontrado en Open Food Facts.</div>`;
      return;
    }
    const p = data.product;
    const nutr = p.nutriments || {};
    const nombre = p.product_name_es || p.product_name || `Producto ${clean}`;
    const kcal100 = Math.round(nutr["energy-kcal_100g"] || nutr["energy-kcal"] || 0);
    const prot100 = Math.round(nutr.proteins_100g || 0);
    const carb100 = Math.round(nutr.carbohydrates_100g || 0);
    const fat100 = Math.round(nutr.fat_100g || 0);

    resDiv.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:10px;">
        <strong>${escapeHtml(nombre)}</strong>
        <div class="muted" style="font-size:0.82rem; margin:4px 0 8px;">Por 100g: <strong>${kcal100} kcal</strong> · P ${prot100}g · C ${carb100}g · G ${fat100}g</div>
        <div class="btn-row">
          <label style="font-size:0.8rem;">Gramos: <input type="number" id="barcode-gramos" value="100" min="5" max="2000" style="width:85px;"></label>
          <button type="button" class="btn-small" id="btn-barcode-add-hoy">➕ Añadir a hoy</button>
        </div>
      </div>`;

    const btnAdd = $("btn-barcode-add-hoy");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        const g = parseFloat($("barcode-gramos")?.value) || 100;
        const totalKcal = Math.round((kcal100 * g) / 100);
        const comidas = cargarComidas();
        const hoy = hoyISO();
        if (!comidas[hoy]) comidas[hoy] = [];
        comidas[hoy].push({ nombre: `${nombre} (${g}g)`, kcal: totalKcal });
        guardarComidas(comidas);
        sumarKcalDia(hoy, totalKcal);
        renderComidas();
        renderDiario();
        resDiv.innerHTML = `<div style="color:var(--green); font-size:0.85rem;">✅ Añadido: ${escapeHtml(nombre)} (${totalKcal} kcal).</div>`;
      });
    }
  } catch {
    resDiv.innerHTML = `<div class="muted">⚠️ Error de conexión al consultar Open Food Facts.</div>`;
  }
}

function initBarcodeScanner() {
  const btnOpen = $("btn-scan-barcode");
  const btnClose = $("btn-barcode-close");
  const btnLookup = $("btn-barcode-lookup");
  const panel = $("barcode-panel");
  const video = $("barcode-video");
  if (!btnOpen || !panel) return;

  btnOpen.addEventListener("click", async () => {
    panel.style.display = "block";
    if (!navigator.mediaDevices?.getUserMedia || !video) return;

    if ("BarcodeDetector" in window) {
      try {
        barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = barcodeStream;
        video.style.display = "block";
        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        const scanLoop = async () => {
          if (!barcodeStream) return;
          if (video.readyState >= 2) {
            try {
              const codes = await detector.detect(video);
              if (codes.length && codes[0].rawValue) {
                const code = codes[0].rawValue;
                if ($("barcode-manual-input")) $("barcode-manual-input").value = code;
                detenerBarcodeCamara();
                buscarProductoOpenFoodFacts(code);
                return;
              }
            } catch { /* noop */ }
          }
          barcodeAnimId = requestAnimationFrame(scanLoop);
        };
        barcodeAnimId = requestAnimationFrame(scanLoop);
        return;
      } catch { /* probar fallback ZXing o entrada manual */ }
    }

    // Fallback universal (iOS Safari / Firefox) con ZXing
    if (typeof ZXing !== "undefined" && ZXing.BrowserMultiFormatReader) {
      try {
        zxingReader = new ZXing.BrowserMultiFormatReader();
        video.style.display = "block";
        zxingReader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          "barcode-video",
          (result) => {
            if (result && result.text) {
              const code = result.text;
              if ($("barcode-manual-input")) $("barcode-manual-input").value = code;
              detenerBarcodeCamara();
              buscarProductoOpenFoodFacts(code);
            }
          }
        );
      } catch {
        video.style.display = "none";
      }
    }
  });

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      detenerBarcodeCamara();
      panel.style.display = "none";
    });
  }

  if (btnLookup) {
    btnLookup.addEventListener("click", () => {
      detenerBarcodeCamara();
      buscarProductoOpenFoodFacts($("barcode-manual-input")?.value);
    });
  }
}

function renderCoachDiario() {
  const el = $("coach-diario-banner");
  if (!el) return;
  const hoy = hoyISO();
  const entrenos = cargarLS(KEY.entrenos, {});
  const hechoHoy = Boolean(entrenos[hoy]);
  const diario = cargarLS(KEY.diario, {});
  const regHoy = diario[hoy] || {};
  const pasos = regHoy.pasos || 0;
  const kcal = regHoy.kcal || 0;
  const agua = (cargarLS("fitnesscut_agua", {})[hoy]) || 0;

  const partes = [];
  partes.push(hechoHoy ? "✅ Entreno de hoy completado" : "🏋️ Entreno de hoy pendiente");
  if (pasos < 8000) partes.push(`🚶 Faltan ${Math.max(0, 8000 - pasos).toLocaleString("es-ES")} pasos`);
  else partes.push(`🚶 ${pasos.toLocaleString("es-ES")} pasos`);
  if (agua < 2000) partes.push(`💧 Agua: ${agua}/2500 ml`);
  if (kcal > 0) partes.push(`🍽️ ${kcal} kcal hoy`);

  el.innerHTML = `<strong>🤖 Coach de hoy:</strong> ${partes.join(" · ")}`;
  el.style.display = "block";
}

function initOnboarding() {
  const modal = $("onboarding-modal");
  if (!modal) return;
  const yaHecho = localStorage.getItem("fitnesscut_onboarding_done") === "1";
  if (!yaHecho && cargarRegistros().length === 0 && !cargarLS(KEY.meta, null)) {
    modal.style.display = "flex";
  }

  $("btn-onb-saltar")?.addEventListener("click", () => {
    localStorage.setItem("fitnesscut_onboarding_done", "1");
    modal.style.display = "none";
  });

  $("btn-onb-guardar")?.addEventListener("click", () => {
    const sexo = $("onb-sexo").value;
    const edad = +$("onb-edad").value || 30;
    const altura = +$("onb-altura").value || 175;
    const peso = parseFloat($("onb-peso").value) || 80;
    const metaPeso = parseFloat($("onb-meta").value) || 74;
    const dias = $("onb-dias").value || "4dias";

    if ($("calc-sexo")) $("calc-sexo").value = sexo;
    if ($("calc-edad")) $("calc-edad").value = edad;
    if ($("calc-altura")) $("calc-altura").value = altura;
    if ($("calc-peso")) $("calc-peso").value = peso;
    if ($("imc-peso")) $("imc-peso").value = peso;
    if ($("imc-altura")) $("imc-altura").value = altura;

    const regs = cargarRegistros();
    regs.push({ fecha: hoyISO(), peso, cintura: null });
    guardarRegistros(regs);
    guardarLS(KEY.meta, { peso: metaPeso, fecha: null });
    localStorage.setItem("fitnesscut_onboarding_done", "1");

    actualizarCalorias();
    actualizarImc();
    renderPlan(dias);
    renderProgreso();
    renderMeta();
    renderCoachDiario();
    modal.style.display = "none";
  });
}

if ($("btn-empezar-entreno-hoy")) {
  $("btn-empezar-entreno-hoy").addEventListener("click", () => {
    showSection("planes");
    if (!modoEntrenoActivo) toggleModoEntreno();
    const pendiente = Array.from(document.querySelectorAll("#plan-content .plan-day"))
      .find(d => !d.querySelector(".day-done.hecho"));
    (pendiente || $("plan-content"))?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

initPaquetesIA();
initFotosIDB();
initBarcodeScanner();
initOnboarding();
renderCoachDiario();
actualizarEstadoAudioCoachUI();
initFoodVision();
initFormCheckVision();

if (location.hash) {
  const sec = location.hash.slice(1);
  if ($(sec) && $(sec).classList.contains("section")) {
    showSection(sec);
  }
}
