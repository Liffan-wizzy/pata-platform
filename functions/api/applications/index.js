import { json, body, id, clean } from "../../_lib/http.js";
import { currentUser } from "../../_lib/auth.js";
export async function onRequestGet({request,env}) {
 const user=await currentUser(request,env);if(!user)return json({error:"Sign in required."},401);
 const {results}=await env.DB.prepare(`SELECT a.*,l.title AS listing_title,l.user_id AS owner_id,u.name AS applicant_name
 FROM applications a JOIN listings l ON l.id=a.listing_id JOIN users u ON u.id=a.applicant_id
 WHERE a.applicant_id=? OR l.user_id=? ORDER BY a.created_at DESC LIMIT 100`).bind(user.id,user.id).all();
 return json({applications:results||[]});
}
export async function onRequestPost({request,env}) {
 const user=await currentUser(request,env);if(!user)return json({error:"Sign in to apply."},401);
 const d=await body(request), listingId=clean(d.listing_id,80), message=clean(d.message,1500);
 if(message.length<10)return json({error:"Please write at least 10 characters."},400);
 const listing=await env.DB.prepare("SELECT * FROM listings WHERE id=? AND status='OPEN'").bind(listingId).first();
 if(!listing)return json({error:"This opportunity is no longer open."},404);
 if(listing.user_id===user.id)return json({error:"You cannot apply to your own listing."},400);
 const existing=await env.DB.prepare("SELECT id FROM applications WHERE listing_id=? AND applicant_id=?").bind(listingId,user.id).first();
 if(existing)return json({error:"You have already responded to this listing."},409);
 await env.DB.prepare("INSERT INTO applications (id,listing_id,applicant_id,message) VALUES (?,?,?,?)").bind(id(),listingId,user.id,message).run();
 return json({ok:true},201);
}
export async function onRequestPatch({request,env}) {
 const user=await currentUser(request,env);if(!user)return json({error:"Sign in required."},401);
 const d=await body(request), status=["ACCEPTED","DECLINED","WITHDRAWN"].includes(d.status)?d.status:null;
 if(!status)return json({error:"Invalid status."},400);
 const app=await env.DB.prepare("SELECT a.id,l.user_id AS owner_id,a.applicant_id FROM applications a JOIN listings l ON l.id=a.listing_id WHERE a.id=?").bind(clean(d.id,80)).first();
 if(!app)return json({error:"Response not found."},404);
 if(user.id!==app.owner_id && user.id!==app.applicant_id && user.role!=="ADMIN")return json({error:"Not allowed."},403);
 await env.DB.prepare("UPDATE applications SET status=? WHERE id=?").bind(status,d.id).run();
 return json({ok:true});
}