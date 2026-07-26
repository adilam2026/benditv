/* RECOFIABLE — Maquette UX interactive — app.js
   Aucun backend. État en mémoire + localStorage. Interactions simulées. */

// ───────────────────────── État global ─────────────────────────
const STATE = {
  query: "",
  activeFilters: new Set(),
  removedChips: new Set(),
  viewMode: "liste",
  sort: "pertinence",
  mapVisibleIds: null,
  groupFilter: null,
  groupLabel: null,
  contribution: { placeId: null, ratings: {}, recommend: null, comment: "", detailedOpen: false, photoAdded: false, detail: {} },
  contribSearch: "",
  profileId: localStorage.getItem("reco_profile") || "parent",
  savedIds: new Set(JSON.parse(localStorage.getItem("reco_saved") || "[]")),
  collections: JSON.parse(localStorage.getItem("reco_collections") || "{}"),
  activeCollection: "Tous",
  feedbacks: JSON.parse(localStorage.getItem("reco_feedbacks") || "null") || FEEDBACKS_SEED.slice(),
  pilotMode: localStorage.getItem("reco_pilot") !== "off",
  openWhy: new Set(),
  accordionOpen: {},
  galleryIndex: {},
  openQuestion: null,
  expandedCriteria: new Set(),
  feedbackType: "amelioration",
};

