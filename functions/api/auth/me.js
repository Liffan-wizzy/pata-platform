import { json } from "../../_lib/http.js";
import { currentUser } from "../../_lib/auth.js";
export async function onRequestGet({request,env}) {
  const user=await currentUser(request,env);
  return json({user});
}