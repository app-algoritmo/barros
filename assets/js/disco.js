/* ============================================================
   BARROS — disco.js
   Renderiza o disco de serviços, a vitrine e a ficha do serviço.
   Documento controlado: DOC-WEB-JS-002 · v1.0.0
   ============================================================ */

import { CATEGORIAS, CASAS, CONTATO } from "./catalogo.js";

const NS = "http://www.w3.org/2000/svg";
const C = 200, R = 192, r = 112;

const svg     = document.getElementById("wheel");
const hub     = document.getElementById("disco-hub");
const vitrine = document.getElementById("vitrine");
const legenda = document.getElementById("legenda");
const overlay = document.getElementById("overlay");
const modal   = document.getElementById("modal");

/* ─── Utilitários ─────────────────────────────────────────── */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const ponto = (ang, rad) => { const a = (ang - 90) * Math.PI / 180; return [C + rad*Math.cos(a), C + rad*Math.sin(a)]; };
const anel = (a0, a1, rExt, rInt) => {
  const grande = (a1 - a0) > 180 ? 1 : 0;
  const [x0,y0] = ponto(a0,rExt), [x1,y1] = ponto(a1,rExt),
        [x2,y2] = ponto(a1,rInt), [x3,y3] = ponto(a0,rInt);
  return `M${x0} ${y0} A${rExt} ${rExt} 0 ${grande} 1 ${x1} ${y1} L${x2} ${y2} A${rInt} ${rInt} 0 ${grande} 0 ${x3} ${y3} Z`;
};

const T = (pt, en) => (document.documentElement.lang || "pt").startsWith("pt") ? pt : en;

/* ─── Montagem do disco ───────────────────────────────────── */
function montar(){
  const passo = 360 / CATEGORIAS.length;

  /* Aro externo: cada casa ocupa um trecho contínuo. */
  const blocos = [];
  CATEGORIAS.forEach((cat, i) => {
    const ult = blocos[blocos.length - 1];
    if (ult && ult.casa === cat.casa) ult.fim = i + 1;
    else blocos.push({ casa: cat.casa, ini: i, fim: i + 1 });
  });
  blocos.forEach(b => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", anel(b.ini*passo + 0.7, b.fim*passo - 0.7, R + 13, R + 7));
    p.setAttribute("fill", CASAS[b.casa].cor);
    p.setAttribute("class", "aro");
    svg.appendChild(p);
  });

  /* Setores */
  CATEGORIAS.forEach((cat, i) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", anel(i*passo + 0.4, (i+1)*passo - 0.4, R, r));
    p.setAttribute("fill", cat.cor);
    p.setAttribute("class", "sector");
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label",
      `${cat.titulo} — ${cat.servicos.length} ${T("itens, por","items, by")} ${CASAS[cat.casa].nome}`);
    p.addEventListener("click", () => abrirCategoria(i));
    p.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirCategoria(i); }
    });
    svg.appendChild(p);

    const meio = i*passo + passo/2, [lx, ly] = ponto(meio, (R + r)/2);
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", lx); t.setAttribute("y", ly);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("dominant-baseline", "middle");
    t.setAttribute("class", "sector-label");
    t.setAttribute("transform", `rotate(${meio > 180 ? meio + 90 : meio - 90} ${lx} ${ly})`);
    t.textContent = cat.curto || cat.titulo;
    svg.appendChild(t);
  });

  /* Legenda das três casas */
  if (legenda) {
    legenda.innerHTML = Object.values(CASAS).map(c =>
      `<span class="casa"><i style="background:${c.cor}"></i>
        <span><b>${esc(c.nome)}</b>${esc(c.papel)}</span></span>`).join("");
  }

  /* Abre a categoria indicada na URL, se houver. */
  abrirPelaURL();

  /* O rodapé aponta para /servicos.html#regtech e afins. Quem já está nesta
     página faz só uma troca de âncora, sem recarregar — daí o listener. */
  window.addEventListener("hashchange", abrirPelaURL);
}

function abrirPelaURL(){
  const alvo = location.hash.replace("#", "");
  const idx = CATEGORIAS.findIndex(c => c.id === alvo);
  if (idx >= 0) abrirCategoria(idx, false);
}

