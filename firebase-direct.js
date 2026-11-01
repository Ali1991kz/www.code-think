/* Native Firebase Authentication + Firestore REST. No Apps Script, Functions or Sheets.
 * The learning core provides UX validation; firestore.rules is the authority.
 */
(() => {
 'use strict';
 const cfg=window.CODE_THINK_CONFIG||{},project=cfg.firebase?.projectId,key=cfg.firebase?.apiKey;
 const SESSION='ct11-firebase-session',copy=x=>JSON.parse(JSON.stringify(x));
 const SHARED=new Set(['Classes','Tasks','Assignments','Settings']);
 const EMPTY=new Set(['Sessions']);
 const teacherOnly=new Set(['importStudents','bulkManageStudents','setupTeacher','installMaterials']);
 const norm=s=>String(s||'').trim().toLowerCase();
 const alias=login=>norm(login).includes('@')?norm(login):norm(login)+'@code-think.invalid';
 const random=()=>crypto.randomUUID().replaceAll('-','');
 const password=()=>'Ct!'+random().slice(0,18)+'7aA';
 let session=null,identity=null,profile=null,profileDocument=null,queue=Promise.resolve(),refreshing=null;
 const pendingAccounts=new Map(); // Plaintext temporary credentials never go into Firestore or localStorage.
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
 function clear(){session=null;identity=null;profile=null;profileDocument=null;pendingAccounts.clear();readCache.clear();sessionStorage.removeItem(SESSION);sessionStorage.removeItem('ct11-token');}
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
  await token();const d=await getDoc(`${root}/identities/${session.uid}`);if(!d)throw Error('Аккаунт платформада дайындалмаған. Мұғалімге хабарласыңыз. / Аккаунт не подготовлен. Обратитесь к учителю.');
  identity=decode(d);const p=await getDoc(path('Users',identity.userId));if(!p)throw Error('Аккаунт табылмады. / Аккаунт не найден.');profileDocument=p;profile=decode(p);
  if(profile.authUid!==session.uid||String(profile.active)!=='true')throw Error('Аккаунт қолжетімсіз. Мұғалімге хабарласыңыз. / Аккаунт недоступен. Обратитесь к учителю.');
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
  let target=profile.role==='student'&&taskActions.has(action)?p.attemptId||((action==='startTaskAttempt')?profile.id+'_'+p.assignmentId:''):'';
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
  if(table==='Users'){result.authUid=r.authUid;if(r.authChangedAt)result.authChangedAt=r.authChangedAt;}
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
 const readOnly=new Set(['me','teacherDashboard','studentWorkspace','pedagogyWorkspace','correctionWorkspace','teacherSolution','getTaskTests','checkTaskOutputs']);
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
   await commit(writesFor(state,core),tx);return result;
  }catch(e){throw e;}
 }
 async function createAccount(cacheKey,grade){
  if(pendingAccounts.has(cacheKey))return pendingAccounts.get(cacheKey);
  const login='s'+grade+'-'+random().slice(0,14),pw=password();
  const r=await auth('signUp',{email:alias(login),password:pw,returnSecureToken:true});
  const item={login,temporaryPassword:pw,authUid:r.localId,discardToken:r.idToken};pendingAccounts.set(cacheKey,item);return item;
 }
 async function discard(item){try{await auth('delete',{idToken:item.discardToken});}catch{}pendingAccounts.delete(item.cacheKey);}
 async function importOne(row,job){
  const name=String(row.name||'').trim(),grade=String(row.grade||''),className=String(row.className||'').trim();
  if(!name||name.length>150||!className||className.length>40||!['7','8'].includes(grade))throw Error('Аты-жөні, 7/8 деңгейі және сынып атауы қажет. / Нужны ФИО, параллель 7/8 и класс.');
  const marker='import_'+job+'_'+String(row.row||1),markerPath=path('RegistrationJobs',marker);
  const processed=await getDoc(markerPath);if(processed)return {alreadyProcessed:true,row:row.row,name,ok:true};
  const account=await createAccount(marker,grade);account.cacheKey=marker;
  let tx;
  try{
   tx={optimistic:true};
   const state=await load(['Users','Classes','ClassStudents','Assignments','Tasks'],tx);
   const inTx=await getDoc(markerPath,tx);if(inTx)return {alreadyProcessed:true,row:row.row,name,ok:true};
   if(state.tables.Users.some(u=>u.role==='student'&&norm(u.name)===norm(name)&&norm(u.className)===norm(className))){await discard(account);throw Error('Бұл оқушы сыныпта бар. / Ученик уже есть в классе.');}
   const userId='USR-'+random(),u={id:userId,login:account.login,authUid:account.authUid,name,grade,className,role:'student',active:true,mustChangePassword:true,createdAt:new Date().toISOString(),lastLoginAt:''};
   const core=window.CT_CORE.create(state.tables,profile);core.enroll(profile,u);
   const writes=writesFor(state,core);
   writes.push(documentWrite(`${root}/identities/${account.authUid}`,{schoolId:identity.schoolId,userId},null));
   writes.push(documentWrite(markerPath,{id:marker,userId},null));
   await commit(writes,tx);pendingAccounts.delete(marker);
   return {ok:true,row:row.row,name,grade,className,userId,login:account.login,temporaryPassword:account.temporaryPassword};
  }catch(e){throw e;}
 }
 async function importStudents(p){
  if(!Array.isArray(p.students)||!p.students.length||p.students.length>20||!/^[-a-zA-Z0-9_]{8,100}$/.test(p.requestId||''))throw Error('Импорт сұрауын жаңартыңыз. / Повторите запрос импорта.');
  const results=[];for(let i=0;i<p.students.length;i++){
   const row={...p.students[i],row:p.students[i].row||i+2};
   try{results.push(await importOne(row,p.requestId));}catch(e){results.push({row:row.row,name:row.name,ok:false,error:friendly(e).message});}
  }
  const fresh=results.filter(x=>x.ok&&!x.alreadyProcessed);return {created:fresh.length,failed:results.filter(x=>!x.ok).length,results:results.filter(x=>!x.alreadyProcessed),alreadyProcessed:results.every(x=>x.alreadyProcessed)};
 }
 async function bulk(p){
  const ids=p.userIds;if(!Array.isArray(ids)||!ids.length||ids.length>20)throw Error('1–20 оқушы таңдаңыз. / Выберите 1–20 учеников.');
  const state=await load(['Users','Classes','ClassStudents','Assignments','Tasks']),core=window.CT_CORE.create(state.tables,profile),credentials=[];
  const users=ids.map(id=>state.tables.Users.find(u=>u.id===id&&u.role==='student'));if(users.some(x=>!x))throw Error('Оқушы табылмады. / Ученик не найден.');
  const replacements=[];
  for(const u of users){
   const dest=core.data.Users.find(x=>x.id===u.id);core.dirty.add('Users');
   if(p.operation==='block'||p.operation==='activate'){dest.active=p.operation==='activate';if(!dest.active)dest.authChangedAt=Date.now();}
   else if(p.operation==='move'){const c=core.data.Classes.find(x=>x.id===p.classId);if(!c)throw Error('Сыныпты таңдаңыз. / Выберите класс.');core.run('enrollStudent',{userId:u.id,classId:c.id});}
   else if(p.operation==='reset'){
    const a=await createAccount('reset_'+u.id+'_'+(p.requestId||random()),u.grade);
    Object.assign(dest,{login:a.login,authUid:a.authUid,mustChangePassword:true,authChangedAt:Date.now()});
    replacements.push({a,userId:u.id});credentials.push({userId:u.id,name:u.name,className:u.className,login:a.login,temporaryPassword:a.temporaryPassword,ok:true});
   }else throw Error('Әрекет белгісіз. / Неизвестное действие.');
  }
  const writes=writesFor(state,core);
  for(const {a,userId}of replacements)writes.push(documentWrite(`${root}/identities/${a.authUid}`,{schoolId:identity.schoolId,userId},null));
  await commit(writes);for(const {a}of replacements)for(const [k,v]of pendingAccounts)if(v===a)pendingAccounts.delete(k);
  return {updated:users.length,operation:p.operation,credentials};
 }
 async function changePassword(p){
  const pw=String(p.password||'');if(pw.length<12||pw.length>128||pw===p.currentPassword)throw Error('Жаңа құпиясөз өзгеше, 12–128 таңбалы болсын. / Выберите новый пароль длиной 12–128 символов.');
  const fresh=await auth('signInWithPassword',{email:alias(profile.login),password:String(p.currentPassword||''),returnSecureToken:true});
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
 async function dispatch(action,p={}){
  if(!project||!key)throw Error('Firebase config.js баптауларын толтырыңыз. / Заполните Firebase config.js.');
  if(action==='ping')return {version:'11.0.1',backend:'firebase-direct',plan:'Spark'};
  if(action==='logout'){clear();return {loggedOut:true};}
  if(action==='setupTeacher')return setupTeacher(p);
  if(action==='login'){
   const r=await auth('signInWithPassword',{email:alias(p.login),password:String(p.password||''),returnSecureToken:true});storeSession(r);
   try{await current();if(p.role&&profile.role!==p.role)throw Error('Аккаунт рөлін дұрыс таңдаңыз. / Выберите правильную роль аккаунта.');
    const name=path('Users',profile.id),old=await getDoc(name),obj=decode(old);obj.lastLoginAt=new Date().toISOString();await commit([documentWrite(name,clean('Users',obj,{}),old)]);
    return {token:random(),user:window.CT_CORE.create({},profile).publicUser(profile)};
   }catch(e){clear();throw e;}
  }
  await current();
  if(teacherOnly.has(action)&&profile.role!=='teacher')throw Error('Мұғалім құқығы қажет. / Нужны права учителя.');
  if(profile.mustChangePassword&&!['me','changePassword'].includes(action))throw Error('Алдымен уақытша құпиясөзді ауыстырыңыз. / Сначала смените временный пароль.');
  if(action==='importStudents')return importStudents(p);
  if(action==='bulkManageStudents')return bulk(p);
  if(action==='changePassword')return changePassword(p);
  if(action==='installMaterials')return installMaterials(p);
  return learning(action,p);
 }
 window.CT_FIREBASE={call(action,p={}){const task=queue.then(()=>dispatch(action,p));queue=task.catch(()=>{});return task.catch(e=>{throw friendly(e);});},invalidate:()=>readCache.clear(),status:()=>({signedIn:!!session,project,version:'11.0.1'}),_test:local?{val,plain,rowKey,decode,root}:undefined};
})();
