const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function model(){const c=vm.createContext({window:{}});vm.runInContext(read('debug-lab-model.js'),c);return c.window.CT_DEBUG_LAB_MODEL;}
const run=(code,input)=>{const r=spawnSync('python',['-c',code],{input,encoding:'utf8',timeout:1500});return {ok:r.status===0,output:r.stdout||'',error:r.stderr||''};};
const fixes={
 'maximum':'a=list(map(int,input().split()))\nprint(max(a))',
 'delivery':'p=int(input())\nprint(p if p>=5000 else p+500)',
 'sign':'n=int(input())\nprint("ZERO" if n==0 else "POSITIVE" if n>0 else "NEGATIVE")',
 'average':'a,b=map(int,input().split())\nprint((a+b)/2)',
 'sum':'n=int(input())\nprint(sum(range(1,n+1)))',
 'digits':'n=int(input())\nprint(len(str(n)))',
 'product':'a=list(map(int,input().split()))\np=1\nfor x in a:p*=x\nprint(p)',
 'count':'target=int(input())\na=list(map(int,input().split()))\nprint(a.count(target))'
};
test('eight logical-error exercises have valid normal examples and real counterexamples',()=>{
 const m=model();assert.equal(m.bank.length,8);for(const grade of ['7','8'])assert.equal(m.bank.filter(t=>t.grade===grade).length,4);
 for(const p of m.bank){for(const lang of ['kk','ru'])for(const key of ['title','goal','format','hint'])assert.ok(p[lang][key]);assert.ok(m.parse(p,p.example).ok);assert.ok(m.parse(p,p.witness).ok);const normal=run(p.buggyCode,p.example),counter=run(p.buggyCode,p.witness);assert.ok(normal.ok);assert.ok(counter.ok);assert.ok(m.equal(normal.output,m.expected(p,p.example)),p.id);assert.ok(!m.equal(counter.output,m.expected(p,p.witness)),p.id);}
});
test('all supplied checks accept alternative correct Python solutions',()=>{
 const m=model();let count=0;for(const p of m.bank)for(const input of [...p.tests,p.witness]){const result=run(fixes[p.kind],input);assert.ok(result.ok,result.error);assert.ok(m.equal(result.output,m.expected(p,input)),p.id+': '+input);count++;}assert.equal(count,60);
});
test('invalid and out-of-domain data cannot be counterexamples',()=>{
 const m=model();for(const p of m.bank){assert.ok(!m.parse(p,'').ok);assert.ok(!m.parse(p,'hello').ok);assert.ok(!m.parse(p,'1e100').ok);assert.ok(!m.parse(p,'99999999999999999').ok);}
 const digits=m.bank.find(p=>p.kind==='digits');assert.ok(!m.parse(digits,'00').ok);assert.ok(!m.parse(digits,'-1').ok);const count=m.bank.find(p=>p.kind==='count');assert.ok(!m.parse(count,'1 2 3').ok);assert.ok(!m.parse(count,'1 2\n3').ok);assert.ok(!m.parse(count,'1\n').ok);
 assert.ok(m.equal('3.0','3'));assert.ok(m.equal('3e0','3'));assert.ok(!m.equal('NaN','0'));assert.ok(!m.equal('POSITIVE','positive'));
});
function ui(){
 const events={},storage=new Map(),written=[],workers=[];let html='',msg={dataset:{}},stops=[{},{}];
 const rootEl={set outerHTML(v){html=v;},querySelector:selector=>selector==='[data-lab-message]'?msg:null,querySelectorAll:selector=>selector==='[data-lab=stop]'?stops:[],setAttribute(){}};
 const w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think'}}},c=vm.createContext({window:w,document:{addEventListener:(k,f)=>events[k]=f,querySelector:()=>rootEl},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout,clearTimeout,console});
 vm.runInContext(read('debug-lab-model.js'),c);
 class Worker{
  constructor(){this.i=0;this.dead=false;workers.push(this);}
  terminate(){this.dead=true;}
  emit(data){if(!this.dead)this.onmessage?.({data});}
  postMessage(data){if(data.type==='start'){this.data=data;setTimeout(()=>{this.emit({type:'ready'});this.next();},0);}else if(data.type==='next')setTimeout(()=>this.next(),0);}
  next(){if(this.dead)return;if(this.i===this.data.inputs.length){this.emit({type:'complete'});return;}const index=this.i++;this.emit({type:'case-start',index});const result=run(this.data.code,this.data.inputs[index]);this.emit({type:'case-result',index,...result});}
 }
 c.Worker=Worker;vm.runInContext(read('debug-lab.js'),c);
 const api=async(action,data)=>{if(action==='debugLabWorkspace')return {allowed:true,work:[],users:[]};written.push(data);return {userId:'s',...data,__updatedAt:new Date().toISOString()};};
 const click=(action,more={})=>events.click({target:{closest:()=>({disabled:false,dataset:{lab:action,...more}})}});
 const input=(field,value)=>events.input({target:{closest:()=>({dataset:{labField:field},value})}});
 const wait=async pred=>{const end=Date.now()+3000;while(!pred()){if(Date.now()>end)throw Error('UI state timed out: '+html.slice(-200));await new Promise(r=>setTimeout(r,5));}};
 return {w,events,storage,written,workers,api,click,input,wait,html:()=>html,stops};
}
test('counterexample opens repair step, expected output is shown, unchanged code fails, correct repair passes',async()=>{
 const q=ui(),view=q.w.CT_DEBUG_LAB;await view.load({user:{id:'s',role:'student',grade:'7'},lang:'kk',api:q.api});
 assert.ok(!view.html().includes('lab-edit'));await q.click('open',{id:'lab-01'});q.input('inputData','-8 -3 -6');q.input('prediction','-3');await q.click('probe');
 await q.wait(()=>q.written.length===1&&q.html().includes('lab-edit'));assert.equal(q.written[0].found,true);assert.equal(q.written[0].buggyOutput.trim(),'0');assert.equal(q.written[0].expectedOutput,'-3');assert.ok(q.html().includes('Дұрыс нәтиже'));
 q.input('explanation','maximum бастапқыда 0 болғандықтан, теріс сандар оны өзгертпейді.');await q.click('verify');await q.wait(()=>q.written.length===2);assert.equal(q.written.at(-1).passed,0);
 q.input('fixedCode',fixes.maximum);await q.click('verify');await q.wait(()=>q.written.length===3);assert.equal(q.written.at(-1).passed,q.written.at(-1).total);assert.ok(q.html().includes('барлық тексерістен өтті'));
 q.input('fixedCode','print(0)');await q.click('save');assert.equal(q.written.at(-1).passed,0);
 view.leave();assert.ok(q.workers.every(w=>w.dead));
});
test('wrong prediction does not unlock repair; invalid input never starts Python; teacher preview never saves pupil work',async()=>{
 const q=ui(),view=q.w.CT_DEBUG_LAB;await view.load({user:{id:'s',role:'student',grade:'7'},lang:'ru',api:q.api});await q.click('open',{id:'lab-01'});
 q.input('inputData','letters');q.input('prediction','0');await q.click('probe');assert.equal(q.workers.length,0);
 q.input('inputData','-8 -3 -6');await q.click('probe');await q.wait(()=>q.written.length===1);assert.equal(q.written[0].found,false);assert.ok(!q.html().includes('lab-edit'));assert.ok(q.html().includes('Правильный результат'));
 await view.load({user:{id:'teacher',role:'teacher'},lang:'kk',api:q.api});await q.click('open',{id:'lab-01'});q.input('inputData','-8 -3 -6');q.input('prediction','-3');await q.click('probe');await q.wait(()=>q.html().includes('Дәлел таптың'));assert.equal(q.written.length,1);view.leave();
});
test('lab is locked until baseline completion and asset order/navigation hooks are present',async()=>{
 const q=ui();await q.w.CT_DEBUG_LAB.load({user:{id:'s',role:'student',grade:'8'},lang:'kk',api:async()=>({allowed:false,work:[]})});assert.ok(q.w.CT_DEBUG_LAB.html().includes('диагностиканы аяқта'));assert.ok(!q.w.CT_DEBUG_LAB.html().includes('lab-code'));
 const source=read('platform.js'),index=read('index.html');assert.ok(source.includes('studentBeforeDebugLab'));assert.ok(source.includes('teacherBeforeDebugLab'));assert.ok(index.indexOf('debug-lab-model.js')<index.indexOf('firebase-direct.js'));assert.ok(index.indexOf('debug-lab.js')<index.indexOf('platform.js'));
});
