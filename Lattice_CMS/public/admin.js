// Lattice admin UI. Talks only to server.mjs; knows nothing about the website's code.
// The whole editor is driven by SECTIONS below: add a field there (and to the site's content
// file + server validation) to make it editable.

/* ============ tiny helpers ============ */

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "value") el.value = value;
    else el.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

const ICONS = {
  up: '<path d="M2 7.5 6 3.5l4 4" />',
  down: '<path d="M2 4.5 6 8.5l4-4" />',
  x: '<path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />',
  plus: '<path d="M6 1.5v9M1.5 6h9" />',
  chev: '<path d="M3.5 1.5 8 6l-4.5 4.5" />',
  menu: '<path d="M1 3.5h10M1 8.5h10" />',
};
function icon(name) {
  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  return wrap.firstChild;
}

// The exact Lattice mark used on the website (components/LatticeMark.tsx).
function logo() {
  const wrap = document.createElement("span");
  wrap.style.display = "contents";
  wrap.innerHTML =
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="20" r="9" fill="currentColor" fill-opacity="0.28"/><circle cx="18.5" cy="13.5" r="9" stroke="currentColor" stroke-width="4.2"/></svg>';
  return wrap.firstChild;
}

// Same round sun/moon switch as the website, with the same circular reveal (View Transitions API).
function themeToggle() {
  const btn = h("button", { class: "theme-toggle", type: "button" });
  btn.innerHTML =
    '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
    '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  const label = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = dark ? "Light mode" : "Dark mode";
  };
  label();
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("lattice-admin-theme", next); } catch {}
    const commit = () => { document.documentElement.dataset.theme = next; label(); };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) return commit();
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(commit);
    transition.ready
      .then(() => document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
      ))
      .catch(() => {});
  });
  return btn;
}

const $app = document.getElementById("app");
const clone = (v) => JSON.parse(JSON.stringify(v));
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (ms) => new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function toast(message, kind = "ok") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = h("div", { class: "toast-wrap", role: "status", "aria-live": "polite" });
    document.body.append(wrap);
  }
  const el = h("div", { class: `toast ${kind === "error" ? "error" : ""}`, text: message });
  wrap.append(el);
  setTimeout(() => el.remove(), kind === "error" ? 7000 : 3200);
}

function confirmDialog({ title, text, confirm = "Confirm", danger = false }) {
  return new Promise((resolve) => {
    const previous = document.activeElement;
    const done = (value) => {
      back.remove();
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
      resolve(value);
    };
    const onKey = (e) => e.key === "Escape" && done(false);
    const ok = h("button", { class: `btn ${danger ? "danger" : "primary"}`, type: "button", text: confirm, onclick: () => done(true) });
    const back = h(
      "div",
      { class: "modal-back", onclick: (e) => e.target === back && done(false) },
      h(
        "div",
        { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": title },
        h("h3", { text: title }),
        h("p", { text }),
        h("div", { class: "btns" }, h("button", { class: "btn", type: "button", text: "Cancel", onclick: () => done(false) }), ok)
      )
    );
    document.addEventListener("keydown", onKey);
    document.body.append(back);
    ok.focus();
  });
}

/* ============ api ============ */

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function api(path, { method = "GET", json, body, headers = {} } = {}) {
  const init = { method, credentials: "same-origin", headers: { "x-lattice-admin": "1", ...headers } };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
    init.headers["content-type"] = "application/json";
  } else if (body !== undefined) init.body = body;
  let res;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Can't reach the admin server. Is it still running?", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/api/login") showLogin("Your session ended. Please sign in again.");
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.errors);
  }
  return data;
}

/* ============ schema ============ */

const text = (key, label, extra = {}) => ({ type: "text", key, label, ...extra });
const area = (key, label, extra = {}) => ({ type: "textarea", key, label, rows: 3, ...extra });

