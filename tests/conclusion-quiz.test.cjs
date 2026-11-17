'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{makeUI}=require('./helpers/study-ui.cjs');
const w={},c=vm.createContext({window:w});for(const f of ['content.js','conclusion-bank.js','conclusion-engine.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
test('31 canonical tasks have 62 bilingual questions, valid unique choices and explanations',()=>{
 assert.equal(w.CT_CONTENT.tasks.length,31);assert.equal(Object.keys(w.CT_CONCLUSION_BANK).length,31);
 for(const task of w.CT_CONTENT.tasks){const b=w.CT_CONCLUSION.bank(task.sourceKey);assert.equal(b.questions.length,2,task.sourceKey);for(const q of b.questions){assert.ok(Number.isInteger(q.answer));for(const lang of ['kk','ru']){const d=q[lang];assert.ok(d.prompt&&d.explanation);assert.equal(d.options.length,3);assert.equal(new Set(d.options).size,3);assert.ok(q.answer>=0&&q.answer<d.options.length);}}}
});
test('first responses remain after feedback and retries; invalid responses cannot complete',()=>{
 const E=w.CT_CONCLUSION,k='guide-16';let q=E.answer(k,null,0,1);assert.equal(E.results(k,q).complete,false);q=E.answer(k,q,0,0);q=E.answer(k,q,1,1);assert.equal(E.results(k,q).complete,true);assert.equal(E.results(k,q).firstCorrect,1);assert.equal(E.results(k,q).latestCorrect,2);assert.equal(q.firstAnswers[0],1);assert.equal(E.fields(k,q).length,2);
 for(const [i,j]of [[-1,0],[2,0],[0,-1],[0,3],[0,1.5]])assert.throws(()=>E.answer(k,q,i,j));
});
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': all 31 editable conclusions show two task-specific questions without another code exercise or render reads',()=>{
  const f=makeUI(file),a=f.fixture.data.workspace.assignments[0];a.attempt.status='in_progress';a.attempt.steps=[];f.ui.study('a',4);
  for(const task of f.w.CT_CONTENT.tasks){a.task=task;const html=f.ui.studentView();assert.equal(f.w.CT_CONCLUSION_BANK[task.sourceKey].questions.length,2,task.sourceKey);assert.equal((html.match(/class="quiz-question"/g)||[]).length,2,task.sourceKey);assert.doesNotMatch(html,/data-do="mission-check"|Миссияның Python коды/);}
  assert.deepEqual(f.calls,[]);
 });
 test(file+': both answers are required; wrong answers can finish without artificially forcing a perfect score',async()=>{
  const f=makeUI(file),a=f.fixture.data.workspace.assignments[0];a.attempt.status='in_progress';a.attempt.steps=[];f.ui.study('a',4);
  await assert.rejects(f.ui.actions['save-step'](),/екі сұрағына/);assert.ok(!f.calls.some(x=>x.action==='submitTask'));
  const e=f.w.CT_CONCLUSION,key='guide-05';let quiz=e.answer(key,null,0,0);const rec={id:'work:INK',attemptId:'work',kind:'stage',step:'INK',detailsJson:JSON.stringify({quiz})};f.fixture.data.ped.evidence.push(rec);assert.equal(f.ui.phaseReady(a.attempt)[3],false);
  quiz=e.answer(key,quiz,1,1);rec.detailsJson=JSON.stringify({quiz});assert.equal(f.ui.phaseReady(a.attempt)[3],true);assert.equal(e.results(key,quiz).firstCorrect,0);
  let html=f.ui.studentView();assert.match(html,/Дұрыс жауап:/);assert.match(html,/700/);assert.match(html,/Алғашқы жауап/);
  f.ui.lang('ru');html=f.ui.studentView();assert.match(html,/Правильный ответ:/);assert.match(html,/Первый ответ/);
 });
}
