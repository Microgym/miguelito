
document.addEventListener('click',function(e){
 if(e.target && e.target.id==='firstRunResume') resumeFirstRunAfterCalendar();
});


const morning=['Hacer la cama','Recoger el pijama','Lavarse la cara','Peinarse','Preparar el desayuno','Recoger el desayuno','Lavarse los dientes','Preparar la mochila'];
const afternoon=['Traer la agenda','Traer todos los libros necesarios','Traer el material organizado y limpio','Hacer los deberes','Leer 30 minutos','Ayudar a los papás en casa','Ver la tele en inglés','Recoger la ropa','Lavarse los dientes'];
const seed=[
 ...morning.map((t,i)=>({title:t,section:'Mañana',stars:(i===4||i===5)?5:4,xp:10,status:0})),
 ...afternoon.map((t,i)=>({title:t,section:'Tarde',stars:i===4?10:5,xp:i===4?20:10,status:0}))
].map(m=>({...m,enabled:true}));
function safeLoadState(){
 try{
   const raw=window.localStorage.getItem('miguelito-v10');
   return raw?JSON.parse(raw):null;
 }catch(e){return null}
}
function loadFamilyStore(){
 try{
   const raw=window.localStorage.getItem('miguelito-family-v1');
   return raw?JSON.parse(raw):null;
 }catch(e){return null}
}
function saveFamilyStore(){
 try{window.localStorage.setItem('miguelito-family-v1',JSON.stringify(familyStore))}catch(e){}
}
function freshFirstRunState(){
 return {
  stars:0,xp:0,calendar:{},missions:[],
  profile:{name:'',birthDate:'',city:'',age:9,color:'Azul',likes:''},
  rewards:[],rewardHistory:[],projects:[],
  reading:{active:null,history:[]},
  events:[],approvalHistory:[],weeklyClaims:{},
  customChallenges:[],defaultChallengesEnabled:false,
  bigGoals:[],activeGoalId:'',specialDays:[],
  notificationPrefs:{pending:true,projects:true,tomorrow:true,rewards:true}
 };
}

const legacyState=safeLoadState();
let familyStore=loadFamilyStore();
if(!familyStore){
 const firstId='child-'+Date.now();
 const first=freshFirstRunState();
 familyStore={
   activeChildId:firstId,
   onboardingCompleted:false,
   onboardingStage:'father',
   family:{fatherName:'',motherName:'',parentsTogether:null},
   parentPin:'1234',
   children:[{id:firstId,name:'',avatar:'👦',birthDate:'',city:'',state:first}]
 };
 saveFamilyStore();
}else{
 if(!familyStore.family)familyStore.family={fatherName:'',motherName:'',parentsTogether:null};
 if(!familyStore.parentPin)familyStore.parentPin=(activeChildRecord?.()?.state?.parentPin)||'1234';
 if(typeof familyStore.onboardingCompleted==='undefined'){
   const hasReal=(familyStore.children||[]).some(c=>{
     const n=(c?.name||c?.state?.profile?.name||'').trim();
     return !!n && n!=='Nuevo perfil' && n!=='Hijo';
   });
   familyStore.onboardingCompleted=hasReal;
   familyStore.onboardingStage=hasReal?'done':'family';
   saveFamilyStore();
 }
}
function activeChildRecord(){
 return familyStore.children.find(c=>c.id===familyStore.activeChildId)||familyStore.children[0];
}
let state=activeChildRecord().state;

function hasRealProfile(){
 if(familyStore.onboardingCompleted!==true)return false;
 const c=activeChildRecord();
 const n=(c?.name||c?.state?.profile?.name||'').trim();
 return !!n && n!=='Nuevo perfil' && n!=='Hijo';
}
function parentsTogether(){return familyStore.family?.parentsTogether===true}
function fatherName(){return familyStore.family?.fatherName?.trim()||'Papá'}
function motherName(){return familyStore.family?.motherName?.trim()||'Mamá'}

function safeStoreState(){
 try{
   const child=activeChildRecord();
   if(child){
     child.state=state;
     child.name=state.profile?.name||child.name||'Hijo';
     child.birthDate=state.profile?.birthDate||child.birthDate||'';
     child.city=state.profile?.city||child.city||'';
   }
   saveFamilyStore();
   window.localStorage.setItem('miguelito-v10',JSON.stringify(state));
 }catch(e){}
}
let weekOffset=0;
const $=s=>document.querySelector(s);

function localDateKey(d=new Date()){
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}


function ensureV38State(){
 if(!state.customChallenges)state.customChallenges=[];
 state.missions.forEach(m=>{if(!m.scope)m.scope='current';if(!m.ownerChildId)m.ownerChildId=familyStore.activeChildId;});
}
function ensureV34State(){
 if(!state.notificationPrefs)state.notificationPrefs={pending:true,projects:true,tomorrow:true,rewards:true};
 state.missions.forEach(m=>{if(!m.house)m.house='Ambas';});
}

function ensureV33State(){
 if(!state.bigGoals){
   state.bigGoals=[{id:'goal-ski',name:'Viaje a esquiar',cost:600,date:'',icon:'🎿',message:'Cada esfuerzo te acerca a nuevas aventuras'}];
 }
 if(!state.activeGoalId && state.bigGoals.length)state.activeGoalId=state.bigGoals[0].id;
 if(!state.specialDays)state.specialDays=[];
 if(!state.rewardHistory)state.rewardHistory=[];
 state.rewardHistory.forEach(h=>{if(!h.status)h.status='delivered';});
}
ensureV33State();
ensureV34State();
ensureV38State();

function specialDayFor(dateKey=localDateKey()){return (state.specialDays||[]).find(x=>x.date===dateKey)||null}
function skippedSectionsToday(){const s=specialDayFor();return new Set((s&&s.skipSections)||[])}
function activeMissionsToday(){
 const skip=skippedSectionsToday(),who=home(new Date());
 return state.missions.map((m,i)=>[m,i]).filter(([m])=>{
 const houseOk=(m.house==='Ambas'||!m.house||m.house===who);
 const childOk=(m.scope==='all'||!m.scope||m.ownerChildId===familyStore.activeChildId);
 return m.enabled!==false&&!skip.has(m.section)&&houseOk&&childOk;
});
}

function ensureEventState(){
 if(!state.events) state.events=[];
}
ensureEventState();

let selectedCalendarDate=localDateKey();

function ensureDailyGameState(){
 if(!state.approvalHistory) state.approvalHistory=[];
 if(!state.weeklyClaims) state.weeklyClaims={};
 const today=localDateKey();
 if(!state.currentMissionDate) state.currentMissionDate=today;
 if(state.currentMissionDate!==today){
   state.missions.forEach(m=>m.status=0);
   state.currentMissionDate=today;
 }
}
ensureDailyGameState();

function save(){
 state._updatedAt=Date.now();
 safeStoreState();
 render();
 scheduleRemotePush();
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.style.display='block';clearTimeout(window.tt);window.tt=setTimeout(()=>t.style.display='none',1600)}

function loadSyncConfig(){
 try{
   const raw=localStorage.getItem('miguelito-sync-config');
   return raw?JSON.parse(raw):{url:'',key:'',familyCode:'',deviceName:''};
 }catch(e){
   return {url:'',key:'',familyCode:'',deviceName:''};
 }
}
function storeSyncConfig(){
 try{localStorage.setItem('miguelito-sync-config',JSON.stringify(syncConfig));}catch(e){}
}
let syncConfig=loadSyncConfig();
let syncTimer=null;
let syncPollTimer=null;
let syncBusy=false;

function syncEnabled(){
 return !!(syncConfig.url && syncConfig.key && syncConfig.familyCode);
}
function cleanBaseUrl(url){
 return (url||'').trim().replace(/\/+$/,'');
}
function setSyncStatus(type,text){
 const box=$('#syncStatus'),label=$('#syncStatusText');
 if(!box||!label)return;
 box.className='sync-status'+(type?' '+type:'');
 label.textContent=text;
}
function syncHeaders(){
 return {
   'apikey':syncConfig.key,
   'Authorization':'Bearer '+syncConfig.key,
   'Content-Type':'application/json',
   'Prefer':'return=representation'
 };
}
async function fetchRemoteState(){
 if(!syncEnabled())return null;
 const base=cleanBaseUrl(syncConfig.url);
 const code=encodeURIComponent(syncConfig.familyCode);
 const res=await fetch(`${base}/rest/v1/miguelito_state?family_code=eq.${code}&select=payload,updated_at`,{
   headers:syncHeaders()
 });
 if(!res.ok)throw new Error(`Error ${res.status}`);
 const rows=await res.json();
 return rows&&rows[0]?rows[0].payload:null;
}
async function pushRemoteState(){
 if(!syncEnabled()||syncBusy)return;
 syncBusy=true;
 setSyncStatus('busy','Sincronizando…');
 try{
   const base=cleanBaseUrl(syncConfig.url);
   const payload={
     family_code:syncConfig.familyCode,
     payload:state,
     updated_at:new Date().toISOString()
   };
   const res=await fetch(`${base}/rest/v1/miguelito_state?on_conflict=family_code`,{
     method:'POST',
     headers:{...syncHeaders(),'Prefer':'resolution=merge-duplicates,return=minimal'},
     body:JSON.stringify(payload)
   });
   if(!res.ok)throw new Error(`Error ${res.status}`);
   setSyncStatus('ok',`Sincronizado · ${syncConfig.deviceName||'dispositivo'}`);
 }catch(e){
   setSyncStatus('err','No se pudo sincronizar');
 }finally{
   syncBusy=false;
 }
}
async function pullRemoteState(force=false){
 if(!syncEnabled()||syncBusy)return;
 syncBusy=true;
 setSyncStatus('busy','Comprobando cambios…');
 try{
   const remote=await fetchRemoteState();
   if(!remote){
     syncBusy=false;
     await pushRemoteState();
     return;
   }
   const remoteTime=Number(remote._updatedAt)||0;
   const localTime=Number(state._updatedAt)||0;
   if(force || remoteTime>localTime){
     state=remote;
     ensureEventState();
     ensureDailyGameState();
     ensureTaskState?.();
     ensureRewardHistory?.();
     ensureRewardState?.();
     ensureProjectState?.();
     ensureReadingState?.();
     ensureProfileState?.();
     safeStoreState();
     render();
   }else if(localTime>remoteTime){
     syncBusy=false;
     await pushRemoteState();
     return;
   }
   setSyncStatus('ok',`Sincronizado · ${syncConfig.deviceName||'dispositivo'}`);
 }catch(e){
   setSyncStatus('err','No se pudo conectar con la nube');
 }finally{
   syncBusy=false;
 }
}
function scheduleRemotePush(){
 if(!syncEnabled())return;
 clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>pushRemoteState(),700);
}
function startSyncPolling(){
 clearInterval(syncPollTimer);
 if(!syncEnabled())return;
 syncPollTimer=setInterval(()=>pullRemoteState(false),10000);
}
function renderSyncConfig(){
 if($('#syncFamilyCode'))$('#syncFamilyCode').value=syncConfig.familyCode||'';
 if($('#syncDeviceName'))$('#syncDeviceName').value=syncConfig.deviceName||'';
 if($('#syncUrl'))$('#syncUrl').value=syncConfig.url||'';
 if($('#syncKey'))$('#syncKey').value=syncConfig.key||'';
 if(syncEnabled())setSyncStatus('ok','Configurado · listo para sincronizar');
 else setSyncStatus('','Sin configurar');
}

$('#saveSyncBtn').onclick=async()=>{
 syncConfig={
   familyCode:$('#syncFamilyCode').value.trim(),
   deviceName:$('#syncDeviceName').value.trim(),
   url:cleanBaseUrl($('#syncUrl').value),
   key:$('#syncKey').value.trim()
 };
 if(!syncEnabled()){
   toast('Completa URL, clave y código familiar');
   return;
 }
 storeSyncConfig();
 startSyncPolling();
 await pullRemoteState(false);
};
$('#syncNowBtn').onclick=()=>pullRemoteState(true);

setTimeout(()=>{
 renderSyncConfig();
 if(syncEnabled()){
   startSyncPolling();
   pullRemoteState(false);
 }
},50);


function complete(i){const m=state.missions[i];if(m.status!==0)return;m.status=2;toast('Pendiente de aprobación 👀');save()}
function approve(i){
 const m=state.missions[i];
 if(m.status!==2)return;
 m.status=1;
 state.stars+=m.stars;
 state.xp+=m.xp;
 if(!state.approvalHistory)state.approvalHistory=[];
 state.approvalHistory.push({
   date:localDateKey(),
   title:m.title,
   section:m.section,
   stars:m.stars,
   xp:m.xp
 });
 toast(`+${m.stars} ⭐ · +${m.xp} XP`);
 save();
}
function reject(i){const m=state.missions[i];if(m.status!==2)return;m.status=0;toast('Devuelta a Miguelito');save()}
function redeem(name,cost){
 if(state.stars<cost){toast(`Te faltan ${cost-state.stars} ⭐ para este premio`);return}
 state.stars-=cost;
 if(!state.rewardHistory)state.rewardHistory=[];
 const reward=(state.rewards||[]).find(r=>r.name===name&&Number(r.cost)===Number(cost));
 state.rewardHistory.push({
   id:'rw-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
   name,cost:Number(cost),emoji:reward?.emoji||'🎁',date:new Date().toISOString(),
   starsLeft:state.stars,status:'pending',deliveredAt:null
 });
 toast(`🎟️ ${name} canjeado · Quedan ${state.stars} ⭐`);
 save();
}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function home(d){if(parentsTogether())return 'Familia';return state.calendar[iso(d)]||(((d.getDay()+6)%7)<=2?'Papá':'Mamá')}
function startWeek(){const d=new Date(),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n+weekOffset*7);return d}

function renderModules(){
 const wrap=$('#modules');if(!wrap)return;wrap.innerHTML='';
 const cfg=[['Mañana','morning','☀️','Un gran día empieza aquí'],['Colegio','school','🎒','Aprendo hoy, construyo mi mañana'],['Tarde','afternoon','🏠','Tiempo para crecer, jugar y ayudar']];
 cfg.forEach(([sec,cls,ico,sub])=>{
  const card=document.createElement('div');card.className='card module';
  const items=activeMissionsToday().filter(([m])=>m.section===sec);
  const done=items.filter(([m])=>m.status===1).length;
  card.innerHTML=`<div class="module-head ${cls}"><div class="mod-left"><span class="mod-icon">${ico}</span><div><div class="mod-title">${sec}</div><div class="mod-sub">${sub}</div></div></div><div class="count">${done}/${items.length} completadas</div></div><div class="missions"></div>`;
  const list=card.querySelector('.missions');
  if(!items.length){
    list.innerHTML='<div class="more">No hay tareas activas en este bloque.</div>';
  }else{
    items.forEach(([m,i])=>{
      const row=document.createElement('div');row.className=`mission ${m.status===1?'done':m.status===2?'pending':''}`;
      row.innerHTML=`<button class="tick">${m.status===1?'✓':m.status===2?'⏳':'○'}</button><div><div class="mtitle">${m.title}</div><div class="mmeta">${m.status===2?'<span class="pendingTag">Pendiente</span>':m.status===1?'Aprobada ✅':'Toca para completar'}</div></div><div class="score">+${m.stars} ⭐<br>+${m.xp} XP</div>`;
      row.querySelector('button').onclick=()=>complete(i);list.appendChild(row);
    });
  }
  wrap.appendChild(card);
 });
}

