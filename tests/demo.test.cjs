'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto,path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function demo(search='',saved=new Map()){
 const production=new Map([['ct11-token','REAL_SESSION'],['ct11-token:code-think-new','OTHER_SESSION'],['ct11-drafts:real-pupil','REAL_DRAFT']]);
 const storage={getItem:k=>saved.get(k)||production.get(k)||null,setItem:(k,v)=>{assert.ok(k.startsWith('ct-demo:v1:'));saved.set(k,String(v));},removeItem:k=>{assert.ok(k.startsWith('ct-demo:v1:'));saved.delete(k);}};
 const w={sessionStorage:storage},network=()=>{throw Error('NETWORK FORBIDDEN');},ctx=vm.createContext({window:w,location:{search},URLSearchParams,crypto,fetch:network,XMLHttpRequest:network,WebSocket:network,navigator:{sendBeacon:network}});
 for(const f of ['demo-config.js','content.js','pedagogy.js','learning-core.js','mission-bank.js','mission-engine.js','demo-adapter.js'])vm.runInContext(read(f),ctx,{filename:f});
 return {api:w.CT_FIREBASE,store:saved,production};
}
test('demo entry has no real adapter/config and denies Firebase endpoints via CSP',()=>{
 const html=read('demo.html'),srcs=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(srcs.some(s=>s.startsWith('demo-config.js')));assert.ok(srcs.some(s=>s.startsWith('demo-adapter.js')));
 assert.ok(!srcs.some(s=>/^(?:new-project\/)?(?:config|firebase-direct)\.js/.test(s)));
 assert.match(html,/connect-src 'self' https:\/\/cdn\.jsdelivr\.net;/);assert.doesNotMatch(html,/googleapis\.com|firebaseapp\.com|apiKey/);
 for(const f of ['index.html','new-project/index.html'])assert.match(read(f),/platform.js\?v=12.8.0/);
 for(const f of ['platform.js','new-project/platform.js'])assert.match(read(f),/href="demo.html"/);
});
test('pupil local save, reload, teacher review, grading and corrections have no transport',async()=>{
 const d=demo();assert.equal((await d.api.call('sessionUser')).user.id,'demo-pupil-0');
 const ws=await d.api.call('schoolWorkspace');assert.equal(ws.workspace.assignments.length,12);assert.ok(ws.workspace.assignments.every(a=>a.task.grade==='8'));
 await d.api.call('saveTaskCode',{attemptId:'demo-work-0',code:'print(42)',inputData:'',output:'42'});
 assert.equal((await demo('',d.store).api.call('schoolWorkspace')).workspace.assignments.find(a=>a.id==='demo-guide-05').attempt.code,'print(42)');
 const teacher=demo('?role=teacher',d.store),p={attemptId:'demo-work-1',scores:{C:3,OD:3,E:1,TH:1,INK:2},teacherComment:'Бөлгішті 7-ге өзгерт.'};
 await teacher.api.call('gradeTask',p);await teacher.api.call('releaseCorrections',{kind:'task',sourceId:p.attemptId,open:true});
 const review=await teacher.api.call('teacherReviewWorkspace',p);assert.equal(review.attempt.score,10);assert.match(review.attempt.teacherComment,/7/);
 const arm=demo('?pupil=1',d.store);assert.equal((await arm.api.call('correctionWorkspace')).items.length,1);
 await arm.api.call('submitCorrection',{kind:'task',sourceId:p.attemptId,taskIndex:-1,code:'print(200)',inputData:'',output:'200',explanation:'Дұрыс бөлгіш 7.',requestId:'demo-correction'});
 assert.equal((await demo('?role=teacher',d.store).api.call('teacherReviewWorkspace',p)).corrections.length,1);
 assert.equal(d.production.get('ct11-token'),'REAL_SESSION');assert.equal(d.production.get('ct11-drafts:real-pupil'),'REAL_DRAFT');
});
test('unsupported authentication and administration fail closed, leaving demo unchanged',async()=>{
 const d=demo(),before=d.store.get('ct-demo:v1:tables');
 for(const a of ['login','setupTeacher','installMaterials','importStudents','purgeStudents','changePassword','unknown','exportBackup'])await assert.rejects(d.api.call(a,{}),/демода/);
 assert.equal(d.store.get('ct-demo:v1:tables'),before);
 assert.doesNotMatch(read('demo-adapter.js'),/\bfetch\s*\(|XMLHttpRequest|sendBeacon|import\(/);
 assert.match(read('platform.js'),/localStorage=config.demo\?window.CT_DEMO_STORAGE:globalThis.localStorage/);
});
test('demo example checking is real sample comparison and not unconditional success',async()=>{
 const d=demo(),p={taskId:'guide-05'};assert.ok((await d.api.call('getTaskTests',p)).tests.length);
 assert.equal((await d.api.call('checkTaskOutputs',{...p,outputs:[{output:'wrong'}]})).passed,0);
 assert.equal((await d.api.call('checkTaskOutputs',{...p,outputs:[{output:'Жалпы: 2800.00\nОрташа: 400.00'}]})).passed,1);
});
