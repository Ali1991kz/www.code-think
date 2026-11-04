const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..');
function fixture(){
 const db=new Map(),writes=[],w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think',apiKey:'test'}},CT_CREDENTIAL_VAULT:{lock(){}}};
 const seed=(key,obj)=>db.set(key,{...obj,__createdAt:'2026-01-01T00:00:00Z',__updatedAt:'2026-01-01T00:00:00Z'});
 for(const id of ['t','s1','s2'])seed('Users/'+id,{id,authUid:id,name:id,role:id==='t'?'teacher':'student',active:true,mustChangePassword:false,grade:'7',className:'7A'});
 function client(actor){
  const win={...w},context=vm.createContext({window:win,console,crypto});for(const f of ['learning-core.js','debug-lab-model.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
  const base='projects/demo-code-think/databases/(default)/documents';let val,plain;
  const doc=(key,row)=>({name:base+'/schools/t/'+key,fields:Object.fromEntries(Object.entries(row).map(([k,v])=>[k,val(v)])),updateTime:row.__updatedAt});
  const session=new Map([['ct11-firebase-session',JSON.stringify({uid:actor,idToken:'mock',expiresAt:Date.now()+3600000})]]);
  async function fetch(url,options){
   const body=options.body?JSON.parse(options.body):null;let data,status=200;
   if(url.endsWith(':commit'))data={writeResults:body.writes.map(w=>{const key=w.update.name.split('/schools/t/')[1],row=Object.fromEntries(Object.entries(w.update.fields).map(([k,v])=>[k,plain(v)])),time=new Date().toISOString();for(const tr of w.updateTransforms||[])row[tr.fieldPath]=time;db.set(key,row);writes.push({actor,key,row});return {updateTime:time,transformResults:(w.updateTransforms||[]).map(()=>({timestampValue:time}))};})};
   else if(url.endsWith(':runQuery')){const q=body.structuredQuery,table=q.from[0].collectionId,f=q.where?.fieldFilter;data=[...db].filter(([key,row])=>key.startsWith(table+'/')&&(!f||row[f.field.fieldPath]===plain(f.value))).map(([key,row])=>({document:doc(key,row)}));}
   else if(url.includes('/identities/'))data={name:base+'/identities/'+actor,fields:{schoolId:val('t'),userId:val(actor)}};
   else{const key=url.split('/schools/t/')[1],row=db.get(key);if(row)data=doc(key,row);else{status=404;data={error:{message:'NOT_FOUND'}};}}
   return {ok:status===200,status,json:async()=>data};
  }
  const c=vm.createContext({window:win,console,crypto,fetch,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)}});vm.runInContext(fs.readFileSync(path.join(root,'firebase-direct.js'),'utf8'),c);val=win.CT_FIREBASE._test.val;plain=win.CT_FIREBASE._test.plain;return win.CT_FIREBASE;
 }
 return {db,writes,seed,client};
}
test('baseline gates the lab; raw pupil identity is ignored and no grade/XP write is made',async()=>{
 const f=fixture(),p=f.client('s1');assert.equal((await p.call('debugLabWorkspace')).allowed,false);
 await assert.rejects(p.call('saveDebugLabWork',{labId:'lab-01'}));f.seed('Attempts/s1_baseline',{id:'s1_baseline',userId:'s1',__ownerId:'s1',status:'in_progress'});assert.equal((await p.call('debugLabWorkspace')).allowed,false);
 f.db.get('Attempts/s1_baseline').status='submitted';assert.equal((await p.call('debugLabWorkspace')).allowed,true);
 const row=await p.call('saveDebugLabWork',{userId:'s2',labId:'lab-01',inputData:'-8 -3 -6',prediction:'-3',buggyOutput:'0',found:true,fixedCode:'print(max(map(int,input().split())))',explanation:'0 бастапқы мәні теріс сандардан үлкен.',passed:8});
 assert.equal(row.userId,'s1');assert.equal(row.expectedOutput,'-3');assert.equal(row.status,'practiced');assert.equal(row.selfReported,true);assert.equal(row.total,8);assert.ok(f.writes.every(w=>['Users/s1','DebugLabWork/s1__lab-01'].includes(w.key)));
 const other=await f.client('s2').call('debugLabWorkspace');assert.equal(other.work.length,0);
 const teacher=await f.client('t').call('debugLabWorkspace');assert.equal(teacher.work.length,1);assert.equal(teacher.users.length,2);
});
test('invalid input, wrong prediction, missing explanation and excessive pass counts cannot complete a lab',async()=>{
 const f=fixture();f.seed('Attempts/s1_baseline',{id:'s1_baseline',userId:'s1',__ownerId:'s1',status:'graded'});const p=f.client('s1');
 const base={labId:'lab-01',inputData:'-8 -3 -6',prediction:'-3',buggyOutput:'0',found:true,fixedCode:'print(0)',passed:0};
 let row=await p.call('saveDebugLabWork',{...base,prediction:'0'});assert.equal(row.found,false);assert.equal(row.status,'draft');
 row=await p.call('saveDebugLabWork',{...base,inputData:'letters'});assert.equal(row.found,false);assert.equal(row.status,'draft');
 row=await p.call('saveDebugLabWork',{...base,passed:8});assert.equal(row.status,'witness');
 await assert.rejects(p.call('saveDebugLabWork',{...base,passed:9}));await assert.rejects(p.call('saveDebugLabWork',{...base,labId:'lab-05'}));await assert.rejects(f.client('t').call('saveDebugLabWork',base));
});
