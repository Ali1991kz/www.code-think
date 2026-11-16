'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {makeUI}=require('./helpers/study-ui.cjs');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': teacher can open, filter, inspect and rerender monitoring with zero API calls',async()=>{
  const f=makeUI(file,{role:'teacher'});assert.match(f.ui.teacherView(),/Мониторингті ашу/);
  await f.ui.actions['teacher-tab']({dataset:{tab:'monitoring'}});let html=f.ui.teacherView();
  assert.match(html,/id="monitor-title"/);assert.match(html,/Сынақ оқушысы/);assert.match(html,/Екі баға қажет/);
  const inputs={'[data-monitor-class]':{value:'8:8A'},'[data-monitor-search]':{value:'Сынақ'},'[data-monitor-status]':{value:'unpaired'}};
  f.nodes.get('app').querySelector=()=>({querySelector:s=>inputs[s]});
  f.ui.actions['monitor-filter']();f.ui.actions['monitor-student']({dataset:{id:'s'}});
  html=f.ui.teacherView();assert.match(html,/id="monitor-student-detail"/);assert.match(html,/Басталмаған/);
  f.ui.render();f.ui.lang('ru');assert.match(f.ui.teacherView(),/Мониторинг и анализ/);
  f.ui.actions['monitor-close']();f.ui.actions['monitor-reset']();assert.ok(!f.ui.teacherView().includes('id="monitor-student-detail"'));
  assert.equal(f.calls.length,0);assert.ok(!f.intervals.some(fn=>/monitor/i.test(String(fn))));
 });
 test(file+': explicit refresh calls the existing workspace once; averages then use new grades',async()=>{
  const f=makeUI(file,{role:'teacher'});await f.ui.actions['teacher-tab']({dataset:{tab:'monitoring'}});
  f.fixture.data.dashboard.attempts.push({id:'final',userId:'s',grade:'8',attemptType:'final',status:'graded',totalScore:21});
  await f.ui.actions.refresh();assert.deepEqual(f.calls.map(c=>c.action),['schoolWorkspace']);
  const html=f.ui.teacherView();assert.match(html,/\+3/);assert.match(html,/Кабинетке жүктелген уақыт/);
  const before=f.calls.length;f.ui.render();f.ui.actions['monitor-student']({dataset:{id:'s'}});f.ui.teacherView();assert.equal(f.calls.length,before);
 });
 test(file+': a new teacher cannot retain another teacher selection; pupils cannot open monitoring',async()=>{
  const f=makeUI(file,{role:'teacher'});await f.ui.actions['teacher-tab']({dataset:{tab:'monitoring'}});f.ui.actions['monitor-student']({dataset:{id:'s'}});
  assert.match(f.ui.teacherView(),/id="monitor-student-detail"/);
  f.ui.setup({...f.fixture.user,id:'teacher-two'},{...f.fixture.data,dashboard:{users:[],attempts:[]}});
  assert.ok(!f.ui.teacherView().includes('Сынақ оқушысы'));assert.ok(!f.ui.teacherView().includes('id="monitor-student-detail"'));
  const p=makeUI(file);await assert.rejects(p.ui.actions['teacher-tab']({dataset:{tab:'monitoring'}}),/Мұғалім/);assert.ok(!p.ui.studentView().includes('data-tab="monitoring"'));
 });
}
test('all three entrypoints load the static monitor before platform; model has no transport or persistence',()=>{
 for(const p of ['index.html','new-project/index.html','demo.html']){const html=read(p);assert.match(html,/monitoring.css\?v=12.9.0/);assert.ok(html.indexOf('monitoring.js?')<html.indexOf('platform.js?'));assert.match(html,/platform.js\?v=12.9.0/);}
 assert.doesNotMatch(read('monitoring.js'),/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|setInterval|CT_FIREBASE|WebSocket/);
});
test('CSV exports current filtered snapshot with absent grades labelled; no passwords or logins',()=>{
 const M=require('../monitoring.js'),r=M.build({dashboard:{users:[{id:'s',name:'=SUM(A1)',login:'secret-login',grade:'8',className:'8A'}],attempts:[]}});
 const rows=M.csv(r);assert.equal(rows.length,2);assert.equal(rows[1][0],'=SUM(A1)');assert.match(rows[1][2],/Басталмаған/);assert.equal(rows[1][4],'');assert.ok(!JSON.stringify(rows).includes('secret-login'));
 // The existing downloader neutralizes formula cells before writing quoted CSV.
 assert.match(read('platform.js'),/function csvDownload[\s\S]*?replace\(\/\^\[/);
});