const SECTIONS = [
  {
    id: "seo",
    title: "Site & SEO",
    lede: "How the site appears in browser tabs, Google results and link previews when shared.",
    path: "seo",
    fields: [
      text("title", "Browser tab & search title", { help: "Shown in the browser tab and as the headline in Google and link previews." }),
      area("description", "Search & sharing description", { help: "One or two sentences. Search engines show roughly the first 155 characters." }),
      { type: "row", fields: [text("siteName", "Site name"), text("siteUrl", "Site address", { help: "The full public address, e.g. https://lattice.studio", inputType: "url" })] },
    ],
  },
  {
    id: "nav",
    title: "Navigation",
    lede: "The menu at the top of every page.",
    path: "nav",
    fields: [
      {
        type: "objects", key: "links", label: "Menu links", inline: true, noun: "link",
        help: "The target is where the link goes: use #work, #about, #founder or #contact to scroll to a section, or a full web address.",
        of: [text("label", "Label"), text("href", "Target")],
        blank: () => ({ label: "", href: "#" }),
      },
      text("cta", "Header button text", { help: "The outlined button on the right of the header (and in the mobile menu). It scrolls to Contact." }),
    ],
  },
  {
    id: "hero",
    title: "Hero",
    lede: "The first screen visitors see.",
    path: "hero",
    fields: [
      text("eyebrow", "Small label above the headline"),
      { type: "strings", key: "headline", label: "Headline", help: "Each line animates in on its own, so keep lines short. Add or remove lines as you like.", min: 1 },
      area("intro", "Intro paragraph", { rows: 4 }),
      { type: "row", fields: [text("scrollLabel", "Bottom-left label"), text("tagline", "Bottom-centre tagline", { help: "Hidden on small phones." })] },
    ],
  },
  {
    id: "about",
    title: "About & Services",
    lede: "The manifesto, the scrolling banner and the list of services.",
    path: "about",
    fields: [
      text("label", "Section label"),
      area("manifesto", "Manifesto", { rows: 6, help: "The big statement that lights up word by word as visitors scroll." }),
      area("marquee", "Scrolling banner text", { rows: 2, help: "A single sentence that scrolls across the page in a loop." }),
      {
        type: "objects", key: "services", label: "Services", noun: "service", numbered: true,
        help: "Numbered automatically in this order.",
        itemTitle: (s) => s.title,
        of: [text("title", "Service name"), area("body", "Description")],
        blank: () => ({ title: "", body: "" }),
      },
    ],
  },
  {
    id: "work",
    title: "Selected Work",
    lede: "Your case studies. Each one appears as a card on the page and opens a full write-up.",
    path: "work",
    fields: [
      { type: "row", fields: [text("label", "Section label"), text("readMore", "Card hover button text")] },
      {
        type: "objects", key: "projects", label: "Projects", noun: "project", numbered: true, collapsible: true,
        help: "Numbered automatically in this order. The first project appears at the top of the page.",
        itemTitle: (p) => p.title,
        of: [
          { type: "row", fields: [text("title", "Project title"), text("client", "Client")] },
          { type: "row", fields: [text("domain", "Website address shown on the card", { help: "Display only, e.g. auralis.audio" }), text("year", "Year")] },
          area("summary", "Short summary", { help: "Shown under the card on the main page." }),
          { type: "strings", key: "tags", label: "Tags", help: "Small pills such as “3D Visualisation”." },
          area("challenge", "The challenge", { rows: 5 }),
          area("approach", "Our approach", { rows: 5 }),
          area("result", "The result", { rows: 4 }),
          { type: "colors3", key: "colors", label: "Card colours", help: "The three colours that paint the project's preview image." },
        ],
        blank: () => ({ id: "", title: "", client: "", domain: "", year: String(new Date().getFullYear()), tags: [], summary: "", challenge: "", approach: "", result: "", colors: ["#2b2f6b", "#7c8cff", "#0b0b0c"] }),
      },
    ],
  },
  {
    id: "founder",
    title: "Team",
    lede: "The founder, any co-founders and the rest of the team.",
    path: "founder",
    fields: [
      text("label", "Section label"),
      { type: "row", fields: [text("principleLabel", "Quote label", { help: "Shown above a founder's guiding-principle quote." }), text("cta", "Button text")] },
      {
        type: "objects", key: "members", label: "People", noun: "person", numbered: true, collapsible: true,
        help: "Founders and co-founders get the big profile shown near the top of the section; everyone else appears as a tile in the team grid below. Drag order here controls display order within each group.",
        itemTitle: (m) => m.name,
        of: [
          { type: "row", fields: [text("name", "Name"), text("role", "Role / title")] },
          {
            type: "row",
            fields: [
              { type: "select", key: "tier", label: "Profile size", options: [["founder", "Founder / co-founder (big profile)"], ["member", "Team member (tile)"]] },
              { type: "select", key: "status", label: "Status", options: [["active", "Active"], ["upcoming", "Upcoming (joining soon)"]] },
            ],
          },
          { type: "toggle", key: "isEnabled", label: "Visible on the site" },
          { type: "image", key: "photo", label: "Photo", help: "Portrait works best. Without a photo the site shows a monogram of the initials below." },
          text("initials", "Monogram initials", { help: "Shown when there is no photo. Two letters look best.", maxlength: 4 }),
          { type: "textlist", key: "bio", label: "Bio paragraphs", help: "One box per paragraph. Shown in full on a founder's big profile, and as a short summary on a team tile." },
          area("principle", "Guiding principle (quote)", { rows: 3, help: "Founders / co-founders only — shown as a pull-quote on the big profile." }),
          { type: "strings", key: "focus", label: "Areas of focus", help: "Small pills under the bio (founders / co-founders only)." },
          {
            type: "objects", key: "socialLinks", label: "Social links", inline: true, noun: "link",
            help: "Any platform: LinkedIn, Instagram, X, GitHub, a personal website, etc. Use full addresses such as https://instagram.com/yourname.",
            of: [text("platform", "Platform"), text("url", "URL")],
            blank: () => ({ platform: "", url: "https://" }),
          },
        ],
        blank: () => ({
          id: "", tier: "member", status: "active", isEnabled: true,
          name: "", role: "", initials: "", photo: null,
          bio: [], principle: "", focus: [], socialLinks: [],
        }),
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    lede: "The closing call to action.",
    path: "contact",
    fields: [
      text("label", "Section label"),
      text("eyebrow", "Small line above the heading"),
      area("heading", "Heading", { rows: 3 }),
      text("email", "Contact email", { inputType: "email", help: "The big email link. Clicking it opens the visitor's mail app." }),
      text("phone", "Contact phone number", { inputType: "tel", help: "Optional. Shown under the email as a tap-to-call link. Leave blank to hide it." }),
    ],
  },
  {
    id: "footer",
    title: "Footer & Social",
    lede: "The bottom of every page.",
    path: "footer",
    fields: [
      { type: "row", fields: [text("copyright", "Copyright text", { help: "The year is added automatically in front." }), text("backToTop", "Back-to-top button text")] },
      {
        type: "objects", key: "socials", label: "Social links", inline: true, noun: "link",
        help: "Use full addresses such as https://instagram.com/yourname. A “#” means the link goes nowhere yet.",
        of: [text("label", "Name"), text("href", "Address")],
        blank: () => ({ label: "", href: "https://" }),
      },
    ],
  },
];

/* ============ state ============ */

const state = {
  content: null,
  saved: "",
  mlContent: null,
  savedMl: "",
  lang: "en", // "en" | "ml"
  modified: 0,
  siteUrl: "",
  errors: [],
  saving: false,
};
const OPEN = new WeakSet(); // card objects that are expanded (survives reordering)
let shell = null;

const isDirty = () => {
  if (state.lang === "ml") {
    return state.mlContent && JSON.stringify(state.mlContent) !== state.savedMl;
  }
  return state.content && JSON.stringify(state.content) !== state.saved;
};

function touched() {
  updateStatus();
}

function updateStatus() {
  if (!shell) return;
  const dirty = isDirty();
  shell.status.classList.toggle("dirty", dirty);
  shell.status.querySelector(".txt").textContent = dirty ? "Unsaved changes" : "All changes saved";
  shell.save.disabled = !dirty || state.saving;
  shell.discard.disabled = !dirty || state.saving;
}

function checkMlCompleteness() {
  if (!state.mlContent) return false;
  const c = state.mlContent;
  if (!c.seo?.title || !c.hero?.intro || !c.about?.manifesto || !c.contact?.heading) return false;
  return true;
}

function checkSectionCompleteness(sectionPath) {
  const root = state.lang === "ml" ? state.mlContent : state.content;
  if (!root) return false;
  const target = sectionPath.split(".").reduce((o, k) => (o ? o[k] : undefined), root);
  if (!target) return false;
  if (typeof target === "object") {
    for (const val of Object.values(target)) {
      if (typeof val === "string" && val.trim() === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
    }
  }
  return true;
}

function switchLanguage(lang) {
  if (state.lang === lang) return;
  state.lang = lang;
  render();
  updateStatus();
}

function makeLangSwitch() {
  const wrap = h("div", { class: "lang-segmented", "aria-label": "Content language" });
  const enBtn = h("button", {
    class: `lang-btn ${state.lang === "en" ? "active" : ""}`,
    type: "button",
    onclick: () => switchLanguage("en"),
  }, "EN", h("span", { class: "badge-dot ok", title: "Complete" }));

  const isMlComplete = checkMlCompleteness();
  const mlBtn = h("button", {
    class: `lang-btn ${state.lang === "ml" ? "active" : ""}`,
    type: "button",
    onclick: () => switchLanguage("ml"),
  }, "മലയാളം", h("span", { class: `badge-dot ${isMlComplete ? "ok" : "warn"}`, title: isMlComplete ? "Complete" : "Incomplete" }));

  wrap.append(enBtn, mlBtn);
  return wrap;
}

window.addEventListener("beforeunload", (e) => {
  if (isDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============ field renderers ============ */

function fit(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function makeInput(field, obj, key, { placeholder, enRef } = {}) {
  const isArea = field.type === "textarea";
  const el = isArea
    ? h("textarea", { rows: field.rows || 3, placeholder })
    : h("input", { type: field.inputType || "text", maxlength: field.maxlength, placeholder, autocomplete: "off", spellcheck: field.inputType ? "false" : "true" });
  el.value = obj[key] ?? "";
  el.addEventListener("input", () => {
    obj[key] = el.value;
    if (isArea) fit(el);
    touched();
  });
  if (isArea) requestAnimationFrame(() => fit(el));

  if (state.lang === "ml" && enRef && typeof enRef === "string" && enRef.trim()) {
    const wrap = h("div", { style: "display:flex;flex-direction:column;width:100%" });
    const refBox = h("div", { class: "field-en-ref" },
      h("strong", { text: "EN:" }),
      h("span", { class: "val", text: enRef }),
      h("button", {
        class: "icon-btn",
        type: "button",
        title: "Copy English text",
        style: "width:20px;height:20px;margin-left:auto",
        onclick: (e) => {
          e.preventDefault();
          el.value = enRef;
          obj[key] = enRef;
          if (isArea) fit(el);
          touched();
        }
      }, icon("plus"))
    );
    wrap.append(el, refBox);
    return wrap;
  }

  return el;
}

let uid = 0;
function labelled(label, control, help) {
  const id = `f${++uid}`;
  control.id = id;
  return h("div", { class: "field" }, label && h("label", { for: id, text: label }), control, help && h("p", { class: "help", text: help }));
}

function swap(arr, i, j) {
  if (j < 0 || j >= arr.length) return false;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return true;
}

function renderFields(fields, obj, enObj = {}) {
  const frag = document.createDocumentFragment();
  for (const field of fields) frag.append(renderField(field, obj, enObj));
  return frag;
}

function renderField(field, obj, enObj = {}) {
  switch (field.type) {
    case "row":
      return h("div", { class: "row-2" }, ...field.fields.map((f) => renderField(f, obj, enObj)));
    case "text":
    case "textarea": {
      const enVal = enObj ? enObj[field.key] : undefined;
      return labelled(field.label, makeInput(field, obj, field.key, { enRef: enVal }), field.help);
    }
    case "strings":
    case "textlist":
      return renderStrings(field, obj);
    case "objects":
      return renderObjects(field, obj);
    case "image":
      return renderImage(field, obj);
    case "colors3":
      return renderColors(field, obj);
    case "select":
      return renderSelect(field, obj);
    case "toggle":
      return renderToggle(field, obj);
    default:
      throw new Error(`Unknown field type ${field.type}`);
  }
}

function renderSelect(field, obj) {
  const select = h("select", {}, ...field.options.map(([value, label]) => h("option", { value, text: label })));
  select.value = obj[field.key] ?? field.options[0]?.[0];
  select.addEventListener("change", () => { obj[field.key] = select.value; touched(); });
  return labelled(field.label, select, field.help);
}

function renderToggle(field, obj) {
  const input = h("input", { type: "checkbox" });
  input.checked = obj[field.key] !== false;
  input.addEventListener("change", () => { obj[field.key] = input.checked; touched(); });
  const id = `f${++uid}`;
  input.id = id;
  return h("div", { class: "field toggle-field" },
    h("label", { for: id, class: "toggle-label" }, input, h("span", { text: field.label })),
    field.help && h("p", { class: "help", text: field.help }));
}

function renderStrings(field, obj) {
  const multiline = field.type === "textlist";
  const list = h("div", { class: "list" });
  const wrap = h("div", { class: "field" }, h("span", { class: "label", text: field.label }), list, field.help && h("p", { class: "help", text: field.help }));
  const arr = () => obj[field.key];

  function rebuild() {
    list.replaceChildren();
    arr().forEach((_, i) => {
      const input = makeInput({ type: multiline ? "textarea" : "text", rows: 3 }, arr(), i, { placeholder: multiline ? "Write a paragraph…" : "Type here…" });
      input.setAttribute("aria-label", `${field.label} ${i + 1}`);
      const remove = h("button", { class: "icon-btn", type: "button", "aria-label": `Remove ${field.label} ${i + 1}`, disabled: field.min && arr().length <= field.min, onclick: () => { arr().splice(i, 1); touched(); rebuild(); } }, icon("x"));
      list.append(
        h("div", { class: "list-row" }, input,
          h("div", { class: "actions" },
            h("button", { class: "icon-btn", type: "button", "aria-label": "Move up", disabled: i === 0, onclick: () => { swap(arr(), i, i - 1); touched(); rebuild(); } }, icon("up")),
            h("button", { class: "icon-btn", type: "button", "aria-label": "Move down", disabled: i === arr().length - 1, onclick: () => { swap(arr(), i, i + 1); touched(); rebuild(); } }, icon("down")),
            remove))
      );
    });
    if (!arr().length) list.append(h("div", { class: "empty", text: "Nothing here yet." }));
  }
  rebuild();
  wrap.append(h("button", { class: "btn small add", type: "button", onclick: () => { arr().push(""); touched(); rebuild(); list.querySelector(".list-row:last-child input, .list-row:last-child textarea")?.focus(); } }, icon("plus"), multiline ? "Add paragraph" : "Add"));
  return wrap;
}

function renderObjects(field, obj) {
  const list = h("div", { class: field.inline ? "list" : "cards" });
  const wrap = h("div", { class: "field" }, h("span", { class: "label", text: field.label }), list, field.help && h("p", { class: "help", text: field.help }));
  const arr = () => obj[field.key];

  const move = (i, d) => { if (swap(arr(), i, i + d)) { touched(); rebuild(); } };
  const remove = async (i) => {
    const item = arr()[i];
    const name = field.itemTitle?.(item) || item.label || `this ${field.noun}`;
    if (field.collapsible || field.itemTitle) {
      const ok = await confirmDialog({ title: `Remove ${field.noun}?`, text: `“${name}” will be removed from the site when you save. You can restore an earlier version from Backups.`, confirm: "Remove", danger: true });
      if (!ok) return;
    }
    arr().splice(i, 1);
    touched();
    rebuild();
  };
  const actions = (i) =>
    h("span", { class: "actions", style: "display:flex;gap:4px", onclick: (e) => e.stopPropagation() },
      h("button", { class: "icon-btn", type: "button", "aria-label": `Move ${field.noun} up`, disabled: i === 0, onclick: () => move(i, -1) }, icon("up")),
      h("button", { class: "icon-btn", type: "button", "aria-label": `Move ${field.noun} down`, disabled: i === arr().length - 1, onclick: () => move(i, 1) }, icon("down")),
      h("button", { class: "icon-btn", type: "button", "aria-label": `Remove ${field.noun}`, onclick: () => remove(i) }, icon("x")));

  function rebuild() {
    list.replaceChildren();
    arr().forEach((item, i) => {
      if (field.inline) {
        const inputs = field.of.map((f) => { const el = makeInput(f, item, f.key, { placeholder: f.label }); el.setAttribute("aria-label", `${field.noun} ${i + 1} ${f.label}`); return el; });
        list.append(h("div", { class: "list-row" }, ...inputs, actions(i)));
        return;
      }
      const title = field.itemTitle?.(item);
      const nameEl = h("span", { class: `name ${title ? "" : "empty"}`, text: title || `Untitled ${field.noun}` });
      const head = [field.numbered && h("span", { class: "num", text: pad(i + 1) }), nameEl, actions(i)];
      const body = h("div", { class: "card-body" }, renderFields(field.of, item));
      body.addEventListener("input", () => {
        const t = field.itemTitle?.(item);
        nameEl.textContent = t || `Untitled ${field.noun}`;
        nameEl.classList.toggle("empty", !t);
      });
      if (field.collapsible) {
        const card = h("details", { class: "card" }, h("summary", {}, ...head, h("span", { style: "display:contents" }, chev())), body);
        card.open = OPEN.has(item);
        card.addEventListener("toggle", () => (card.open ? OPEN.add(item) : OPEN.delete(item)));
        list.append(card);
      } else {
        list.append(h("div", { class: "card" }, h("div", { class: "card-head", style: "cursor:default" }, ...head), body));
      }
    });
    if (!arr().length) list.append(h("div", { class: "empty", text: `No ${field.noun}s yet.` }));
  }
  const chev = () => { const s = icon("chev"); s.classList.add("chev"); return s; };
  rebuild();
  wrap.append(h("button", { class: "btn small add", type: "button", onclick: () => { const item = field.blank(); arr().push(item); OPEN.add(item); touched(); rebuild(); list.lastElementChild?.querySelector("input")?.focus(); } }, icon("plus"), `Add ${field.noun}`));
  return wrap;
}

function mediaUrl(value) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value; // Supabase Storage public URLs
  return null; // legacy local paths and other addresses aren't previewed
}

function renderImage(field, obj) {
  const thumb = h("div", { class: "thumb" });
  const pathInput = h("input", { type: "text", placeholder: "/uploads/portrait.jpg or https://…", autocomplete: "off", spellcheck: "false", "aria-label": `${field.label} path` });
  const file = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif,image/avif", hidden: true });
  const removeBtn = h("button", { class: "btn small", type: "button", text: "Remove" });

  function paint() {
    const value = obj[field.key];
    pathInput.value = value || "";
    removeBtn.disabled = !value;
    thumb.replaceChildren();
    const url = mediaUrl(value);
    if (url) thumb.append(h("img", { src: url, alt: "", onerror: (e) => e.target.replaceWith(h("span", { text: "?" })) }));
    else thumb.append(h("span", { text: value ? "↗" : "—" }));
  }
  function set(value) { obj[field.key] = value || null; touched(); paint(); }

  pathInput.addEventListener("input", () => { obj[field.key] = pathInput.value.trim() || null; touched(); });
  pathInput.addEventListener("change", paint);
  removeBtn.addEventListener("click", () => set(null));
  file.addEventListener("change", async () => {
    if (!file.files[0]) return;
    try { set((await uploadFile(file.files[0])).url); toast("Image uploaded"); } catch (e) { toast(e.message, "error"); }
    file.value = "";
  });

  paint();
  return h("div", { class: "field" }, h("span", { class: "label", text: field.label }),
    h("div", { class: "image-field" }, thumb,
      h("div", { class: "controls" }, pathInput,
        h("div", { class: "btns" },
          h("button", { class: "btn small", type: "button", text: "Upload image", onclick: () => file.click() }),
          h("button", { class: "btn small", type: "button", text: "Choose from library", onclick: async () => { const url = await pickMedia(); if (url) set(url); } }),
          removeBtn, file))),
    field.help && h("p", { class: "help", text: field.help }));
}

function renderColors(field, obj) {
  const names = ["Base", "Glow", "Edge"];
  const preview = h("div", { class: "gradient", role: "img", "aria-label": "Colour preview" });
  const HEX = /^#[0-9a-fA-F]{6}$/;
  // Same recipe the website uses to paint a project's preview card.
  const paint = () => {
    const c = obj[field.key];
    preview.style.backgroundImage = `radial-gradient(circle at 30% 20%, ${c[1]}, transparent 55%), radial-gradient(circle at 75% 75%, ${c[0]}, transparent 60%), linear-gradient(140deg, ${c[2]}, ${c[0]})`;
  };
  const pickers = obj[field.key].map((value, i) => {
    const color = h("input", { type: "color", value: HEX.test(value) ? value : "#000000", "aria-label": `${names[i]} colour` });
    const hex = h("input", { type: "text", value, maxlength: 7, spellcheck: "false", "aria-label": `${names[i]} colour hex` });
    color.addEventListener("input", () => { obj[field.key][i] = color.value; hex.value = color.value; paint(); touched(); });
    hex.addEventListener("input", () => { if (HEX.test(hex.value)) { obj[field.key][i] = hex.value; color.value = hex.value; paint(); touched(); } });
    return h("div", { class: "color" }, color, hex, h("span", { class: "mono", text: names[i] }));
  });
  paint();
  return h("div", { class: "field" }, h("span", { class: "label", text: field.label }), h("div", { class: "colors" }, ...pickers, preview), field.help && h("p", { class: "help", text: field.help }));
}

/* ============ media ============ */

async function uploadFile(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be under 8 MB.");
  return api("/api/upload", { method: "POST", body: file, headers: { "x-filename": encodeURIComponent(file.name), "content-type": "application/octet-stream" } });
}

function pickMedia() {
  return new Promise(async (resolve) => {
    const previous = document.activeElement;
    const done = (v) => { back.remove(); document.removeEventListener("keydown", onKey); previous?.focus?.(); resolve(v); };
    const onKey = (e) => e.key === "Escape" && done(null);
    const grid = h("div", { class: "media-grid" });
    const back = h("div", { class: "modal-back", onclick: (e) => e.target === back && done(null) },
      h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Choose an image", style: "max-width:640px" },
        h("h3", { text: "Image library" }), grid,
        h("div", { class: "btns", style: "margin-top:16px" }, h("button", { class: "btn", type: "button", text: "Close", onclick: () => done(null) }))));
    document.addEventListener("keydown", onKey);
    document.body.append(back);
    try {
      const { media } = await api("/api/media");
      if (!media.length) grid.replaceWith(h("div", { class: "empty", text: "No images uploaded yet." }));
      for (const m of media) {
        grid.append(h("button", { class: "media-item", type: "button", style: "padding:0;text-align:left", onclick: () => done(m.url) },
          h("div", { class: "pic", style: `background-image:url('${m.url}')` }), h("div", { class: "meta" }, h("span", { text: m.name }))));
      }
    } catch (e) { toast(e.message, "error"); done(null); }
  });
}

/* ============ pages ============ */

function pageForm(section) {
  const isMl = state.lang === "ml";
  const activeRoot = isMl ? (state.mlContent || {}) : state.content;
  const enRoot = state.content || {};

  const target = section.path.split(".").reduce((o, k) => {
    if (!o[k]) o[k] = {};
    return o[k];
  }, activeRoot);

  const enTarget = section.path.split(".").reduce((o, k) => (o ? o[k] : undefined), enRoot) || {};

  const isComplete = checkSectionCompleteness(section.path);

  const banner = h("div", { class: "lang-banner" },
    h("div", { class: "indicator" },
      h("span", { text: `Language: ${isMl ? "മലയാളം (Malayalam Content)" : "English (Default Content)"}` }),
      h("span", {
        class: `completeness-badge ${isComplete ? "complete" : "incomplete"}`,
        text: isComplete ? "✓ Complete" : "⚠ Incomplete"
      })
    ),
    h("div", { style: "display:flex;gap:8px;align-items:center" },
      h("span", { class: "mono", style: "font-size:11px", text: "Switch language:" }),
      h("button", {
        class: `btn small ${!isMl ? "primary" : ""}`,
        type: "button",
        text: "EN",
        onclick: () => switchLanguage("en")
      }),
      h("button", {
        class: `btn small ${isMl ? "primary" : ""}`,
        type: "button",
        text: "മലയാളം",
        onclick: () => switchLanguage("ml")
      })
    )
  );

  return h("div", {},
    banner,
    h("p", { class: "lede", text: isMl ? `[മലയാളം] ${section.lede}` : section.lede }),
    h("div", { class: "panel" }, renderFields(section.fields, target, enTarget))
  );
}

function pageOverview() {
  const c = state.content;
  const stat = (label, value) => h("div", { class: "stat" }, h("span", { class: "mono", text: label }), h("b", { text: String(value) }));
  return h("div", {},
    h("p", { class: "lede", text: "Everything on the Lattice website is edited from here. Pick a section on the left, change the text, then press Save." }),
    h("div", { class: "stats" }, stat("Projects", c.work.projects.length), stat("Team", c.founder.members.length), stat("Services", c.about.services.length), stat("Menu links", c.nav.links.length)),
    h("div", { class: "panel" }, h("h2", { class: "sec", text: "Jump to a section" }), h("div", { style: "height:14px" }),
      h("div", { class: "tiles" }, ...SECTIONS.map((s) => h("a", { class: "tile", href: `#${s.id}` }, s.title, icon("chev")))),
      h("div", { style: "height:10px" }),
      h("div", { class: "tiles" },
        h("a", { class: "tile", href: "#services-pricing" }, "Services & Pricing", icon("chev")),
        h("a", { class: "tile", href: "#art-directions" }, "Art Directions", icon("chev")),
        h("a", { class: "tile", href: "#hosting-plans" }, "Hosting Plans", icon("chev")),
        h("a", { class: "tile", href: "#pricing-addons" }, "Pricing Add-ons", icon("chev")),
        h("a", { class: "tile", href: "#enquiries" }, "Client Enquiries", icon("chev")),
        h("a", { class: "tile", href: "#media" }, "Media library", icon("chev")),
        h("a", { class: "tile", href: "#backups" }, "Backups", icon("chev")))),
    h("div", { class: "panel" }, h("h2", { class: "sec", text: "How publishing works" }), h("div", { style: "height:12px" }),
      h("ol", { class: "steps" },
        h("li", {}, "Edit any section and press ", h("b", { text: "Save" }), " (or Ctrl/⌘ + S). A backup of the previous version is kept automatically."),
        h("li", {}, "Saving writes directly to the Lattice database in Supabase."),
        h("li", {}, "The live site reads from the same database and refreshes within about a minute (it revalidates every 60 seconds)."))));
}

async function pageMedia() {
  const root = h("div", {}, h("p", { class: "lede", text: "Images you upload live in Supabase Storage. Use them from the Founder section, or copy a link." }));
  const panel = h("div", { class: "panel" });
  const file = h("input", { type: "file", multiple: true, hidden: true, accept: "image/png,image/jpeg,image/webp,image/gif,image/avif" });
  const grid = h("div");
  file.addEventListener("change", async () => {
    for (const f of file.files) { try { await uploadFile(f); toast(`Uploaded ${f.name}`); } catch (e) { toast(`${f.name}: ${e.message}`, "error"); } }
    file.value = "";
    load();
  });
  panel.append(h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px" },
    h("h2", { class: "sec", text: "Uploaded images" }), h("button", { class: "btn small primary", type: "button", text: "Upload images", onclick: () => file.click() })), grid, file);
  root.append(panel);

  async function load() {
    const { media } = await api("/api/media");
    grid.replaceChildren();
    if (!media.length) return grid.append(h("div", { class: "empty", text: "No images yet. Upload one to get started." }));
    grid.className = "media-grid";
    const used = JSON.stringify(state.content);
    for (const m of media) {
      grid.append(h("div", { class: "media-item" },
        h("div", { class: "pic", style: `background-image:url('${m.url}')` }),
        h("div", { class: "meta" }, h("span", { title: m.name, text: m.name }), h("span", { text: fmtSize(m.size) }),
          h("button", { class: "icon-btn", type: "button", "aria-label": `Delete ${m.name}`, onclick: async () => {
            const inUse = used.includes(`"${m.url}"`);
            const ok = await confirmDialog({ title: "Delete image?", text: inUse ? `“${m.name}” is currently used on the site. Deleting it will leave a broken image.` : `“${m.name}” will be permanently deleted.`, confirm: "Delete", danger: true });
            if (!ok) return;
            try { await api(`/api/media?name=${encodeURIComponent(m.name)}`, { method: "DELETE" }); load(); } catch (e) { toast(e.message, "error"); }
          } }, icon("x")))));
    }
  }
  await load();
  return root;
}

async function pageBackups() {
  const root = h("div", {}, h("p", { class: "lede", text: "A copy of the previous version is saved every time you press Save (the latest 50 are kept). Restoring never loses anything: the current version is backed up first." }));
  const panel = h("div", { class: "panel" }, h("h2", { class: "sec", text: "Saved versions" }), h("div", { style: "height:8px" }));
  root.append(panel);
  const { backups } = await api("/api/backups");
  if (!backups.length) panel.append(h("div", { class: "empty", text: "No backups yet. The first one appears when you save." }));
  for (const b of backups) {
    panel.append(h("div", { class: "backup-row" },
      h("div", {}, h("b", { text: fmtTime(b.time) }), h("span", { class: "help", text: b.name.includes("before-restore") ? "Made just before a restore" : "Version before a save" })),
      h("button", { class: "btn small", type: "button", text: "Restore", onclick: async () => {
        const ok = await confirmDialog({ title: "Restore this version?", text: isDirty() ? "You have unsaved changes; they will be lost. The site content will go back to this saved version." : "The site content will go back to this saved version.", confirm: "Restore" });
        if (!ok) return;
        try { await api("/api/restore", { method: "POST", json: { name: b.name } }); await loadContent(); toast("Version restored"); go("overview"); } catch (e) { toast(e.message, "error"); }
      } })));
  }
  return root;
}

/* ============ services & packages management ============ */

async function pageServices() {
  const root = h("div", {}, h("p", { class: "lede", text: "Manage all studio services, tiered packages, and package features. All prices and features are CMS-controlled and sync immediately to the live website." }));
  const panel = h("div", { class: "panel" });
  root.append(panel);

  const { services } = await api("/api/services");
  let list = clone(services || []);

  const renderList = () => {
    panel.replaceChildren();

    const topBar = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap" },
      h("h2", { class: "sec", text: `Services (${list.length})` }),
      h("div", { style: "display:flex;gap:8px" },
        h("button", { class: "btn small", type: "button", text: "+ Add Service", onclick: () => {
          const num = pad(list.length + 1);
          list.push({
            id: `service-${Date.now()}`,
            name: "New Service",
            slug: `new-service-${Date.now()}`,
            indexNum: num,
            description: "",
            shortDescription: "",
            startingPrice: 3000,
            priceLabel: "From ₹3,000+",
            billingType: "one_time",
            isFeatured: false,
            isActive: true,
            packages: [],
          });
          renderList();
        } }),
        h("button", { class: "btn small primary", type: "button", text: "Save Services", onclick: async () => {
          try {
            await api("/api/services", { method: "PUT", json: { services: list } });
            toast("Services & packages saved successfully");
            const res = await api("/api/services");
            list = clone(res.services || []);
            renderList();
          } catch (e) { toast(e.message, "error"); }
        } })
      )
    );
    panel.append(topBar);

    if (!list.length) {
      panel.append(h("div", { class: "empty", text: "No services configured yet." }));
      return;
    }

    const cards = h("div", { class: "cards" });
    list.forEach((s, sIdx) => {
      const card = h("details", { class: "card", open: true });
      const summary = h("summary", {},
        h("span", { class: "num", text: s.indexNum || pad(sIdx + 1) }),
        h("span", { class: "name", text: s.name }),
        h("span", { class: `badge ${s.isActive !== false ? "active" : "inactive"}`, text: s.isActive !== false ? "Active" : "Hidden" }),
        h("span", { class: "mono", text: s.priceLabel || "" }),
        h("div", { class: "actions", style: "display:flex;gap:4px;margin-left:auto", onclick: (e) => e.stopPropagation() },
          h("button", { class: "icon-btn", type: "button", disabled: sIdx === 0, onclick: () => { swap(list, sIdx, sIdx - 1); renderList(); } }, icon("up")),
          h("button", { class: "icon-btn", type: "button", disabled: sIdx === list.length - 1, onclick: () => { swap(list, sIdx, sIdx + 1); renderList(); } }, icon("down")),
          h("button", { class: "icon-btn", type: "button", onclick: async () => {
            const ok = await confirmDialog({ title: `Delete “${s.name}”?`, text: "This will delete this service category and all its packages.", confirm: "Delete", danger: true });
            if (ok) { list.splice(sIdx, 1); renderList(); }
          } }, icon("x"))
        ),
        icon("chev")
      );

      const body = h("div", { class: "card-body" });

      const nameInput = h("input", { type: "text", value: s.name, oninput: (e) => { s.name = e.target.value; summary.querySelector(".name").textContent = s.name; } });
      const slugInput = h("input", { type: "text", value: s.slug || "", oninput: (e) => (s.slug = e.target.value) });
      const priceInput = h("input", { type: "text", value: s.priceLabel || "", oninput: (e) => (s.priceLabel = e.target.value) });
      const numInput = h("input", { type: "text", value: s.indexNum || pad(sIdx + 1), oninput: (e) => (s.indexNum = e.target.value) });
      const shortDesc = h("textarea", { rows: 2, value: s.shortDescription || "", oninput: (e) => (s.shortDescription = e.target.value) });
      const fullDesc = h("textarea", { rows: 3, value: s.description || "", oninput: (e) => (s.description = e.target.value) });

      const activeToggle = h("label", { class: "toggle-label" },
        h("input", { type: "checkbox", checked: s.isActive !== false, onchange: (e) => {
          s.isActive = e.target.checked;
          const b = summary.querySelector(".badge");
          b.className = `badge ${s.isActive ? "active" : "inactive"}`;
          b.textContent = s.isActive ? "Active" : "Hidden";
        } }),
        "Visible on site"
      );

      body.append(
        h("div", { class: "row-2" }, labelled("Service Name", nameInput), labelled("Starting Price Label", priceInput)),
        h("div", { class: "row-2" }, labelled("Slug / Identifier", slugInput), labelled("Index (e.g. 01)", numInput)),
        labelled("Short Description (Homepage Card)", shortDesc),
        labelled("Full Description (Detail Modal)", fullDesc),
        h("div", { style: "margin-bottom:18px" }, activeToggle)
      );

      // Packages in this service
      const pkgsContainer = h("div", { style: "margin-top:20px;border-top:1px solid rgb(var(--fg)/0.08);padding-top:16px" });
      const pkgTop = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:14px" },
        h("h3", { style: "margin:0;font-size:14px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.08em;color:rgb(var(--ink-secondary))", text: `Packages (${(s.packages || []).length})` }),
        h("button", { class: "btn small", type: "button", text: "+ Add Package", onclick: () => {
          if (!s.packages) s.packages = [];
          s.packages.push({
            id: `pkg-${Date.now()}`,
            name: "New Package",
            slug: `pkg-${Date.now()}`,
            price: 5000,
            priceLabel: "₹5,000+",
            billingType: "one_time",
            badge: null,
            isFeatured: false,
            isActive: true,
            description: "",
            features: ["Feature 1", "Feature 2"],
          });
          renderList();
        } })
      );
      pkgsContainer.append(pkgTop);

      (s.packages || []).forEach((p, pIdx) => {
        const pkgBox = h("div", { class: "pkg-box" });
        const pHeader = h("div", { class: "pkg-header" },
          h("div", { style: "display:flex;align-items:center;gap:8px" },
            h("span", { class: "pkg-title", text: p.name }),
            h("span", { class: "badge accent", text: p.priceLabel || "" }),
            p.badge ? h("span", { class: "badge", text: p.badge }) : null
          ),
          h("div", { style: "display:flex;gap:4px" },
            h("button", { class: "icon-btn", type: "button", disabled: pIdx === 0, onclick: () => { swap(s.packages, pIdx, pIdx - 1); renderList(); } }, icon("up")),
            h("button", { class: "icon-btn", type: "button", disabled: pIdx === s.packages.length - 1, onclick: () => { swap(s.packages, pIdx, pIdx + 1); renderList(); } }, icon("down")),
            h("button", { class: "icon-btn", type: "button", onclick: () => { s.packages.splice(pIdx, 1); renderList(); } }, icon("x"))
          )
        );

        const pName = h("input", { type: "text", value: p.name, oninput: (e) => (p.name = e.target.value) });
        const pPrice = h("input", { type: "text", value: p.priceLabel || "", oninput: (e) => (p.priceLabel = e.target.value) });
        const pBadge = h("input", { type: "text", value: p.badge || "", placeholder: "e.g. Popular, Flagship", oninput: (e) => (p.badge = e.target.value) });
        const pDesc = h("textarea", { rows: 2, value: p.description || "", oninput: (e) => (p.description = e.target.value) });

        // Features list editor
        const featWrap = h("div", { style: "margin-top:10px" });
        const featList = h("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px" });
        const renderFeatures = () => {
          featList.replaceChildren();
          (p.features || []).forEach((feat, fIdx) => {
            const tag = h("span", { class: "feature-tag" },
              feat,
              h("button", { type: "button", onclick: () => { p.features.splice(fIdx, 1); renderFeatures(); } }, "×")
            );
            featList.append(tag);
          });
        };
        renderFeatures();

        const addFeatInput = h("input", { type: "text", placeholder: "Type a feature and press Enter...", style: "font-size:13px;padding:6px 10px" });
        addFeatInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const val = addFeatInput.value.trim();
            if (val) {
              if (!p.features) p.features = [];
              p.features.push(val);
              addFeatInput.value = "";
              renderFeatures();
            }
          }
        });

        featWrap.append(h("label", { class: "meta-label", style: "display:block;margin-bottom:4px" }, "Package Features"), featList, addFeatInput);

        pkgBox.append(
          pHeader,
          h("div", { class: "row-2" }, labelled("Package Name", pName), labelled("Price / Price Label", pPrice)),
          labelled("Badge / Highlight Tag", pBadge),
          labelled("Package Scope Description", pDesc),
          featWrap
        );
        pkgsContainer.append(pkgBox);
      });

      body.append(pkgsContainer);
      card.append(summary, body);
      cards.append(card);
    });

    panel.append(cards);
  };

  renderList();
  return root;
}

