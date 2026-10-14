// Google Health y Strava llegan por Android Health Connect, no mediante APIs privadas en el navegador.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=x=>x===null||x===undefined||x===''?null:Number.isFinite(Number(x))?Number(x):null;
export function normalizeHealthWellness(raw){
 if(!raw||typeof raw!=='object'||!/\d{4}-\d\d-\d\d/.test(String(raw.date||'')))return null;
 const date=raw.date.slice(0,10);
 return {date,hrv:number(raw.hrv),rhr:number(raw.rhr),sleepHours:number(raw.sleepHours),sleepScore:number(raw.sleepScore),source:'Salud Conectada',updatedAt:raw.updatedAt||null};
}
export function mergeHealthWellness(state,items){
 if(!state.healthWellness||typeof state.healthWellness!=='object')state.healthWellness={};let changed=0;
 for(const item of items){const w=normalizeHealthWellness(item);if(!w)continue;
  const existing=state.healthWellness[w.date]||{};
  // Los nulos nunca borran métricas recuperadas en sincronizaciones anteriores.
  const next={...existing,source:'Salud Conectada'};
  for(const key of ['hrv','rhr','sleepHours','sleepScore'])if(w[key]!==null)next[key]=w[key];
  if(JSON.stringify(existing)!==JSON.stringify(next)){state.healthWellness[w.date]=next;changed++;}
 }
 return changed;
}
export function healthConnectPanel(session,activitiesStatus,wellnessStatus){return `<div class="panel section"><div class="panel-head"><div><h2>Google Health + Strava</h2><p>Una única fuente de entrada: Salud Conectada en tu Android.</p></div></div>
 <div class="grid cols2" style="margin-top:14px"><div class="notice info"><strong>Google Health · Recuperación</strong><p>Sueño, HRV y frecuencia cardíaca en reposo. Disponibles solo si Google Health realmente los comparte con Salud Conectada.</p></div><div class="notice info"><strong>Strava · Entrenamientos</strong><p>Strava para Android puede escribir ejercicios con GPS (duración, distancia y calorías) en Salud Conectada. No incluye necesariamente vatios, intervalos o todas las actividades.</p></div></div>
 <div class="tagrow" style="margin-top:15px"><button class="btn" type="button" data-cloud-activities="1">↻ Actualizar desde nube</button><button class="btn secondary" data-nav="settings" type="button">Configurar nube</button></div>
 <p class="caption" style="margin-top:13px">${esc(activitiesStatus||'Entrenamientos: pendiente de consultar')} · ${esc(wellnessStatus||'Recuperación: pendiente de consultar')}</p>
 <div class="notice ${session?'info':'warning'}" style="margin-top:14px"><strong>${session?'Web conectada a tu sesión de Supabase':'Nube todavía no iniciada'}</strong><p>El conector requiere instalar una aplicación Android y conceder permisos a Salud Conectada. Esta web NO puede conectarse por sí sola a los datos de salud. No usamos Domestique ni su puente.</p></div></div>`;}
export function healthWellnessPanel(state){const entries=Object.entries(state.healthWellness||{}).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14);
 const fmt=(v,s='')=>v===null||v===undefined?'—':`${esc(v)}${s}`;
 return `<div class="panel section"><div class="panel-head"><div><h2>Recuperación · Google Health</h2><p>Últimos días recibidos desde Salud Conectada. No sustituyen la valoración de síntomas ni los registros del diario.</p></div></div>
 ${entries.length?`<div class="sport-summary-table"><div class="sport-summary-row head"><span>Fecha</span><span>Sueño</span><span>HRV</span><span>FC reposo</span><span>Fuente</span></div>${entries.map(([d,r])=>`<div class="sport-summary-row"><strong>${esc(d)}</strong><span>${fmt(r.sleepHours,' h')}</span><span>${fmt(r.hrv,' ms')}</span><span>${fmt(r.rhr,' lpm')}</span><span>Google Health</span></div>`).join('')}</div>`:'<p class="caption" style="margin-top:12px">Todavía no hay días de recuperación recibidos. Necesitas la aplicación Android, permisos y la nube configurada.</p>'}</div>`;}