function eventIcon(type){
 return {exam:'📝',football:'⚽',madrid:'⚪',special:'🎉',project:'🧩',other:'📌'}[type]||'📌';
}
function eventTypeLabel(type){
 return {exam:'Examen',football:'Fútbol',madrid:'Real Madrid',special:'Especial',project:'Proyecto',other:'Otro'}[type]||'Evento';
}
function manualEventsForDate(dateKey){
 return (state.events||[]).filter(e=>e.date===dateKey);
}
function projectEventsForDate(dateKey){
 return (state.projects||[]).filter(p=>p.due===dateKey).map(p=>({
   title:`Entrega: ${p.name}`,
   type:'project',
   date:p.due,
   time:'',
   auto:true,
   subject:p.subject
 }));
}
function eventsForDate(dateKey){
 return [...manualEventsForDate(dateKey),...projectEventsForDate(dateKey)];
}

function setSelectedDayHouse(who){
 if(!selectedCalendarDate)return;
 state.calendar[selectedCalendarDate]=who;
 toast(`Ese día estará con ${who}`);
 save();
 renderCalendar();
}

$('#setPapaBtn').onclick=()=>setSelectedDayHouse('Papá');
$('#setMamaBtn').onclick=()=>setSelectedDayHouse('Mamá');

function renderSelectedDayEvents(){
 const box=$('#selectedDayEvents');
 if(!box)return;
 const d=new Date(selectedCalendarDate+'T12:00:00');
 $('#selectedDateLabel').textContent=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
 const events=eventsForDate(selectedCalendarDate);
 box.innerHTML='';
 const house=home(d);
 const papaBtn=$('#setPapaBtn');
 const mamaBtn=$('#setMamaBtn');
 if(papaBtn && mamaBtn){
   papaBtn.classList.toggle('active-papa',house==='Papá');
   mamaBtn.classList.toggle('active-mama',house==='Mamá');
 }
 const houseRow=document.createElement('div');
 houseRow.className='event-item';
 houseRow.innerHTML=`<div class="event-icon">${house==='Papá'?'👨':'👩'}</div><div class="event-main"><b>Con ${house}</b><span>Casa de hoy</span></div><div class="event-chip">${house}</div>`;
 box.appendChild(houseRow);
 if(!events.length){
   const empty=document.createElement('div');
   empty.className='mmeta';
   empty.style.padding='9px 0';
   empty.textContent='No hay más eventos este día.';
   box.appendChild(empty);
   return;
 }
 events.forEach(e=>{
   const row=document.createElement('div');
   row.className='event-item';
   row.innerHTML=`<div class="event-icon">${eventIcon(e.type)}</div><div class="event-main"><b>${e.title}</b><span>${e.time?e.time+' · ':''}${e.subject||eventTypeLabel(e.type)}</span></div><div class="event-chip ${e.type}">${eventTypeLabel(e.type)}</div>`;
   box.appendChild(row);
 });
}

function setVisibleWeekHouse(who){
 const s=startWeek();
 for(let i=0;i<7;i++){
   const d=new Date(s);
   d.setDate(s.getDate()+i);
   state.calendar[iso(d)]=who;
 }
 toast(`Semana completa asignada a ${who}`);
 save();
 renderCalendar();
}

$('#setWeekPapaBtn').onclick=()=>setVisibleWeekHouse('Papá');
$('#setWeekMamaBtn').onclick=()=>setVisibleWeekHouse('Mamá');

function renderCalendar(){
 const s=startWeek(),e=new Date(s);e.setDate(e.getDate()+6);
 $('#weeklabel').textContent=`${s.toLocaleDateString('es-ES',{day:'numeric',month:'short'})} — ${e.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}`;
 const w=$('#week');w.innerHTML='';
 const names=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],today=iso(new Date());
 for(let i=0;i<7;i++){
   const d=new Date(s);d.setDate(s.getDate()+i);
   const key=iso(d),h=home(d),b=document.createElement('button');
   const has=eventsForDate(key).length>0;
   b.className=`day ${h==='Papá'?'papa':'mama'} ${key===today?'today':''} ${has?'has-event':''}`;
   b.innerHTML=`<small>${names[i]}</small><strong>${d.getDate()}</strong><small>${h}</small>`;
   b.onclick=()=>{selectedCalendarDate=key;renderSelectedDayEvents()};
   w.appendChild(b);
 }
 renderSelectedDayEvents();
}

function renderRewards(){
 $('#rewardList').innerHTML='';
 $('#rewardList').classList.add('reward-grid');
 if(!state.rewards.length){
   $('#rewardList').innerHTML='<div class="mmeta">No hay premios disponibles.</div>';
   return;
 }
 state.rewards.forEach(r=>{
   const box=document.createElement('div');
   box.className='reward-box';
   box.innerHTML=`<div class="emoji">${r.emoji}</div><b>${r.name}</b><div class="cost">${r.cost} ⭐</div><button class="btn primary">Canjear</button>`;
   box.querySelector('button').onclick=()=>redeem(r.name,r.cost);
   $('#rewardList').appendChild(box);
 });
}

function markRewardDelivered(id){
 const h=(state.rewardHistory||[]).find(x=>x.id===id);if(!h)return;
 h.status='delivered';h.deliveredAt=new Date().toISOString();toast('Premio marcado como disfrutado ✅');save();
}
function renderRewardHistory(){
 if($('#rewardBalanceNow'))$('#rewardBalanceNow').textContent=state.stars;
 const pendingList=$('#rewardPendingList'),histList=$('#rewardHistoryList');if(!pendingList||!histList)return;
 pendingList.innerHTML='';histList.innerHTML='';
 const all=(state.rewardHistory||[]).slice().reverse(),pending=all.filter(h=>h.status==='pending'),delivered=all.filter(h=>h.status!=='pending');
 if(!pending.length)pendingList.innerHTML='<div class="mmeta">No hay premios pendientes.</div>';
 else pending.forEach(h=>{
   const d=new Date(h.date),row=document.createElement('div');row.className='reward-pending-item';
   row.innerHTML=`<div class="reward-history-icon">${h.emoji||'🎁'}</div><div class="reward-history-main"><b>${h.name}</b><span>Canjeado ${d.toLocaleDateString('es-ES')} · ${h.cost} ⭐</span><div class="reward-status-pill">Pendiente de disfrutar</div></div><div class="reward-pending-actions"><button class="btn primary" type="button">✅ Marcar como disfrutado</button></div>`;
   row.querySelector('button').onclick=()=>markRewardDelivered(h.id);pendingList.appendChild(row);
 });
 if(!delivered.length)histList.innerHTML='<div class="mmeta">Todavía no hay premios disfrutados.</div>';
 else delivered.forEach(h=>{
   const d=new Date(h.date),row=document.createElement('div');row.className='reward-history-item';
   row.innerHTML=`<div class="reward-history-icon">${h.emoji||'🎁'}</div><div class="reward-history-main"><b>${h.name}</b><span>${d.toLocaleDateString('es-ES')} · ${d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}<br>Saldo después: ${h.starsLeft} ⭐</span></div><div class="reward-history-cost">-${h.cost} ⭐</div>`;
   histList.appendChild(row);
 });
}


