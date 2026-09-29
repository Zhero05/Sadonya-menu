/**
 * Sadonya image service (Cloudflare Worker + R2).
 *
 *   GET  /img/<menu>/<folder>/<file>.jpg    public, serves a photo from R2
 *   PUT  /upload/<menu>/<folder>/<file>.jpg staff only, stores a photo in R2
 *
 * Needs ONE binding: an R2 bucket bound to the variable name  BUCKET.
 * The values below are all public (the Supabase publishable key is meant to be in the browser).
 */
const SUPABASE_URL = "https://ykdulxriwbfotphuynwl.supabase.co";
const SUPABASE_KEY = "sb_publishable_huFfiSuOebKgVlejq_r7Eg_cZ9mBSuP";
const ALLOWED_ORIGINS = [
  "https://sadonya-menu.netlify.app",
  "https://sadonya-cafe.netlify.app",
];
const MENUS = ["sadonya-cafe", "sadonya-plus"];
const FOLDERS = ["items", "branding"];
const MAX_BYTES = 1024 * 1024; // 1 MB per photo (menu photos are ~30-60 KB)
const NAME_RE = /^[A-Za-z0-9._-]{1,120}\.jpg$/;

function corsFor(origin) {
  const h = {
    "Access-Control-Allow-Methods": "GET, HEAD, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

// Split "<menu>/<folder>/<file>.jpg" and validate every part.
function parseKey(path) {
  const parts = path.split("/");
  if (parts.length !== 3) return null;
  const [menu, folder, file] = parts;
  if (!MENUS.includes(menu) || !FOLDERS.includes(folder) || !NAME_RE.test(file)) return null;
  return { menu, key: `${menu}/${folder}/${file}` };
}

// Confirms the caller is a logged-in Supabase user who has access to this menu.
async function isStaffForMenu(token, menu) {
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` };
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!u.ok) return false;
  const user = await u.json();
  if (!user || !user.id) return false;
  const q =
    `${SUPABASE_URL}/rest/v1/branch_access?select=branch_key` +
    `&user_id=eq.${encodeURIComponent(user.id)}&branch_key=eq.${encodeURIComponent(menu)}`;
  const r = await fetch(q, { headers });
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsFor(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // ---- public: read a photo ----
    if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/img/")) {
      const parsed = parseKey(decodeURIComponent(url.pathname.slice(5)));
      if (!parsed) return new Response("Not found", { status: 404 });
      const obj = await env.BUCKET.get(parsed.key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(request.method === "HEAD" ? null : obj.body, {
        headers: {
          "Content-Type": "image/jpeg",
          // The site adds ?v=<timestamp> whenever a photo changes, so this is safe to cache for a year.
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // ---- staff only: upload a photo ----
    if (request.method === "PUT" && url.pathname.startsWith("/upload/")) {
      if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origin not allowed" }, 403, cors);
      const parsed = parseKey(decodeURIComponent(url.pathname.slice(8)));
      if (!parsed) return json({ error: "Bad path" }, 400, cors);

      const auth = request.headers.get("Authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!token) return json({ error: "Login required" }, 401, cors);
      let allowed = false;
      try { allowed = await isStaffForMenu(token, parsed.menu); } catch (e) { allowed = false; }
      if (!allowed) return json({ error: "Not allowed for this menu" }, 403, cors);

      const declared = Number(request.headers.get("Content-Length") || 0);
      if (declared > MAX_BYTES) return json({ error: "Image too large" }, 413, cors);
      const buf = await request.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return json({ error: "Image too large" }, 413, cors);
      const b = new Uint8Array(buf, 0, 3);
      if (!(b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)) return json({ error: "JPEG images only" }, 415, cors);

      await env.BUCKET.put(parsed.key, buf, { httpMetadata: { contentType: "image/jpeg" } });
      return json({ url: `${url.origin}/img/${parsed.key}?v=${Date.now()}` }, 200, cors);
    }

    return new Response("Sadonya image service", { status: 200, headers: cors });
  },
};
