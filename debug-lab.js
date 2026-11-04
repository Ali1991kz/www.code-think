(() => {
 'use strict';
 const model=window.CT_DEBUG_LAB_MODEL,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let ctx={},data=null,error='',selected='',drafts=new Map(),busy=false,acting=false,worker=null,timer=null,generation=0,status='',kind='',previewGrade='7';
 const teacher=()=>ctx.user?.role==='teacher',t=(kk,ru)=>ctx.lang==='ru'?ru:kk;
 const task=()=>model.bank.find(x=>x.id===selected),fieldKey=id=>'ct-debug-lab:'+window.CODE_THINK_CONFIG?.firebase?.projectId+':'+ctx.user?.id+':'+id;
 function leave(){generation++;worker?.terminate();worker=null;clearTimeout(timer);busy=false;acting=false;}
 function context(next){if(ctx.user?.id!==next.user?.id){leave();data=null;error='';selected='';drafts=new Map();status='';kind='';}ctx=next;}
 function draft(id){
  if(drafts.has(id))return drafts.get(id);
  const saved=data?.work?.find(w=>w.labId===id&&w.userId===ctx.user.id)||{};let local;
  try{local=JSON.parse(localStorage.getItem(fieldKey(id))||'null');}catch{}
  const base=local&&local.savedAt>Date.parse(saved.__updatedAt||0)?local:saved;
  const d={inputData:'',prediction:'',buggyOutput:'',expectedOutput:'',explanation:'',fixedCode:model.bank.find(x=>x.id===id).buggyCode,fixedOutput:'',found:false,passed:0,total:0,hintUsed:false,...base};
  drafts.set(id,d);return d;
 }
 function persist(id){try{localStorage.setItem(fieldKey(id),JSON.stringify({...draft(id),savedAt:Date.now()}));}catch{}}
 const btn=(id,text,attrs='',cls='')=>`<button type="button" data-lab="${id}" ${attrs} class="${cls}" ${busy||acting?'disabled':''}>${text}</button>`;
 function repaint(){const el=document.querySelector('#debugLabRoot');if(el)el.outerHTML=html();}
 function paintStatus(){
  const root=document.querySelector('#debugLabRoot');if(!root)return;
  const msg=root.querySelector('[data-lab-message]');if(msg){msg.textContent=status;msg.dataset.kind=kind;}
  root.querySelectorAll('[data-lab], [data-lab-field]').forEach(el=>{el.disabled=busy||acting||(drafts.get(selected)?.found&&['inputData','prediction'].includes(el.dataset.labField));});
  root.querySelectorAll('[data-lab=stop]').forEach(stop=>stop.disabled=!busy);
 }
 async function load(next){context(next);const version=generation;error='';try{const result=await ctx.api('debugLabWorkspace');if(version===generation)data=result;}catch(e){if(version===generation){error=e.message;data=null;}}}
 function html(){
  const head=`<div class="section-head"><div><span class="eyebrow">PYTHON · ${t('ОЙЛАН · ДӘЛЕЛДЕ · ТҮЗЕТ','ДУМАЙ · ДОКАЖИ · ИСПРАВЬ')}</span><h1>${t('Қатені әшкереле зертханасы','Лаборатория поиска ошибок')}</h1></div>${btn('reload',t('Жаңарту','Обновить'),'','quiet')}</div>`;
  let body;
  if(error)body=`<article class="card"><p>${esc(error)}</p></article>`;
  else if(!data)body=`<p>${t('Жүктелуде…','Загрузка…')}</p>`;
  else if(!data.allowed)body=`<article class="card"><h2>🔒 ${t('Алдымен бастапқы диагностиканы аяқта','Сначала заверши начальную диагностику')}</h2><p>${t('Содан кейін осы жерде қате кодты зерттеп, өз мысалдарыңмен тексере аласың.','Затем здесь можно будет исследовать ошибочный код и проверять его своими примерами.')}</p><button type="button" class="primary" data-do="diag-baseline">${t('Диагностикаға өту','Перейти к диагностике')}</button></article>`;
  else body=selected?exercise():catalog();
  return `<section id="debugLabRoot" class="debug-lab">${head}${body}</section>`;
 }
 function catalog(){
  const grade=teacher()?previewGrade:String(ctx.user.grade),tasks=model.bank.filter(x=>x.grade===grade);
  return `<article class="card"><p class="lab-steps-note">${t('Саған ішінде қатесі бар дайын код беріледі. Оны қате жауап беретін мысалмен тексер. Содан кейін қатенің себебін түсіндіріп, кодты түзет.','Тебе дан готовый код с ошибкой. Найди пример, на котором он отвечает неверно. Затем объясни причину и исправь программу.')}</p><p>${t('Өзіңнің күткен жауабыңды алдымен жазасың. Тексергенде кодтың жауабы мен дұрыс нәтиже қатар көрсетіледі.','Сначала запиши ожидаемый ответ. После запуска вывод программы и правильный результат появятся рядом.')}</p>${teacher()?`<p class="lab-preview">${t('Мұғалімнің сынақ көрінісі: бұл әрекеттер оқушы нәтижесі болып сақталмайды.','Пробный режим учителя: эти действия не сохраняются как результаты ученика.')}</p><div class="lab-actions">${btn('grade','7 '+t('сынып','класс'),'data-grade="7"',grade==='7'?'primary':'')}${btn('grade','8 '+t('сынып','класс'),'data-grade="8"',grade==='8'?'primary':'')}</div>`:''}</article><div class="lab-catalog">${tasks.map(p=>{const saved=data.work.find(w=>w.userId===ctx.user.id&&w.labId===p.id),c=p[ctx.lang];return `<article class="card"><span class="badge">${p.grade} ${t('сынып','класс')}</span><h3>${esc(c.title)}</h3><p>${esc(c.goal)}</p><span>${saved?.status==='practiced'?'✓ '+t('Түзетілген код тексерілді','Исправленный код проверен'):saved?.found?t('Қарсы мысал табылды','Контрпример найден'):saved?t('Жоба сақталған','Есть черновик'):t('Әлі басталмаған','Ещё не начато')}</span>${btn('open',t('Зерттеу','Исследовать'),`data-id="${p.id}"`,'primary')}</article>`;}).join('')}</div>${teacher()?teacherWork():''}`;
 }
 function teacherWork(){
  return `<article class="card lab-teacher-work"><h2>${t('Оқушылардың дәлелдері','Работы учеников')}</h2><p class="lab-compact">${t('Нәтижелер — браузерде орындалған жаттығу деректері. Қатенің себебін түсіндіруін мұғалім бағалайды; негізгі баға мен XP өзгермейді.','Результаты — данные тренировки из браузера. Объяснение причины оценивает учитель; основные оценки и XP не меняются.')}</p>${data.users.map(u=>{const rows=data.work.filter(w=>w.userId===u.id);return `<details><summary><strong>${esc(u.name)}</strong> · ${esc(u.className)} · ${rows.filter(w=>w.status==='practiced').length}/${model.bank.filter(p=>p.grade===String(u.grade)).length}</summary>${rows.map(w=>`<details class="history"><summary>${esc(model.bank.find(p=>p.id===w.labId)?.[ctx.lang]?.title)} · ${w.found?t('Қарсы мысал бар','Контрпример есть'):t('Жоба','Черновик')}</summary><p>${t('Өз мысалы','Свой пример')}</p><pre class="code-block">${esc(w.inputData)}</pre><p>${t('Алдын ала күткен жауабы','Прогноз')}: ${esc(w.prediction)}</p><p>${t('Код жауабы','Вывод кода')}: ${esc(w.buggyOutput)} · ${t('Дұрыс нәтиже','Правильный результат')}: ${esc(w.expectedOutput)}</p><p>${t('Қатенің себебі','Причина ошибки')}: ${esc(w.explanation)}</p><p>${w.hintUsed?t('Бағыттау қолданылған','Подсказка использована'):t('Бағыттау ашылмаған','Подсказка не открывалась')}</p><pre class="code-block">${esc(w.fixedCode)}</pre><p>${w.passed}/${w.total} · ${w.status==='practiced'?t('Түзетілген код тестілерден өтті','Исправленный код прошёл тесты'):t('Тексеру аяқталмаған','Проверка не завершена')}</p></details>`).join('')||`<p>${t('Әзірге жұмыс жоқ.','Работ пока нет.')}</p>`}</details>`;}).join('')}</article>`;
 }
 function exercise(){
  const p=task(),c=p[ctx.lang],d=draft(p.id),disabled=d.found||busy?'disabled':'';
  const outputs=d.expectedOutput?`<div class="lab-outputs" data-lab-results><div><strong>${t('Қате кодтың жауабы','Ответ ошибочного кода')}</strong><pre class="console">${esc(d.buggyOutput||'—')}</pre></div><div><strong>${t('Дұрыс нәтиже','Правильный результат')}</strong><pre class="console">${esc(d.expectedOutput)}</pre></div></div>`:'';
  return `${btn('back','← '+t('Зертханалар','Задания'),'','quiet')}<div class="lab-workspace"><article class="card"><span class="badge">${p.grade} ${t('сынып','класс')}</span><h2>${esc(c.title)}</h2><p>${esc(c.goal)}</p><p class="lab-compact">${esc(c.format)}</p><ol class="lab-code">${p.buggyCode.split('\n').map(line=>`<li>${esc(line)||' '}</li>`).join('')}</ol><details><summary>${t('Код дұрыс жауап беретін бастапқы мысал','Начальный пример с правильным ответом')}</summary><pre class="code-block">${esc(p.example)}</pre><p>${t('Нәтиже','Результат')}: <strong>${esc(model.expected(p,p.example))}</strong></p></details></article><article class="card"><h2 class="lab-step-title"><span>1</span>${t('Қате шығатын мысал тап','Найди контрпример')}</h2><div class="lab-fields"><label>${t('Сенің кіріс деректерің','Твои входные данные')}<textarea data-lab-field="inputData" ${disabled}>${esc(d.inputData)}</textarea></label><label>${t('Дұрыс жауап қандай болуы керек?','Какой ответ должен получиться?')}<input data-lab-field="prediction" value="${esc(d.prediction)}" maxlength="100" ${disabled}></label></div><div class="lab-actions">${!d.found?btn('probe',t('Мысалымды тексеру','Проверить мой пример'),'','primary'):btn('retry',t('Басқа мысал табу','Найти другой пример'))}${btn('hint',t('Бағыттау','Подсказка'))}${!teacher()?btn('save',t('Сақтау','Сохранить')):''}<button type="button" data-lab="stop" ${!busy?'disabled':''}>■ ${t('Тоқтату','Остановить')}</button></div>${d.hintUsed?`<p class="note">${esc(c.hint)}</p>`:''}<div class="lab-message" data-lab-message data-kind="${kind}">${esc(status||t('Алдымен мысалың мен күткен жауабыңды жаз.','Сначала запиши пример и ожидаемый ответ.'))}</div>${outputs}</article></div>${d.found?`<article class="card"><h2 class="lab-step-title"><span>2</span>${t('Себебін түсіндір және түзет','Объясни причину и исправь')}</h2><div class="lab-fields"><label>${t('Қате қай жолдан болды? Неліктен?','В какой строке ошибка? Почему?')}<textarea data-lab-field="explanation">${esc(d.explanation)}</textarea></label><label>${t('Түзетілген Python коды','Исправленный Python-код')}<textarea class="code-editor lab-edit" data-lab-field="fixedCode" spellcheck="false" autocapitalize="off">${esc(d.fixedCode)}</textarea></label></div><div class="lab-actions">${btn('verify',t('Түзетуімді тексеру','Проверить исправление'),'','primary')}${!teacher()?btn('save',t('Сақтау','Сохранить')):''}<button type="button" data-lab="stop" ${!busy?'disabled':''}>■ ${t('Тоқтату','Остановить')}</button></div><p class="lab-compact">${t('Өз мысалың және қосымша тестілер тексеріледі. Түсіндіруіңді мұғалім қарайды.','Проверяются твой пример и дополнительные тесты. Объяснение просмотрит учитель.')}</p>${d.fixedOutput?`<pre class="console">${esc(d.fixedOutput)}</pre>`:''}${d.total?`<p>${t('Өткен тексерістер','Пройдено проверок')}: ${d.passed}/${d.total}</p>`:''}</article>`:''}`;
 }
 async function save(){
  if(teacher())return;const owner=ctx.user.id,id=selected,d=draft(id);
  const row=await ctx.api('saveDebugLabWork',{labId:id,...d});
  if(owner!==ctx.user?.id)return;data.work=data.work.filter(w=>w.labId!==id);data.work.push(row);
  try{localStorage.removeItem(fieldKey(id));}catch{}
 }
 async function run(mode){
  const p=task(),d=draft(p.id),version=++generation;
  if(!model.parse(p,d.inputData).ok){status=t('Кіріс есеп шартына сай емес. ','Ввод не соответствует условию. ')+p[ctx.lang].format;kind='';paintStatus();return;}
  if(!d.prediction.trim()){status=t('Алдымен күткен жауабыңды жаз.','Сначала запиши ожидаемый ответ.');paintStatus();return;}
  if(mode==='fix'&&(!d.found||!d.explanation.trim()||!d.fixedCode.trim())){status=t('Қатенің себебін түсіндіріп, түзетілген кодты жаз.','Объясни причину и напиши исправленный код.');paintStatus();return;}
  const code=mode==='probe'?p.buggyCode:d.fixedCode,inputs=mode==='probe'?[d.inputData]:[d.inputData,...p.tests];
  if(code.length>20000){status=t('Код 20000 таңбадан аспасын.','Код не должен превышать 20000 символов.');paintStatus();return;}
  busy=true;kind='';status=t('Python жүктелуде…','Загрузка Python…');if(mode==='fix'){d.passed=0;d.total=inputs.length;}paintStatus();
  let finished=false,index=0,probeResult=null;worker=new Worker('olympiad-worker.js?v=12.1.0');
  const finish=async(message,state='')=>{
   if(finished||version!==generation)return;finished=true;worker?.terminate();worker=null;clearTimeout(timer);busy=false;acting=true;status=message;kind=state;persist(p.id);repaint();paintStatus();
   try{await save();if(version!==generation)return;if(!teacher())status+=' · '+t('Сақталды','Сохранено');}
   catch(e){if(version!==generation)return;status+='\n'+t('Жоба браузерде сақталды. Базаға сақтау: ','Черновик сохранён в браузере. Запись в базу: ')+e.message;}
   finally{if(version===generation){acting=false;repaint();paintStatus();}}
  };
  const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>finish(t('Орындау уақыты аяқталды.','Время выполнения истекло.')),ms);};arm(120000);
  worker.onerror=e=>finish(t('Орындау қатесі: ','Ошибка исполнения: ')+e.message);
  worker.onmessage=({data:r})=>{
   if(version!==generation)return;
   if(r.type==='ready')arm(8000);
   else if(r.type==='case-start'){index=r.index;status=mode==='probe'?t('Кодыңның мысалын тексеріп жатырмыз…','Проверяем твой пример…'):t('Түзетуді тексеру: ','Проверка исправления: ')+(index+1)+'/'+inputs.length;paintStatus();arm(8000);}
   else if(r.type==='load-error')finish(t('Python жүктеу қатесі: ','Ошибка загрузки Python: ')+r.message);
   else if(r.type==='case-result'){
    if(!r.ok){if(mode==='fix')d.fixedOutput=r.output+'\n'+r.error;finish(t('Код орындалмады. ','Код не выполнился. ')+(r.error||''));return;}
    if(mode==='probe'){probeResult=r.output;}
    else{
     if(index===0)d.fixedOutput=r.output;
     if(!model.equal(r.output,model.expected(p,inputs[index]))){finish(t('Түзетілген кодта әлі қате бар. ','В исправленном коде ещё есть ошибка. ')+t('Өткен тексерістер: ','Пройдено проверок: ')+d.passed+'/'+inputs.length,'witness');return;}
     d.passed++;
    }
    worker.postMessage({type:'next'});
   }else if(r.type==='complete'){
    if(mode==='probe'){
     d.buggyOutput=probeResult;d.expectedOutput=model.expected(p,d.inputData);
     const fails=!model.equal(d.buggyOutput,d.expectedOutput),prediction=model.equal(d.prediction,d.expectedOutput);d.found=fails&&prediction;d.passed=0;d.total=d.found?p.tests.length+1:0;
     finish(d.found?t('Дәлел таптың! Код қате жауап берді. Енді себебін түсіндіріп, түзет.','Контрпример найден! Код ответил неверно. Объясни причину и исправь его.'):!prediction?t('Күткен жауабың есептің дұрыс нәтижесіне сәйкес емес. Екеуін салыстырып, қайта тексер.','Твой прогноз не совпал с правильным результатом. Сравни их и проверь снова.'):t('Бұл мысалда код дұрыс жауап берді. Қате шығатын басқа мысал ізде.','На этом примере код ответил верно. Найди другой пример.'),d.found?'witness':'');
    }else finish(t('Түзетілген код барлық тексерістен өтті. Түсіндіруіңді мұғалім қарайды.','Исправленный код прошёл все проверки. Объяснение просмотрит учитель.'),'practiced');
   }
  };
  worker.postMessage({type:'start',code,inputs});window.CT_DEBUG_LAB.stopRun=()=>finish(t('Орындау тоқтатылды.','Выполнение остановлено.'));
 }
 document.addEventListener('input',e=>{const field=e.target.closest('#debugLabRoot [data-lab-field]');if(!field||!selected)return;const d=draft(selected),name=field.dataset.labField;d[name]=field.value;if(name==='fixedCode'){d.passed=0;d.total=task().tests.length+1;d.fixedOutput='';kind='witness';status=t('Код өзгерді. Түзетуіңді қайта тексер.','Код изменён. Проверь исправление заново.');}else if(['inputData','prediction'].includes(name)){d.found=false;d.passed=0;d.total=0;d.buggyOutput='';d.expectedOutput='';document.querySelector('[data-lab-results]')?.setAttribute('hidden','');status=t('Мысал өзгерді. Қайта тексер.','Пример изменён. Проверь заново.');kind='';}persist(selected);paintStatus();});
 document.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey&&e.target.matches('#debugLabRoot .lab-edit')){e.preventDefault();e.target.setRangeText('    ',e.target.selectionStart,e.target.selectionEnd,'end');e.target.dispatchEvent(new Event('input',{bubbles:true}));}});
 document.addEventListener('click',async e=>{
  const b=e.target.closest('#debugLabRoot [data-lab]');if(!b||b.disabled)return;const action=b.dataset.lab;
  if(action==='stop'){window.CT_DEBUG_LAB.stopRun?.();return;}if(busy||acting)return;
  try{
   if(action==='open'){selected=b.dataset.id;status='';kind='';repaint();}
   else if(action==='back'){selected='';status='';kind='';repaint();}
   else if(action==='grade'){previewGrade=b.dataset.grade;repaint();}
   else if(action==='hint'){draft(selected).hintUsed=true;persist(selected);repaint();}
   else if(action==='retry'){const d=draft(selected);d.found=false;d.passed=0;d.total=0;d.buggyOutput='';d.expectedOutput='';status='';kind='';persist(selected);repaint();}
   else if(action==='probe'||action==='verify')await run(action==='probe'?'probe':'fix');
   else if(action==='save'){acting=true;paintStatus();await save();status=t('Жұмыс базаға сақталды.','Работа сохранена в базе.');acting=false;paintStatus();}
   else if(action==='reload'){acting=true;paintStatus();await load(ctx);acting=false;repaint();}
  }catch(e){acting=false;status=e.message;paintStatus();}
 });
 window.CT_DEBUG_LAB={context,load,html,leave};
})();
