/* ============================================================
   BARROS — form.js
   Formulário de contato: seletor de serviços, validação e envio.
   Destinatário: post@barros.no
   Documento controlado: DOC-WEB-JS-003 · v1.0.0
   ============================================================ */

import { listaServicos, CONTATO } from "./catalogo.js";

/* ────────────────────────────────────────────────────────────
   COMO A MENSAGEM SAI DAQUI

   ENDPOINT vazio (padrão de hoje)
     Abre o programa de e-mail do visitante com a mensagem já
     montada para post@barros.no. Funciona sem servidor nenhum.
     Ponto fraco: quem abre o site pelo celular ou por webmail
     sem cliente configurado costuma desistir no meio.

   ENDPOINT preenchido (recomendado)
     Envio direto por HTTPS. Nada depende do visitante ter cliente
     de e-mail, e cada mensagem ganha número de referência e fica
     registrada no banco — que é o que sustenta o indicador
     «prazo da primeira resposta» da Política da Qualidade.

     Para ativar: publique api/contato.php no Domeneshop e ponha
     a URL abaixo. Ver docs/qualidade/formulario.md.
       const ENDPOINT = "https://api.barros.no/contato.php";

   Se o envio direto falhar, o formulário cai sozinho no mailto —
   nenhuma mensagem se perde por indisponibilidade do servidor.
   ──────────────────────────────────────────────────────────── */
const ENDPOINT = "";

const form = document.getElementById("form-contato");
if (form) iniciar();