function activeGoal(){return (state.bigGoals||[]).find(g=>g.id===state.activeGoalId)||(state.bigGoals||[])[0]||null}
function renderBigGoal(){
 const g=activeGoal(),card=$('#bigGoalCard');if(!card)return;
 if(!g){card.innerHTML='<div class="goal-empty">Todavía no hay un gran objetivo. Puedes crear uno en Zona Padres.</div>';return}
 $('#bigGoalTitle').textContent=g.name;$('#bigGoalCost').textContent=g.cost;$('#bigGoalMessage').textContent='“'+(g.message||'Cada esfuerzo te acerca a nuevas aventuras')+'”';
 $('#bigGoalIcon').innerHTML=`<div style="font-size:58px;display:grid;place-items:center;height:100%">${g.icon||'🎯'}</div>`;
 $('#bigGoalDate').textContent=g.date?'📅 '+new Date(g.date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long'}):'🎯 Sin fecha límite';
 $('#goalbar').style.width=Math.min(100,(state.stars/Math.max(1,Number(g.cost)||1))*100)+'%';
}
function resetGoalForm(){$('#goalNameInput').value='';$('#goalCostInput').value='';$('#goalDateInput').value='';$('#goalIconInput').value='🎿';$('#goalMessageInput').value='';$('#saveGoalBtn').dataset.edit='';$('#saveGoalBtn').textContent='Añadir objetivo'}
function renderGoalAdmin(){
 const list=$('#goalAdminList');if(!list)return;list.innerHTML='';
 if(!state.bigGoals.length){list.innerHTML='<div class="mmeta">No hay objetivos creados.</div>';return}
 state.bigGoals.forEach((g,i)=>{
   const row=document.createElement('div');row.className='goal-admin-row';
   row.innerHTML=`<div><b>${g.icon||'🎯'} ${g.name}${g.id===state.activeGoalId?'<span class="goal-active-tag">EN INICIO</span>':''}</b><div class="mmeta">${g.cost} ⭐${g.date?' · '+new Date(g.date+'T12:00:00').toLocaleDateString('es-ES'):''}</div></div><div class="task-admin-actions"><button class="smallbtn uploadbtn" data-goalactive="${i}">Mostrar</button><button class="smallbtn uploadbtn" data-goaledit="${i}">Editar</button><button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-goaldel="${i}">Eliminar</button></div>`;
   list.appendChild(row);
 });
 list.querySelectorAll('[data-goalactive]').forEach(b=>b.onclick=()=>{state.activeGoalId=state.bigGoals[Number(b.dataset.goalactive)].id;toast('Objetivo mostrado en Inicio 🎯');save()});
 list.querySelectorAll('[data-goaledit]').forEach(b=>b.onclick=()=>{const g=state.bigGoals[Number(b.dataset.goaledit)];$('#goalNameInput').value=g.name;$('#goalCostInput').value=g.cost;$('#goalDateInput').value=g.date||'';$('#goalIconInput').value=g.icon||'🎿';$('#goalMessageInput').value=g.message||'';$('#saveGoalBtn').dataset.edit=b.dataset.goaledit;$('#saveGoalBtn').textContent='Guardar cambios'});
 list.querySelectorAll('[data-goaldel]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.goaldel),g=state.bigGoals[i];if(confirm(`¿Eliminar "${g.name}"?`)){state.bigGoals.splice(i,1);if(state.activeGoalId===g.id)state.activeGoalId=state.bigGoals[0]?.id||'';save()}});
}
$('#saveGoalBtn').onclick=()=>{
 const name=$('#goalNameInput').value.trim(),cost=Number($('#goalCostInput').value);if(!name||!cost||cost<1){toast('Escribe nombre y meta de estrellas');return}
 const data={name,cost,date:$('#goalDateInput').value||'',icon:$('#goalIconInput').value,message:$('#goalMessageInput').value.trim()},edit=$('#saveGoalBtn').dataset.edit;
 if(edit!==''){Object.assign(state.bigGoals[Number(edit)],data);toast('Objetivo actualizado')}else{data.id='goal-'+Date.now();state.bigGoals.push(data);if(!state.activeGoalId)state.activeGoalId=data.id;toast('Objetivo añadido 🎯')}
 resetGoalForm();save();
};

function specialIcon(type){return {'no-school':'🏖️',vacation:'🌴',excursion:'🚌',birthday:'🎂',holiday:'🎉',other:'✨'}[type]||'✨'}
function specialDefaults(){const type=$('#specialTypeInput').value;$('#skipMorningInput').checked=false;$('#skipAfternoonInput').checked=false;$('#skipSchoolInput').checked=['no-school','vacation','holiday'].includes(type)}
$('#specialTypeInput').onchange=specialDefaults;
function resetSpecialForm(){$('#specialTitleInput').value='';$('#specialDateInput').value=localDateKey();$('#specialTypeInput').value='no-school';specialDefaults();$('#saveSpecialBtn').dataset.edit='';$('#saveSpecialBtn').textContent='Añadir día especial'}
function renderSpecialAdmin(){
 const list=$('#specialAdminList');if(!list)return;list.innerHTML='';
 const arr=(state.specialDays||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
 if(!arr.length){list.innerHTML='<div class="mmeta">No hay días especiales creados.</div>';return}
 arr.forEach(s=>{
   const i=state.specialDays.indexOf(s),row=document.createElement('div');row.className='special-admin-row';
   row.innerHTML=`<div><b>${specialIcon(s.type)} ${s.title}</b><div class="mmeta">${new Date(s.date+'T12:00:00').toLocaleDateString('es-ES')} · Pausa: ${(s.skipSections||[]).join(', ')||'ninguna'}</div></div><div class="task-admin-actions"><button class="smallbtn uploadbtn" data-specialedit="${i}">Editar</button><button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-specialdel="${i}">Eliminar</button></div>`;
   list.appendChild(row);
 });
 list.querySelectorAll('[data-specialedit]').forEach(b=>b.onclick=()=>{const s=state.specialDays[Number(b.dataset.specialedit)];$('#specialTitleInput').value=s.title;$('#specialDateInput').value=s.date;$('#specialTypeInput').value=s.type;$('#skipMorningInput').checked=(s.skipSections||[]).includes('Mañana');$('#skipSchoolInput').checked=(s.skipSections||[]).includes('Colegio');$('#skipAfternoonInput').checked=(s.skipSections||[]).includes('Tarde');$('#saveSpecialBtn').dataset.edit=b.dataset.specialedit;$('#saveSpecialBtn').textContent='Guardar cambios'});
 list.querySelectorAll('[data-specialdel]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.specialdel);if(confirm('¿Eliminar este día especial?')){state.specialDays.splice(i,1);save()}});
}
$('#saveSpecialBtn').onclick=()=>{
 const title=$('#specialTitleInput').value.trim(),date=$('#specialDateInput').value;if(!title||!date){toast('Escribe nombre y fecha');return}
 const skip=[];if($('#skipMorningInput').checked)skip.push('Mañana');if($('#skipSchoolInput').checked)skip.push('Colegio');if($('#skipAfternoonInput').checked)skip.push('Tarde');
 const data={title,date,type:$('#specialTypeInput').value,skipSections:skip},edit=$('#saveSpecialBtn').dataset.edit;
 if(edit!=='')state.specialDays[Number(edit)]=data;else state.specialDays.push(data);
 toast(edit!==''?'Día especial actualizado':'Día especial añadido 🎉');resetSpecialForm();save();
};
function renderSpecialDay(){const box=$('#specialDayBanner');if(!box)return;box.innerHTML='';const s=specialDayFor();if(!s)return;box.innerHTML=`<div class="special-banner"><b>${specialIcon(s.type)} ${s.title}</b><span>${(s.skipSections||[]).length?'Hoy no aparecen las tareas de: '+s.skipSections.join(', '):'Día especial sin cambios automáticos en las tareas.'}</span></div>`}

function tomorrowKey(){const d=new Date();d.setDate(d.getDate()+1);return iso(d)}
function getNotices(){
 const prefs=state.notificationPrefs||{},out=[];
 if(prefs.pending){
   const n=activeMissionsToday().filter(([m])=>m.status===2).length;
   if(n)out.push({kind:'info',icon:'👀',title:`${n} ${n===1?'tarea pendiente':'tareas pendientes'} de aprobación`,text:'Un adulto puede revisarlas en Zona Padres.'});
 }
 if(prefs.projects){
   const ps=(state.projects||[]).filter(p=>p.due&&!p.grade).map(p=>({p,left:projectDaysLeft(p)})).filter(x=>x.left>=0&&x.left<=5).sort((a,b)=>a.left-b.left);
   if(ps.length){const x=ps[0];out.push({kind:x.left<=1?'urgent':'warn',icon:x.left<=1?'🚨':'🧩',title:x.p.name,text:x.left===0?'Se entrega hoy.':x.left===1?'Se entrega mañana.':`Quedan ${x.left} días.`})}
 }
 if(prefs.tomorrow){
   const ev=eventsForDate(tomorrowKey());
   if(ev.length){const first=ev[0],more=ev.length>1?` y ${ev.length-1} más`:'';out.push({kind:'warn',icon:'📅',title:'Mañana: '+first.title+more,text:first.time?`A las ${first.time}.`:'Tienes un evento en el calendario.'})}
 }
 if(prefs.rewards){
   const n=(state.rewardHistory||[]).filter(h=>h.status==='pending').length;
   if(n)out.push({kind:'info',icon:'🎟️',title:`${n} ${n===1?'premio pendiente':'premios pendientes'} de disfrutar`,text:'Puedes marcarlos como disfrutados desde Premios.'});
 }
 return out;
}
function renderNoticeCenter(){
 const list=$('#noticeList'),count=$('#noticeCount');if(!list||!count)return;
 const notices=getNotices();count.textContent=notices.length;list.innerHTML='';
 if(!notices.length){list.innerHTML='<div class="smart-home-empty">Todo tranquilo por ahora ✨</div>';return}
 notices.slice(0,4).forEach(n=>{const el=document.createElement('div');el.className='notice-item '+n.kind;el.innerHTML=`<div class="nicon">${n.icon}</div><div><b>${n.title}</b><span>${n.text}</span></div>`;list.appendChild(el)});
}
function dayPartInfo(){
 const h=new Date().getHours();
 if(h<13)return {section:'Mañana',icon:'☀️',title:'Buenos días',text:'Empezamos con la rutina de mañana.'};
 if(h<20)return {section:'Tarde',icon:'🏠',title:'Esta tarde',text:'Toca avanzar un poco y luego disfrutar.'};
 return {section:null,icon:'🌙',title:'Cerramos el día',text:'Mira cómo ha ido hoy y celebra lo conseguido.'};
}
function renderSmartHome(){
 const box=$('#smartHomeCard');if(!box)return;
 const info=dayPartInfo(),who=home(new Date());
 if(!info.section){
   const approved=activeMissionsToday().filter(([m])=>m.status===1).length,total=activeMissionsToday().length;
   box.innerHTML=`<div class="smart-home-top"><div><div class="eyebrow">${info.icon} AHORA</div><h3>${info.title}</h3><p>${info.text}</p></div><div class="smart-home-badge">${who}</div></div><div class="smart-home-list"><div class="smart-home-task"><span class="dot">🌟</span><b>${approved}/${total} tareas aprobadas hoy</b><button class="smallbtn uploadbtn" type="button">Ver resumen</button></div></div>`;
   box.querySelector('button').onclick=()=>openScreen('summary');return;
 }
 const pending=activeMissionsToday().filter(([m])=>m.section===info.section&&m.status!==1).slice(0,3);
 box.innerHTML=`<div class="smart-home-top"><div><div class="eyebrow">${info.icon} AHORA</div><h3>${info.title}</h3><p>${info.text}</p></div><div class="smart-home-badge">${who}</div></div><div class="smart-home-list"></div>`;
 const list=box.querySelector('.smart-home-list');
 if(!pending.length)list.innerHTML='<div class="smart-home-empty">¡Este bloque está al día! ✅</div>';
 else pending.forEach(([m])=>{const row=document.createElement('div');row.className='smart-home-task';row.innerHTML=`<span class="dot">${m.status===2?'⏳':'○'}</span><b>${m.title}</b><span>+${m.stars} ⭐</span>`;list.appendChild(row)});
}
function renderReminderPrefs(){
 const p=state.notificationPrefs||{};
 if($('#prefPending'))$('#prefPending').checked=p.pending!==false;
 if($('#prefProjects'))$('#prefProjects').checked=p.projects!==false;
 if($('#prefTomorrow'))$('#prefTomorrow').checked=p.tomorrow!==false;
 if($('#prefRewards'))$('#prefRewards').checked=p.rewards!==false;
}
function bindReminderPref(id,key){const el=$(id);if(!el)return;el.onchange=()=>{state.notificationPrefs[key]=el.checked;save()}}
bindReminderPref('#prefPending','pending');bindReminderPref('#prefProjects','projects');bindReminderPref('#prefTomorrow','tomorrow');bindReminderPref('#prefRewards','rewards');


function renderSmartAlerts(){
 const box=$('#smartAlerts');if(!box)return;box.innerHTML='';
 const pending=activeMissionsToday().filter(([m])=>m.status===2).length;
 if(pending)box.insertAdjacentHTML('beforeend',`<div class="smart-alert pending"><b>👀 ${pending} ${pending===1?'tarea espera':'tareas esperan'} aprobación</b><span>Un adulto puede revisarlas en Zona Padres.</span></div>`);
 const projects=(state.projects||[]).filter(p=>p.due&&!p.grade).map(p=>({p,left:projectDaysLeft(p)})).filter(x=>x.left>=0&&x.left<=5).sort((a,b)=>a.left-b.left);
 if(projects.length){const x=projects[0],urgent=x.left<=1;box.insertAdjacentHTML('beforeend',`<div class="smart-alert ${urgent?'urgent':'warning'}"><b>${urgent?'🚨':'⏰'} ${x.p.name}</b><span>${x.left===0?'Se entrega hoy':x.left===1?'Se entrega mañana':`Quedan ${x.left} días para la entrega`}.</span></div>`)}
}

$('#exportBackupBtn').onclick=()=>{
 const backup={app:'Miguelito',version:33,exportedAt:new Date().toISOString(),state},blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`miguelito-copia-${localDateKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);$('#backupStatus').textContent='Copia exportada correctamente.';toast('Copia de seguridad creada 💾');
};
$('#importBackupInput').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
   const data=JSON.parse(await file.text()),restored=data.state||data;if(!restored||typeof restored!=='object'||!Array.isArray(restored.missions))throw new Error('invalid');
   if(!confirm('¿Restaurar esta copia? Sustituirá los datos actuales.'))return;
   state=restored;ensureV33State();ensureEventState();ensureDailyGameState();ensureTaskState();ensureRewardState();state._updatedAt=Date.now();safeStoreState();render();scheduleRemotePush();$('#backupStatus').textContent='Copia restaurada correctamente.';toast('Copia restaurada ✅');
 }catch(err){$('#backupStatus').textContent='No se pudo leer esta copia.';toast('Archivo de copia no válido')}
 e.target.value='';
};



function freshChildState(name,birthDate='',city=''){
 return {
   stars:0,xp:0,calendar:{},missions:[],
   profile:{name:name||'Nuevo perfil',birthDate,city,age:ageFromBirth(birthDate)||9,color:'Azul',likes:''},
   rewards:[],rewardHistory:[],projects:[],
   reading:{active:null,history:[]},
   events:[],approvalHistory:[],weeklyClaims:{},
   customChallenges:[],defaultChallengesEnabled:false,
   bigGoals:[],activeGoalId:'',specialDays:[],
   notificationPrefs:{pending:true,projects:true,tomorrow:true,rewards:true}
 };
}



let firstRunPreviewMode=false;
let firstRunPreviewSnapshot=null;

function cloneJson(v){return JSON.parse(JSON.stringify(v))}
function openFirstRunPreview(){
 firstRunPreviewMode=true;
 firstRunPreviewSnapshot={
   familyStore:cloneJson(familyStore),
   state:cloneJson(state)
 };
 const d={
   fatherName:familyStore.family?.fatherName||'',
   motherName:familyStore.family?.motherName||'',
   parentsTogether:familyStore.family?.parentsTogether,
   childCount:Math.max(1,(familyStore.children||[]).length||1),
   children:(familyStore.children||[]).map(c=>({
     name:c.name||c.state?.profile?.name||'',
     avatar:c.avatar||'👦',
     birthDate:c.birthDate||c.state?.profile?.birthDate||'',
     city:c.city||c.state?.profile?.city||''
   })),
   childIndex:0
 };
 familyStore.onboardingDraft=d;
 familyStore.onboardingStage='father';
 document.body.classList.add('first-run-active');
 $('#firstRunOverlay')?.classList.add('show');
 renderFirstRun();
}
function closeFirstRunPreview(){
 if(!firstRunPreviewMode)return;
 if(firstRunPreviewSnapshot){
   familyStore=cloneJson(firstRunPreviewSnapshot.familyStore);
   const rec=(familyStore.children||[]).find(c=>c.id===familyStore.activeChildId)||familyStore.children?.[0];
   state=rec?.state||cloneJson(firstRunPreviewSnapshot.state);
 }
 firstRunPreviewMode=false;
 firstRunPreviewSnapshot=null;
 document.body.classList.remove('first-run-active');
 $('#firstRunOverlay')?.classList.remove('show');
 render();
 openScreen('today');
}

function firstRunDraft(){
 if(!familyStore.onboardingDraft){
   familyStore.onboardingDraft={
     fatherName:familyStore.family?.fatherName||'',
     motherName:familyStore.family?.motherName||'',
     parentsTogether:familyStore.family?.parentsTogether,
     childCount:1,children:[],childIndex:0
   };
 }
 return familyStore.onboardingDraft;
}
function saveFirstRunState(){if(!firstRunPreviewMode)saveFirstRunState();}
function firstRunProgress(step,total){
 const box=$('#firstRunProgress');if(!box)return;
 box.innerHTML='';
 for(let i=1;i<=total;i++){const el=document.createElement('i');if(i<=step)el.className='on';box.appendChild(el)}
}
function startFirstRun(){
 if(familyStore.onboardingCompleted===true){
   document.body.classList.remove('first-run-active');
   $('#firstRunOverlay')?.classList.remove('show');
   return;
 }
 document.body.classList.add('first-run-active');
 $('#firstRunOverlay')?.classList.add('show');
 if(!familyStore.onboardingStage || familyStore.onboardingStage==='done')familyStore.onboardingStage='father';
 renderFirstRun();
}
function finishFirstRun(){
 if(firstRunPreviewMode){
   closeFirstRunPreview();
   toast('Vista previa terminada ✅');
   return;
 }
 familyStore.onboardingCompleted=true;
 familyStore.onboardingStage='done';
 familyStore.onboardingDraft=null;
 saveFamilyStore();
 document.body.classList.remove('first-run-active');
 $('#firstRunOverlay')?.classList.remove('show');
 state=activeChildRecord().state;
 render();
 openScreen('today');
}
function openCalendarDuringFirstRun(){
 document.body.classList.remove('first-run-active');
 $('#firstRunOverlay')?.classList.remove('show');
 familyStore.onboardingStage='custody-calendar';
 saveFirstRunState();
 openScreen('calendar');
 const resume=document.getElementById('firstRunResume');
 if(resume)resume.style.display='block';
}
function resumeFirstRunAfterCalendar(){
 const resume=document.getElementById('firstRunResume');
 if(resume)resume.style.display='none';
 familyStore.onboardingStage='children';
 saveFirstRunState();
 startFirstRun();
}
function renderFirstRun(){
 const body=$('#firstRunBody');if(!body)return;
 const d=firstRunDraft(),stage=familyStore.onboardingStage||'father';

 if(stage==='father'){
   firstRunProgress(1,5);
   body.innerHTML=`
    <h2>¿Cómo se llama Papá?</h2>
    <p>Lo usaremos para personalizar la app.</p>
    <div class="first-run-fields">
      <input id="frFather" placeholder="Nombre de Papá" value="${d.fatherName||''}">
    </div>
    <div class="first-run-actions"><button id="frFatherNext" class="btn primary">Continuar</button></div>`;
   $('#frFatherNext').onclick=()=>{
     const v=$('#frFather').value.trim();
     if(!v){toast('Escribe el nombre de Papá');return}
     d.fatherName=v;
     familyStore.family=familyStore.family||{};
     familyStore.family.fatherName=v;
     familyStore.onboardingStage='mother';
     saveFirstRunState();renderFirstRun();
   };
   return;
 }

 if(stage==='mother'){
   firstRunProgress(2,5);
   body.innerHTML=`
    <h2>¿Cómo se llama Mamá?</h2>
    <p>También podrás cambiarlo más adelante.</p>
    <div class="first-run-fields">
      <input id="frMother" placeholder="Nombre de Mamá" value="${d.motherName||''}">
    </div>
    <div class="first-run-actions">
      <button id="frMotherBack" class="btn ghost">Atrás</button>
      <button id="frMotherNext" class="btn primary">Continuar</button>
    </div>`;
   $('#frMotherBack').onclick=()=>{familyStore.onboardingStage='father';saveFirstRunState();renderFirstRun()};
   $('#frMotherNext').onclick=()=>{
     const v=$('#frMother').value.trim();
     if(!v){toast('Escribe el nombre de Mamá');return}
     d.motherName=v;
     familyStore.family=familyStore.family||{};
     familyStore.family.motherName=v;
     familyStore.onboardingStage='living';
     saveFirstRunState();renderFirstRun();
   };
   return;
 }

 if(stage==='living'){
   firstRunProgress(3,5);
   body.innerHTML=`
    <h2>¿Vivís juntos o separados?</h2>
    <p>Esto solo cambia cómo se muestra el calendario familiar.</p>
    <div class="first-run-choice">
      <button id="frTogether" class="${d.parentsTogether===true?'on':''}">🏠 Vivimos juntos</button>
      <button id="frSeparated" class="${d.parentsTogether===false?'on':''}">🏡 Vivimos separados</button>
    </div>
    <div class="first-run-actions">
      <button id="frLivingBack" class="btn ghost">Atrás</button>
      <button id="frLivingNext" class="btn primary">Continuar</button>
    </div>`;
   $('#frTogether').onclick=()=>{d.parentsTogether=true;renderFirstRun()};
   $('#frSeparated').onclick=()=>{d.parentsTogether=false;renderFirstRun()};
   $('#frLivingBack').onclick=()=>{familyStore.onboardingStage='mother';saveFirstRunState();renderFirstRun()};
   $('#frLivingNext').onclick=()=>{
     if(d.parentsTogether!==true&&d.parentsTogether!==false){toast('Elige una opción');return}
     // IMPORTANT: preserve names already entered.
     familyStore.family={
       fatherName:d.fatherName||familyStore.family?.fatherName||'',
       motherName:d.motherName||familyStore.family?.motherName||'',
       parentsTogether:d.parentsTogether
     };
     familyStore.onboardingStage=d.parentsTogether===false?'custody':'children';
     saveFirstRunState();renderFirstRun();
   };
   return;
 }

 if(stage==='custody'){
   firstRunProgress(4,6);
   body.innerHTML=`
    <h2>Calendario familiar</h2>
    <p>Como vivís separados, puedes marcar las semanas con ${d.fatherName||fatherName()} o ${d.motherName||motherName()}.</p>
    <div class="first-run-note">Puedes configurarlo ahora. Cuando termines, pulsa “Continuar configuración” y volverás al asistente.</div>
    <div class="first-run-actions">
      <button id="frCustodyLater" class="btn ghost">Más tarde</button>
      <button id="frCustodyNow" class="btn primary">Ir al calendario</button>
    </div>`;
   $('#frCustodyLater').onclick=()=>{familyStore.onboardingStage='children';saveFirstRunState();renderFirstRun()};
   $('#frCustodyNow').onclick=()=>openCalendarDuringFirstRun();
   return;
 }

 if(stage==='custody-calendar'){
   openCalendarDuringFirstRun();
   return;
 }

 if(stage==='children'){
   firstRunProgress(d.parentsTogether===false?5:4,d.parentsTogether===false?6:5);
   body.innerHTML=`
    <h2>¿Cuántos hijos usarán la app?</h2>
    <p>Después crearemos un perfil para cada uno.</p>
    <div class="first-run-fields">
      <select id="frChildCount">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(d.childCount)===n?'selected':''}>${n}</option>`).join('')}</select>
    </div>
    <div class="first-run-actions">
      <button id="frChildrenBack" class="btn ghost">Atrás</button>
      <button id="frChildrenNext" class="btn primary">Continuar</button>
    </div>`;
   $('#frChildrenBack').onclick=()=>{
     familyStore.onboardingStage=d.parentsTogether===false?'custody':'living';
     saveFirstRunState();renderFirstRun();
   };
   $('#frChildrenNext').onclick=()=>{
     d.childCount=Number($('#frChildCount').value)||1;
     d.children=Array.from({length:d.childCount},(_,i)=>d.children[i]||{name:'',avatar:'👦',birthDate:'',city:''});
     d.childIndex=0;
     familyStore.onboardingStage='profile';
     saveFirstRunState();renderFirstRun();
   };
   return;
 }

 if(stage==='profile'){
   firstRunProgress(d.parentsTogether===false?6:5,d.parentsTogether===false?6:5);
   const i=d.childIndex||0,c=d.children[i]||{name:'',avatar:'👦',birthDate:'',city:''};
   body.innerHTML=`
    <h2>Perfil ${i+1} de ${d.childCount}</h2>
    <p>La fecha y la ciudad se pueden completar más tarde.</p>
    <div class="first-run-fields">
      <input id="frName" placeholder="Nombre" value="${c.name||''}">
      <select id="frAvatar">
       <option value="👦" ${c.avatar==='👦'?'selected':''}>👦 Niño</option>
       <option value="👧" ${c.avatar==='👧'?'selected':''}>👧 Niña</option>
       <option value="🧒" ${c.avatar==='🧒'?'selected':''}>🧒 Infantil</option>
      </select>
    </div>
    <div class="first-run-fields two">
      <input id="frBirth" type="date" value="${c.birthDate||''}">
      <div>
        <select id="frCitySelect" style="width:100%">
          <option value="">Sin ciudad</option>
          <option value="Valencia">Valencia</option>
          <option value="Madrid">Madrid</option>
          <option value="__other__">Otras</option>
        </select>
        <input id="frCityCustom" placeholder="Escribe la ciudad" style="display:none;margin-top:8px;width:100%">
      </div>
    </div>
    <div class="first-run-actions">
      ${i>0?'<button id="frPrev" class="btn ghost">Anterior</button>':'<button id="frBackToChildren" class="btn ghost">Atrás</button>'}
      <button id="frNext" class="btn primary">${i+1<d.childCount?'Siguiente':'Terminar'}</button>
    </div>`;
   bindCityPicker('#frCitySelect','#frCityCustom');
   setCityPickerValue('#frCitySelect','#frCityCustom',c.city||'');
   if($('#frPrev'))$('#frPrev').onclick=()=>{d.childIndex--;saveFirstRunState();renderFirstRun()};
   if($('#frBackToChildren'))$('#frBackToChildren').onclick=()=>{familyStore.onboardingStage='children';saveFirstRunState();renderFirstRun()};
   $('#frNext').onclick=()=>{
     c.name=$('#frName').value.trim()||`Hijo ${i+1}`;
     c.avatar=$('#frAvatar').value;
     c.birthDate=$('#frBirth').value||'';
     c.city=getCityPickerValue('#frCitySelect','#frCityCustom');
     d.children[i]=c;
     if(i+1<d.childCount){d.childIndex=i+1;saveFirstRunState();renderFirstRun();return}
     const now=Date.now();
     familyStore.children=d.children.map((x,j)=>{
       const st=freshChildState(x.name,x.birthDate,x.city);
       st.profile.name=x.name;st.profile.birthDate=x.birthDate;st.profile.city=x.city;
       return {id:`child-${now}-${j}`,name:x.name,avatar:x.avatar,birthDate:x.birthDate,city:x.city,state:st};
     });
     familyStore.activeChildId=familyStore.children[0].id;
     state=familyStore.children[0].state;
     finishFirstRun();
   };
 }
}

function switchChild(id){
 const target=(familyStore.children||[]).find(c=>String(c.id)===String(id));
 if(!target)return;
 safeStoreState();
 familyStore.activeChildId=target.id;
 state=target.state;
 ensureV33State();ensureV34State();ensureEventState();ensureDailyGameState();ensureTaskState();ensureRewardHistory();ensureRewardState();ensureProjectState();ensureReadingState();ensureProfileState();
 saveFamilyStore();
 render();
 openScreen('today');
}
function childVisualThumb(c){
 const src=(c?.avatar==='👧')?'':'';
 return `<span class="child-visual-icon"><img src="${src}" alt=""></span>`;
}

function renderChildTopSwitcher(){
 const box=$('#childTopSwitcher');if(!box)return;box.innerHTML='';
 familyStore.children.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='child-chip'+(c.id===familyStore.activeChildId?' active':'');b.innerHTML=`${childVisualThumb(c)}<span>${c.name}</span>`;b.onclick=()=>switchChild(c.id);box.appendChild(b)});
}
function renderChildSwitcher(){
 const box=$('#childSwitcher');if(!box)return;
 box.innerHTML='';
 familyStore.children.forEach(c=>{
   const b=document.createElement('button');
   b.type='button';b.className='child-chip'+(c.id===familyStore.activeChildId?' active':'');
   b.innerHTML=`${childVisualThumb(c)}<span>${c.name}</span>`;
   b.onclick=()=>switchChild(c.id);
   box.appendChild(b);
 });
 const add=document.createElement('button');
 add.type='button';add.className='child-chip add';add.textContent='＋ Añadir';
 add.onclick=()=>openScreen('parents');
 box.appendChild(add);
}
function resetChildForm(){
 $('#childNameInput').value='';$('#childAvatarInput').value='👦';$('#childBirthInput').value='';$('#childCityInput').value='';setCityPickerValue('#childCitySelect','#childCityCustom','');$('#childColorInput').value='';
 $('#saveChildBtn').dataset.edit='';$('#saveChildBtn').textContent='Añadir hijo';
}
function renderChildManager(){
 const list=$('#childManagerList');if(!list)return;list.innerHTML='';
 familyStore.children.forEach((c,i)=>{
   const r=document.createElement('div');r.className='child-manager-row';
   const birth=c.birthDate?new Date(c.birthDate+'T12:00:00').toLocaleDateString('es-ES'):'Sin fecha';
   r.innerHTML=`<div><b>${childVisualThumb(c)} ${c.name}${c.id===familyStore.activeChildId?' <span class="goal-active-tag">ACTIVO</span>':''}</b><div class="mmeta">${birth}${(c.city||c.state?.profile?.city)?' · 📍 '+(c.city||c.state.profile.city):''}</div></div>
   <div class="child-manager-actions">
     <button data-childopen="${i}" style="background:#e8f2ff;color:#35618e">Abrir</button>
     <button data-childedit="${i}" style="background:#fff4d5;color:#806000">Editar</button>
     <button data-childdel="${i}" style="background:#ffe9ec;color:#a74354">Eliminar</button>
   </div>`;
   list.appendChild(r);
 });
 list.querySelectorAll('[data-childopen]').forEach(b=>b.onclick=()=>switchChild(familyStore.children[Number(b.dataset.childopen)].id));
 list.querySelectorAll('[data-childedit]').forEach(b=>b.onclick=()=>{
   const c=familyStore.children[Number(b.dataset.childedit)];
   $('#childNameInput').value=c.name;$('#childAvatarInput').value=c.avatar||'👦';$('#childBirthInput').value=c.birthDate||'';
   const cityValue=c.city||c.state?.profile?.city||'';$('#childCityInput').value=cityValue;setCityPickerValue('#childCitySelect','#childCityCustom',cityValue);
   $('#childColorInput').value=c.state?.profile?.color||'';
   $('#saveChildBtn').dataset.edit=b.dataset.childedit;$('#saveChildBtn').textContent='Guardar cambios';
 });
 list.querySelectorAll('[data-childdel]').forEach(b=>b.onclick=()=>{
   const c=familyStore.children[Number(b.dataset.childdel)];
   deleteChildProfileById(c.id);
 });
}
$('#saveChildBtn').onclick=()=>{
 const name=$('#childNameInput').value.trim(),birth=$('#childBirthInput').value||'',city=getCityPickerValue('#childCitySelect','#childCityCustom'); if($('#childCityInput')) $('#childCityInput').value=city;
 if(!name){toast('Escribe el nombre del hijo');return}
 const edit=$('#saveChildBtn').dataset.edit;
 if(edit!==''){
   const c=familyStore.children[Number(edit)];
   c.name=name;c.avatar=$('#childAvatarInput').value;c.birthDate=birth;c.city=city;
   c.state.profile=c.state.profile||{};
   c.state.profile.name=name;c.state.profile.birthDate=birth;c.state.profile.city=city;
   c.state.profile.age=ageFromBirth(birth)||c.state.profile.age||9;
   if($('#childColorInput').value.trim())c.state.profile.color=$('#childColorInput').value.trim();
   if(c.id===familyStore.activeChildId)state=c.state;
   toast('Perfil actualizado');
 }else{
   const id='child-'+Date.now();
   familyStore.children.push({id,name,avatar:$('#childAvatarInput').value,birthDate:birth,city,state:freshChildState(name,birth,city)});
   toast('Hijo añadido 👨‍👩‍👧‍👦');
 }
 saveFamilyStore();resetChildForm();render();
};


