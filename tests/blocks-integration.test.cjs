'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {makeUI}=require('./helpers/study-ui.cjs');
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': trainer blocks preserve code until explicit application; undo restores the old draft without API writes',async()=>{
  const f=makeUI(file);f.ui.page('training');let opened;f.w.CT_BLOCKS={open:opts=>{opened=opts;}};
  assert.match(f.ui.studentView(),/data-do="blocks-open"[^>]*data-prefix="training"/);
  await f.ui.actions['blocks-open']({dataset:{prefix:'training'}});
  const old=f.ui.trainingDraft().code;assert.equal(opened.context,'training:free');assert.equal(opened.readCurrentCode(),old);assert.equal(f.ui.trainingDraft().code,old);
  opened.onApply('print(7)\n',old);assert.equal(f.ui.trainingDraft().code,'print(7)\n');assert.equal(f.ui.trainingDraft().blockBackup,old);
  f.ui.actions['blocks-restore']({dataset:{prefix:'training'}});assert.equal(f.ui.trainingDraft().code,old);assert.equal(f.ui.trainingDraft().blockBackup,undefined);assert.deepEqual(f.calls,[]);
 });
 test(file+': editable task blocks invalidate only local code/output, retain pupil input and scores, and guard stale/locked contexts',async()=>{
  const f=makeUI(file),a=f.fixture.data.workspace.assignments[0];a.attempt.status='in_progress';a.attempt.steps=[];a.attempt.inputData='saved input';f.ui.study();let opened;f.w.CT_BLOCKS={open:opts=>{opened=opts;}};
  const before=JSON.stringify(a.attempt);assert.match(f.ui.codePanel(a.attempt,a.task,false),/data-do="blocks-open"/);assert.doesNotMatch(f.ui.codePanel(a.attempt,a.task,true),/data-do="blocks-open"/);
  await f.ui.actions['blocks-open']({dataset:{prefix:'task'}});assert.equal(opened.context,'task:work:guide-05');opened.onApply('print(8)\n',a.attempt.code);
  assert.equal(f.ui.drafts()['task:work:code'],'print(8)\n');assert.equal(f.ui.drafts()['task:work:output'],'');assert.equal(JSON.stringify(a.attempt),before);assert.deepEqual(f.calls,[]);
  assert.throws(()=>opened.onApply('print(9)',a.attempt.code),/өзгерді/);f.ui.actions['blocks-restore']({dataset:{prefix:'task'}});assert.equal(f.ui.drafts()['task:work:code'],a.attempt.code);
  a.attempt.status='submitted';await assert.rejects(()=>f.ui.actions['blocks-open']({dataset:{prefix:'task'}}),/орындалып/);
 });
 test(file+': a teacher cannot open or apply pupil blocks',async()=>{
  const f=makeUI(file,{role:'teacher'});f.ui.page('training');f.w.CT_BLOCKS={open:()=>{throw Error('Should not open');}};
  await assert.rejects(()=>f.ui.actions['blocks-open']({dataset:{prefix:'training'}}),/Оқушы/);
 });
 test(file+': the block option is available for every core task without revealing a solution',()=>{
  const f=makeUI(file);for(const task of f.w.CT_CONTENT.tasks){const html=f.ui.codePanel({id:'check-'+task.sourceKey,status:'in_progress',code:'',steps:[]},task,false);assert.match(html,/data-do="blocks-open"/);assert.ok(!html.includes('sampleCode'));}assert.equal(f.w.CT_CONTENT.tasks.length,31);
 });
}