/* ============ art directions management ============ */

async function pageArtDirections() {
  const root = h("div", {}, h("p", { class: "lede", text: "Manage the 18 Art Directions, including Indian Visual Directions (Indian Modern, Kerala Contemporary, Indo-Deco, Heritage Modern, Folk-Inspired, Craft & Material, Festive Contemporary). Standard direction is included; Signature and Bespoke carry add-on pricing." }));
  const panel = h("div", { class: "panel" });
  root.append(panel);

  const { artDirections } = await api("/api/art-directions");
  let list = clone(artDirections || []);

  const renderList = () => {
    panel.replaceChildren();

    const topBar = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap" },
      h("h2", { class: "sec", text: `Art Directions (${list.length})` }),
      h("div", { style: "display:flex;gap:8px" },
        h("button", { class: "btn small", type: "button", text: "+ Add Direction", onclick: () => {
          list.push({
            id: `art-${Date.now()}`,
            name: "New Direction",
            slug: `new-direction-${Date.now()}`,
            category: "international",
            tier: "standard",
            description: "",
            accentColor: "#7c8cff",
            typography: "",
            tags: ["Modern"],
            startingPrice: 0,
            priceLabel: "Included",
            isFeatured: false,
            isActive: true,
          });
          renderList();
        } }),
        h("button", { class: "btn small primary", type: "button", text: "Save Art Directions", onclick: async () => {
          try {
            await api("/api/art-directions", { method: "PUT", json: { artDirections: list } });
            toast("Art directions saved successfully");
            const res = await api("/api/art-directions");
            list = clone(res.artDirections || []);
            renderList();
          } catch (e) { toast(e.message, "error"); }
        } })
      )
    );
    panel.append(topBar);

    const cards = h("div", { class: "cards" });
    list.forEach((ad, idx) => {
      const card = h("details", { class: "card", open: false });
      const isIndian = ad.category === "indian";
      const summary = h("summary", {},
        h("span", { style: `width:12px;height:12px;border-radius:50%;background:${ad.accentColor || "#7c8cff"};flex:none` }),
        h("span", { class: "name", text: ad.name }),
        h("span", { class: `badge ${isIndian ? "active" : ""}`, text: isIndian ? "Indian Visual" : "International" }),
        h("span", { class: "badge accent", text: (ad.tier || "standard").toUpperCase() }),
        h("span", { class: "mono", text: ad.priceLabel || "Included" }),
        h("div", { class: "actions", style: "display:flex;gap:4px;margin-left:auto", onclick: (e) => e.stopPropagation() },
          h("button", { class: "icon-btn", type: "button", disabled: idx === 0, onclick: () => { swap(list, idx, idx - 1); renderList(); } }, icon("up")),
          h("button", { class: "icon-btn", type: "button", disabled: idx === list.length - 1, onclick: () => { swap(list, idx, idx + 1); renderList(); } }, icon("down")),
          h("button", { class: "icon-btn", type: "button", onclick: async () => {
            const ok = await confirmDialog({ title: `Delete “${ad.name}”?`, text: "This will remove this art direction.", confirm: "Delete", danger: true });
            if (ok) { list.splice(idx, 1); renderList(); }
          } }, icon("x"))
        ),
        icon("chev")
      );

      const body = h("div", { class: "card-body" });
      const nameInput = h("input", { type: "text", value: ad.name, oninput: (e) => { ad.name = e.target.value; summary.querySelector(".name").textContent = ad.name; } });
      const slugInput = h("input", { type: "text", value: ad.slug || "", oninput: (e) => (ad.slug = e.target.value) });
      
      const catSelect = h("select", { onchange: (e) => (ad.category = e.target.value) },
        h("option", { value: "international", selected: ad.category !== "indian" }, "International Style"),
        h("option", { value: "indian", selected: ad.category === "indian" }, "Indian Visual Direction")
      );
      const tierSelect = h("select", { onchange: (e) => (ad.tier = e.target.value) },
        h("option", { value: "standard", selected: ad.tier === "standard" }, "Standard (Included)"),
        h("option", { value: "signature", selected: ad.tier === "signature" }, "Signature (+₹2,500–₹7,500)"),
        h("option", { value: "bespoke", selected: ad.tier === "bespoke" }, "Bespoke (+₹7,500–₹20,000+)")
      );

      const colorInput = h("input", { type: "color", value: ad.accentColor || "#7c8cff", oninput: (e) => (ad.accentColor = e.target.value) });
      const priceLabel = h("input", { type: "text", value: ad.priceLabel || "Included", oninput: (e) => (ad.priceLabel = e.target.value) });
      const descInput = h("textarea", { rows: 2, value: ad.description || "", oninput: (e) => (ad.description = e.target.value) });
      const typoInput = h("input", { type: "text", value: ad.typography || "", oninput: (e) => (ad.typography = e.target.value) });

      // Tags editor
      const tagsWrap = h("div", { style: "margin-top:10px" });
      const tagsList = h("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px" });
      const renderTags = () => {
        tagsList.replaceChildren();
        (ad.tags || []).forEach((t, tIdx) => {
          tagsList.append(h("span", { class: "feature-tag" }, t, h("button", { type: "button", onclick: () => { ad.tags.splice(tIdx, 1); renderTags(); } }, "×")));
        });
      };
      renderTags();
      const addTag = h("input", { type: "text", placeholder: "Add tag (press Enter)...", style: "font-size:13px;padding:6px 10px" });
      addTag.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const val = addTag.value.trim();
          if (val) { if (!ad.tags) ad.tags = []; ad.tags.push(val); addTag.value = ""; renderTags(); }
        }
      });
      tagsWrap.append(h("label", { class: "meta-label" }, "Aesthetic Tags"), tagsList, addTag);

      const activeToggle = h("label", { class: "toggle-label", style: "margin-top:12px" },
        h("input", { type: "checkbox", checked: ad.isActive !== false, onchange: (e) => (ad.isActive = e.target.checked) }),
        "Visible on site"
      );

      body.append(
        h("div", { class: "row-2" }, labelled("Direction Name", nameInput), labelled("Slug", slugInput)),
        h("div", { class: "row-2" }, labelled("Category", catSelect), labelled("Art Direction Tier", tierSelect)),
        h("div", { class: "row-2" },
          labelled("Accent Color", h("div", { style: "display:flex;align-items:center;gap:10px" }, colorInput, h("span", { class: "mono", text: ad.accentColor }))),
          labelled("Price Label", priceLabel)
        ),
        labelled("Description", descInput),
        labelled("Typography Notes", typoInput),
        tagsWrap,
        activeToggle
      );

      card.append(summary, body);
      cards.append(card);
    });

    panel.append(cards);
  };

  renderList();
  return root;
}

