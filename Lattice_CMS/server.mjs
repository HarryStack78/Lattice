// Lattice admin — standalone content editor for the Lattice website.
// Talks to Supabase (Postgres + Storage) instead of the filesystem. Auth is Supabase Auth
// (email/password); every read/write runs as the signed-in admin's own Supabase session, so
// Postgres RLS (admin_users / is_admin()) is the real enforcement, not just this server.
// It never imports any code from the website.

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "public");
const ENV_FILE = path.join(ROOT, ".env");

// ---------- config (.env, created on first run) ----------

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

let fileEnv = fs.existsSync(ENV_FILE) ? parseEnv(fs.readFileSync(ENV_FILE, "utf8")) : {};
if (!fileEnv.SESSION_SECRET) {
  fileEnv = { ...fileEnv, SESSION_SECRET: crypto.randomBytes(32).toString("hex") };
  const body = [
    "# Lattice admin settings.",
    `SESSION_SECRET=${fileEnv.SESSION_SECRET}`,
    "# Supabase project (public values; safe to keep here).",
    `SUPABASE_URL=${fileEnv.SUPABASE_URL || ""}`,
    `SUPABASE_PUBLISHABLE_KEY=${fileEnv.SUPABASE_PUBLISHABLE_KEY || ""}`,
    "# Public address of the website, used for the 'View site' link.",
    `SITE_URL=${fileEnv.SITE_URL || "http://localhost:3000"}`,
    "# Shared with the website's .env.local REVALIDATE_SECRET, so a save here can ask the site",
    "# to refresh immediately instead of waiting out its ISR window. Optional.",
    `REVALIDATE_SECRET=${fileEnv.REVALIDATE_SECRET || ""}`,
    "",
  ].join("\n");
  fs.writeFileSync(ENV_FILE, body, "utf8");
}

const cfg = { ...fileEnv, ...process.env };
const PORT = Number(cfg.PORT || 4000);
const HOST = cfg.HOST || "127.0.0.1";
const SITE_URL = cfg.SITE_URL || "http://localhost:3000";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_UPLOAD = 8 * 1024 * 1024;
const MAX_JSON = 2 * 1024 * 1024;
const IMAGE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };
const MEDIA_BUCKET = "media";

if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
  console.error(`Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in ${ENV_FILE} before starting.`);
  process.exit(1);
}

async function supabaseFor(session) {
  const client = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  if (session) {
    await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  }
  return client;
}

// ---------- auth ----------
//
// Our own cookie carries a signed, encrypted-at-rest-by-nobody-but-httpOnly copy of the
// Supabase session tokens, so every request can act as the admin without re-authenticating.
// The cookie is HttpOnly/SameSite=Strict, same as before.

const sign = (value) => crypto.createHmac("sha256", cfg.SESSION_SECRET).update(value).digest("base64url");

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function makeSessionCookie(supabaseSession) {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_TTL_MS,
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
  });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function readSession(req) {
  const token = readCookie(req, "lattice_admin");
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig || !safeEqual(sig, sign(encoded))) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

const attempts = new Map(); // ip -> { count, resetAt }
function throttled(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= 5;
}
function noteFailure(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + 60_000 });
  else entry.count += 1;
}

// ---------- content validation ----------

