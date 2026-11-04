/* Native Firebase Authentication + Firestore REST. No Apps Script, Functions or Sheets.
 * The learning core provides UX validation; firestore.rules is the authority.
 */
(() => {
 'use strict';
 const cfg=window.CODE_THINK_CONFIG||{},project=cfg.firebase?.projectId,key=cfg.firebase?.apiKey;
 const SESSION='ct11-firebase-session',copy=x=>JSON.parse(JSON.stringify(x));
 const SHARED=new Set(['Classes','Tasks','Assignments','Settings']);
 const EMPTY=new Set(['Sessions']);
 const teacherOnly=new Set(['importStudents','bulkManageStudents','setupTeacher','installMaterials','unlockTemporaryPasswords','getTemporaryPasswords','teacherProfile','saveTeacherProfile','teacherReviewWorkspace','previewPurgeStudents','purgeStudents']);
 const norm=s=>String(s||'').trim().toLowerCase();
 const alias=login=>norm(login).includes('@')?norm(login):norm(login)+'@code-think.invalid';
 const random=()=>crypto.randomUUID().replaceAll('-','');
 const password=()=>'Ct!'+random().slice(0,18)+'7aA';
 let session=null,identity=null,profile=null,profileDocument=null,queue=Promise.resolve(),refreshing=null;
 const pendingAccounts=new Map(); // Only AES-GCM receipts are persisted in Firestore.
 const vault=window.CT_CREDENTIAL_VAULT;
 const readCache=new Map();
 try{session=JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{sessionStorage.removeItem(SESSION);}
 // Emulator settings are accepted on loopback only, never on a deployed site.
 const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
 const emu=local&&cfg.emulators;
 const authBase=emu?`http://${emu.auth}/identitytoolkit.googleapis.com/v1/`:'https://identitytoolkit.googleapis.com/v1/';
 const refreshBase=emu?`http://${emu.auth}/securetoken.googleapis.com/v1/token`:'https://securetoken.googleapis.com/v1/token';
 const storeBase=emu?`http://${emu.firestore}/v1/`:'https://firestore.googleapis.com/v1/';
 const root=`projects/${project}/databases/(default)/documents`;
 const messages={
  INVALID_LOGIN_CREDENTIALS:'Логин немесе құпиясөз қате. / Неверный логин или пароль.',EMAIL_NOT_FOUND:'Логин немесе құпиясөз қате. / Неверный логин или пароль.',INVALID_PASSWORD:'Құпиясөз қате. / Неверный пароль.',
  EMAIL_EXISTS:'Бұл логин тіркелген. / Этот логин уже зарегистрирован.',OPERATION_NOT_ALLOWED:'Firebase → Authentication → Email/Password әдісін қосыңыз. / Включите Email/Password в Firebase Authentication.',
  TOO_MANY_ATTEMPTS_TRY_LATER:'Кіру әрекеті тым көп. Кейінірек қайталаңыз. / Слишком много попыток. Повторите позже.',
  PERMISSION_DENIED:'Рұқсат жоқ. Аккаунтты және Firestore Rules баптауын тексеріңіз. / Нет доступа. Проверьте аккаунт и Firestore Rules.',
  RESOURCE_EXHAUSTED:'Firebase тегін лимиті уақытша аяқталды. Кейінірек қайталаңыз. / Бесплатный лимит Firebase временно исчерпан. Повторите позже.',
  ABORTED:'Деректер басқа терезеде өзгерді. Бетті жаңартып қайталаңыз. / Данные изменились в другом окне. Обновите страницу и повторите.',
  FAILED_PRECONDITION:'Деректер өзгерді. Бетті жаңартып қайталаңыз. / Данные изменились. Обновите страницу и повторите.'
 };
 function friendly(e){const raw=String(e?.message||e||'');const code=e?.code||raw.split(' : ')[0].split(':')[0];const error=Error(messages[code]||raw);error.code=code;return error;}
 async function request(url,body,token,method='POST',form=false){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);
  try{
   const headers={};if(body!==undefined)headers['Content-Type']=form?'application/x-www-form-urlencoded':'application/json';if(token)headers.Authorization='Bearer '+token;
   const r=await fetch(url,{method,headers,body:body===undefined?undefined:form?body:JSON.stringify(body),signal:ctl.signal});
   const result=await r.json();if(!r.ok){const err=Error(result.error?.message||result.error?.status||'HTTP '+r.status);err.code=result.error?.status||result.error?.message;err.status=r.status;throw err;}return result;
  }catch(e){if(e.name==='AbortError')throw Error('Байланыс уақыты аяқталды. Сақталғанын тексеріп, қайталаңыз. / Время ожидания истекло. Проверьте сохранение и повторите.');throw e;}finally{clearTimeout(timer);}
 }
 const auth=(action,body)=>request(authBase+'accounts:'+action+'?key='+key,body);
 function storeSession(r){session={uid:r.localId||r.user_id,idToken:r.idToken||r.id_token,refreshToken:r.refreshToken||r.refresh_token,expiresAt:Date.now()+(Number(r.expiresIn||r.expires_in||3600)-60)*1000};sessionStorage.setItem(SESSION,JSON.stringify(session));}
 async function token(){
  if(!session)throw Error('Қайта кіріңіз. / Войдите снова.');
  if(session.expiresAt>Date.now())return session.idToken;
  if(!refreshing)refreshing=request(refreshBase+'?key='+key,'grant_type=refresh_token&refresh_token='+encodeURIComponent(session.refreshToken),null,'POST',true).then(r=>{storeSession(r);return session.idToken;}).catch(e=>{clear();throw e;}).finally(()=>refreshing=null);
  return refreshing;
 }
 function clear(){vault.lock();session=null;identity=null;profile=null;profileDocument=null;communitySyncedAt=0;pendingAccounts.clear();readCache.clear();sessionStorage.removeItem(SESSION);sessionStorage.removeItem('ct11-token');}
 async function fs(path,body,method='POST'){return request(storeBase+path,body,await token(),method);}
 const val=v=>{
  if(v===null)return {nullValue:null};if(typeof v==='boolean')return {booleanValue:v};
  if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};
  if(Array.isArray(v))return {arrayValue:{values:v.map(val)}};
  if(v&&typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).filter(([,v])=>v!==undefined).map(([k,v])=>[k,val(v)]))}};
  return {stringValue:String(v??'')};
 };
 function plain(v){if('stringValue'in v)return v.stringValue;if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return v.doubleValue;if('booleanValue'in v)return v.booleanValue;if('nullValue'in v)return null;if('timestampValue'in v)return v.timestampValue;if('arrayValue'in v)return (v.arrayValue.values||[]).map(plain);if('mapValue'in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,v])=>[k,plain(v)]));return null;}
 function decode(doc){return Object.assign(Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,plain(v)])),{__localKey:doc.name.split('/').pop()});}
 const path=(table,id,sid=identity?.schoolId)=>`${root}/schools/${sid}/${table}/${id}`;
 async function getDoc(name,tx){
  try{return await fs(name,undefined,'GET');}catch(e){if(e.status===404)return null;throw e;}
 }
 async function current(){
  await token();let d=await getDoc(`${root}/identities/${session.uid}`);if(!d){await finishLoginHandoff();d=await getDoc(`${root}/identities/${session.uid}`);}if(!d)throw Error('Аккаунт платформада дайындалмаған. Мұғалімге хабарласыңыз. / Аккаунт не подготовлен. Обратитесь к учителю.');
  identity=decode(d);const p=await getDoc(path('Users',identity.userId));if(!p)throw Error('Аккаунт табылмады. / Аккаунт не найден.');profileDocument=p;profile=decode(p);
  if(profile.authUid!==session.uid||String(profile.active)!=='true'||profile.deletedAt)throw Error('Аккаунт қолжетімсіз. Мұғалімге хабарласыңыз. / Аккаунт недоступен. Обратитесь к учителю.');
  return profile;
 }
 function rowKey(table,r){
  if(r.id)return r.id;
  const keys={Answers:['attemptId','taskIndex'],DiagnosticProfiles:['userId','attemptType'],MethodProgress:['userId','stepIndex','modelVersion'],ClassStudents:['userId'],TaskSteps:['attemptId','stepCode','modelVersion'],SkillScores:['userId','sourceId','skillKey'],Settings:['key']};
  return keys[table]?keys[table].map(k=>String(r[k]??'')).join('__'):r.__localKey;
 }
 async function load(names,tx,p={},action=''){
  const tables={},documents=new Map();
  const taskActions=new Set(['startTaskAttempt','saveTaskCode','saveTaskStep','submitTask','saveLearningEvidence','startPrediction','completePrediction','startTransfer']);
  let target=profile.role==='student'&&taskActions.has(action)&&action!=='startTaskAttempt'?p.attemptId||'':'';
  if(profile.role==='student'&&action==='completePrediction'&&p.id){const evidence=await getDoc(path('LearningEvidence',p.id),tx);target=evidence?decode(evidence).attemptId:'';}
  await Promise.all([...new Set(names)].map(async table=>{
   if(EMPTY.has(table)||(profile.role!=='teacher'&&['PedagogyReviews','RegistrationJobs','TeacherSolutions'].includes(table))){tables[table]=[];return;}
   let docs;
   if(table==='Users'&&profile.role!=='teacher'){tables[table]=[copy(profile)];return;}
   else{
    const structuredQuery={from:[{collectionId:table}]};
    const filters=[],eq=(field,value)=>({fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:{stringValue:value}}});
    if(profile.role!=='teacher'&&!SHARED.has(table))filters.push(eq('__ownerId',profile.id));
    if(target){if(['TaskSteps','LearningEvidence','TransferProbes'].includes(table))filters.push(eq('attemptId',target));if(table==='TaskAttempts')filters.push(eq('id',target));}
    if(profile.role==='student'&&p.attemptId&&['saveAnswer','submitAttempt','recordEvent'].includes(action)){
     if(['Answers','Events'].includes(table))filters.push(eq('attemptId',p.attemptId));if(table==='Attempts')filters.push(eq('id',p.attemptId));
    }
    if(filters.length)structuredQuery.where=filters.length===1?filters[0]:{compositeFilter:{op:'AND',filters}};
    const cacheKey=identity.schoolId+'|'+table+'|'+JSON.stringify(structuredQuery.where||{});
    const canCache=!tx&&((profile.role==='student'&&SHARED.has(table)&&table!=='Settings')||(profile.role==='teacher'&&readOnly.has(action)));
    const hit=canCache&&readCache.get(cacheKey);
    if(hit&&hit.expiresAt>Date.now()){docs=copy(hit.docs);}
    else{
    const body={structuredQuery};
    const rows=await fs(`${root}/schools/${identity.schoolId}:runQuery`,body);docs=rows.filter(r=>r.document).map(r=>r.document);
    if(canCache)readCache.set(cacheKey,{docs:copy(docs),expiresAt:Date.now()+30000});
    }
   }
   tables[table]=docs.map(d=>{documents.set(d.name,d);return decode(d);});
  }));
  return {tables,documents};
 }
 function ownerId(table,r,tables){
  if(table==='Users')return r.id;if(r.userId)return r.userId;
  if(['Answers','TaskSteps','LearningEvidence'].includes(table)){const parent=(tables[table==='Answers'?'Attempts':'TaskAttempts']||[]).find(a=>a.id===r.attemptId);return parent?.userId||r.__ownerId;}
  return '';
 }
 function clean(table,r,tables){
  const result={};for(const field of window.CT_CORE.schemas[table]||[])if(r[field]!==undefined&&!['passwordHash','passwordSalt','accessCodeHash','teacherAccessCode'].includes(field))result[field]=r[field];
  if(table==='Users'){result.authUid=r.authUid;if(r.authChangedAt)result.authChangedAt=r.authChangedAt;if(r.deletedAt!==undefined)result.deletedAt=r.deletedAt;if(r.authLogin)result.authLogin=r.authLogin;if(r.loginHash)result.loginHash=r.loginHash;}
  if(!SHARED.has(table)&&table!=='PedagogyReviews')result.__ownerId=ownerId(table,r,tables);
  return result;
 }
 function documentWrite(name,obj,old,submitted=false){
  const transforms=[{fieldPath:'__updatedAt',setToServerValue:'REQUEST_TIME'}];
  if(!old)transforms.push({fieldPath:'__createdAt',setToServerValue:'REQUEST_TIME'});
  if(submitted)transforms.push({fieldPath:'__submittedAt',setToServerValue:'REQUEST_TIME'});
  // Preserve server-owned metadata across full-document replacements.
  const fields={...Object.fromEntries(Object.entries(old?.fields||{}).filter(([k])=>k.startsWith('__'))),...Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,val(v)]))};
  return {update:{name,fields},currentDocument:old?{updateTime:old.updateTime}:{exists:false},updateTransforms:transforms};
 }
 function writesFor(state,core){
  const writes=[];
  for(const table of core.dirty){
   if(EMPTY.has(table))continue;
   const remaining=new Set();
   for(const r of core.data[table]){
    const id=rowKey(table,r);if(!id)throw Error('Жазба кілті жоқ. / Нет ключа записи.');
    const name=path(table,id),old=state.documents.get(name),obj=clean(table,r,core.data);remaining.add(name);
    const before=old?clean(table,decode(old),state.tables):null;
    if(JSON.stringify(before)===JSON.stringify(obj))continue;
    writes.push(documentWrite(name,obj,old,obj.status==='submitted'&&(!old||plain(old.fields.status)!=='submitted')));
   }
   for(const r of state.tables[table]||[]){const name=path(table,rowKey(table,r));if(!remaining.has(name)){const old=state.documents.get(name);writes.push({delete:name,currentDocument:{updateTime:old.updateTime}});}}
  }
  return writes;
 }
 async function commit(writes,tx){
  if(!writes.length)return;
  const batch=writes.slice();
  // Firebase Auth clients use atomic commits with version preconditions.
  // The actor's existing profile is a compare-and-set guard: another tab cannot
  // save a mutation based on the same stale read. Rules already allow updating
  // only __updatedAt on one's own profile; no permission changes are needed.
  const guard=profileDocument&&profileDocument.name===path('Users',profile?.id)?profileDocument:null;
  if(guard&&!batch.some(w=>w.update?.name===guard.name||w.delete===guard.name)){
   batch.push({update:{name:guard.name,fields:copy(guard.fields)},currentDocument:{updateTime:guard.updateTime},updateTransforms:[{fieldPath:'__updatedAt',setToServerValue:'REQUEST_TIME'}]});
  }
  if(batch.length>400)throw Error('Жазбалар көп. Әрекетті кішірек топпен қайталаңыз. / Слишком много записей. Повторите меньшей группой.');
  const result=await fs(root+':commit',{writes:batch});readCache.clear();
  const name=identity&&profile?path('Users',profile.id):null,index=batch.findIndex(w=>w.update?.name===name);
  if(index>=0){
   const write=batch[index],saved=result.writeResults[index];
   profileDocument={...copy(write.update),updateTime:saved.updateTime};
   (write.updateTransforms||[]).forEach((tr,i)=>{profileDocument.fields[tr.fieldPath]=saved.transformResults[i];});
   profile=decode(profileDocument);
  }
 }
 const readOnly=new Set(['schoolWorkspace','me','teacherDashboard','studentWorkspace','pedagogyWorkspace','correctionWorkspace','teacherSolution','getTaskTests','checkTaskOutputs']);
 async function learning(action,p){
  const names=window.CT_CORE.dependencies[action];if(!names)throw Error('Әрекет табылмады. / Действие не найдено.');
  let tx;
  try{
   if(!readOnly.has(action))tx={optimistic:true};
   const state=await load(names,tx,p,action),u=state.tables.Users.find(x=>x.id===profile.id)||profile;
   let materials=[];
   if(['teacherSolution','getTaskTests','checkTaskOutputs'].includes(action)){
    const t=state.tables.Tasks.find(t=>t.id===p.taskId);if(t){const table=action==='teacherSolution'?'TeacherSolutions':'TaskChecks';const d=await getDoc(path(table,t.sourceKey||t.id),tx);if(d)materials=[decode(d)];}
   }
   const core=window.CT_CORE.create(state.tables,u,p,materials),result=core.run(action);
   await commit(writesFor(state,core),tx);
   if(profile.role==='teacher'&&['gradeTask','gradeCorrection','gradeTransfer','enrollStudent','updateStudent'].includes(action))await syncCommunityScores(true).catch(()=>{communitySyncedAt=0;});
   if(profile.role==='teacher'&&['gradeTask','enrollStudent','updateStudent'].includes(action))await syncOlympiadAccess().catch(()=>{});
   return result;
  }catch(e){throw e;}
 }

 // Olympiad preparation: teacher-managed access and self-reported browser checks.
 // Practice verdicts never update grades, SkillScores, CommunityScores or XP.
 const olympiadTables=['Users','ClassStudents','Tasks','Assignments','TaskAttempts'];
 const olympiadTask=id=>window.CT_OLYMPIAD_BANK.find(t=>t.id===id);
 async function syncOlympiadAccess(){
  requireTeacher();
  const oldDocs=await queryDocuments('OlympiadAccess'),old=new Map(oldDocs.map(d=>[decode(d).userId,d]));
  const state=await load(olympiadTables,{optimistic:true}),writes=[];
  for(const u of state.tables.Users.filter(u=>u.role==='student'&&String(u.active)==='true'&&!u.deletedAt)){
   const d=old.get(u.id),prior=d&&decode(d);if(prior?.manual)continue;
   const ready=window.CT_OLYMPIAD_MODEL.readiness(state.tables,u),obj={userId:u.id,...ready,manual:false};
   if(prior&&Object.entries(obj).every(([k,v])=>prior[k]===v))continue;
   writes.push(documentWrite(path('OlympiadAccess',u.id),obj,d));
  }
  for(let i=0;i<writes.length;i+=4)await commit(writes.slice(i,i+4));
  return state;
 }
 async function olympiadWorkspace(){
  if(profile.role==='teacher'){
   const state=await syncOlympiadAccess();
   const [access,work]=await Promise.all([queryDocuments('OlympiadAccess'),queryDocuments('OlympiadWork')]);
   return {allowed:true,users:state.tables.Users.filter(u=>u.role==='student'&&String(u.active)==='true'&&!u.deletedAt).map(u=>({id:u.id,name:u.name,grade:u.grade,className:u.className,...window.CT_OLYMPIAD_MODEL.readiness(state.tables,u)})),access:access.map(decode),work:work.map(decode)};
  }
  requirePupil();const access=await getDoc(path('OlympiadAccess',profile.id)),entry=access&&decode(access);
  const state=await load(olympiadTables,null,{},'studentWorkspace');
  const ready=window.CT_OLYMPIAD_MODEL.readiness(state.tables,profile);
  return {allowed:entry?.allowed===true,...{completed:ready.completed,total:ready.total},work:entry?.allowed===true?(await queryDocuments('OlympiadWork',[['__ownerId',profile.id]])).map(decode):[]};
 }
 async function setOlympiadAccess(p){
  requireTeacher();const d=await getDoc(path('Users',String(p.userId||''))),u=d&&decode(d);
  if(!u||u.role!=='student'||String(u.active)!=='true'||u.deletedAt)throw Error('Белсенді оқушыны таңдаңыз. / Выберите активного ученика.');
  const state=await load(olympiadTables,{optimistic:true}),ready=window.CT_OLYMPIAD_MODEL.readiness(state.tables,u);
  const name=path('OlympiadAccess',u.id),old=await getDoc(name),manual=p.mode!=='auto';
  if(manual&&typeof p.allowed!=='boolean')throw Error('Қолжетімділікті таңдаңыз. / Выберите доступ.');
  await commit([documentWrite(name,{userId:u.id,...ready,allowed:manual?p.allowed:ready.allowed,manual},old)]);
  return olympiadWorkspace();
 }
 async function saveOlympiadWork(p){
  requirePupil();const task=olympiadTask(String(p.taskId||''));
  if(!task)throw Error('Есеп табылмады. / Задача не найдена.');
  const access=await getDoc(path('OlympiadAccess',profile.id));
  if(!access||decode(access).allowed!==true)throw Error('Олимпиада бөлімі әлі ашылмаған. / Раздел олимпиады ещё не открыт.');
  const code=String(p.code||''),inputData=String(p.inputData||''),lastOutput=String(p.lastOutput||'');
  if(code.length>20000||inputData.length>200000||lastOutput.length>12000)throw Error('Код немесе кіріс тым ұзын. / Код или ввод слишком длинный.');
  const id=profile.id+'__'+task.id,name=path('OlympiadWork',id),old=await getDoc(name),prior=old?decode(old):{};
  const submitted=p.submit===true,total=submitted?task.tests.length:0,passed=submitted?Number(p.passed):0;
  const verdict=submitted?String(p.verdict):'draft';
  if(submitted&&(!code.trim()||!Number.isInteger(passed)||passed<0||passed>total||!['accepted','wrong','error','timeout','stopped'].includes(verdict)||(verdict==='accepted'&&passed!==total)))throw Error('Тексеру нәтижесі жарамсыз. / Некорректный результат проверки.');
  const obj={id,userId:profile.id,__ownerId:profile.id,taskId:task.id,code,inputData,lastOutput,verdict,passed,total,submissions:(Number(prior.submissions)||0)+(submitted?1:0),solved:prior.solved===true||verdict==='accepted',selfReported:true};
  await commit([documentWrite(name,obj,old)]);return decode(await getDoc(name));
 }

 // Only a teacher publishes XP. Student heartbeats never contain a score.
 let communitySyncedAt=0;
 const communityTables=['Users','ClassStudents','Tasks','Assignments','TaskAttempts','Corrections','TransferProbes'];
 async function syncCommunityScores(force=false){
  if(profile.role!=='teacher'||(!force&&Date.now()-communitySyncedAt<300000))return;
  // Read projection versions BEFORE source data: a concurrent publication fails
  // its compare-and-set instead of overwriting a newer teacher's result.
  const [existing,present]=await Promise.all([queryDocuments('CommunityScores'),queryDocuments('Presence')]);
  const old=new Map(existing.map(d=>[decode(d).userId,d]));
  const state=await load(communityTables,{optimistic:true});
  const scores=window.CT_COMMUNITY_MODEL.scores(state.tables,window.CT_PROFILE.compute),remaining=new Set(),writes=[];
  for(const score of scores){
   remaining.add(score.userId);const prior=old.get(score.userId),row=prior&&decode(prior);
   if(row&&['userId','name','classId','xp'].every(k=>row[k]===score[k]))continue;
   writes.push({update:{name:path('CommunityScores',score.userId),fields:Object.fromEntries(Object.entries(score).map(([k,v])=>[k,val(v)]))},currentDocument:prior?{updateTime:prior.updateTime}:{exists:false},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]});
  }
  for(const [id,doc] of old)if(!remaining.has(id))writes.push({delete:doc.name,currentDocument:{updateTime:doc.updateTime}});
  const allowed=new Map(scores.map(r=>[r.userId,r]));
  for(const doc of present){const p=decode(doc),row=allowed.get(p.userId);if(p.role==='student'&&(!row||row.classId!==p.classId||row.name!==p.name))writes.push({delete:doc.name,currentDocument:{updateTime:doc.updateTime}});}
  // Each score validates User/enrollment/tombstone; stay below the Rules
  // per-commit document access budget as well as Firestore's write limit.
  for(let i=0;i<writes.length;i+=4)await fs(root+':commit',{writes:writes.slice(i,i+4)});
  communitySyncedAt=Date.now();
 }
 async function communityWorkspace(){
  const teacher=profile.role==='teacher';
  const enrollment=teacher?null:await getDoc(path('ClassStudents',profile.id));
  const classId=teacher?'__teacher__':enrollment?decode(enrollment).classId:'';
  const presence={userId:profile.id,name:profile.name,role:profile.role,classId};
  // One document per account bounds storage, deduplicates tabs, and avoids
  // marking a still-open second tab offline when the first tab signs out.
  const pulse=await fs(root+':commit',{writes:[{update:{name:path('Presence',profile.id),fields:Object.fromEntries(Object.entries(presence).map(([k,v])=>[k,val(v)]))},updateTransforms:[{fieldPath:'lastSeen',setToServerValue:'REQUEST_TIME'}]}]});
  if(teacher)await syncCommunityScores().catch(()=>{});
  const query=async(table,scope)=>{
   const q={from:[{collectionId:table}]};
   if(scope)q.where={fieldFilter:{field:{fieldPath:'classId'},op:scope.length===1?'EQUAL':'IN',value:scope.length===1?val(scope[0]):val(scope)}};
   return (await fs(root+'/schools/'+identity.schoolId+':runQuery',{structuredQuery:q})).filter(r=>r.document).map(r=>decode(r.document));
  };
  const [people,scores]=await Promise.all([query('Presence',teacher?null:classId?[classId,'__teacher__']:['__teacher__']),teacher||classId?query('CommunityScores',teacher?null:[classId]):Promise.resolve([])]);
  // Use the server's pulse time for expiry even if the device clock is wrong.
  const now=Date.parse(pulse.writeResults[0].transformResults[0].timestampValue);
  if(!people.some(p=>p.userId===profile.id))people.push({...presence,lastSeen:new Date(now).toISOString()});
  const rows=window.CT_COMMUNITY_MODEL.online(people,scores,now);
  return {rows,serverNow:now};
 }

 // Bounded, idempotent active-time pulses. Never used to award grades or XP.
 async function timingWorkspace(){
  const filters=profile.role==='teacher'?[]:[['__ownerId',profile.id]];
  return (await queryDocuments('TaskTimes',filters)).map(decode);
 }
 async function recordTaskTime(p){
  requirePupil();const attemptId=String(p.attemptId||''),phase=String(p.phase||''),pulseId=String(p.pulseId||''),seconds=Number(p.seconds);
  if(!attemptId||attemptId.includes('/')||!['task','correction'].includes(phase)||!Number.isInteger(seconds)||seconds<0||seconds>3600||!/^[a-f0-9-]{16,64}$/.test(pulseId))throw Error('Уақыт дерегі қате. / Неверные данные времени.');
  const atDoc=await getDoc(path('TaskAttempts',attemptId)),at=atDoc&&decode(atDoc);
  if(!at||at.userId!==profile.id)throw Error('Жұмыс қолжетімсіз. / Работа недоступна.');
  const name=path('TaskTimes',attemptId+'__'+phase),old=await getDoc(name),before=old&&decode(old);
  if(before?.pulseIds?.includes(pulseId))return before;
  if(phase==='task'&&at.status!=='in_progress'||phase==='correction'&&(at.status!=='graded'||at.correctionsOpen!==true))throw Error('Уақыт есептеу осы жұмыс үшін тоқтаған. / Учёт времени для этой работы остановлен.');
  const last=before?.__updatedAt||at.__createdAt,elapsed=Math.max(0,Math.floor((Date.now()-Date.parse(last))/1000));
  const delta=Math.min(seconds,Number.isFinite(elapsed)?elapsed:0),obj={id:attemptId+'__'+phase,attemptId,userId:profile.id,__ownerId:profile.id,phase,totalSeconds:(before?.totalSeconds||0)+delta,pulseIds:[...(before?.pulseIds||[]),pulseId].slice(-20)};
  await commit([documentWrite(name,obj,old)]);return {...obj,__updatedAt:new Date().toISOString()};
 }

 // Store actual first/latest selections; never assign a teacher score here.
 async function saveConclusionQuiz(p){
  requirePupil();const id=String(p.attemptId||'');if(!id||id.includes('/'))throw Error('Жұмыс кілті қате. / Неверный ключ работы.');
  const atDoc=await getDoc(path('TaskAttempts',id)),at=atDoc&&decode(atDoc);
  if(!at||at.userId!==profile.id||at.status!=='in_progress')throw Error('Жұмыс қолжетімсіз. / Работа недоступна.');
  const stageDocs=await queryDocuments('TaskSteps',[['__ownerId',profile.id],['attemptId',id]]),tested=stageDocs.find(d=>decode(d).stepCode==='TH');if(!tested||!String(decode(tested).response||'').trim())throw Error('Алдымен кодты орындап, тексеруді сақта. / Сначала выполни код и сохрани проверку.');
  const assignment=await getDoc(path('Assignments',at.assignmentId)),task=assignment&&await getDoc(path('Tasks',decode(assignment).taskId));if(!task)throw Error('Есеп табылмады. / Задача не найдена.');
  const evidenceDocs=await queryDocuments('LearningEvidence',[['__ownerId',profile.id],['attemptId',id]]);
  const taskData=decode(task),sourceKey=taskData.sourceKey||window.CT_CONTENT.tasks.find(x=>x.kk.title===taskData.title)?.sourceKey,eName=path('LearningEvidence',id+':INK'),old=evidenceDocs.find(d=>d.name===eName),sName=path('TaskSteps',id+'__INK__5'),stepDoc=stageDocs.find(d=>d.name===sName);let details={};try{details=JSON.parse(old?decode(old).detailsJson:'{}');}catch{}
  const engine=window.CT_CONCLUSION,quiz=engine.answer(sourceKey,details.quiz,p.question,p.choice);
  const fields=engine.fields(sourceKey,quiz),obj={id:id+':INK',userId:profile.id,__ownerId:profile.id,attemptId:id,kind:'stage',step:'INK',detailsJson:JSON.stringify({...details,legacyFields:details.legacyFields||(!details.quiz&&details.fields?.some(Boolean)?details.fields:undefined),legacyResponse:details.legacyResponse||(!details.quiz&&stepDoc?decode(stepDoc).response:undefined),fields,quiz,sourceKey,flowVersion:4}),updatedAt:new Date().toISOString()};
  const writes=[documentWrite(eName,obj,old)];if(engine.results(sourceKey,quiz).complete)writes.push(documentWrite(sName,{attemptId:id,stepCode:'INK',modelVersion:5,response:fields.join('\n\n'),score:'',feedback:'',updatedAt:new Date().toISOString(),__ownerId:profile.id},stepDoc));
  await commit(writes);return {evidence:obj,quiz,results:engine.results(sourceKey,quiz)};
 }

 async function requireVault(){if(!await vault.restore(profile))throw Error('Алдымен мұғалім паролімен уақытша парольдер қорын ашыңыз. / Сначала откройте хранилище временных паролей паролем учителя.');}
 async function receiptWrite(record){const name=path('RegistrationJobs','credential_'+record.userId),old=await getDoc(name);return documentWrite(name,await vault.seal(record),old);}
 async function temporaryPasswords(knownUsers){
  const unlocked=await vault.restore(profile);if(!unlocked)return {unlocked:false,entries:[],unreadable:0};
  const users=knownUsers||(await load(['Users'],{optimistic:true})).tables.Users;
  const eligible=new Map(users.filter(u=>u.role==='student'&&!u.deletedAt&&u.mustChangePassword===true).map(u=>[u.id,u]));
  const rows=await fs(`${root}/schools/${identity.schoolId}:runQuery`,{structuredQuery:{from:[{collectionId:'RegistrationJobs'}],where:{fieldFilter:{field:{fieldPath:'credentialVersion'},op:'EQUAL',value:{integerValue:'1'}}}}});
  const entries=[];let unreadable=0;
  for(const row of rows){if(!row.document)continue;const doc=decode(row.document),u=eligible.get(doc.userId);if(!u||u.login!==doc.login)continue;try{const credential=await vault.open(doc);entries.push({...credential,name:u.name,className:u.className,grade:String(u.grade),ok:true});}catch{unreadable++;}}
  return {unlocked:true,entries,unreadable};
 }


 async function loginHash(login){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(norm(login)))),x=>x.toString(16).padStart(2,'0')).join('');}
 async function resolveLogin(login){
  const canonical=norm(login);
  // Real teacher email addresses are never routed through the pupil directory.
  if(canonical.includes('@'))return canonical;
  try{const d=await request(storeBase+root+'/loginRoutes/'+await loginHash(canonical),undefined,null,'GET');const row=decode(d);if(!/^s[78]-[a-f0-9]{14}$/.test(row.authLogin||''))throw Error('Кіру байланысы жарамсыз. / Некорректная запись входа.');return row.authLogin;}
  catch(e){if(e.status===404)return canonical;throw e;}
 }
 async function assertDirectoryOwner(){
  const d=await getDoc(root+'/platformConfig/auth');
  if(!d||decode(d).directoryOwnerUid!==profile.id)throw Error('Логинді сақтайтын баптау әлі қосылмаған. Жоба әкімшісіне хабарласыңыз. / Сохранение логина ещё не настроено. Обратитесь к администратору проекта.');
 }
 async function loginRouteWrite(u,a){
  const hash=await loginHash(u.login),name=root+'/loginRoutes/'+hash,old=await getDoc(name);
  if(old&&(decode(old).schoolId!==identity.schoolId||decode(old).userId!==u.id))throw Error('Логин басқа аккаунтпен байланысқан. / Логин связан с другим аккаунтом.');
  return documentWrite(name,{version:1,schoolId:identity.schoolId,userId:u.id,authLogin:a.login},old);
 }

 async function createAccount(cacheKey,grade,requestedLogin=''){
  if(pendingAccounts.has(cacheKey)){
   const item=pendingAccounts.get(cacheKey);
   if(requestedLogin&&item.login!==requestedLogin)throw Error('Логин өзгерді. Тіркеуді қайта бастаңыз. / Логин изменён. Повторите регистрацию.');
   return item;
  }
  const capacity=registrationCapacity();if(!capacity.remaining){const e=Error('Тіркеу шегіне жақындадық. Кейінірек қалған оқушыларды жалғастырыңыз. / Достигнут безопасный предел регистрации. Продолжите оставшихся позже.');e.code='REGISTRATION_PAUSED';e.retryAt=capacity.retryAt;throw e;}
  const login=requestedLogin||'s'+grade+'-'+random().slice(0,14),pw=password();
  const r=await auth('signUp',{email:alias(login),password:pw,returnSecureToken:true});
  registrationRecorded();const item={login,temporaryPassword:pw,authUid:r.localId,discardToken:r.idToken};pendingAccounts.set(cacheKey,item);return item;
 }
 async function discard(item){try{await auth('delete',{idToken:item.discardToken});}catch{}pendingAccounts.delete(item.cacheKey);}
 async function importOne(row,job){
  const name=String(row.name||'').trim(),grade=String(row.grade||''),className=String(row.className||'').trim();
  if(!name||name.length>150||!className||className.length>40||!['7','8'].includes(grade))throw Error('Аты-жөні, 7/8 деңгейі және сынып атауы қажет. / Нужны ФИО, параллель 7/8 и класс.');
  const classGrade=/^\s*([78])/.exec(className);if(classGrade&&classGrade[1]!==grade)throw Error('Сынып атауы мен деңгейі сәйкес емес. / Название класса и параллель не совпадают.');
  const customLogin=Object.hasOwn(row,'login'),requestedLogin=customLogin?norm(row.login):'';
  if(customLogin&&!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(requestedLogin))throw Error('Логин: 3–32 таңба, латын әріптері, сандар, нүкте, _ немесе -. / Логин: 3–32 символа, латинские буквы, цифры, точка, _ или -.');
  if(customLogin&&(requestedLogin.includes('..')||requestedLogin.endsWith('.')))throw Error('Логин нүктемен аяқталмасын және нүктелер қатар келмесін. / Логин не должен заканчиваться точкой или содержать две точки подряд.');
  const marker='import_'+job+'_'+String(row.row||1),markerPath=path('RegistrationJobs',marker);
  const processed=await getDoc(markerPath);if(processed)return {alreadyProcessed:true,row:row.row,name,ok:true};
  let tx;
  try{
   tx={optimistic:true};
   const state=await load(['Users','Classes','ClassStudents','Assignments','Tasks'],tx);
   const inTx=await getDoc(markerPath,tx);if(inTx)return {alreadyProcessed:true,row:row.row,name,ok:true};
   if(state.tables.Users.some(u=>u.role==='student'&&norm(u.name)===norm(name)&&norm(u.className)===norm(className)))throw Error('Бұл оқушы сыныпта бар. / Ученик уже есть в классе.');
   if(requestedLogin&&(state.tables.Users.some(u=>norm(u.login)===requestedLogin)||await getDoc(root+'/loginRoutes/'+await loginHash(requestedLogin))))throw Error('Бұл логин тіркелген. Басқа логин таңдаңыз. / Этот логин уже зарегистрирован. Выберите другой.');
   const cls=state.tables.Classes.find(c=>norm(c.name)===norm(className));
   if(cls&&String(cls.grade)!==grade)throw Error('Сынып атауы басқа деңгеймен тіркелген. / Класс зарегистрирован для другой параллели.');
   const account=await createAccount(marker,grade,requestedLogin);account.cacheKey=marker;
   const userId='USR-'+random(),u={id:userId,login:account.login,authUid:account.authUid,name,grade,className,role:'student',active:true,mustChangePassword:true,createdAt:new Date().toISOString(),lastLoginAt:''};
   const core=window.CT_CORE.create(state.tables,profile);core.enroll(profile,u);
   const writes=writesFor(state,core);
   writes.push(await receiptWrite({userId,login:account.login,temporaryPassword:account.temporaryPassword}));
   writes.push(documentWrite(`${root}/identities/${account.authUid}`,{schoolId:identity.schoolId,userId},null));
   writes.push(documentWrite(markerPath,{id:marker,userId},null));
   await commit(writes,tx);pendingAccounts.delete(marker);
   return {ok:true,row:row.row,name,grade,className,userId,login:account.login,temporaryPassword:account.temporaryPassword};
  }catch(e){throw e;}
 }
 async function importStudents(p){
  await requireVault();
  if(!Array.isArray(p.students)||!p.students.length||p.students.length>20||!/^[-a-zA-Z0-9_]{8,100}$/.test(p.requestId||''))throw Error('Импорт сұрауын жаңартыңыз. / Повторите запрос импорта.');
  const results=[];for(let i=0;i<p.students.length;i++){
   const row={...p.students[i],row:p.students[i].row||i+2};
   try{results.push(await importOne(row,p.requestId));}catch(e){const paused=e.code==='REGISTRATION_PAUSED'||e.code==='TOO_MANY_ATTEMPTS_TRY_LATER'||e.message==='TOO_MANY_ATTEMPTS_TRY_LATER';results.push({row:row.row,name:row.name,ok:false,deferred:paused,retryAt:e.retryAt||Date.now()+3600000,error:friendly(e).message});if(paused){for(const rest of p.students.slice(i+1))results.push({row:rest.row,name:rest.name,ok:false,deferred:true,retryAt:e.retryAt||Date.now()+3600000,error:friendly(e).message});break;}}
  }
  const fresh=results.filter(x=>x.ok&&!x.alreadyProcessed);return {created:fresh.length,failed:results.filter(x=>!x.ok).length,results:results.filter(x=>!x.alreadyProcessed),alreadyProcessed:results.every(x=>x.alreadyProcessed)};
 }
 async function bulk(p){
  const ids=p.userIds;if(!Array.isArray(ids)||!ids.length||ids.length>20)throw Error('1–20 оқушы таңдаңыз. / Выберите 1–20 учеников.');
  const state=await load(['Users','Classes','ClassStudents','Assignments','Tasks']),core=window.CT_CORE.create(state.tables,profile),credentials=[];
  const users=ids.map(id=>state.tables.Users.find(u=>u.id===id&&u.role==='student'));if(users.some(x=>!x))throw Error('Оқушы табылмады. / Ученик не найден.');
  const replacements=[];
  if(p.operation==='reset'){await requireVault();await assertDirectoryOwner();}
  for(const u of users){
   const dest=core.data.Users.find(x=>x.id===u.id);core.dirty.add('Users');
   if(u.deletedAt&&p.operation!=='restore')throw Error('Алдымен өшірілген оқушыны қалпына келтіріңіз. / Сначала восстановите удалённого ученика.');
   if(p.operation==='archive'){dest.active=false;dest.deletedAt=new Date().toISOString();dest.authChangedAt=Date.now();}
   else if(p.operation==='restore'){dest.active=true;dest.deletedAt='';dest.authChangedAt=Date.now();}
   else if(p.operation==='block'||p.operation==='activate'){dest.active=p.operation==='activate';if(!dest.active)dest.authChangedAt=Date.now();}
   else if(p.operation==='move'){const c=core.data.Classes.find(x=>x.id===p.classId);if(!c)throw Error('Сыныпты таңдаңыз. / Выберите класс.');core.run('enrollStudent',{userId:u.id,classId:c.id});}
   else if(p.operation==='reset'){
    const done=p.requestId&&await getDoc(path('RegistrationJobs','reset_'+p.requestId+'_'+u.id));
    if(done){const receipt=await getDoc(path('RegistrationJobs','credential_'+u.id));if(receipt&&decode(receipt).login===u.login){const saved=await vault.open(decode(receipt));credentials.push({...saved,name:u.name,className:u.className,ok:true});}continue;}
    const a=await createAccount('reset_'+u.id+'_'+(p.requestId||random()),u.grade);
    Object.assign(dest,{authLogin:a.login,loginHash:await loginHash(u.login),authUid:a.authUid,mustChangePassword:true,authChangedAt:Date.now()});
    replacements.push({a,userId:u.id,user:u});credentials.push({userId:u.id,name:u.name,className:u.className,login:u.login,temporaryPassword:a.temporaryPassword,ok:true});
   }else throw Error('Әрекет белгісіз. / Неизвестное действие.');
  }
  const writes=writesFor(state,core);
  for(const {a,userId,user:u}of replacements){writes.push(documentWrite(`${root}/identities/${a.authUid}`,{schoolId:identity.schoolId,userId},null));writes.push(await receiptWrite({userId,login:u.login,temporaryPassword:a.temporaryPassword}));writes.push(await loginRouteWrite(u,a));if(p.requestId)writes.push(documentWrite(path('RegistrationJobs','reset_'+p.requestId+'_'+userId),{userId,operation:'reset'},null));}
  await commit(writes);for(const {a}of replacements)for(const [k,v]of pendingAccounts)if(v===a)pendingAccounts.delete(k);
  await syncCommunityScores(true).catch(()=>{communitySyncedAt=0;});
  return {updated:users.length,operation:p.operation,credentials};
 }
 async function queryDocuments(table,filters=[],global=false){
  const eq=([field,value])=>({fieldFilter:{field:{fieldPath:field},op:'EQUAL',value:val(value)}}),clauses=filters.map(eq),q={from:[{collectionId:table}]};
  if(clauses.length)q.where=clauses.length===1?clauses[0]:{compositeFilter:{op:'AND',filters:clauses}};
  const parent=global?root:root+'/schools/'+identity.schoolId;
  return (await fs(parent+':runQuery',{structuredQuery:q})).filter(x=>x.document).map(x=>x.document);
 }
 function requireTeacher(){if(profile.role!=='teacher')throw Error('Мұғалім құқығы қажет. / Нужны права учителя.');}
 async function teacherProfile(){requireTeacher();const d=await getDoc(path('TeacherProfiles',profile.id));return {user:window.CT_CORE.create({},profile).publicUser(profile),preferences:d?decode(d):{avatar:'owl',subject:'Информатика',bio:''}};}
 async function saveTeacherProfile(p){
  requireTeacher();const name=String(p.name||'').trim(),subject=String(p.subject||'').trim(),bio=String(p.bio||'').trim();
  if(!name||name.length>150||!subject||subject.length>80||bio.length>500||!avatars.has(p.avatar))throw Error('Аты-жөні, пән және аватарды тексеріңіз. / Проверьте ФИО, предмет и аватар.');
  const n=path('TeacherProfiles',profile.id),old=await getDoc(n),uName=path('Users',profile.id),u=await getDoc(uName);
  await commit([documentWrite(n,{id:profile.id,teacherId:profile.id,avatar:p.avatar,subject,bio},old),documentWrite(uName,{...clean('Users',decode(u),{}),name},u)]);return teacherProfile();
 }
 async function teacherReviewWorkspace(p){
  requireTeacher();const id=String(p.attemptId||'');if(!id||id.includes('/'))throw Error('Жұмысты таңдаңыз. / Выберите работу.');
  const d=await getDoc(path('TaskAttempts',id));if(!d)throw Error('Жұмыс табылмады. / Работа не найдена.');const at=decode(d);
  const [ud,ad]=await Promise.all([getDoc(path('Users',at.userId)),getDoc(path('Assignments',at.assignmentId))]);
  if(!ud||!ad||decode(ud).deletedAt)throw Error('Алдымен оқушыны архивтен қайтарыңыз. / Сначала восстановите ученика из архива.');
  const a=decode(ad),td=await getDoc(path('Tasks',a.taskId));
  const [ss,ee,cc]=await Promise.all([queryDocuments('TaskSteps',[['attemptId',id]]),queryDocuments('LearningEvidence',[['attemptId',id]]),queryDocuments('Corrections',[['sourceId',id]])]);
  return {attempt:at,assignment:a,task:td?decode(td):{},student:window.CT_CORE.create({},profile).publicUser(decode(ud)),steps:ss.map(decode),evidence:ee.map(decode),corrections:cc.map(decode).filter(c=>c.userId===at.userId&&c.kind==='task')};
 }
 const purgeTables=['ClassStudents','Attempts','Answers','DiagnosticProfiles','MethodProgress','TaskAttempts','TaskSteps','SkillScores','Events','Corrections','LearningEvidence','TransferProbes','StudentProfiles','RegistrationJobs','TaskTimes','Presence','CommunityScores','OlympiadAccess','OlympiadWork'];
 async function purgeDocuments(userId){
  const groups=await Promise.all(purgeTables.map(async table=>({table,docs:await queryDocuments(table,[[['Answers','TaskSteps','LearningEvidence'].includes(table)?'__ownerId':'userId',userId]])})));
  for(const table of ['identities','loginRoutes','LoginHandoffs'])groups.push({table,docs:await queryDocuments(table,[['schoolId',identity.schoolId],['userId',userId]],true)});
  return groups;
 }
 async function purgeCandidate(userId){
  if(!/^USR-[a-zA-Z0-9_-]+$/.test(userId))throw Error('Оқушыны таңдаңыз. / Выберите ученика.');
  const u=await getDoc(path('Users',userId)),job=await getDoc(path('PurgeJobs',userId));
  if(u){const r=decode(u);if(r.role!=='student'||r.active!==false||!r.deletedAt)throw Error('Біржола жою тек архивтегі оқушыға арналған. / Безвозвратное удаление доступно только для ученика в архиве.');}
  else if(!job)throw Error('Оқушы табылмады. / Ученик не найден.');
  return {u,job};
 }
 async function previewPurgeStudents(p){
  requireTeacher();const ids=[...new Set(p.userIds||[])];if(!ids.length||ids.length>10)throw Error('1–10 оқушы таңдаңыз. / Выберите 1–10 учеников.');const rows=[];
  for(const id of ids){const {u,job}=await purgeCandidate(id);if(job&&decode(job).status==='done'){rows.push({id,completed:true,total:0,counts:{},authAccountIds:[]});continue;}const groups=await purgeDocuments(id),r=u?decode(u):{};
   rows.push({id,name:r.name||'',login:r.login||'',className:r.className||'',total:groups.reduce((n,g)=>n+g.docs.length,0)+(u?1:0),counts:Object.fromEntries(groups.map(g=>[g.table,g.docs.length])),authAccountIds:[...new Set([r.authUid,...groups.find(g=>g.table==='identities').docs.map(d=>d.name.split('/').at(-1))].filter(Boolean))]});
  }return {rows};
 }
 async function purgeStudents(p){
  requireTeacher();if(p.confirmation!=='DELETE_PLATFORM_DATA')throw Error('Жоюды растаңыз. / Подтвердите удаление.');const ids=[...new Set(p.userIds||[])];if(!ids.length||ids.length>10)throw Error('1–10 оқушы таңдаңыз. / Выберите 1–10 учеников.');let completed=0,deleted=0;
  for(const id of ids){let {u,job}=await purgeCandidate(id);const jobName=path('PurgeJobs',id);if(job&&decode(job).status==='done'){completed++;continue;}
   if(!job){const tombName=path('DeletedPupils',id);await commit([documentWrite(tombName,{id,userId:id},null),documentWrite(jobName,{id,userId:id,status:'deleting',deletedCount:1},null),{delete:u.name,currentDocument:{updateTime:u.updateTime}}]);}
   const groups=await purgeDocuments(id),docs=groups.flatMap(g=>g.docs);let total=0;
   for(let i=0;i<docs.length;i+=200){job=await getDoc(jobName);const count=Number(decode(job).deletedCount)||0,chunk=docs.slice(i,i+200),writes=chunk.map(d=>({delete:d.name,currentDocument:{updateTime:d.updateTime}}));writes.push(documentWrite(jobName,{id,userId:id,status:'deleting',deletedCount:count+chunk.length},job));await commit(writes);total+=chunk.length;}
   const remaining=await purgeDocuments(id);if(remaining.some(g=>g.docs.length))throw Error('Жою аяқталмады. «Жоюды жалғастыру» басыңыз. / Удаление не завершено. Нажмите «Продолжить удаление».');
   job=await getDoc(jobName);await commit([documentWrite(jobName,{id,userId:id,status:'done',deletedCount:Number(decode(job).deletedCount)||0},job)]);completed++;deleted+=total;
  }return {completed,deleted,authAccountsDeleted:false};
 }

 // Profile preferences contain no grades, XP or credentials.
 const avatars=new Set(['robot','rocket','owl','cat','turtle','star']);
 function requirePupil(){if(profile.role!=='student'||profile.mustChangePassword)throw Error('Оқушы аккаунты қажет. / Нужен аккаунт ученика.');}
 async function studentProfile(){
  requirePupil();const d=await getDoc(path('StudentProfiles',profile.id));return d?decode(d):{avatar:'robot',goalText:'',weeklyTarget:2};
 }
 async function saveStudentProfile(p){
  requirePupil();const goal=String(p.goalText||'').trim(),n=Number(p.weeklyTarget);
  if(!avatars.has(p.avatar)||goal.length>240||!Number.isInteger(n)||n<1||n>5)throw Error('Аватар, 240 таңбаға дейінгі мақсат және 1–5 тапсырма таңда. / Выбери аватар, цель до 240 символов и 1–5 заданий.');
  const name=path('StudentProfiles',profile.id),old=await getDoc(name);
  await commit([documentWrite(name,{id:profile.id,userId:profile.id,__ownerId:profile.id,avatar:p.avatar,goalText:goal,weeklyTarget:n},old)]);
  return studentProfile();
 }
 // A pupil authorizes a one-time handoff using their current password. Native
 // Auth reserves the new username. The recipient token can only complete this
 // exact handoff; pupil identity and all educational records remain unchanged.
 async function changeStudentLogin(p){
  requirePupil();const login=norm(p.login),pw=String(p.currentPassword||'');
  if(!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(login)||/^s[78]-[a-f0-9]{14}$/.test(login))throw Error('Логин: 3–32 латын әрпі, сан, нүкте, _ немесе -. / Логин: 3–32 латинских символа, цифры, точка, _ или -.');
  if(login===norm(profile.login))return {changed:false,login};
  if(profile.__loginChangedAt&&Date.now()-new Date(profile.__loginChangedAt).getTime()<86400000)throw Error('Логинді тәулігіне бір рет өзгертуге болады. / Логин можно менять раз в сутки.');
  const fresh=await auth('signInWithPassword',{email:alias(profile.authLogin||profile.login),password:pw,returnSecureToken:true});
  if(fresh.localId!==session.uid)throw Error('Аккаунт сәйкес емес. / Аккаунт не совпадает.');storeSession(fresh);
  const hash=await loginHash(login);if(await getDoc(root+'/loginRoutes/'+hash))throw Error('Бұл логин бос емес. / Этот логин занят.');
  const capacity=registrationCapacity();if(!capacity.remaining)throw Error('Тіркеу шегі уақытша аяқталды. Кейінірек қайтала. / Лимит регистрации временно исчерпан. Повтори позже.');
  const next=await auth('signUp',{email:alias(login),password:pw,returnSecureToken:true});registrationRecorded();
  const h={schoolId:identity.schoolId,userId:profile.id,oldAuthUid:session.uid,newAuthUid:next.localId,newLogin:login,loginHash:hash,completed:false};
  try{await commit([documentWrite(root+'/LoginHandoffs/'+next.localId,h,null)]);}
  catch(e){
   // If the response was lost, do not erase an account with an accepted handoff.
   let accepted;try{accepted=await getDoc(root+'/LoginHandoffs/'+next.localId);}catch{throw Error('Байланыс үзілді. Жаңа логин мен қазіргі парольмен кіріп көр; болмаса бұрынғы логинмен қайтала. / Связь прервана. Попробуй новый логин с текущим паролем, иначе повтори со старым логином.');}
   if(!accepted){try{await auth('delete',{idToken:next.idToken});}catch{}throw e;}
  }
  storeSession(next);identity=null;profile=null;profileDocument=null;
  await finishLoginHandoff();clear();return {changed:true,login,loginAgain:true};
 }
 async function finishLoginHandoff(){
  const hName=root+'/LoginHandoffs/'+session.uid,d=await getDoc(hName);if(!d)return false;
  const h=decode(d);if(h.completed||h.newAuthUid!==session.uid) return false;
  const uName=path('Users',h.userId,h.schoolId),old=await getDoc(uName);if(!old)throw Error('Аккаунт табылмады. / Аккаунт не найден.');
  const u=decode(old);identity={schoolId:h.schoolId,userId:h.userId};profile=u;profileDocument=old;
  const renamed={...u,login:h.newLogin,authLogin:h.newLogin,loginHash:h.loginHash,authUid:session.uid};
  const w=documentWrite(uName,clean('Users',renamed,{}),old);w.updateTransforms.push({fieldPath:'__loginChangedAt',setToServerValue:'REQUEST_TIME'});
  await commit([w,documentWrite(root+'/identities/'+session.uid,{schoolId:h.schoolId,userId:h.userId},null),documentWrite(hName,{...Object.fromEntries(Object.entries(h).filter(([k])=>!k.startsWith('__'))),completed:true},d)]);
  return true;
 }

 async function changePassword(p){
  const pw=String(p.password||'');if(pw.length<12||pw.length>128||pw===p.currentPassword)throw Error('Жаңа құпиясөз өзгеше, 12–128 таңбалы болсын. / Выберите новый пароль длиной 12–128 символов.');
  const fresh=await auth('signInWithPassword',{email:alias(profile.authLogin||profile.login),password:String(p.currentPassword||''),returnSecureToken:true});
  if(fresh.localId!==session.uid)throw Error('Аккаунт сәйкес емес. / Аккаунт не совпадает.');
  const updated=await auth('update',{idToken:fresh.idToken,password:pw,returnSecureToken:true});storeSession({...fresh,...updated});
  const name=path('Users',profile.id),old=await getDoc(name),obj=decode(old);obj.mustChangePassword=false;
  await commit([documentWrite(name,clean('Users',obj,{}),old)]);clear();return {changed:true,loginAgain:true};
 }
 async function setupTeacher(p){
  if(!String(p.name||'').trim())throw Error('Аты-жөніңізді енгізіңіз. / Введите имя.');
  const login=norm(p.login);
  if(login.length>64||!(/^[a-z0-9][a-z0-9._-]{2,50}$/.test(login)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)))throw Error('Мұғалім логиніне өз email-ыңызды енгізіңіз. / Используйте свой email как логин учителя.');
  if(String(p.password||'').length<12||String(p.password).length>128)throw Error('Құпиясөз 12–128 таңба. / Пароль: 12–128 символов.');
  let r;
  try{r=await auth('signUp',{email:alias(p.login),password:p.password,returnSecureToken:true});}
  catch(e){if(e.message!=='EMAIL_EXISTS')throw e;r=await auth('signInWithPassword',{email:alias(p.login),password:p.password,returnSecureToken:true});}
  storeSession(r);const sid=r.localId;identity={schoolId:sid,userId:sid};
  const approval=await getDoc(`${root}/teacherAccess/${sid}`);
  if(!approval||decode(approval).enabled!==true)return {needsApproval:true,uid:sid};
  const existing=await getDoc(`${root}/identities/${sid}`);
  if(existing){const who=decode(existing);if(who.schoolId!==sid||who.userId!==sid)throw Error('Бұл оқушы аккаунты. Мұғалімге басқа логин таңдаңыз. / Это аккаунт ученика. Выберите другой логин учителя.');await current();return {exists:true,user:profile};}
  const u={id:sid,authUid:sid,login:norm(p.login),name:String(p.name).trim(),role:'teacher',active:true,mustChangePassword:false,grade:'',className:'',createdAt:new Date().toISOString(),lastLoginAt:''};
  const writes=[documentWrite(path('Users',sid,sid),{...u,__ownerId:sid},null),documentWrite(`${root}/identities/${sid}`,{schoolId:sid,userId:sid},null)];
  for(const t of window.CT_CORE.taskSeed){const task={...t,createdAt:new Date().toISOString()};writes.push(documentWrite(path('Tasks',task.id,sid),task,null));}
  await commit(writes);profile=u;return {user:u,created:true};
 }
 async function installMaterials(p){
  const list=p.materials;if(!Array.isArray(list)||list.length!==31||list.some(x=>!/^guide-\d{2}$/.test(x.sourceKey||'')||typeof x.sampleCode!=='string'))throw Error('teacher-materials.json файлын таңдаңыз. / Выберите teacher-materials.json.');
  const writes=[];for(const m of list){for(const table of ['TeacherSolutions','TaskChecks']){const name=path(table,m.sourceKey),old=await getDoc(name);const obj=table==='TeacherSolutions'?m:Object.fromEntries(Object.entries(m).filter(([k])=>!['sampleCode','note'].includes(k)));writes.push(documentWrite(name,obj,old));}}
  await commit(writes);return {installed:list.length};
 }
 // One snapshot per screen; avoid re-reading the same collections for four calls.
 async function schoolWorkspace(p){
  const teacher=profile.role==='teacher',view=String(p.view||'overview');
  let names=teacher?['Users','Classes','ClassStudents','Tasks','Assignments','Attempts','TaskAttempts','Settings','SkillScores']:['Users','Classes','ClassStudents','Tasks','Assignments','Attempts','Answers','TaskAttempts','TaskSteps','Settings','SkillScores','DiagnosticProfiles','MethodProgress','Corrections','TransferProbes'];
  if(teacher&&view==='overview')names.push('Corrections');
  if(teacher&&view==='diagnostics')names.push('Answers','DiagnosticProfiles');
  if(teacher&&['work','overview','thinking','review'].includes(view))names.push('TaskSteps');
  if(teacher&&view==='corrections')names.push('Corrections','Answers','TaskSteps');
  if((teacher&&view==='pedagogy')||(!teacher&&['task','transfer','probe','results','profile'].includes(view)))names.push('LearningEvidence','TransferProbes','PedagogyReviews');
  const state=await load(names,null,p,'schoolWorkspace');
  const core=window.CT_CORE.create(state.tables,profile);
  const result=teacher?{dashboard:core.run('teacherDashboard'),teacherWS:core.run('teacherWorkspace'),corrections:core.run('correctionWorkspace')}:{mine:core.run('me'),workspace:core.run('studentWorkspace'),corrections:core.run('correctionWorkspace')};
  result.ped=(names.includes('LearningEvidence')||names.includes('TransferProbes'))?core.run('pedagogyWorkspace'):{evidence:[],probes:[],reviews:[]};
  await commit(writesFor(state,core));if(!teacher)result.studentProfile=await studentProfile();else result.teacherProfile=await teacherProfile();if(teacher&&view==='students'){result.temporaryPasswords=await temporaryPasswords(state.tables.Users);result.purgeJobs=(await queryDocuments('PurgeJobs',[['status','deleting']])).map(decode);}result.timings=await timingWorkspace();return result;
 }
 const backupTables=[...Object.keys(window.CT_CORE.schemas).filter(n=>n!=='Sessions'),'TeacherSolutions','TaskChecks','TaskTimes','OlympiadAccess','OlympiadWork'];
 async function exportBackup(){
  if(profile.role!=='teacher')throw Error('Мұғалім құқығы қажет. / Нужны права учителя.');
  const state=await load(backupTables,{optimistic:true}),tables={};
  for(const [table,rows] of Object.entries(state.tables))tables[table]=rows.map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>!k.startsWith('__')&&!['password','passwordHash','passwordSalt','temporaryPassword','accessCodeHash','teacherAccessCode'].includes(k))));
  // Keep document keys for rows without an id (composite keys and material IDs).
  for(const table of backupTables)(tables[table]||[]).forEach((r,i)=>{const old=state.tables[table][i];r.backupKey=rowKey(table,old);if(old.__ownerId)r.backupOwner=old.__ownerId;if(old.__submittedAt)r.backupSubmittedAt=old.__submittedAt;});
  const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(tables))))).map(b=>b.toString(16).padStart(2,'0')).join('');
  return {format:'code-think-learning-backup',version:1,projectId:project,schoolId:identity.schoolId,createdAt:new Date().toISOString(),checksum,tables};
 }
 async function restoreBackup(p){
  if(profile.role!=='teacher')throw Error('Мұғалім құқығы қажет. / Нужны права учителя.');
  const b=p.backup;
  if(!b||b.format!=='code-think-learning-backup'||b.version!==1||b.projectId!==project||b.schoolId!==identity.schoolId)throw Error('Бұл көшірме осы жоба мен мұғалімге тиесілі емес. / Копия относится к другому проекту или учителю.');
  const checksum=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(b.tables))))).map(n=>n.toString(16).padStart(2,'0')).join('');
  if(checksum!==b.checksum)throw Error('Көшірме өзгерген немесе бүлінген. / Копия изменена или повреждена.');
  const entries=Object.entries(b.tables||{});if(entries.some(([n,rs])=>!backupTables.includes(n)||!Array.isArray(rs))||entries.reduce((n,[,rs])=>n+rs.length,0)>50000)throw Error('Көшірме құрылымы жарамсыз. / Неверная структура копии.');
  const state=await load(backupTables,{optimistic:true}),writes=[];let skipped=0,accounts=0;
  const users=new Set((state.tables.Users||[]).map(x=>x.id));
  for(const [table,rows]of entries){
   if(table==='Users'){accounts+=rows.length;continue;} // Authentication and credentials are never restored from a file.
   for(const item of rows){
    const id=String(item.backupKey||rowKey(table,item)||'');if(!id||id.includes('/')||id.length>1400)throw Error('Көшірмедегі жазба кілті қате. / Неверный ключ записи.');
    const name=path(table,id);if(state.documents.has(name)){skipped++;continue;}
    if(item.userId&&!users.has(item.userId)){skipped++;continue;}
    if(item.backupOwner&&!users.has(item.backupOwner)){skipped++;continue;}
    const raw=Object.fromEntries(Object.entries(item).filter(([k])=>!k.startsWith('backup')&&!k.startsWith('__')&&!['password','temporaryPassword','passwordHash','passwordSalt','accessCodeHash','teacherAccessCode'].includes(k)));
    if(item.backupOwner)raw.__ownerId=item.backupOwner;
    const obj=['TeacherSolutions','TaskChecks','TaskTimes','OlympiadAccess','OlympiadWork'].includes(table)?raw:clean(table,raw,state.tables);
    const write=documentWrite(name,obj,null);
    if(item.backupSubmittedAt){if(!Number.isFinite(Date.parse(item.backupSubmittedAt)))throw Error('Уақыт мәні қате. / Неверная дата.');write.update.fields.__submittedAt={timestampValue:item.backupSubmittedAt};}
    writes.push(write);
   }
  }
  if(p.preview!==false)return {ready:writes.length,skipped,accounts,mode:'missing-only'};
  let restored=0;for(let i=0;i<writes.length;i+=25){await commit(writes.slice(i,i+25));restored+=Math.min(25,writes.length-i);}
  return {restored,skipped,accounts,mode:'missing-only'};
 }
 const quotaStore=typeof localStorage!=='undefined'?localStorage:sessionStorage;
 function registrationEvents(){try{return JSON.parse(quotaStore.getItem('ct-registration:'+project)||'[]').filter(x=>Number(x)>Date.now()-3600000);}catch{return [];}}
 function registrationCapacity(){const times=registrationEvents();return {remaining:Math.max(0,80-times.length),retryAt:times.length?Math.min(...times)+3600000:Date.now()};}
 function registrationRecorded(){const times=registrationEvents();times.push(Date.now());try{quotaStore.setItem('ct-registration:'+project,JSON.stringify(times));}catch{}}

 async function dispatch(action,p={}){
  if(!project||!key)throw Error('Firebase config.js баптауларын толтырыңыз. / Заполните Firebase config.js.');
  if(action==='ping')return {version:'12.0.0',backend:'firebase-direct',plan:'Spark',customStudentLogins:true};
  if(action==='logout'){clear();return {loggedOut:true};}
  if(action==='setupTeacher'){const r=await setupTeacher(p);if(!r.needsApproval&&profile?.role==='teacher')await vault.unlock(profile,String(p.password));return r;}
  if(action==='login'){
   vault.lock();const authLogin=await resolveLogin(p.login);const r=await auth('signInWithPassword',{email:alias(authLogin),password:String(p.password||''),returnSecureToken:true});storeSession(r);
   try{await current();if(norm(profile.login)!==norm(p.login))throw Error('Логин немесе құпиясөз қате. / Неверный логин или пароль.');if(p.role&&profile.role!==p.role)throw Error('Аккаунт рөлін дұрыс таңдаңыз. / Выберите правильную роль аккаунта.');
    const name=path('Users',profile.id),old=await getDoc(name),obj=decode(old);obj.lastLoginAt=new Date().toISOString();await commit([documentWrite(name,clean('Users',obj,{}),old)]);
    if(profile.role==='teacher')await vault.unlock(profile,String(p.password||''));
    return {token:random(),user:window.CT_CORE.create({},profile).publicUser(profile)};
   }catch(e){clear();throw e;}
  }
  await current();
  if(teacherOnly.has(action)&&profile.role!=='teacher')throw Error('Мұғалім құқығы қажет. / Нужны права учителя.');
  if(profile.mustChangePassword&&!['me','changePassword'].includes(action))throw Error('Алдымен уақытша құпиясөзді ауыстырыңыз. / Сначала смените временный пароль.');
  if(action==='unlockTemporaryPasswords'){const r=await auth('signInWithPassword',{email:alias(profile.login),password:String(p.password||''),returnSecureToken:true});if(r.localId!==session.uid)throw Error('Аккаунт сәйкес емес. / Аккаунт не совпадает.');await vault.unlock(profile,String(p.password));return temporaryPasswords();}
  if(action==='getTemporaryPasswords')return temporaryPasswords();
  if(action==='schoolWorkspace')return schoolWorkspace(p);
  if(action==='exportBackup')return exportBackup();
  if(action==='restoreBackup')return restoreBackup(p);
  if(action==='importStudents')return importStudents(p);
  if(action==='bulkManageStudents')return bulk(p);
  if(action==='teacherProfile')return teacherProfile();
  if(action==='saveTeacherProfile')return saveTeacherProfile(p);
  if(action==='timingWorkspace')return timingWorkspace();
  if(action==='communityWorkspace')return communityWorkspace();
  if(action==='olympiadWorkspace')return olympiadWorkspace();
  if(action==='setOlympiadAccess')return setOlympiadAccess(p);
  if(action==='saveOlympiadWork')return saveOlympiadWork(p);
  if(action==='saveConclusionQuiz')return saveConclusionQuiz(p);
  if(action==='recordTaskTime')return recordTaskTime(p);
  if(action==='teacherReviewWorkspace')return teacherReviewWorkspace(p);
  if(action==='previewPurgeStudents')return previewPurgeStudents(p);
  if(action==='purgeStudents')return purgeStudents(p);
  if(action==='changePassword')return changePassword(p);
  if(action==='changeStudentLogin')return changeStudentLogin(p);
  if(action==='studentProfile')return studentProfile();
  if(action==='saveStudentProfile')return saveStudentProfile(p);
  if(action==='installMaterials')return installMaterials(p);
  if(action==='gradeTask'){
   requireTeacher();const d=await getDoc(path('TaskAttempts',String(p.attemptId||''))),at=d&&decode(d);
   if(!at||!['submitted','graded'].includes(at.status))throw Error('Жұмыс әлі тапсырылмаған. / Работа ещё не сдана.');
   if(p.expectedUpdatedAt&&p.expectedUpdatedAt!==at.__updatedAt)throw Error('Жұмыс басқа терезеде өзгерді. Қайта ашыңыз. / Работа изменилась в другом окне. Откройте заново.');
   if(['C','OD','E','TH','INK'].some(k=>!Number.isInteger(p.scores?.[k])||p.scores[k]<0||p.scores[k]>3))throw Error('Бес кезеңге 0–3 аралығында баға қажет. / Нужны оценки 0–3 для пяти этапов.');
  }
  return learning(action,p);
 }
 window.CT_FIREBASE={call(action,p={}){const task=queue.then(()=>dispatch(action,p));queue=task.catch(()=>{});return task.catch(e=>{throw friendly(e);});},invalidate:()=>readCache.clear(),status:()=>({signedIn:!!session,project,version:'12.0.0',customStudentLogins:true}),_test:local?{val,plain,rowKey,decode,root}:undefined};
})();


