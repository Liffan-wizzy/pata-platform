import {json} from "../../_lib/http.js";
import {requireAdmin} from "../../_lib/auth.js";
export async function onRequestGet({request,env}) {
 const user=await requireAdmin(request,env);if(user instanceof Response)return user;
 const [users,listings,applications,reports]=await Promise.all([
  env.DB.prepare("SELECT COUNT(*) AS n FROM users").first(),
  env.DB.prepare("SELECT COUNT(*) AS n FROM listings").first(),
  env.DB.prepare("SELECT COUNT(*) AS n FROM applications").first(),
  env.DB.prepare("SELECT COUNT(*) AS n FROM reports").first()
 ]);
 const {results}=await env.DB.prepare(`SELECT r.*,l.title,u.name AS reporter_name FROM reports r JOIN listings l ON l.id=r.listing_id JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC LIMIT 50`).all();
 return json({stats:{users:users.n,listings:listings.n,applications:applications.n,reports:reports.n},reports:results||[]});
}