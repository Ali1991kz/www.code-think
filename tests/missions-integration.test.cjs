'use strict';
// Compatibility coverage for mission evidence saved before the short quiz returned.
const {test}=require('node:test'),assert=require('node:assert/strict'),{makeUI}=require('./helpers/study-ui.cjs');
for(const file of ['platform.js','new-project/platform.js']){
 function evidence(f){const e=f.w.CT_MISSIONS,key='guide-05',mission=e.record(key,null,{code:'candidate',runCode:'candidate',runId:'one',reason:'changed the day count',outputs:e.bank(key).cases.map(c=>({ok:true,output:c.output}))});return {id:'work:INK',attemptId:'work',kind:'stage',step:'INK',detailsJson:JSON.stringify({mission})};}
 test(file+': submitted historical mission and grade remain read-only without retroactive quiz requirement',()=>{
  const f=makeUI(file),a=f.fixture.data.workspace.assignments[0];f.ui.study('a',4);f.fixture.data.ped.evidence.push(evidence(f));const before=JSON.stringify(a.attempt),html=f.ui.studentView();assert.match(html,/Бұрынғы бекіту миссиясы/);assert.match(html,/changed the day count/);assert.doesNotMatch(html,/data-do="mission-check"|class="quiz-option/);assert.equal(JSON.stringify(a.attempt),before);assert.equal(a.attempt.score,12);assert.deepEqual(f.calls,[]);
 });
 test(file+': ongoing historical mission is archived alongside two questions and cannot satisfy new quiz readiness',()=>{
  const f=makeUI(file),a=f.fixture.data.workspace.assignments[0];f.ui.study('a',4);a.attempt.status='in_progress';f.fixture.data.ped.evidence.push(evidence(f));const html=f.ui.studentView();assert.match(html,/Бұрынғы бекіту миссиясы/);assert.equal((html.match(/class="quiz-question"/g)||[]).length,2);assert.equal(f.ui.phaseReady(a.attempt)[3],false);assert.doesNotMatch(html,/data-do="mission-check"/);assert.deepEqual(f.calls,[]);
 });
 test(file+': teacher sees mission history from the review record even when it is absent from the dashboard snapshot',()=>{
  const f=makeUI(file,{role:'teacher'});f.fixture.review.evidence=[evidence(f)];f.ui.review(f.fixture.review);assert.equal(f.fixture.data.ped.evidence.length,0);const html=f.ui.teacherView();assert.match(html,/Бұрынғы бекіту миссиясы/);assert.match(html,/changed the day count/);assert.equal(f.fixture.review.attempt.score,12);assert.deepEqual(f.calls,[]);
 });
 test(file+': teacher sees current quiz prompts alongside historical mission evidence',()=>{
  const f=makeUI(file,{role:'teacher'}),rec=evidence(f),d=JSON.parse(rec.detailsJson),e=f.w.CT_CONCLUSION;d.quiz=e.answer('guide-05',e.answer('guide-05',null,0,0),1,0);d.fields=e.fields('guide-05',d.quiz);rec.detailsJson=JSON.stringify(d);f.fixture.review.evidence=[rec];f.ui.review(f.fixture.review);const html=f.ui.teacherView();assert.match(html,/Бұрынғы бекіту миссиясы/);assert.match(html,/Мини-тест: 1-сұрақ/);assert.match(html,/Алғашқы жауап.*1\/2/);assert.equal(f.fixture.review.attempt.score,12);
 });
}
