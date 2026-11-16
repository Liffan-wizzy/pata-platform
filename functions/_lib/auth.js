import { json } from "./http.js";

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const part = header.split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}
export async function currentUser(request, env) {
  const token = getCookie(request, "pata_session");
  if (!token) return null;
  const row = await env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.country, u.city
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.id=? AND s.expires_at>? AND u.is_active=1
  `).bind(token, Math.floor(Date.now()/1000)).first();
  return row || null;
}
export async function requireUser(request, env) {
  const user = await currentUser(request, env);
  return user || json({ error: "Please sign in to continue." }, 401);
}
export async function requireAdmin(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Please sign in." }, 401);
  if (user.role !== "ADMIN") return json({ error: "Administrator access required." }, 403);
  return user;
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, key, 256);
  const toHex = a => [...a].map(x => x.toString(16).padStart(2,"0")).join("");
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}
export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = (stored || "").split(":");
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(x => parseInt(x,16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, key, 256);
  const actual = [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2,"0")).join("");
  return actual === hashHex;
}