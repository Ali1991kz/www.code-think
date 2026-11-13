/* Deliberately no network transport. Synthetic tables stay in this tab. */
(()=>{
 'use strict';
 const store=window.CT_DEMO_STORAGE,copy=x=>JSON.parse(JSON.stringify(x));
 const params=new URLSearchParams(location.search),role=params.get('role')==='teacher'?'teacher':'student',pupilId=params.get('pupil')==='1'?'demo-pupil-1':'demo-pupil-0';
 const now=()=>new Date().toISOString();
 const sampleCode='expenses = []\nfor i in range(7):\n    expense = float(input())\n    expenses.append(expense)\ntotal = sum(expenses)\naverage = total / 7\nprint(f"Жалпы: {total:.2f}")\nprint(f"Орташа: {average:.2f}")';
 function seed(){
  const teacher={id:'demo-teacher',name:'Демо мұғалім',login:'demo_teacher',role:'teacher',active:true,grade:'',className:''};
  const pupils=['Айдана · демо','Арман · демо'].map((name,i)=>({id:'demo-pupil-'+i,name,login:'demo_pupil_'+i,role:'student',grade:'8',className:'8А · ДЕМО',active:true,mustChangePassword:false}));
  const tasks=copy(window.CT_CORE.taskSeed),assignment=task=>({id:'demo-'+task.id,taskId:task.id,classId:'demo-class',title:task.title,status:'published',createdBy:teacher.id,createdAt:now()});
  const tables={Users:[teacher,...pupils],Classes:[{id:'demo-class',name:'8А · ДЕМО',grade:'8',teacherId:teacher.id,active:true}],ClassStudents:pupils.map(p=>({classId:'demo-class',userId:p.id})),Tasks:tasks,Assignments:tasks.filter(t=>t.grade==='8').map(assignment),Attempts:pupils.map(p=>({id:p.id+'-baseline',userId:p.id,grade:'8',status:'graded',attemptType:'baseline',totalScore:15,teacherComment:'Демонстрациялық бастапқы нәтиже.'})),TaskAttempts:[],TaskSteps:[],LearningEvidence:[],DemoTimings:[],DemoProfiles:{}};
  for(const [i,p]of pupils.entries()){
   const id='demo-work-'+i,code=i?sampleCode.replace('total / 7','total / 6'):sampleCode;
   tables.TaskAttempts.push({id,assignmentId:'demo-guide-05',userId:p.id,status:i?'submitted':'in_progress',pedagogyVersion:9,code,inputData:'100\n200\n300\n400\n0\n200\n200',output:i?'Жалпы: 1400.00\nОрташа: 233.33':'',submittedAt:i?now():'',score:'',teacherComment:''});
   const fields={C:['Жеті күннің шығыны теңгемен берілген.','Жалпы және орташа шығынды табамын.'],OD:['Кіріс: 7 нақты сан. Шығыс: жалпы және орташа шығын.','Мәндерді тізімге жинап, қосындыны 7-ге бөлемін.'],E:['Кодты жоспар бойынша жаздым.','Цикл жеті шығынды оқиды.'],TH:['Жалпы: 1400.00; Орташа: 200.00.','Орташа шығынды күн санына бөлу арқылы тексердім.'],INK:['Қосынды барлық шығынды біріктіреді.','Басқа күн саны болса, цикл мен бөлгіш бірге өзгереді.']};
   for(const step of (i?['C','OD','E','TH','INK']:['C','OD'])){
    tables.TaskSteps.push({attemptId:id,stepCode:step,modelVersion:5,response:fields[step].join('\n'),score:'',feedback:''});
    tables.LearningEvidence.push({id:id+':'+step,userId:p.id,attemptId:id,kind:'stage',step,detailsJson:JSON.stringify({fields:fields[step]})});
   }
   if(i)tables.LearningEvidence.push({id:id+':run',userId:p.id,attemptId:id,kind:'run',step:'TH',detailsJson:JSON.stringify({code,input:tables.TaskAttempts[i].inputData,prediction:'Жалпы: 1400.00\nОрташа: 200.00',output:tables.TaskAttempts[i].output,completed:true,comparison:'Орташа мән болжамға сәйкес келмеді.',explanation:'Бөлгішті тексеру қажет.'})});
  }
  return tables;
 }
 let tables;try{tables=JSON.parse(store.getItem('tables')||'null');}catch{}
 if(!tables||!tables.Users?.some(x=>x.id==='demo-teacher'))tables=seed();
 const user=()=>tables.Users.find(x=>x.id===(role==='teacher'?'demo-teacher':pupilId));
 const persist=()=>store.setItem('tables',JSON.stringify(tables));
 const blocked=()=>{throw Error('Бұл әрекет демода өшірулі. Нақты аккаунт қажет емес. / Это действие отключено в демо. Реальный аккаунт не требуется.');};
 const allowed=new Set(['me','teacherDashboard','teacherWorkspace','studentWorkspace','pedagogyWorkspace','correctionWorkspace','saveDiagnosticProfile','startAttempt','saveAnswer','submitAttempt','recordEvent','saveMethodStep','startTaskAttempt','saveTaskStep','saveTaskCode','submitTask','gradeTask','gradeAttempt','releaseCorrections','submitCorrection','gradeCorrection','saveLearningEvidence','startPrediction','completePrediction','startTransfer','saveTransfer','gradeTransfer','savePedagogyReview','setFinalDiagnosticOpen','getTaskTests','checkTaskOutputs']);
 const materials=window.CT_CONTENT.tasks.filter(t=>t.learningSpec?.sample).map(t=>({sourceKey:t.sourceKey,sampleInput:t.learningSpec.sample.input,expected:t.learningSpec.sample.output}));
 function coreRun(action,p={}){const core=window.CT_CORE.create(tables,user(),p,materials),result=core.run(action,p);tables=core.data;return result;}
 function review(p){if(role!=='teacher')return blocked();const attempt=tables.TaskAttempts.find(x=>x.id===p.attemptId);if(!attempt)throw Error('Демо жұмыс табылмады.');const assignment=tables.Assignments.find(x=>x.id===attempt.assignmentId);return {attempt,assignment,task:tables.Tasks.find(x=>x.id===assignment.taskId),student:tables.Users.find(x=>x.id===attempt.userId),steps:(tables.TaskSteps||[]).filter(x=>x.attemptId===attempt.id),evidence:(tables.LearningEvidence||[]).filter(x=>x.attemptId===attempt.id),corrections:(tables.Corrections||[]).filter(x=>x.sourceId===attempt.id)};}
 function mission(p){const at=tables.TaskAttempts.find(x=>x.id===p.attemptId&&x.userId===user().id&&x.status==='in_progress');if(!at)return blocked();if(!tables.TaskSteps.some(x=>x.attemptId===at.id&&x.stepCode==='TH'&&x.response))throw Error('Алдымен кодты тексеруді сақта.');const a=tables.Assignments.find(x=>x.id===at.assignmentId),key=tables.Tasks.find(x=>x.id===a.taskId).sourceKey,old=tables.LearningEvidence.find(x=>x.id===at.id+':INK'),previous=old?JSON.parse(old.detailsJson).mission:null,m=window.CT_MISSIONS.record(key,previous,p),fields=window.CT_MISSIONS.fields(key,m),evidence={id:at.id+':INK',userId:user().id,attemptId:at.id,kind:'stage',step:'INK',detailsJson:JSON.stringify({mission:m,fields})};tables.LearningEvidence=tables.LearningEvidence.filter(x=>x.id!==evidence.id);tables.LearningEvidence.push(evidence);if(window.CT_MISSIONS.results(key,m).complete)coreRun('saveTaskStep',{attemptId:at.id,stepCode:'INK',response:fields.join('\n\n')});return {evidence,mission:m,results:window.CT_MISSIONS.results(key,m)};}
 function dispatch(action,p){
  if(action==='sessionUser')return {user:user()};
  if(action==='schoolWorkspace'){const common={ped:coreRun('pedagogyWorkspace'),corrections:coreRun('correctionWorkspace'),timings:tables.DemoTimings||[]};return role==='teacher'?{...common,dashboard:coreRun('teacherDashboard'),teacherWS:coreRun('teacherWorkspace'),teacherProfile:{user:user(),preferences:tables.DemoProfiles?.teacher||{}},purgeJobs:[]}:{...common,mine:coreRun('me'),workspace:coreRun('studentWorkspace'),studentProfile:tables.DemoProfiles?.student||{avatar:'robot'}};}
  if(action==='teacherReviewWorkspace')return review(p);
  if(action==='saveConclusionMission')return mission(p);
  if(action==='recordTaskTime'){const id=user().id+':'+p.attemptId+':'+p.phase;tables.DemoTimings||=[];let r=tables.DemoTimings.find(x=>x.id===id);if(!r){r={id,userId:user().id,attemptId:p.attemptId,phase:p.phase,totalSeconds:0};tables.DemoTimings.push(r);}if(r.lastPulse!==p.pulseId){r.totalSeconds+=Math.max(0,Math.min(3600,Number(p.seconds)||0));r.lastPulse=p.pulseId;}return r;}
  if(action==='saveStudentProfile'){tables.DemoProfiles||={};return tables.DemoProfiles.student={avatar:p.avatar,goalText:String(p.goalText||'').slice(0,300),weeklyTarget:p.weeklyTarget};}
  if(action==='saveTeacherProfile'){tables.DemoProfiles||={};tables.DemoProfiles.teacher={subject:p.subject,bio:p.bio,avatar:p.avatar};user().name=String(p.name||'Демо мұғалім').slice(0,150);return {user:user(),preferences:tables.DemoProfiles.teacher};}
  if(action==='rankingWorkspace')return {rows:[],classes:tables.Classes,serverNow:now()};
  if(action==='debugLabWorkspace')return {allowed:true,work:[]};
  if(action==='olympiadWorkspace')return {allowed:false,completed:0,total:12,work:[]};
  if(allowed.has(action))return coreRun(action,p);
  return blocked();
 }
 persist();
 window.CT_FIREBASE=Object.freeze({status:()=>({customStudentLogins:true,demo:true}),invalidate(){},async call(action,p={}){const result=dispatch(action,p);persist();return copy(result);}});
})();
