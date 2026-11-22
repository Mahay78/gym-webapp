import globals from "globals";

// API pública de lib/fitness-math.js (expuesta en el scope global en navegador)
const fitnessMath = Object.fromEntries([
  "hoyISO", "fmtFecha", "escapeHtml", "sugerirCarga", "parsearNumSeries",
  "calcularDiscosBarra", "calcularAproximacion", "calcularRacha",
  "formatearPlanTexto", "normalizarTextoVoz", "parsearComandoCarga",
  "calcularAngulo", "calcularTdee", "calcularMacros", "categoriaImc"
].map(n => [n, "readonly"]));

export default [
  { ignores: ["node_modules/**"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...fitnessMath,
        // Globales de librerías CDN cargadas en index.html
        ZXing: "readonly",
        Pose: "readonly",
        Camera: "readonly",
        SpeechRecognition: "readonly",
        webkitSpeechRecognition: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",
      "no-unused-vars": ["warn", { args: "none" }],
      "no-empty": "warn"
    }
  }
];
