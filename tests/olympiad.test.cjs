const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function models(){const c=vm.createContext({window:{}});for(const p of ['learning-core.js','olympiad-bank.js','olympiad-model.js'])vm.runInContext(read(p),c);return c.window;}
test('15 complete bilingual adapted tasks, five per level, examples and additional tests',()=>{
 const w=models(),bank=w.CT_OLYMPIAD_BANK;assert.equal(bank.length,15);assert.equal(new Set(bank.map(p=>p.id)).size,15);
 for(const level of [1,2,3])assert.equal(bank.filter(p=>p.level===level).length,5);
 for(const p of bank){assert.equal(p.grade,8);assert.ok(p.limits);assert.ok(p.source.includes('Inf_8_kaz.pdf'));assert.equal(p.examples.length,2);assert.ok(p.tests.length>=10);for(const lang of ['kk','ru'])for(const field of ['title','statement','input','output'])assert.ok(p[lang][field].trim());}
 assert.equal(bank.reduce((n,p)=>n+p.tests.length,0),158);
});
test('all 158 expanded cases and 30 examples match executable Python reference algorithms',()=>{
 const w=models(),records=[];
 for(const p of w.CT_OLYMPIAD_BANK)for(const c of [...p.tests,...p.examples])records.push({number:p.number,input:w.CT_OLYMPIAD_MODEL.expand(c),output:c.output});
 const program="import sys,json,runpy\nm=runpy.run_path('tests/build_olympiad_bank.py')\nfor r in json.load(sys.stdin):\n assert m['solve'](r['number'],r['input']).split()==r['output'].split(),r['number']\nprint('188 executable cases/examples passed')";
 const r=spawnSync('python',['-c',program],{cwd:root,input:JSON.stringify(records),encoding:'utf8',maxBuffer:3e6,timeout:30000});assert.equal(r.status,0,r.stderr);
});
test('unlock uses all 12 canonical interleaved grade-8 tasks, ignores retries and ungraded work',()=>{
 const w=models(),user={id:'s',grade:'8'},tasks=w.CT_CORE.taskSeed,expected=tasks.filter(t=>t.grade==='8');assert.equal(expected.length,12);
 const tables={Tasks:tasks,Assignments:expected.map((t,i)=>({id:'a'+i,taskId:t.id,classId:'old-class',status:'archived'})),TaskAttempts:expected.map((t,i)=>({assignmentId:'a'+i,userId:'s',status:'graded'}))};
 assert.equal(w.CT_OLYMPIAD_MODEL.readiness(tables,user).allowed,true);
 tables.TaskAttempts[0].status='submitted';assert.equal(w.CT_OLYMPIAD_MODEL.readiness(tables,user).allowed,false);
 tables.TaskAttempts.push({...tables.TaskAttempts[1]});assert.equal(w.CT_OLYMPIAD_MODEL.readiness(tables,user).completed,11);
 tables.TaskAttempts[0].status='graded';assert.equal(w.CT_OLYMPIAD_MODEL.readiness(tables,{id:'someone-else',grade:'8'}).completed,0);
 assert.equal(w.CT_OLYMPIAD_MODEL.readiness(tables,{id:'s',grade:'7'}).allowed,false);
});
test('output comparison tolerates whitespace, retains signs and case',()=>{
 const m=models().CT_OLYMPIAD_MODEL;assert.equal(m.normalize('1\n 2  \n'),m.normalize('1 2'));assert.notEqual(m.normalize('ALFA'),m.normalize('alfa'));assert.notEqual(m.normalize('-1'),m.normalize('1'));
});
test('locked, pupil, teacher, Russian catalog and Python problem editor render without answers',async()=>{
 const w=models(),events={},storage=new Map();let html='';
 const doc={addEventListener:(name,fn)=>events[name]=fn,querySelector:s=>s==='#olympiadRoot'?{set outerHTML(x){html=x;},querySelector(){return null;},querySelectorAll(){return [];}}:null};
 const c=vm.createContext({window:w,document:doc,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout,clearTimeout,Worker:class{},console});vm.runInContext(read('olympiad.js'),c);
 const ui=w.CT_OLYMPIAD,user={id:'s',role:'student'},api=async()=>({allowed:false,completed:4,total:12,work:[]});
 await ui.load({user,lang:'kk',api});assert.ok(ui.html().includes('4/12'));assert.ok(!ui.html().includes('data-olymp-field="code"'));
 await ui.load({user,lang:'kk',api:async()=>({allowed:true,work:[]})});assert.equal((ui.html().match(/data-olymp="open"/g)||[]).length,15);
 await events.click({target:{closest:()=>({disabled:false,dataset:{olymp:'open',task:'olymp-01'}})}});assert.ok(html.includes('data-olymp-field="code"'));assert.ok(html.includes('Әріптер арасы'));assert.ok(!html.includes('sampleCode'));
 ui.context({user,lang:'ru',api});assert.ok(ui.html().includes('Расстояние между буквами'));
 await ui.load({user:{id:'t',role:'teacher'},lang:'kk',api:async()=>({allowed:true,users:[{id:'x',name:'<script>alert(1)</script>',className:'8A',completed:0,total:12}],access:[],work:[]})});assert.ok(ui.html().includes('&lt;script&gt;'));assert.ok(!ui.html().includes('<script>'));
});
test('worker Python harness supports input(), sys.stdin.buffer, SystemExit and isolated variables',()=>{
 const source=read('olympiad-worker.js'),harness=/runPythonAsync\(`([\s\S]*?)`\)/.exec(source)[1];
 const code="import json\n"+harness.replace('__ct_execute(__ct_program, __ct_stdin)','')+"\ntests=[('print(int(input())+1)','4\\n','5\\n'),('import sys; print(sum(map(int,sys.stdin.buffer.read().split())))','2 3\\n','5\\n'),('print(7); raise SystemExit(0)','','7\\n')]\nfor code,inp,want in tests:\n r=__ct_execute(code,inp);assert r['ok'] and r['output']==want,r\nr=__ct_execute('raise ValueError(123)','');assert not r['ok'] and 'ValueError' in r['error']\n__ct_execute('secret=7','');r=__ct_execute('print(secret)','');assert not r['ok']\n";
 const r=spawnSync('python',['-c',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});
test('navigation replaces the pedagogy tab and loads olympiad UI for both roles',()=>{
 const platform=read('platform.js'),index=read('index.html');assert.ok(!platform.includes("['pedagogy','Педагогика және дәлелдер'"));assert.ok(platform.includes("['olympiad','Олимпиадаға дайындық'"));assert.ok(platform.includes('studentBeforeOlympiad'));assert.ok(platform.includes('teacherBeforeOlympiad'));
 for(const file of ['olympiad-bank.js','olympiad-model.js','olympiad.js','olympiad.css'])assert.ok(index.includes(file));
 assert.ok(index.indexOf('olympiad-model.js')<index.indexOf('firebase-direct.js'));assert.ok(index.indexOf('olympiad.js')<index.indexOf('platform.js'));
});

test('result labels never invent a test count and preserve only a coherent result for identical code',()=>{
 const m=models().CT_OLYMPIAD_MODEL;
 assert.equal(m.workState(undefined),'untested');
 assert.equal(m.workState({verdict:'draft',passed:0,total:0,submissions:0}),'untested');
 assert.equal(m.workState({verdict:'draft',passed:0,total:0,submissions:11,solved:true}),'recheck');
 assert.equal(m.workState({verdict:'accepted',passed:0,total:11}),'untested');
 const prior={code:'print(3)',verdict:'accepted',passed:11,total:11,submissions:1,solved:true};
 assert.deepEqual(JSON.parse(JSON.stringify(m.resultForSave(prior,{code:'print(3)',inputData:'new'},11))),{verdict:'accepted',passed:11,total:11});
 assert.equal(m.resultForSave(prior,{code:'print(0)'},11).verdict,'draft');
 assert.equal(m.resultForSave(prior,{code:'print(3)'},12).verdict,'draft');
});
test('legacy teacher rows hide 0/0; one-click recheck saves the exact pupil code and edited teacher previews stay separate',async()=>{
 const w=models(),events={},storage=new Map(),calls=[];let html='',lastWorker;
 const rootNode={set outerHTML(v){html=v;},querySelector(){return null;},querySelectorAll(){return [];}};
 const doc={addEventListener:(n,f)=>events[n]=f,querySelector:s=>s==='#olympiadRoot'?rootNode:null};
 class FakeWorker{constructor(){lastWorker=this;}postMessage(v){this.request=v;}terminate(){}}
 const c=vm.createContext({window:w,document:doc,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout,clearTimeout,Worker:FakeWorker,console});vm.runInContext(read('olympiad.js'),c);
 const old={id:'s__olymp-01',userId:'s',taskId:'olymp-01',code:'print(3)',inputData:'abc\\nbcd',lastOutput:'3',verdict:'draft',passed:0,total:0,submissions:1,solved:true,__updatedAt:'old'};
 const other={...old,id:'other__olymp-01',userId:'other',code:'print(0)'};
 const data={allowed:true,users:[{id:'s',name:'Pupil',className:'8A',completed:12,total:12}],access:[],work:[old,other]};
 const api=async(action,p)=>{calls.push({action,p});if(action==='olympiadWorkspace')return data;if(action==='reviewOlympiadWork')return {...old,verdict:p.verdict,passed:p.passed,total:11,__updatedAt:'new'};throw Error(action);};
 await w.CT_OLYMPIAD.load({user:{id:'t',role:'teacher'},lang:'kk',api});
 assert.ok(!w.CT_OLYMPIAD.html().includes('0/0'));assert.ok(w.CT_OLYMPIAD.html().includes('Қайта тексеру қажет'));
 const click=(action,extra={})=>events.click({target:{closest:()=>({disabled:false,dataset:{olymp:action,...extra}})}});
 await click('review',{work:old.id});assert.equal(lastWorker.request.code,old.code);assert.ok(html.includes('Оқушының сақталған коды'));
 async function finish(){const tests=w.CT_OLYMPIAD_BANK[0].tests;for(let index=0;index<tests.length;index++){lastWorker.onmessage({data:{type:'case-start',index}});lastWorker.onmessage({data:{type:'case-result',index,ok:true,output:tests[index].output}});}lastWorker.onmessage({data:{type:'complete'}});await new Promise(r=>setTimeout(r,0));}
 await finish();assert.equal(calls.filter(x=>x.action==='reviewOlympiadWork').length,1);assert.equal(data.work.find(x=>x.userId==='s').passed,11);assert.equal(data.work.find(x=>x.userId==='other').code,'print(0)');
 events.input({target:{closest:()=>({dataset:{olympField:'code'},value:'print(99)'})}});await click('check');await finish();assert.equal(calls.filter(x=>x.action==='reviewOlympiadWork').length,1);assert.equal(data.work.find(x=>x.userId==='s').code,'print(3)');
 await click('back');assert.ok(w.CT_OLYMPIAD.html().includes('11/11'));assert.ok(!w.CT_OLYMPIAD.html().includes('0/0'));
});