function persist() {
  localStorage.setItem("reco_saved", JSON.stringify([...STATE.savedIds]));
  localStorage.setItem("reco_collections", JSON.stringify(STATE.collections));
  localStorage.setItem("reco_feedbacks", JSON.stringify(STATE.feedbacks));
  localStorage.setItem("reco_profile", STATE.profileId);
  localStorage.setItem("reco_pilot", STATE.pilotMode ? "on" : "off");
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function byId(id) { return PLACES.find((p) => p.id === id); }

// ───────────────────────── Icônes (SVG inline, sobres) ─────────────────────────
function icon(name, cls) {
  const c = `icon ${cls || ""}`;
  const wrap = (inner) => `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const paths = {
    search: `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/>`,
    mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/>`,
    pin: `<path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.5"/>`,
    filter: `<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2" fill="currentColor"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2" fill="currentColor"/>`,
    sort: `<line x1="6" y1="5" x2="6" y2="19"/><polyline points="3,8 6,5 9,8"/><line x1="18" y1="19" x2="18" y2="5"/><polyline points="15,16 18,19 21,16"/>`,
    list: `<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4.5" cy="6" r="1.4" fill="currentColor"/><circle cx="4.5" cy="12" r="1.4" fill="currentColor"/><circle cx="4.5" cy="18" r="1.4" fill="currentColor"/>`,
    map: `<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/>`,
    heart: `<path d="M12 21s-7.5-4.7-10-9.3C.4 8.2 2.2 4 6.2 4c2 0 3.5 1 5.8 3.4C14.3 5 15.8 4 17.8 4c4 0 5.8 4.2 4.2 7.7C19.5 16.3 12 21 12 21z"/>`,
    "heart-filled": `<path d="M12 21s-7.5-4.7-10-9.3C.4 8.2 2.2 4 6.2 4c2 0 3.5 1 5.8 3.4C14.3 5 15.8 4 17.8 4c4 0 5.8 4.2 4.2 7.7C19.5 16.3 12 21 12 21z" fill="currentColor"/>`,
    share: `<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.6" x2="15.7" y2="6.4"/><line x1="8.3" y1="13.4" x2="15.7" y2="17.6"/>`,
    route: `<path d="M4 20 20 4M20 4h-6M20 4v6"/>`,
    star: `<path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.9l6-.9Z"/>`,
    "chevron-down": `<polyline points="6,9 12,15 18,9"/>`,
    "chevron-right": `<polyline points="9,6 15,12 9,18"/>`,
    "chevron-left": `<polyline points="15,6 9,12 15,18"/>`,
    home: `<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>`,
    compass: `<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z"/>`,
    "plus-circle": `<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
    bookmark: `<path d="M7 3h10v18l-5-4-5 4Z"/>`,
    user: `<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>`,
    close: `<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`,
    check: `<polyline points="4,12 9,17 20,6"/>`,
    camera: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.6-2.5h4.8L16 7"/><circle cx="12" cy="13.5" r="3.4"/>`,
    "arrow-left": `<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10,6 4,12 10,18"/>`,
    bell: `<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>`,
    users: `<circle cx="9" cy="8" r="3.4"/><path d="M2.5 19c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15 13.6c2.6.4 4.7 2 4.7 5.4"/>`,
    sparkle: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.4 2.4M15.6 15.6 18 18M18 6l-2.4 2.4M8.4 15.6 6 18"/>`,
    kids: `<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"/><line x1="9" y1="9.5" x2="9" y2="10.5"/><line x1="15" y1="9.5" x2="15" y2="10.5"/>`,
    utensils: `<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M17 3c-1.5 0-2.5 2-2.5 5s1 5 2.5 5v8"/>`,
    briefcase: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
    wrench: `<path d="M14.7 6.3a4 4 0 0 0-5.4 5L4 16.6 7.4 20l5.3-5.3a4 4 0 0 0 5-5.4l-3 3-2-2Z"/>`,
    clock: `<circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15.5,14"/>`,
    wallet: `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.2" fill="currentColor"/>`,
    shield: `<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>`,
    sun: `<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>`,
    wifi: `<path d="M3 8.5a15 15 0 0 1 18 0"/><path d="M6.5 12.3a10 10 0 0 1 11 0"/><path d="M10 16a5 5 0 0 1 4 0"/><circle cx="12" cy="19.3" r="1" fill="currentColor"/>`,
    parking: `<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9.5 16V8h2.8a2.6 2.6 0 0 1 0 5.2H9.5"/>`,
    accessible: `<circle cx="12" cy="5" r="2"/><path d="M12 8v5l4 5M12 13H7l3-6"/>`,
    message: `<path d="M4 5h16v11H8l-4 4Z"/>`,
    target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>`,
    layers: `<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/>`,
    flag: `<line x1="5" y1="3" x2="5" y2="21"/><path d="M5 4h13l-3 4 3 4H5"/>`,
    settings: `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.8-1.6L13.3 2h-2.6l-.4 2.8a7 7 0 0 0-2.8 1.6l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5 0 1.1.2 1.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.8 1.6l.4 2.8h2.6l.4-2.8a7 7 0 0 0 2.8-1.6l2.3.9 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6Z"/>`,
    calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>`,
    "log-out": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
    info: `<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/>`,
  };
  return wrap(paths[name] || paths.info);
}

// ───────────────────────── Router ─────────────────────────
const NAV_ROUTES = ["#/accueil", "#/resultats", "#/contribuer", "#/enregistres", "#/compte"];

function go(route) { location.hash = route; }

function currentRoute() {
  const h = location.hash || "#/accueil";
  const parts = h.replace(/^#\//, "").split("/");
  return { name: parts[0] || "accueil", param: parts[1] || null };
}

function route() {
  const { name, param } = currentRoute();
  const app = document.getElementById("app");
  let html = "";
  switch (name) {
    case "accueil": html = renderAccueil(); break;
    case "resultats": html = renderResults(); break;
    case "autour-de-moi": html = renderAutourDeMoi(); break;
    case "lieu": html = renderPlaceDetail(param); break;
    case "contribuer": html = param ? renderContributeRate(param) : renderContributeSelect(); break;
    case "questions": html = renderQuestions(); break;
    case "sujet": html = renderTopic(param); break;
    case "pour-vous": html = renderPourVous(); break;
    case "enregistres": html = renderEnregistres(); break;
    case "compte": html = renderCompte(); break;
    case "info": html = renderInfoPage(param); break;
    case "admin-feedback": html = renderAdminFeedback(); break;
    default: html = renderAccueil();
  }
  app.innerHTML = html;
  window.scrollTo(0, 0);
  updateNav(name);
  updateFab(name);
  requestAnimationFrame(mountLeafletMapIfPresent);
}

function updateNav(name) {
  const map = { accueil: "#/accueil", resultats: "#/resultats", "autour-de-moi": "#/resultats", contribuer: "#/contribuer", enregistres: "#/enregistres", compte: "#/compte", info: "#/compte" };
  const active = map[name] || "";
  document.querySelectorAll("#bottomnav button, .desktop-nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === active);
  });
}
function updateFab(name) {
  const fab = document.getElementById("feedback-fab");
  fab.style.display = STATE.pilotMode ? "flex" : "none";
}

// ───────────────────────── Sheet / Toast ─────────────────────────
function openSheet(html, opts) {
  document.getElementById("sheet-inner").innerHTML = html;
  document.getElementById("overlay").classList.add("open");
  document.getElementById("sheet").classList.add("open");
  if (opts && opts.modal) {
    document.getElementById("overlay").classList.add("modal-center");
    document.getElementById("sheet").classList.add("as-modal");
  }
}
function closeSheet() {
  document.getElementById("overlay").classList.remove("open", "modal-center");
  document.getElementById("sheet").classList.remove("open", "as-modal");
}
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

// ───────────────────────── Filtrage / tri ─────────────────────────
function filteredPlaces() {
  const ctx = detectContext(STATE.query);
  let list = PLACES.slice();
  if (STATE.groupFilter && STATE.groupFilter.length) {
    list = list.filter((p) => STATE.groupFilter.includes(p.category));
  } else if (STATE.query.trim()) {
    if (ctx.category) {
      list = list.filter((p) => p.category === ctx.category);
    } else {
      const q = STATE.query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)));
    }
  }
  if (STATE.activeFilters.has("enfants")) list = list.filter((p) => p.tags.includes("enfants") || p.group === "enfants" || p.tags.some((t) => t.startsWith("enfants")));
  if (STATE.activeFilters.has("calme")) list = list.filter((p) => p.tags.includes("calme"));
  if (STATE.activeFilters.has("parking")) list = list.filter((p) => p.equipements.includes("Parking"));
  if (STATE.activeFilters.has("ouvert") && !STATE.removedChips.has("ouvert")) list = list.filter((p) => p.openNow);
  if (STATE.activeFilters.has("reseau")) list = list.filter((p) => p.network.length > 0);
  if (STATE.activeFilters.has("budget")) list = list.filter((p) => p.priceLevel <= 2);
  if (STATE.activeFilters.has("photos")) list = list.filter((p) => p.reviews.some((r) => r.photo));
  if (STATE.activeFilters.has("accessible")) list = list.filter((p) => p.equipements.includes("Accessible"));
  if (STATE.mapVisibleIds) list = list.filter((p) => STATE.mapVisibleIds.includes(p.id));

  if (STATE.sort === "proche") list.sort((a, b) => a.distanceMin - b.distanceMin);
  else if (STATE.sort === "note") list.sort((a, b) => b.rating - a.rating);
  else if (STATE.sort === "reseau") list.sort((a, b) => b.network.length - a.network.length);
  else list.sort((a, b) => (b.rating + b.network.length * 0.3) - (a.rating + a.network.length * 0.3));
  return list;
}

function detectedChips() {
  const ctx = detectContext(STATE.query);
  const chips = [];
  if (STATE.groupLabel) chips.push({ key: "groupe", label: STATE.groupLabel });
  if (STATE.mapVisibleIds) chips.push({ key: "zone-carte", label: "Zone visible sur la carte" });
  if (ctx.category) chips.push({ key: "categorie-" + ctx.category, label: CATEGORY_LABELS[ctx.category] });
  ["enfants", "calme", "parking", "budget"].forEach((k) => { if (STATE.activeFilters.has(k)) chips.push({ key: k, label: k === "enfants" ? "Enfants" : k === "calme" ? "Calme" : k === "parking" ? "Parking" : "Petit budget" }); });
  if (!STATE.removedChips.has("ouvert")) chips.push({ key: "ouvert", label: "Ouvert aujourd'hui" });
  return chips;
}

function computeRankTags(list) {
  const tags = {};
  if (list.length) tags[list[0].id] = "Meilleur choix";
  const nearest = [...list].sort((a, b) => a.distanceMin - b.distanceMin)[0];
  if (nearest && !tags[nearest.id]) tags[nearest.id] = "Le plus proche";
  const kids = list.find((p) => (p.group === "enfants") && !tags[p.id]);
  if (kids) tags[kids.id] = "Idéal avec enfants";
  const network = [...list].sort((a, b) => b.network.length - a.network.length)[0];
  if (network && network.network.length && !tags[network.id]) tags[network.id] = "Recommandé par votre réseau";
  const value = [...list].sort((a, b) => a.priceLevel - b.priceLevel)[0];
  if (value && !tags[value.id]) tags[value.id] = "Bon rapport qualité-prix";
  return tags;
}

// ───────────────────────── Composants ─────────────────────────
function avatarHtml(name, size) {
  const color = (NETWORK.find((n) => n.name === name) || { color: "#57534e" }).color;
  const initial = name.charAt(0).toUpperCase();
  return `<div class="avatar" style="background:${color};${size ? `width:${size}px;height:${size}px;font-size:${size * 0.4}px` : ""}">${initial}</div>`;
}

function confidenceBadge(level) {
  const labels = { elevee: "Confiance élevée", moyenne: "Confiance moyenne", faible: "Confiance limitée" };
  return `<span class="badge-confidence ${level}">${labels[level]}</span>`;
}

function placeCardFull(p, rankTag) {
  const saved = STATE.savedIds.has(p.id);
  const whyOpen = STATE.openWhy.has(p.id);
  return `
  <article class="pcard pcard-full">
    <div class="photo" data-action="goto" data-route="#/lieu/${p.id}">
      <img src="${p.image}" alt="Photo de ${esc(p.name)} (illustration)">
      <span class="rating-badge">${p.rating.toFixed(1)}</span>
      <button class="icon-btn save-fab ${saved ? "on" : ""}" data-action="toggle-save" data-id="${p.id}" aria-label="Enregistrer">
        ${icon(saved ? "heart-filled" : "heart", "icon-sm")}
      </button>
    </div>
    <div class="body">
      ${rankTag ? `<span class="rank-tag">${rankTag}</span><br>` : ""}
      <div class="name" data-action="goto" data-route="#/lieu/${p.id}">${esc(p.name)}</div>
      <div class="meta">${icon("pin", "icon-sm")} ${esc(p.zone)} · À ${p.distanceMin} min ${p.openNow ? "· Ouvert" : "· Fermé"}</div>
      <div class="reason">${esc(p.reasons[0])}</div>
      ${p.network.length ? `<div class="network-line">${icon("users", "icon-sm")} ${p.network.length} personne${p.network.length > 1 ? "s" : ""} de votre réseau ${p.network.length > 1 ? "l'ont" : "l'a"} testé${p.network.length > 1 ? "s" : ""}</div>` : ""}
      <div class="footer-row">
        ${confidenceBadge(p.confidence)}
        <button class="link-why" data-action="toggle-why" data-id="${p.id}">Pourquoi ce résultat ?</button>
      </div>
      ${whyOpen ? `<div class="why-box" style="margin-top:10px"><ul>${p.reasons.map((r) => `<li>${icon("check", "icon-sm")} ${esc(r)}</li>`).join("")}</ul></div>` : ""}
    </div>
  </article>`;
}

function placeCardMini(p) {
  const saved = STATE.savedIds.has(p.id);
  return `
  <article class="pcard">
    <div class="photo" data-action="goto" data-route="#/lieu/${p.id}">
      <img src="${p.image}" alt="Photo de ${esc(p.name)} (illustration)">
      <span class="rating-badge">${p.rating.toFixed(1)}</span>
      <button class="icon-btn save-fab ${saved ? "on" : ""}" data-action="toggle-save" data-id="${p.id}" aria-label="Enregistrer">
        ${icon(saved ? "heart-filled" : "heart", "icon-sm")}
      </button>
    </div>
    <div class="body">
      <div class="name" data-action="goto" data-route="#/lieu/${p.id}">${esc(p.name)}</div>
      <div class="meta">${esc(p.zone)} · ${p.distanceMin} min</div>
      <div class="reason">${esc(p.reasons[0])}</div>
    </div>
  </article>`;
}

function hscrollSection(label, ids, routeLink) {
  const items = ids.map((id) => byId(id)).filter(Boolean);
  if (!items.length) return "";
  return `
  <section class="section">
    <div class="section-head"><h2>${esc(label)}</h2>${routeLink ? `<a href="${routeLink}">Voir tout</a>` : ""}</div>
    <div class="hscroll">${items.map(placeCardMini).join("")}</div>
  </section>`;
}

// ───────────────────────── Vues ─────────────────────────
const SUGGESTIONS = [
  "Un parc avec toboggans pour des enfants de 3 et 5 ans",
  "Un bon pédiatre près de chez moi",
  "Un restaurant calme pour aller avec les enfants",
  "Où manger de bonnes sardines grillées ?",
  "Un coiffeur qui réussit les colorations",
  "Une salle de sport propre et pas trop grande",
];

function renderAccueil() {
  const profile = PROFILES.find((p) => p.id === STATE.profileId);
  return `
  <div class="view">
    <section class="search-hero">
      <h1>Que cherchez-vous aujourd'hui ?</h1>
      <form data-action="submit-search">
        <div class="search-box">
          ${icon("search")}
          <input type="text" name="q" placeholder="Décrivez votre besoin…" autocomplete="off" value="${esc(STATE.query)}">
          <button type="button" class="mic-btn icon-btn" data-action="mic-search" aria-label="Recherche vocale">${icon("mic", "icon-sm")}</button>
        </div>
      </form>
      <div class="search-row">
        <button class="btn btn-secondary" data-action="goto" data-route="#/autour-de-moi">${icon("target", "icon-sm")} Autour de moi</button>
        <button class="btn btn-secondary" data-action="goto" data-route="#/resultats">${icon("list", "icon-sm")} Voir tout</button>
      </div>
      <div class="chips-scroll">
        ${SUGGESTIONS.map((s) => `<button class="chip" data-action="suggestion" data-query="${esc(s)}">${esc(s.length > 40 ? s.slice(0, 40) + "…" : s)}</button>`).join("")}
      </div>
    </section>

    <div class="tiles">
      ${CATEGORY_GROUPS.map((g) => `
        <button class="tile" data-action="open-group" data-group="${g.id}">
          <span class="tile-ic">${icon(g.icon, "icon-lg")}</span>
          <span>${esc(g.label)}</span>
        </button>`).join("")}
    </div>

    ${(profile.forYou.slice(0, 4)).map((s) => hscrollSection(s.label, s.ids, "#/pour-vous")).join("")}

    <p class="fictif-tag">Contenu personnalisé selon le profil de démonstration « ${esc(profile.name)} » — <a href="#/pour-vous" data-action="goto" data-route="#/pour-vous" style="text-decoration:underline">changer de profil</a>. Données fictives.</p>
  </div>`;
}

function renderAutourDeMoi() {
  clearGroupFilter();
  STATE.sort = "proche";
  const list = filteredPlaces().slice(0, 12);
  const ranks = computeRankTags(list);
  return `
  <div class="view view-wide">
    <div class="results-head">
      <div class="results-query">
        ${icon("target", "icon-sm")} Autour de vous
        <button class="edit" data-action="goto" data-route="#/accueil">Nouvelle recherche</button>
      </div>
      <div class="chips-scroll" style="padding-top:12px">
        ${CATEGORY_GROUPS.filter((g) => g.id !== "decouvrir").map((g) => `<button class="chip" data-action="open-group" data-group="${g.id}">${esc(g.label)}</button>`).join("")}
      </div>
    </div>
    <div class="results-split">
      <div class="panel-map">${renderMapBlock(list)}</div>
      <div class="panel-list">
        <p class="count-pill" style="margin:12px 0">${list.length} lieux proches de vous, triés par distance</p>
        <div class="results-list">${list.map((p) => placeCardFull(p, ranks[p.id])).join("")}</div>
      </div>
    </div>
  </div>`;
}

function renderResults() {
  const list = filteredPlaces();
  const ranks = computeRankTags(list);
  const chips = detectedChips();
  return `
  <div class="view view-wide">
    <div class="results-head">
      <div class="results-query">
        ${icon("search", "icon-sm")}
        <span>${STATE.groupLabel ? esc(STATE.groupLabel) : STATE.query ? esc(STATE.query) : "Tous les lieux"}</span>
        <button class="edit" data-action="open-edit-query">Modifier</button>
      </div>
      ${chips.length ? `<div class="chips-scroll" style="padding-top:10px">
        ${chips.map((c) => `<button class="chip removable" data-action="remove-chip" data-key="${c.key}">${esc(c.label)} <span class="x">${icon("close", "icon-sm")}</span></button>`).join("")}
      </div>` : ""}
      <div class="results-toolbar">
        <span class="count-pill">${list.length} résultat${list.length > 1 ? "s" : ""}</span>
        <button class="btn btn-secondary btn-sm" data-action="open-filters">${icon("filter", "icon-sm")} Filtres</button>
        <button class="btn btn-secondary btn-sm" data-action="open-sort">${icon("sort", "icon-sm")} Trier</button>
        <div class="toggle-group">
          <button class="${STATE.viewMode === "liste" ? "active" : ""}" data-action="set-view-mode" data-mode="liste">${icon("list", "icon-sm")} Liste</button>
          <button class="${STATE.viewMode === "carte" ? "active" : ""}" data-action="set-view-mode" data-mode="carte">${icon("map", "icon-sm")} Carte</button>
        </div>
      </div>
    </div>
    <div class="results-split">
      <div class="panel-list ${STATE.viewMode !== "liste" ? "hidden" : ""}">
        ${list.length === 0 ? emptyState("search", "Aucun résultat", "Essayez d'élargir votre recherche ou retirez un filtre.") : `<div class="results-list">${list.map((p) => placeCardFull(p, ranks[p.id])).join("")}</div>`}
      </div>
      <div class="panel-map ${STATE.viewMode !== "carte" ? "hidden" : ""}">${renderMapBlock(list)}</div>
    </div>
  </div>`;
}

let leafletMap = null;
let leafletClusterGroup = null;
let mapMountList = [];

function renderMapBlock(list) {
  mapMountList = list;
  return `
  <div class="map-wrap">
    <div id="leaflet-map" role="img" aria-label="Carte de Casablanca avec les lieux correspondant à votre recherche"></div>
    <div class="map-live-badge" id="map-live-badge">Chargement de la carte…</div>
    <div class="map-controls">
      <button class="icon-btn filled" data-action="recenter-map" aria-label="Recentrer">${icon("target", "icon-sm")}</button>
      <button class="icon-btn" data-action="around-me-map" aria-label="Autour de moi">${icon("pin", "icon-sm")}</button>
    </div>
  </div>`;
}

// Monte (ou remonte) la vraie carte Leaflet / OpenStreetMap après insertion du HTML dans le DOM.
// Ignoré si le conteneur n'existe pas ou n'est pas visible (ex. panneau masqué sur mobile).
function mountLeafletMapIfPresent() {
  const el = document.getElementById("leaflet-map");
  if (leafletMap) { leafletMap.remove(); leafletMap = null; leafletClusterGroup = null; }
  if (!el || typeof L === "undefined") return;
  if (el.offsetWidth === 0 || el.offsetHeight === 0) return; // conteneur masqué (ex. mode Liste sur mobile)

  leafletMap = L.map(el, { attributionControl: true, zoomControl: false }).setView(USER_LATLNG, 12);
  L.control.zoom({ position: "bottomleft" }).addTo(leafletMap);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(leafletMap);

  L.marker(USER_LATLNG, {
    icon: L.divIcon({ className: "", html: '<div class="leaflet-user-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    interactive: false, zIndexOffset: 1000,
  }).addTo(leafletMap);

  leafletClusterGroup = L.markerClusterGroup({
    maxClusterRadius: 55,
    iconCreateFunction: (cluster) => L.divIcon({
      className: "rf-pin cluster",
      html: `<span class="bubble cluster">${cluster.getChildCount()}</span>`,
      iconSize: null, iconAnchor: [20, 36],
    }),
  });
  mapMountList.forEach((p) => {
    const marker = L.marker([p.lat, p.lng], {
      icon: L.divIcon({ className: "rf-pin", html: `<span class="bubble">${p.rating.toFixed(1)}</span>`, iconSize: null, iconAnchor: [20, 36] }),
    });
    marker.on("click", () => openPinSheet(p.id));
    leafletClusterGroup.addLayer(marker);
  });
  leafletMap.addLayer(leafletClusterGroup);

  if (mapMountList.length) {
    const bounds = L.latLngBounds(mapMountList.map((p) => [p.lat, p.lng])).extend(USER_LATLNG);
    leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }

  leafletMap.on("moveend zoomend", updateMapLiveBadge);
  updateMapLiveBadge();
}

function updateMapLiveBadge() {
  const badge = document.getElementById("map-live-badge");
  if (!leafletMap || !badge) return;
  const bounds = leafletMap.getBounds();
  const visible = mapMountList.filter((p) => bounds.contains([p.lat, p.lng]));
  STATE.mapVisibleIds = visible.map((p) => p.id);
  badge.innerHTML = `${visible.length} lieu${visible.length > 1 ? "x" : ""} dans cette zone <button data-action="view-zone-list">Voir en liste</button>`;
}

function emptyState(iconName, title, text) {
  return `<div class="empty-state">${icon(iconName, "icon-lg")}<h3 style="font-size:16px;font-weight:800;margin-bottom:6px">${esc(title)}</h3><p style="font-size:14px">${esc(text)}</p></div>`;
}

// ── Fiche lieu ──
function renderPlaceDetail(id) {
  const p = byId(id);
  if (!p) return emptyState("info", "Lieu introuvable", "Ce lieu de démonstration n'existe plus.");
  const saved = STATE.savedIds.has(p.id);
  const gi = STATE.galleryIndex[p.id] || 0;
  const openSection = STATE.accordionOpen[p.id] || "savoir";
  const critSet = CRITERIA_SETS[p.category];
  const expanded = STATE.expandedCriteria.has(p.id);
  const extra = expanded ? [["confort", "Confort général"], ["global", "Recommandation globale"]] : [];
  const allCrit = critSet.concat(extra.map(([k, l]) => [k, l]));

  const acc = (key, title, bodyHtml) => `
    <div class="accordion-item ${openSection === key ? "open" : ""}">
      <button class="acc-head" data-action="toggle-acc" data-id="${p.id}" data-section="${key}">
        ${esc(title)} ${icon("chevron-down", "icon-sm")}
      </button>
      <div class="acc-body">${bodyHtml}</div>
    </div>`;

  return `
  <div class="view">
    <div class="place-hero">
      <img src="${p.images[gi % p.images.length]}" alt="Photo de ${esc(p.name)} (illustration)" data-action="cycle-gallery" data-id="${p.id}">
      <button class="icon-btn back-btn" data-action="back" aria-label="Retour">${icon("arrow-left")}</button>
      <div class="actions-row">
        <button class="icon-btn ${saved ? "on" : ""}" data-action="toggle-save" data-id="${p.id}" aria-label="Enregistrer">${icon(saved ? "heart-filled" : "heart", "icon-sm")}</button>
        <button class="icon-btn" data-action="share" data-id="${p.id}" aria-label="Partager">${icon("share", "icon-sm")}</button>
      </div>
      <div class="gallery-dots">${p.images.map((_, i) => `<span class="${i === gi % p.images.length ? "on" : ""}"></span>`).join("")}</div>
    </div>

    <div class="place-title">
      <h1>${esc(p.name)}</h1>
      <div class="cat-line">${CATEGORY_LABELS[p.category]} · ${esc(p.zone)} · À ${p.distanceMin} min</div>
      <div class="place-rating-row">
        <div class="rating-big">${p.rating.toFixed(1)}<small>/10</small></div>
        <div>${confidenceBadge(p.confidence)}<div style="font-size:12.5px;color:var(--ink-2);margin-top:3px">${p.reviewsCount} expériences récentes</div></div>
      </div>
    </div>

    <div class="action-row">
      <button class="btn btn-secondary" data-action="toggle-save" data-id="${p.id}">${icon(saved ? "heart-filled" : "heart", "icon-sm")} ${saved ? "Enregistré" : "Enregistrer"}</button>
      <button class="btn btn-secondary" data-action="share" data-id="${p.id}">${icon("share", "icon-sm")} Partager</button>
      <button class="btn btn-secondary" data-action="itinerary" data-id="${p.id}">${icon("route", "icon-sm")} Itinéraire</button>
      <button class="btn btn-primary" data-action="goto" data-route="#/contribuer/${p.id}">${icon("plus-circle", "icon-sm")} Contribuer</button>
    </div>

    <div class="why-box">
      <h3>Pourquoi cet endroit correspond à votre recherche</h3>
      <ul>${p.reasons.slice(0, 3).map((r) => `<li>${icon("check", "icon-sm")} ${esc(r)}</li>`).join("")}</ul>
    </div>

    <div class="quick-facts">
      <div class="quick-fact">${icon("wallet")}<div class="val">${esc(p.priceLabel || "€".repeat(p.priceLevel))}</div><div class="lab">Budget</div></div>
      <div class="quick-fact">${icon("clock")}<div class="val">${esc(p.horaires)}</div><div class="lab">Horaires</div></div>
      <div class="quick-fact">${icon("users")}<div class="val">${esc(p.affluence)}</div><div class="lab">Affluence</div></div>
      <div class="quick-fact">${icon("pin")}<div class="val">${p.distanceMin} min</div><div class="lab">Distance</div></div>
    </div>

    <div class="accordion">
      ${acc("photos", "Photos", `<div class="eq-chips">${p.images.map((img) => `<img src="${img}" style="width:100%;max-width:140px;height:90px;object-fit:cover;border-radius:12px" alt="Photo de ${esc(p.name)}">`).join("")}</div>`)}
      ${acc("savoir", "Ce qu'il faut savoir", `<p style="font-size:14px;color:var(--ink-2);line-height:1.5">${esc(p.description || "Adresse évaluée par la communauté RECOFIABLE (données fictives de démonstration).")}</p><div class="eq-chips">${p.tags.map((t) => `<span class="chip">${esc(t.replace(/-/g, " "))}</span>`).join("")}</div>`)}
      ${acc("criteres", "Notes par critère", `
        ${allCrit.map(([key, label]) => `<div class="crit-row"><span class="lab">${esc(label)}</span><div class="bar"><span style="width:${((p.criteriaScores[key] ?? (p.rating)) / 10) * 100}%"></span></div><span class="val">${(p.criteriaScores[key] ?? p.rating).toFixed(1)}</span></div>`).join("")}
        ${!expanded ? `<button class="link-why" data-action="expand-criteria" data-id="${p.id}">Voir tous les critères</button>` : ""}
        ${p.category === "pediatre" ? `<p style="font-size:12.5px;color:var(--ink-3);margin-top:10px">Ces critères portent uniquement sur l'accueil et l'organisation, jamais sur l'efficacité médicale.</p>` : ""}
      `)}
      ${acc("experiences", `Expériences (${p.reviews.length})`, `
        ${p.reviews.map(renderReview).join("")}
        <button class="link-why" data-action="show-all-reviews">Voir toutes les expériences</button>
      `)}
      ${acc("reseau", "Votre réseau", p.network.length ? `
        <div class="network-avatars">${p.network.map((n) => avatarHtml(n.name, 34)).join("")}</div>
        <div class="network-people">${p.network.map((n, i) => `<div class="row">${avatarHtml(n.name, 28)} <span><b>${esc(n.name)}</b> ${["recommande", "y va régulièrement", "l'a visité récemment"][i % 3]}</span></div>`).join("")}</div>
      ` : `<p style="font-size:14px;color:var(--ink-2)">Personne de votre réseau n'a encore testé ce lieu.</p>`)}
      ${acc("pratique", "Informations pratiques", `
        <div class="practical-grid">
          <div><div class="lab">Horaires</div><div class="val">${esc(p.horaires)}</div></div>
          <div><div class="lab">Budget</div><div class="val">${esc(p.priceLabel || "Non précisé")}</div></div>
          <div><div class="lab">Affluence</div><div class="val">${esc(p.affluence)}</div></div>
          <div><div class="lab">Distance</div><div class="val">${p.distanceMin} min</div></div>
        </div>
        <div class="eq-chips">${(p.equipements.length ? p.equipements : ["Aucune information"]).map((e) => `<span class="chip">${esc(e)}</span>`).join("")}</div>
      `)}
    </div>
  </div>`;
}

function renderReview(r) {
  return `
  <div class="review-item">
    <div class="review-top">
      ${avatarHtml(r.author, 34)}
      <div>
        <div class="review-name">${esc(r.author)} ${r.networkRelation ? `<span class="tag-network">${esc(r.networkRelation)}</span>` : ""}</div>
        <div class="review-meta">${esc(r.date)} · ${esc(r.context)} · ${r.rating.toFixed(1)}/10</div>
      </div>
    </div>
    <p class="review-comment">${esc(r.comment)}</p>
    ${r.photo ? `<div class="eq-chips"><span class="chip">${icon("camera", "icon-sm")} Photo jointe</span></div>` : ""}
    <div class="review-foot"><span>${icon("check", "icon-sm")} Utile (${r.helpful})</span></div>
  </div>`;
}

// ── Contribution ──
function renderContributeSelect() {
  const q = STATE.contribSearch.toLowerCase();
  const list = PLACES.filter((p) => !q || p.name.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q)).sort((a, b) => a.distanceMin - b.distanceMin).slice(0, 10);
  return `
  <div class="view">
    <h1 style="font-size:20px;font-weight:800;padding-top:14px">Quel endroit avez-vous testé ?</h1>
    <form data-action="submit-contrib-search" style="margin-top:12px">
      <div class="search-box">
        ${icon("search")}
        <input type="text" name="q" placeholder="Nom du lieu…" autocomplete="off" value="${esc(STATE.contribSearch)}">
      </div>
    </form>
    <div class="search-row">
      <button class="btn btn-secondary btn-block" data-action="around-me-contrib">${icon("target", "icon-sm")} Autour de moi</button>
    </div>
    <div class="pick-list">
      ${list.map((p) => `
        <button class="pick-item" data-action="select-contrib-place" data-id="${p.id}">
          <img src="${p.image}" alt="">
          <div class="info"><div class="name">${esc(p.name)}</div><div class="meta">${esc(p.zone)} · ${p.distanceMin} min</div></div>
          ${icon("chevron-right", "icon-sm")}
        </button>`).join("")}
      ${list.length === 0 ? `<p style="text-align:center;color:var(--ink-3);font-size:13.5px;margin-top:10px">Je ne trouve pas ce lieu. <button class="link-why" data-action="propose-place">Proposer ce lieu</button></p>` : ""}
    </div>
  </div>`;
}

const RATE_LABELS = [["mauvais", "Mauvais"], ["correct", "Correct"], ["tresbien", "Très bien"]];

function renderContributeRate(id) {
  const p = byId(id);
  if (!p) return emptyState("info", "Lieu introuvable", "");
  if (STATE.contribution.placeId !== id) {
    STATE.contribution = { placeId: id, ratings: {}, recommend: null, comment: "", detailedOpen: false, photoAdded: false, detail: {} };
  }
  const c = STATE.contribution;
  const critSet = CRITERIA_SETS[p.category];
  return `
  <div class="view">
    <div class="step-dots"><span class="on"></span><span class="${c.recommend ? "on" : ""}"></span></div>
    <h1 style="font-size:19px;font-weight:800">Votre expérience chez ${esc(p.name)}</h1>
    <p style="font-size:13px;color:var(--ink-2);margin-top:4px">Notation express — moins de 30 secondes</p>

    <div class="rate-grid">
      ${critSet.map(([key, label]) => `
        <div class="rate-card">
          <div class="crit-name">${esc(label)}</div>
          <div class="rate-opts">
            ${RATE_LABELS.map(([val, lab]) => `<button class="rate-opt ${c.ratings[key] === val ? "selected " + (val === "mauvais" ? "bad" : val === "correct" ? "mid" : "") : ""}" data-action="rate" data-crit="${key}" data-value="${val}" title="${lab}">${val === "mauvais" ? "–" : val === "correct" ? "•" : "✓"}</button>`).join("")}
          </div>
        </div>`).join("")}
    </div>

    <p style="font-size:13px;font-weight:700;color:var(--ink-2);margin-top:18px">Recommanderiez-vous cet endroit ?</p>
    <div class="recommend-row">
      <button class="opt ${c.recommend === "oui" ? "selected oui" : ""}" data-action="recommend" data-value="oui">Oui</button>
      <button class="opt ${c.recommend === "reserve" ? "selected reserve" : ""}" data-action="recommend" data-value="reserve">Avec réserve</button>
      <button class="opt ${c.recommend === "non" ? "selected non" : ""}" data-action="recommend" data-value="non">Non</button>
    </div>

    <div class="field" style="margin-top:18px">
      <label>Une remarque utile ? (facultatif)</label>
      <textarea rows="3" data-bind="contribution.comment" placeholder="Ex. : très bon accueil, un peu bruyant le week-end…">${esc(c.comment)}</textarea>
    </div>
    <button class="photo-add" style="width:100%;margin-top:10px;border:none;background:var(--bg)" data-action="add-photo-sim">
      ${icon("camera")} ${c.photoAdded ? "1 photo ajoutée ✓" : "Ajouter une photo (facultatif)"}
    </button>

    <div class="detail-link"><button data-action="toggle-detailed">${c.detailedOpen ? "Masquer les détails" : "Ajouter plus de détails"}</button></div>
    ${c.detailedOpen ? renderDetailedFields(c) : ""}

    <button class="btn btn-primary btn-block" style="margin-top:22px" data-action="publish-review" data-id="${p.id}">Publier</button>
  </div>`;
}

function renderDetailedFields(c) {
  return `
  <div class="detail-fields">
    <div class="field"><label>Contexte de la visite</label>
      <select data-bind="contribution.detail.contexte">
        ${["Seul(e)", "En famille", "Entre amis", "En couple"].map((o) => `<option ${c.detail.contexte === o ? "selected" : ""}>${o}</option>`).join("")}
      </select>
    </div>
    <div class="field"><label>Budget approximatif (MAD)</label><input type="text" data-bind="contribution.detail.budget" value="${esc(c.detail.budget || "")}" placeholder="Ex. 120"></div>
    <div class="field"><label>Temps d'attente</label>
      <select data-bind="contribution.detail.attente">
        ${["Moins de 10 min", "10 à 20 min", "20 à 40 min", "Plus de 40 min"].map((o) => `<option ${c.detail.attente === o ? "selected" : ""}>${o}</option>`).join("")}
      </select>
    </div>
    <div class="field"><label>Tranche d'âge concernée (si enfants)</label><input type="text" data-bind="contribution.detail.age" value="${esc(c.detail.age || "")}" placeholder="Ex. 3-5 ans"></div>
    <div class="field"><label>Conseil pour les prochains visiteurs</label><textarea rows="2" data-bind="contribution.detail.conseil" placeholder="Ex. : venir tôt le week-end">${esc(c.detail.conseil || "")}</textarea></div>
  </div>`;
}

// ── Questions ──
function renderQuestions() {
  const profile = PROFILES.find((p) => p.id === STATE.profileId);
  const relevant = QUESTIONS.filter((q) => profile.interests.includes(q.category) || q.zone === profile.zone);
  const others = QUESTIONS.filter((q) => !relevant.includes(q));
  const list = relevant.concat(others).slice(0, 8);
  return `
  <div class="view">
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:14px">
      <h1 style="font-size:20px;font-weight:800">Questions près de vous</h1>
      <button class="btn btn-secondary btn-sm" data-action="ask-question">${icon("plus-circle", "icon-sm")} Poser</button>
    </div>
    <p style="font-size:13px;color:var(--ink-2);margin-top:4px">Personnalisées selon votre profil « ${esc(profile.name)} »</p>
    <div style="margin-top:14px">
      ${list.map((q) => `
        <div class="qcard">
          <button style="width:100%;text-align:left;background:none;border:none" data-action="toggle-question" data-id="${q.id}">
            <div class="title">${esc(q.title)}</div>
            <div class="meta"><span>${esc(q.zone)}</span><span>${esc(q.date)}</span><span class="answers-pill">${q.answers} réponse${q.answers > 1 ? "s" : ""}</span></div>
          </button>
          ${STATE.openQuestion === q.id ? renderAnswersFor(q) : ""}
        </div>`).join("")}
    </div>
    ${hscrollSection("Sujets vivants près de vous", TOPICS.map((t) => t.placeIds[0]), null).replace("Voir tout", "")}
    <div style="margin-top:6px">
      ${TOPICS.slice(0, 3).map((t) => `<button class="chip" style="margin:4px 6px 0 0" data-action="goto" data-route="#/sujet/${t.id}">${esc(t.title)}</button>`).join("")}
    </div>
  </div>`;
}

function renderAnswersFor(q) {
  const authors = pickN(["Sara", "Omar", "Kenza", "Hamza", "Yassine"], 2);
  const related = PLACES.filter((p) => p.category === q.category || p.zone === q.zone).slice(0, 1)[0];
  return `
  <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">
    ${authors.map((a, i) => `
      <div style="display:flex;gap:8px;margin-bottom:10px">
        ${avatarHtml(a, 28)}
        <div style="font-size:13.5px"><b>${esc(a)}</b> — ${i === 0 && related ? `Je recommande <a href="#/lieu/${related.id}" data-action="goto" data-route="#/lieu/${related.id}" style="color:var(--brand);font-weight:700">${esc(related.name)}</a>, testé récemment.` : "Bonne question, je cherche aussi une adresse fiable pour ça."}</div>
      </div>`).join("")}
  </div>`;
}

// ── Sujet vivant ──
function renderTopic(id) {
  const t = TOPICS.find((x) => x.id === id);
  if (!t) return emptyState("info", "Sujet introuvable", "");
  const stale = t.freshness.includes("confirmer");
  const places = t.placeIds.map(byId).filter(Boolean);
  const questions = QUESTIONS.filter((q) => t.questionIds.includes(q.id));
  const recentReviews = places.flatMap((p) => p.reviews.map((r) => ({ ...r, place: p.name }))).slice(0, 3);
  return `
  <div class="view">
    <button class="icon-btn" data-action="back" style="margin-top:12px">${icon("arrow-left")}</button>
    <div class="topic-head" style="margin-top:10px">
      <h1>${esc(t.title)}</h1>
      <p style="font-size:13px;color:var(--ink-2);margin-top:4px">${esc(t.zone)} · ${esc(t.updated)}</p>
      <span class="freshness ${stale ? "stale" : ""}">${icon(stale ? "info" : "check", "icon-sm")} ${esc(t.freshness)}</span>
    </div>

    <div class="section">
      <div class="section-head"><h2>Meilleurs résultats</h2></div>
      <div class="hscroll">${places.map(placeCardMini).join("")}</div>
    </div>

    <div class="section">
      <div class="section-head"><h2>Nouvelles questions</h2></div>
      ${questions.map((q) => `<div class="qcard"><div class="title">${esc(q.title)}</div><div class="meta"><span>${esc(q.date)}</span><span class="answers-pill">${q.answers} réponses</span></div></div>`).join("") || `<p style="color:var(--ink-2);font-size:13.5px">Aucune question pour le moment.</p>`}
    </div>

    <div class="section">
      <div class="section-head"><h2>Dernières expériences</h2></div>
      ${recentReviews.map((r) => `<div class="review-item"><div class="review-top">${avatarHtml(r.author, 32)}<div><div class="review-name">${esc(r.author)}</div><div class="review-meta">${esc(r.place)} · ${esc(r.date)}</div></div></div><p class="review-comment">${esc(r.comment)}</p></div>`).join("")}
    </div>

    <div class="section">
      <div class="section-head"><h2>Personnes du réseau qui suivent ce sujet</h2></div>
      <div class="network-people">${t.network.map((n) => `<div class="row">${avatarHtml(n, 28)}<span><b>${esc(n)}</b> suit ce sujet</span></div>`).join("")}</div>
    </div>
  </div>`;
}

// ── Pour vous ──
function renderPourVous() {
  const profile = PROFILES.find((p) => p.id === STATE.profileId);
  return `
  <div class="view">
    <h1 style="font-size:20px;font-weight:800;padding-top:14px">Pour vous</h1>
    <p style="font-size:13px;color:var(--ink-2);margin-top:4px">Le contenu change selon le profil de démonstration sélectionné.</p>
    <div class="profile-switch">
      ${PROFILES.map((p) => `
        <button class="profile-pill ${p.id === STATE.profileId ? "active" : ""}" data-action="switch-profile" data-id="${p.id}">
          ${avatarHtml(p.name)} <span>${esc(p.name)}</span>
        </button>`).join("")}
    </div>
    <p style="font-size:13px;color:var(--ink-2);margin-top:10px">${esc(profile.role)} · ${esc(profile.zone)}</p>
    ${profile.forYou.map((s) => hscrollSection(s.label, s.ids, null)).join("")}
  </div>`;
}

// ── Enregistrés ──
const COLLECTIONS_LIST = ["Tous", "À tester", "Sorties avec les enfants", "Professionnels", "Restaurants", "Près de chez moi"];

function renderEnregistres() {
  const ids = [...STATE.savedIds];
  const items = ids.map(byId).filter(Boolean).filter((p) => STATE.activeCollection === "Tous" || (STATE.collections[p.id] || "À tester") === STATE.activeCollection);
  return `
  <div class="view">
    <h1 style="font-size:20px;font-weight:800;padding-top:14px">Enregistrés</h1>
    <div class="collections-row">
      ${COLLECTIONS_LIST.map((c) => `<button class="chip ${STATE.activeCollection === c ? "active" : ""}" data-action="set-active-collection" data-name="${esc(c)}">${esc(c)}</button>`).join("")}
    </div>
    ${items.length === 0 ? emptyState("bookmark", "Rien d'enregistré ici", "Enregistrez des lieux depuis la recherche pour les retrouver ici.") : `
    <div class="grid-cards">
      ${items.map((p) => `
        <div>
          ${placeCardMini(p)}
          <button class="btn btn-secondary btn-sm btn-block" style="margin-top:6px" data-action="change-collection" data-id="${p.id}">${icon("bookmark", "icon-sm")} ${esc(STATE.collections[p.id] || "À tester")}</button>
        </div>`).join("")}
    </div>`}
  </div>`;
}

// ── Compte ──
function renderCompte() {
  const profile = PROFILES.find((p) => p.id === STATE.profileId);
  return `
  <div class="view">
    <div class="account-header">
      ${avatarHtml(profile.name, 56)}
      <div><div class="name">${esc(profile.name)}</div><div class="role">${esc(profile.role)} · ${esc(profile.zone)}</div></div>
    </div>

    <div class="account-list">
      <button data-action="edit-profile">${icon("user")} Profil<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="edit-preferences">${icon("sparkle")} Préférences<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="edit-location">${icon("pin")} Localisation<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/compte/reseau" onclick="return false">${icon("users")} Réseau (${NETWORK.length})<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="show-contributions">${icon("check")} Mes contributions<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="show-notifications">${icon("bell")} Notifications<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="toggle-pilot">${icon("settings")} Mode pilote<span class="chev" style="font-weight:800;color:${STATE.pilotMode ? "var(--brand)" : "var(--ink-3)"}">${STATE.pilotMode ? "Activé" : "Désactivé"}</span></button>
    </div>

    ${STATE.pilotMode ? `<div class="account-list" style="margin-top:14px"><button data-action="goto" data-route="#/admin-feedback">${icon("flag")} Mini-administration des retours<span class="chev">${icon("chevron-right", "icon-sm")}</span></button></div>` : ""}

    <p class="section-label">Informations</p>
    <div class="account-list">
      <button data-action="goto" data-route="#/info/fonctionnement">${icon("info")} Fonctionnement<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/info/confiance">${icon("shield")} Confiance et notation<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/info/confidentialite">${icon("shield")} Confidentialité<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/info/professionnels">${icon("briefcase")} Professionnels<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/info/contact">${icon("message")} Contact<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
      <button data-action="goto" data-route="#/info/conditions">${icon("info")} Conditions<span class="chev">${icon("chevron-right", "icon-sm")}</span></button>
    </div>

    <div class="account-list" style="margin-top:14px">
      <button data-action="logout">${icon("log-out")} Se déconnecter</button>
    </div>
  </div>`;
}

const INFO_CONTENT = {
  fonctionnement: { title: "Comment ça marche", body: ["Vous décrivez votre besoin en une phrase, RECOFIABLE comprend la catégorie, la zone et vos critères.", "Chaque résultat affiche une note publique, un niveau de confiance et une explication courte.", "Contribuer prend moins de 30 secondes grâce à la notation express."] },
  confiance: { title: "Confiance et notation", body: ["La note publique est identique pour tous les utilisateurs.", "Votre réseau personnalise l'ordre des résultats, jamais la note elle-même.", "Les contributions suspectes sont détectées et écartées du calcul."] },
  confidentialite: { title: "Confidentialité", body: ["Vos données de localisation restent facultatives et ne sont jamais affichées publiquement.", "Vous pouvez exporter ou supprimer vos données à tout moment depuis votre compte."] },
  professionnels: { title: "Professionnels", body: ["Les professionnels peuvent revendiquer leur fiche et répondre aux avis.", "Aucun abonnement ne permet de modifier une note ou de supprimer un avis légitime."] },
  contact: { title: "Contact", body: ["Support (démonstration) : support@recofiable.demo", "Cette maquette ne transmet aucun message réel."] },
  conditions: { title: "Conditions", body: ["Document de démonstration, sans valeur contractuelle.", "Toutes les données affichées dans cette maquette sont fictives."] },
};
function renderInfoPage(key) {
  const info = INFO_CONTENT[key] || INFO_CONTENT.fonctionnement;
  return `
  <div class="view">
    <button class="icon-btn" data-action="back" style="margin-top:12px">${icon("arrow-left")}</button>
    <h1 style="font-size:20px;font-weight:800;margin-top:14px">${esc(info.title)}</h1>
    ${info.body.map((p) => `<p style="font-size:14.5px;color:var(--ink-2);line-height:1.5;margin-top:12px">${esc(p)}</p>`).join("")}
  </div>`;
}

// ── Mini-admin feedback ──
function renderAdminFeedback() {
  return `
  <div class="view">
    <button class="icon-btn" data-action="back" style="margin-top:12px">${icon("arrow-left")}</button>
    <h1 style="font-size:20px;font-weight:800;margin-top:14px">Retours pilotes</h1>
    <p style="font-size:13px;color:var(--ink-2)">Vue d'administration simulée — visible en mode pilote.</p>
    <div style="margin-top:16px">
      ${STATE.feedbacks.map((f) => `
        <div class="fb-item">
          <span class="type ${f.type}">${f.type === "blocage" ? "Blocage" : "Amélioration"}</span>
          <div class="text">${esc(f.text)}</div>
          <div class="date">${esc(f.date)}</div>
        </div>`).join("")}
      ${STATE.feedbacks.length === 0 ? emptyState("flag", "Aucun retour", "Les remarques envoyées apparaîtront ici.") : ""}
    </div>
  </div>`;
}

// ───────────────────────── Sheets contextuels ─────────────────────────
function openFiltersSheet() {
  const ctx = detectContext(STATE.query);
  const contextual = ctx.category === "parc" || ctx.category === "activite-enfant"
    ? [["age35", "3-5 ans"], ["toboggans", "Toboggans"], ["jeuxeau", "Jeux d'eau"], ["securite", "Sécurité"], ["toilettes", "Toilettes"], ["ombrage", "Espace ombragé"]]
    : ctx.category === "pediatre"
    ? [["disponibilite", "Disponibilité"], ["ouvertajd", "Ouvert aujourd'hui"], ["rdv", "Prise de rendez-vous"], ["tarifs", "Tarifs indiqués"]]
    : [];
  const html = `
    <div class="sheet-handle"></div>
    <div class="sheet-inner">
      <div class="sheet-head"><h3>Filtres</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
      <div class="filter-group"><h4>Général</h4>
        <div class="filter-grid">
          ${[["proche", "Distance"], ["ouvert", "Ouvert maintenant"], ["budget", "Prix"], ["enfants", "Adapté aux enfants"], ["parking", "Parking"], ["accessible", "Accessible"], ["calme", "Calme"], ["photos", "Avec photos"], ["reseau", "Recommandé par mon réseau"]]
            .map(([k, l]) => `<button class="filter-btn ${STATE.activeFilters.has(k) ? "selected" : ""}" data-action="toggle-filter" data-key="${k}">${esc(l)}</button>`).join("")}
        </div>
      </div>
      ${contextual.length ? `<div class="filter-group"><h4>Spécifique à votre recherche</h4><div class="filter-grid">${contextual.map(([k, l]) => `<button class="filter-btn ${STATE.activeFilters.has(k) ? "selected" : ""}" data-action="toggle-filter" data-key="${k}">${esc(l)}</button>`).join("")}</div></div>` : ""}
      <div class="sheet-actions">
        <button class="btn btn-secondary" data-action="reset-filters">Réinitialiser</button>
        <button class="btn btn-primary" data-action="apply-filters">Appliquer</button>
      </div>
    </div>`;
  openSheet(html);
}

function openSortSheet() {
  const opts = [["pertinence", "Pertinence"], ["proche", "Le plus proche"], ["note", "Meilleure note"], ["reseau", "Recommandé par mon réseau"]];
  const html = `
    <div class="sheet-handle"></div>
    <div class="sheet-inner">
      <div class="sheet-head"><h3>Trier par</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
      <div class="filter-grid">${opts.map(([k, l]) => `<button class="filter-btn ${STATE.sort === k ? "selected" : ""}" data-action="set-sort" data-key="${k}">${esc(l)}</button>`).join("")}</div>
    </div>`;
  openSheet(html);
}

function openEditQuerySheet() {
  const html = `
    <div class="sheet-handle"></div>
    <div class="sheet-inner">
      <div class="sheet-head"><h3>Modifier la recherche</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
      <form data-action="submit-edit-query">
        <div class="search-box"><input type="text" name="q" value="${esc(STATE.query)}" autofocus></div>
        <button class="btn btn-primary btn-block" style="margin-top:14px" type="submit">Rechercher</button>
      </form>
    </div>`;
  openSheet(html);
}

function openPinSheet(id) {
  const p = byId(id);
  const html = `
    <div class="sheet-handle"></div>
    <div class="sheet-inner">
      <img src="${p.image}" style="width:100%;height:150px;object-fit:cover;border-radius:14px" alt="">
      <h3 style="margin-top:12px">${esc(p.name)}</h3>
      <div class="place-rating-row" style="margin-top:8px"><div class="rating-big">${p.rating.toFixed(1)}</div><div style="font-size:13px;color:var(--ink-2)">${esc(p.zone)} · ${p.distanceMin} min<br>${esc(p.reasons[0])}</div></div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" data-action="goto" data-route="#/lieu/${p.id}">Voir la fiche</button>
    </div>`;
  openSheet(html);
}

function openGroupSheet(groupId) {
  if (groupId === "decouvrir") { go("#/autour-de-moi"); return; }
  const group = CATEGORY_GROUPS.find((g) => g.id === groupId);
  STATE.query = "";
  STATE.groupFilter = group.cats;
  STATE.groupLabel = group.label;
  STATE.activeFilters.clear();
  STATE.removedChips.clear();
  STATE.viewMode = "liste";
  go("#/resultats");
}

function clearGroupFilter() { STATE.groupFilter = null; STATE.groupLabel = null; STATE.mapVisibleIds = null; }

function openAskQuestionSheet() {
  const html = `
  <div class="sheet-handle"></div>
  <div class="sheet-inner">
    <div class="sheet-head"><h3>Poser une question</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
    <form data-action="submit-question">
      <div class="field"><label>Votre question</label><input type="text" name="title" placeholder="Ex. : Quel parc pour un enfant de 4 ans ?" required></div>
      <div class="field" style="margin-top:10px"><label>Zone</label>
        <select name="zone">${ZONES.map((z) => `<option>${z}</option>`).join("")}</select>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" type="submit">Publier</button>
    </form>
  </div>`;
  openSheet(html);
}

function openFeedbackSheet() {
  const html = `
  <div class="sheet-handle"></div>
  <div class="sheet-inner">
    <div class="sheet-head"><h3>Une remarque ?</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
    <div class="filter-grid">
      <button class="filter-btn ${STATE.feedbackType === "blocage" ? "selected" : ""}" data-action="set-feedback-type" data-key="blocage">Blocage</button>
      <button class="filter-btn ${STATE.feedbackType === "amelioration" ? "selected" : ""}" data-action="set-feedback-type" data-key="amelioration">Amélioration</button>
    </div>
    <div class="field" style="margin-top:14px"><label>Votre remarque</label><textarea rows="3" id="feedback-text" placeholder="Décrivez ce que vous avez remarqué…"></textarea></div>
    <button class="btn btn-secondary btn-block" style="margin-top:10px" data-action="add-photo-sim">${icon("camera", "icon-sm")} Ajouter une capture</button>
    <button class="btn btn-primary btn-block" style="margin-top:14px" data-action="submit-feedback">Envoyer</button>
  </div>`;
  openSheet(html);
}

function openSimpleSheet(title, message) {
  openSheet(`
    <div class="sheet-handle"></div>
    <div class="sheet-inner">
      <div class="sheet-head"><h3>${esc(title)}</h3><button class="icon-btn" data-action="close-sheet">${icon("close", "icon-sm")}</button></div>
      <p style="font-size:14px;color:var(--ink-2);line-height:1.5">${esc(message)}</p>
      <button class="btn btn-primary btn-block" style="margin-top:16px" data-action="close-sheet">Compris</button>
    </div>`);
}

// ───────────────────────── Gestion des événements (délégation) ─────────────────────────
function setByPath(obj, path, value) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) {
    if (e.target.id === "overlay") closeSheet();
    return;
  }
  const action = el.dataset.action;
  const id = el.dataset.id;

  switch (action) {
    case "goto": go(el.dataset.route); break;
    case "back": history.length > 1 ? history.back() : go("#/accueil"); break;
    case "suggestion": clearGroupFilter(); STATE.query = el.dataset.query; go("#/resultats"); break;
    case "mic-search": {
      const s = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
      showToast("Recherche vocale simulée");
      clearGroupFilter(); STATE.query = s; go("#/resultats");
      break;
    }
    case "open-group": openGroupSheet(el.dataset.group); break;
    case "toggle-save": {
      if (STATE.savedIds.has(id)) { STATE.savedIds.delete(id); showToast("Retiré des enregistrés"); }
      else { STATE.savedIds.add(id); if (!STATE.collections[id]) STATE.collections[id] = "À tester"; showToast("Enregistré ✓"); }
      persist(); route();
      break;
    }
    case "share": showToast("Lien copié (simulation)"); break;
    case "itinerary": showToast("Itinéraire simulé ouvert"); break;
    case "toggle-why": STATE.openWhy.has(id) ? STATE.openWhy.delete(id) : STATE.openWhy.add(id); route(); break;
    case "open-filters": openFiltersSheet(); break;
    case "open-sort": openSortSheet(); break;
    case "open-edit-query": openEditQuerySheet(); break;
    case "close-sheet": closeSheet(); break;
    case "toggle-filter": {
      const k = el.dataset.key;
      STATE.activeFilters.has(k) ? STATE.activeFilters.delete(k) : STATE.activeFilters.add(k);
      el.classList.toggle("selected");
      break;
    }
    case "reset-filters": STATE.activeFilters.clear(); STATE.removedChips.clear(); STATE.mapVisibleIds = null; closeSheet(); route(); break;
    case "apply-filters": STATE.mapVisibleIds = null; closeSheet(); route(); break;
    case "set-sort": STATE.sort = el.dataset.key; closeSheet(); route(); break;
    case "set-view-mode": STATE.viewMode = el.dataset.mode; STATE.mapVisibleIds = null; route(); break;
    case "remove-chip": {
      const k = el.dataset.key;
      if (k === "groupe") clearGroupFilter();
      else if (k === "zone-carte") STATE.mapVisibleIds = null;
      else if (k.startsWith("categorie-")) STATE.query = "";
      else if (k === "ouvert") STATE.removedChips.add("ouvert");
      else STATE.activeFilters.delete(k);
      route();
      break;
    }
    case "recenter-map": if (leafletMap) leafletMap.setView(USER_LATLNG, 12); break;
    case "around-me-map": {
      showToast("Localisation simulée : centré sur votre position");
      if (leafletMap) leafletMap.setView(USER_LATLNG, 13);
      break;
    }
    case "view-zone-list": STATE.viewMode = "liste"; route(); break;
    case "show-pin": openPinSheet(id); break;
    case "cycle-gallery": {
      STATE.galleryIndex[id] = ((STATE.galleryIndex[id] || 0) + 1);
      route();
      break;
    }
    case "toggle-acc": {
      const sec = el.dataset.section;
      STATE.accordionOpen[id] = STATE.accordionOpen[id] === sec ? null : sec;
      route();
      break;
    }
    case "expand-criteria": STATE.expandedCriteria.add(id); route(); break;
    case "show-all-reviews": showToast("Toutes les expériences disponibles sont déjà affichées."); break;
    case "submit-contrib-search": break;
    case "around-me-contrib": STATE.contribSearch = ""; route(); showToast("Lieux triés par proximité"); break;
    case "select-contrib-place": go("#/contribuer/" + id); break;
    case "propose-place": showToast("Ajout de lieu simulé dans cette maquette."); break;
    case "rate": {
      STATE.contribution.ratings[el.dataset.crit] = el.dataset.value;
      route();
      break;
    }
    case "recommend": STATE.contribution.recommend = el.dataset.value; route(); break;
    case "add-photo-sim": {
      STATE.contribution.photoAdded = true;
      showToast("Photo ajoutée (simulation)");
      if (document.getElementById("sheet").classList.contains("open")) closeSheet();
      else route();
      break;
    }
    case "toggle-detailed": STATE.contribution.detailedOpen = !STATE.contribution.detailedOpen; route(); break;
    case "publish-review": {
      const c = STATE.contribution;
      const hasRating = Object.keys(c.ratings).length > 0;
      if (!hasRating) { showToast("Notez au moins un critère avant de publier."); return; }
      const p = byId(c.placeId);
      const val = { mauvais: 4, correct: 7, tresbien: 9.5 };
      const scores = Object.values(c.ratings).map((v) => val[v]);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      p.reviews.unshift({
        author: "Vous", networkRelation: null, date: "à l'instant",
        context: c.detail.contexte || "Non précisé", rating: Math.round(avg * 10) / 10,
        comment: c.comment || "Expérience partagée sans commentaire.", photo: c.photoAdded, helpful: 0,
      });
      p.reviewsCount += 1;
      showToast("Merci, votre expérience a été publiée ! (simulation)");
      go("#/lieu/" + p.id);
      break;
    }
    case "toggle-question": STATE.openQuestion = STATE.openQuestion === id ? null : id; route(); break;
    case "ask-question": openAskQuestionSheet(); break;
    case "switch-profile": STATE.profileId = el.dataset.id; persist(); route(); break;
    case "set-active-collection": STATE.activeCollection = el.dataset.name; route(); break;
    case "change-collection": {
      const opts = COLLECTIONS_LIST.slice(1);
      const current = STATE.collections[id] || "À tester";
      const next = opts[(opts.indexOf(current) + 1) % opts.length];
      STATE.collections[id] = next;
      persist(); route();
      break;
    }
    case "edit-profile": openSimpleSheet("Profil", "La modification du profil est simulée dans cette maquette : aucune donnée réelle n'est enregistrée."); break;
    case "edit-preferences": openSimpleSheet("Préférences", "Vos centres d'intérêt sont déjà personnalisés via le profil de démonstration (section « Pour vous »)."); break;
    case "edit-location": openSimpleSheet("Localisation", "Localisation simulée : Casablanca. Aucune position réelle n'est utilisée dans cette maquette."); break;
    case "show-contributions": openSimpleSheet("Mes contributions", "Vos expériences publiées pendant cette session apparaissent directement sur les fiches concernées."); break;
    case "show-notifications": openSimpleSheet("Notifications", "Aucune notification réelle dans cette maquette de démonstration."); break;
    case "toggle-pilot": STATE.pilotMode = !STATE.pilotMode; persist(); route(); break;
    case "logout": showToast("Déconnexion simulée."); break;
    case "submit-question": break;
    case "submit-feedback": {
      const text = document.getElementById("feedback-text").value.trim();
      if (!text) { showToast("Ajoutez une remarque avant d'envoyer."); return; }
      STATE.feedbacks.unshift({ id: "f" + Date.now(), type: STATE.feedbackType, text, date: "à l'instant" });
      persist(); closeSheet();
      showToast("Merci, votre remarque a été envoyée.");
      break;
    }
    case "set-feedback-type": STATE.feedbackType = el.dataset.key; openFeedbackSheet(); break;
    case "open-feedback": openFeedbackSheet(); break;
    default: break;
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-action]");
  if (!form) return;
  e.preventDefault();
  const action = form.dataset.action;
  const fd = new FormData(form);
  if (action === "submit-search") { clearGroupFilter(); STATE.query = fd.get("q") || ""; go("#/resultats"); }
  else if (action === "submit-edit-query") { clearGroupFilter(); STATE.query = fd.get("q") || ""; closeSheet(); route(); }
  else if (action === "submit-contrib-search") { STATE.contribSearch = fd.get("q") || ""; route(); }
  else if (action === "submit-question") {
    const title = fd.get("title"); const zone = fd.get("zone");
    QUESTIONS.unshift({ id: "q" + Date.now(), title, zone, category: detectContext(title).category || "restaurant", date: "à l'instant", answers: 0, tags: [] });
    closeSheet(); showToast("Question publiée (simulation)."); route();
  }
});

document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-bind]");
  if (!el) return;
  setByPath(STATE, el.dataset.bind, el.value);
});

// ───────────────────────── Boot ─────────────────────────
window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/accueil";
  route();
});
