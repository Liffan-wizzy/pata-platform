import {json,body,id,clean} from "../../_lib/http.js";
import {currentUser} from "../../_lib/auth.js";
export async function onRequestPost({request,env}) {
 const user=await currentUser(request,env);if(!user)return json({error:"Sign in required."},401);
 const d=await body(request), listing=clean(d.listing_id,80), reason=clean(d.reason,500);
 if(!listing||reason.length<5)return json({error:"Select a listing and explain the concern."},400);
 const exists=await env.DB.prepare("SELECT id FROM listings WHERE id=?").bind(listing).first();
 if(!exists)return json({error:"Listing not found."},404);
 await env.DB.prepare("INSERT INTO reports (id,reporter_id,listing_id,reason) VALUES (?,?,?,?)").bind(id(),user.id,listing,reason).run();
 return json({ok:true},201);
}