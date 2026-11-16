import {json,body,clean} from "../../_lib/http.js";
import {requireAdmin} from "../../_lib/auth.js";
export async function onRequestPost({request,env}) {
 const user=await requireAdmin(request,env);if(user instanceof Response)return user;
 const d=await body(request), email=clean(d.email,190).toLowerCase();
 const target=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
 if(!target)return json({error:"User not found."},404);
 await env.DB.prepare("UPDATE users SET role='ADMIN' WHERE id=?").bind(target.id).run();
 return json({ok:true});
}