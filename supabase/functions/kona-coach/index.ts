// Despliega como Supabase Edge Function "kona-coach" con Verify JWT habilitado.
// OPENAI_API_KEY solo se configura como secreto del servidor.
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*';
const cors = {'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const json=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers:cors});
const TYPES=['run','swim','bike','strength','mobility'];
Deno.serve(async (req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'Método no permitido.'},405);
  try{
    const auth=req.headers.get('Authorization')||'';
    if(!auth.startsWith('Bearer '))return json({error:'No autorizado.'},401);
    const sbUrl=Deno.env.get('SUPABASE_URL')||'';
    const sbKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
    const userResponse=await fetch(`${sbUrl}/auth/v1/user`,{headers:{apikey:sbKey,Authorization:auth}});
    if(!userResponse.ok)return json({error:'Sesión no válida.'},401);
    const user=await userResponse.json();if(!user?.id)return json({error:'Usuario no válido.'},401);
    const apiKey=Deno.env.get('OPENAI_API_KEY');if(!apiKey)return json({error:'Falta configurar OPENAI_API_KEY en Supabase Secrets.'},503);
    const data=await req.json();
    if(!data||!data.week||!data.metrics||!Array.isArray(data.week.sessions)||data.week.sessions.length>25)return json({error:'Datos semanales incorrectos.'},400);
    const source=data.week;
    const safeSessions=source.sessions.map((s:any)=>({date:String(s.date||'').slice(0,10),type:TYPES.includes(s.type)?s.type:'mobility',title:String(s.title||'').slice(0,100),minutes:Math.min(300,Math.max(0,Number(s.minutes)||0)),detail:String(s.detail||'').slice(0,220),status:String(data.logs?.[s.id]?.status||'pending'),rpe:Number(data.logs?.[s.id]?.rpe||0),actualMinutes:Number(data.logs?.[s.id]?.actualMinutes||0)}));
    const requestData={start:String(source.start).slice(0,10),sessions:safeSessions,metrics:data.metrics,readiness:Array.isArray(data.readiness)?data.readiness.slice(0,7):[],notes:String(data.notes||'').slice(0,1500),weight:Number(data.weight)||70,maxWeeklyMinutes:Math.min(720,Math.max(180,Number(data.maxWeeklyMinutes)||660))};
    const schema={type:'object',additionalProperties:false,properties:{summary:{type:'string'},insights:{type:'array',items:{type:'string'}},recommendation:{type:'string'},focus:{type:'string'},sessions:{type:'array',items:{type:'object',additionalProperties:false,properties:{dayIndex:{type:'integer'},type:{type:'string',enum:TYPES},title:{type:'string'},minutes:{type:'integer'},detail:{type:'string'}},required:['dayIndex','type','title','minutes','detail']}}},required:['summary','insights','recommendation','focus','sessions']};
    const system=`Eres un asistente de planificación de triatlón de larga distancia muy prudente, no un médico. Responde SOLO en JSON válido, siguiendo el schema. Idioma español. Evalúa entrenamiento completado, descanso, fatiga, nutrición y síntomas. El usuario está preparando Kona 2030 y ha sufrido septoplastia el 18/09/2026; reincorporación conservadora. No planifiques intervalos máximos en su primer mes ni ignores molestias nasales. Con señales de alarma recomienda detener ejercicio y evaluación médica. No inventes registros inexistentes. Adapta la estructura de sesiones del usuario (ciclismo, carrera, natación y fuerza) y deja jueves libre si así consta. Diseña siguiente semana, indicando dayIndex 0=lunes ... 6=domingo. No superes el máximo semanal indicado, ni aumentes >10% respecto a minutos PLANIFICADOS previos; con fatiga elevada, dolor o adherencia baja, recorta o mantén. Salvo causa razonable, no programar más de 3–4 h por día de fin de semana. Sin planes de nutrición clínica ni diagnóstico.`;
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL')||'gpt-4.1-mini',temperature:0.2,max_completion_tokens:2200,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(requestData)}],response_format:{type:'json_schema',json_schema:{name:'kona_weekly_coach',strict:true,schema}}})});
    const out=await response.json();if(!response.ok)return json({error:out.error?.message||'Error en el proveedor de IA.'},502);
    const raw=out.choices?.[0]?.message?.content;if(!raw)return json({error:'La IA no devolvió un plan utilizable.'},502);
    const result=JSON.parse(raw);
    if(!Array.isArray(result.sessions)||result.sessions.length<3||result.sessions.length>25||result.sessions.some((s:any)=>!TYPES.includes(s.type)||!Number.isInteger(s.dayIndex)||s.dayIndex<0||s.dayIndex>6||!Number.isFinite(s.minutes)||s.minutes<10||s.minutes>240))return json({error:'Plan rechazado por validación.'},422);
    const previous=safeSessions.reduce((n:number,s:any)=>n+s.minutes,0);const cap=Math.min(requestData.maxWeeklyMinutes,Math.round(previous*1.1)+1);
    const sum=result.sessions.reduce((n:number,s:any)=>n+s.minutes,0);
    if(sum>cap)return json({error:`Plan rechazado: ${sum} min supera el límite de seguridad de ${cap} min. Usa planificación local.`},422);
    if(requestData.metrics?.hasNasal&&sum>previous*.95)return json({error:'Plan rechazado: síntomas nasales requieren reducir la carga.'},422);
    return json({result});
  }catch(e){return json({error:e instanceof Error?e.message:'Error desconocido.'},500);}
});
