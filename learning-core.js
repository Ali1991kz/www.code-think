/* CODE THINK 11: retained V9 learning behaviour; Firestore Rules enforce access. */
(() => {
'use strict';
const SCHEMAS={"LearningEvidence":["id","userId","attemptId","kind","step","detailsJson","updatedAt"],"TransferProbes":["id","userId","attemptId","sourceKey","phase","status","promptJson","answer","reason","help","createdAt","submittedAt","scoresJson","feedback","reviewedAt","correctionId"],"PedagogyReviews":["id","teacherId","key","reference","note","updatedAt"],"Users":["id","login","passwordHash","passwordSalt","mustChangePassword","name","grade","className","role","active","createdAt","lastLoginAt","accessCodeHash","codeIssuedAt","teacherAccessCode"],"Attempts":["id","userId","grade","status","startedAt","submittedAt","switches","secondsSpent","totalScore","teacherComment","attemptType","correctionsOpen"],"Answers":["attemptId","taskIndex","answer","score","feedback","updatedAt"],"DiagnosticProfiles":["userId","surveyJson","testJson","testScore","updatedAt","attemptType"],"MethodProgress":["userId","stepIndex","answer","completed","updatedAt","modelVersion"],"Classes":["id","name","grade","teacherId","active","createdAt"],"ClassStudents":["classId","userId","createdAt"],"Tasks":["id","title","grade","topic","scenario","difficulty","starterCode","testCasesJson","active","createdBy","createdAt","sourceKey"],"Assignments":["id","classId","taskId","title","dueAt","status","createdBy","createdAt"],"TaskAttempts":["id","assignmentId","userId","status","code","inputData","output","lastRunAt","submittedAt","score","teacherComment","correctionsOpen","pedagogyVersion"],"TaskSteps":["attemptId","stepCode","response","score","feedback","updatedAt","modelVersion"],"SkillScores":["userId","sourceType","sourceId","skillKey","score","updatedAt"],"Events":["attemptId","userId","type","value","createdAt"],"Corrections":["id","userId","kind","sourceId","taskIndex","answer","code","inputData","output","explanation","status","score","feedback","createdAt","reviewedAt","requestId"],"Settings":["key","value"]},ROUTES={"me":"myData_","teacherDashboard":"teacherDashboard_","teacherWorkspace":"teacherWorkspace_","studentWorkspace":"studentWorkspace_","pedagogyWorkspace":"pedagogyWorkspace_","correctionWorkspace":"correctionWorkspace_","saveDiagnosticProfile":"saveDiagnosticProfile_","startAttempt":"startAttempt_","saveAnswer":"saveAnswer_","submitAttempt":"submitAttempt_","recordEvent":"recordEvent_","saveMethodStep":"saveMethodStep_","startTaskAttempt":"startTaskAttempt_","saveTaskStep":"saveTaskStep_","saveTaskCode":"saveTaskCode_","submitTask":"submitTask_","createClass":"createClass_","createTask":"createTask_","createAssignment":"createAssignment_","enrollStudent":"enrollStudent_","updateStudent":"updateStudent_","bulkCommentAttempts":"bulkCommentAttempts_","bulkGradeAttempts":"bulkGradeAttempts_","setFinalDiagnosticOpen":"setFinalDiagnosticOpen_","gradeAttempt":"gradeAttempt_","gradeTask":"gradeTask_","teacherSolution":"teacherSolution_","getTaskTests":"taskTests_","checkTaskOutputs":"checkTaskOutputs_","releaseCorrections":"releaseCorrections_","submitCorrection":"submitCorrection_","gradeCorrection":"gradeCorrection_","saveLearningEvidence":"saveLearningEvidence_","startPrediction":"startPrediction_","completePrediction":"completePrediction_","startTransfer":"startTransfer_","saveTransfer":"saveTransfer_","gradeTransfer":"gradeTransfer_","savePedagogyReview":"savePedagogyReview_"},DEPENDENCIES={"me":["Users","Attempts","Answers","MethodProgress","SkillScores","DiagnosticProfiles","Settings"],"teacherDashboard":["Users","Attempts","Answers","SkillScores","TaskAttempts","Settings","Classes","ClassStudents"],"teacherWorkspace":["Users","Classes","Tasks","Assignments","TaskAttempts","TaskSteps","ClassStudents"],"studentWorkspace":["Users","ClassStudents","Classes","Assignments","Tasks","TaskAttempts","TaskSteps"],"pedagogyWorkspace":["Users","LearningEvidence","TransferProbes","PedagogyReviews","Classes","ClassStudents"],"correctionWorkspace":["Users","Corrections","Attempts","Answers","TaskAttempts","Assignments","Tasks","TaskSteps","Classes","ClassStudents"],"saveDiagnosticProfile":["Users","DiagnosticProfiles"],"startAttempt":["Users","Attempts","Settings"],"saveAnswer":["Users","Answers","Attempts"],"submitAttempt":["Users","Answers","Attempts"],"recordEvent":["Users","Attempts","Events"],"saveMethodStep":["Users","MethodProgress"],"startTaskAttempt":["Users","Assignments","ClassStudents","TaskAttempts","TaskSteps","Tasks","Attempts"],"saveTaskStep":["Users","TaskSteps","TaskAttempts"],"saveTaskCode":["Users","TaskAttempts"],"submitTask":["Users","TaskSteps","TaskAttempts","LearningEvidence"],"createClass":["Users","Classes","Tasks","Assignments"],"createTask":["Users","Tasks","Classes"],"createAssignment":["Users","Classes","Tasks","Assignments"],"enrollStudent":["Users","Classes","ClassStudents","Tasks","Assignments"],"updateStudent":["Users"],"bulkCommentAttempts":["Users","Attempts"],"bulkGradeAttempts":["Users","Attempts","Answers","SkillScores","Classes","ClassStudents"],"setFinalDiagnosticOpen":["Users","Settings"],"gradeAttempt":["Users","Attempts","Answers","SkillScores","Classes","ClassStudents"],"gradeTask":["Users","TaskAttempts","Assignments","TaskSteps","SkillScores"],"teacherSolution":["Users","Tasks","ClassStudents","Assignments","Attempts"],"getTaskTests":["Users","Tasks","ClassStudents","Assignments","Attempts"],"checkTaskOutputs":["Users","Tasks","ClassStudents","Assignments","Attempts"],"releaseCorrections":["Users","Attempts","TaskAttempts","Classes","ClassStudents"],"submitCorrection":["Users","Corrections","Attempts","Answers","TaskAttempts","Assignments","Tasks","TaskSteps","Classes","ClassStudents"],"gradeCorrection":["Users","Corrections","Classes","ClassStudents"],"saveLearningEvidence":["Users","LearningEvidence","TaskAttempts"],"startPrediction":["Users","LearningEvidence","TaskAttempts"],"completePrediction":["Users","LearningEvidence","TaskAttempts"],"startTransfer":["Users","TransferProbes","Corrections","Assignments","Tasks","TaskAttempts"],"saveTransfer":["Users","TransferProbes"],"gradeTransfer":["Users","TransferProbes","Classes","ClassStudents"],"savePedagogyReview":["Users","PedagogyReviews"]};
SCHEMAS.LearningEvidence.push('code','inputData','prediction','output','completed','comparison','explanation');
SCHEMAS.TaskAttempts.push('learningRunId');
DEPENDENCIES.studentWorkspace.push('TransferProbes');
function create(tables,user,payload={},materials=[]) {
const CT_PEDAGOGY=window.CT_PEDAGOGY,CT_MATERIALS=materials;
function requireStudent_(user) { if (user.role !== 'student') throw new Error('Оқушы аккаунты қажет.'); return user; }
function requireTeacher_(user) { if (user.role !== 'teacher') throw new Error('Мұғалім құқығы қажет.'); return user; }
function publicUser_(u) { return { deletedAt:u.deletedAt||'', id: u.id, login: u.login, name: u.name, grade: String(u.grade || ''), className: u.className || '', role: u.role, active: String(u.active).toLowerCase() === 'true', mustChangePassword: String(u.mustChangePassword).toLowerCase() === 'true', lastLoginAt: u.lastLoginAt || '', hasAccessCode: Boolean(u.accessCodeHash) }; }
function enrollStudentDirect_(cls, user) {
  deleteRows_('ClassStudents', x => x.userId === user.id);
  append_('ClassStudents', { classId: cls.id, userId: user.id, createdAt: new Date().toISOString() });
  updateByKey_('Users', 'id', user.id, { grade: String(cls.grade), className: cls.name });
}
function ensureClass_(teacher, className, grade) {
  let cls = rows_('Classes').find(x => x.teacherId === teacher.id && normalize_(x.name) === normalize_(className));
  if (cls && String(cls.grade) !== String(grade)) throw new Error('сынып атауы басқа деңгеймен тіркелген');
  if (!cls) {
    cls = { id: id_('CLS'), name: className, grade: String(grade), teacherId: teacher.id, active: true, createdAt: new Date().toISOString() };
    append_('Classes', cls);
  }
  syncGradeTasksToClass_(cls);
  return cls;
}
function syncGradeTasksToClass_(cls) {
  if (!cls || String(cls.active).toLowerCase() !== 'true') return 0;
  const tasks = rows_('Tasks').filter(x => String(x.grade) === String(cls.grade) && String(x.active).toLowerCase() === 'true' && (x.createdBy === 'SYSTEM' || x.createdBy === cls.teacherId));
  const assignments = rows_('Assignments');
  let created = 0;
  tasks.forEach(task => {
    if (assignments.some(x => x.classId === cls.id && x.taskId === task.id && x.status === 'published')) return;
    const item = { id: id_('ASN'), classId: cls.id, taskId: task.id, title: task.title, dueAt: '', status: 'published', createdBy: cls.teacherId, createdAt: new Date().toISOString() };
    append_('Assignments', item);
    assignments.push(item);
    created++;
  });
  return created;
}
function normalize_(v) { return String(v || '').trim().toLowerCase(); }
function relatedAttempt_(assignment,attempts,steps){
  const related=new Set(rows_('Assignments').filter(x=>x.taskId===assignment.taskId).map(x=>x.id));
  const own=attempts.filter(x=>x.userId===user.id&&related.has(x.assignmentId));
  const exact=own.find(x=>x.assignmentId===assignment.id);
  const task=rows_('Tasks').find(x=>x.id===assignment.taskId);
  const hasWork=exact&&(exact.status!=='in_progress'||exact.lastRunAt||exact.inputData||exact.output||String(exact.code||'')!==String(task?.starterCode||'')||steps.some(x=>x.attemptId===exact.id&&String(x.response||'').trim()));
  const old=own.filter(x=>x!==exact).sort((a,b)=>(['submitted','graded'].includes(b.status)?1:0)-(['submitted','graded'].includes(a.status)?1:0)||String(b.lastRunAt||b.submittedAt||'').localeCompare(String(a.lastRunAt||a.submittedAt||'')))[0];
  return hasWork?exact:(old||exact||null);
}
function savePedagogyReview_(teacher,p){
  const key=pedText_(p.key,50);
  if(!CT_PEDAGOGY.tasks.some(x=>x.sourceKey===key)&&!['diagnostic-7','diagnostic-8','pilot'].includes(key))pedError_('Өлшем табылмады.','Критерий не найден.');
  const reference=pedText_(p.reference),note=pedText_(p.note);
  if(!reference||!note)pedError_('Дереккөзді және тексеру қорытындысын толтырыңыз.','Укажите источник и результат проверки.');
  upsertComposite_('PedagogyReviews',x=>x.teacherId===teacher.id&&x.key===key,{id:teacher.id+':'+key,teacherId:teacher.id,key,reference,note,updatedAt:new Date().toISOString()});
  return {saved:true};
}
function pedError_(kk,ru){throw Error(kk+' / '+ru);}
function pedText_(value,max){return String(value==null?'':value).trim().slice(0,max||6000);}
function gradeTransfer_(teacher,p){
  const r=rows_('TransferProbes').find(x=>x.id===p.id);
  if(!r||!teacherStudents_(teacher).some(x=>x.id===r.userId)||r.status==='in_progress')pedError_('Жұмыс қолжетімсіз.','Работа недоступна.');
  const scores=Array.isArray(p.scores)?p.scores:[];
  if(scores.length!==3||scores.some(x=>!Number.isInteger(x)||x<0||x>3))pedError_('Үш өлшемге 0–3 балл қойыңыз.','Поставьте 0–3 балла по трём критериям.');
  const feedback=pedText_(p.feedback);
  if(!feedback)pedError_('Бағаны нақты дәлелмен түсіндіріңіз.','Обоснуйте оценку конкретным свидетельством.');
  updateByKey_('TransferProbes','id',r.id,{status:'reviewed',scoresJson:JSON.stringify(scores),feedback,reviewedAt:new Date().toISOString()});return {saved:true};
}
function teacherStudents_(teacher) {
  const classes = rows_('Classes').filter(x => x.teacherId === teacher.id).map(x => x.id);
  const ids = new Set(rows_('ClassStudents').filter(x => classes.includes(x.classId)).map(x => x.userId));
  return rows_('Users').filter(x => x.role === 'student' && ids.has(x.id));
}
function saveTransfer_(user,p){
  requireStudent_(user);const r=rows_('TransferProbes').find(x=>x.id===p.id&&x.userId===user.id);
  if(!r||r.status!=='in_progress')pedError_('Бекіту жұмысы қолжетімсіз.','Проверочная работа недоступна.');
  const data={answer:pedText_(p.answer,20000),reason:pedText_(p.reason),help:pedText_(p.help,1000)};
  if(p.submit){
    if(!data.answer||!data.reason||!data.help)pedError_('Шешім, түсіндіру және көмек туралы мәліметті толтыр.','Заполни решение, объяснение и сведения о помощи.');
    data.status='submitted';data.submittedAt=new Date().toISOString();
  }
  updateByKey_('TransferProbes','id',r.id,data);return {saved:true};
}
function startTransfer_(user,p){
  requireStudent_(user);const a=ownedTaskAttempt_(user,p.attemptId);
  if(!['submitted','graded'].includes(a.status))pedError_('Алдымен оқу жұмысын тапсыр.','Сначала сдай учебную работу.');
  const meta=pedMeta_(pedTask_(a));if(!meta)pedError_('Бекіту тапсырмасы әзірленбеген.','Задание переноса пока не разработано.');
  const phase=p.phase==='delayed'?'delayed':'immediate';
  const existing=rows_('TransferProbes').find(x=>x.attemptId===a.id&&x.userId===user.id&&x.phase===phase);if(existing)return existing;
  if(phase==='delayed'){
    const first=rows_('TransferProbes').find(x=>x.attemptId===a.id&&x.userId===user.id&&x.phase==='immediate'&&x.submittedAt);
    if(!first||Date.now()-new Date(first.submittedAt).getTime()<7*86400000)pedError_('Кейінгі бекіту алғашқы бекітуден 7 күннен соң ашылады.','Отсроченная проверка откроется через 7 дней после первой.');
  }
  const corrections=rows_('Corrections').filter(x=>x.userId===user.id&&x.sourceId===a.id&&x.kind==='task');
  const r={id:id_('TRN'),userId:user.id,attemptId:a.id,sourceKey:meta.sourceKey,phase,status:'in_progress',promptJson:JSON.stringify(meta.transfer[phase]),answer:'',reason:'',help:'',createdAt:new Date().toISOString(),submittedAt:'',scoresJson:'',feedback:'',reviewedAt:'',correctionId:corrections.length?corrections[corrections.length-1].id:''};
  append_('TransferProbes',r);return r;
}
function pedTask_(attempt){const a=rows_('Assignments').find(x=>x.id===attempt.assignmentId);return rows_('Tasks').find(x=>a&&x.id===a.taskId);}
function pedMeta_(task){return CT_PEDAGOGY.tasks.find(x=>x.sourceKey===task.sourceKey);}
function ownedTaskAttempt_(user, id) {
  const attempt = rows_('TaskAttempts').find(x => x.id === id && x.userId === user.id);
  if (!attempt) throw new Error('Тапсырма әрекеті табылмады.');
  return attempt;
}
function completePrediction_(user,p){
  const r=rows_('LearningEvidence').find(x=>x.id===p.id&&x.userId===user.id&&x.kind==='run');
  if(!r)pedError_('Болжам табылмады.','Прогноз не найден.');
  pedOwned_(user,r.attemptId);
  const d=JSON.parse(r.detailsJson);
  if(p.phase==='result'){
    if(d.completed)return r;
    d.output=String(p.output||'').slice(0,8000);d.completed=true;d.executedAt=new Date().toISOString();
  }else if(p.phase==='reflection'){
    if(!d.completed)pedError_('Алдымен кодты орында.','Сначала выполни код.');
    const a=pedOwned_(user,r.attemptId);if(String(d.code).trim()!==String(a.code).trim()||String(d.input)!==String(a.inputData||''))pedError_('Код немесе кіріс өзгерді. Жаңа нұсқаға болжам жазып, қайта орында.','Код или ввод изменён. Сделай прогноз и выполни новую версию.');
    d.comparison=pedText_(p.comparison);d.explanation=pedText_(p.explanation);
    if(!d.comparison||!d.explanation)pedError_('Салыстыру мен себебін жаз.','Запиши сравнение и объяснение.');
  }else pedError_('Әрекет қате.','Неверное действие.');
  updateByKey_('LearningEvidence','id',r.id,{detailsJson:JSON.stringify(d),code:d.code,inputData:d.input,prediction:d.prediction,output:d.output||'',completed:!!d.completed,comparison:d.comparison||'',explanation:d.explanation||'',updatedAt:new Date().toISOString()});
  return {saved:true};
}
function pedOwned_(user,id){requireStudent_(user);const a=ownedTaskAttempt_(user,id);if(a.status!=='in_progress')pedError_('Жұмыс тапсырылған.','Работа уже сдана.');return a;}
function startPrediction_(user,p){
  const a=pedOwned_(user,p.attemptId),prediction=pedText_(p.prediction);
  if(!prediction)pedError_('Алдымен нәтиже туралы болжам жаз.','Сначала запиши прогноз результата.');
  const code=String(p.code||'').slice(0,20000),input=String(p.input||'').slice(0,2000);
  if(!code)pedError_('Кодты жаз.','Напиши код.');
  const record={id:id_('EVD'),userId:user.id,attemptId:a.id,kind:'run',step:'TH',detailsJson:JSON.stringify({code,input,prediction,mode:pedText_(p.mode,30),hints:Math.max(0,Math.min(3,Number(p.hints)||0)),completed:false}),updatedAt:new Date().toISOString()};
  Object.assign(record,{code,inputData:input,prediction,output:'',completed:false,comparison:'',explanation:''});append_('LearningEvidence',record);return record;
}
function saveLearningEvidence_(user,p){
  const a=pedOwned_(user,p.attemptId),step=pedText_(p.step,8);
  if(!['C','OD','E','TH','INK'].includes(step))pedError_('Кезең қате.','Неверный этап.');
  const fields=Array.isArray(p.fields)?p.fields.slice(0,2).map(x=>pedText_(x)):[];
  if(fields.length!==2)pedError_('Екі жауап қажет.','Нужны два ответа.');
  const key=a.id+':'+step;
  upsertComposite_('LearningEvidence',x=>x.id===key,{id:key,userId:user.id,attemptId:a.id,kind:'stage',step,detailsJson:JSON.stringify({fields}),updatedAt:new Date().toISOString()});
  return {saved:true};
}
function gradeCorrection_(teacher,payload) {
  const row=rows_('Corrections').find(x=>x.id===payload.correctionId);
  if(!row||!teacherStudents_(teacher).some(x=>x.id===row.userId))throw new Error('Жұмыс қолжетімсіз.');
  const max=row.kind==='task'?15:3;
  updateByKey_('Corrections','id',row.id,{score:clamp_(payload.score,0,max),feedback:String(payload.feedback||'').slice(0,2000),status:'reviewed',reviewedAt:new Date().toISOString()});
  return {reviewed:true};
}
function clamp_(value, min, max) { const n = Number(value); return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min)); }
function submitCorrection_(user,payload) {
  requireStudent_(user);
  const item=correctionWorkspace_(user).items.find(x=>x.kind===payload.kind&&x.sourceId===payload.sourceId&&x.taskIndex===Number(payload.taskIndex));
  if(!item)throw new Error('Қатемен жұмыс мұғалім тарапынан әлі ашылмаған.');
  const explanation=String(payload.explanation||'').trim().slice(0,4000),answer=String(payload.answer||'').trim().slice(0,12000),code=String(payload.code||'').slice(0,20000);
  if(!explanation||!(item.kind==='task'?code.trim():answer))throw new Error('Түзетілген жауап пен қатенің себебін түсіндіріңіз.');
  const requestId=String(payload.requestId||'').slice(0,100);
  if(!requestId)throw new Error('Сұрау нөмірі жоқ.');
  const existing=rows_('Corrections').find(x=>x.userId===user.id&&x.requestId===requestId);
  if(existing)return existing;
  const row={id:id_('COR'),userId:user.id,kind:item.kind,sourceId:item.sourceId,taskIndex:item.taskIndex,answer,code,inputData:String(payload.inputData||'').slice(0,2000),output:String(payload.output||'').slice(0,8000),explanation,status:'submitted',score:'',feedback:'',createdAt:new Date().toISOString(),reviewedAt:'',requestId};
  append_('Corrections',row);return row;
}
function correctionWorkspace_(user) {
  const ids=user.role==='teacher'?new Set(teacherStudents_(user).map(x=>x.id)):new Set([user.id]);
  const history=rows_('Corrections').filter(x=>ids.has(x.userId));
  const items=[];
  rows_('Attempts').filter(a=>ids.has(a.userId)&&a.status==='graded'&&String(a.correctionsOpen)==='true').forEach(a=>{
    rows_('Answers').filter(x=>x.attemptId===a.id&&Number(x.score)<3).forEach(x=>items.push({kind:'diagnostic',sourceId:a.id,userId:a.userId,taskIndex:Number(x.taskIndex),grade:String(a.grade),attemptType:diagnosticType_(a.attemptType),original:x.answer,score:Number(x.score),feedback:x.feedback||'',teacherComment:a.teacherComment||''}));
  });
  rows_('TaskAttempts').filter(a=>ids.has(a.userId)&&a.status==='graded'&&String(a.correctionsOpen)==='true'&&Number(a.score)<15).forEach(a=>{
    const assignment=rows_('Assignments').find(x=>x.id===a.assignmentId),task=assignment&&rows_('Tasks').find(x=>x.id===assignment.taskId);
    if(task)items.push({kind:'task',sourceId:a.id,userId:a.userId,taskIndex:-1,task:publicTask_(task),original:a.code,inputData:a.inputData||'',score:Number(a.score),feedback:a.teacherComment||'',steps:rows_('TaskSteps').filter(x=>x.attemptId===a.id)});
  });
  return {items,history};
}
function publicTask_(task) {
  let tests = [];
  try { tests = JSON.parse(task.testCasesJson || '[]'); } catch (_) {}
  return { sourceKey: task.sourceKey || '', id: task.id, title: task.title, grade: String(task.grade), topic: task.topic, scenario: task.scenario, difficulty: task.difficulty, starterCode: task.starterCode, active: String(task.active).toLowerCase() === 'true' };
}
function diagnosticType_(value) { return String(value || 'baseline').toLowerCase() === 'final' ? 'final' : 'baseline'; }
function releaseCorrections_(teacher,payload) {
  const sheet=payload.kind==='diagnostic'?'Attempts':'TaskAttempts';
  const record=rows_(sheet).find(x=>x.id===payload.sourceId);
  if(!record||!teacherStudents_(teacher).some(x=>x.id===record.userId)||record.status!=='graded')throw new Error('Тек бағаланған өз оқушыңыздың жұмысын ашуға болады.');
  updateByKey_(sheet,'id',record.id,{correctionsOpen:Boolean(payload.open)});
  return {open:Boolean(payload.open)};
}
function checkTaskOutputs_(user,payload) {
  const task=authorizedTask_(user,payload), tests=materialTests_(task), m=materialFor_(task);
  const outputs=Array.isArray(payload.outputs)?payload.outputs:[];
  const numeric=!['guide-01','guide-02','guide-03','guide-04','guide-17','guide-24'].includes(m&&m.sourceKey);
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
  const numberList=s=>(String(s).match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number);
  const results=tests.map((test,i)=>{
    const actual=String(outputs[i]&&outputs[i].output||'').slice(0,12000),runtimeError=Boolean(!outputs[i]||outputs[i].error);
    let pass=norm(actual)===norm(test.expected);
    if(numeric&&!pass){const a=numberList(actual),b=numberList(test.expected);pass=b.length>0&&a.length===b.length&&a.every((x,j)=>Math.abs(x-b[j])<=Math.max(0.005,Math.abs(b[j])*1e-9));}
    const aliases={'Кәмелетке толған':['совершеннолетний','совершеннолетняя'],'Кәмелетке толмаған':['несовершеннолетний','несовершеннолетняя'],'Жұп':['четное','чётное'],'Тақ':['нечетное','нечётное'],'Сәрсенбі':['среда'],'Жексенбі':['воскресенье'],'Шешімі жоқ':['нет решений'],'Шексіз көп шешім':['бесконечно много решений']};
    if((aliases[test.expected]||[]).includes(norm(actual)))pass=true;
    return {index:i,pass:pass&&!runtimeError,input:test.input,actual,expected:pass&&!runtimeError?'':test.expected,runtimeError};
  });
  return {results,passed:results.filter(x=>x.pass).length,total:results.length,advisory:true};
}
function materialFor_(task) { return CT_MATERIALS.find(m=>m.sourceKey===task.sourceKey || m.title===task.title); }
function materialTests_(task) {
  const m=materialFor_(task);
  if(!m)return [];
  return [{input:m.sampleInput,expected:m.expected}].concat(m.extraTests||[]);
}
function authorizedTask_(user,payload) {
  const task=rows_('Tasks').find(x=>x.id===payload.taskId);
  if(!task)throw new Error('Тапсырма табылмады.');
  if(user.role==='teacher') {
    if(task.createdBy!=='SYSTEM'&&task.createdBy!==user.id)throw new Error('Тапсырма қолжетімсіз.');
  }else{
    requireStudent_(user);requireBaseline_(user);
    const classes=rows_('ClassStudents').filter(x=>x.userId===user.id).map(x=>x.classId);
    if(!rows_('Assignments').some(x=>x.taskId===task.id&&classes.includes(x.classId)&&x.status==='published'))throw new Error('Тапсырма қолжетімсіз.');
  }
  return task;
}
function requireBaseline_(user) {
  if (!rows_('Attempts').some(x => x.userId === user.id && diagnosticType_(x.attemptType) === 'baseline' && ['submitted','graded'].includes(x.status))) throw new Error('Алдымен бастапқы диагностиканы аяқтаңыз.');
}
function taskTests_(user,payload) {
  return {tests:materialTests_(authorizedTask_(user,payload)).map((x,i)=>({index:i,input:x.input}))};
}
function teacherSolution_(teacher,payload) {
  const m=materialFor_(authorizedTask_(teacher,payload));
  if(!m)throw new Error('Бұл есепке үлгі шешім қосылмаған.');
  return {code:m.sampleCode,input:m.sampleInput,note:m.note||''};
}
function gradeTask_(teacher, payload) {
  const attempt = rows_('TaskAttempts').find(x => x.id === payload.attemptId);
  if (!attempt) throw new Error('Жұмыс табылмады.');
  const assignment = rows_('Assignments').find(x => x.id === attempt.assignmentId && x.createdBy === teacher.id);
  if (!assignment) throw new Error('Бұл жұмысты бағалауға құқық жоқ.');
  const scores = payload.scores || {};
  let total = 0;
  ['C', 'OD', 'E', 'TH', 'INK'].forEach(code => {
    const score = clamp_(scores[code], 0, 3); total += score;
    const old = rows_('TaskSteps').find(x => x.attemptId === attempt.id && x.stepCode === code && String(x.modelVersion) === '5');
    upsertComposite_('TaskSteps', x => x.attemptId === attempt.id && x.stepCode === code && String(x.modelVersion) === '5', { attemptId: attempt.id, stepCode: code, modelVersion: 5, response: old ? old.response : '', score, feedback: String((payload.feedback || {})[code] || '').slice(0, 1000), updatedAt: new Date().toISOString() });
  });
  updateByKey_('TaskAttempts', 'id', attempt.id, { status: 'graded', score: total, teacherComment: String(payload.teacherComment || '').slice(0, 2000) });
  updateSkillScores_(attempt.userId, attempt.id, scores);
  return { graded: true, score: total };
}
function updateSkillScores_(userId, sourceId, stepScores) {
  const map = { understanding: ['C'], organization: ['OD'], algorithm: ['OD'], coding: ['E'], debugging: ['TH'], explanation: ['INK'] };
  Object.keys(map).forEach(skill => {
    const values = map[skill].map(k => clamp_(stepScores[k], 0, 3));
    const score = values.reduce((a, b) => a + b, 0) / values.length;
    upsertComposite_('SkillScores', x => x.userId === userId && x.sourceId === sourceId && x.skillKey === skill, { userId, sourceType: 'assignment', sourceId, skillKey: skill, score, updatedAt: new Date().toISOString() });
  });
}
function gradeAttempt_(_teacher, payload) {
  const attempt = rows_('Attempts').find(x => x.id === payload.attemptId);
  if (!attempt || !teacherStudents_(_teacher).some(x => x.id === attempt.userId)) throw new Error('Жұмыс табылмады.');
  if (attempt.status === 'in_progress') throw new Error('Алдымен оқушы жұмысты тапсыруы керек.');
  const scores = Array.isArray(payload.scores) ? payload.scores : [];
  const feedback = Array.isArray(payload.feedback) ? payload.feedback : [];
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const score = clamp_(scores[i], 0, 3);
    total += score;
    const row = rows_('Answers').find(x => x.attemptId === attempt.id && Number(x.taskIndex) === i);
    const data = { attemptId: attempt.id, taskIndex: i, answer: row ? row.answer : '', score, feedback: String(feedback[i] || '').slice(0, 1000), updatedAt: new Date().toISOString() };
    upsertComposite_('Answers', x => x.attemptId === attempt.id && Number(x.taskIndex) === i, data);
  }
  updateByKey_('Attempts', 'id', attempt.id, { status: 'graded', totalScore: total, teacherComment: String(payload.teacherComment || '').slice(0, 2000) });
  const diagnosticMap = { understanding: scores[0], organization: scores[1], algorithm: (Number(scores[2] || 0) + Number(scores[4] || 0)) / 2, coding: scores[3], debugging: scores[5], explanation: scores[6] };
  Object.keys(diagnosticMap).forEach(skill => upsertComposite_('SkillScores', x => x.userId === attempt.userId && x.sourceId === attempt.id && x.skillKey === skill, { userId: attempt.userId, sourceType: 'diagnostic', sourceId: attempt.id, skillKey: skill, score: clamp_(diagnosticMap[skill], 0, 3), updatedAt: new Date().toISOString() }));
  return { graded: true, totalScore: total };
}
function setFinalDiagnosticOpen_(_teacher, payload) {
  const open = Boolean(payload.open);
  setSetting_('finalDiagnosticOpen', open ? 'true' : 'false');
  return { open };
}
function setSetting_(key, value) { upsertComposite_('Settings', x => x.key === key, { key, value }); }
function bulkGradeAttempts_(teacher, payload) {
  const ids = Array.isArray(payload.attemptIds) ? payload.attemptIds.slice(0, 100).map(String) : [];
  const score = clamp_(payload.score, 0, 3), comment = String(payload.comment || '').trim().slice(0, 2000);
  if (!ids.length) throw new Error('Кемінде бір жұмысты таңдаңыз.');
  if (![1,2,3].includes(Number(payload.score))) throw new Error('Ортақ баллды таңдаңыз.');
  const attempts = rows_('Attempts').filter(x => ids.includes(String(x.id)) && x.status !== 'in_progress');
  attempts.forEach(attempt => gradeAttempt_(teacher, { attemptId: attempt.id, scores: Array(7).fill(score), feedback: Array(7).fill(''), teacherComment: comment }));
  return { updated: attempts.length };
}
function bulkCommentAttempts_(_teacher, payload) {
  const ids = Array.isArray(payload.attemptIds) ? payload.attemptIds.slice(0, 200).map(String) : [];
  const comment = String(payload.comment || '').trim().slice(0, 2000);
  if (!ids.length) throw new Error('Кемінде бір жұмысты таңдаңыз.');
  if (!comment) throw new Error('Ортақ пікірді жазыңыз.');
  const attempts = rows_('Attempts').filter(x => ids.includes(String(x.id)) && x.status !== 'in_progress');
  attempts.forEach(x => updateByKey_('Attempts', 'id', x.id, { teacherComment: comment }));
  return { updated: attempts.length };
}
function updateStudent_(_teacher, payload) {
  const user = rows_('Users').find(x => x.id === payload.userId && x.role === 'student');
  if (!user) throw new Error('Оқушы табылмады.');
  const changes = {};
  if (payload.name !== undefined) changes.name = String(payload.name).trim();
  if (payload.className !== undefined) changes.className = String(payload.className).trim();
  if (payload.grade !== undefined && ['7', '8'].includes(String(payload.grade))) changes.grade = String(payload.grade);
  if (payload.active !== undefined) changes.active = Boolean(payload.active);
  updateByKey_('Users', 'id', user.id, changes);
  return { updated: true };
}
function enrollStudent_(teacher, payload) {
  const cls = rows_('Classes').find(x => x.id === payload.classId && x.teacherId === teacher.id);
  const user = rows_('Users').find(x => x.id === payload.userId && x.role === 'student');
  if (!cls || !user) throw new Error('Сынып немесе оқушы табылмады.');
  deleteRows_('ClassStudents', x => x.userId === user.id);
  append_('ClassStudents', { classId: cls.id, userId: user.id, createdAt: new Date().toISOString() });
  updateByKey_('Users', 'id', user.id, { grade: cls.grade, className: cls.name });
  syncGradeTasksToClass_(cls);
  return { enrolled: true };
}
function createAssignment_(teacher, payload) {
  const cls = rows_('Classes').find(x => x.id === payload.classId && x.teacherId === teacher.id);
  const task = rows_('Tasks').find(x => x.id === payload.taskId);
  if (!cls || !task) throw new Error('Сынып немесе тапсырма табылмады.');
  const existing = rows_('Assignments').find(x => x.classId === cls.id && x.taskId === task.id && x.status === 'published');
  if (existing) {
    updateByKey_('Assignments', 'id', existing.id, { dueAt: String(payload.dueAt || existing.dueAt || '') });
    return Object.assign({}, existing, { dueAt: String(payload.dueAt || existing.dueAt || '') });
  }
  const item = { id: id_('ASN'), classId: cls.id, taskId: task.id, title: String(payload.title || task.title), dueAt: String(payload.dueAt || ''), status: 'published', createdBy: teacher.id, createdAt: new Date().toISOString() };
  append_('Assignments', item); return item;
}
function createTask_(teacher, payload) {
  const grade = String(payload.grade || '');
  if (!['7', '8'].includes(grade)) throw new Error('Сынып деңгейін таңдаңыз.');
  const task = { id: id_('TSK'), title: String(payload.title || '').trim(), grade, topic: String(payload.topic || '').trim(), scenario: String(payload.scenario || '').trim(), difficulty: String(payload.difficulty || 'орта'), starterCode: String(payload.starterCode || ''), testCasesJson: JSON.stringify(payload.testCases || []), active: true, createdBy: teacher.id, createdAt: new Date().toISOString() };
  if (!task.title || !task.scenario) throw new Error('Тақырып пен жағдаятты енгізіңіз.');
  append_('Tasks', task);
  rows_('Classes').filter(x => x.teacherId === teacher.id && String(x.grade) === grade && String(x.active).toLowerCase() === 'true').forEach(syncGradeTasksToClass_);
  return publicTask_(task);
}
function createClass_(teacher, payload) {
  const name = String(payload.name || '').trim();
  const grade = String(payload.grade || '');
  if (!name || !['7', '8'].includes(grade)) throw new Error('Сынып атауы мен деңгейін дұрыс енгізіңіз.');
  const item = { id: id_('CLS'), name, grade, teacherId: teacher.id, active: true, createdAt: new Date().toISOString() };
  append_('Classes', item);
  syncGradeTasksToClass_(item);
  return item;
}
function submitTask_(user, payload) {
  requireStudent_(user);
  const attempt = ownedTaskAttempt_(user, payload.attemptId);
  if (attempt.status !== 'in_progress') throw new Error('Бұл тапсырма бұрын тапсырылған.');
  const steps = rows_('TaskSteps').filter(x => x.attemptId === attempt.id && String(x.modelVersion) === '5' && String(x.response || '').trim());
  const learningRunId=validatePedagogy_(attempt);
  const completed = new Set(steps.map(x => x.stepCode));
  const missing = ['C','OD','E','TH','INK'].filter(code => !completed.has(code));
  if (missing.length) throw new Error('Барлық 5 кезеңді толық орындаңыз.');
  if (!String(attempt.code || '').trim()) throw new Error('Python кодын жазып, сақтаңыз.');
  updateByKey_('TaskAttempts', 'id', attempt.id, { status: 'submitted', submittedAt: new Date().toISOString(),...(learningRunId?{learningRunId}:{}) });
  return { submitted: true };
}
function validatePedagogy_(attempt){
  if(String(attempt.pedagogyVersion)!=='9')return;
  const evidence=rows_('LearningEvidence').filter(x=>x.attemptId===attempt.id);
  ['C','OD','E','TH','INK'].forEach(step=>{
    const r=evidence.find(x=>x.kind==='stage'&&x.step===step),d=r?JSON.parse(r.detailsJson):{};
    if(!d.fields||d.fields.length!==2||d.fields.some(x=>!String(x).trim()))pedError_('Әр кезеңдегі екі сұраққа жауап бер.','Ответь на два вопроса каждого этапа.');
  });
  const run=evidence.filter(x=>x.kind==='run').find(r=>{const d=JSON.parse(r.detailsJson);return d.completed&&String(d.code).trim()===String(attempt.code).trim()&&d.input===String(attempt.inputData||'')&&String(d.comparison||'').trim()&&String(d.explanation||'').trim();});
  if(!run)pedError_('Соңғы код үшін болжам, орындау, салыстыру және түсіндіруді аяқта.','Для последнего кода заверши прогноз, выполнение, сравнение и объяснение.');
  const d=JSON.parse(run.detailsJson);updateByKey_('LearningEvidence','id',run.id,{code:String(attempt.code),inputData:String(attempt.inputData||''),prediction:d.prediction,output:d.output||'',completed:true,comparison:d.comparison,explanation:d.explanation,updatedAt:new Date().toISOString()});return run.id;
}
function saveTaskCode_(user, payload) {
  requireStudent_(user);
  const attempt = ownedTaskAttempt_(user, payload.attemptId);
  if (attempt.status !== 'in_progress') throw new Error('Бұл тапсырма тапсырылып қойған.');
  updateByKey_('TaskAttempts', 'id', attempt.id, { code: String(payload.code || '').slice(0, 20000), inputData: String(payload.inputData || '').slice(0, 2000), output: String(payload.output || '').slice(0, 8000), lastRunAt: new Date().toISOString() });
  return { saved: true };
}
function saveTaskStep_(user, payload) {
  requireStudent_(user);
  const attempt = ownedTaskAttempt_(user, payload.attemptId);
  if (attempt.status !== 'in_progress') throw new Error('Бұл тапсырма тапсырылып қойған.');
  const allowed = ['C', 'OD', 'E', 'TH', 'INK'];
  const stepCode = String(payload.stepCode || '').toUpperCase();
  if (!allowed.includes(stepCode)) throw new Error('CODE THINK қадамы дұрыс емес.');
  const position = allowed.indexOf(stepCode);
  if (position > 0) {
    const completed = rows_('TaskSteps').filter(x => x.attemptId === attempt.id && String(x.modelVersion) === '5' && String(x.response || '').trim());
    for (let previous = 0; previous < position; previous++) {
      if (!completed.some(x => x.stepCode === allowed[previous])) throw new Error('Алдыңғы кезеңді толық орындаңыз.');
    }
  }
  upsertComposite_('TaskSteps', x => x.attemptId === attempt.id && x.stepCode === stepCode && String(x.modelVersion) === '5', { attemptId: attempt.id, stepCode, modelVersion: 5, response: String(payload.response || '').slice(0, 12000), score: '', feedback: '', updatedAt: new Date().toISOString() });
  return { saved: true };
}
function startTaskAttempt_(user, payload) {
  requireStudent_(user);
  requireBaseline_(user);
  const assignment = rows_('Assignments').find(x => x.id === payload.assignmentId && x.status === 'published');
  if (!assignment) throw new Error('Тапсырма табылмады.');
  const enrolled = rows_('ClassStudents').some(x => x.userId === user.id && x.classId === assignment.classId);
  if (!enrolled) throw new Error('Бұл тапсырма сіздің сыныбыңызға берілмеген.');
  const existing=relatedAttempt_(assignment,rows_('TaskAttempts'),rows_('TaskSteps'));
  if (existing) { existing.steps = rows_('TaskSteps').filter(x => x.attemptId === existing.id); return existing; }
  const task = rows_('Tasks').find(x => x.id === assignment.taskId);
  if (!task) throw new Error('Тапсырма мазмұны табылмады.');
  const attempt = { pedagogyVersion: 9, id: id_('RUN'), assignmentId: assignment.id, userId: user.id, status: 'in_progress', code: task.starterCode || '', inputData: '', output: '', lastRunAt: '', submittedAt: '', score: '', teacherComment: '' };
  append_('TaskAttempts', attempt); attempt.steps = []; return attempt;
}
function saveMethodStep_(user, payload) {
  requireStudent_(user);
  const index = Number(payload.stepIndex);
  if (!Number.isInteger(index) || index < 0 || index > 4) throw new Error('Кезең нөмірі дұрыс емес.');
  const answer = String(payload.answer || '').slice(0, 12000);
  if (index > 0) {
    const completed = rows_('MethodProgress').filter(x => x.userId === user.id && String(x.modelVersion) === '5' && String(x.answer || '').trim());
    for (let previous = 0; previous < index; previous++) {
      if (!completed.some(x => Number(x.stepIndex) === previous)) throw new Error('Алдыңғы кезеңді толық орындаңыз.');
    }
  }
  upsertComposite_('MethodProgress', x => x.userId === user.id && Number(x.stepIndex) === index && String(x.modelVersion) === '5', { userId: user.id, stepIndex: index, modelVersion: 5, answer, completed: Boolean(answer.trim()), updatedAt: new Date().toISOString() });
  return { saved: true, stepIndex: index };
}
function recordEvent_(user, payload) {
  requireStudent_(user);
  const attempt = rows_('Attempts').find(x => x.id === String(payload.attemptId || '') && x.userId === user.id);
  if (!attempt) throw new Error('Диагностика табылмады.');
  const type = ['visibility_hidden', 'fullscreen_exit', 'copy_attempt'].includes(payload.type) ? payload.type : 'other';
  append_('Events', { attemptId: attempt.id, userId: user.id, type, value: String(payload.value || '').slice(0, 200), createdAt: new Date().toISOString() });
  return { recorded: true };
}
function submitAttempt_(user, payload) {
  requireStudent_(user);
  const attempt = ownedOpenAttempt_(user, payload.attemptId);
  const answerCount = rows_('Answers').filter(x => x.attemptId === attempt.id && String(x.answer || '').trim()).length;
  if (answerCount !== 7) throw new Error('Диагностиканың барлық 7 тапсырмасын орындаңыз.');
  updateByKey_('Attempts', 'id', attempt.id, { status: 'submitted', submittedAt: new Date().toISOString(), secondsSpent: clamp_(payload.secondsSpent, 0, 7200), switches: clamp_(payload.switches, 0, 999) });
  return { submitted: true, answerCount };
}
function ownedOpenAttempt_(user, id) {
  const attempt = rows_('Attempts').find(x => x.id === id && x.userId === user.id);
  if (!attempt) throw new Error('Диагностика табылмады.');
  if (attempt.status !== 'in_progress') throw new Error('Бұл диагностика тапсырылып қойған.');
  return attempt;
}
function saveAnswer_(user, payload) {
  requireStudent_(user);
  const attempt = ownedOpenAttempt_(user, payload.attemptId);
  const index = Number(payload.taskIndex);
  if (!Number.isInteger(index) || index < 0 || index > 6) throw new Error('Тапсырма нөмірі дұрыс емес.');
  const answer = String(payload.answer || '').slice(0, 12000);
  upsertComposite_('Answers', x => x.attemptId === attempt.id && Number(x.taskIndex) === index, { attemptId: attempt.id, taskIndex: index, answer, score: '', feedback: '', updatedAt: new Date().toISOString() });
  return { saved: true, taskIndex: index };
}
function startAttempt_(user, payload) {
  requireStudent_(user);
  const attemptType = diagnosticType_(payload.attemptType);
  if (attemptType === 'final') {
    if (!settingBool_('finalDiagnosticOpen')) throw new Error('Қорытынды диагностика мұғалім тарапынан әлі ашылмаған.');
    const baseline = rows_('Attempts').find(x => x.userId === user.id && diagnosticType_(x.attemptType) === 'baseline' && ['submitted','graded'].includes(String(x.status)));
    if (!baseline) throw new Error('Алдымен бастапқы диагностиканы аяқтаңыз.');
  }
  const previous = rows_('Attempts').filter(x => x.userId === user.id && diagnosticType_(x.attemptType) === attemptType).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0];
  if (previous) return previous;
  const attempt = { id: id_('ATT'), userId: user.id, grade: user.grade, attemptType, status: 'in_progress', startedAt: new Date().toISOString(), submittedAt: '', switches: 0, secondsSpent: 0, totalScore: '', teacherComment: '' };
  append_('Attempts', attempt);
  return attempt;
}
function settingBool_(key) { const row = rows_('Settings').find(x => x.key === key); return Boolean(row && String(row.value).toLowerCase() === 'true'); }
function saveDiagnosticProfile_(user, payload) {
  requireStudent_(user);
  const attemptType = diagnosticType_(payload.attemptType);
  const survey = Array.isArray(payload.survey) ? payload.survey.slice(0, 3) : [];
  const test = Array.isArray(payload.test) ? payload.test.slice(0, 3) : [];
  if (survey.length !== 3 || survey.some(x => ![1,2,3].includes(Number(x)))) throw new Error('Сауалнама толық толтырылмаған.');
  if (test.length !== 3 || test.some(x => ![0,1,2].includes(Number(x)))) throw new Error('Тест жауаптары толық емес.');
  const keys = attemptType==='final'?{ '7': [2, 0, 1], '8': [1, 2, 0] }:{ '7': [1, 1, 0], '8': [0, 1, 1] };
  const score = test.reduce((sum, value, index) => sum + (Number(value) === keys[String(user.grade)][index] ? 1 : 0), 0);
  upsertComposite_('DiagnosticProfiles', x => x.userId === user.id && diagnosticType_(x.attemptType) === attemptType, { userId: user.id, attemptType, surveyJson: JSON.stringify(survey), testJson: JSON.stringify(test), testScore: score, updatedAt: new Date().toISOString() });
  return { saved: true, testScore: score };
}
function pedagogyWorkspace_(user){
  const ids=user.role==='teacher'?teacherStudents_(user).map(x=>x.id):[user.id];
  return {evidence:rows_('LearningEvidence').filter(x=>ids.includes(x.userId)),
    probes:rows_('TransferProbes').filter(x=>ids.includes(x.userId)),
    reviews:user.role==='teacher'?rows_('PedagogyReviews').filter(x=>x.teacherId===user.id):[]};
}
function studentWorkspace_(user) {
  requireStudent_(user);
  const classIds = rows_('ClassStudents').filter(x => x.userId === user.id).map(x => x.classId);
  const classes = rows_('Classes').filter(x => classIds.includes(x.id) && String(x.active).toLowerCase() === 'true');
  classes.forEach(syncGradeTasksToClass_);
  const assignments = rows_('Assignments').filter(x => classIds.includes(x.classId) && x.status === 'published');
  const tasks = rows_('Tasks');
  const attempts = rows_('TaskAttempts').filter(x => x.userId === user.id);
  const steps = rows_('TaskSteps');
  assignments.forEach(a => {
    const task = tasks.find(t => t.id === a.taskId);
    a.task = task ? publicTask_(task) : null;
    const attempt=relatedAttempt_(a,attempts,steps);
    if (attempt) attempt.steps = steps.filter(s => s.attemptId === attempt.id && (String(s.modelVersion) === '5' || ['C','OD','E','TH','INK'].includes(String(s.stepCode))));
    a.attempt = attempt;
  });
  const visible=new Set(assignments.map(x=>x.attempt?.id).filter(Boolean));
  const history=attempts.filter(x=>!visible.has(x.id)).map(at=>{const a=rows_('Assignments').find(x=>x.id===at.assignmentId);return a?{...a,task:tasks.find(x=>x.id===a.taskId),attempt:{...at,steps:steps.filter(x=>x.attemptId===at.id)},archived:true}:null;}).filter(x=>x&&x.task);
  return { classes, assignments, history, transferProbes:rows_('TransferProbes').filter(x=>x.userId===user.id) };
}
function teacherWorkspace_(teacher) {
  syncStudentsToClasses_(teacher);
  const classes = rows_('Classes').filter(x => x.teacherId === teacher.id);
  classes.forEach(syncGradeTasksToClass_);
  const tasks = rows_('Tasks').filter(x => x.createdBy === teacher.id || x.createdBy === 'SYSTEM');
  const assignments = rows_('Assignments').filter(x => x.createdBy === teacher.id);
  const taskAttempts = rows_('TaskAttempts');
  const users = rows_('Users');
  const steps = rows_('TaskSteps');
  assignments.forEach(a => {
    a.task = tasks.find(t => t.id === a.taskId) || null;
    a.classInfo = classes.find(c => c.id === a.classId) || null;
    a.attempts = taskAttempts.filter(x => x.assignmentId === a.id).map(x => {
      x.student = publicUser_(users.find(u => u.id === x.userId) || {});
      x.steps = steps.filter(s => s.attemptId === x.id);
      return x;
    });
  });
  const enrollments = rows_('ClassStudents');
  classes.forEach(c => c.studentIds = enrollments.filter(e => e.classId === c.id && !users.find(u=>u.id===e.userId)?.deletedAt).map(e => e.userId));
  return { classes, tasks: tasks.map(publicTask_), assignments };
}
function syncStudentsToClasses_(teacher) {
  const enrolled = rows_('ClassStudents');
  rows_('Users').filter(x => x.role === 'student' && String(x.className || '').trim()).forEach(user => {
    if (enrolled.some(x => x.userId === user.id)) return;
    const cls = ensureClass_(teacher, user.className, String(user.grade));
    enrollStudentDirect_(cls, user);
    enrolled.push({ classId: cls.id, userId: user.id });
  });
}
function teacherDashboard_(teacher) {
  const ownIds = new Set(teacherStudents_(teacher).map(x => x.id));
  const allVisibleUsers = rows_('Users').filter(x => ownIds.has(x.id)).map(u => Object.assign(publicUser_(u), {accessCode: u.teacherAccessCode || ''}));
  const archivedUsers=allVisibleUsers.filter(x=>x.deletedAt),users=allVisibleUsers.filter(x=>!x.deletedAt);
  const sessions = rows_('Sessions');
  users.forEach(user => { const own = sessions.filter(x => x.userId === user.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))); user.lastLoginAt = user.lastLoginAt || (own[0] ? own[0].createdAt : ''); });
  const attempts = rows_('Attempts').filter(x => ownIds.has(x.userId)).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  const allUsers = rows_('Users');
  const answers = rows_('Answers');
  attempts.forEach(a => {
    const u = allUsers.find(x => x.id === a.userId);
    a.student = u ? publicUser_(u) : { name: 'Өшірілген аккаунт', grade: a.grade };
    a.answers = answers.filter(x => x.attemptId === a.id).sort((x, y) => Number(x.taskIndex) - Number(y.taskIndex));
  });
  const skillScores = rows_('SkillScores').filter(x => ownIds.has(x.userId));
  const taskAttempts = rows_('TaskAttempts').filter(x => ownIds.has(x.userId));
  return { users, archivedUsers, attempts, skillScores, taskAttempts, finalDiagnosticOpen: settingBool_('finalDiagnosticOpen') };
}
function myData_(user) {
  const attempts = rows_('Attempts').filter(x => x.userId === user.id).sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  const answers = rows_('Answers');
  attempts.forEach(a => a.answers = answers.filter(x => x.attemptId === a.id).sort((x, y) => Number(x.taskIndex) - Number(y.taskIndex)));
  const method = rows_('MethodProgress').filter(x => x.userId === user.id).sort((a, b) => Number(a.stepIndex) - Number(b.stepIndex));
  const skills = rows_('SkillScores').filter(x => x.userId === user.id);
  const diagnosticProfiles = rows_('DiagnosticProfiles').filter(x => x.userId === user.id);
  const publicUser = publicUser_(user), ownSessions = rows_('Sessions').filter(x => x.userId === user.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  publicUser.lastLoginAt = publicUser.lastLoginAt || (ownSessions[0] ? ownSessions[0].createdAt : '');
  return { user: publicUser, attempts, method, skills, diagnosticProfiles, finalDiagnosticOpen: settingBool_('finalDiagnosticOpen') };
}
const copy=x=>JSON.parse(JSON.stringify(x));
const data=copy(tables),dirty=new Set();
function rows_(n){return copy(data[n]||[]);}
function append_(n,obj){(data[n]||=[]).push({...copy(obj),__localKey:crypto.randomUUID()});dirty.add(n);}
function updateByKey_(n,key,value,changes){const r=data[n]?.find(x=>String(x[key])===String(value));if(!r)throw Error('Жазба табылмады. / Запись не найдена.');Object.assign(r,copy(changes));dirty.add(n);}
function upsertComposite_(n,p,obj){const r=data[n]?.find(p);if(r){Object.assign(r,copy(obj));dirty.add(n);}else append_(n,obj);}
function deleteRows_(n,p){const r=(data[n]||[]).filter(x=>!p(x));if(r.length!==(data[n]||[]).length){data[n]=r;dirty.add(n);}}
function id_(prefix){
 if(prefix==='ATT')return user.id+'_'+(payload.attemptType==='final'?'final':'baseline');
 if(prefix==='RUN')return user.id+'_'+payload.assignmentId;
 if(prefix==='TRN')return payload.attemptId+'_'+(payload.phase==='delayed'?'delayed':'immediate');
 if(prefix==='COR')return user.id+'_'+String(payload.requestId).replace(/[^a-zA-Z0-9_-]/g,'');
 return prefix+'-'+crypto.randomUUID();
}
// Assignment generation belongs to the teacher; a pupil only reads published work.
const originalSync=syncGradeTasksToClass_;
syncGradeTasksToClass_=cls=>user.role==='teacher'?originalSync(cls):0;
const fns={
 me:myData_,teacherDashboard:teacherDashboard_,teacherWorkspace:teacherWorkspace_,studentWorkspace:studentWorkspace_,pedagogyWorkspace:pedagogyWorkspace_,correctionWorkspace:correctionWorkspace_,
 saveDiagnosticProfile:saveDiagnosticProfile_,startAttempt:startAttempt_,saveAnswer:saveAnswer_,submitAttempt:submitAttempt_,recordEvent:recordEvent_,saveMethodStep:saveMethodStep_,startTaskAttempt:startTaskAttempt_,saveTaskStep:saveTaskStep_,saveTaskCode:saveTaskCode_,submitTask:submitTask_,createClass:createClass_,createTask:createTask_,createAssignment:createAssignment_,enrollStudent:enrollStudent_,updateStudent:updateStudent_,bulkCommentAttempts:bulkCommentAttempts_,bulkGradeAttempts:bulkGradeAttempts_,setFinalDiagnosticOpen:setFinalDiagnosticOpen_,gradeAttempt:gradeAttempt_,gradeTask:gradeTask_,teacherSolution:teacherSolution_,getTaskTests:taskTests_,checkTaskOutputs:checkTaskOutputs_,releaseCorrections:releaseCorrections_,submitCorrection:submitCorrection_,gradeCorrection:gradeCorrection_,saveLearningEvidence:saveLearningEvidence_,startPrediction:startPrediction_,completePrediction:completePrediction_,startTransfer:startTransfer_,saveTransfer:saveTransfer_,gradeTransfer:gradeTransfer_,savePedagogyReview:savePedagogyReview_
};
const teacherActions=new Set(['teacherDashboard','teacherWorkspace','createClass','createTask','createAssignment','enrollStudent','updateStudent','bulkCommentAttempts','bulkGradeAttempts','setFinalDiagnosticOpen','gradeAttempt','gradeTask','teacherSolution','releaseCorrections','gradeCorrection','gradeTransfer','savePedagogyReview']);
return {data,dirty,run(action,p=payload){if(!fns[action])throw Error('Әрекет табылмады. / Действие не найдено.');if(teacherActions.has(action))requireTeacher_(user);return fns[action](user,p);},enroll(teacher,student){const cls=ensureClass_(teacher,student.className,student.grade);append_('Users',student);enrollStudentDirect_(cls,student);},publicUser:publicUser_};

}
window.CT_CORE={create,schemas:SCHEMAS,dependencies:DEPENDENCIES,taskSeed:[{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-01","title":"Қолданушының аты-жөнін енгізіп, амандасу","grade":"7","topic":"Енгізу және шығару","scenario":"Қолданушының аты-жөнін енгізіп, экранға «Сәлем» сөзімен бірге шығарыңыз. Дескриптор: аты-жөнін енгізеді; экранға амандасу мәтінін шығарады.","difficulty":"жеңіл","starterCode":"name = input(\"Аты-жөніңізді енгізіңіз: \")\n\n# амандасу мәтінін шығар","id":"guide-01"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-02","title":"Кәмелетке толғанын тексеру","grade":"7","topic":"Шартты оператор","scenario":"Қолданушының жасын енгізіп, оның кәмелетке толғанын немесе толмағанын анықтайтын программа жазыңыз.","difficulty":"орта","starterCode":"age = int(input(\"Жасыңызды енгізіңіз: \"))\n\n# шартты жаз","id":"guide-02"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-03","title":"Апта күнін нөмірі бойынша шығару","grade":"7","topic":"Шарт және тізім","scenario":"1-ден 7-ге дейінгі күн нөмірі енгізіледі. Сәйкес апта күнін шығарыңыз. Егер басқа сан енгізілсе, қате туралы хабар көрсетіңіз.","difficulty":"орта","starterCode":"day = int(input(\"Күн нөмірін енгізіңіз (1-7): \"))\ndays = [\"Дүйсенбі\", \"Сейсенбі\", \"Сәрсенбі\", \"Бейсенбі\", \"Жұма\", \"Сенбі\", \"Жексенбі\"]\n\n# нәтижені шығар","id":"guide-03"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-04","title":"Сөзді керісінше шығару","grade":"7","topic":"Мәтіндік жолдар","scenario":"Сөз енгізіп, оны кері бағытта шығаратын программа жазыңыз.","difficulty":"орта","starterCode":"word = input(\"Сөз енгізіңіз: \")\n\n# сөзді кері шығар","id":"guide-04"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-05","title":"Апталық шығынды есептеу","grade":"8","topic":"Тізім және цикл","scenario":"Оқушы 7 күндік шығындарын енгізеді. Жалпы шығын мен орташа күндік шығынды есептеп шығарыңыз.","difficulty":"орта","starterCode":"expenses = []\n\n# 7 күндік шығынды енгізіп, қорытындысын есепте","id":"guide-05"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-06","title":"Электр энергиясына төлем","grade":"7","topic":"Арифметикалық амалдар","scenario":"Тұтынған электр энергиясы киловатт-сағатпен енгізіледі. 1 кВт·сағ бағасы 20 теңге болса, жалпы төлемді есептеңіз.","difficulty":"жеңіл","starterCode":"kwh = float(input(\"Тұтынған энергия (кВт·сағ): \"))\nprice = 20\n\n# төлемді есепте","id":"guide-06"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-07","title":"Маршрут уақыты","grade":"7","topic":"Формула және арифметика","scenario":"Қашықтық (км) және жылдамдық (км/сағ) берілгенде, жолға кететін уақытты сағатпен табыңыз. Жылдамдық нөл болмауы тиіс.","difficulty":"орта","starterCode":"distance = float(input(\"Қашықтық (км): \"))\nspeed = float(input(\"Жылдамдық (км/сағ): \"))\n\n# уақытты есепте","id":"guide-07"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-08","title":"Дене салмағы индексі (BMI)","grade":"7","topic":"Формула және дөңгелектеу","scenario":"Салмақты килограммен және бойды метрмен енгізіп, BMI = салмақ / бой² формуласы бойынша дене салмағы индексін есептеңіз. Нәтижені екі таңбаға дейін дөңгелектеңіз.","difficulty":"орта","starterCode":"weight = float(input(\"Салмақ (кг): \"))\nheight = float(input(\"Бой (м): \"))\n\n# BMI есепте","id":"guide-08"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-09","title":"Жемістер бағасы","grade":"7","topic":"Арифметикалық амалдар","scenario":"1 кг алманың бағасы мен алынатын алманың салмағын енгізіп, жалпы төлемді есептеңіз.","difficulty":"жеңіл","starterCode":"price = float(input(\"1 кг алма бағасы: \"))\nkg = float(input(\"Салмағы (кг): \"))\n\n# жалпы төлемді шығар","id":"guide-09"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-10","title":"Сыныптың орташа жасы","grade":"8","topic":"Тізім және цикл","scenario":"10 оқушының жасын енгізіп, сыныптың орташа жасын есептеңіз.","difficulty":"орта","starterCode":"ages = []\n\n# 10 жасты енгізіп, орташа мәнін тап","id":"guide-10"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-11","title":"Күндізгі температура","grade":"8","topic":"Тізім, min және max","scenario":"5 күннің температурасын енгізіп, ең жоғары және ең төмен температураны шығарыңыз.","difficulty":"орта","starterCode":"temperatures = []\n\n# 5 мәнді енгізіп, ең жылы және ең суық күн мәндерін тап","id":"guide-11"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-12","title":"Теңге айырбастау","grade":"7","topic":"Формула және дөңгелектеу","scenario":"Теңгемен берілген соманы долларға және еуроға айналдырыңыз. Берілген бағамдар: 1 доллар = 470 теңге, 1 еуро = 500 теңге. Нәтижені екі таңбаға дейін дөңгелектеңіз.","difficulty":"жеңіл","starterCode":"money = float(input(\"Сома (тг): \"))\n\n# доллар мен еуродағы мәндерді есепте","id":"guide-12"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-13","title":"Қадам саны","grade":"7","topic":"Өлшем бірліктерін түрлендіру","scenario":"Оқушының бір күнде жүрген қадам саны беріледі. Бір қадамның орташа ұзындығы 0,7 метр болса, жүрген жолды километрмен есептеңіз және екі таңбаға дейін дөңгелектеңіз.","difficulty":"жеңіл","starterCode":"steps = int(input(\"Қадам саны: \"))\nstep_length = 0.7\n\n# жүрген жолды километрмен тап","id":"guide-13"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-14","title":"Кітап оқу уақыты","grade":"7","topic":"Бүтін бөлу","scenario":"Кітаптың жалпы бет саны және оқушының күніне оқитын бет саны енгізіледі. Кітапты толық аяқтауға неше күн қажет екенін есептеңіз. Соңғы толық емес күн де бір күн болып саналады.","difficulty":"орта","starterCode":"pages = int(input(\"Бет саны: \"))\nper_day = int(input(\"Күніне неше бет: \"))\n\n# қажетті күн санын тап","id":"guide-14"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-15","title":"Ұялы байланыс төлемі","grade":"7","topic":"Арифметикалық амалдар","scenario":"Әр қоңырау 5 теңге, әр SMS 2 теңге тұрады. Қоңыраулар мен SMS санын енгізіп, жалпы төлемді есептеңіз.","difficulty":"жеңіл","starterCode":"calls = int(input(\"Қоңыраулар саны: \"))\nsms = int(input(\"SMS саны: \"))\n\n# жалпы төлемді есепте","id":"guide-15"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-16","title":"Үш санның қосындысы мен көбейтіндісі","grade":"7","topic":"Арифметикалық амалдар","scenario":"Үш бүтін сан енгізіп, олардың қосындысы мен көбейтіндісін шығарыңыз.","difficulty":"жеңіл","starterCode":"a = int(input(\"1-сан: \"))\nb = int(input(\"2-сан: \"))\nc = int(input(\"3-сан: \"))\n\n# қосынды мен көбейтіндіні шығар","id":"guide-16"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-17","title":"Санның тақ немесе жұп екенін анықтау","grade":"7","topic":"Шартты оператор","scenario":"Бүтін сан енгізіп, оның жұп немесе тақ екенін анықтаңыз.","difficulty":"орта","starterCode":"number = int(input(\"Сан енгізіңіз: \"))\n\n# қалдықты пайдаланып шарт құр","id":"guide-17"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-18","title":"Цельсийден Фаренгейтке ауыстыру","grade":"7","topic":"Формула және арифметика","scenario":"Цельсий шкаласындағы температураны енгізіп, F = C × 9/5 + 32 формуласы бойынша Фаренгейтке ауыстырыңыз.","difficulty":"жеңіл","starterCode":"celsius = float(input(\"Температура (Цельсий): \"))\n\n# Фаренгейт мәнін есепте","id":"guide-18"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-19","title":"Екі санның қосындысы","grade":"7","topic":"Енгізу және шығару","scenario":"Екі бүтін сан енгізіп, олардың қосындысын экранға шығарыңыз.","difficulty":"жеңіл","starterCode":"a = int(input(\"Бірінші сан: \"))\nb = int(input(\"Екінші сан: \"))\n\n# қосындыны шығар","id":"guide-19"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-20","title":"1-ден n-ге дейінгі тақ сандар","grade":"8","topic":"for циклі","scenario":"n бүтін саны енгізіледі. 1-ден n-ге дейінгі барлық тақ сандарды экранға шығарыңыз.","difficulty":"орта","starterCode":"n = int(input(\"Шектеуді енгізіңіз: \"))\n\n# циклді жаз","id":"guide-20"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-21","title":"Жұп сандардың қосындысы","grade":"8","topic":"for циклі және жинақтау","scenario":"n бүтін саны енгізіледі. 1-ден n-ге дейінгі барлық жұп сандардың қосындысын табыңыз.","difficulty":"орта","starterCode":"n = int(input(\"Шектеуді енгізіңіз: \"))\nsum_even = 0\n\n# цикл арқылы қосындыны есепте","id":"guide-21"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-22","title":"Мәтіндегі берілген әріптерді санау","grade":"8","topic":"Мәтін және цикл","scenario":"Мәтін енгізіп, аәеёиіоуұүыэюяө жиынына кіретін таңбалардың барлық кездесуін санаңыз. Бас және кіші әріптерді бірдей өңдеңіз.","difficulty":"орта","starterCode":"text = input(\"Мәтін енгізіңіз: \")\nvowels = \"аәеёиіоуұүыэюяө\"\ncount = 0\n\n# әріптерді циклмен тексер","id":"guide-22"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-23","title":"ax + b = 0 теңдеуін шешу","grade":"7","topic":"Шартты оператор және формула","scenario":"a және b нақты сандары берілген. ax + b = 0 теңдеуінің шешімін табыңыз. a = 0 жағдайын жеке тексеріңіз.","difficulty":"күрделі","starterCode":"a = float(input(\"a: \"))\nb = float(input(\"b: \"))\n\n# теңдеуді шеш","id":"guide-23"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-24","title":"Оқушы нәтижесін бағалау","grade":"7","topic":"Көп тармақты шарт","scenario":"0-ден 100-ге дейінгі балл енгізіледі. 90 және одан жоғары болса «5», 75–89 болса «4», 50–74 болса «3», қалған жағдайда «2» бағасын шығарыңыз.","difficulty":"күрделі","starterCode":"score = int(input(\"Балл (0-100): \"))\n\n# if, elif, else арқылы бағала","id":"guide-24"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-25","title":"Дүкендегі жеңілдік","grade":"7","topic":"Пайыздық есептеу","scenario":"Тауардың бастапқы бағасы мен жеңілдік пайызы берілген. Соңғы бағаны есептеп, нәтижені екі ондық таңбамен шығарыңыз.","difficulty":"орта","starterCode":"price = float(input(\"Бастапқы баға (тг): \"))\ndiscount = float(input(\"Жеңілдік пайызы (%): \"))\n\n# соңғы бағаны есепте","id":"guide-25"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-26","title":"Отбасылық интернет-тариф","grade":"8","topic":"Көп тармақты шарт","scenario":"Айлық интернет көлемі беріледі. 0–20 ГБ үшін 3500 теңге, 20 ГБ-тан көп және 50 ГБ-қа дейін 5000 теңге. 50 ГБ-тан асқанда 5000 теңгеге әр артық гигабайт үшін 100 теңге қосылады. Айлық төлемді есептеңіз.","difficulty":"күрделі","starterCode":"gb = float(input(\"Пайдаланылған интернет (ГБ): \"))\n\n# тариф шарттары бойынша төлемді есепте","id":"guide-26"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-27","title":"Автобустың жанармай шығыны","grade":"8","topic":"Формула және шарт","scenario":"Автобус жүретін қашықтық, 100 км-ге жұмсайтын жанармай мөлшері және 1 литр жанармай бағасы енгізіледі. Қажетті жанармай көлемі мен жалпы шығынды есептеңіз. Егер қашықтық 300 км-ден асса, қауіпсіздік үшін «Үзіліс жоспарлаңыз» деген хабар шығарыңыз.","difficulty":"күрделі","starterCode":"distance = float(input(\"Қашықтық (км): \"))\nconsumption = float(input(\"100 км-ге шығын (л): \"))\nprice = float(input(\"1 литр бағасы (тг): \"))\n\n# жанармай көлемі мен құнын есепте","id":"guide-27"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-28","title":"Апталық температураны талдау","grade":"8","topic":"Тізім және деректерді талдау","scenario":"7 күннің температурасын енгізіңіз. Орташа температураны, ең жылы және ең суық күннің мәндерін, сондай-ақ орташа температурадан жоғары болған күндер санын анықтаңыз.","difficulty":"күрделі","starterCode":"temperatures = []\n\n# 7 күннің мәндерін енгізіп, талдау жаса","id":"guide-28"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-29","title":"Жинақ шотындағы қаражат","grade":"8","topic":"Цикл және пайыздық өсім","scenario":"Бастапқы жинақ сомасы, ай сайын қосылатын тұрақты сома және айлық өсім пайызы енгізіледі. 12 айдың әрқайсысынан кейінгі шот қалдығын шығарып, жыл соңындағы жалпы соманы есептеңіз.","difficulty":"күрделі","starterCode":"balance = float(input(\"Бастапқы жинақ (тг): \"))\nmonthly = float(input(\"Ай сайын қосылатын сома (тг): \"))\nrate = float(input(\"Айлық өсім (%): \"))\n\n# 12 айға арналған цикл құр","id":"guide-29"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-30","title":"Мектеп асханасындағы тапсырыс","grade":"8","topic":"Тізім, цикл және шарт","scenario":"Оқушы бірнеше тағамның бағасын кезекпен енгізеді, енгізу 0 санымен аяқталады. Жалпы соманы және алынған тағам санын есептеңіз. Егер жалпы сома 3000 теңгеден кем болмаса, 10% жеңілдік қолданып, соңғы төлемді шығарыңыз.","difficulty":"күрделі","starterCode":"prices = []\n\n# 0 енгізілгенге дейін бағаларды қабылда","id":"guide-30"},{"active":true,"createdBy":"SYSTEM","testCasesJson":"[]","sourceKey":"guide-31","title":"Судың тәуліктік шығыны","grade":"8","topic":"Тізім және нормамен салыстыру","scenario":"Отбасының 7 күндегі су шығынын литрмен енгізіңіз. Жалпы және орташа шығынды, ең көп және ең аз мәнді анықтаңыз. Тәуліктік норма 600 литр болса, нормадан асқан күндер санын шығарыңыз.","difficulty":"күрделі","starterCode":"water = []\ndaily_limit = 600\n\n# 7 күннің су шығынын енгізіп, талда","id":"guide-31"}]};
})();