/* ============ hosting plans management ============ */

async function pageHostingPlans() {
  const root = h("div", {}, h("p", { class: "lede", text: "Manage website hosting and care plans. Note: Domain registration and renewal are billed separately." }));
  const panel = h("div", { class: "panel" });
  root.append(panel);

  const { hostingPlans } = await api("/api/hosting-plans");
  let list = clone(hostingPlans || []);

  const renderList = () => {
    panel.replaceChildren();

    const topBar = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap" },
      h("h2", { class: "sec", text: `Hosting Plans (${list.length})` }),
      h("div", { style: "display:flex;gap:8px" },
        h("button", { class: "btn small", type: "button", text: "+ Add Plan", onclick: () => {
          list.push({
            id: `plan-${Date.now()}`,
            name: "New Plan",
            slug: `plan-${Date.now()}`,
            description: "",
            price: 3999,
            priceLabel: "₹3,999/year",
            billingType: "yearly",
            isFeatured: false,
            isActive: true,
            features: ["Global edge CDN", "Automated SSL"],
          });
          renderList();
        } }),
        h("button", { class: "btn small primary", type: "button", text: "Save Hosting Plans", onclick: async () => {
          try {
            await api("/api/hosting-plans", { method: "PUT", json: { hostingPlans: list } });
            toast("Hosting plans saved successfully");
            const res = await api("/api/hosting-plans");
            list = clone(res.hostingPlans || []);
            renderList();
          } catch (e) { toast(e.message, "error"); }
        } })
      )
    );
    panel.append(topBar);

    const cards = h("div", { class: "cards" });
    list.forEach((p, idx) => {
      const card = h("details", { class: "card", open: true });
      const summary = h("summary", {},
        h("span", { class: "name", text: p.name }),
        h("span", { class: `badge ${p.isActive !== false ? "active" : "inactive"}`, text: p.isActive !== false ? "Active" : "Hidden" }),
        h("span", { class: "mono", text: p.priceLabel || "" }),
        h("div", { class: "actions", style: "display:flex;gap:4px;margin-left:auto", onclick: (e) => e.stopPropagation() },
          h("button", { class: "icon-btn", type: "button", disabled: idx === 0, onclick: () => { swap(list, idx, idx - 1); renderList(); } }, icon("up")),
          h("button", { class: "icon-btn", type: "button", disabled: idx === list.length - 1, onclick: () => { swap(list, idx, idx + 1); renderList(); } }, icon("down")),
          h("button", { class: "icon-btn", type: "button", onclick: async () => {
            const ok = await confirmDialog({ title: `Delete “${p.name}”?`, text: "This will remove this hosting plan.", confirm: "Delete", danger: true });
            if (ok) { list.splice(idx, 1); renderList(); }
          } }, icon("x"))
        ),
        icon("chev")
      );

      const body = h("div", { class: "card-body" });
      const nameInput = h("input", { type: "text", value: p.name, oninput: (e) => { p.name = e.target.value; summary.querySelector(".name").textContent = p.name; } });
      const priceLabel = h("input", { type: "text", value: p.priceLabel || "", oninput: (e) => (p.priceLabel = e.target.value) });
      const descInput = h("textarea", { rows: 2, value: p.description || "", oninput: (e) => (p.description = e.target.value) });

      // Features list editor
      const featWrap = h("div", { style: "margin-top:10px" });
      const featList = h("div", { style: "display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px" });
      const renderFeatures = () => {
        featList.replaceChildren();
        (p.features || []).forEach((f, fIdx) => {
          featList.append(h("span", { class: "feature-tag" }, f, h("button", { type: "button", onclick: () => { p.features.splice(fIdx, 1); renderFeatures(); } }, "×")));
        });
      };
      renderFeatures();
      const addFeat = h("input", { type: "text", placeholder: "Add feature (press Enter)...", style: "font-size:13px;padding:6px 10px" });
      addFeat.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const val = addFeat.value.trim();
          if (val) { if (!p.features) p.features = []; p.features.push(val); addFeat.value = ""; renderFeatures(); }
        }
      });
      featWrap.append(h("label", { class: "meta-label" }, "Features included"), featList, addFeat);

      const activeToggle = h("label", { class: "toggle-label", style: "margin-top:12px" },
        h("input", { type: "checkbox", checked: p.isActive !== false, onchange: (e) => (p.isActive = e.target.checked) }),
        "Visible on site"
      );

      body.append(
        h("div", { class: "row-2" }, labelled("Plan Name", nameInput), labelled("Price / Frequency Label", priceLabel)),
        labelled("Description", descInput),
        featWrap,
        activeToggle
      );

      card.append(summary, body);
      cards.append(card);
    });

    panel.append(cards);
  };

  renderList();
  return root;
}

