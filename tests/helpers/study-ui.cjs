'use strict';
// Synthetic UI fixtures: no Firebase keys, network, accounts or pupil records.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto').webcrypto;
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function workspace(role='student',baselineStatus='graded'){
 const w={},context=vm.createContext({window:w});vm.runInContext(read('learning-core.js'),context);
 const teacher={id:'t',authUid:'t',login:'teacher-demo',name:'Сынақ мұғалімі',role:'teacher',active:true,grade:'',className:''};
 const pupil={id:'s',authUid:'s',login:'student-demo',name:'Сынақ оқушысы',role:'student',active:true,grade:'8',className:'8А'};
 const task=w.CT_CORE.taskSeed.find(x=>x.sourceKey==='guide-05');
 const tables={Users:[teacher,pupil],Classes:[{id:'c',name:'8А',grade:'8',teacherId:'t',active:true}],ClassStudents:[{userId:'s',classId:'c'}],Tasks:[task],Assignments:[{id:'a',taskId:task.id,classId:'c',status:'published',createdBy:'t'}],TaskAttempts:[{id:'work',assignmentId:'a',userId:'s',status:'graded',score:12,code:'print(1)',teacherComment:'Келесіде шекаралық мәнмен тексер.'}],Attempts:baselineStatus?[{id:'base',userId:'s',grade:'8',status:baselineStatus,attemptType:'baseline',totalScore:18}]:[]};
 const user=role==='teacher'?teacher:pupil,core=w.CT_CORE.create(tables,user);
 const data=role==='teacher'?{dashboard:core.run('teacherDashboard'),teacherWS:core.run('teacherWorkspace'),teacherProfile:{user,preferences:{}}}:{mine:core.run('me'),workspace:core.run('studentWorkspace'),studentProfile:{avatar:'robot'}};
 const review={attempt:tables.TaskAttempts[0],assignment:tables.Assignments[0],task,student:pupil,steps:[],evidence:[],corrections:[]};
 return {user,review,data:JSON.parse(JSON.stringify({...data,corrections:core.run('correctionWorkspace'),ped:core.run('pedagogyWorkspace'),timings:[]}))};
}
function makeUI(file='platform.js',options={}){
 const fixture=workspace(options.role,options.baselineStatus),calls=[],storage=new Map(),nodes=new Map(),events={},intervals=[];
 const storageAPI={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 class Node{
  constructor(){this.dataset={};this.style={};this.classList={toggle(){},add(){},remove(){}};this.value='';this.innerHTML='';}
  addEventListener(type,fn){(this.events??={})[type]=fn;}querySelector(){return null;}querySelectorAll(){return [];}setAttribute(){}getAttribute(){return null;}hasAttribute(){return false;}scrollIntoView(){}after(){}append(){}remove(){}
 }
 const element=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const languages=['kk','ru'].map(lang=>Object.assign(new Node(),{dataset:{lang}}));
 const document={documentElement:{},body:{dataset:{}},visibilityState:'visible',hidden:false,hasFocus:()=>true,getElementById:element,querySelector:s=>s==='.brand'?element('brand'):null,querySelectorAll:s=>s==='[data-lang]'?languages:s==='textarea.code-editor[data-draft$=":code"],textarea[data-training-field="code"]'?(options.codeEditors||[]):[],createElement:()=>new Node(),addEventListener:(type,fn)=>{(events[type]??=[]).push(fn);}};
 const api=async(action,p={})=>{calls.push({action,p});if(action==='sessionUser')return {user:fixture.user};if(action==='schoolWorkspace')return fixture.data;if(action==='teacherReviewWorkspace')return fixture.review;if(action==='rankingWorkspace')return {rows:[{userId:'s',name:fixture.user.name,classId:'c',className:'8А',xp:120,weeklyXP:0,completed:1,growthXP:0,avatar:'robot',badges:[]}],classes:[{id:'c',name:'8А'}],serverNow:'2026-11-09T10:00:00Z'};if(action==='debugLabWorkspace')return {allowed:options.baselineStatus!==null,work:[]};if(action==='olympiadWorkspace')return {allowed:false,completed:1,total:12,work:[]};throw Error('Unexpected UI API: '+action);};
 const w={CODE_THINK_CONFIG:{firebase:{projectId:'demo-code-think'}},addEventListener(){},CT_FIREBASE:{call:api,invalidate(){},status:()=>({customStudentLogins:true})}};
 const visual={mount:()=>({destroy(){},load(){}})},context=vm.createContext({window:w,document,localStorage:storageAPI,sessionStorage:storageAPI,crypto,console,performance:{now:()=>1000},CodeThinkVisual:visual,URL,Blob,TextEncoder,setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>fn()});
 for(const f of ['content.js','pedagogy.js','institution.js','teacher-engine.js','profile-engine.js','trainer-engine.js','conclusion-bank.js','conclusion-engine.js','diagnostic-intro.js','olympiad-bank.js','olympiad-model.js','debug-lab-model.js','ranking-model.js','ranking.js','debug-lab.js','olympiad.js','error-passport-examples.js','error-passports.js'])vm.runInContext(read(f),context,{filename:f});
 const source=read(file).replace('  boot();',`  window.__studyUI={setup(value,data){user=value;mine=data.mine||{};workspace=data.workspace||{assignments:[]};dashboard=data.dashboard||{};teacherWS=data.teacherWS||{};corrections=data.corrections;ped=data.ped;profileInfo=data.studentProfile||{};teacherProfileInfo=data.teacherProfile||{};},review(value){reviewData=value;reviewId=value.attempt.id;teacherTab='review';},tab(value){teacherTab=value;},drafts:()=>Object.fromEntries(drafts),page(value){page=value;},lang(value){lang=value;},study(id='a',index=2){activeId=id;step=index;page='task';},codePanel,trainingDraft,actions,nav,studentView,teacherView,render,state:()=>({page,user})};`);
 vm.runInContext(source,context,{filename:file});w.__studyUI.setup(fixture.user,fixture.data);
 return {ui:w.__studyUI,w,calls,nodes,fixture,intervals};
}
module.exports={makeUI,workspace};
