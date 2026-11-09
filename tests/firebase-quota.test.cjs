const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..');
function fixture(start='2026-11-05T10:00:00Z'){
 let now=Date.parse(start),revision=0,failure=null,concurrent=0,peak=0;
 const db=new Map(),calls=[],storage=new Map([['ct11-firebase-session',JSON.stringify({uid:'t',idToken:'test',expiresAt:now+86400000})]]);
 const seed=(key,row)=>db.set(key,{...row,__updatedAt:'v'+(++revision)});
 seed('Users/t',{id:'t',authUid:'t',role:'teacher',name:'Teacher',active:true,mustChangePassword:false});
 seed('Users/s',{id:'s',authUid:'s',role:'student',name:'Pupil',active:true,mustChangePassword:false,grade:'8',className:'8A'});
 seed('Classes/c',{id:'c',name:'8A',grade:'8',teacherId:'t',active:true});seed('ClassStudents/s',{userId:'s',classId:'c'});
 seed('Tasks/task',{id:'task',sourceKey:'guide-20',grade:'8',active:true,createdBy:'SYSTEM',title:'Odd numbers'});
 seed('Assignments/a',{id:'a',taskId:'task',classId:'c',status:'published',createdBy:'t'});
 seed('TaskAttempts/work',{id:'work',assignmentId:'a',userId:'s',status:'graded',score:12});
 class Clock extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
 function client(actor='t',adapter='firebase-direct.js',adapterSource=null){
  const session=JSON.stringify({uid:actor,idToken:'test',expiresAt:now+86400000});
  storage.set('ct11-firebase-session',session);storage.set('ct11-firebase-session:code-think-new',session);
  const w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think',apiKey:'test'}},CT_CREDENTIAL_VAULT:{lock(){}}};
  let val,plain;const base='projects/demo-code-think/databases/(default)/documents';
  const doc=(key,row)=>({name:base+'/schools/t/'+key,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,val(v)])),updateTime:row.__updatedAt});
  const matches=(r,f)=>!f?true:f.compositeFilter?f.compositeFilter.filters.every(f=>matches(r,f)):f.fieldFilter.op==='IN'?plain(f.fieldFilter.value).includes(r[f.fieldFilter.field.fieldPath]):r[f.fieldFilter.field.fieldPath]===plain(f.fieldFilter.value);
  const fetch=async(url,options)=>{
   const b=options.body?JSON.parse(options.body):null;calls.push({url,body:b});concurrent++;peak=Math.max(peak,concurrent);await Promise.resolve();concurrent--;
   if(failure&&(!failure.where||url.endsWith(failure.where))&&(!failure.table||b?.structuredQuery?.from[0].collectionId===failure.table)){const f=failure;failure=null;return {ok:false,status:f.status||429,headers:{get:()=>f.retryAfter||null},json:async()=>({error:{status:f.status===403?'PERMISSION_DENIED':'RESOURCE_EXHAUSTED',message:f.message,details:f.details||[]}})};}
   let data,status=200;
   if(url.endsWith(':runQuery')){const q=b.structuredQuery,table=q.from[0].collectionId;data=[...db].filter(([key,r])=>key.startsWith(table+'/')&&matches(r,q.where)).map(([key,r])=>({document:doc(key,r),readTime:new Clock().toISOString()}));}
   else if(url.endsWith(':commit'))data={writeResults:b.writes.map(write=>{const key=(write.update?.name||write.delete).split('/schools/t/')[1];if(write.delete){db.delete(key);return {updateTime:'v'+(++revision)};}const row=Object.fromEntries(Object.entries(write.update.fields).map(([k,v])=>[k,plain(v)]));seed(key,row);return {updateTime:db.get(key).__updatedAt,transformResults:(write.updateTransforms||[]).map(()=>({timestampValue:new Clock().toISOString()}))};})};
   else if(url.endsWith('/identities/'+actor))data={name:base+'/identities/'+actor,fields:{schoolId:val('t'),userId:val(actor)}};
   else{const key=url.split('/schools/t/')[1],row=db.get(key);if(row)data=doc(key,row);else{status=404;data={error:{status:'NOT_FOUND',message:'NOT_FOUND'}};}}
   return {ok:status===200,status,json:async()=>data};
  };
  const c=vm.createContext({window:w,crypto,fetch,Date:Clock,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  for(const file of ['learning-core.js','profile-engine.js','community-engine.js','ranking-model.js','olympiad-bank.js','olympiad-model.js',adapter])vm.runInContext(file===adapter&&adapterSource?adapterSource:fs.readFileSync(path.join(root,file),'utf8'),c);
  val=w.CT_FIREBASE._test.val;plain=w.CT_FIREBASE._test.plain;return w.CT_FIREBASE;
 }
 return {client,calls,db,peak:()=>peak,advance:ms=>now+=ms,fail:f=>failure=f,queries:()=>calls.filter(c=>c.body?.structuredQuery).map(c=>c.body.structuredQuery.from[0].collectionId)};
}
test('generic resource exhaustion does not claim the free daily quota is exhausted and reload cannot bypass cooldown',async()=>{
 const f=fixture(),api=f.client();f.fail({message:'Resource has been exhausted (e.g. check quota).'});
 let error;await assert.rejects(api.call('me'),e=>{error=e;return e.code==='RESOURCE_EXHAUSTED'&&e.quotaKind==='unknown'&&!e.message.includes('тегін');});
 const count=f.calls.length;await assert.rejects(f.client().call('me'));assert.equal(f.calls.length,count);
 f.advance(60001);await api.call('me');assert.ok(f.calls.length>count);assert.ok(error.retryAt);
});
test('explicit daily quota waits for Pacific midnight, including daylight saving time',async()=>{
 for(const [start,reset]of [['2026-11-05T10:00:00Z','2026-11-06T08:01:00Z'],['2026-06-05T10:00:00Z','2026-06-06T07:01:00Z']]){
  const f=fixture(start),api=f.client();f.fail({message:'Quota exceeded for Free daily read units per project'});
  await assert.rejects(api.call('me'),e=>e.quotaKind==='daily'&&e.retryAt===Date.parse(reset));
  const count=f.calls.length;f.advance(3600000);await assert.rejects(api.call('me'));assert.equal(f.calls.length,count);
 }
});
test('server RetryInfo and Retry-After are preserved without replaying a failed write',async()=>{
 const f=fixture(),api=f.client();await api.call('teacherWorkspace');
 f.fail({where:':commit',message:'rate limit per minute',retryAfter:'180',details:[{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'120s'}]});
 await assert.rejects(api.call('saveTeacherProfile',{name:'New',subject:'IT',bio:'',avatar:'owl'}),e=>e.quotaKind==='rate'&&e.retryAt===Date.parse('2026-11-05T10:03:00Z'));
 assert.equal(f.calls.filter(c=>c.body?.writes).length,1);const count=f.calls.length;
 await assert.rejects(api.call('saveTeacherProfile',{name:'New',subject:'IT',bio:'',avatar:'owl'}));assert.equal(f.calls.length,count);assert.equal(f.db.get('Users/t').name,'Teacher');
});
test('read snapshots are cached; saving a profile invalidates Users without re-reading the task bank',async()=>{
 const f=fixture(),api=f.client();await api.call('teacherWorkspace');const first=f.queries().length;
 await api.call('teacherWorkspace');assert.equal(f.queries().length,first);
 await api.call('saveTeacherProfile',{name:'New',subject:'IT',bio:'',avatar:'owl'});const before=f.queries().length;
 await api.call('teacherWorkspace');assert.deepEqual(f.queries().slice(before),['Users']);assert.ok(f.peak()<=4);
 api.invalidate();const n=f.queries().length;await api.call('teacherWorkspace');assert.ok(f.queries().length>n);
});
test('repeated online heartbeats never rescan school history or rankings, and cache XP for five minutes',async()=>{
 const f=fixture(),api=f.client();await api.call('communityWorkspace');const first=f.queries().length;
 await api.call('communityWorkspace');assert.deepEqual(f.queries().slice(first),['Presence']);
 f.advance(301000);const n=f.queries().length;await api.call('communityWorkspace');assert.deepEqual(f.queries().slice(n).sort(),['CommunityScores','Presence']);
 assert.equal(f.queries().includes('Rankings'),false);
});

