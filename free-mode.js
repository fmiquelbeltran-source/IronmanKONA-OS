import {TYPES, DAYS, addDays, dateLabel, minLabel, totalPlanned, weeklyMetrics, buildReview} from './data.js';
import {activityWeek,importedWeekSummary} from './activity-import.js';

const clean = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (x, low=0, high=100) => Math.max(low,Math.min(high,Number(x)||0));

export function statisticsView(state) {
  const weeks = [...state.weeks].sort((a,b)=>a.start.localeCompare(b.start));
  const rows = weeks.slice(-12).map(week=>({week,metrics:weeklyMetrics(week,state)}));
  const measured = rows.filter(({metrics:m})=>m.logged>0);
  const totalMin = measured.reduce((n,{metrics:m})=>n+m.minutes,0);
  const totalDone = measured.reduce((n,{metrics:m})=>n+m.done,0);
  const totalLogged = measured.reduce((n,{metrics:m})=>n+m.logged,0);
  const totalSessions = measured.reduce((n,{metrics:m})=>n+m.total,0);
  const typeMinutes = Object.fromEntries(Object.keys(TYPES).map(t=>[t,0]));
  const typeCount = Object.fromEntries(Object.keys(TYPES).map(t=>[t,0]));
  const effort = [];
  weeks.forEach(w=>w.sessions.forEach(s=>{const log=state.logs[s.id];if(log?.status!=='done')return;typeMinutes[s.type]=(typeMinutes[s.type]||0)+(Number(log.actualMinutes)||s.minutes);typeCount[s.type]=(typeCount[s.type]||0)+1;if(Number(log.rpe)>=1&&Number(log.rpe)<=10)effort.push(Number(log.rpe));}));
  const allTypeMin=Object.values(typeMinutes).reduce((a,b)=>a+b,0);
  const maxWeek=Math.max(60,...rows.map(({week,metrics:m})=>Math.max(totalPlanned(week),m.minutes)));
  const available = measured.length ? `${minLabel(totalMin)}` : '—';
  const adherence = totalSessions ? `${Math.round(totalDone/totalSessions*100)}%` : '—';
  const avgRpe = effort.length ? (effort.reduce((a,b)=>a+b,0)/effort.length).toFixed(1)+'/10' : '—';
  return `<div class="page-head"><div class="eyebrow">PROGRESO / DATOS</div><h1>Estadísticas deportivas</h1><p class="subtitle">Tus datos reales, sin suscripciones y sin cálculos inventados. Las semanas sin registros se muestran como pendientes.</p></div>
  <div class="grid cols4">${stat('Entrenamiento registrado',available,`${measured.length} semanas con datos`)}${stat('Sesiones completadas',String(totalDone),`${totalLogged} sesiones informadas`)}${stat('Adherencia',adherence,'De las semanas con registros')}${stat('RPE medio',avgRpe,`${effort.length} sesiones con RPE`)}</div>
  <div class="panel section"><div class="panel-head"><div><h2>Volumen semanal</h2><p>Previsto frente a realizado · últimas 12 semanas</p></div></div>
  <div class="free-week-chart">${rows.map(({week:w,metrics:m})=>`<div class="free-week-row"><span class="free-week-label">${dateLabel(w.start)}</span><div class="free-week-bars"><div class="free-track"><span class="free-bar-planned" style="width:${clamp(totalPlanned(w)/maxWeek*100)}%"></span></div><div class="free-track"><span class="free-bar-real" style="width:${clamp(m.minutes/maxWeek*100)}%"></span></div></div><span class="free-week-number">${m.logged?minLabel(Math.round(m.minutes)):'Pendiente'}</span></div>`).join('')}</div>
  <p class="caption">Azul: previsto · Verde: realizado. Cuando solo se ha registrado parte de la semana, los resultados son provisionales.</p></div>
  <div class="grid cols2 section"><div class="panel"><h2>Minutos por disciplina</h2><p class="caption" style="margin:10px 0 18px">Acumulado de las sesiones completadas</p>${Object.keys(TYPES).map(t=>`<div class="free-discipline"><div class="free-discipline-head"><b>${clean(TYPES[t].name)}</b><span>${minLabel(Math.round(typeMinutes[t]))} · ${typeCount[t]} sesiones</span></div><div class="free-track"><span class="free-bar-real" style="width:${clamp(typeMinutes[t]/Math.max(allTypeMin,1)*100)}%"></span></div></div>`).join('')}</div><div class="panel"><h2>Lectura de los datos</h2><div class="focus-list" style="margin-top:18px"><div class="focus"><span class="n">01</span><div><strong>Progresión sostenible</strong><p>Más minutos no siempre significa más rendimiento. Compara sensaciones, potencia y pulso.</p></div></div><div class="focus"><span class="n">02</span><div><strong>Calidad del seguimiento</strong><p>Marca también las sesiones omitidas y anota sueño y fatiga.</p></div></div><div class="focus"><span class="n">03</span><div><strong>Datos personales</strong><p>Se guardan en este navegador. Exporta copias JSON frecuentes desde Ajustes.</p></div></div></div></div></div>`;
}
function stat(label,value,foot){return `<div class="panel stat"><div class="statlabel">${label}</div><div class="num">${value}</div><div class="statfoot">${foot}</div></div>`;}

