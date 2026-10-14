// Lectura desde puente Windows: sin claves de Garmin, Strava ni Intervals en Kona OS.
// Los registros se guardan localmente; nunca se completan sesiones sin aprobación.
import {mergeActivities} from './activity-import.js';
const URL='http://127.0.0.1:23571/api/snapshot';
export const POLL_INTERVAL=300000;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>{const v=Number(x);return x===null||x===undefined||x===''||!Number.isFinite(v)?null:v;};
const choose=(o,keys)=>{for(const k of keys)if(o?.[k]!==null&&o?.[k]!==undefined&&o[k]!=='')return o[k];return null;};
const normalizeSport=x=>{const s=String(x||'').toLowerCase().replace(/[^a-z]/g,'');
 if(/ride|cycling|biking|bikeride|bike|velocipede/.test(s))return 'bike';
 if(/run|jog|treadmill/.test(s))return 'run';
 if(/swim|natacion/.test(s))return 'swim';
 if(/strength|weight|workout|gym/.test(s))return 'strength';
 if(/walk|yoga|stretch|mobility|pilates/.test(s))return 'mobility';return null;};
function date(raw){const m=String(raw||'').match(/^(\d{4}-\d\d-\d\d)/);if(!m)return null;const d=new Date(m[1]+'T12:00:00Z');return Number.isNaN(+d)||d.toISOString().slice(0,10)!==m[1]?null:m[1];}
export function normalizeDomestiqueActivity(a){
 if(!a||typeof a!=='object')return null;
 const s=a.summary&&typeof a.summary==='object'?a.summary:{};
 const type=normalizeSport(choose(a,['sport','sport_type','type'])||choose(s,['sport','type']));
 const sourceDate=choose(a,['start_date_local','started_at','start_date','date'])||choose(s,['started_at','date']);
 const day=date(sourceDate);
 const direct=choose(a,['duration_min','moving_minutes']);
 const seconds=choose(a,['duration_s','moving_time','elapsed_time','duration_sec'])||choose(s,['duration_s','moving_time']);
 const minutes=direct!==null?n(direct):(n(seconds)!==null?n(seconds)/60:null);
 if(!day||!type||minutes===null||minutes<1||minutes>1500)return null;
 const rawId=String(choose(a,['id','activity_id','ride_id'])||choose(s,['id','activity_id'])||'').trim();
 const cleanId=rawId.replace(/^icu[_-]/,'');
 const dist=n(choose(a,['distance_m','distance_meters','distance'])||choose(s,['distance_m','distance_meters','distance']));
 const distanceKm=n(choose(a,['distance_km'])||choose(s,['distance_km']));
 const title=String(choose(a,['name','title'])||choose(s,['name','title'])||type).slice(0,110);
 const avgHr=n(choose(a,['avg_hr','average_heartrate'])||choose(s,['avg_hr']));
 const power=n(choose(a,['avg_power','avg_power_w','average_watts'])||choose(s,['avg_power','avg_power_w']));
 const tss=n(choose(a,['tss','icu_training_load','training_load'])||choose(s,['tss']));
 const cadence=n(choose(a,['avg_cadence','cadence','average_cadence'])||choose(s,['avg_cadence','cadence']));
 const elevationM=n(choose(a,['elevation_gain','total_elevation_gain','elevation_m'])||choose(s,['elevation_gain','total_elevation_gain']));
 const normalizedPower=n(choose(a,['normalized_power','normalized_power_w','np','weighted_average_watts'])||choose(s,['normalized_power','normalized_power_w','np']));
 const maxHr=n(choose(a,['max_hr','max_heartrate'])||choose(s,['max_hr']));
 return {id:cleanId?`intervals-${cleanId}`:`domestique-${day}-${type}-${Math.round(minutes)}-${title.replace(/[^a-z0-9]/gi,'').slice(0,20)}`,
   source:'Domestique local',sourceDate:String(sourceDate),date:day,type,title,
   minutes:Math.round(minutes),elapsedSec:n(seconds),distanceM:dist??(distanceKm!==null?distanceKm*1000:null),hr:avgHr,watts:power,trainingLoad:tss,cadence,elevationM,normalizedPower,maxHr,
   importedAt:new Date().toISOString()};
}
export function parseDomestiqueSnapshot(raw){
 if(!raw?.ok||!Array.isArray(raw.activities))throw Error('Domestique devolvió una respuesta no reconocida.');
 const items=raw.activities.map(normalizeDomestiqueActivity).filter(Boolean);
 // Devolver solo la mejor representación de la misma actividad (archivo local suele dar más métricas).
 const uniq=new Map();
 for(const a of items){const old=uniq.get(a.id);if(!old)uniq.set(a.id,a);else if([a.distanceM,a.hr,a.watts,a.trainingLoad].filter(x=>x!==null).length > [old.distanceM,old.hr,old.watts,old.trainingLoad].filter(x=>x!==null).length)uniq.set(a.id,a);}
 const wellness=Array.isArray(raw.wellness)?raw.wellness.filter(x=>date(x.date||x.id)).map(x=>({date:date(x.date||x.id),hrv:n(x.hrv),rhr:n(x.rhr),sleepHours:n(x.sleep_h),sleepScore:n(x.sleep_score),ctl:n(x.ctl),atl:n(x.atl),tsb:n(x.tsb)})).slice(0,30):[];
 return {activities:[...uniq.values()],wellness,port:raw.domestique_port??null,warnings:raw.warnings||[]};
}
export function applyDomestiqueSnapshot(state,parsed){
 const result=mergeActivities(state,parsed.activities);
 const store=state.domestiqueWellness&&typeof state.domestiqueWellness==='object'?state.domestiqueWellness:{};
 let updated=0;
 for(const rec of parsed.wellness){if(JSON.stringify(store[rec.date])!==JSON.stringify(rec)){store[rec.date]=rec;updated++;}}
 state.domestiqueWellness=Object.fromEntries(Object.entries(store).sort(([a],[b])=>b.localeCompare(a)).slice(0,120));
 state.domestiqueLastSync=new Date().toISOString();
 return {...result,wellnessUpdated:updated};
}
export async function fetchDomestiqueSnapshot(){
 const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),19000);
 try{
   const res=await fetch(URL,{method:'GET',mode:'cors',cache:'no-store',credentials:'omit',signal:abort.signal});
   let data;try{data=await res.json();}catch{throw Error('El puente respondió con datos no válidos.');}
   if(!res.ok)throw Error(data.error||`Error local HTTP ${res.status}`);
   return parseDomestiqueSnapshot(data);
 }finally{clearTimeout(timer);}
}
export function bridgePanel(status,state){
 const last=state.domestiqueLastSync?new Date(state.domestiqueLastSync).toLocaleString('es-ES'):'Nunca';
 const klass=status.connected?'success':status.pending?'info':'warning';
 const statusText=status.connected?`Conectado · ${status.imported||0} actividades nuevas en la última consulta`:(status.pending?'Buscando Domestique en Windows…':'Esperando puente local · Inicia Domestique y el archivo INICIAR_PUENTE.bat');
 return `<div class="panel section"><div class="panel-head"><div><div class="eyebrow">SINCRONIZACIÓN LOCAL GRATUITA</div><h2>Domestique → KONA OS</h2><p>Al abrir Kona OS en este PC, busca tus nuevas actividades; consulta de nuevo cada 5 minutos mientras la web esté abierta.</p></div><button type="button" class="btn secondary" data-domestique-sync="1">↻ Sincronizar ahora</button></div>
  <div class="notice ${klass}"><strong>${safe(statusText)}</strong><p style="margin-top:5px">Última conexión correcta: ${safe(last)}. ${status.error&&!status.pending?safe(status.error):''}</p></div>
  <p class="caption" style="margin-top:14px">Requiere Domestique abierto y el pequeño puente de Windows ejecutándose en el mismo ordenador. No guarda contraseñas. Si hay actividades compatibles, podrás vincularlas manualmente al plan. Los datos no se envían a GitHub.</p>
  <p class="caption" style="margin-top:8px">En el móvil o con el PC apagado la sincronización local no funciona. Para proteger tus datos, haz una copia JSON desde Ajustes cada domingo.</p></div>`;
}