/* ============ pricing add-ons management ============ */

async function pagePricingAddons() {
  const root = h("div", {}, h("p", { class: "lede", text: "Manage optional à la carte add-ons (3D, animation, extra pages, SEO, copywriting, revisions, API integrations)." }));
  const panel = h("div", { class: "panel" });
  root.append(panel);

  const { addons } = await api("/api/pricing-addons");
  let list = clone(addons || []);

  const renderList = () => {
    panel.replaceChildren();

    const topBar = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap" },
      h("h2", { class: "sec", text: `Pricing Add-ons (${list.length})` }),
      h("div", { style: "display:flex;gap:8px" },
        h("button", { class: "btn small", type: "button", text: "+ Add Add-on", onclick: () => {
          list.push({
            id: `addon-${Date.now()}`,
            name: "New Add-on",
            description: "",
            price: 2500,
            priceLabel: "₹2,500+",
            billingType: "one_time",
            category: "General",
            isActive: true,
          });
          renderList();
        } }),
        h("button", { class: "btn small primary", type: "button", text: "Save Add-ons", onclick: async () => {
          try {
            await api("/api/pricing-addons", { method: "PUT", json: { addons: list } });
            toast("Pricing add-ons saved successfully");
            const res = await api("/api/pricing-addons");
            list = clone(res.addons || []);
            renderList();
          } catch (e) { toast(e.message, "error"); }
        } })
      )
    );
    panel.append(topBar);

    const cards = h("div", { class: "cards" });
    list.forEach((a, idx) => {
      const card = h("details", { class: "card", open: false });
      const summary = h("summary", {},
        h("span", { class: "name", text: a.name }),
        h("span", { class: "badge", text: a.category || "General" }),
        h("span", { class: `badge ${a.isActive !== false ? "active" : "inactive"}`, text: a.isActive !== false ? "Active" : "Hidden" }),
        h("span", { class: "mono", text: a.priceLabel || "" }),
        h("div", { class: "actions", style: "display:flex;gap:4px;margin-left:auto", onclick: (e) => e.stopPropagation() },
          h("button", { class: "icon-btn", type: "button", disabled: idx === 0, onclick: () => { swap(list, idx, idx - 1); renderList(); } }, icon("up")),
          h("button", { class: "icon-btn", type: "button", disabled: idx === list.length - 1, onclick: () => { swap(list, idx, idx + 1); renderList(); } }, icon("down")),
          h("button", { class: "icon-btn", type: "button", onclick: async () => {
            const ok = await confirmDialog({ title: `Delete “${a.name}”?`, text: "This will remove this add-on.", confirm: "Delete", danger: true });
            if (ok) { list.splice(idx, 1); renderList(); }
          } }, icon("x"))
        ),
        icon("chev")
      );

      const body = h("div", { class: "card-body" });
      const nameInput = h("input", { type: "text", value: a.name, oninput: (e) => { a.name = e.target.value; summary.querySelector(".name").textContent = a.name; } });
      const catInput = h("input", { type: "text", value: a.category || "General", oninput: (e) => (a.category = e.target.value) });
      const priceLabel = h("input", { type: "text", value: a.priceLabel || "", oninput: (e) => (a.priceLabel = e.target.value) });
      const descInput = h("textarea", { rows: 2, value: a.description || "", oninput: (e) => (a.description = e.target.value) });

      const activeToggle = h("label", { class: "toggle-label", style: "margin-top:8px" },
        h("input", { type: "checkbox", checked: a.isActive !== false, onchange: (e) => (a.isActive = e.target.checked) }),
        "Visible on site"
      );

      body.append(
        h("div", { class: "row-2" }, labelled("Add-on Name", nameInput), labelled("Category", catInput)),
        labelled("Price / Price Label", priceLabel),
        labelled("Description", descInput),
        activeToggle
      );

      card.append(summary, body);
      cards.append(card);
    });

    panel.append(cards);
  };

  renderList();
  return root;
}

