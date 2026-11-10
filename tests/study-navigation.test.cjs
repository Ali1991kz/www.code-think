const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {makeUI}=require('./helpers/study-ui.cjs');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const main=html=>html.match(/<nav class="tabs study-main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': five primary destinations keep practice, ranking and results inside their parent',()=>{
  const {ui}=makeUI(file);
  for(const [page,parent]of [['tasks','tasks'],['diagnostics','diagnostics'],['mistakes','mistakes'],['training','training'],['debug-lab','training'],['olympiad','training'],['profile','profile'],['ranking','profile'],['results','profile'],['transfer','tasks'],['probe','tasks'],['correction','mistakes']]){
   ui.page(page);const html=ui.nav(),primary=main(html);
   assert.deepEqual([...primary.matchAll(/data-page="([^"]+)"/g)].map(x=>x[1]),['tasks','diagnostics','mistakes','training','profile']);
   assert.ok(primary.includes('data-page="'+parent+'" aria-current="page"'));
   if(['training','debug-lab','olympiad'].includes(page))assert.match(html,/study-subnav/);
   else assert.ok(!html.includes('study-subnav'));
  }
 });
 test(file+': profile achievements open class ranking on demand; practice loads only the selected exercise',async()=>{
  const f=makeUI(file);await f.ui.actions.page({dataset:{page:'profile'}});let html=f.ui.studentView();
  assert.match(html,/<section id="profile-achievements"[\s\S]*data-page="ranking"/);assert.deepEqual(f.calls.map(c=>c.action),['schoolWorkspace']);
  await f.ui.actions.page({dataset:{page:'ranking'}});assert.equal(f.calls.at(-1).action,'rankingWorkspace');
  html=f.ui.studentView();assert.match(html,/study-breadcrumb/);assert.match(html,/120/);assert.ok(!html.includes('undefined'));
  await f.ui.actions.page({dataset:{page:'training'}});assert.match(f.ui.studentView(),/data-training-field="code"/);
  await f.ui.actions.page({dataset:{page:'debug-lab'}});assert.equal(f.calls.at(-1).action,'debugLabWorkspace');assert.match(f.ui.studentView(),/debugLabRoot/);
  await f.ui.actions.page({dataset:{page:'olympiad'}});assert.equal(f.calls.at(-1).action,'olympiadWorkspace');assert.match(f.ui.studentView(),/olymp-locked/);
  assert.ok(!f.calls.some(c=>c.action==='communityWorkspace'));
 });
 test(file+': diagnostics, correction work, transfer and reviewed results remain reachable',()=>{
  const f=makeUI(file);f.ui.page('diagnostics');let html=f.ui.studentView();assert.match(html,/data-do="diag-baseline"/);assert.match(html,/data-do="diag-final"[^>]*disabled/);
  f.ui.page('tasks');assert.match(f.ui.studentView(),/data-page="transfer"/);
  f.ui.page('profile');assert.match(f.ui.studentView(),/data-page="results"/);
  const beginner=makeUI(file,{baselineStatus:null});beginner.ui.page('tasks');assert.ok(!beginner.ui.studentView().includes('study-transfer'));
  beginner.ui.page('diagnostics');assert.match(beginner.ui.studentView(),/data-do="diag-baseline"/);
  f.ui.lang('ru');f.ui.page('training');assert.match(f.ui.nav(),/Площадка Python/);assert.match(f.ui.nav(),/Сложные задачи/);
 });
 test(file+': teacher review tools are retained and no render activates online polling',()=>{
  const f=makeUI(file,{role:'teacher'}),html=f.ui.teacherView();
  for(const tab of ['students','diagnostics','work','corrections','olympiad','debug-lab','ranking'])assert.ok(html.includes('data-tab="'+tab+'"'));
  assert.ok(!read(file).includes('CT_COMMUNITY'));f.ui.render();assert.ok(!f.calls.some(c=>c.action==='communityWorkspace'));
 });
}
test('both deployed entrypoints omit the online ticker and keep required score models and exercise assets',()=>{
 for(const file of ['index.html','new-project/index.html']){
  const html=read(file);assert.ok(!/src="community\.js/.test(html));assert.ok(!/href="community\.css/.test(html));
  for(const asset of ['community-engine.js','ranking.js','debug-lab.js','olympiad.js','trainer-engine.js','study-navigation.css'])assert.ok(html.includes(asset));
  assert.match(html,/platform\.js\?v=[0-9.]+/);
 }
});