function resetChallengeForm(){
 $('#challengeTitleInput').value='';$('#challengeMatchInput').value='';$('#challengeGoalInput').value=5;$('#challengeStarsInput').value=20;$('#challengeXpInput').value=30;$('#challengeAssignInput').value='current';$('#saveChallengeBtn').dataset.edit='';$('#saveChallengeBtn').textContent='Añadir reto';
}
function renderChallengeAdmin(){
 const list=$('#challengeAdminList');if(!list)return;list.innerHTML='';
 const arr=state.customChallenges||[];
 if(!arr.length){list.innerHTML='<div class="mmeta">No hay retos personalizados para este hijo.</div>';return}
 arr.forEach((c,i)=>{
   const row=document.createElement('div');row.className='challenge-admin-row';
   row.innerHTML=`<div><b>🎯 ${c.title}</b><div class="mmeta">Meta ${c.goal} · +${c.stars} ⭐ · +${c.xp} XP <span class="scope-pill">${c.scope==='all'?'Todos':'Solo '+(activeChildRecord()?.name||'hijo')}</span></div></div><div class="challenge-admin-actions"><button data-cedit="${i}" style="background:#e8f2ff;color:#35618e">Editar</button><button data-cdel="${i}" style="background:#ffe9ec;color:#a74354">Eliminar</button></div>`;
   list.appendChild(row);
 });
 list.querySelectorAll('[data-cedit]').forEach(b=>b.onclick=()=>{const c=state.customChallenges[Number(b.dataset.cedit)];$('#challengeTitleInput').value=c.title;$('#challengeMatchInput').value=c.match||'';$('#challengeGoalInput').value=c.goal;$('#challengeStarsInput').value=c.stars;$('#challengeXpInput').value=c.xp;$('#challengeAssignInput').value=c.scope||'current';$('#saveChallengeBtn').dataset.edit=b.dataset.cedit;$('#saveChallengeBtn').textContent='Guardar cambios'});
 list.querySelectorAll('[data-cdel]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.cdel);if(confirm('¿Eliminar este reto?')){state.customChallenges.splice(i,1);save()}});
}
$('#saveChallengeBtn').onclick=()=>{
 const title=$('#challengeTitleInput').value.trim();if(!title){toast('Escribe un nombre para el reto');return}
 const data={id:'challenge-'+Date.now(),title,match:$('#challengeMatchInput').value.trim().toLowerCase(),goal:Math.max(1,Number($('#challengeGoalInput').value)||1),stars:Math.max(0,Number($('#challengeStarsInput').value)||0),xp:Math.max(0,Number($('#challengeXpInput').value)||0),scope:$('#challengeAssignInput').value||'current',ownerChildId:familyStore.activeChildId};
 const edit=$('#saveChallengeBtn').dataset.edit;if(edit!==''){data.id=state.customChallenges[Number(edit)].id;state.customChallenges[Number(edit)]=data;toast('Reto actualizado')}else{state.customChallenges.push(data);toast('Reto añadido 🎯')}
 resetChallengeForm();save();
};


function blankFamilyStore(){
 const id='child-'+Date.now();
 const s=freshFirstRunState();
 return {
   activeChildId:id,
   onboardingCompleted:false,
   onboardingStage:'father',
   onboardingDraft:null,
   family:{fatherName:'',motherName:'',parentsTogether:null},
   parentPin:'1234',
   children:[{id,name:'',avatar:'👦',birthDate:'',city:'',state:s}]
 };
}
function deleteChildProfileById(id){
 const c=familyStore.children.find(x=>x.id===id);
 if(!c)return;
 if(!confirm(`¿Eliminar por completo el perfil de ${c.name}? Se borrarán también sus tareas, premios, progreso, lectura y calendario.`))return;
 if(familyStore.children.length>1){
   familyStore.children=familyStore.children.filter(x=>x.id!==id);
   if(familyStore.activeChildId===id)familyStore.activeChildId=familyStore.children[0].id;
 }else{
   familyStore=blankFamilyStore();
 }
 state=activeChildRecord().state;
 ensureV33State();ensureV34State();ensureV38State();ensureEventState();ensureDailyGameState();ensureTaskState();ensureRewardHistory();ensureRewardState();ensureProjectState();ensureReadingState();ensureProfileState();
 saveFamilyStore();safeStoreState();resetChildForm();render();openScreen('today');
 toast('Perfil eliminado');
}
$('#deleteCurrentProfileBtn').onclick=()=>deleteChildProfileById(familyStore.activeChildId);

$('#resetWholeAppBtn').onclick=()=>{
 const first=confirm('Esto borrará TODOS los datos de todos los hijos. ¿Quieres continuar?');
 if(!first)return;
 const code=prompt('Para confirmar, escribe REINICIAR');
 if(code!=='REINICIAR'){toast('Reinicio cancelado');return}
 familyStore=blankFamilyStore();
 state=activeChildRecord().state;
 try{
   localStorage.removeItem('miguelito-v10');
   localStorage.removeItem('miguelito-family-v1');
 }catch(e){}
 saveFamilyStore();
 safeStoreState();
 resetChildForm();resetTaskForm();resetRewardForm();resetChallengeForm();resetGoalForm();resetSpecialForm();
 render();openScreen('today');
 startFirstRun();
 toast('App reiniciada a 0 ✅');
};


function renderFamilyData(){
 if($('#familyFatherNameInput'))$('#familyFatherNameInput').value=familyStore.family?.fatherName||'';
 if($('#familyMotherNameInput'))$('#familyMotherNameInput').value=familyStore.family?.motherName||'';
 if($('#familyLivingInput'))$('#familyLivingInput').value=familyStore.family?.parentsTogether===false?'separated':'together';
 if($('#familyPinInput'))$('#familyPinInput').value=String(familyStore.parentPin||'1234');
}
$('#saveFamilyDataBtn').onclick=()=>{
 const father=$('#familyFatherNameInput').value.trim();
 const mother=$('#familyMotherNameInput').value.trim();
 const pin=$('#familyPinInput').value.trim();
 if(!father||!mother){toast('Escribe los nombres de Papá y Mamá');return}
 if(!/^\d{4,8}$/.test(pin)){toast('El PIN debe tener entre 4 y 8 números');return}
 familyStore.family=familyStore.family||{};
 familyStore.family.fatherName=father;
 familyStore.family.motherName=mother;
 familyStore.family.parentsTogether=$('#familyLivingInput').value==='together';
 familyStore.parentPin=pin;
 saveFamilyStore();
 render();
 toast('Datos familiares guardados ✅');
};
$('#previewFirstRunBtn').onclick=()=>{
 document.body.classList.add('preview-first-run');
 openFirstRunPreview();
};
$('#firstRunCancelPreview').onclick=()=>{
 document.body.classList.remove('preview-first-run');
 closeFirstRunPreview();
};

bindCityPicker('#profileCitySelect','#profileCityCustom');
bindCityPicker('#childCitySelect','#childCityCustom');

function renderParents(){
 const p=state.missions.map((m,i)=>[m,i]).filter(([m])=>m.status===2);$('#pending').innerHTML='';
 if(!p.length){$('#pending').innerHTML='<div class="mmeta">No hay tareas pendientes.</div>';return}
 p.forEach(([m,i])=>{const r=document.createElement('div');r.className='row';r.innerHTML=`<div class="grow"><b>${m.title}</b><div class="mmeta">+${m.stars} ⭐ · +${m.xp} XP</div></div><button class="btn primary">Aprobar</button><button class="btn ghost">Rechazar</button>`;const bs=r.querySelectorAll('button');bs[0].onclick=()=>approve(i);bs[1].onclick=()=>reject(i);$('#pending').appendChild(r)})
}



function ensureRewardHistory(){
 if(!state.rewardHistory) state.rewardHistory=[];
}
ensureRewardHistory();

function ensureRewardState(){
 if(!state.rewards){
   state.rewards=[
    {emoji:'🍦',name:'Helado especial',cost:80,size:'Pequeño'},
    {emoji:'🎬',name:'Elegir la peli',cost:100,size:'Pequeño'},
    {emoji:'🎮',name:'+30 min videojuego',cost:120,size:'Mediano'},
    {emoji:'⚽',name:'Ver al Madrid en la tele',cost:180,size:'Mediano'},
    {emoji:'🎿',name:'Viaje a esquiar',cost:600,size:'Gran premio'}
   ];
 }
}
ensureRewardState();

function resetRewardForm(){
 $('#rewardNameInput').value='';
 $('#rewardCostInput').value='';
 $('#rewardEmojiInput').value='🎁';
 $('#rewardSizeInput').value='Pequeño';
 $('#saveRewardBtn').dataset.edit='';
 $('#saveRewardBtn').textContent='Añadir premio';
}

function renderRewardAdmin(){
 const list=$('#rewardAdminList');
 if(!list)return;
 list.innerHTML='';
 if(!state.rewards.length){
   list.innerHTML='<div class="mmeta">No hay premios. Añade uno arriba.</div>';
   return;
 }
 state.rewards.forEach((r,i)=>{
   const row=document.createElement('div');
   row.className='reward-admin-row';
   row.innerHTML=`
    <div class="reward-admin-emoji">${r.emoji}</div>
    <div>
      <b>${r.name}</b>
      <div class="mmeta">${r.cost} ⭐ · ${r.size||'Premio'}</div>
    </div>
    <div class="reward-admin-actions">
      <button class="smallbtn uploadbtn" data-editreward="${i}">Editar</button>
      <button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-delreward="${i}">Eliminar</button>
    </div>`;
   list.appendChild(row);
 });

 list.querySelectorAll('[data-editreward]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.editreward),r=state.rewards[i];
   $('#rewardNameInput').value=r.name;
   $('#rewardCostInput').value=r.cost;
   $('#rewardEmojiInput').value=r.emoji;
   $('#rewardSizeInput').value=r.size||'Pequeño';
   $('#saveRewardBtn').dataset.edit=String(i);
   $('#saveRewardBtn').textContent='Guardar cambios';
 });

 list.querySelectorAll('[data-delreward]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.delreward);
   if(confirm(`¿Eliminar el premio "${state.rewards[i].name}"?`)){
     state.rewards.splice(i,1);
     toast('Premio eliminado');
     save();
   }
 });
}