function iniciar(){
  const select  = form.querySelector("#servico");
  const status  = document.getElementById("form-status");
  const enviar  = form.querySelector("button[type='submit']");

  /* ── Seletor de serviços, agrupado por casa ── */
  if (select) {
    const itens = listaServicos();
    const casas = [...new Set(itens.map(i => i.casa))];
    casas.forEach(casa => {
      const og = document.createElement("optgroup");
      og.label = casa;
      const cats = [...new Set(itens.filter(i => i.casa === casa).map(i => i.categoria))];
      cats.forEach(cat => {
        itens.filter(i => i.casa === casa && i.categoria === cat).forEach(i => {
          const o = document.createElement("option");
          o.value = i.valor;
          o.textContent = `${cat} — ${i.nome}`;
          og.appendChild(o);
        });
      });
      select.appendChild(og);
    });

    /* Pré-seleção vinda do disco: /contato.html?servico=id::Nome */
    const pedido = new URLSearchParams(location.search).get("servico");
    if (pedido && [...select.options].some(o => o.value === pedido)) {
      select.value = pedido;
      select.closest(".field")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  /* ── Validação ── */
  const erro = (campo, msg) => {
    const wrap = campo.closest(".field");
    wrap.dataset.invalid = msg ? "true" : "false";
    const alvo = wrap.querySelector(".field-error");
    if (alvo) alvo.textContent = msg || "";
    campo.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  };

  const valida = () => {
    let ok = true;
    const nome = form.nome, email = form.email, msg = form.mensagem, lgpd = form.consentimento;
    const t = k => ({
      nome:  { pt:"Informe seu nome.", en:"Enter your name.", no:"Skriv inn navnet ditt.", es:"Indique su nombre." },
      email: { pt:"Informe um e-mail válido.", en:"Enter a valid email address.", no:"Skriv inn en gyldig e-postadresse.", es:"Indique un correo válido." },
      msg:   { pt:"Descreva sua necessidade em pelo menos 20 caracteres.", en:"Describe your need in at least 20 characters.", no:"Beskriv behovet med minst 20 tegn.", es:"Describa su necesidad con al menos 20 caracteres." },
      lgpd:  { pt:"É preciso autorizar o tratamento dos dados.", en:"You must authorise the processing of your data.", no:"Du må samtykke til behandling av dine data.", es:"Debe autorizar el tratamiento de los datos." },
    })[k][(window.barrosI18n?.atual) || "pt"];

    ok = erro(nome,  nome.value.trim().length < 2 ? t("nome") : "") && ok;
    ok = erro(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? t("email") : "") && ok;
    ok = erro(msg,   msg.value.trim().length < 20 ? t("msg") : "") && ok;
    ok = erro(lgpd,  !lgpd.checked ? t("lgpd") : "") && ok;
    return ok;
  };

  form.querySelectorAll("input,select,textarea").forEach(c =>
    c.addEventListener("blur", () => { if (c.closest(".field")?.dataset.invalid === "true") valida(); }));

  /* ── Envio ── */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.hidden = true;

    /* Armadilha anti-robô: campo oculto que humano não preenche. */
    if (form.website && form.website.value) return;

    if (!valida()) {
      mostrar(status, "erro", {
        pt:"Revise os campos destacados.", en:"Please review the highlighted fields.",
        no:"Se over de merkede feltene.", es:"Revise los campos marcados."
      });
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const dados = Object.fromEntries(new FormData(form).entries());
    delete dados.website;
    dados.origem = location.href;
    dados.idioma = window.barrosI18n?.atual || "pt";

    if (!ENDPOINT) {
      window.location.href = montarMailto(dados);
      mostrar(status, "ok", {
        pt:"Abrimos seu programa de e-mail com a mensagem pronta. Confira e envie.",
        en:"Your email client has opened with the message ready. Review it and send.",
        no:"E-postprogrammet ditt er åpnet med meldingen klar. Se over og send.",
        es:"Se abrió su cliente de correo con el mensaje listo. Revíselo y envíelo."
      });
      return;
    }

    enviar.disabled = true;
    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...dados, consentimento: true }),
      });
      const resposta = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resposta.estado || r.status);
      form.reset();
      const ref = resposta.ref ? ` ${T({
        pt:"Referência", en:"Reference", no:"Referanse", es:"Referencia"
      })}: ${resposta.ref}.` : "";
      mostrar(status, "ok", {
        pt:`Mensagem recebida. Respondemos em até 2 dias úteis.${ref}`,
        en:`Message received. We reply within 2 business days.${ref}`,
        no:`Melding mottatt. Vi svarer innen 2 virkedager.${ref}`,
        es:`Mensaje recibido. Respondemos en hasta 2 días hábiles.${ref}`
      });
    } catch {
      /* Servidor indisponível: cai no e-mail em vez de perder a mensagem. */
      window.location.href = montarMailto(dados);
      mostrar(status, "ok", {
        pt:`O envio direto falhou, então abrimos seu programa de e-mail com a mensagem pronta para ${CONTATO}. Confira e envie.`,
        en:`Direct sending failed, so we opened your email client with the message ready for ${CONTATO}. Review it and send.`,
        no:`Direkte sending feilet, så vi åpnet e-postprogrammet ditt med meldingen klar til ${CONTATO}. Se over og send.`,
        es:`El envío directo falló, así que abrimos su cliente de correo con el mensaje listo para ${CONTATO}. Revíselo y envíelo.`
      });
    } finally {
      enviar.disabled = false;
    }
  });
}

const T = textos => textos[(window.barrosI18n?.atual) || "pt"] || textos.pt;

function mostrar(el, tom, textos){
  el.dataset.tone = tom;
  el.textContent = textos[(window.barrosI18n?.atual) || "pt"] || textos.pt;
  el.hidden = false;
  el.setAttribute("role", tom === "erro" ? "alert" : "status");
}

function montarMailto(d){
  const servico = d.servico ? d.servico.split("::").pop() : "—";
  const assunto = `[barros.no] ${servico} — ${d.nome}`;
  const corpo = [
    `Nome:      ${d.nome}`,
    `Empresa:   ${d.empresa || "—"}`,
    `E-mail:    ${d.email}`,
    `Telefone:  ${d.telefone || "—"}`,
    `País:      ${d.pais || "—"}`,
    `Serviço:   ${servico}`,
    `Prazo:     ${d.prazo || "—"}`,
    "",
    "Mensagem:",
    d.mensagem,
    "",
    "—",
    `Origem: ${d.origem}`,
    `Idioma: ${d.idioma}`,
  ].join("\n");
  return `mailto:${CONTATO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}
