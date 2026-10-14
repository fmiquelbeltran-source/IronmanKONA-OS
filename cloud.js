// Ninguna clave privada se guarda en el navegador: solo URL y clave publicable/anon.
const CONFIG_KEY='konaos_cloud_config';const SESSION_KEY='konaos_cloud_session';
export const getConfig=()=>{try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')}catch{return {}}};
export const getSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
export const configured=()=>Boolean(getConfig().url&&getConfig().key);
export function setConfig(url,key){if(!/^https:\/\/[a-z\d-]+\.supabase\.co\/?$/i.test(url.trim()))throw Error('Introduce la URL HTTPS de tu proyecto Supabase (https://xxxx.supabase.co).');if(!key.trim())throw Error('Introduce la clave PUBLICABLE (o anon), nunca la service_role.');localStorage.setItem(CONFIG_KEY,JSON.stringify({url:url.trim().replace(/\/$/,''),key:key.trim()}));}
export function logout(){localStorage.removeItem(SESSION_KEY);}
function urlFor(path){return `${getConfig().url}${path}`;}
async function call(path,{method='GET',body,token,headers={}}={}){if(!configured())throw Error('Primero configura Supabase en Ajustes.');const r=await fetch(urlFor(path),{method,headers:{apikey:getConfig().key,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{Authorization:`Bearer ${getConfig().key}`}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}if(!r.ok)throw Error(data?.msg||data?.error_description||data?.message||data?.error||`Error HTTP ${r.status}`);return data;}
export async function login(email,password){const d=await call('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});if(!d.access_token)throw Error('No se ha iniciado la sesión.');localStorage.setItem(SESSION_KEY,JSON.stringify(d));return d;}
export async function signup(email,password){return call('/auth/v1/signup',{method:'POST',body:{email,password}});}
export async function sessionValid(){let s=getSession();if(!s)return null;const exp=s.expires_at||(s.expires_in&&s.issued_at?s.issued_at+s.expires_in:0);if(exp&&Date.now()/1000<exp-90)return s;if(!s.refresh_token){logout();return null;}try{const d=await call('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}});localStorage.setItem(SESSION_KEY,JSON.stringify(d));return d;}catch{logout();return null;}}
export async function me(){const s=await sessionValid();if(!s)throw Error('Inicia sesión.');return call('/auth/v1/user',{token:s.access_token});}
export async function pushState(state){const session=await sessionValid();if(!session)throw Error('Inicia sesión antes de sincronizar.');const user=await me();await call('/rest/v1/kona_profiles?on_conflict=user_id',{method:'POST',token:session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:user.id,payload:state,updated_at:new Date().toISOString()}});return true;}
export async function pullState(){const session=await sessionValid();if(!session)throw Error('Inicia sesión antes de recuperar datos.');const user=await me();const result=await call(`/rest/v1/kona_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=payload,updated_at`,{token:session.access_token});return result?.[0]||null;}
export async function askCoach(payload){const s=await sessionValid();if(!s)throw Error('Debes iniciar sesión para utilizar el entrenador IA.');return call('/functions/v1/kona-coach',{method:'POST',token:s.access_token,body:payload});}

// Actividades en tabla independiente: el proceso dominical nunca pisa planes ni registros manuales.
export async function pullActivities(){
 const s=await sessionValid();if(!s)throw Error('Inicia sesión para acceder a tus actividades en la nube.');
 const rows=await call('/rest/v1/kona_activities?select=payload&order=recorded_at.desc&limit=1000',{token:s.access_token});
 return Array.isArray(rows)?rows.map(x=>x.payload).filter(x=>x&&typeof x.id==='string'&&typeof x.date==='string'):[];
}
export async function upsertActivities(activities){
 if(!activities?.length)return 0;
 const s=await sessionValid();if(!s)return 0;
 const user=await me();
 const rows=activities.filter(a=>a?.id&&a?.date).slice(0,250).map(a=>({user_id:user.id,source_id:a.id,recorded_at:a.date,payload:a}));
 for(let i=0;i<rows.length;i+=60){await call('/rest/v1/kona_activities?on_conflict=user_id,source_id',{method:'POST',token:s.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows.slice(i,i+60)});}
 return rows.length;
}

// Salud Conectada: SOLO los registros de la cuenta autenticada (RLS en Supabase).
export async function pullWellness(){
 const s=await sessionValid(); if(!s)throw Error('Inicia sesión para consultar tu recuperación.');
 const rows=await call('/rest/v1/kona_wellness?select=day,payload&order=day.desc&limit=120',{token:s.access_token});
 return Array.isArray(rows)?rows.map(x=>({...x.payload,date:x.day})).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)):[];
}