$('#saveRewardBtn').dataset.edit='';
$('#saveRewardBtn').onclick=()=>{
 const name=$('#rewardNameInput').value.trim();
 const cost=Math.max(1,Number($('#rewardCostInput').value)||0);
 if(!name){toast('Escribe el nombre del premio');return}
 if(!cost){toast('Indica el coste en estrellas');return}

 const reward={
   emoji:$('#rewardEmojiInput').value,
   name,
   cost,
   size:$('#rewardSizeInput').value
 };

 const edit=$('#saveRewardBtn').dataset.edit;
 if(edit!==''){
   state.rewards[Number(edit)]=reward;
   toast('Premio actualizado 🏆');
 }else{
   state.rewards.push(reward);
   toast('Premio añadido 🏆');
 }
 resetRewardForm();
 save();
};

function ensureProjectState(){
 if(!state.projects) state.projects=[];
}
ensureProjectState();
$('#saveProject').dataset.edit='';


function dateOnlyUTC(s){
 const [y,m,d]=s.split('-').map(Number);
 return Date.UTC(y,m-1,d);
}
function todayUTC(){
 const n=new Date();
 return Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());
}
function projectDaysLeft(p){
 if(!p.due)return null;
 return Math.round((dateOnlyUTC(p.due)-todayUTC())/86400000);
}
function renderProjectReminders(){
 const wrap=$('#projectReminders');if(!wrap)return;wrap.innerHTML='';
 const today=todayUTC();
 const active=(state.projects||[]).filter(p=>p.due&&!p.grade&&today<=dateOnlyUTC(p.due));
 if(!active.length)return;
 const title=document.createElement('div');title.className='eyebrow';title.style.margin='4px 3px 2px';title.textContent='🧩 PROYECTOS Y RECORDATORIOS';wrap.appendChild(title);
 active.sort((a,b)=>dateOnlyUTC(a.due)-dateOnlyUTC(b.due)).forEach(p=>{
   const left=projectDaysLeft(p),card=document.createElement('div');
   card.className='project-reminder'+(left<=1?' urgent':left<=5?' watch':'');
   const dayText=left===0?'¡Se entrega hoy!':left===1?'⚠️ Mañana':left<=3?`⚠️ Quedan ${left} días`:left<=5?`Recuerda: ${left} días`:`Quedan ${left} días`;
   card.innerHTML=`<div class="project-reminder-head"><div class="project-reminder-icon">${left<=1?'🚨':'🧩'}</div><div class="project-reminder-main"><div class="project-reminder-title">${p.name}</div><div class="project-reminder-meta">${p.subject} · ${p.language} · entrega ${new Date(p.due+'T12:00:00').toLocaleDateString('es-ES')}</div></div><div class="project-reminder-days">${dayText}</div></div>`;
   wrap.appendChild(card);
 });
}

function renderProjects(){
 const list=$('#projectsList');
 if(!list)return;
 list.innerHTML='';
 if(!state.projects.length){
   list.innerHTML='<div class="mmeta">Todavía no hay proyectos guardados.</div>';
   return;
 }
 state.projects.forEach((p,i)=>{
   const row=document.createElement('div');
   row.className='project-item';
   const mates=p.type==='individual'?'Individual':(p.mates||'Grupo');
   const period=(p.start&&p.due)?`${new Date(p.start+'T00:00:00').toLocaleDateString('es-ES')} → ${new Date(p.due+'T00:00:00').toLocaleDateString('es-ES')}`:(p.due?`Hasta ${new Date(p.due+'T00:00:00').toLocaleDateString('es-ES')}`:'');
   row.innerHTML=`
    <div class="project-head">
      <div class="project-icon">🧩</div>
      <div class="project-main">
        <div class="project-title">${p.name}</div>
        <div class="project-sub">${p.subject} · ${p.language}</div>
        <div class="project-tags">
          <span class="tag">${mates}</span>
          ${period?`<span class="tag deadline">📅 ${period}</span>`:''}
          ${p.grade?`<span class="tag grade">Nota: ${p.grade}</span>`:'<span class="tag">Sin nota</span>'}
        </div>
        <div class="project-actions">
          <button class="smallbtn uploadbtn" data-editproj="${i}">Editar</button>
          <button class="smallbtn parentbtn" data-gradeproj="${i}">Añadir nota</button>
          <button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-delproj="${i}">Eliminar</button>
        </div>
      </div>
    </div>`;
   list.appendChild(row);
 });
 list.querySelectorAll('[data-gradeproj]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.gradeproj);
   const g=prompt('Nota final:',state.projects[i].grade||'');
   if(g===null)return;
   state.projects[i].grade=g.trim();
   save();
 });
 list.querySelectorAll('[data-delproj]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.delproj);
   if(confirm('¿Eliminar este proyecto?')){state.projects.splice(i,1);save();}
 });
 list.querySelectorAll('[data-editproj]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.editproj),p=state.projects[i];
   $('#projName').value=p.name;
   $('#projSubject').value=p.subject;
   $('#projLanguage').value=p.language;
   $('#projType').value=p.type;
   $('#projMates').value=p.mates||'';
   $('#projStart').value=p.start||'';
   $('#projDue').value=p.due||'';
   $('#projGrade').value=p.grade||'';
   $('#matesWrap').classList.toggle('hidden',p.type!=='group');
   $('#saveProject').dataset.edit=i;
   document.querySelector('[data-projecttab="new"]').click();
 });
}

document.querySelectorAll('[data-projecttab]').forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll('[data-projecttab]').forEach(x=>x.classList.remove('on'));btn.classList.add('on');
 $('#project-list').classList.toggle('hidden',btn.dataset.projecttab!=='list');
 $('#project-new').classList.toggle('hidden',btn.dataset.projecttab!=='new');
});

$('#projType').onchange=()=>{
 $('#matesWrap').classList.toggle('hidden',$('#projType').value!=='group');
};

$('#saveProject').onclick=()=>{
 const name=$('#projName').value.trim();
 if(!name){toast('Escribe el nombre del proyecto');return}
 const start=$('#projStart').value||new Date().toISOString().slice(0,10);
 const due=$('#projDue').value||'';
 if(due && dateOnlyUTC(start)>dateOnlyUTC(due)){toast('La fecha límite debe ser posterior a la fecha de inicio');return}
 const p={
   name,
   subject:$('#projSubject').value,
   language:$('#projLanguage').value,
   type:$('#projType').value,
   mates:$('#projType').value==='group'?$('#projMates').value.trim():'',
   start,
   due,
   grade:$('#projGrade').value.trim()
 };
 const edit=$('#saveProject').dataset.edit;
 if(edit!==''){
   state.projects[Number(edit)]=p;
   $('#saveProject').dataset.edit='';
   toast('Proyecto actualizado 🧩');
 }else{
   state.projects.push(p);
   toast('Proyecto guardado 🧩');
 }
 ['projName','projMates','projStart','projDue','projGrade'].forEach(id=>$('#'+id).value='');
 $('#projType').value='individual';
 $('#matesWrap').classList.add('hidden');
 save();
 document.querySelector('[data-projecttab="list"]').click();
};

function ensureReadingState(){
 if(!state.reading){
   state.reading={
     active:{
       title:'Libro de ejemplo',
       pages:120,
       chapters:6,
       start:new Date().toISOString().slice(0,10),
       due:'',
       finish:'',
       rating:5,
       comment:'',
       chapterData:Array.from({length:6},(_,i)=>({n:i+1,photoName:'',parentApproved:false,parentNote:'',aiReviewed:false}))
     },
     history:[]
   };
 }
}
ensureReadingState();

function currentBook(){ return state.reading.active; }

function renderReading(){
 const book=currentBook();
 const noBook=$('#noBook'), wrap=$('#activeBookWrap');
 if(!book){
   noBook.classList.remove('hidden');wrap.classList.add('hidden');
 }else{
   noBook.classList.add('hidden');wrap.classList.remove('hidden');
   $('#bookTitle').textContent=book.title;
   $('#pagesStat').textContent=book.pages;
   $('#chaptersStat').textContent=book.chapters;
   const approved=book.chapterData.filter(c=>c.parentApproved).length;
   $('#approvedStat').textContent=approved;
   $('#bookProgress').style.width=(book.chapters?Math.round(approved/book.chapters*100):0)+'%';
   const due=book.due?` · límite: ${new Date(book.due+'T00:00:00').toLocaleDateString('es-ES')}`:'';
   $('#bookMeta').textContent=`${book.pages} páginas · ${book.chapters} capítulos · inicio: ${new Date(book.start+'T00:00:00').toLocaleDateString('es-ES')}${due}`;

   const list=$('#chapterList');list.innerHTML='';
   book.chapterData.forEach((c,idx)=>{
     const d=document.createElement('div');d.className='chapter';
     d.innerHTML=`
       <div class="chapter-head">
        <div class="chapter-num">${c.parentApproved?'✓':c.n}</div>
        <div class="chapter-main">
          <div class="chapter-title">Capítulo ${c.n}</div>
          <div class="chapter-status">${c.parentApproved?'Aprobado por un padre ✅':c.photoName?'Resumen subido · pendiente de revisión':'Pendiente de resumen'}</div>
        </div>
       </div>
       <div class="chapter-actions">
        <label class="smallbtn uploadbtn">📷 Subir foto<input class="file-hidden chapterFile" data-i="${idx}" type="file" accept="image/*"></label>
        <button class="smallbtn aiBtn" data-ai="${idx}">✨ Revisar con IA</button>
        <button class="smallbtn parentbtn" data-parent="${idx}">${c.parentApproved?'✅ Aprobado':'👨‍👩‍👦 Aprobar'}</button>
       </div>
       ${c.photoName?`<div class="chapter-note">📎 Foto: ${c.photoName}</div>`:''}
       ${c.aiReviewed?'<div class="chapter-note">✨ Revisión automática preparada. En la versión online analizaremos la foto y sugeriremos correcciones antes de la aprobación parental.</div>':''}
       ${c.parentNote?`<div class="chapter-note">📝 Padres: ${c.parentNote}</div>`:''}
     `;
     list.appendChild(d);
   });

   list.querySelectorAll('.chapterFile').forEach(inp=>inp.onchange=e=>{
     const i=Number(inp.dataset.i); const f=e.target.files?.[0];
     if(!f)return;
     book.chapterData[i].photoName=f.name;
     toast('Foto del resumen añadida 📷');
     save();
   });
   list.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{
     const i=Number(b.dataset.ai);
     if(!book.chapterData[i].photoName){toast('Primero sube la foto del resumen');return}
     book.chapterData[i].aiReviewed=true;
     toast('Revisión IA preparada ✨');
     save();
   });
   list.querySelectorAll('[data-parent]').forEach(b=>b.onclick=()=>{
     const i=Number(b.dataset.parent);
     if(!book.chapterData[i].photoName){toast('Falta la foto del resumen');return}
     const note=prompt('Comentario de los padres (opcional):',book.chapterData[i].parentNote||'');
     book.chapterData[i].parentNote=note||'';
     book.chapterData[i].parentApproved=true;
     toast('Capítulo aprobado ✅');
     save();
   });
 }
 renderReadingHistory();
}

