const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function client({mustChangePassword=false}={}){
 const base='projects/code-think-new/databases/(default)/documents',requests=[],pending=[];
 let active=true,hold=false,concurrent=0,peak=0;
 const session={uid:'teacher',idToken:'token',expiresAt:Date.now()+3600000};
 const w={CODE_THINK_CONFIG:{firebase:{projectId:'code-think-new',apiKey:'test'}},CT_CREDENTIAL_VAULT:{lock(){}}};
 const row=(name,data)=>({name,fields:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:{stringValue:v}]))});
 const fetch=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer token');
  const body=options.body&&JSON.parse(options.body);requests.push({url,body});concurrent++;peak=Math.max(peak,concurrent);
  let data,status=200;
  if(url.endsWith('/identities/teacher'))data=row(base+'/identities/teacher',{schoolId:'school',userId:'teacher'});
  else if(url.endsWith('/Users/teacher'))data=row(base+'/schools/school/Users/teacher',{id:'teacher',authUid:'teacher',login:'teacher@example.kz',name:'Teacher',role:'teacher',active,mustChangePassword});
  else if(url.endsWith('/TeacherProfiles/teacher')){status=404;data={error:{status:'NOT_FOUND'}};}
  else if(url.endsWith(':runQuery'))data=[];
  else throw Error('Unexpected write: '+url);
  if(hold&&(url.endsWith('/TeacherProfiles/teacher')||body?.structuredQuery?.from[0].collectionId==='TaskTimes'))await new Promise(resolve=>pending.push(resolve));
  await Promise.resolve();concurrent--;
  return {ok:status===200,status,json:async()=>data};
 };
 const c=vm.createContext({window:w,crypto,fetch,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>k==='ct11-firebase-session:code-think-new'?JSON.stringify(session):null,setItem(){},removeItem(){}}});
 for(const f of ['learning-core.js','new-project/firebase-direct.js'])vm.runInContext(read(f),c);
 return {api:w.CT_FIREBASE,requests,pending,hold:()=>hold=true,disable:()=>active=false,peak:()=>peak};
}
test('session restoration validates access without loading learning tables',async()=>{
 const f=client(),restored=await f.api.call('sessionUser');
 assert.equal(restored.user.id,'teacher');assert.equal(restored.user.role,'teacher');
 assert.equal('authUid'in restored.user,false);assert.equal(f.requests.length,2);
 assert.equal(f.requests.filter(r=>r.body?.structuredQuery).length,0);
 const before=f.requests.length;await f.api.call('me');
 const fullHistoryReads=f.requests.length-before;
 assert.ok(fullHistoryReads>2);console.log('Session restoration requests: '+fullHistoryReads+' -> 2');
 f.disable();await assert.rejects(f.api.call('sessionUser'),/Аккаунт қолжетімсіз/);
});
test('password-change gate remains active after lightweight session restoration',async()=>{
 const f=client({mustChangePassword:true}),r=await f.api.call('sessionUser');
 assert.equal(r.user.mustChangePassword,true);
 await assert.rejects(f.api.call('schoolWorkspace'),/уақытша құпиясөзді ауыстырыңыз/);
 assert.equal(f.requests.filter(r=>r.body?.structuredQuery).length,0);
});
test('workspace loads preferences and timings together without exceeding four concurrent requests',async()=>{
 const f=client();f.hold();const response=f.api.call('schoolWorkspace',{view:'overview'});
 for(let i=0;i<40&&f.pending.length<2;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.pending.length,2,'both independent reads must start before either completes');
 f.pending.forEach(resolve=>resolve());const data=await response;
 assert.equal(data.teacherProfile.user.id,'teacher');assert.deepEqual(JSON.parse(JSON.stringify(data.timings)),[]);
 assert.ok(data.dashboard&&data.teacherWS&&data.corrections);assert.ok(f.peak()<=4);
});
function assets(){
 const scripts=[],w={},document={baseURI:'https://ali1991kz.github.io/www.code-think/',createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 vm.runInNewContext(read('new-project/lazy-assets.js'),{window:w,document,URL});
 return {w,scripts};
}
test('Excel is absent from initial load, deduplicated on demand, and reusable',async()=>{
 const f=assets();assert.equal(f.scripts.length,0);
 const first=f.w.CT_ASSETS.excel(),second=f.w.CT_ASSETS.excel();assert.equal(first,second);assert.equal(f.scripts.length,1);
 assert.equal(f.scripts[0].src,'https://ali1991kz.github.io/www.code-think/vendor/xlsx.full.min.js');
 f.w.XLSX={ready:true};f.scripts[0].onload();assert.equal(await first,f.w.XLSX);assert.equal(await f.w.CT_ASSETS.excel(),f.w.XLSX);assert.equal(f.scripts.length,1);
});
test('failed Excel download can retry without blocking login or other features',async()=>{
 const f=assets(),first=f.w.CT_ASSETS.excel();f.scripts[0].onerror();await assert.rejects(first,/Excel/);
 const second=f.w.CT_ASSETS.excel();assert.equal(f.scripts.length,2);f.w.XLSX={};f.scripts[1].onload();assert.equal(await second,f.w.XLSX);
});
test('entrypoint defers ordered scripts and both Excel actions await the lazy parser',()=>{
 const html=read('new-project/index.html'),scripts=[...html.matchAll(/<script\b([^>]*)>/g)];
 assert.ok(scripts.length>10);assert.ok(scripts.every(m=>m[1].includes('defer')));assert.ok(!html.includes('src="vendor/xlsx'));
 const platform=read('new-project/platform.js');assert.equal((platform.match(/await window\.CT_ASSETS\.excel\(\)/g)||[]).length,2);
 assert.ok(platform.includes("const restored=await api('sessionUser')"));
 assert.ok(html.indexOf('new-project/lazy-assets.js')<html.indexOf('new-project/platform.js'));
});