/* ============ client enquiries management ============ */

async function pageEnquiries() {
  const root = h("div", {}, h("p", { class: "lede", text: "Client leads and project inquiries submitted through the Lattice website. Stored in real time in Supabase." }));
  const panel = h("div", { class: "panel" });
  root.append(panel);

  let currentFilter = "all";
  const { enquiries } = await api("/api/enquiries");
  let list = enquiries || [];

  const renderView = () => {
    panel.replaceChildren();

    const topBar = h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap" },
      h("h2", { class: "sec", text: `Client Inquiries (${list.length})` }),
      h("button", { class: "btn small", type: "button", text: "Refresh", onclick: async () => {
        const res = await api("/api/enquiries");
        list = res.enquiries || [];
        renderView();
      } })
    );
    panel.append(topBar);

    // Filter bar
    const filterBar = h("div", { class: "filter-bar" });
    const filters = [
      ["all", `All (${list.length})`],
      ["new", `New (${list.filter((e) => e.status === "new").length})`],
      ["contacted", `Contacted (${list.filter((e) => e.status === "contacted").length})`],
      ["in_progress", `In Progress (${list.filter((e) => e.status === "in_progress").length})`],
      ["closed", `Closed (${list.filter((e) => e.status === "closed").length})`],
      ["archived", `Archived (${list.filter((e) => e.status === "archived").length})`],
    ];
    filters.forEach(([key, label]) => {
      const btn = h("button", { class: `filter-btn ${currentFilter === key ? "active" : ""}`, type: "button", text: label, onclick: () => {
        currentFilter = key;
        renderView();
      } });
      filterBar.append(btn);
    });
    panel.append(filterBar);

    const filtered = currentFilter === "all" ? list : list.filter((e) => e.status === currentFilter);

    if (!filtered.length) {
      panel.append(h("div", { class: "empty", text: "No inquiries found for this status." }));
      return;
    }

    const cards = h("div", {});
    filtered.forEach((item) => {
      const card = h("div", { class: "enquiry-card" });

      const statusSelect = h("select", { style: "width:auto;padding:4px 10px;font-size:12px;border-radius:999px", onchange: async (e) => {
        const nextStatus = e.target.value;
        try {
          await api("/api/enquiries", { method: "PATCH", json: { id: item.id, status: nextStatus } });
          item.status = nextStatus;
          toast(`Status updated to ${nextStatus}`);
          renderView();
        } catch (err) { toast(err.message, "error"); }
      } },
        h("option", { value: "new", selected: item.status === "new" }, "New"),
        h("option", { value: "contacted", selected: item.status === "contacted" }, "Contacted"),
        h("option", { value: "in_progress", selected: item.status === "in_progress" }, "In Progress"),
        h("option", { value: "closed", selected: item.status === "closed" }, "Closed"),
        h("option", { value: "archived", selected: item.status === "archived" }, "Archived")
      );

      const deleteBtn = h("button", { class: "icon-btn", type: "button", "aria-label": "Delete inquiry", onclick: async () => {
        const ok = await confirmDialog({ title: `Delete inquiry from ${item.name}?`, text: "This lead will be permanently deleted.", confirm: "Delete", danger: true });
        if (ok) {
          try {
            await api(`/api/enquiries?id=${item.id}`, { method: "DELETE" });
            list = list.filter((x) => x.id !== item.id);
            toast("Inquiry deleted");
            renderView();
          } catch (err) { toast(err.message, "error"); }
        }
      } }, icon("x"));

      const head = h("div", { class: "enquiry-head" },
        h("div", {},
          h("h3", { class: "enquiry-title", text: item.name }),
          h("span", { class: "mono", text: item.businessName ? `${item.businessName} · ` : "" }, fmtTime(item.createdAt))
        ),
        h("div", { style: "display:flex;align-items:center;gap:8px" },
          h("span", { class: `status-badge ${item.status || "new"}`, text: (item.status || "new").replace("_", " ") }),
          statusSelect,
          deleteBtn
        )
      );

      const meta = h("div", { class: "enquiry-meta" },
        h("div", { class: "meta-item" },
          h("span", { class: "meta-label", text: "Email" }),
          h("a", { class: "meta-val", href: `mailto:${item.email}`, target: "_blank", text: item.email, style: "text-decoration:underline" })
        ),
        h("div", { class: "meta-item" },
          h("span", { class: "meta-label", text: "Phone" }),
          item.phone ? h("a", { class: "meta-val", href: `tel:${item.phone.replace(/[^+\d]/g, "")}`, text: item.phone }) : h("span", { class: "meta-val", text: "—" })
        ),
        h("div", { class: "meta-item" },
          h("span", { class: "meta-label", text: "Budget Range" }),
          h("span", { class: "meta-val", style: "font-weight:600", text: item.budget || "Not specified" })
        )
      );

      const tags = h("div", { class: "enquiry-tags" },
        ...(item.requestedServices || []).map((t) => h("span", { class: "badge active", text: t }))
      );

      const desc = h("div", { class: "enquiry-desc", text: item.description || "No project description provided." });

      // Notes editor
      const notesInput = h("input", { type: "text", value: item.notes || "", placeholder: "Add private admin note...", style: "font-size:13px;padding:6px 10px" });
      const notesBtn = h("button", { class: "btn small", type: "button", text: "Save Note", onclick: async () => {
        try {
          await api("/api/enquiries", { method: "PATCH", json: { id: item.id, notes: notesInput.value } });
          item.notes = notesInput.value;
          toast("Note saved");
        } catch (err) { toast(err.message, "error"); }
      } });
      const notesRow = h("div", { style: "display:flex;gap:8px;align-items:center;margin-top:10px" },
        notesInput, notesBtn
      );

      card.append(head, meta, tags, desc, notesRow);
      cards.append(card);
    });

    panel.append(cards);
  };

  renderView();
  return root;
}