function renderReadingHistory(){
 const list=$('#historyList'); if(!list)return;
 list.innerHTML='';
 const hist=state.reading.history||[];
 if(!hist.length){ list.innerHTML='<div class="mmeta">Todavía no hay libros terminados.</div>'; return; }
 hist.slice().reverse().forEach(b=>{
   const row=document.createElement('div');row.className='history-item';
   row.innerHTML=`<div class="history-cover">📘</div><div><b>${b.title}</b><div class="mmeta">${b.pages} páginas · ${b.chapters} capítulos<br>${b.start} → ${b.finish}</div><div class="rating">${'⭐'.repeat(b.rating||0)}</div>${b.comment?`<div class="mmeta">“${b.comment}”</div>`:''}</div><div>✅</div>`;
   list.appendChild(row);
 });
}

document.querySelectorAll('[data-readtab]').forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll('[data-readtab]').forEach(x=>x.classList.remove('on'));btn.classList.add('on');
 ['current','newbook','history'].forEach(k=>document.getElementById('read-'+k).classList.toggle('hidden',btn.dataset.readtab!==k));
});

$('#saveBook').onclick=()=>{
 const title=$('#newTitle').value.trim();
 const pages=Math.max(1,Number($('#newPages').value)||1);
 const chapters=Math.max(1,Math.min(50,Number($('#newChapters').value)||1));
 const start=$('#newStart').value||new Date().toISOString().slice(0,10);
 const due=$('#newDue').value||'';
 if(!title){toast('Escribe el título del libro');return}
 state.reading.active={title,pages,chapters,start,due,finish:'',rating:5,comment:'',chapterData:Array.from({length:chapters},(_,i)=>({n:i+1,photoName:'',parentApproved:false,parentNote:'',aiReviewed:false}))};
 toast('Libro añadido 📚');save();
 document.querySelector('[data-readtab="current"]').click();
};

$('#finishBook').onclick=()=>{
 const book=currentBook();if(!book)return;
 const approved=book.chapterData.filter(c=>c.parentApproved).length;
 if(approved<book.chapters){toast(`Faltan ${book.chapters-approved} capítulos por aprobar`);return}
 book.finish=$('#finishDate').value||new Date().toISOString().slice(0,10);
 book.rating=Number($('#ratingSelect').value)||5;
 book.comment=$('#bookComment').value.trim();
 state.reading.history.push(JSON.parse(JSON.stringify(book)));
 state.reading.active=null;
 toast('¡Libro terminado! 🎉📚');save();
 document.querySelector('[data-readtab="history"]').click();
};


function openScreen(name){
 try{
   if(name==='parents'){openPin();return}
   document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('on'));
   const navBtn=document.querySelector(`.nav button[data-screen="${name}"]`);
   if(navBtn) navBtn.classList.add('on');
   else document.querySelector('.nav button[data-screen="more"]')?.classList.add('on');
   document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
   const target=document.getElementById(name);
   if(target) target.classList.add('active');
   try{ render(); }catch(e){ console.error(e); }
   try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
 }catch(e){
   console.error(e);
 }
}


function ageFromBirth(dateStr){
 if(!dateStr)return null;
 const b=new Date(dateStr+'T12:00:00'),t=new Date();
 let age=t.getFullYear()-b.getFullYear();
 const m=t.getMonth()-b.getMonth();
 if(m<0||(m===0&&t.getDate()<b.getDate()))age--;
 return age>=0?age:null;
}
function ensureProfileState(){
 if(!state.profile){
   state.profile={name:activeChildRecord()?.name||'Miguelito',age:9,birthDate:activeChildRecord()?.birthDate||'',city:activeChildRecord()?.city||'',color:'Azul',likes:''};
 }
 if(typeof state.profile.birthDate==='undefined')state.profile.birthDate='';
 if(typeof state.profile.city==='undefined')state.profile.city=activeChildRecord()?.city||'';
 const derived=ageFromBirth(state.profile.birthDate);
 if(derived!==null)state.profile.age=derived;
}
ensureProfileState();



function girlAvatarSvg(){
 return `
 <svg viewBox="0 0 150 230" aria-hidden="true">
   <ellipse cx="76" cy="207" rx="47" ry="17" fill="#7e4b88" opacity=".20"/>
   <path d="M34 77 Q30 35 75 24 Q120 31 119 84 L111 135 Q101 153 77 151 Q49 151 39 129Z" fill="#6b3a2a"/>
   <rect x="42" y="117" width="69" height="83" rx="25" fill="#ef68a8"/>
   <rect x="53" y="128" width="47" height="58" rx="18" fill="#f47fb7"/>
   <circle cx="77" cy="83" r="40" fill="#f5b07b"/>
   <path d="M39 72 Q43 33 78 29 Q109 31 117 66 Q104 50 90 48 Q68 54 51 46 Q48 62 39 72Z" fill="#74402c"/>
   <path d="M49 37 Q65 17 77 34 Q91 14 108 38 Q91 38 78 49 Q64 38 49 37Z" fill="#f55f9e"/>
   <circle cx="63" cy="83" r="4" fill="#1d2733"/><circle cx="92" cy="83" r="4" fill="#1d2733"/>
   <path d="M65 101 Q78 112 93 100" stroke="#9c4b43" stroke-width="4" fill="none" stroke-linecap="round"/>
   <path d="M46 122 Q27 142 31 170" stroke="#f5b07b" stroke-width="14" stroke-linecap="round"/>
   <path d="M107 126 Q128 140 129 165" stroke="#f5b07b" stroke-width="14" stroke-linecap="round"/>
   <path d="M67 144 L77 154 L87 144" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
   <rect x="52" y="190" width="22" height="30" rx="8" fill="#5a3d70"/><rect x="83" y="190" width="22" height="30" rx="8" fill="#5a3d70"/>
 </svg>`;
}
function neutralAvatarSvg(){
 return `
 <svg viewBox="0 0 150 230" aria-hidden="true">
   <ellipse cx="76" cy="207" rx="47" ry="17" fill="#235b9e" opacity=".20"/>
   <rect x="42" y="117" width="69" height="83" rx="25" fill="#7367e8"/>
   <rect x="53" y="128" width="47" height="58" rx="18" fill="#8d82f2"/>
   <circle cx="77" cy="83" r="40" fill="#f5b07b"/>
   <path d="M37 72 Q43 30 78 28 Q113 31 119 67 Q106 50 91 49 Q67 53 52 46 Q47 63 37 72Z" fill="#70452d"/>
   <circle cx="63" cy="83" r="4" fill="#1d2733"/><circle cx="92" cy="83" r="4" fill="#1d2733"/>
   <path d="M65 101 Q78 112 93 100" stroke="#9c4b43" stroke-width="4" fill="none" stroke-linecap="round"/>
   <path d="M46 122 Q26 142 31 170" stroke="#f5b07b" stroke-width="14" stroke-linecap="round"/>
   <path d="M107 126 Q128 140 129 165" stroke="#f5b07b" stroke-width="14" stroke-linecap="round"/>
   <circle cx="77" cy="148" r="9" fill="#fff" opacity=".9"/>
   <rect x="52" y="190" width="22" height="30" rx="8" fill="#35416d"/><rect x="83" y="190" width="22" height="30" rx="8" fill="#35416d"/>
 </svg>`;
}

