import { json, body, clean } from "../../_lib/http.js";
import { currentUser } from "../../_lib/auth.js";
export async function onRequestGet({params,env}) {
 const row=await env.DB.prepare("SELECT l.*,u.name AS owner_name FROM listings l JOIN users u ON u.id=l.user_id WHERE l.id=? AND l.status!='REMOVED'").bind(params.id).first();
 return row?json({listing:row}):json({error:"Listing not found."},404);
}
export async function onRequestPatch({request,params,env}) {
 const user=await currentUser(request,env); if(!user)return json({error:"Sign in required."},401);
 const row=await env.DB.prepare("SELECT * FROM listings WHERE id=?").bind(params.id).first();
 if(!row)return json({error:"Listing not found."},404);
 if(row.user_id!==user.id && user.role!=="ADMIN")return json({error:"Not allowed."},403);
 const d=await body(request), status=["OPEN","PAUSED","CLOSED","REMOVED"].includes(d.status)?d.status:row.status;
 await env.DB.prepare("UPDATE listings SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,params.id).run();
 return json({ok:true});
}