/* ============ shell ============ */

const PAGES = [
  { id: "overview", title: "Overview" },
  ...SECTIONS,
  { id: "services-pricing", title: "Services & Pricing", group: "Studio Offerings" },
  { id: "art-directions", title: "Art Directions" },
  { id: "hosting-plans", title: "Hosting Plans" },
  { id: "pricing-addons", title: "Pricing Add-ons" },
  { id: "enquiries", title: "Client Enquiries", group: "Client Leads" },
  { id: "media", title: "Media library", group: "Library" },
  { id: "backups", title: "Backups" },
];

function currentId() {
  const id = location.hash.slice(1);
  return PAGES.some((p) => p.id === id) ? id : "overview";
}
function go(id) { location.hash = id; }

function buildShell() {
  const nav = h("nav", { class: "nav", "aria-label": "Sections" });
  const menuBtn = h("button", { class: "icon-btn menu-btn", type: "button", "aria-label": "Open menu", style: "width:38px;height:38px", onclick: () => shellEl.classList.toggle("menu-open") }, icon("menu"));
  const title = h("h1");
  const status = h("span", { class: "status mono" }, h("i"), h("span", { class: "txt" }));
  const discard = h("button", { class: "btn small", type: "button", text: "Discard", onclick: async () => {
    if (!(await confirmDialog({ title: "Discard changes?", text: "Everything you changed since the last save will be lost.", confirm: "Discard", danger: true }))) return;
    state.content = JSON.parse(state.saved); state.errors = []; render(); updateStatus();
  } });
  const save = h("button", { class: "btn small primary", type: "button", text: "Save changes", onclick: save_ });
  const content = h("div", { class: "content", id: "main" });

  const sidebar = h("aside", { class: "sidebar" },
    h("a", { class: "brand", href: "#overview", "aria-label": "Lattice admin home" }, logo(), "LATTICE"),
    nav,
    h("div", { class: "side-foot" },
      h("a", { class: "btn small", href: state.siteUrl, target: "_blank", rel: "noopener", text: "View live (EN) ↗" }),
      h("a", { class: "btn small", href: `${state.siteUrl}/ml`, target: "_blank", rel: "noopener", text: "View live (മലയാളം) ↗" }),
      h("button", { class: "btn small", type: "button", text: "Sign out", onclick: async () => {
        if (isDirty() && !(await confirmDialog({ title: "Sign out?", text: "You have unsaved changes that will be lost.", confirm: "Sign out", danger: true }))) return;
        state.content = null; await api("/api/logout", { method: "POST" }).catch(() => {}); showLogin();
      } })));

  const shellEl = h("div", { class: "shell" }, sidebar,
    h("div", { class: "main" }, h("header", { class: "topbar" }, menuBtn, h("div", { class: "title" }, title), makeLangSwitch(), status, discard, save, themeToggle()), content));
  shellEl.addEventListener("click", (e) => { if (e.target.closest(".nav a")) shellEl.classList.remove("menu-open"); });
  return { el: shellEl, nav, title, status, discard, save, content };
}