for(const adapter of ['firebase-direct.js','new-project/firebase-direct.js']){
 test(adapter+': grade refresh shares fresh history across XP, ranking and olympiad access',async()=>{
  const f=fixture(),api=f.client('t',adapter),scores={C:3,OD:3,E:3,TH:3,INK:3};
  await api.call('gradeTask',{attemptId:'work',scores});
  assert.equal(f.db.get('TaskAttempts/work').score,15);
  assert.equal(f.db.get('CommunityScores/s').xp,150);assert.equal(f.db.get('Rankings/s').xp,150);
  assert.equal(f.db.get('OlympiadAccess/s').completed,1);assert.equal(f.db.get('OlympiadAccess/s').allowed,false);
  const queries=f.queries();
  for(const table of ['Tasks','ClassStudents','Corrections','TransferProbes','StudentProfiles'])assert.equal(queries.filter(t=>t===table).length,1,table+' is loaded once');
  assert.equal(queries.filter(t=>t==='TaskAttempts').length,2); // mutation + fresh committed sources
  const firstSource=f.calls.findIndex(c=>c.body?.structuredQuery?.from[0].collectionId==='Corrections');
  for(const table of ['CommunityScores','Presence','Rankings','OlympiadAccess'])assert.ok(f.calls.findIndex(c=>c.body?.structuredQuery?.from[0].collectionId===table)<firstSource,'projection versions precede sources');
  assert.ok(f.peak()<=4);
  const before=f.queries().length;await api.call('teacherWorkspace');
  assert.ok(!f.queries().slice(before).includes('TaskAttempts'),'unchanged committed history is reused by next screen');
  f.advance(31000);const expired=f.queries().length;await api.call('teacherWorkspace');
  assert.ok(f.queries().slice(expired).includes('TaskAttempts'),'display cache expires after thirty seconds');
  f.db.get('TaskAttempts/work').score=1;
  await api.call('gradeTask',{attemptId:'work',scores:{C:1,OD:1,E:1,TH:1,INK:1}});
  assert.equal(f.db.get('Rankings/s').xp,50,'next mutation uses fresh sources');
  assert.equal(f.db.get('CommunityScores/s').xp,50);
 });

 test(adapter+': an unavailable optional projection does not stop grade or other projections',async()=>{
  const f=fixture(),api=f.client('t',adapter);
  f.fail({table:'OlympiadAccess',status:403,message:'PERMISSION_DENIED'});
  await api.call('gradeTask',{attemptId:'work',scores:{C:3,OD:3,E:3,TH:3,INK:3}});
  assert.equal(f.db.get('TaskAttempts/work').score,15);
  assert.equal(f.db.get('CommunityScores/s').xp,150);assert.equal(f.db.get('Rankings/s').xp,150);
  assert.equal(f.db.has('OlympiadAccess/s'),false);
  const next=await api.call('olympiadWorkspace');assert.equal(next.users.length,1);
  assert.equal(f.db.get('OlympiadAccess/s').completed,1,'optional publication retries on the next workspace load');
 });

 test(adapter+': archive and restore reconcile public projections using fresh membership',async()=>{
  const f=fixture(),api=f.client('t',adapter);await api.call('rankingWorkspace');
  await api.call('bulkManageStudents',{operation:'archive',userIds:['s']});
  assert.equal(f.db.get('Users/s').active,false);assert.equal(f.db.has('Rankings/s'),false);assert.equal(f.db.has('CommunityScores/s'),false);
  await api.call('bulkManageStudents',{operation:'restore',userIds:['s']});
  assert.equal(f.db.get('Users/s').active,true);assert.equal(f.db.get('Rankings/s').xp,120);assert.equal(f.db.get('CommunityScores/s').xp,120);
 });

 test(adapter+': session restore never reads history and disabled users are rejected immediately',async()=>{
  const f=fixture(),api=f.client('s',adapter),restored=await api.call('sessionUser');
  assert.equal(restored.user.id,'s');assert.equal(f.calls.length,2);assert.equal(f.queries().length,0);
  f.db.get('Users/s').active=false;await assert.rejects(api.call('sessionUser'),/қолжетімсіз/);
  assert.equal(f.calls.length,4);assert.equal(f.queries().length,0);
 });

 test(adapter+': fresh mutation reads survive for display, but writes and explicit refresh never reuse them',async()=>{
  const f=fixture(),api=f.client('s',adapter);Object.assign(f.db.get('TaskAttempts/work'),{status:'in_progress',__ownerId:'s'});
  await api.call('saveTaskCode',{attemptId:'work',code:'print(1)',inputData:'',output:'1',lastRunAt:'2026-11-05T10:00:00Z'});
  assert.equal(f.db.get('TaskAttempts/work').code,'print(1)');
  f.db.get('TaskAttempts/work').status='submitted';
  await assert.rejects(api.call('saveTaskCode',{attemptId:'work',code:'print(2)'}));
  assert.equal(f.db.get('TaskAttempts/work').code,'print(1)');
  api.invalidate();const before=f.queries().length;await api.call('studentWorkspace');
  assert.ok(f.queries().slice(before).includes('TaskAttempts'));
 });
}
module.exports={fixture};
