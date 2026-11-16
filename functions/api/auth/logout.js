import { json, clearCookie } from "../../_lib/http.js";
export async function onRequestPost({request,env}) {
  const token=(request.headers.get("Cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("pata_session="))?.slice(13);
  if(token) await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(decodeURIComponent(token)).run();
  return new Response(JSON.stringify({ok:true}),{headers:{"content-type":"application/json","set-cookie":clearCookie("pata_session")}});
}