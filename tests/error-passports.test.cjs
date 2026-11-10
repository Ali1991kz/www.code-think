const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {makeUI}=require('./helpers/study-ui.cjs'),root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function model(){const w={},ctx=vm.createContext({window:w});for(const f of ['content.js','error-passport-examples.js','error-passports.js'])vm.runInContext(read(f),ctx,{filename:f});return w;}
test('all 31 source tasks have task-specific bilingual passports and 75 verified examples',()=>{
 const w=model(),m=w.CT_ERROR_PASSPORTS,inputs=JSON.parse(read('tests/fixtures/error-passport-inputs.json'));
 assert.equal(m.bank.length,31);assert.deepEqual([...m.bank.map(p=>p.sourceKey)].sort(),[...w.CT_CONTENT.tasks.map(t=>t.sourceKey)].sort());
 for(const p of m.bank){
  assert.ok(['C','OD','E','TH','INK'].includes(p.stage));assert.ok(['meaning','algorithm','data','boundary','explanation'].includes(p.category));
  for(const lang of ['kk','ru'])for(const key of ['mistake','cause','question','nextAction','evidence'])assert.ok(p[lang][key]?.length>20,p.sourceKey+' '+lang+' '+key);
  assert.notEqual(p.kk.question,p.ru.question);assert.deepEqual(Array.from(p.checks,c=>c.input),inputs[p.sourceKey]);
  for(const c of p.checks)assert.ok(c.expected.length>0);
 }
 assert.equal(m.bank.flatMap(p=>p.checks).length,75);
 for(const field of Object.values(m.get('guide-05').kk))assert.match(field,/[әғқңөұүі]/i);
 assert.equal((m.library('kk','7').match(/data-passport-card=/g)||[]).length,19);
 assert.equal((m.library('ru','8').match(/data-passport-card=/g)||[]).length,12);
 assert.equal(m.get({id:'custom-task',title:'Амандасу'}),null);assert.equal(m.card({id:'custom-task'},'kk'),'');
});
test('boundary, decimal, zero and compounding examples match independently calculated expectations',()=>{
 const m=model().CT_ERROR_PASSPORTS,get=(key,input)=>m.get(key).checks.find(c=>c.input===input).expected;
 assert.equal(get('guide-02','18'),'Кәмелетке толған');assert.equal(get('guide-03','0'),'Қате күн нөмірі');
 assert.equal(Number(get('guide-06','2.5')),2.5*20);assert.equal(Number(get('guide-08','60\n1.5')),Number((60/1.5**2).toFixed(2)));
 assert.equal(get('guide-14','101\n20'),String(Math.ceil(101/20)));assert.equal(get('guide-17','0'),'Жұп');
 assert.equal(get('guide-23','0\n0'),'Шексіз көп шешім');assert.equal(get('guide-23','0\n5'),'Шешімі жоқ');
 assert.equal(get('guide-25','1000\n10'),(1000*(1-10/100)).toFixed(2));assert.equal(Number(get('guide-26','51')),5000+(51-50)*100);
 assert.ok(!get('guide-27','300\n10\n200').includes('Үзіліс'));assert.ok(get('guide-27','301\n10\n200').includes('Үзіліс'));
 assert.match(get('guide-29','1000\n0\n10'),new RegExp('Жыл соңында: '+(1000*1.1**12).toFixed(2).replace('.','\\.')));
 assert.match(get('guide-30','0'),/Тағам саны: 0/);assert.match(get('guide-31',Array(7).fill(600).join('\n')),/Нормадан асқан күн: 0/);
});
test('pupil feedback contains prompts and an action, without the teacher-only evidence or expected output block',()=>{
 const m=model().CT_ERROR_PASSPORTS;
 for(const p of m.bank)for(const lang of ['kk','ru']){const text=m.feedback(p.sourceKey,lang);assert.ok(text.includes(p[lang].question));assert.ok(text.includes(p[lang].nextAction));assert.ok(!text.includes(p[lang].evidence));}
 assert.ok(!m.feedback('guide-29','kk').includes('3138.43'));assert.ok(!m.feedback('guide-25','ru').includes('900.00'));
 assert.ok(!read('error-passports.js').includes('sampleCode'));assert.ok(!read('error-passport-examples.js').includes('sampleCode'));
});
for(const file of ['platform.js','new-project/platform.js']){
 test(file+': teacher review and bank show the matching passport without new requests',()=>{
  const f=makeUI(file,{role:'teacher'});f.ui.review(f.fixture.review);const html=f.ui.teacherView();
  assert.match(html,/data-passport-card="guide-05"/);assert.match(html,/data-do="passport-feedback"/);
  assert.equal(f.calls.length,0);f.ui.tab('bank');assert.match(f.ui.teacherView(),/error-passports.html/);
 });
 test(file+': selecting a passport appends an editable hint once and never changes code, scores or submitted data',()=>{
  const f=makeUI(file,{role:'teacher'});f.ui.review(f.fixture.review);const before=JSON.stringify(f.fixture.review);
  const button={dataset:{passport:'guide-05'}};f.ui.actions['passport-feedback'](button);
  const once=f.ui.drafts()['feedback:work:OD'];assert.ok(once.includes(f.w.CT_ERROR_PASSPORTS.get('guide-05').kk.question));
  f.ui.actions['passport-feedback'](button);assert.equal(f.ui.drafts()['feedback:work:OD'],once);
  f.ui.actions['passport-input']({dataset:{passport:'guide-05',case:'0'}});assert.equal(f.ui.drafts()['review-input:work'],f.w.CT_ERROR_PASSPORTS.get('guide-05').checks[0].input);
  assert.equal(JSON.stringify(f.fixture.review),before);assert.equal(f.calls.length,0);
  assert.throws(()=>f.ui.actions['passport-feedback']({dataset:{passport:'guide-02'}}));
  assert.throws(()=>f.ui.actions['passport-input']({dataset:{passport:'guide-05',case:'999'}}));
  f.fixture.review.attempt.status='in_progress';assert.throws(()=>f.ui.actions['passport-feedback'](button));
 });
 test(file+': students cannot trigger teacher passport controls and their five main sections are unchanged',()=>{
  const f=makeUI(file);assert.throws(()=>f.ui.actions['passport-feedback']({dataset:{passport:'guide-05'}}));
  assert.ok(!f.ui.studentView().includes('data-passport-card'));assert.equal((f.ui.nav().match(/data-page=/g)||[]).length,5);assert.equal(f.calls.length,0);
 });
}
test('entrypoints load passport data before its UI; printable guide uses no Auth or Firestore',()=>{
 for(const f of ['index.html','new-project/index.html']){const html=read(f);assert.ok(html.indexOf('error-passport-examples.js')<html.indexOf('src="error-passports.js'));assert.ok(html.indexOf('src="error-passports.js')<html.lastIndexOf('platform.js'));assert.match(html,/error-passports.css/);}
 const guide=read('error-passports.html')+read('error-passport-guide.js');assert.ok(!/firebase|CT_FIREBASE|sampleCode/.test(guide));assert.match(guide,/data-book-print/);
});