const HEX = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(c) {
  const errors = [];
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const str = (v, where, { required = false } = {}) => {
    if (typeof v !== "string") errors.push(`${where} must be text`);
    else if (required && !v.trim()) errors.push(`${where} can't be empty`);
  };
  const strList = (v, where, min = 0) => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) errors.push(`${where} must be a list of text`);
    else if (v.length < min) errors.push(`${where} needs at least ${min} item${min > 1 ? "s" : ""}`);
  };

  if (!isObj(c)) return ["Content must be an object"];
  for (const key of ["seo", "nav", "hero", "about", "work", "founder", "contact", "footer"]) {
    if (!isObj(c[key])) errors.push(`Missing section: ${key}`);
  }
  if (errors.length) return errors;

  str(c.seo.title, "Site title", { required: true });
  str(c.seo.description, "Site description");
  str(c.seo.siteName, "Site name", { required: true });
  try {
    const u = new URL(c.seo.siteUrl);
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    errors.push("Site URL must be a full address such as https://lattice.studio");
  }

  if (!Array.isArray(c.nav.links)) errors.push("Navigation links must be a list");
  else c.nav.links.forEach((l, i) => {
    str(l?.label, `Navigation link ${i + 1} label`, { required: true });
    str(l?.href, `Navigation link ${i + 1} target`, { required: true });
  });
  str(c.nav.cta, "Header button text");

  strList(c.hero.headline, "Hero headline", 1);
  for (const k of ["eyebrow", "intro", "scrollLabel", "tagline"]) str(c.hero[k], `Hero ${k}`);

  str(c.about.label, "About label");
  str(c.about.manifesto, "About manifesto", { required: true });
  str(c.about.marquee, "Scrolling banner text");
  if (!Array.isArray(c.about.services)) errors.push("Services must be a list");
  else c.about.services.forEach((s, i) => {
    str(s?.title, `Service ${i + 1} title`, { required: true });
    str(s?.body, `Service ${i + 1} description`);
  });

  str(c.work.label, "Work label");
  str(c.work.readMore, "Project card button text");
  if (!Array.isArray(c.work.projects)) errors.push("Projects must be a list");
  else {
    const ids = new Set();
    c.work.projects.forEach((p, i) => {
      const n = `Project ${i + 1}`;
      if (!isObj(p)) return errors.push(`${n} is invalid`);
      str(p.id, `${n} id`, { required: true });
      if (ids.has(p.id)) errors.push(`${n} has a duplicate id "${p.id}"`);
      ids.add(p.id);
      for (const k of ["title", "client", "domain", "year", "summary", "challenge", "approach", "result"]) {
        str(p[k], `${n} ${k}`, { required: k === "title" });
      }
      strList(p.tags, `${n} tags`);
      if (!Array.isArray(p.colors) || p.colors.length !== 3 || p.colors.some((x) => !HEX.test(x))) {
        errors.push(`${n} needs three colours (#rrggbb)`);
      }
    });
  }

  for (const k of ["label", "principleLabel", "cta"]) str(c.founder[k], `Team ${k}`);
  if (!Array.isArray(c.founder.members)) errors.push("Team members must be a list");
  else {
    const TIERS = new Set(["founder", "member"]);
    const STATUSES = new Set(["active", "upcoming"]);
    const memberIds = new Set();
    c.founder.members.forEach((m, i) => {
      const n = `Team member ${i + 1}`;
      if (!isObj(m)) return errors.push(`${n} is invalid`);
      if (m.id) {
        if (memberIds.has(m.id)) errors.push(`${n} has a duplicate id "${m.id}"`);
        memberIds.add(m.id);
      }
      str(m.name, `${n} name`, { required: true });
      str(m.role, `${n} role`);
      str(m.initials, `${n} initials`);
      if (!TIERS.has(m.tier)) errors.push(`${n} tier must be "founder" or "member"`);
      if (!STATUSES.has(m.status)) errors.push(`${n} status must be "active" or "upcoming"`);
      if (m.photo !== null && m.photo !== undefined && (typeof m.photo !== "string" || !/^(\/|https?:\/\/)/.test(m.photo))) {
        errors.push(`${n} photo must be an uploaded image or a full web address`);
      }
      strList(m.bio, `${n} bio`);
      strList(m.focus, `${n} focus areas`);
      if (!Array.isArray(m.socialLinks)) errors.push(`${n} social links must be a list`);
      else m.socialLinks.forEach((s, j) => {
        str(s?.platform, `${n} social link ${j + 1} platform`, { required: true });
        if (typeof s?.url !== "string" || !/^https?:\/\/.+/.test(s.url)) {
          errors.push(`${n} social link ${j + 1} needs a full web address (https://…)`);
        }
      });
    });
  }

  for (const k of ["label", "eyebrow", "heading"]) str(c.contact[k], `Contact ${k}`);
  if (typeof c.contact.email !== "string" || !EMAIL.test(c.contact.email)) errors.push("Contact email is not a valid email address");
  str(c.contact.phone, "Contact phone number");
  if (c.contact.phone && !/^[+\d][\d\s().-]{5,}$/.test(c.contact.phone)) {
    errors.push("Contact phone number doesn't look like a phone number");
  }

  str(c.footer.copyright, "Footer copyright text");
  str(c.footer.backToTop, "Back-to-top text");
  if (!Array.isArray(c.footer.socials)) errors.push("Social links must be a list");
  else c.footer.socials.forEach((s, i) => {
    str(s?.label, `Social link ${i + 1} label`, { required: true });
    str(s?.href, `Social link ${i + 1} address`, { required: true });
  });
  return errors;
}

// ---------- content assembly (site_content + projects <-> one JSON blob) ----------

