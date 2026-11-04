const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
function model(){const c=vm.createContext({window:{}});vm.runInContext(source('profile-engine.js'),c);vm.runInContext(source('community-engine.js'),c);return c.window;}
function fixture(){return {
 Users:[{id:'teacher',name:'Мұғалім',role:'teacher',active:true,authUid:'teacher',mustChangePassword:false},{id:'u1',name:'Айым',role:'student',active:true,authUid:'u1',mustChangePassword:false},{id:'u2',name:'Мәди',role:'student',active:true,authUid:'u2',mustChangePassword:false},{id:'archived',name:'Архив',role:'student',active:false}],
 ClassStudents:[{userId:'u1',classId:'7a'},{userId:'u2',classId:'8a'},{userId:'archived',classId:'7a'}],
 Tasks:[{id:'t1',sourceKey:'guide-01'},{id:'t2',sourceKey:'guide-01'},{id:'t3',sourceKey:'guide-02'}],
 Assignments:[{id:'a1',taskId:'t1',classId:'7a'},{id:'a2',taskId:'t2',classId:'7a'},{id:'a3',taskId:'t3',classId:'7a'}],
 TaskAttempts:[{id:'try1',userId:'u1',assignmentId:'a1',status:'graded',score:8},{id:'try2',userId:'u1',assignmentId:'a2',status:'graded',score:12},{id:'draft',userId:'u1',assignmentId:'a3',status:'submitted',score:''}],
 Corrections:[{id:'fix1',userId:'u1',kind:'task',sourceId:'try1',status:'reviewed',score:10},{id:'fix2',userId:'u1',kind:'task',sourceId:'try2',status:'reviewed',score:15},{id:'pending',userId:'u1',kind:'task',sourceId:'draft',status:'submitted',score:15}],
 TransferProbes:[{id:'probe1',userId:'u1',sourceKey:'guide-01',phase:'independent',status:'reviewed',scoresJson:'[2,2,2]'},{id:'probe2',userId:'u1',sourceKey:'guide-01',phase:'independent',status:'reviewed',scoresJson:'[3,3,3]'}]
};}
test('published XP matches private profile; best work/correction/transfer counted once',()=>{
 const w=model(),tables=fixture(),rows=w.CT_COMMUNITY_MODEL.scores(tables,w.CT_PROFILE.compute);
 assert.equal(rows.length,2);assert.equal(rows[0].xp,180);assert.equal(rows[1].xp,0);
 const history=tables.TaskAttempts.map(attempt=>{const a=tables.Assignments.find(a=>a.id===attempt.assignmentId);return {...a,task:tables.Tasks.find(t=>t.id===a.taskId),attempt};});
 assert.equal(rows[0].xp,w.CT_PROFILE.compute({workspace:{history,transferProbes:tables.TransferProbes},corrections:{history:tables.Corrections}}).xp);
 assert.deepEqual(Object.keys(rows[0]).sort(),['classId','name','userId','xp']);
});
test('expiry, deduplication, teacher labels, unknown XP and cross-class scores',()=>{
 const w=model(),now=Date.now(),seen=new Date(now).toISOString();
 const rows=w.CT_COMMUNITY_MODEL.online([{userId:'u1',name:'A',classId:'7a',role:'student',lastSeen:seen},{userId:'u1',name:'A',classId:'7a',role:'student',lastSeen:seen},{userId:'teacher',name:'T',role:'teacher',lastSeen:seen},{userId:'old',role:'student',lastSeen:new Date(now-151000).toISOString()},{userId:'future',role:'student',lastSeen:new Date(now+60000).toISOString()}],[{userId:'u1',classId:'8a',xp:999}],now);
 assert.equal(rows.length,2);assert.equal(rows[0].role,'teacher');assert.equal(rows[0].xp,null);assert.equal(rows[1].xp,null);
 assert.equal(w.CT_COMMUNITY_MODEL.online([{userId:'u1',role:'student',classId:'7a',lastSeen:seen}],[{userId:'u1',classId:'7a',xp:180}],now)[0].xp,180);
});
function backend(actor){
 const tables=fixture(),calls=[],published=new Map(),now=new Date().toISOString();
 tables.Presence=[{userId:'teacher',name:'Мұғалім',role:'teacher',classId:'__teacher__',lastSeen:now},{userId:'u1',name:'Айым',role:'student',classId:'7a',lastSeen:now},{userId:'u2',name:'Мәди',role:'student',classId:'8a',lastSeen:now}];
 tables.CommunityScores=[{userId:'u1',name:'Айым',classId:'7a',xp:180}];
 const storage=new Map([['ct11-firebase-session',JSON.stringify({uid:actor,idToken:'test',expiresAt:Date.now()+3600000})]]);
 const win=model();win.CODE_THINK_CONFIG={firebase:{projectId:'demo-code-think',apiKey:'test'}};win.CT_CREDENTIAL_VAULT={lock(){}};
 const base='projects/demo-code-think/databases/(default)/documents';let encode;
 const doc=(collection,id,row)=>({name:`${base}/schools/teacher/${collection}/${id}`,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,encode(v)])),updateTime:now});
 async function fetch(url,options){
  const body=options.body?JSON.parse(options.body):null;calls.push({url,body});let data;
  if(url.endsWith(':commit')){for(const write of body.writes){if(write.update){const name=write.update.name;published.set(name,write.update);}}data={writeResults:body.writes.map(()=>({updateTime:now,transformResults:[{timestampValue:now}]}))};}
  else if(url.endsWith(':runQuery')){const q=body.structuredQuery,collection=q.from[0].collectionId;let rows=tables[collection]||[];const f=q.where?.fieldFilter;if(f){const value=win.CT_FIREBASE._test.plain(f.value);rows=rows.filter(r=>f.op==='IN'?value.includes(r[f.field.fieldPath]):r[f.field.fieldPath]===value);}data=rows.map((r,i)=>({document:doc(collection,r.id||r.userId||String(i),r)}));}
  else if(url.endsWith('/identities/'+actor))data={name:base+'/identities/'+actor,fields:{schoolId:encode('teacher'),userId:encode(actor)}};
  else if(url.endsWith('/Users/'+actor))data=doc('Users',actor,tables.Users.find(u=>u.id===actor));
  else if(url.endsWith('/ClassStudents/'+actor)){const row=tables.ClassStudents.find(c=>c.userId===actor);data=row?doc('ClassStudents',actor,row):null;}
  else throw Error('Unexpected request: '+url);
  return {ok:data!==null,status:data===null?404:200,json:async()=>data===null?{error:{message:'NOT_FOUND'}}:data};
 }
 const c=vm.createContext({window:win,location:{hostname:'localhost'},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},crypto,fetch,AbortController,setTimeout,clearTimeout,URL,console});
 vm.runInContext(source('learning-core.js'),c);vm.runInContext(source('firebase-direct.js'),c);encode=win.CT_FIREBASE._test.val;
 return {win,calls,published};
}
test('pupil heartbeat has no XP and queries only own class plus teacher',async()=>{
 const b=backend('u1'),r=await b.win.CT_FIREBASE.call('communityWorkspace');assert.equal(r.rows.length,2);
 const writes=b.calls.flatMap(c=>c.body?.writes||[]);assert.equal(writes.length,1);
 assert.deepEqual(Object.keys(writes[0].update.fields).sort(),['classId','name','role','userId']);
 const queries=b.calls.filter(c=>c.body?.structuredQuery).map(c=>c.body.structuredQuery);
 assert.equal(queries.length,2);assert.equal(queries[0].where.fieldFilter.op,'IN');
 assert.deepEqual(JSON.parse(JSON.stringify(b.win.CT_FIREBASE._test.plain(queries[0].where.fieldFilter.value))),['7a','__teacher__']);
 assert.equal(b.win.CT_FIREBASE._test.plain(queries[1].where.fieldFilter.value),'7a');
 assert.equal(r.rows.find(r=>r.userId==='u1').xp,180);
});
test('teacher alone publishes recomputed XP and school-wide query is scoped to school',async()=>{
 const b=backend('teacher'),r=await b.win.CT_FIREBASE.call('communityWorkspace');assert.equal(r.rows.length,3);
 const writes=b.calls.flatMap(c=>c.body?.writes||[]),scores=writes.filter(w=>w.update?.name.includes('/CommunityScores/'));
 // u1 already has the correct projection; only u2 needs publication.
 assert.equal(scores.length,1);assert.equal(scores[0].update.fields.xp.integerValue,'0');
 assert.equal(scores[0].update.fields.userId.stringValue,'u2');
 for(const call of b.calls.filter(c=>c.body?.structuredQuery))assert.ok(call.url.includes('/schools/teacher:runQuery'));
});
