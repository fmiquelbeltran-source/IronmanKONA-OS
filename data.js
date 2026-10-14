export const APP_KEY='konaos2030_v1';
export const TYPES={run:{name:'Running',icon:'↗',css:'run'},bike:{name:'Ciclismo',icon:'◉',css:'bike'},swim:{name:'Natación',icon:'≈',css:'swim'},strength:{name:'Fuerza',icon:'◆',css:'strength'},mobility:{name:'Movilidad',icon:'✳',css:'mobility'}};
export const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const dateLabel=iso=>new Date(iso+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});
export const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const startOfWeek=(value)=>{const d=new Date(value+'T12:00:00');return addDays(value,-((d.getDay()+6)%7));};
export const minLabel=m=>`${Math.floor(m/60)}h ${String(m%60).padStart(2,'0')}m`;
const item=(date,type,minutes,title,detail)=>({id:`${date}-${type}-${Math.random().toString(36).slice(2,7)}`,date,type,minutes,title,detail,intensity:'Suave · RPE 2–4'});
const week=(start,title,focus,days)=>({start,title,focus,createdBy:'Programa inicial',sessions:days.flatMap((d,i)=>d.map(([type,minutes,title,detail])=>item(addDays(start,i),type,minutes,title,detail))),review:null});
export function seedWeeks(){return [
 week('2026-11-02','Reintroducción','Prioridad: tolerancia tras septoplastia, técnica y constancia.',[
 [['run',30,'Caminar + trotar','Alternar 3 min trote / 3 min marcha. Si aparece presión nasal, parar el trote.']],
 [['swim',30,'Natación técnica','25–50 m suaves, descansos amplios, sin apneas.'],['strength',25,'Fuerza de control','Movimientos básicos suaves, sin Valsalva ni WOD intensos.']],
 [['run',30,'Trotar y caminar','Mismo esfuerzo muy suave que el lunes.'],['mobility',20,'Movilidad','Cadera, tobillo, columna torácica y respiración natural.']],[],
 [['strength',30,'Fuerza funcional suave','Técnica y estabilidad, sin cargas máximas.']],
 [['bike',90,'Bicicleta aeróbica','Rodillo o exterior, puedes mantener una conversación completa.']],
 [['bike',80,'Bicicleta de base','Rodaje suave sin buscar vatios ni desnivel.']]
 ]),
 week('2026-11-09','Adaptación','Repetir la rutina; trote continuo solo si no aparecen molestias.',[
 [['run',30,'Running suave','Alternar marcha si es necesario.']],
 [['swim',35,'Técnica de natación','Respiración sin forzar y control postural.'],['strength',30,'Fuerza general','Bajo esfuerzo y ejecución controlada.']],
 [['swim',30,'Natación fácil','Bloques cortos con recuperación.'],['run',30,'Carrera suave','Conversación completa, sin intervalos.']],[],
 [['strength',35,'Fuerza general','Estabilidad, zona media y técnica.'],['run',25,'Trote suave','Sustituir por marcha si hay presión.']],
 [['bike',100,'Bici aeróbica','Sin picos intensos de potencia.']],
 [['bike',85,'Bici ligera','Cadencia cómoda y recuperación.']]
 ]),
 week('2026-11-16','Construcción','Primer incremento modesto; ninguna sesión máxima.',[
 [['run',35,'Running fácil','RPE 2–4; puede incluir marcha.']],
 [['swim',40,'Técnica + continuidad','Distancias cortas y descanso según sensaciones.'],['strength',35,'Fuerza controlada','Sin bloqueo respiratorio.']],
 [['swim',40,'Natación aeróbica','Técnica antes de ritmo.'],['run',35,'Running fácil','20 min centrales homogéneos si procede.']],[],
 [['strength',35,'Fuerza controlada','Trabajo global y estabilidad.'],['run',30,'Running suave','Rodaje de recuperación.']],
 [['bike',120,'Bici aeróbica larga','30 min centrales estables para observar FC y potencia, sin test máximo.']],
 [['bike',95,'Bici cómoda','Rodaje totalmente conversacional.']]
 ]),
 week('2026-11-23','Descarga','Reducir volumen, revisar sensaciones y consolidar hábitos.',[
 [['run',30,'Running fácil','Sin objetivos de ritmo.']],
 [['swim',30,'Natación técnica','Bajo volumen, trabajo de forma.'],['strength',25,'Fuerza ligera','Control corporal.']],
 [['swim',30,'Natación suave','Sin exigencia respiratoria.'],['run',30,'Running cómodo','No forzar.']],[],
 [['strength',25,'Fuerza ligera','Sin fatiga muscular intensa.'],['run',20,'Running opcional','Marcha si persisten molestias.']],
 [['bike',90,'Bicicleta fácil','Aeróbico ligero.']],
 [['bike',65,'Ciclismo recuperación','Mantener cadencia y comodidad.']]
 ])];}