async function loadContent(supabase) {
  const [{ data: siteRow, error: siteErr }, { data: projectRows, error: projErr }, { data: memberRows, error: memberErr }] = await Promise.all([
    supabase.from("site_content").select("content, updated_at").eq("id", 1).single(),
    supabase.from("projects").select("*").order("sort_order", { ascending: true }),
    supabase.from("team_members").select("*").order("sort_order", { ascending: true }),
  ]);
  if (siteErr) throw new Error(siteErr.message);
  if (projErr) throw new Error(projErr.message);
  if (memberErr) throw new Error(memberErr.message);

  const content = {
    ...siteRow.content,
    work: {
      ...siteRow.content.work,
      projects: (projectRows || []).map((p) => ({
        id: p.id,
        title: p.title,
        client: p.client,
        domain: p.domain,
        year: p.year,
        tags: p.tags,
        summary: p.summary,
        challenge: p.challenge,
        approach: p.approach,
        result: p.result,
        colors: p.colors,
      })),
    },
    founder: {
      ...siteRow.content.founder,
      members: (memberRows || []).map((m) => ({
        id: m.id,
        tier: m.tier,
        status: m.status,
        isEnabled: m.is_enabled,
        name: m.name,
        role: m.role,
        initials: m.initials,
        photo: m.photo_url,
        bio: m.bio,
        principle: m.principle,
        focus: m.focus,
        socialLinks: m.social_links,
      })),
    },
  };
  return { content, modified: new Date(siteRow.updated_at).getTime() };
}