function cityKeyFromName(raw=''){
 const c=(raw||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(!c)return '';
 if(c.includes('madrid')) return 'madrid';
 if(c.includes('valencia')) return 'valencia';
 if(c.includes('barcelona')) return 'barcelona';
 if(c.includes('sevilla')) return 'sevilla';
 if(c.includes('malaga')) return 'malaga';
 return 'generic';
}
function citySceneSvg(city=''){
 const label=(city||'').trim();
 const key=cityKeyFromName(label);
 const palette={
  madrid:{sky1:'#cde9ff',sky2:'#eef7ff',ground:'#dceffd',accent:'#ff8f6b',building:'#8fb3d7',building2:'#6f95bf',leaf:'#6ac28c'},
  valencia:{sky1:'#d8efff',sky2:'#f5fbff',ground:'#def6f2',accent:'#ffb25b',building:'#8ad0df',building2:'#5baec8',leaf:'#63c593'},
  barcelona:{sky1:'#d7ebff',sky2:'#f3f9ff',ground:'#e5f0ff',accent:'#f7bf52',building:'#95a6e8',building2:'#6f80ce',leaf:'#71c088'},
  sevilla:{sky1:'#ffe6dd',sky2:'#fff8f1',ground:'#f3efe4',accent:'#f59d52',building:'#d8ae7b',building2:'#b98c5f',leaf:'#77be6f'},
  malaga:{sky1:'#dff4ff',sky2:'#f8fbff',ground:'#e5f3ff',accent:'#f6b26b',building:'#8ab4df',building2:'#5c89bf',leaf:'#68bf87'},
  generic:{sky1:'#dfefff',sky2:'#f8fbff',ground:'#e8f3ff',accent:'#f7b45e',building:'#9cc0e1',building2:'#6e93bb',leaf:'#70c08b'}
 }[key||'generic'];
 const landmark={
  madrid:`<g transform="translate(215 66)"><rect x="0" y="58" width="122" height="42" rx="12" fill="${palette.building}"/><path d="M14 58 C16 25 41 12 61 12 C80 12 106 25 108 58" fill="none" stroke="${palette.building2}" stroke-width="12" stroke-linecap="round"/><path d="M38 36 L61 21 L83 36" fill="none" stroke="${palette.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><rect x="22" y="74" width="20" height="16" rx="5" fill="#fff" opacity=".75"/><rect x="52" y="66" width="18" height="24" rx="5" fill="#fff" opacity=".82"/><rect x="80" y="74" width="20" height="16" rx="5" fill="#fff" opacity=".75"/></g><g transform="translate(90 78)"><rect x="0" y="14" width="18" height="36" rx="6" fill="${palette.building2}"/><rect x="22" y="4" width="20" height="46" rx="7" fill="${palette.building}"/><rect x="47" y="20" width="16" height="30" rx="6" fill="${palette.building2}"/></g>`,
  valencia:`<g transform="translate(205 60)"><path d="M0 84 C35 18 118 16 158 82" fill="none" stroke="${palette.building2}" stroke-width="12" stroke-linecap="round"/><path d="M27 86 C54 42 103 40 131 86" fill="none" stroke="${palette.building}" stroke-width="10" stroke-linecap="round"/><ellipse cx="78" cy="87" rx="73" ry="12" fill="${palette.building}" opacity=".85"/></g><g transform="translate(88 92)"><path d="M0 24 C11 3 35 0 45 20 C29 20 18 22 0 24Z" fill="${palette.leaf}"/><rect x="18" y="22" width="7" height="26" rx="3" fill="#ad7c53"/></g>`,
  barcelona:`<g transform="translate(208 42)"><rect x="10" y="52" width="118" height="50" rx="12" fill="${palette.building}"/><rect x="24" y="36" width="16" height="66" rx="8" fill="${palette.building2}"/><rect x="52" y="22" width="16" height="80" rx="8" fill="${palette.building2}"/><rect x="80" y="30" width="16" height="72" rx="8" fill="${palette.building2}"/><rect x="108" y="40" width="12" height="62" rx="6" fill="${palette.building2}"/><circle cx="32" cy="28" r="4" fill="${palette.accent}"/><circle cx="60" cy="14" r="4" fill="${palette.accent}"/><circle cx="88" cy="22" r="4" fill="${palette.accent}"/><circle cx="114" cy="32" r="4" fill="${palette.accent}"/></g>`,
  sevilla:`<g transform="translate(222 46)"><rect x="18" y="18" width="36" height="80" rx="10" fill="${palette.building2}"/><rect x="0" y="82" width="88" height="22" rx="10" fill="${palette.building}"/><rect x="28" y="0" width="16" height="28" rx="8" fill="${palette.accent}"/><circle cx="36" cy="0" r="7" fill="${palette.accent}"/></g><g transform="translate(110 92)"><circle cx="20" cy="18" r="18" fill="#ffb35b" opacity=".95"/><rect x="16" y="30" width="8" height="20" rx="4" fill="#a87d59"/></g>`,
  malaga:`<g transform="translate(208 56)"><rect x="0" y="54" width="130" height="42" rx="12" fill="${palette.building}"/><path d="M20 54 L45 26 L71 54" fill="${palette.building2}"/><path d="M70 54 L96 18 L123 54" fill="${palette.building2}"/><rect x="47" y="38" width="18" height="58" rx="8" fill="${palette.accent}"/></g><g transform="translate(95 87)"><path d="M14 0 C35 6 43 22 44 35 C28 31 11 18 14 0Z" fill="${palette.leaf}"/><path d="M0 12 C20 18 30 34 32 48 C14 44 1 30 0 12Z" fill="#8dd8a3"/><rect x="18" y="36" width="6" height="18" rx="3" fill="#ab7d58"/></g>`,
  generic:`<g transform="translate(208 60)"><rect x="0" y="40" width="132" height="56" rx="14" fill="${palette.building}"/><rect x="18" y="20" width="20" height="76" rx="10" fill="${palette.building2}"/><rect x="52" y="8" width="22" height="88" rx="11" fill="${palette.building2}"/><rect x="89" y="28" width="18" height="68" rx="9" fill="${palette.building2}"/></g>`
 }[key||'generic'];
 return `<svg viewBox="0 0 430 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
   <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${palette.sky1}"/><stop offset="100%" stop-color="${palette.sky2}"/></linearGradient></defs>
   <rect width="430" height="320" fill="url(#g1)"/>
   <circle cx="353" cy="56" r="21" fill="#fff" opacity=".75"/>
   <path d="M35 78 C54 56 79 58 93 78 C75 78 52 79 35 78Z" fill="#fff" opacity=".78"/>
   <path d="M287 87 C301 68 327 68 344 87 C325 87 306 88 287 87Z" fill="#fff" opacity=".75"/>
   <path d="M0 222 C56 185 128 182 198 198 C253 211 313 215 430 192 L430 320 L0 320 Z" fill="${palette.ground}"/>
   <path d="M0 205 C70 158 130 152 194 168 C255 184 328 194 430 171 L430 194 C351 212 273 207 202 192 C126 176 67 182 0 221 Z" fill="#ffffff" opacity=".56"/>
   ${landmark}
   <g opacity=".92"><circle cx="66" cy="214" r="18" fill="${palette.leaf}"/><rect x="61" y="226" width="10" height="30" rx="5" fill="#b3825b"/><circle cx="94" cy="224" r="13" fill="#8ed5a6"/><rect x="90" y="233" width="8" height="21" rx="4" fill="#b3825b"/></g>
   <path d="M0 257 C63 247 126 250 188 260 C253 271 326 271 430 257 L430 320 L0 320 Z" fill="#f8fcff" opacity=".92"/>
  </svg>`;
}
function renderCityScene(){
 if(!hasRealProfile()){
   document.body.classList.remove('city-valencia','city-madrid');
   const hero=$('#homeHero');
   if(hero){
     hero.classList.remove('scene-nino-valencia','scene-nino-madrid','scene-nina-valencia','scene-nina-madrid','has-city');
     hero.style.removeProperty('background-image');
   }
   const holder=$('#cityScene');if(holder)holder.innerHTML='';
   const title=$('#cityTitleWatermark');if(title){title.style.display='none';title.textContent='';}
   return;
 }
 const city=(state.profile?.city||activeChildRecord()?.city||'').trim();
 const normalized=city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
 const rec=activeChildRecord();
 const avatar=rec?.avatar||'👦';
 const isGirl=avatar==='👧';
 let image='';
 let isPreset=false;
 if(normalized.includes('valencia')){
   image=isGirl?'./hero-girl-valencia.webp':'./hero-boy-valencia.webp';
   isPreset=true;
 }else if(normalized.includes('madrid')){
   image=isGirl?'./hero-girl-madrid.webp':'./hero-boy-madrid.webp';
   isPreset=true;
 }
 document.body.classList.remove('city-valencia','city-madrid');
 if(normalized.includes('valencia'))document.body.classList.add('city-valencia');
 if(normalized.includes('madrid'))document.body.classList.add('city-madrid');
 const hero=$('#homeHero');
 const holder=$('#cityScene');
 const title=$('#cityTitleWatermark');
 if(hero){
   hero.classList.remove('scene-nino-valencia','scene-nino-madrid','scene-nina-valencia','scene-nina-madrid','has-city');
   if(isPreset && image){
     hero.classList.add('has-city');
     hero.style.setProperty('background-image',`url("${image}")`,'important');
     hero.style.setProperty('background-size','cover','important');
     hero.style.setProperty('background-position','center center','important');
   }else if(city){
     hero.classList.add('has-city');
     hero.style.setProperty('background-image','none','important');
   }else{
     hero.style.setProperty('background-image','none','important');
   }
 }
 if(isPreset){
   if(holder)holder.innerHTML='';
   if(title){title.style.display='none';title.textContent='';}
 }else if(city){
   if(holder)holder.innerHTML=citySceneSvg(city);
   if(title){title.style.display='block';title.textContent=city;}
 }else{
   if(holder)holder.innerHTML='';
   if(title){title.style.display='none';title.textContent='';}
 }
}

function updateBigGoalVisibility(){
 const card=$('#bigGoalCard')||$('#bigGoalEmpty')?.closest('.card');
 if(!card)return;
 const hasGoal=!!(state.bigGoals&&state.bigGoals.length);
 card.style.display=hasGoal?'':'none';
}
function renderGoalVisual(){
 const goal=$('#bigGoalIcon');if(!goal)return;
 const avatar=activeChildRecord()?.avatar||'👦';
 const img=avatar==='👧'?'./ski-girl.webp':'./ski-boy.webp';
 goal.style.setProperty('background-image',`url("${img}")`,'important');
 goal.style.setProperty('background-size','cover','important');
 goal.style.setProperty('background-position','center center','important');
}

function renderActiveCity(){
 const city=state.profile?.city||activeChildRecord()?.city||'';
 const badge=$('#homeCityBadge'),name=$('#homeCityName');
 if(!badge||!name)return;
 if(city){name.textContent=city;badge.style.display='inline-flex';}
 else{badge.style.display='none';name.textContent='';}
}

function renderActiveChildIdentity(){
 const c=activeChildRecord();
 const configured=hasRealProfile();
 const name=configured?(state.profile?.name||c?.name||'').trim():'';
 const avatar=c?.avatar||'👦';
 const nameEl=$('#homeChildName'),logo=$('#activeChildLogo'),hero=$('#homeHero');
 if(nameEl)nameEl.textContent=name;
 if(logo)logo.textContent=configured?name.toUpperCase():'';
 if(hero){
   hero.classList.remove('girl','boy','neutral','no-profile');
   hero.classList.add(avatar==='👧'?'girl':(avatar==='🧒'?'neutral':'boy'));
   if(!configured)hero.classList.add('no-profile');
 }
 if($('#homeChildSubtitle'))$('#homeChildSubtitle').textContent=configured?'Hoy es un gran día para aprender, disfrutar y conseguir tus metas.':'';
}

function renderActiveChildName(){
 const c=activeChildRecord(),name=state.profile?.name||c?.name||'Hijo';
 document.querySelectorAll('[data-active-child-name]').forEach(el=>el.textContent=name);
}


function splitCityForPicker(city=''){
 const value=(city||'').trim();
 const key=cityKeyFromName(value);
 if(!value)return {select:'',custom:''};
 if(key==='valencia')return {select:'Valencia',custom:''};
 if(key==='madrid')return {select:'Madrid',custom:''};
 return {select:'__other__',custom:value};
}
function bindCityPicker(selectId, customId){
 const sel=$(selectId), custom=$(customId);
 if(!sel||!custom)return;
 sel.onchange=()=>{
   const other=sel.value==='__other__';
   custom.style.display=other?'block':'none';
   if(other) custom.focus();
   if(!other && customId==='#childCityCustom' && $('#childCityInput')) $('#childCityInput').value=sel.value||'';
 };
}
function setCityPickerValue(selectId, customId, city=''){
 const sel=$(selectId), custom=$(customId);
 if(!sel||!custom)return;
 const parts=splitCityForPicker(city);
 sel.value=parts.select;
 custom.value=parts.custom;
 custom.style.display=parts.select==='__other__'?'block':'none';
 if(customId==='#childCityCustom' && $('#childCityInput')) $('#childCityInput').value=city||'';
}
function getCityPickerValue(selectId, customId){
 const sel=$(selectId), custom=$(customId);
 if(!sel)return '';
 if(sel.value==='__other__') return (custom?.value||'').trim();
 return (sel.value||'').trim();
}
function renderProfileData(){
 if(!state.profile)return;
 if($('#profileNameTitle')) $('#profileNameTitle').textContent=state.profile.name||'Miguelito';
 if($('#profileNameInput')) $('#profileNameInput').value=state.profile.name||'Miguelito';
 if($('#profileBirthInput')) $('#profileBirthInput').value=state.profile.birthDate||'';
 if($('#profileAgeInput')) $('#profileAgeInput').value=state.profile.age||9;
 setCityPickerValue('#profileCitySelect','#profileCityCustom',state.profile.city||'');
 if($('#profileColorInput')) $('#profileColorInput').value=state.profile.color||'Azul';
 if($('#profileLikesInput')) $('#profileLikesInput').value=state.profile.likes||'';
}

$('#profileBirthInput').onchange=()=>{
 const a=ageFromBirth($('#profileBirthInput').value);
 if(a!==null)$('#profileAgeInput').value=a;
};

$('#saveProfileBtn').onclick=()=>{
 const birthDate=$('#profileBirthInput').value||'';
 const derivedAge=ageFromBirth(birthDate);
 state.profile={
   name:$('#profileNameInput').value.trim()||'Hijo',
   birthDate,
   city:getCityPickerValue('#profileCitySelect','#profileCityCustom'),
   age:derivedAge!==null?derivedAge:(Number($('#profileAgeInput').value)||9),
   color:$('#profileColorInput').value,
   likes:$('#profileLikesInput').value.trim()
 };
 const child=activeChildRecord();
 if(child){child.name=state.profile.name;child.birthDate=birthDate;child.city=state.profile.city;}
 toast('Perfil guardado ✅');
 save();
};

function renderExtras(){
 const completed=state.missions.filter(m=>m.status===1).length;
 const books=(state.reading?.history||[]).length;
 if($('#progressStars')) $('#progressStars').textContent=state.stars;
 if($('#progressTasks')) $('#progressTasks').textContent=completed;
 if($('#profileStars')) $('#profileStars').textContent=state.stars;
 if($('#profileLevel')) $('#profileLevel').textContent=Math.floor(state.xp/200)+1;
 if($('#profileXp')) $('#profileXp').textContent=state.xp;
 if($('#profileXpBar')) $('#profileXpBar').style.width=Math.min(100,state.xp/8)+'%';
 if($('#profileBooks')) $('#profileBooks').textContent=books;
 const vals=[42,58,67,74,55,81,92];
 const vals2=[28,52,45,61,70,54,78];
 const sb=$('#starBars'),tb=$('#taskBars');
 if(sb && !sb.children.length){
   ['L','M','X','J','V','S','D'].forEach((d,i)=>sb.insertAdjacentHTML('beforeend',`<div class="barcol"><i style="height:${vals[i]}px"></i>${d}</div>`));
 }
 if(tb && !tb.children.length){
   ['L','M','X','J','V','S','D'].forEach((d,i)=>tb.insertAdjacentHTML('beforeend',`<div class="barcol"><i style="height:${vals2[i]}px"></i>${d}</div>`));
 }
}

document.querySelectorAll('[data-achtab]').forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll('[data-achtab]').forEach(x=>x.classList.remove('on'));btn.classList.add('on');
 $('#ach-badges').classList.toggle('hidden',btn.dataset.achtab!=='badges');
 $('#ach-progress').classList.toggle('hidden',btn.dataset.achtab!=='progress');
});

document.addEventListener('click',e=>{
 const b=e.target.closest('[data-open]');
 if(!b)return;
 openScreen(b.dataset.open);
});


function weekStartDate(d=new Date()){
 const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
 const day=(x.getDay()+6)%7;
 x.setDate(x.getDate()-day);
 return x;
}
function weekKey(d=new Date()){
 const s=weekStartDate(d);
 return localDateKey(s);
}
function uniqueApprovalDates(){
 return [...new Set((state.approvalHistory||[]).map(x=>x.date))].sort();
}
function currentStreak(){
 const dates=new Set(uniqueApprovalDates());
 let d=new Date();
 let count=0;
 // If nothing approved today yet, allow the streak to continue from yesterday.
 if(!dates.has(localDateKey(d))) d.setDate(d.getDate()-1);
 while(dates.has(localDateKey(d))){
   count++;
   d.setDate(d.getDate()-1);
 }
 return count;
}
function thisWeekHistory(){
 const start=weekStartDate();
 const end=new Date(start);end.setDate(end.getDate()+7);
 return (state.approvalHistory||[]).filter(x=>{
   const d=new Date(x.date+'T12:00:00');
   return d>=start && d<end;
 });
}
function daysForTitle(fragment){
 const rows=thisWeekHistory().filter(x=>x.title.toLowerCase().includes(fragment.toLowerCase()));
 return new Set(rows.map(x=>x.date)).size;
}
function challengeDefs(){
 const base=state.defaultChallengesEnabled===false?[]:[
  {id:'read5',icon:'📚',title:'Leer 5 días',goal:5,stars:25,xp:40,match:'leer'},
  {id:'bed5',icon:'🛏️',title:'Hacer la cama 5 días',goal:5,stars:20,xp:30,match:'hacer la cama'},
  {id:'help3',icon:'🤝',title:'Ayudar 3 días',goal:3,stars:20,xp:30,match:'ayudar'}
 ];
 const custom=(state.customChallenges||[]).filter(c=>c.scope==='all'||c.ownerChildId===familyStore.activeChildId).map(c=>({id:c.id,icon:'🎯',title:c.title,goal:c.goal,stars:c.stars,xp:c.xp,match:(c.match||'').toLowerCase()}));
 return [...base,...custom].map(c=>{
   const dates=new Set((state.approvalHistory||[]).filter(x=>!c.match||x.title.toLowerCase().includes(c.match)).map(x=>x.date));
   c.value=dates.size;return c;
 });
}

function renderStreaks(){
 if(!$('#streakCount'))return;
 $('#streakCount').textContent=currentStreak();

 const wrap=$('#streakDays');
 wrap.innerHTML='';
 const names=['L','M','X','J','V','S','D'];
 const start=weekStartDate();
 const approved=new Set(uniqueApprovalDates());
 for(let i=0;i<7;i++){
   const d=new Date(start);d.setDate(d.getDate()+i);
   const el=document.createElement('div');
   el.className='streak-day'+(approved.has(localDateKey(d))?' on':'');
   el.textContent=approved.has(localDateKey(d))?'✓':names[i];
   wrap.appendChild(el);
 }

 const list=$('#weeklyChallenges');
 list.innerHTML='';
 const wk=weekKey();
 const claimed=(state.weeklyClaims&&state.weeklyClaims[wk])||[];
 challengeDefs().forEach(c=>{
   const done=Math.min(c.value,c.goal);
   const isClaimed=claimed.includes(c.id);
   const canClaim=done>=c.goal && !isClaimed;
   const row=document.createElement('div');
   row.className='challenge';
   row.innerHTML=`
     <div class="challenge-top">
       <div class="challenge-icon">${c.icon}</div>
       <div class="challenge-main"><b>${c.title}</b><span>${c.desc}</span></div>
       <b>${done}/${c.goal}</b>
     </div>
     <div class="challenge-progress"><i style="width:${Math.round(done/c.goal*100)}%"></i></div>
     <div class="challenge-foot">
       <div class="challenge-reward">+${c.stars} ⭐ · +${c.xp} XP</div>
       <button class="claimbtn" ${canClaim?'':'disabled'}>${isClaimed?'Conseguido ✓':canClaim?'Cobrar bonus':'En progreso'}</button>
     </div>`;
   const btn=row.querySelector('button');
   if(canClaim)btn.onclick=()=>claimChallenge(c.id);
   list.appendChild(row);
 });
}


function activeProjectsToday(){
 const today=todayUTC();
 return (state.projects||[]).filter(p=>{
   if(!p.due || p.grade)return false;
   const start=p.start?dateOnlyUTC(p.start):today;
   return today>=start && today<=dateOnlyUTC(p.due);
 });
}

function todayApprovals(){
 const key=localDateKey();
 return (state.approvalHistory||[]).filter(x=>x.date===key);
}

function todayReadingDone(){
 return todayApprovals().some(x=>x.title.toLowerCase().includes('leer 30 minutos'));
}

function summaryMessage(percent,reading,activeProjects,pending){
 if(percent>=100 && reading) return '🏆 ¡Día completísimo! Has terminado todas tus tareas y también la lectura.';
 if(percent>=75) return '🌟 ¡Muy buen día! Estás muy cerca de completarlo todo.';
 if(percent>=40) return '💪 Vas avanzando. Aún puedes sumar alguna misión más hoy.';
 if(activeProjects>0) return '🧩 Hoy conviene avanzar un poco en tus proyectos activos.';
 if(pending>0) return '👀 Tienes tareas hechas esperando aprobación de un adulto.';
 return '🚀 Cada pequeña misión cuenta. Empieza por una y suma tu primera victoria.';
}