/* ─── Vitrine ─────────────────────────────────────────────── */
function abrirCategoria(i, mexerHash = true){
  const cat = CATEGORIAS[i], casa = CASAS[cat.casa];

  svg.querySelectorAll(".sector").forEach((s, j) => {
    s.classList.toggle("is-active", j === i);
    s.classList.toggle("dim", j !== i);
  });

  if (hub) {
    hub.innerHTML = `
      <span class="hub-kicker" style="color:${cat.cor}">${cat.servicos.length} ${T("itens","items")}</span>
      <p class="hub-title">${esc(cat.titulo)}</p>
      <p class="hub-body">${esc(casa.nome)}</p>`;
  }

  const cartao = (s, k) => `
    <article class="servico" style="--casa:${cat.cor}">
      <span class="tipo">${esc(s.tipo)}</span>
      <h4>${esc(s.nome)}</h4>
      <p>${esc(s.resumo)}</p>
      <span class="formato">${esc(s.formato)}</span>
      <button class="saber" data-cat="${i}" data-srv="${k}">
        ${T("Ver detalhes","View details")} <span aria-hidden="true">→</span>
      </button>
    </article>`;

  const grupos = [];
  cat.servicos.forEach((s, k) => {
    const nome = s.grupo || "";
    let g = grupos.find(x => x.nome === nome);
    if (!g) { g = { nome, itens: [] }; grupos.push(g); }
    g.itens.push([s, k]);
  });

  const corpo = grupos.map(g =>
    (g.nome ? `<h3 class="vitrine-grupo">${esc(g.nome)}</h3>` : "") +
    `<div class="grade">${g.itens.map(([s, k]) => cartao(s, k)).join("")}</div>`
  ).join("");

  vitrine.hidden = false;
  vitrine.innerHTML = `
    <div class="vitrine-head">
      <span class="casa-tag" data-casa="${cat.casa}">${esc(casa.nome)}</span>
      <h3>${esc(cat.titulo)}</h3>
    </div>
    <p class="vitrine-intro">${esc(cat.intro)}</p>
    ${corpo}`;

  vitrine.querySelectorAll(".saber").forEach(b =>
    b.addEventListener("click", () => abrirFicha(+b.dataset.cat, +b.dataset.srv, b)));

  if (mexerHash) history.replaceState(null, "", `#${cat.id}`);
}

/* ─── Ficha do serviço ────────────────────────────────────── */
let gatilho = null;

function abrirFicha(i, k, origem){
  const cat = CATEGORIAS[i], srv = cat.servicos[k], entrega = srv.marca || cat.marca;
  gatilho = origem;
  modal.style.setProperty("--casa", cat.cor);

  const assunto = encodeURIComponent(`${T("Proposta","Proposal")} — ${srv.nome} (${cat.titulo})`);
  const corpoMail = encodeURIComponent(
    `${T("Categoria","Category")}: ${cat.titulo}\n${T("Serviço","Service")}: ${srv.nome}\n` +
    `${T("Entrega","Delivered by")}: ${entrega}\n\n${T("Contexto:","Context:")}\n`);
  const lista = itens => `<ul>${itens.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const conteudo = srv.blocos
    ? srv.blocos.map(b => `<h4>${esc(b.titulo)}</h4>${lista(b.itens)}`).join("")
    : `<h4>${T("O que inclui","What is included")}</h4>${lista(srv.inclui)}`;
  const pagina = srv.pagina
    ? `<a class="btn btn--ghost" href="${srv.pagina}"${srv.pagina.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${T("Abrir página","Open page")}</a>`
    : "";

  modal.innerHTML = `
    <div class="modal-top">
      <button class="modal-close" id="fechar-1" aria-label="${T("Fechar","Close")}">✕</button>
      <span class="casa-tag" data-casa="${cat.casa}">${esc(srv.tipo)} · ${esc(entrega)}</span>
      <h3 id="modal-titulo">${esc(srv.nome)}</h3>
      <p>${esc(srv.resumo)}</p>
    </div>
    <div class="modal-body">
      ${conteudo}
      <h4>${T("Ficha","Summary")}</h4>
      <dl class="facts">
        <div><dt>${T("Categoria","Category")}</dt><dd>${esc(cat.titulo)}</dd></div>
        <div><dt>${T("Entrega","Delivered by")}</dt><dd>${esc(entrega)}</dd></div>
        <div><dt>${T("Formato","Format")}</dt><dd>${esc(srv.formato)}</dd></div>
      </dl>
    </div>
    <div class="modal-foot">
      <a class="btn" href="/contato.html?servico=${encodeURIComponent(cat.id + "::" + srv.nome)}">${T("Pedir proposta","Request a proposal")}</a>
      ${pagina}
      <a class="btn btn--quiet" href="mailto:${CONTATO}?subject=${assunto}&body=${corpoMail}">${T("Escrever direto","Email directly")}</a>
    </div>`;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const btn = document.getElementById("fechar-1");
  btn.focus();
  btn.addEventListener("click", fecharFicha);
}

function fecharFicha(){
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (gatilho) gatilho.focus();
}

if (overlay) {
  overlay.addEventListener("click", e => { if (e.target === overlay) fecharFicha(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) fecharFicha();
  });
}

/* ─── Início ──────────────────────────────────────────────── */
/* Chamado no fim do módulo: os utilitários acima já estão inicializados. */
if (svg) montar();