async function saveContent(supabase, content, userId, reason = null) {
  const siteContent = {
    ...content,
    work: { label: content.work.label, readMore: content.work.readMore },
    founder: { label: content.founder.label, principleLabel: content.founder.principleLabel, cta: content.founder.cta },
  };
  const projectList = content.work.projects;
  const memberList = content.founder.members;

  // Snapshot before writing, for the backups list. site_content keeps work.label/readMore and
  // founder's section strings only, matching the shape site_content itself is stored in.
  const current = await loadContent(supabase);
  await supabase.from("content_backups").insert({
    reason,
    site_content: {
      ...current.content,
      work: { label: current.content.work.label, readMore: current.content.work.readMore },
      founder: { label: current.content.founder.label, principleLabel: current.content.founder.principleLabel, cta: current.content.founder.cta },
    },
    projects: current.content.work.projects,
    team_members: current.content.founder.members,
    created_by: userId,
  });

  const { error: siteErr } = await supabase
    .from("site_content")
    .update({ content: siteContent, updated_by: userId })
    .eq("id", 1);
  if (siteErr) throw new Error(siteErr.message);

  const { data: existingRows, error: existingErr } = await supabase.from("projects").select("id");
  if (existingErr) throw new Error(existingErr.message);
  const existingIds = new Set((existingRows || []).map((r) => r.id));
  const incomingIds = new Set(projectList.map((p) => p.id));

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from("projects").delete().in("id", toDelete);
    if (error) throw new Error(error.message);
  }

  const upsertRows = projectList.map((p, i) => ({
    id: p.id,
    title: p.title,
    client: p.client,
    domain: p.domain,
    year: p.year,
    tags: p.tags,
    summary: p.summary,
    challenge: p.challenge,
    approach: p.approach,
    result: p.result,
    colors: p.colors,
    sort_order: i,
    updated_by: userId,
  }));
  if (upsertRows.length) {
    const { error } = await supabase.from("projects").upsert(upsertRows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  const { data: existingMemberRows, error: existingMemberErr } = await supabase.from("team_members").select("id");
  if (existingMemberErr) throw new Error(existingMemberErr.message);
  const existingMemberIds = new Set((existingMemberRows || []).map((r) => r.id));
  const incomingMemberIds = new Set(memberList.map((m) => m.id));

  const memberToDelete = [...existingMemberIds].filter((id) => !incomingMemberIds.has(id));
  if (memberToDelete.length) {
    const { error } = await supabase.from("team_members").delete().in("id", memberToDelete);
    if (error) throw new Error(error.message);
  }

  const memberUpsertRows = memberList.map((m, i) => ({
    id: m.id,
    tier: m.tier,
    status: m.status,
    is_enabled: m.isEnabled,
    name: m.name,
    role: m.role,
    initials: m.initials,
    photo_url: m.photo,
    bio: m.bio,
    principle: m.principle || null,
    focus: m.focus,
    social_links: m.socialLinks,
    sort_order: i,
    updated_by: userId,
  }));
  if (memberUpsertRows.length) {
    const { error } = await supabase.from("team_members").upsert(memberUpsertRows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  requestRevalidate();
  return loadContent(supabase);
}

// Best-effort: ask the website to refresh its cached homepage right away, instead of waiting out
// its 60s ISR window. Never blocks or fails a save — the site isn't always running (e.g. locally
// between edits), and a save should still succeed either way.
function requestRevalidate() {
  if (!cfg.REVALIDATE_SECRET) return;
  fetch(`${SITE_URL}/api/revalidate`, {
    method: "POST",
    headers: { "x-revalidate-secret": cfg.REVALIDATE_SECRET },
  }).catch((err) => console.warn(`Revalidate request to ${SITE_URL} failed (the site may not be running): ${err.message}`));
}

// ---------- file helpers ----------

function sanitizeFilename(original) {
  original = original.toLowerCase();
  const ext = path.extname(original);
  const base = path.basename(original, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  return { base, ext };
}

// ---------- http plumbing ----------

function send(res, status, body, headers = {}) {
  const isJson = typeof body === "object" && !Buffer.isBuffer(body);
  const payload = isJson ? JSON.stringify(body) : body;
  res.writeHead(status, {
    "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers,
  });
  res.end(payload);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error("Request too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ...IMAGE_TYPES,
};

async function serveFile(res, root, relative) {
  const file = path.resolve(root, "." + path.posix.normalize("/" + relative));
  if (file !== root && !file.startsWith(root + path.sep)) return send(res, 403, "Forbidden");
  try {
    const stat = await fsp.stat(file);
    if (!stat.isFile()) return send(res, 404, "Not found");
    const type = STATIC_TYPES[path.extname(file).toLowerCase()];
    if (!type) return send(res, 404, "Not found");
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    fs.createReadStream(file).pipe(res);
  } catch {
    send(res, 404, "Not found");
  }
}

const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'";

// ---------- routes ----------

async function handleApi(req, res, url) {
  const ip = req.socket.remoteAddress || "unknown";
  const route = `${req.method} ${url.pathname}`;

  if (route === "POST /api/login") {
    if (throttled(ip)) return send(res, 429, { error: "Too many attempts. Wait a minute and try again." });
    const body = JSON.parse((await readBody(req, 4096)).toString() || "{}");
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      noteFailure(ip);
      return send(res, 401, { error: "Enter your email and password." });
    }
    const anon = await supabaseFor(null);
    const { data, error } = await anon.auth.signInWithPassword({ email: body.email, password: body.password });
    if (error || !data.session) {
      noteFailure(ip);
      return send(res, 401, { error: "Incorrect email or password." });
    }
    // Only allow sign-in for accounts on the admin allowlist.
    const { data: admin } = await anon
      .from("admin_users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!admin) {
      noteFailure(ip);
      return send(res, 403, { error: "This account doesn't have admin access." });
    }
    attempts.delete(ip);
    return send(res, 200, { ok: true }, {
      "Set-Cookie": `lattice_admin=${encodeURIComponent(makeSessionCookie(data.session))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
    });
  }

  if (route === "POST /api/logout") {
    return send(res, 200, { ok: true }, { "Set-Cookie": "lattice_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
  }

  const session = readSession(req);
  if (route === "GET /api/session") return send(res, 200, { authed: !!session, siteUrl: SITE_URL });

  if (!session) return send(res, 401, { error: "Please sign in again." });
  // Custom header on every write: a cross-site form post can't set it.
  if (req.method !== "GET" && req.headers["x-lattice-admin"] !== "1") return send(res, 403, { error: "Forbidden" });

  const supabase = await supabaseFor(session);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return send(res, 401, { error: "Your session ended. Please sign in again." });
  const userId = userData.user.id;

  if (route === "GET /api/content") {
    try {
      const { content, modified } = await loadContent(supabase);
      return send(res, 200, { content, modified });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/content") {
    const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
    const errors = validate(body.content);
    if (errors.length) return send(res, 422, { error: "Some fields need attention.", errors });
    try {
      // Refuse to overwrite edits made elsewhere (another tab, or another admin).
      const current = await loadContent(supabase);
      if (typeof body.baseModified === "number" && current.modified > body.baseModified + 1000) {
        return send(res, 409, { error: "The content changed since you opened it. Reload to see the latest version." });
      }
      const { content, modified } = await saveContent(supabase, body.content, userId);
      return send(res, 200, { ok: true, modified, content });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  const ML_FILE = path.join(ROOT, "..", "content", "translations_ml.json");

  if (route === "GET /api/translations") {
    try {
      let mlContent = {};
      if (fs.existsSync(ML_FILE)) {
        try {
          mlContent = JSON.parse(await fsp.readFile(ML_FILE, "utf8"));
        } catch (err) {
          console.error("Error parsing translations_ml.json:", err);
        }
      }
      try {
        const { data, error } = await supabase.from("content_translations").select("*").eq("language", "ml");
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            if (row.entity_type === "site_content") {
              const parts = row.field_name.split(".");
              let cur = mlContent;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!cur[parts[i]]) cur[parts[i]] = {};
                cur = cur[parts[i]];
              }
              try {
                cur[parts[parts.length - 1]] = JSON.parse(row.value);
              } catch {
                cur[parts[parts.length - 1]] = row.value;
              }
            }
          }
        }
      } catch {}

      return send(res, 200, { language: "ml", content: mlContent });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/translations") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      if (!body.content) return send(res, 400, { error: "Missing content payload" });
      const mlContent = body.content;

      await fsp.writeFile(ML_FILE, JSON.stringify(mlContent, null, 2), "utf8");

      try {
        const rows = [];
        const flatten = (obj, prefix = "") => {
          for (const [k, v] of Object.entries(obj)) {
            const key = prefix ? `${prefix}.${k}` : k;
            if (typeof v === "object" && v !== null && !Array.isArray(v)) {
              flatten(v, key);
            } else {
              rows.push({
                entity_type: "site_content",
                entity_id: "global",
                language: "ml",
                field_name: key,
                value: typeof v === "string" ? v : JSON.stringify(v),
                updated_by: userId,
              });
            }
          }
        };
        flatten(mlContent);

        if (rows.length) {
          await supabase.from("content_translations").upsert(rows, { onConflict: "entity_type,entity_id,language,field_name" });
        }
      } catch (dbErr) {
        console.warn("DB translation upsert:", dbErr.message);
      }

      requestRevalidate();
      return send(res, 200, { ok: true, content: mlContent });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/backups") {
    const { data, error } = await supabase
      .from("content_backups")
      .select("id, created_at, reason")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return send(res, 500, { error: error.message });
    return send(res, 200, {
      backups: (data || []).map((b) => ({
        name: b.reason === "before-restore" ? `${b.id}-before-restore` : b.id,
        time: new Date(b.created_at).getTime(),
      })),
    });
  }

  if (route === "POST /api/restore") {
    const body = JSON.parse((await readBody(req, 4096)).toString());
    if (typeof body.name !== "string") return send(res, 400, { error: "Invalid backup" });
    const backupId = body.name.replace(/-before-restore$/, "");
    const { data: backup, error: fetchErr } = await supabase
      .from("content_backups")
      .select("site_content, projects, team_members")
      .eq("id", backupId)
      .maybeSingle();
    if (fetchErr) return send(res, 500, { error: fetchErr.message });
    if (!backup) return send(res, 404, { error: "Backup not found" });
    const restored = {
      ...backup.site_content,
      work: { ...backup.site_content.work, projects: backup.projects },
      founder: { ...backup.site_content.founder, members: backup.team_members || [] },
    };
    const errors = validate(restored);
    if (errors.length) return send(res, 422, { error: "That backup is not valid content.", errors });
    try {
      await saveContent(supabase, restored, userId, "before-restore");
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/media") {
    const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
    if (error) return send(res, 500, { error: error.message });
    const rows = (data || []).map((m) => ({
      name: m.original_name,
      url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(m.storage_path).data.publicUrl,
      size: Number(m.size),
      time: new Date(m.created_at).getTime(),
      storagePath: m.storage_path,
    }));
    return send(res, 200, { media: rows });
  }

  if (route === "POST /api/upload") {
    const original = decodeURIComponent(String(req.headers["x-filename"] || "image"));
    const { base, ext } = sanitizeFilename(original);
    if (!IMAGE_TYPES[ext]) return send(res, 415, { error: "Only PNG, JPG, WebP, GIF or AVIF images are allowed." });
    const data = await readBody(req, MAX_UPLOAD);
    if (!data.length) return send(res, 400, { error: "Empty file" });
    const magicOk =
      (ext === ".png" && data.subarray(0, 4).toString("hex") === "89504e47") ||
      ([".jpg", ".jpeg"].includes(ext) && data[0] === 0xff && data[1] === 0xd8) ||
      (ext === ".gif" && data.subarray(0, 3).toString() === "GIF") ||
      (ext === ".webp" && data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP") ||
      (ext === ".avif" && data.subarray(4, 12).toString().includes("ftyp"));
    if (!magicOk) return send(res, 415, { error: "That file doesn't look like a real image." });

    const storagePath = `${base}-${crypto.randomBytes(3).toString("hex")}${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, data, { contentType: IMAGE_TYPES[ext], upsert: false });
    if (uploadErr) return send(res, 500, { error: uploadErr.message });

    const { error: insertErr } = await supabase.from("media").insert({
      storage_path: storagePath,
      original_name: original,
      size: data.length,
      mime_type: IMAGE_TYPES[ext],
      uploaded_by: userId,
    });
    if (insertErr) {
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      return send(res, 500, { error: insertErr.message });
    }

    const url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    return send(res, 200, { url, name: original });
  }

  if (route === "DELETE /api/media") {
    const storagePath = url.searchParams.get("name") || "";
    if (!storagePath || storagePath !== path.basename(storagePath)) return send(res, 400, { error: "Invalid file" });
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    await supabase.from("media").delete().eq("storage_path", storagePath);
    return send(res, 200, { ok: true });
  }

  if (route === "GET /api/services") {
    try {
      const [{ data: services, error: sErr }, { data: packages, error: pErr }, { data: features, error: fErr }] = await Promise.all([
        supabase.from("services").select("*").order("display_order", { ascending: true }),
        supabase.from("service_packages").select("*").order("display_order", { ascending: true }),
        supabase.from("package_features").select("*").order("display_order", { ascending: true }),
      ]);
      if (sErr) throw sErr;
      if (pErr) throw pErr;
      if (fErr) throw fErr;

      const featureMap = new Map();
      for (const f of features || []) {
        if (!featureMap.has(f.package_id)) featureMap.set(f.package_id, []);
        featureMap.get(f.package_id).push(f.feature);
      }

      const packageMap = new Map();
      for (const p of packages || []) {
        if (!packageMap.has(p.service_id)) packageMap.set(p.service_id, []);
        packageMap.get(p.service_id).push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          priceLabel: p.price_label,
          billingType: p.billing_type,
          badge: p.badge,
          isFeatured: p.is_featured,
          isActive: p.is_active,
          displayOrder: p.display_order,
          features: featureMap.get(p.id) || [],
        });
      }

      const fullServices = (services || []).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        indexNum: s.index_num,
        description: s.description,
        shortDescription: s.short_description,
        icon: s.icon,
        imageUrl: s.image_url,
        startingPrice: Number(s.starting_price),
        priceLabel: s.price_label,
        billingType: s.billing_type,
        isFeatured: s.is_featured,
        isActive: s.is_active,
        displayOrder: s.display_order,
        packages: packageMap.get(s.id) || [],
      }));

      return send(res, 200, { services: fullServices });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/services") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const services = Array.isArray(body.services) ? body.services : [];

      const { data: existingServices, error: exSErr } = await supabase.from("services").select("id");
      if (exSErr) throw exSErr;
      const incomingServiceIds = new Set(services.map((s) => s.id));
      const toDeleteServices = (existingServices || []).map((s) => s.id).filter((id) => !incomingServiceIds.has(id));
      if (toDeleteServices.length) {
        await supabase.from("services").delete().in("id", toDeleteServices);
      }

      const allPackages = [];
      for (let sIdx = 0; sIdx < services.length; sIdx++) {
        const s = services[sIdx];
        const { error: sUpErr } = await supabase.from("services").upsert({
          id: s.id,
          name: s.name,
          slug: s.slug || slug(s.name),
          index_num: s.indexNum || String(sIdx + 1).padStart(2, "0"),
          description: s.description || "",
          short_description: s.shortDescription || "",
          icon: s.icon || null,
          image_url: s.imageUrl || null,
          starting_price: Number(s.startingPrice || 0),
          price_label: s.priceLabel || "From ₹0",
          billing_type: s.billingType || "one_time",
          is_featured: !!s.isFeatured,
          is_active: s.isActive !== false,
          display_order: sIdx,
          updated_by: userId,
        });
        if (sUpErr) throw sUpErr;

        if (Array.isArray(s.packages)) {
          for (let pIdx = 0; pIdx < s.packages.length; pIdx++) {
            const p = s.packages[pIdx];
            allPackages.push({ ...p, service_id: s.id, display_order: pIdx });
          }
        }
      }

      const { data: existingPackages, error: exPErr } = await supabase.from("service_packages").select("id");
      if (exPErr) throw exPErr;
      const incomingPkgIds = new Set(allPackages.map((p) => p.id));
      const toDeletePkgs = (existingPackages || []).map((p) => p.id).filter((id) => !incomingPkgIds.has(id));
      if (toDeletePkgs.length) {
        await supabase.from("service_packages").delete().in("id", toDeletePkgs);
      }

      for (const p of allPackages) {
        const { error: pUpErr } = await supabase.from("service_packages").upsert({
          id: p.id,
          service_id: p.service_id,
          name: p.name,
          slug: p.slug || slug(p.name),
          description: p.description || "",
          price: Number(p.price || 0),
          price_label: p.priceLabel || "₹0",
          billing_type: p.billingType || "one_time",
          badge: p.badge || null,
          is_featured: !!p.isFeatured,
          is_active: p.isActive !== false,
          display_order: p.display_order,
          updated_by: userId,
        });
        if (pUpErr) throw pUpErr;

        await supabase.from("package_features").delete().eq("package_id", p.id);
        if (Array.isArray(p.features) && p.features.length) {
          const featureRows = p.features.map((feat, fIdx) => ({
            package_id: p.id,
            feature: typeof feat === "string" ? feat : feat.feature || "",
            display_order: fIdx,
          })).filter((r) => r.feature.trim().length > 0);
          if (featureRows.length) {
            const { error: fInsErr } = await supabase.from("package_features").insert(featureRows);
            if (fInsErr) throw fInsErr;
          }
        }
      }

      requestRevalidate();
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/art-directions") {
    try {
      const { data, error } = await supabase.from("art_directions").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      const list = (data || []).map((ad) => ({
        id: ad.id,
        name: ad.name,
        slug: ad.slug,
        category: ad.category,
        tier: ad.tier,
        description: ad.description,
        imageUrl: ad.image_url,
        accentColor: ad.accent_color,
        typography: ad.typography,
        tags: ad.tags || [],
        startingPrice: Number(ad.starting_price),
        priceLabel: ad.price_label,
        isFeatured: ad.is_featured,
        isActive: ad.is_active,
        displayOrder: ad.display_order,
      }));
      return send(res, 200, { artDirections: list });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/art-directions") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const list = Array.isArray(body.artDirections) ? body.artDirections : [];

      const { data: existing, error: exErr } = await supabase.from("art_directions").select("id");
      if (exErr) throw exErr;
      const incomingIds = new Set(list.map((item) => item.id));
      const toDelete = (existing || []).map((item) => item.id).filter((id) => !incomingIds.has(id));
      if (toDelete.length) {
        await supabase.from("art_directions").delete().in("id", toDelete);
      }

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const { error: upErr } = await supabase.from("art_directions").upsert({
          id: item.id,
          name: item.name,
          slug: item.slug || slug(item.name),
          category: item.category || "international",
          tier: item.tier || "standard",
          description: item.description || "",
          image_url: item.imageUrl || null,
          accent_color: item.accentColor || "#7c8cff",
          typography: item.typography || "",
          tags: Array.isArray(item.tags) ? item.tags : [],
          starting_price: Number(item.startingPrice || 0),
          price_label: item.priceLabel || "Included",
          is_featured: !!item.isFeatured,
          is_active: item.isActive !== false,
          display_order: i,
          updated_by: userId,
        });
        if (upErr) throw upErr;
      }

      requestRevalidate();
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/hosting-plans") {
    try {
      const [{ data: plans, error: plErr }, { data: features, error: ftErr }] = await Promise.all([
        supabase.from("hosting_plans").select("*").order("display_order", { ascending: true }),
        supabase.from("hosting_plan_features").select("*").order("display_order", { ascending: true }),
      ]);
      if (plErr) throw plErr;
      if (ftErr) throw ftErr;

      const featMap = new Map();
      for (const f of features || []) {
        if (!featMap.has(f.hosting_plan_id)) featMap.set(f.hosting_plan_id, []);
        featMap.get(f.hosting_plan_id).push(f.feature);
      }

      const list = (plans || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        priceLabel: p.price_label,
        billingType: p.billing_type,
        isFeatured: p.is_featured,
        isActive: p.is_active,
        displayOrder: p.display_order,
        features: featMap.get(p.id) || [],
      }));

      return send(res, 200, { hostingPlans: list });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/hosting-plans") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const list = Array.isArray(body.hostingPlans) ? body.hostingPlans : [];

      const { data: existing, error: exErr } = await supabase.from("hosting_plans").select("id");
      if (exErr) throw exErr;
      const incomingIds = new Set(list.map((p) => p.id));
      const toDelete = (existing || []).map((p) => p.id).filter((id) => !incomingIds.has(id));
      if (toDelete.length) {
        await supabase.from("hosting_plans").delete().in("id", toDelete);
      }

      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const { error: upErr } = await supabase.from("hosting_plans").upsert({
          id: p.id,
          name: p.name,
          slug: p.slug || slug(p.name),
          description: p.description || "",
          price: Number(p.price || 0),
          price_label: p.priceLabel || "₹0/year",
          billing_type: p.billingType || "yearly",
          is_featured: !!p.isFeatured,
          is_active: p.isActive !== false,
          display_order: i,
          updated_by: userId,
        });
        if (upErr) throw upErr;

        await supabase.from("hosting_plan_features").delete().eq("hosting_plan_id", p.id);
        if (Array.isArray(p.features) && p.features.length) {
          const rows = p.features.map((feat, fIdx) => ({
            hosting_plan_id: p.id,
            feature: typeof feat === "string" ? feat : feat.feature || "",
            display_order: fIdx,
          })).filter((r) => r.feature.trim().length > 0);
          if (rows.length) {
            const { error: fErr } = await supabase.from("hosting_plan_features").insert(rows);
            if (fErr) throw fErr;
          }
        }
      }

      requestRevalidate();
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/pricing-addons") {
    try {
      const { data, error } = await supabase.from("pricing_addons").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      const list = (data || []).map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        price: Number(a.price),
        priceLabel: a.price_label,
        billingType: a.billing_type,
        category: a.category,
        isActive: a.is_active,
        displayOrder: a.display_order,
      }));
      return send(res, 200, { addons: list });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/pricing-addons") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const list = Array.isArray(body.addons) ? body.addons : [];

      const { data: existing, error: exErr } = await supabase.from("pricing_addons").select("id");
      if (exErr) throw exErr;
      const incomingIds = new Set(list.map((a) => a.id));
      const toDelete = (existing || []).map((a) => a.id).filter((id) => !incomingIds.has(id));
      if (toDelete.length) {
        await supabase.from("pricing_addons").delete().in("id", toDelete);
      }

      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        const { error: upErr } = await supabase.from("pricing_addons").upsert({
          id: a.id,
          name: a.name,
          description: a.description || "",
          price: Number(a.price || 0),
          price_label: a.priceLabel || "₹0",
          billing_type: a.billingType || "one_time",
          category: a.category || "General",
          is_active: a.isActive !== false,
          display_order: i,
          updated_by: userId,
        });
        if (upErr) throw upErr;
      }

      requestRevalidate();
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "GET /api/enquiries") {
    try {
      const { data, error } = await supabase.from("project_enquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const list = (data || []).map((e) => ({
        id: e.id,
        name: e.name,
        businessName: e.business_name,
        email: e.email,
        phone: e.phone,
        requestedServices: e.requested_services || [],
        budget: e.budget,
        description: e.description,
        status: e.status,
        notes: e.notes || "",
        createdAt: new Date(e.created_at).getTime(),
      }));
      return send(res, 200, { enquiries: list });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PATCH /api/enquiries") {
    try {
      const body = JSON.parse((await readBody(req, 4096)).toString());
      if (!body.id) return send(res, 400, { error: "Missing enquiry id" });
      const updates = {};
      if (typeof body.status === "string") updates.status = body.status;
      if (typeof body.notes === "string") updates.notes = body.notes;
      const { error } = await supabase.from("project_enquiries").update(updates).eq("id", body.id);
      if (error) throw error;
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "DELETE /api/enquiries") {
    try {
      const id = url.searchParams.get("id");
      if (!id) return send(res, 400, { error: "Missing enquiry id" });
      const { error } = await supabase.from("project_enquiries").delete().eq("id", id);
      if (error) throw error;
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  const ML_JSON_PATH = path.resolve(ROOT, "..", "content", "translations_ml.json");

  if (route === "GET /api/translations") {
    try {
      const language = url.searchParams.get("language") || url.searchParams.get("lang") || "ml";
      let rows = [];
      try {
        const { data, error } = await supabase
          .from("content_translations")
          .select("*")
          .eq("language", language);
        if (!error && Array.isArray(data)) rows = data;
      } catch (err) {
        // Table might not exist yet; will fall back to JSON file
      }

      let fallbackJson = {};
      if (fs.existsSync(ML_JSON_PATH)) {
        try {
          fallbackJson = JSON.parse(fs.readFileSync(ML_JSON_PATH, "utf8"));
        } catch {}
      }

      return send(res, 200, { ok: true, content: fallbackJson, translations: rows, language });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  if (route === "PUT /api/translations") {
    try {
      const body = JSON.parse((await readBody(req, MAX_JSON)).toString());
      const language = body.language || "ml";
      const translations = Array.isArray(body.translations) ? body.translations : [];
      const contentToSave = body.content || body.fallbackJson;

      if (translations.length) {
        try {
          const upsertRows = translations.map((t) => ({
            entity_type: t.entity_type,
            entity_id: String(t.entity_id),
            language,
            field_name: t.field_name,
            value: String(t.value || ""),
            updated_at: new Date().toISOString(),
          }));
          await supabase.from("content_translations").upsert(upsertRows, {
            onConflict: "entity_type,entity_id,language,field_name",
          });
        } catch (dbErr) {
          console.warn("Could not upsert to content_translations table:", dbErr.message);
        }
      }

      // Persist full JSON structure
      if (contentToSave && typeof contentToSave === "object") {
        try {
          fs.writeFileSync(ML_JSON_PATH, JSON.stringify(contentToSave, null, 2), "utf8");
        } catch (fErr) {
          console.warn("Could not write to translations_ml.json:", fErr.message);
        }
      }

      requestRevalidate();
      return send(res, 200, { ok: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  return send(res, 404, { error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader("Referrer-Policy", "same-origin");
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
    return await serveFile(res, PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  } catch (err) {
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    if (status === 500) console.error(err);
    if (!res.headersSent) send(res, status, { error: status === 500 ? "Something went wrong on the server." : err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\nLattice admin  →  http://${HOST === "127.0.0.1" ? "localhost" : HOST}:${PORT}`);
  console.log(`Supabase       →  ${cfg.SUPABASE_URL}`);
});
