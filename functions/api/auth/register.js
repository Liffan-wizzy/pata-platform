import { json, body, id, clean, validEmail, cookie } from "../../_lib/http.js";
import { hashPassword } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const data = await body(request);
  const name = clean(data.name, 100), email = clean(data.email, 190).toLowerCase();
  const password = typeof data.password === "string" ? data.password : "";
  const country = clean(data.country, 80) || "Kenya", city = clean(data.city, 100);
  if (name.length < 2 || !validEmail(email) || password.length < 10) {
    return json({ error: "Enter your name, a valid email and a password of at least 10 characters." }, 400);
  }
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (exists) return json({ error: "An account with this email already exists." }, 409);
  const userId = id(), sessionId = id();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare("INSERT INTO users (id,name,email,password_hash,country,city) VALUES (?,?,?,?,?,?)")
    .bind(userId,name,email,passwordHash,country,city).run();
  await env.DB.prepare("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)")
    .bind(sessionId,userId,Math.floor(Date.now()/1000)+60*60*24*30).run();
  return new Response(JSON.stringify({ user: { id:userId,name,email,role:"USER",country,city } }), {
    headers: { "content-type":"application/json", "cache-control":"no-store", "set-cookie":cookie("pata_session",sessionId,{maxAge:60*60*24*30}) }
  });
}