function renderDailySummary(){
 const active=activeMissionsToday().map(([m])=>m);
 const approved=active.filter(m=>m.status===1);
 const pending=active.filter(m=>m.status===2);
 const hist=todayApprovals();
 const stars=hist.reduce((s,x)=>s+(Number(x.stars)||0),0);
 const xp=hist.reduce((s,x)=>s+(Number(x.xp)||0),0);
 const total=active.length;
 const percent=total?Math.round(approved.length/total*100):0;
 const reading=todayReadingDone();
 const projects=activeProjectsToday().length;

 if($('#dailySummaryDate')) $('#dailySummaryDate').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
 if($('#dailyScore')) $('#dailyScore').textContent=percent+'%';
 if($('#dailyTasks')) $('#dailyTasks').textContent=`${approved.length}/${total}`;
 if($('#dailyReading')) $('#dailyReading').textContent=reading?'Sí ✅':'Pendiente';
 if($('#dailyStars')) $('#dailyStars').textContent=stars;
 if($('#dailyXp')) $('#dailyXp').textContent=xp;
 if($('#dailyStreak')) $('#dailyStreak').textContent=currentStreak();
 if($('#dailyProjects')) $('#dailyProjects').textContent=projects;
 if($('#dailyMessage')) $('#dailyMessage').textContent=summaryMessage(percent,reading,projects,pending.length);

 const details=$('#dailyDetails');
 if(details){
   details.innerHTML='';
   const rows=[
     ['Tareas aprobadas',`${approved.length} de ${total}`],
     ['Pendientes de aprobación',pending.length],
     ['Lectura',reading?'Hecha':'Pendiente'],
     ['Proyectos activos',projects],
     ['Racha actual',`${currentStreak()} días`]
   ];
   rows.forEach(([a,b])=>details.insertAdjacentHTML('beforeend',`<div class="daily-row"><span>${a}</span><strong>${b}</strong></div>`));
 }

 const challenges=$('#dailyChallenges');
 if(challenges){
   challenges.innerHTML='';
   challengeDefs().forEach(c=>{
     const done=Math.min(c.value,c.goal);
     challenges.insertAdjacentHTML('beforeend',`
       <div class="challenge">
         <div class="challenge-top"><div class="challenge-icon">${c.icon}</div><div class="challenge-main"><b>${c.title}</b><span>${done}/${c.goal}</span></div></div>
         <div class="challenge-progress"><i style="width:${Math.round(done/c.goal*100)}%"></i></div>
       </div>`);
   });
 }

 if($('#parentDailyTasks')) $('#parentDailyTasks').textContent=`${approved.length}/${total}`;
 if($('#parentDailyStars')) $('#parentDailyStars').textContent=stars;
 if($('#parentDailyPending')) $('#parentDailyPending').textContent=pending.length;
 if($('#parentDailyMessage')) $('#parentDailyMessage').textContent=summaryMessage(percent,reading,projects,pending.length);
}


function renderTodayEvents(){
 const wrap=$('#todayEvents');
 if(!wrap)return;
 const key=localDateKey();
 const events=eventsForDate(key);
 wrap.innerHTML='';
 if(!events.length)return;
 const title=document.createElement('div');
 title.className='eyebrow';
 title.style.margin='5px 3px 2px';
 title.textContent='📅 HOY';
 wrap.appendChild(title);
 events.forEach(e=>{
   const box=document.createElement('div');
   box.className='today-event-box';
   box.innerHTML=`<b>${eventIcon(e.type)} ${e.title}</b><span>${e.time?e.time+' · ':''}${eventTypeLabel(e.type)}</span>`;
   wrap.appendChild(box);
 });
}

function updateFamilyCalendarVisibility(){
 const hide=parentsTogether();
 document.querySelector('.week-house-tools')?.classList.toggle('calendar-custody-hidden',hide);
 document.querySelector('.house-label')?.classList.toggle('calendar-custody-hidden',hide);
 document.querySelector('.house-switch')?.classList.toggle('calendar-custody-hidden',hide);
 const p=$('#setWeekPapaBtn'),m=$('#setWeekMamaBtn'),pd=$('#setPapaBtn'),md=$('#setMamaBtn');
 if(p)p.textContent=`👨 Semana con ${fatherName()}`;
 if(m)m.textContent=`👩 Semana con ${motherName()}`;
 if(pd)pd.textContent=`👨 ${fatherName()}`;
 if(md)md.textContent=`👩 ${motherName()}`;
}

function render(){
 updateBigGoalVisibility();
 renderFamilyData();
 updateFamilyCalendarVisibility();
 ['topstars','herostars','goalstars','rewardstars'].forEach(id=>{const el=$('#'+id);if(el)el.textContent=state.stars});
 $('#level').textContent=Math.floor(state.xp/200)+1;$('#xp').textContent=state.xp;$('#xpbar').style.width=Math.min(100,state.xp/8)+'%';
 const h=home(new Date());
const familyCard=$('#familyCard');
if(parentsTogether()){
 familyCard.style.display='none';
 familyCard.innerHTML='';
}else{
 familyCard.style.display='';
 const isMama=h==='Mamá';
 const person=isMama?motherName():fatherName();
 const emojiArt=isMama
  ? '<div class="family-illus"><div class="family-emoji-wrap"><div class="family-emoji">👩</div><div class="family-emoji small-kid">🧒</div></div></div>'
  : '<div class="family-illus"><div class="family-emoji-wrap"><div class="family-emoji">👨</div><div class="family-emoji small-kid">🧒</div></div></div>';
 familyCard.innerHTML=`${emojiArt}<div class="family-panel"><div class="eyebrow">Hoy estoy con</div><b>${person}</b><span>¡Juntos hacemos grandes cosas!</span></div>`;
}
 renderProjectReminders();renderModules();renderReading();renderProjects();renderCalendar();renderRewards();renderRewardAdmin();renderParents();renderExtras();renderProfileData();renderStreaks();renderTaskAdmin();renderDailySummary();renderEventAdmin();renderTodayEvents();renderRewardHistory();renderSyncConfig();renderBigGoal();renderGoalAdmin();renderSpecialAdmin();renderSpecialDay();renderSmartAlerts();renderSmartHome();renderNoticeCenter();renderReminderPrefs();renderChildSwitcher();renderChildManager();renderActiveChildName();renderActiveChildIdentity();renderChildTopSwitcher();renderChallengeAdmin();renderCityScene();renderGoalVisual();renderActiveCity()
}


function ensureTaskState(){
 state.missions.forEach(m=>{
   if(typeof m.enabled==='undefined')m.enabled=true;
   if(!m.house)m.house='Ambas';
 });
}
ensureTaskState();

function resetTaskForm(){
 $('#taskNameInput').value='';
 $('#taskSectionInput').value='Mañana';
 $('#taskStarsInput').value=5;
 $('#taskXpInput').value=10;
 $('#taskHouseInput').value='Ambas';
 $('#taskAssignInput').value='current';
 $('#saveTaskBtn').dataset.edit='';
 $('#saveTaskBtn').textContent='Añadir tarea';
}

function renderTaskAdmin(){
 const list=$('#taskAdminList');
 if(!list)return;
 list.innerHTML='';
 if(!state.missions.length){
   list.innerHTML='<div class="mmeta">No hay tareas creadas.</div>';
   return;
 }
 const order=['Mañana','Colegio','Tarde'];
 order.forEach(sec=>{
   const rows=state.missions.map((m,i)=>[m,i]).filter(([m])=>m.section===sec);
   if(!rows.length)return;
   const h=document.createElement('div');
   h.className='eyebrow';
   h.style.marginTop='10px';
   h.textContent=sec;
   list.appendChild(h);
   rows.forEach(([m,i])=>{
     const row=document.createElement('div');
     row.className='task-admin-row';
     row.innerHTML=`
       <div>
         <b>${m.title}</b>
         <div class="task-admin-meta">${m.stars} ⭐ · ${m.xp} XP · ${m.enabled===false?'Desactivada':'Activa'} <span class="task-house-pill">${m.house||'Ambas'}</span></div>
       </div>
       <div class="task-admin-actions">
         <button class="smallbtn uploadbtn" data-edittask="${i}">Editar</button>
         <button class="smallbtn togglebtn ${m.enabled===false?'off':'on'}" data-toggletask="${i}">${m.enabled===false?'Activar':'Desactivar'}</button>
         <button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-deltask="${i}">Eliminar</button>
       </div>`;
     list.appendChild(row);
   });
 });

 list.querySelectorAll('[data-edittask]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.edittask),m=state.missions[i];
   $('#taskNameInput').value=m.title;
   $('#taskSectionInput').value=m.section;
   $('#taskStarsInput').value=m.stars;
   $('#taskXpInput').value=m.xp;
   $('#taskHouseInput').value=m.house||'Ambas';
   $('#taskAssignInput').value=m.scope||'current';
   $('#saveTaskBtn').dataset.edit=String(i);
   $('#saveTaskBtn').textContent='Guardar cambios';
 });

 list.querySelectorAll('[data-toggletask]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.toggletask);
   state.missions[i].enabled=state.missions[i].enabled===false;
   save();
 });

 list.querySelectorAll('[data-deltask]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.deltask);
   if(confirm(`¿Eliminar "${state.missions[i].title}"?`)){
     state.missions.splice(i,1);
     toast('Tarea eliminada');
     save();
   }
 });
}

$('#saveTaskBtn').dataset.edit='';
$('#saveTaskBtn').onclick=()=>{
 const title=$('#taskNameInput').value.trim();
 if(!title){toast('Escribe el nombre de la tarea');return}
 const task={
   title,
   section:$('#taskSectionInput').value,
   stars:Math.max(0,Number($('#taskStarsInput').value)||0),
   xp:Math.max(0,Number($('#taskXpInput').value)||0),
   house:$('#taskHouseInput').value||'Ambas',
   scope:$('#taskAssignInput').value||'current',
   ownerChildId:familyStore.activeChildId,
   status:0,
   enabled:true
 };
 const edit=$('#saveTaskBtn').dataset.edit;
 if(edit!==''){
   const prev=state.missions[Number(edit)];
   task.status=prev.status||0;
   task.enabled=prev.enabled!==false;
   state.missions[Number(edit)]=task;
   toast('Tarea actualizada ✅');
 }else{
   state.missions.push(task);
   toast('Tarea creada ✅');
 }
 resetTaskForm();
 save();
};


function resetEventForm(){
 $('#eventTitleInput').value='';
 $('#eventTypeInput').value='exam';
 $('#eventDateInput').value=localDateKey();
 $('#eventTimeInput').value='';
 $('#saveEventBtn').dataset.edit='';
 $('#saveEventBtn').textContent='Añadir evento';
}

function renderEventAdmin(){
 const list=$('#eventAdminList');
 if(!list)return;
 list.innerHTML='';
 const events=(state.events||[]).slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 if(!events.length){
   list.innerHTML='<div class="mmeta">Todavía no hay eventos añadidos.</div>';
   return;
 }
 events.forEach(e=>{
   const realIndex=state.events.indexOf(e);
   const row=document.createElement('div');
   row.className='event-admin-row';
   row.innerHTML=`
     <div><b>${eventIcon(e.type)} ${e.title}</b><div class="mmeta">${new Date(e.date+'T12:00:00').toLocaleDateString('es-ES')}${e.time?' · '+e.time:''} · ${eventTypeLabel(e.type)}</div></div>
     <div class="task-admin-actions">
       <button class="smallbtn uploadbtn" data-editevent="${realIndex}">Editar</button>
       <button class="smallbtn" style="background:#ffe9ec;color:#a74354" data-delevent="${realIndex}">Eliminar</button>
     </div>`;
   list.appendChild(row);
 });
 list.querySelectorAll('[data-editevent]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.editevent),e=state.events[i];
   $('#eventTitleInput').value=e.title;
   $('#eventTypeInput').value=e.type;
   $('#eventDateInput').value=e.date;
   $('#eventTimeInput').value=e.time||'';
   $('#saveEventBtn').dataset.edit=String(i);
   $('#saveEventBtn').textContent='Guardar cambios';
 });
 list.querySelectorAll('[data-delevent]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.delevent);
   if(confirm(`¿Eliminar "${state.events[i].title}"?`)){
     state.events.splice(i,1);
     toast('Evento eliminado');
     save();
   }
 });
}
resetEventForm();

$('#saveEventBtn').onclick=()=>{
 const title=$('#eventTitleInput').value.trim();
 const date=$('#eventDateInput').value;
 if(!title){toast('Escribe el nombre del evento');return}
 if(!date){toast('Elige una fecha');return}
 const e={title,type:$('#eventTypeInput').value,date,time:$('#eventTimeInput').value||''};
 const edit=$('#saveEventBtn').dataset.edit;
 if(edit!==''){
   state.events[Number(edit)]=e;
   toast('Evento actualizado 📅');
 }else{
   state.events.push(e);
   toast('Evento añadido 📅');
 }
 resetEventForm();
 save();
};

function ensureParentPin(){
 if(!familyStore.parentPin){
   familyStore.parentPin=state?.parentPin||'1234';
   saveFamilyStore();
 }
}
ensureParentPin();

function openPin(){
 $('#pinInput').value='';
 $('#pinError').textContent='';
 $('#pinLock').style.display='flex';
 setTimeout(()=>$('#pinInput').focus(),30);
}
function closePin(){
 $('#pinLock').style.display='none';
}
function showParents(){
 document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('on'));
 document.querySelector('.nav button[data-screen="more"]')?.classList.add('on');
 document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
 $('#parents').classList.add('active');
 render();
}
function tryPin(){
 if($('#pinInput').value===String(familyStore.parentPin||'1234')){
   closePin();
   showParents();
 }else{
   $('#pinError').textContent='PIN incorrecto';
   $('#pinInput').value='';
   $('#pinInput').focus();
 }
}
$('#pinEnter').onclick=tryPin;
$('#pinCancel').onclick=closePin;
$('#pinInput').addEventListener('keydown',e=>{if(e.key==='Enter')tryPin()});
$('#pinLock').addEventListener('click',e=>{if(e.target===$('#pinLock'))closePin()});

$('#changePinBtn').onclick=()=>{
 const a=$('#newPinInput').value.trim();
 const b=$('#confirmPinInput').value.trim();
 if(!/^\d{4,6}$/.test(a)){toast('El PIN debe tener entre 4 y 6 números');return}
 if(a!==b){toast('Los PIN no coinciden');return}
 familyStore.parentPin=a;
 if(state)state.parentPin=a;
 saveFamilyStore();
 $('#newPinInput').value='';
 $('#confirmPinInput').value='';
 toast('PIN actualizado 🔐');
 save();
};

window.openScreen=openScreen;
$('#prev').onclick=()=>{weekOffset--;renderCalendar()};$('#next').onclick=()=>{weekOffset++;renderCalendar()};
resetGoalForm();resetSpecialForm();resetChildForm();resetChallengeForm();
render();
startFirstRun();


if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
