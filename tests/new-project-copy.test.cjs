const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function client(hasNewSession){
 const expiresAt=Date.now()+3600000,storage=new Map([
  ['ct11-firebase-session',JSON.stringify({uid:'old-user',idToken:'old-token',expiresAt})],
  ['ct11-token','old-ui'],['ct11-token:code-think-new','new-ui'],
  ['ct113-teacher-vault-key','old-vault'],['ct113-teacher-vault-key:code-think-new','new-vault']
 ]),requests=[];
 if(hasNewSession)storage.set('ct11-firebase-session:code-think-new',JSON.stringify({uid:'new-user',idToken:'new-token',expiresAt}));
 const w={},base='projects/code-think-new/databases/(default)/documents';
 const text=s=>({stringValue:s}),yes={booleanValue:true},no={booleanValue:false};
 const fetch=async(url,options)=>{
  requests.push({url,options});assert.ok(url.includes('/projects/code-think-new/'));assert.equal(options.headers.Authorization,'Bearer new-token');let result;
  if(url.endsWith('/identities/new-user'))result={name:base+'/identities/new-user',fields:{schoolId:text('school'),userId:text('new-user')}};
  else if(url.endsWith('/Users/new-user'))result={name:base+'/schools/school/Users/new-user',fields:{id:text('new-user'),authUid:text('new-user'),role:text('student'),name:text('Demo'),active:yes,mustChangePassword:no}};
  else if(url.endsWith(':runQuery'))result=[];
  else throw Error('Unexpected mutation or URL: '+url);
  return {ok:true,status:200,json:async()=>result};
 };
 const c=vm.createContext({window:w,crypto,fetch,location:{hostname:'localhost'},AbortController,setTimeout,clearTimeout,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
 for(const f of ['new-project/config.js','learning-core.js','new-project/teacher-vault.js','new-project/firebase-direct.js'])vm.runInContext(read(f),c);
 return {api:w.CT_FIREBASE,storage,requests};
}
test('copy never restores the original project session',async()=>{
 const f=client(false);assert.equal(f.api.status().project,'code-think-new');assert.equal(f.api.status().signedIn,false);
 await assert.rejects(f.api.call('me'),/Қайта кіріңіз/);assert.equal(f.requests.length,0);assert.equal(f.storage.get('ct11-token'),'old-ui');
});
test('copy reads only its new project; logout preserves original Auth, UI session and vault',async()=>{
 const f=client(true),old=f.storage.get('ct11-firebase-session');const me=await f.api.call('me');assert.equal(me.user.id,'new-user');assert.ok(f.requests.length>=2);
 await f.api.call('logout');assert.equal(f.api.status().signedIn,false);assert.equal(f.storage.get('ct11-firebase-session'),old);assert.equal(f.storage.get('ct11-token'),'old-ui');assert.equal(f.storage.get('ct113-teacher-vault-key'),'old-vault');
 assert.equal(f.storage.has('ct11-firebase-session:code-think-new'),false);assert.equal(f.storage.has('ct11-token:code-think-new'),false);assert.equal(f.storage.has('ct113-teacher-vault-key:code-think-new'),false);
});
test('copy routing keeps workers at the shared asset root and links inside the new project',()=>{
 const page='https://ali1991kz.github.io/www.code-think/new-project/',base=new URL('../',page);
 for(const name of ['index.html','setup.html']){
  const html=read('new-project/'+name);assert.ok(html.includes('<base href="../">'));assert.ok(html.includes('src="new-project/config.js?'));assert.ok(html.includes('src="new-project/firebase-direct.js?'));assert.ok(!html.includes('href="index.html"'));assert.ok(!html.includes('href="#"'));
 }
 assert.equal(new URL('python-worker.js',base).href,'https://ali1991kz.github.io/www.code-think/python-worker.js');
 const p=read('new-project/platform.js');assert.ok(!p.includes("'ct11-token'"));assert.ok(p.includes("'ct11-drafts:code-think-new:'"));assert.ok(p.includes('href="new-project/#profile-progress"'));
 for(const f of ['new-project/config.js','new-project/platform.js','new-project/firebase-direct.js','new-project/teacher-vault.js','new-project/institution.js'])new vm.Script(read(f),{filename:f});
});