export function initialState(){return {version:1,settings:{name:'Francesc',weight:70,height:175,weeklyTarget:11,weekdayAvail:105,weekendAvail:210,restingHR:'',notes:'Retorno conservador tras septoplastia (18/09/2026). Abril 2027: prueba de esfuerzo running y ciclismo, biomecánica.'},weeks:seedWeeks(),logs:{},daily:{},tests:[],createdAt:new Date().toISOString()};}
export function loadState(){try{const data=JSON.parse(localStorage.getItem(APP_KEY)||'null');if(data&&Array.isArray(data.weeks)&&data.settings&&data.logs&&data.daily){return data;}}catch{}return initialState();}
export function saveState(s){localStorage.setItem(APP_KEY,JSON.stringify(s));}
export function totalPlanned(w){return w.sessions.reduce((n,s)=>n+s.minutes,0);}
export function weeklyMetrics(w,s){const logs=w.sessions.map(x=>({session:x,...s.logs[x.id]}));const logged=logs.filter(x=>x.status==='done'||x.status==='skipped');const done=logs.filter(x=>x.status==='done');const minutes=done.reduce((n,x)=>n+(Number(x.actualMinutes)||x.session.minutes),0);const relevantDaily=Object.entries(s.daily||{}).filter(([key])=>key>=w.start&&key<=addDays(w.start,6)).map(([,v])=>v);const reportedFatigue=relevantDaily.filter(v=>Number(v.fatigue)>=1&&Number(v.fatigue)<=10).map(v=>Number(v.fatigue));const avgFatigue=reportedFatigue.length?reportedFatigue.reduce((a,b)=>a+b,0)/reportedFatigue.length:null;const hasNasal=relevantDaily.some(v=>['nasal','alarm'].includes(v.symptom));const lowSleep=relevantDaily.filter(v=>v.sleep&&Number(v.sleep)<7).length;const completedRatio=w.sessions.length?done.length/w.sessions.length:0;return {total:w.sessions.length,logged:logged.length,done:done.length,skipped:logs.filter(x=>x.status==='skipped').length,minutes,planned:totalPlanned(w),completedRatio,avgFatigue,hasNasal,lowSleep,daysReported:relevantDaily.length,avgRpe:done.filter(x=>x.rpe).length?done.filter(x=>x.rpe).reduce((n,x)=>n+Number(x.rpe),0)/done.filter(x=>x.rpe).length:null};}
export function buildReview(w,s){const m=weeklyMetrics(w,s);if(m.total===0||m.logged<Math.ceil(m.total*.7))return {ready:false,metrics:m,summary:'Evaluación incompleta: necesitamos registrar al menos el 70% de las sesiones como realizadas u omitidas antes de ajustar el plan.',insights:[`Hay ${m.logged} sesiones registradas de ${m.total}. Completa los registros para evitar decisiones basadas en información insuficiente.`,'Registra también sueño, fatiga y posibles molestias para interpretar la semana.'],recommendation:'Aún no se puede concluir si corresponde aumentar, mantener o reducir la carga.',level:'unknown'};let level='normal';if(m.hasNasal||m.avgFatigue!==null&&m.avgFatigue>=7)level='protect';else if(m.completedRatio<.7||m.lowSleep>=3||m.daysReported<3)level='hold';const insights=[];insights.push(`Has completado ${m.done} de ${m.total} sesiones previstas (${Math.round(m.completedRatio*100)}%). Total realizado: ${minLabel(Math.round(m.minutes))} frente a ${minLabel(m.planned)} programados.`);if(m.avgFatigue!==null)insights.push(`Fatiga media comunicada: ${m.avgFatigue.toFixed(1)}/10, con ${m.daysReported} registros diarios.`);else insights.push('Faltan datos diarios de fatiga: la interpretación es provisional.');if(m.hasNasal)insights.push('Se han registrado molestias nasales: no incrementar carga y consultar si se mantienen o aumentan.');if(m.daysReported<3)insights.push('Hay menos de tres días de recuperación registrados: evitaremos subir carga sin una referencia suficiente.');if(m.lowSleep>=3)insights.push('En varios días el sueño comunicado fue inferior a 7 horas.');if(m.avgRpe!==null)insights.push(`RPE medio de sesiones completadas: ${m.avgRpe.toFixed(1)}/10.`);return {ready:true,metrics:m,level,summary:level==='protect'?'Hay señales que aconsejan priorizar recuperación y reevaluar síntomas.':level==='hold'?'La consistencia o la recuperación no justifican aumentar la carga todavía.':'La semana es compatible con consolidación de base aeróbica; mantener la progresión prudente.',insights,recommendation:level==='protect'?'Reducir volumen y suspender esfuerzos que provoquen síntomas. Si aparecen síntomas nasales persistentes, revisar con el especialista.':level==='hold'?'Repetir una carga igual o ligeramente menor antes de progresar.':'Si se ha completado bien y no hay molestias, la siguiente semana puede aumentar ligeramente (no más de ~10%), excepto si toca descarga.'};}
export function generateNext(w,s){const review=buildReview(w,s);if(!review.ready)throw Error('Registra al menos el 70% de las sesiones antes de generar una planificación adaptada.');const nextStart=addDays(w.start,7);const nextIndex=Math.round((new Date(nextStart+'T12:00:00')-new Date('2026-11-02T12:00:00'))/604800000);
const isRecovery=((nextIndex+1)%4===0);const multiplier=review.level==='protect'?.70:review.level==='hold'?.93:isRecovery?.78:1.06;
const m=review.metrics;const maxTotal=Math.min(Number(s.settings.weeklyTarget||11)*60,Math.round(w.sessions.reduce((n,x)=>n+x.minutes,0)*1.09));
const sessions=w.sessions.map(old=>{const dayIndex=Math.round((new Date(old.date+'T12:00:00')-new Date(w.start+'T12:00:00'))/86400000);const prev=Number(s.logs[old.id]?.actualMinutes)||old.minutes;let base=review.level==='protect'?Math.min(prev,old.minutes):old.minutes;let minutes=Math.max(15,Math.round(base*multiplier/5)*5);return {...old,id:`${nextStart}-${old.type}-${dayIndex}-${Math.random().toString(36).slice(2,6)}`,date:addDays(nextStart,dayIndex),minutes,title:old.title.replace('Reintroducción','Base'),detail:review.level==='protect'?'Solo actividad muy ligera si no hay síntomas. Ante presión nasal, suspender y consultar.':old.detail};});
const sum=sessions.reduce((n,x)=>n+x.minutes,0);if(sum>maxTotal){const factor=maxTotal/sum;sessions.forEach(x=>x.minutes=Math.max(15,Math.floor(x.minutes*factor/5)*5));}
return {start:nextStart,title:review.level==='protect'?'Protección y recuperación':isRecovery?'Descarga programada':review.level==='hold'?'Consolidación':'Base progresiva',focus:review.recommendation,createdBy:'Motor de progresión prudente · No sustituye a un entrenador clínico',sessions,review:null};}
export function nutritionFor(dayMinutes,weight){const w=Math.max(40,Math.min(140,Number(weight)||70));const factor=dayMinutes===0?[3,4]:dayMinutes<=60?[3,5]:dayMinutes<=120?[4,6]:[5,7];return {carbsLow:Math.round(factor[0]*w),carbsHigh:Math.round(factor[1]*w),proteinLow:Math.round(w*1.6),proteinHigh:Math.round(w*1.8),during:dayMinutes>=90?'Para >90 min: practicar ~30–45 g de hidratos/h si se tolera; individualizar según duración y alimentación previa.':'Para sesión suave corta, normalmente basta llegar alimentado e hidratarse normalmente.',duration:dayMinutes};}