export function sundayReport(w,state){
  const review=buildReview(w,state),m=review.metrics;
  const sessions=w.sessions.map(s=>{const l=state.logs[s.id]||{};return {fecha:s.date,disciplina:TYPES[s.type]?.name||s.type,tipo:s.type,nombre:s.title,objetivo_min:s.minutes,estado:l.status||'pendiente',min_reales:l.status==='done'?(l.actualMinutes??s.minutes):null,rpe:l.rpe??null,fc_media:l.hr??null,potencia_media_W:l.power??null,ritmo:l.pace??null,carbohidratos_durante_g:l.carbs??null,notas:l.notes||''};});
  const recovery=Object.entries(state.daily).filter(([date])=>date>=w.start&&date<=addDays(w.start,6)).sort(([a],[b])=>a.localeCompare(b)).map(([date,r])=>({fecha:date,sueno_h:r.sleep??null,fatiga:r.fatigue??null,fc_reposo:r.restHR??null,hrv:r.hrv??null,sintomas:r.symptom||'sin registrar',notas:r.notes||''}));
  const externalActivities=activityWeek(state,w).map(a=>({fecha:a.date,tipo:a.type,nombre:a.title,minutos:a.minutes,distancia_m:a.distanceM,fc_media:a.hr,potencia_media_W:a.watts,carga_reportada:a.trainingLoad,vinculada_a_sesion:!!a.linkedSessionId,fuente:a.source}));
  const externalSummary=importedWeekSummary(state,w);
  const payload={actividades_importadas_resumen:externalSummary,actividades_importadas:externalActivities,nota_duplicidad:'Las actividades importadas vinculadas ya cuentan también en las sesiones completadas; no sumar dos veces.',objetivo:'Clasificación por grupo de edad para Kona 2030',semana:w.start,fase:w.title,objetivo_de_semana:w.focus,disponibilidad_h:Number(state.settings.weeklyTarget||11),peso_referencia_kg:Number(state.settings.weight||70),contexto_de_salud_y_restricciones:state.settings.notes||'',minutos_previstos:m.planned,minutos_realizados:m.minutes,sesiones_previstas:m.total,sesiones_informadas:m.logged,sesiones_completadas:m.done, fatiga_media:m.avgFatigue, molestias_nasales_registradas:m.hasNasal,datos_recuperacion_dias:m.daysReported,revision_local:review,sesiones:sessions,recovery};
  const next=addDays(w.start,7);
  return `PROYECTO KONA 2030 · REVISIÓN DOMINICAL\nQuiero que actúes como mi entrenador de triatlón de larga distancia y analices estos datos de KONA OS. Son datos reales del registro local. Objetivo: progresar hacia la clasificación a Kona 2030.\n\nInstrucciones:\n1. Analiza adherencia, volumen, carga percibida, distribución por disciplinas, recuperación y nutrición documentada. Distingue datos ausentes de datos normales. Nunca inventes métricas.\n2. Si hay síntomas nasales, fatiga alta o falta de datos suficientes, plantea recuperación/clarificaciones; no aumentes la carga. No sustituyas el consejo médico.\n3. Explica 3-5 conclusiones y las prioridades para la semana del ${next}. Mi máximo habitual es de 10-12 horas, pero NO debemos alcanzarlo de golpe tras la septoplastia; progreso gradual, RPE suave al inicio y jueves de descanso cuando proceda.\n4. Sugiere ajustes nutricionales orientativos según cada tipo de día, sin dietas restrictivas ni datos clínicos inventados.\n5. Si la información permite planificar, responde además con UN BLOQUE JSON VÁLIDO que pueda pegar en «Importar propuesta de ChatGPT» de Kona OS, usando este esquema exacto:\n\n\`\`\`json\n{"summary":"Conclusión corta","focus":"Objetivo de la nueva semana","recommendation":"Prioridades y precauciones","sessions":[{"dayIndex":0,"type":"run","minutes":30,"title":"Running suave","detail":"Indicaciones claras y RPE"}]}\n\`\`\`\n\nTipos válidos: run, bike, swim, strength, mobility. dayIndex: 0=Lunes, ..., 6=Domingo. 3-25 sesiones, de 10-240 minutos cada una. No superar la disponibilidad semanal ni aumentar más de ~10% el volumen previsto sin motivo. Si no hay suficientes datos o existen molestias relevantes, explica por qué y NO proporciones JSON de aumento de carga. Yo aprobaré cualquier cambio antes de aplicarlo.\n\nDATOS REGISTRADOS:\n${JSON.stringify(payload,null,2)}`;
}

export function parseChatGPTPlan(raw) {
  const t=String(raw||'').trim();if(!t)throw Error('Pega el bloque JSON que te he devuelto en ChatGPT.');
  let body=t;const fenced=t.match(/```(?:json)?\s*([\s\S]*?)```/i);if(fenced)body=fenced[1].trim();
  let x;try{x=JSON.parse(body);}catch{throw Error('No se ha podido leer el JSON. Copia el bloque completo entre ```json y ``` sin modificarlo.');}
  if(!x||Array.isArray(x)||typeof x!=='object'||!Array.isArray(x.sessions))throw Error('La propuesta debe incluir una lista de sesiones.');
  for(const name of ['summary','focus','recommendation'])if(typeof x[name]!=='string'||x[name].length>2500)throw Error(`Falta el campo ${name} o contiene demasiado texto.`);
  if(x.sessions.length<3||x.sessions.length>25)throw Error('Debe haber entre 3 y 25 sesiones.');
  for(const s of x.sessions){if(typeof s.title!=='string'||!s.title.trim()||s.title.length>110||typeof s.detail!=='string'||s.detail.length>600)throw Error('Título o instrucciones incorrectos en una sesión.');}
  return x;
}
