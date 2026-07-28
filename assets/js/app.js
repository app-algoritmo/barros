/* ============================================================
   BARROS — app.js
   Navegação, idiomas, revelação ao rolar e consentimento.
   Documento controlado: DOC-WEB-JS-001 · v1.0.0
   ============================================================ */

const IDIOMAS = ["pt", "en", "no", "es"];
const IDIOMA_PADRAO = "pt";
const CHAVE_IDIOMA = "barros.idioma";
const CHAVE_COOKIES = "barros.consentimento";

/* ─── Navegação ───────────────────────────────────────────── */
(function nav(){
  const alternar = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav");
  if (!alternar || !menu) return;

  alternar.addEventListener("click", () => {
    const aberto = menu.dataset.open === "true";
    menu.dataset.open = String(!aberto);
    alternar.setAttribute("aria-expanded", String(!aberto));
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    menu.dataset.open = "false";
    alternar.setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.dataset.open === "true") {
      menu.dataset.open = "false";
      alternar.setAttribute("aria-expanded", "false");
      alternar.focus();
    }
  });

  /* Marca a página atual */
  const aqui = location.pathname.replace(/\/$/, "/index.html").split("/").pop() || "index.html";
  menu.querySelectorAll(".nav-list a").forEach(a => {
    const href = a.getAttribute("href").split("#")[0].split("/").pop();
    if (href === aqui) a.setAttribute("aria-current", "page");
  });
})();

/* ─── Idiomas ─────────────────────────────────────────────── */
const i18n = {
  atual: IDIOMA_PADRAO,
  dic: {},

  detectar(){
    const url = new URLSearchParams(location.search).get("lang");
    const salvo = localStorage.getItem(CHAVE_IDIOMA);
    const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    const nb = nav === "nb" || nav === "nn" ? "no" : nav;
    return IDIOMAS.find(l => l === url) || IDIOMAS.find(l => l === salvo)
        || IDIOMAS.find(l => l === nb) || IDIOMA_PADRAO;
  },

  async carregar(lang){
    if (this.dic[lang]) return this.dic[lang];
    try {
      const r = await fetch(`/i18n/${lang}.json`, { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      this.dic[lang] = await r.json();
      return this.dic[lang];
    } catch {
      return null;
    }
  },

  /* Mescla: pt (base) → en (ponte) → idioma alvo.
     Chave ausente numa tradução parcial cai para o inglês, nunca quebra. */
  async montar(lang){
    const base = await this.carregar(IDIOMA_PADRAO) || {};
    if (lang === "pt") return base;
    const ponte = await this.carregar("en") || {};
    if (lang === "en") return { ...base, ...ponte };
    const alvo = await this.carregar(lang) || {};
    return { ...base, ...ponte, ...alvo };
  },

  async aplicar(lang){
    const d = await this.montar(lang);
    if (!d || !Object.keys(d).length) return;
    this.atual = lang;
    localStorage.setItem(CHAVE_IDIOMA, lang);
    document.documentElement.lang = { pt:"pt-BR", en:"en", no:"nb-NO", es:"es" }[lang] || lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const v = d[el.dataset.i18n];
      if (v == null) return;
      if (el.dataset.i18nHtml !== undefined) el.innerHTML = v;
      else el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(",").forEach(par => {
        const [attr, chave] = par.split(":").map(s => s.trim());
        if (d[chave] != null) el.setAttribute(attr, d[chave]);
      });
    });
    if (d["meta.title"]) document.title = d["meta.title"];

    document.querySelectorAll(".lang-switch button").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    document.dispatchEvent(new CustomEvent("idioma:mudou", { detail: { lang, dic: d } }));
  }
};

document.querySelectorAll(".lang-switch button").forEach(b =>
  b.addEventListener("click", () => i18n.aplicar(b.dataset.lang)));

i18n.aplicar(i18n.detectar());
window.barrosI18n = i18n;

/* ─── Revelação ao rolar ──────────────────────────────────── */
(function reveal(){
  const alvos = document.querySelectorAll(".reveal");
  if (!alvos.length) return;
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    alvos.forEach(el => el.classList.add("is-in"));
    return;
  }
  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); o.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  alvos.forEach(el => obs.observe(el));
})();

/* ─── Consentimento de cookies ────────────────────────────── */
(function cookies(){
  const barra = document.getElementById("cookie-bar");
  if (!barra) return;

  const gravar = escolha => {
    localStorage.setItem(CHAVE_COOKIES, JSON.stringify({
      ...escolha, essenciais: true, data: new Date().toISOString(), versao: "1.0.0"
    }));
    barra.classList.remove("is-open");
    setTimeout(() => { barra.hidden = true; }, 340);
  };

  if (localStorage.getItem(CHAVE_COOKIES)) return;

  barra.hidden = false;
  requestAnimationFrame(() => barra.classList.add("is-open"));

  barra.querySelector("[data-acao='aceitar']")?.addEventListener("click", () =>
    gravar({ analiticos: true, marketing: true }));
  barra.querySelector("[data-acao='recusar']")?.addEventListener("click", () =>
    gravar({ analiticos: false, marketing: false }));
  barra.querySelector("[data-acao='salvar']")?.addEventListener("click", () => gravar({
    analiticos: barra.querySelector("#ck-analiticos")?.checked ?? false,
    marketing:  barra.querySelector("#ck-marketing")?.checked ?? false,
  }));
})();

/* ─── Ano corrente no rodapé ──────────────────────────────── */
document.querySelectorAll("[data-ano]").forEach(el => { el.textContent = new Date().getFullYear(); });
