// KONA OS 2030: importación LOCAL de actividades multideporte (CSV Intervals.icu).
// No realiza conexiones de red ni solicita contraseñas.
import {TYPES,addDays,minLabel,dateLabel} from './data.js';

const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const number=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:null;};
function csvRows(text){
  // Soporta filas multilineales, comillas escapadas y BOM UTF-8.
  const rows=[];let row=[],cell='',quote=false;const input=text.replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(ch==='"'){if(quote&&input[i+1]==='"'){cell+='"';i++;}else quote=!quote;}
    else if(ch===','&&!quote){row.push(cell);cell='';}
    else if((ch==='\r'||ch==='\n')&&!quote){if(ch==='\r'&&input[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[];}
    else cell+=ch;
  }
  if(quote)throw Error('CSV incompleto: hay comillas sin cerrar.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length>20001)throw Error('Importa como máximo 20.000 filas por archivo.');
  return rows;
}
const pick=(x,...keys)=>{for(const k of keys){const n=normalize(k);if(x[n]!==undefined&&x[n]!==null&&String(x[n]).trim()!=='')return x[n];}return '';};
function sport(raw){const t=normalize(raw);
  if(/^(ride|virtualride|mountainbikeride|gravelride|ebikeride|cycling|bike|bikeride)/.test(t))return 'bike';
  if(/^(run|virtualrun|trailrun|running|treadmill)/.test(t))return 'run';
  if(/^(swim|poolswim|openwaterswim|swimming)/.test(t))return 'swim';
  if(/^(weighttraining|strengthtraining|workout|strength)/.test(t))return 'strength';
  if(/^(yoga|pilates|mobility|stretching)/.test(t))return 'mobility';
  return '';
}
function seconds(value){if(value===undefined||value===null||value==='')return null;
  const x=String(value).trim();if(x.includes(':')){const z=x.split(':').map(number);if(z.some(v=>v===null))return null;return z.reduce((sum,v)=>sum*60+v,0);}
  return number(x);
}
const dateFrom=value=>{const m=String(value||'').match(/^(\d{4}-\d\d-\d\d)/);if(!m)return '';const d=new Date(m[1]+'T12:00:00');return Number.isNaN(+d)||d.toISOString().slice(0,10)!==m[1]?'':m[1];};
export function parseActivitiesCsv(csv){
  if(typeof csv!=='string'||csv.length>14_000_000)throw Error('CSV vacío o demasiado grande (máximo 14 MB).');
  const rows=csvRows(csv);if(rows.length<2)throw Error('CSV sin registros de actividades.');
  const header=rows.shift().map(normalize);
  if(!(header.some(k=>['startdatelocal','startdate','date','fecha'].includes(k))&&header.some(k=>['type','sport','sporttype','tipo'].includes(k))))throw Error('No reconozco las columnas de fechas y deporte. Exporta el CSV de actividades de Intervals.icu.');
  const activities=[];let excluded=0;
  for(const row of rows){const obj={};header.forEach((h,i)=>obj[h]=row[i]||'');
    const type=sport(pick(obj,'type','sport','sporttype','tipo'));const date=dateFrom(pick(obj,'start_date_local','start_date','date','fecha'));
    const sec=seconds(pick(obj,'moving_time','elapsed_time','duration','duracion'));
    const minutes=sec===null?null:Math.round(sec/60);
    if(!type||!date||minutes===null||minutes<=0||minutes>1500){excluded++;continue;}
    const rawId=pick(obj,'id','activity_id','activityid');
    const start=pick(obj,'start_date_local','start_date','date','fecha');
    const distance=number(pick(obj,'distance','distance_m'));
    const hr=number(pick(obj,'average_heartrate','average_hr','avg_hr','heart_rate_avg'));
    const watts=number(pick(obj,'average_watts','weighted_average_watts','avg_power'));
    const load=number(pick(obj,'icu_training_load','training_load','tss'));
    const name=pick(obj,'name','title','nombre')||TYPES[type].name;
    const id=rawId?`intervals-${rawId}`:`intervals-${start}-${type}-${minutes}-${distance??''}`;
    activities.push({id,source:'Intervals.icu CSV',sourceDate:start,date,type,title:String(name).slice(0,110),minutes,distanceM:distance,hr,watts,trainingLoad:load,importedAt:new Date().toISOString()});
  }
  return {activities,excluded,read:rows.length};
}
export function mergeActivities(state,newItems){
  const originals=Array.isArray(state.importedActivities)?state.importedActivities:[];
  const keys=new Set(originals.map(a=>a.id));let added=0;
  for(const a of newItems){if(keys.has(a.id))continue;keys.add(a.id);originals.push(a);added++;}
  originals.sort((a,b)=>b.date.localeCompare(a.date));state.importedActivities=originals;return {added,duplicates:newItems.length-added};
}
export function activityWeek(state,week){return (state.importedActivities||[]).filter(a=>a.date>=week.start&&a.date<=addDays(week.start,6));}
export function importedWeekSummary(state,week){const list=activityWeek(state,week);return {count:list.length,minutes:list.reduce((n,a)=>n+a.minutes,0),distanceM:list.reduce((n,a)=>n+(a.distanceM||0),0)};}
export function linkableSession(state,activity){
  if((state.logs||{})[activity.linkedSessionId]?.status==='done')return null;
  const matching=(state.weeks||[]).flatMap(w=>w.sessions||[]).filter(s=>s.date===activity.date&&s.type===activity.type);
  return matching.length===1&&state.logs[matching[0].id]?.status!=='done'?matching[0]:null;
}
export function importedActivitiesView(state){const list=(state.importedActivities||[]), recent=list.slice(0,90);
  const total=list.reduce((n,a)=>n+a.minutes,0), swim=list.filter(a=>a.type==='swim').length,bike=list.filter(a=>a.type==='bike').length,run=list.filter(a=>a.type==='run').length;
  return `<div class="page-head"><div class="eyebrow">FUENTES DE DATOS / GRATUITO</div><h1>Garmin · Strava · Domestique</h1><p class="subtitle">Primera fase: importa actividades exportadas como CSV desde Intervals.icu. Kona OS conserva tus datos en este navegador, sin claves ni suscripciones.</p></div>
  <div class="notice info"><strong>Por qué Intervals.icu</strong><p>Domestique utiliza Intervals.icu, pero está centrado en el ciclismo. Un CSV de actividades compatible nos permite leer también running y natación. Debido a las limitaciones de las APIs de Garmin y Strava, algunas actividades pueden no exportarse; importa solo datos propios obtenidos legítimamente.</p></div>
  <div class="grid cols4 section">${card('Actividades importadas',list.length)}${card('Tiempo importado',minLabel(total))}${card('Running',run)}${card('Ciclismo / Natación',`${bike} / ${swim}`)}</div>
  <div class="panel section"><div class="panel-head"><div><h2>Importar actividades</h2><p>Selecciona el CSV de actividades que exportes desde tu cuenta de Intervals.icu.</p></div></div>
  <div class="tagrow"><button class="btn" data-activity-upload="1">↑ Importar CSV de actividades</button><input type="file" id="activities-csv-import" accept=".csv,text/csv" hidden/><a class="btn secondary" href="https://intervals.icu" target="_blank" rel="noreferrer noopener">Abrir Intervals.icu ↗</a></div><p class="caption" style="margin-top:15px">Repetir una importación no duplica actividades con el mismo identificador. El CSV se analiza únicamente en tu dispositivo. No introduzcas credenciales ni claves API en esta página.</p>
  <div class="notice info" style="margin-top:16px"><strong>Modo sincronización local:</strong> la web detecta el puente en Windows cuando está encendido y vuelve a consultar datos cada cinco minutos. También puedes importar CSV manualmente. Sin el ordenador encendido no hay sincronización.</div></div>
  <div class="panel section"><h2>Actividades recuperadas</h2><p class="caption" style="margin:12px 0">Para evitar duplicar minutos, los entrenamientos importados no se consideran completados en la planificación hasta que los vincules. Solo se ofrece vincular cuando hay una única sesión del mismo deporte y fecha.</p>
  ${recent.length?`<div class="session-list" style="margin-top:18px">${recent.map(a=>{const linked=Boolean(a.linkedSessionId),target=linkableSession(state,a);const dist=a.distanceM!==null&&a.distanceM!==undefined?(a.type==='swim'?`${Math.round(a.distanceM)} m`:`${(a.distanceM/1000).toFixed(2)} km`):'';return `<div class="session"><div class="sicon ${(TYPES[a.type]||{}).css||''}">${TYPES[a.type]?.icon||'•'}</div><div class="sinfo"><strong>${safe(a.title)}</strong><small>${dateLabel(a.date)} · ${safe(TYPES[a.type]?.name||a.type)} · ${minLabel(a.minutes)} ${dist?safe('· '+dist):''}${a.hr?' · FC '+a.hr:''}${a.watts?' · '+a.watts+' W':''}</small></div>${linked?'<span class="status done">✓ Vinculada</span>':target?`<button class="btn small secondary" data-activity-link="${safe(a.id)}">Vincular</button>`:'<span class="status">Importada</span>'}</div>`;}).join('')}</div>`:'<div class="empty">Aún no has importado actividades. Importa un CSV para verlas aquí.</div>'}</div>`;
}
const card=(name,val)=>`<div class="panel stat"><div class="statlabel">${name}</div><div class="num">${val}</div></div>`;
export function attachActivityToPlan(state,id){const a=(state.importedActivities||[]).find(x=>x.id===id);if(!a)throw Error('Actividad no encontrada.');if(a.linkedSessionId)throw Error('La actividad ya está vinculada.');const target=linkableSession(state,a);if(!target)throw Error('No hay una única sesión compatible en ese día.');if(state.logs[target.id]?.status==='done')throw Error('La sesión ya está marcada como completada.');
  state.logs[target.id]={...(state.logs[target.id]||{}),status:'done',actualMinutes:a.minutes,hr:a.hr,power:a.watts,notes:`Importado desde ${a.source}: ${a.title}${a.trainingLoad!==null?` · carga ${a.trainingLoad}`:''}`,sourceActivityId:a.id,updatedAt:new Date().toISOString()};a.linkedSessionId=target.id;return target;
}
