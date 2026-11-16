import { json, body, id, clean } from "../../_lib/http.js";
import { currentUser } from "../../_lib/auth.js";
const TYPES=["JOB","SERVICE","HELP","EXCHANGE","OPPORTUNITY"];
export async function onRequestGet({request,env}) {
  const url=new URL(request.url), q=clean(url.searchParams.get("q"),100), type=url.searchParams.get("type"), city=clean(url.searchParams.get("city"),100);
  let sql=`SELECT l.*,u.name AS owner_name FROM listings l JOIN users u ON u.id=l.user_id WHERE l.status='OPEN'`;
  const params=[];
  if(TYPES.includes(type)){sql+=" AND l.type=?";params.push(type);}
  if(q){sql+=" AND (l.title LIKE ? OR l.description LIKE ? OR l.category LIKE ?)";params.push(`%${q}%`,`%${q}%`,`%${q}%`);}
  if(city){sql+=" AND l.city LIKE ?";params.push(`%${city}%`);}
  sql+=" ORDER BY l.created_at DESC LIMIT 100";
  const {results}=await env.DB.prepare(sql).bind(...params).all();
  return json({listings:results||[]});
}
export async function onRequestPost({request,env}) {
  const user=await currentUser(request,env); if(!user)return json({error:"Sign in to post."},401);
  const d=await body(request), type=clean(d.type,20).toUpperCase(), title=clean(d.title,120), description=clean(d.description,3000);
  if(!TYPES.includes(type)||title.length<5||description.length<20)return json({error:"Choose a category and provide a title and description (at least 20 characters)."},400);
  const listingId=id();
  await env.DB.prepare(`INSERT INTO listings (id,user_id,type,title,description,category,country,city,budget_amount,budget_currency,contact_method)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(listingId,user.id,type,title,description,clean(d.category,80)||"General",clean(d.country,80)||user.country,clean(d.city,100)||user.city,Number.isFinite(Number(d.budget))&&d.budget!==""?Number(d.budget):null,clean(d.currency,8)||"KES",clean(d.contact,60)||"PATA messages").run();
  return json({ok:true,id:listingId},201);
}