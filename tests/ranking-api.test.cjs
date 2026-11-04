const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..');
function backend(){
 const db=new Map(),revisions=new Map(),writes=[],calls=[];let time='2026-11-04T10:00:00.000Z',revision=0,conflict=false;
 const seed=(key,row)=>{db.set(key,row);revisions.set(key,'v'+(++revision));};
 for(const [id,role,cls]of [['t','teacher',''],['s1','student','7a'],['s2','student','7a'],['s3','student','8a']]){
  seed('Users/'+id,{id,authUid:id,name:id,role,active:true,mustChangePassword:false,grade:cls==='8a'?'8':'7',className:cls});
  if(cls)seed('ClassStudents/'+id,{userId:id,classId:cls});
 }
 seed('Classes/7a',{id:'7a',name:'7 A',active:true});seed('Classes/8a',{id:'8a',name:'8 A',active:true});
 seed('Tasks/one',{id:'one',sourceKey:'one'});seed('Assignments/one',{id:'one',taskId:'one',classId:'7a'});seed('TaskAttempts/one',{id:'one',assignmentId:'one',userId:'s1',status:'graded',score:10});
 seed('StudentProfiles/s1',{id:'s1',userId:'s1',avatar:'cat',goalText:'PRIVATE GOAL'});
 function client(actor){
  const w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think',apiKey:'test'}},CT_CREDENTIAL_VAULT:{lock(){}}},base='projects/demo-code-think/databases/(default)/documents';let val,plain;
  const doc=(key,row)=>({name:base+'/schools/t/'+key,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,val(v)])),updateTime:revisions.get(key)});
  const storage=new Map([['ct11-firebase-session',JSON.stringify({uid:actor,idToken:'test',expiresAt:Date.now()+3600000})]]);
  async function fetch(url,o){
   const b=o.body?JSON.parse(o.body):null;calls.push({actor,url,body:b});let data,status=200;
   if(url.endsWith(':runQuery')){const q=b.structuredQuery,table=q.from[0].collectionId,f=q.where?.fieldFilter;data=[...db].filter(([key,r])=>key.startsWith(table+'/')&&(!f||r[f.field.fieldPath]===plain(f.value))).map(([key,r])=>({document:doc(key,r),readTime:time}));if(!data.length)data=[{readTime:time}];}
   else if(url.endsWith(':commit')){
    if(conflict&&b.writes.some(x=>x.update?.name.includes('/Rankings/'))){conflict=false;status=400;data={error:{status:'FAILED_PRECONDITION',message:'FAILED_PRECONDITION'}};}
    else{
     for(const x of b.writes){const key=(x.update?.name||x.delete).split('/schools/t/')[1];if(x.currentDocument?.updateTime&&x.currentDocument.updateTime!==revisions.get(key))throw Error('stale write '+key);if(x.currentDocument?.exists===false&&db.has(key))throw Error('already exists');}
     data={writeResults:b.writes.map(x=>{const key=(x.update?.name||x.delete).split('/schools/t/')[1];if(x.delete){db.delete(key);revisions.delete(key);writes.push({actor,key,deleted:true});return {updateTime:time};}const row=Object.fromEntries(Object.entries(x.update.fields).map(([k,v])=>[k,plain(v)]));for(const tr of x.updateTransforms||[])row[tr.fieldPath]=time;seed(key,row);writes.push({actor,key,row,precondition:x.currentDocument});return {updateTime:revisions.get(key),transformResults:(x.updateTransforms||[]).map(()=>({timestampValue:time}))};})};
    }
   }else if(url.includes('/identities/'))data={name:base+'/identities/'+actor,fields:{schoolId:val('t'),userId:val(actor)}};
   else{const key=url.split('/schools/t/')[1];data=db.has(key)?doc(key,db.get(key)):null;if(!data){status=404;data={error:{status:'NOT_FOUND',message:'NOT_FOUND'}};}}
   return {ok:status===200,status,json:async()=>data};
  }
  const c=vm.createContext({window:w,console,crypto,fetch,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  for(const f of ['learning-core.js','profile-engine.js','ranking-model.js','firebase-direct.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);val=w.CT_FIREBASE._test.val;plain=w.CT_FIREBASE._test.plain;return w.CT_FIREBASE;
 }
 return {db,seed,writes,calls,client,time:t=>time=t,conflict:()=>conflict=true};
}
test('teacher publishes minimal summaries; pupil query is own-class only and never writes XP',async()=>{
 const f=backend(),t=f.client('t'),r=await t.call('rankingWorkspace');assert.equal(r.rows.length,3);assert.equal(r.classes.length,2);assert.equal(r.rows.find(r=>r.userId==='s1').xp,100);assert.equal(r.rows[0].weeklyXP,0);
 assert.ok(!JSON.stringify(r).includes('PRIVATE GOAL'));assert.ok(f.writes.every(w=>w.actor==='t'&&w.key.startsWith('Rankings/')));
 const before=f.writes.length,p=f.client('s1'),own=await p.call('rankingWorkspace',{classId:'8a',userId:'s3',xp:999999});assert.equal(own.rows.length,2);assert.equal(own.classes[0].id,'7a');assert.equal(f.writes.length,before);
 const queries=f.calls.filter(c=>c.actor==='s1'&&c.body?.structuredQuery);assert.equal(queries.length,1);assert.equal(queries[0].body.structuredQuery.from[0].collectionId,'Rankings');assert.equal(queries[0].body.structuredQuery.where.fieldFilter.value.stringValue,'7a');assert.ok(f.calls.every(c=>c.url.includes('/schools/t')||c.url.includes('/identities/')||c.body?.writes?.every(w=>(w.update?.name||w.delete).includes('/schools/t/'))));
 await t.call('rankingWorkspace');assert.equal(f.writes.length,before); // idempotent; no new weekly credit
});
test('new grades grow weekly XP once, server week resets, archive removes and move changes class',async()=>{
 const f=backend(),t=f.client('t');await t.call('rankingWorkspace');f.db.get('TaskAttempts/one').score=15;f.time('2026-11-04T11:00:00.000Z');let r=await t.call('rankingWorkspace');assert.equal(r.rows.find(r=>r.userId==='s1').weeklyXP,50);
 r=await t.call('rankingWorkspace');assert.equal(r.rows.find(r=>r.userId==='s1').weeklyXP,50);
 f.time('2026-11-08T19:00:00.000Z');r=await t.call('rankingWorkspace');assert.equal(r.rows.find(r=>r.userId==='s1').weeklyXP,0);assert.equal(r.rows.find(r=>r.userId==='s1').growthXP,50);
 f.db.get('Users/s2').active=false;f.db.get('ClassStudents/s1').classId='8a';await t.call('rankingWorkspace');assert.ok(!f.db.has('Rankings/s2'));assert.equal(f.db.get('Rankings/s1').classId,'8a');assert.equal((await f.client('s3').call('rankingWorkspace')).rows.length,2);
});
test('compare-and-set failures surface to teacher; unpublished work cannot overwrite newer snapshots',async()=>{
 const f=backend(),t=f.client('t');await t.call('rankingWorkspace');f.db.get('TaskAttempts/one').score=15;f.conflict();await assert.rejects(t.call('rankingWorkspace'),/Деректер өзгерді/);assert.equal(f.db.get('Rankings/s1').xp,100);await t.call('rankingWorkspace');assert.equal(f.db.get('Rankings/s1').weeklyXP,50);
});
test('unenrolled pupil gets empty scope and does not issue an unrestricted ranking query',async()=>{
 const f=backend();f.db.delete('ClassStudents/s1');const r=await f.client('s1').call('rankingWorkspace');assert.equal(r.rows.length,0);assert.equal(r.classes.length,0);assert.equal(f.calls.filter(c=>c.body?.structuredQuery).length,0);
});
test('saving a real teacher grade publishes new XP automatically, and repeat grading adds nothing',async()=>{
 const f=backend();f.db.get('Assignments/one').createdBy='t';const t=f.client('t');await t.call('rankingWorkspace');
 const scores={C:3,OD:3,E:3,TH:3,INK:3};await t.call('gradeTask',{attemptId:'one',scores});assert.equal(f.db.get('TaskAttempts/one').score,15);assert.equal(f.db.get('Rankings/s1').xp,150);assert.equal(f.db.get('Rankings/s1').weeklyXP,50);
 await t.call('gradeTask',{attemptId:'one',scores});assert.equal(f.db.get('Rankings/s1').weeklyXP,50);
 await assert.rejects(f.client('s1').call('gradeTask',{attemptId:'one',scores}));assert.equal(f.db.get('Rankings/s1').xp,150);
});
