import { json, body, clean, validEmail, cookie } from "../../_lib/http.js";
import { hashPassword, verifyPassword } from "../../_lib/auth.js";
export async function onRequestPost({ request, env }) {
  const data = await body(request), email = clean(data.email,190).toLowerCase();
  const password = typeof data.password === "string" ? data.password : "";
  if (!validEmail(email) || !password) return json({error:"Enter your email and password."},400);
  const user = await env.DB.prepare("SELECT * FROM users WHERE email=? AND is_active=1").bind(email).first();
  if (!user || !(await verifyPassword(password,user.password_hash))) return json({error:"Incorrect email or password."},401);
  const sessionId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)")
    .bind(sessionId,user.id,Math.floor(Date.now()/1000)+60*60*24*30).run();
  return new Response(JSON.stringify({user:{id:user.id,name:user.name,email:user.email,role:user.role,country:user.country,city:user.city}}), {
    headers:{"content-type":"application/json","cache-control":"no-store","set-cookie":cookie("pata_session",sessionId,{maxAge:60*60*24*30})}
  });
}