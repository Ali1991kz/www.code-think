'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {makeUI}=require('./helpers/study-ui.cjs'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': optional helper mounts in pupil editors without code, drafts, results or API side effects',()=>{
  const editor={value:'age = int(input())',selectionStart:0},f=makeUI(file,{codeEditors:[editor]}),mounts=[];let disposed=0;
  f.w.CT_CODE_HELP={mount:(node,options)=>{mounts.push({node,options});return {destroy(){disposed++;}};}};
  const oldDrafts=JSON.stringify(f.ui.drafts()),oldData=JSON.stringify(f.fixture.data);f.ui.page('training');f.ui.render();assert.equal(mounts.length,1);assert.equal(mounts[0].node,editor);assert.match(mounts[0].options.preferenceKey,/demo-code-think:s$/);assert.equal(editor.value,'age = int(input())');
  f.ui.render();assert.equal(disposed,1);assert.equal(JSON.stringify(f.ui.drafts()),oldDrafts);assert.equal(JSON.stringify(f.fixture.data),oldData);assert.deepEqual(f.calls,[]);
 });
 test(file+': helper is not mounted in teacher or forced password-change views',()=>{
  for(const role of ['teacher','student']){const f=makeUI(file,{role,codeEditors:[{}]});if(role==='student')f.fixture.user.mustChangePassword=true;f.w.CT_CODE_HELP={mount(){throw Error('Should not mount');}};assert.doesNotThrow(()=>f.ui.render());}
 });
}
test('both entrypoints order local helpers before block editor/platform without touching Firebase adapters',()=>{
 for(const f of ['index.html','new-project/index.html']){const html=read(f);for(const a of ['code-meaning.js?v=12.6.0','code-help.js?v=12.6.0','code-help.css?v=12.6.0'])assert.ok(html.includes(a));assert.ok(html.indexOf('code-meaning.js')<html.indexOf('code-help.js'));assert.ok(html.indexOf('code-help.js')<html.indexOf('block-editor.js'));assert.ok(html.indexOf('code-help.js')<html.indexOf('platform.js'));}
 for(const file of ['code-meaning.js','code-help.js'])assert.ok(!/CT_FIREBASE|\bfetch\s*\(|\beval\s*\(|new Worker|\.postMessage|\.value\s*=/.test(read(file)),file);
});