function renderNav() {
  const active = currentId();
  shell.nav.replaceChildren();
  for (const p of PAGES) {
    if (p.group) shell.nav.append(h("span", { class: "mono group", text: p.group }));
    const count = p.id === "work" ? state.content.work.projects.length : p.id === "about" ? state.content.about.services.length : null;
    shell.nav.append(h("a", { href: `#${p.id}`, "aria-current": p.id === active ? "page" : null }, p.title, count !== null && h("span", { class: "count", text: pad(count) })));
  }
}

let renderToken = 0;
async function render() {
  if (!shell || !state.content) return;
  const token = ++renderToken;
  const id = currentId();
  const page = PAGES.find((p) => p.id === id);
  shell.title.textContent = page.title;
  document.title = `${page.title} · Lattice Admin`;
  renderNav();
  let body;
  try {
    body =
      id === "overview" ? pageOverview() :
      id === "media" ? await pageMedia() :
      id === "backups" ? await pageBackups() :
      id === "services-pricing" ? await pageServices() :
      id === "art-directions" ? await pageArtDirections() :
      id === "hosting-plans" ? await pageHostingPlans() :
      id === "pricing-addons" ? await pagePricingAddons() :
      id === "enquiries" ? await pageEnquiries() :
      pageForm(SECTIONS.find((s) => s.id === id));
  } catch (e) {
    body = h("div", { class: "errors" }, h("b", { text: "Couldn't load this page" }), e.message);
  }
  if (token !== renderToken) return; // a newer navigation won the race
  shell.content.replaceChildren(errorBanner(), body);
  window.scrollTo(0, 0);
  updateStatus();
}

function errorBanner() {
  if (!state.errors.length) return document.createComment("");
  return h("div", { class: "errors", role: "alert" }, h("b", { text: "Please fix these before saving:" }), h("ul", {}, ...state.errors.map((e) => h("li", { text: e }))));
}

/* ============ save ============ */

const slug = (s, fallback = "project") => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

function prepareForSave() {
  const c = clone(state.content);
  const cleanList = (a) => a.map((s) => s.trim()).filter(Boolean);
  c.hero.headline = cleanList(c.hero.headline);
  c.contact.phone = c.contact.phone ? c.contact.phone.trim() : "";
  c.work.projects.forEach((p) => (p.tags = cleanList(p.tags)));
  const used = new Set();
  for (const p of c.work.projects) {
    let id = p.id || slug(p.title);
    while (used.has(id)) id += "-2";
    used.add(id);
    p.id = id;
  }

  c.founder.members.forEach((m) => {
    m.bio = cleanList(m.bio);
    m.focus = cleanList(m.focus);
    m.photo = m.photo ? m.photo.trim() : null;
    m.principle = m.principle ? m.principle.trim() : "";
    m.socialLinks = m.socialLinks.map((s) => ({ platform: s.platform.trim(), url: s.url.trim() })).filter((s) => s.platform && s.url);
  });
  const usedMemberIds = new Set();
  for (const m of c.founder.members) {
    let id = m.id || slug(m.name, "member");
    while (usedMemberIds.has(id)) id += "-2";
    usedMemberIds.add(id);
    m.id = id;
  }

  return c;
}

async function save_() {
  if (state.saving || !isDirty()) return;
  state.saving = true;
  updateStatus();
  shell.save.textContent = "Saving…";
  try {
    if (state.lang === "ml") {
      await api("/api/translations", { method: "PUT", json: { content: state.mlContent } });
      state.savedMl = JSON.stringify(state.mlContent);
      state.errors = [];
      toast("Saved. Malayalam translations updated.");
      await render();
    } else {
      const content = prepareForSave();
      const res = await api("/api/content", { method: "PUT", json: { content, baseModified: state.modified } });
      state.content = content;
      state.saved = JSON.stringify(content);
      state.modified = res.modified;
      state.errors = [];
      toast("Saved. The site content is updated.");
      await render();
    }
  } catch (e) {
    if (e.errors?.length) { state.errors = e.errors; await render(); window.scrollTo(0, 0); }
    toast(e.message, "error");
  } finally {
    state.saving = false;
    shell.save.textContent = "Save changes";
    updateStatus();
  }
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (shell && state.content) save_();
  }
});

/* ============ boot / login ============ */

async function loadContent() {
  const [contentRes, mlRes] = await Promise.all([
    api("/api/content"),
    api("/api/translations?lang=ml").catch(() => ({ content: {} })),
  ]);
  state.content = contentRes.content;
  state.saved = JSON.stringify(contentRes.content);
  state.modified = contentRes.modified;
  state.mlContent = mlRes.content || {};
  state.savedMl = JSON.stringify(state.mlContent);
  state.errors = [];
}

function showLogin(message = "") {
  shell = null;
  state.content = null;
  const err = h("p", { class: "form-error", role: "alert", text: message });
  const email = h("input", { type: "email", id: "email", autocomplete: "username", required: true, "aria-label": "Email" });
  const pw = h("input", { type: "password", id: "pw", autocomplete: "current-password", required: true, "aria-label": "Password" });
  const btn = h("button", { class: "btn primary", type: "submit", text: "Sign in" });
  const form = h("form", { class: "login-card", onsubmit: async (e) => {
    e.preventDefault();
    btn.disabled = true; err.textContent = "";
    try {
      await api("/api/login", { method: "POST", json: { email: email.value, password: pw.value } });
      await start();
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; pw.select(); }
  } },
    h("div", { class: "brand" }, logo(), "LATTICE"),
    h("h1", { text: "Studio admin" }),
    h("p", { text: "Sign in to edit the Lattice website." }),
    h("div", { class: "field" }, h("label", { for: "email", text: "Email" }), email),
    h("div", { class: "field" }, h("label", { for: "pw", text: "Password" }), pw), err, btn);
  $app.className = "";
  $app.replaceChildren(h("main", { class: "login" }, h("div", { class: "login-theme" }, themeToggle()), form));
  document.title = "Sign in · Lattice Admin";
  email.focus();
}

async function start() {
  await loadContent();
  shell = buildShell();
  $app.replaceChildren(shell.el);
  await render();
}

window.addEventListener("hashchange", render);

(async function boot() {
  try {
    const session = await api("/api/session");
    state.siteUrl = session.siteUrl;
    if (!session.authed) return showLogin();
    await start();
  } catch (e) {
    $app.replaceChildren(h("main", { class: "login" }, h("div", { class: "login-card" }, h("h1", { text: "Can't connect" }), h("p", { text: e.message }))));
  }
})();
