const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..');
function school(){
 const w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think',apiKey:'test'}},CT_CREDENTIAL_VAULT:{lock(){}}};
 const ctx=vm.createContext({window:w,crypto,console});for(const f of ['learning-core.js','profile-engine.js','community-engine.js','olympiad-bank.js','olympiad-model.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
 const db=new Map(),trace=[],seed=(table,id,row)=>db.set(table+'/'+id,{...row,__createdAt:'2026-01-01T00:00:00Z',__updatedAt:'2026-01-01T00:00:00Z'});
 seed('Users','t',{id:'t',authUid:'t',name:'Teacher',role:'teacher',active:true,mustChangePassword:false});
 for(const id of ['s1','s2']){seed('Users',id,{id,authUid:id,name:id,role:'student',active:true,mustChangePassword:false,grade:'8'});seed('ClassStudents',id,{userId:id,classId:'8a',__ownerId:id});}
 for(const task of w.CT_CORE.taskSeed)seed('Tasks',task.id,task);
 const core=w.CT_CORE.taskSeed.filter(t=>t.grade==='8');core.forEach((task,i)=>{seed('Assignments','a'+i,{id:'a'+i,taskId:task.id,classId:'8a',status:'published'});seed('TaskAttempts','work'+i,{id:'work'+i,userId:'s1',__ownerId:'s1',assignmentId:'a'+i,status:i===11?'submitted':'graded'});});
 let counter=0;
 function client(actor){
  const win={...w},storage=new Map([['ct11-firebase-session',JSON.stringify({uid:actor,idToken:'test',expiresAt:Date.now()+3600000})]]);
  const base='projects/demo-code-think/databases/(default)/documents';let val,plain;
  const doc=(key,row)=>({name:base+'/schools/t/'+key,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,val(v)])),updateTime:row.__updatedAt});
  const matches=(row,where)=>!where?true:where.compositeFilter?where.compositeFilter.filters.every(f=>matches(row,f)):row[where.fieldFilter.field.fieldPath]===plain(where.fieldFilter.value);
  async function fetch(url,options){
   const body=options.body?JSON.parse(options.body):null;let result,status=200;
   if(url.endsWith(':commit')){
    const now=new Date(Date.parse('2026-01-01')+(++counter)*1000).toISOString();
    result={writeResults:body.writes.map(write=>{
     const key=(write.update?.name||write.delete).split('/schools/t/')[1];trace.push({actor,key,write});
     if(write.delete){db.delete(key);return {updateTime:now};}
     const row=Object.fromEntries(Object.entries(write.update.fields).map(([k,v])=>[k,plain(v)]));
     for(const tr of write.updateTransforms||[])row[tr.fieldPath]=now;db.set(key,row);
     return {updateTime:now,transformResults:(write.updateTransforms||[]).map(()=>({timestampValue:now}))};
    })};
   }else if(url.endsWith(':runQuery')){
    const q=body.structuredQuery,table=q.from[0].collectionId;result=[...db].filter(([key,row])=>key.startsWith(table+'/')&&matches(row,q.where)).map(([key,row])=>({document:doc(key,row)}));
   }else if(url.includes('/identities/'))result={name:base+'/identities/'+actor,fields:{schoolId:val('t'),userId:val(actor)}};
   else{const key=url.split('/schools/t/')[1],row=db.get(key);if(row)result=doc(key,row);else{status=404;result={error:{message:'NOT_FOUND'}};}}
   return {ok:status===200,status,json:async()=>result};
  }
  const c=vm.createContext({window:win,crypto,fetch,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  vm.runInContext(fs.readFileSync(path.join(root,'firebase-direct.js'),'utf8'),c);val=win.CT_FIREBASE._test.val;plain=win.CT_FIREBASE._test.plain;return win.CT_FIREBASE;
 }
 return {client,db,trace};
}
test('teacher auto-unlock requires all 12 graded tasks and manual closure survives reconciliation',async()=>{
 const s=school(),teacher=s.client('t');await teacher.call('olympiadWorkspace');assert.equal(s.db.get('OlympiadAccess/s1').allowed,false);
 s.db.get('TaskAttempts/work11').status='graded';await teacher.call('olympiadWorkspace');assert.equal(s.db.get('OlympiadAccess/s1').allowed,true);
 await teacher.call('setOlympiadAccess',{userId:'s1',allowed:false});await teacher.call('olympiadWorkspace');assert.equal(s.db.get('OlympiadAccess/s1').allowed,false);assert.equal(s.db.get('OlympiadAccess/s1').manual,true);
 await teacher.call('setOlympiadAccess',{userId:'s1',mode:'auto'});assert.equal(s.db.get('OlympiadAccess/s1').allowed,true);
});
test('locked pupil cannot save or grant access; practice save cannot change grades or XP',async()=>{
 const s=school(),pupil=s.client('s1'),teacher=s.client('t');await teacher.call('olympiadWorkspace');
 await assert.rejects(pupil.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(3)'}));await assert.rejects(pupil.call('setOlympiadAccess',{userId:'s1',allowed:true}));
 await teacher.call('setOlympiadAccess',{userId:'s1',allowed:true});const before=s.trace.length;
 const count=11;const row=await pupil.call('saveOlympiadWork',{taskId:'olymp-01',userId:'s2',code:'print(3)',inputData:'abc\nbcd\n',submit:true,passed:count,verdict:'accepted'});
 assert.equal(row.userId,'s1');assert.equal(row.solved,true);assert.equal(row.selfReported,true);assert.equal(row.submissions,1);
 assert.ok(s.trace.slice(before).every(w=>['Users/s1','OlympiadWork/s1__olymp-01'].includes(w.key)));
 const draft=await pupil.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(0)',inputData:''});assert.equal(draft.submissions,1);assert.equal(draft.solved,true);assert.equal(draft.verdict,'draft');
 await assert.rejects(pupil.call('saveOlympiadWork',{taskId:'olymp-99',code:'print(1)'}));
 await assert.rejects(pupil.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(1)',submit:true,passed:0,verdict:'accepted'}));
});

test('saving or running unchanged code preserves every checked verdict; editing invalidates only the current result',async()=>{
 const s=school(),p=s.client('s1'),t=s.client('t');await t.call('setOlympiadAccess',{userId:'s1',allowed:true});
 const code='print(3)',count=11;
 for(const verdict of ['accepted','wrong','error','timeout','stopped']){
  const passed=verdict==='accepted'?count:2;
  const checked=await p.call('saveOlympiadWork',{taskId:'olymp-01',code,submit:true,passed,verdict});
  const saved=await p.call('saveOlympiadWork',{taskId:'olymp-01',code,inputData:'different input',lastOutput:'different personal run',verdict:'draft',passed:0,total:0});
  assert.equal(saved.verdict,verdict);assert.equal(saved.passed,passed);assert.equal(saved.total,count);assert.equal(saved.submissions,checked.submissions);
 }
 const before=s.db.get('OlympiadWork/s1__olymp-01').submissions;
 const edited=await p.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(0)',verdict:'accepted',passed:11,total:11});
 assert.equal(edited.verdict,'draft');assert.equal(edited.passed,0);assert.equal(edited.total,0);assert.equal(edited.submissions,before);assert.equal(edited.solved,true);
});
test('teacher can restore a legacy 0/0 record by rechecking exactly the saved code without awarding XP or changing submissions',async()=>{
 const s=school(),p=s.client('s1'),t=s.client('t');await t.call('setOlympiadAccess',{userId:'s1',allowed:true});
 await p.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(3)',inputData:'abc\\nbcd',submit:true,passed:11,verdict:'accepted'});
 const legacy=s.db.get('OlympiadWork/s1__olymp-01');Object.assign(legacy,{verdict:'draft',passed:0,total:0});
 const args={workId:legacy.id,code:legacy.code,expectedUpdatedAt:legacy.__updatedAt,passed:11,verdict:'accepted'},before=s.trace.length;
 const saved=await t.call('reviewOlympiadWork',args);
 assert.equal(saved.verdict,'accepted');assert.equal(saved.passed,11);assert.equal(saved.total,11);assert.equal(saved.submissions,1);assert.equal(saved.code,'print(3)');assert.equal(saved.userId,'s1');
 assert.ok(s.trace.slice(before).every(w=>['Users/t','OlympiadWork/s1__olymp-01'].includes(w.key)));
 await assert.rejects(p.call('reviewOlympiadWork',{...args,expectedUpdatedAt:saved.__updatedAt}));
 await assert.rejects(t.call('reviewOlympiadWork',args)); // stale version
 await assert.rejects(t.call('reviewOlympiadWork',{...args,expectedUpdatedAt:saved.__updatedAt,code:'print(0)'}));
 const failed=await t.call('reviewOlympiadWork',{...args,expectedUpdatedAt:saved.__updatedAt,passed:2,verdict:'wrong'});
 assert.equal(failed.verdict,'wrong');assert.equal(failed.passed,2);assert.equal(failed.solved,true);assert.equal(failed.submissions,1);
});
test('teacher recheck rejects invalid verdicts, cross-path IDs and inactive pupil records',async()=>{
 const s=school(),p=s.client('s1'),t=s.client('t');await t.call('setOlympiadAccess',{userId:'s1',allowed:true});
 const row=await p.call('saveOlympiadWork',{taskId:'olymp-01',code:'print(3)'});
 const args={workId:row.id,code:row.code,expectedUpdatedAt:row.__updatedAt,passed:0,verdict:'accepted'};
 await assert.rejects(t.call('reviewOlympiadWork',args));
 await assert.rejects(t.call('reviewOlympiadWork',{...args,workId:'../Users/s1'}));
 s.db.get('Users/s1').active=false;await assert.rejects(t.call('reviewOlympiadWork',{...args,passed:11}));
});
