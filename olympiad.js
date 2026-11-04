(() => {
 'use strict';
 const bank=window.CT_OLYMPIAD_BANK,model=window.CT_OLYMPIAD_MODEL;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let ctx={},data=null,error='',selected='',level=0,busy=false,status='',statusKind='',worker=null,timer=null,epoch=0,drafts=new Map(),job=0,actionBusy=false;
 const t=(kk,ru)=>ctx.lang==='ru'?ru:kk;
 const task=()=>bank.find(x=>x.id===selected),isTeacher=()=>ctx.user?.role==='teacher';
 const label=v=>({draft:t('Жоба','Черновик'),accepted:t('Тестілерден өтті','Тесты пройдены'),wrong:t('Қате жауап','Неверный ответ'),error:t('Орындау қатесі','Ошибка исполнения'),timeout:t('Уақыт шегі','Лимит времени'),stopped:t('Тоқтатылды','Остановлено')})[v]||'—';
 const key=id=>'ct-olympiad:'+window.CODE_THINK_CONFIG?.firebase?.projectId+':'+ctx.user?.id+':'+id;
 function context(next){if(ctx.user?.id!==next.user?.id){leave();data=null;selected='';drafts=new Map();error='';}ctx=next;}
 function draft(id){
  if(drafts.has(id))return drafts.get(id);
  const old=data?.work?.find(w=>w.taskId===id&&w.userId===ctx.user.id)||{};
  let local;try{local=JSON.parse(localStorage.getItem(key(id))||'null');}catch{}
  const saved=local&&local.savedAt>Date.parse(old.__updatedAt||0)?local:old;
  const row={code:saved.code||'',inputData:saved.inputData||bank.find(t=>t.id===id).examples[0].input,lastOutput:saved.lastOutput||''};drafts.set(id,row);return row;
 }
 function persist(id){try{localStorage.setItem(key(id),JSON.stringify({...draft(id),savedAt:Date.now()}));}catch{}}
 function button(id,text,extra='',cls=''){return `<button type="button" data-olymp="${id}" ${extra} class="${cls}" ${busy||actionBusy?'disabled':''}>${text}</button>`;}
 function repaint(){const root=document.querySelector('#olympiadRoot');if(root)root.outerHTML=html();}
 function statusPaint(){const root=document.querySelector('#olympiadRoot');if(!root)return;const el=root.querySelector('[data-olymp-status]');if(el){el.textContent=status;el.dataset.state=statusKind;}root.querySelectorAll('[data-olymp],textarea').forEach(el=>el.disabled=busy||actionBusy);const stop=root.querySelector('[data-olymp=stop]');if(stop)stop.disabled=!busy;}
 async function load(next){
  context(next);const version=epoch;error='';
  try{const fresh=await ctx.api('olympiadWorkspace');if(version===epoch)data=fresh;}
  catch(e){if(version===epoch){data=null;error=e.message;}}
 }
 function html(){
  const heading=`<div class="section-head"><div><span class="eyebrow">PYTHON · 8 ${t('СЫНЫП','КЛАСС')}</span><h1>${t('Олимпиадаға дайындық','Подготовка к олимпиаде')}</h1></div>${button('reload',t('Жаңарту','Обновить'),'','quiet')}</div>`;
  let inner='';
  if(error)inner=`<article class="card"><h2>${t('Бөлім әзірге қолжетімсіз','Раздел пока недоступен')}</h2><p>${esc(error)}</p>${isTeacher()?`<p>${t('Жаңартылған firestore.rules файлын Firebase Rules бөлімінде жариялап, қайта жаңартыңыз.','Опубликуйте обновлённый firestore.rules в Firebase Rules и обновите страницу.')}</p>`:''}</article>`;
  else if(!data)inner=`<p>${t('Жүктелуде…','Загрузка…')}</p>`;
  else if(!data.allowed)inner=`<article class="card olymp-locked"><h2>🔒 ${t('Келесі қадамға дайындал','Подготовься к следующему шагу')}</h2><p>${t('Негізгі тапсырмаларыңды орындап, мұғалімнің тексеруін күт. 8-сыныптың 12 негізгі есебі бағаланған соң бөлім автоматты ашылады. Мұғалім ертерек те аша алады.','Выполни основные задания и дождись проверки учителя. После оценки 12 основных задач 8 класса раздел откроется автоматически. Учитель может открыть его раньше.')}</p><div class="olymp-progress"><strong>${data.completed}/${data.total}</strong><span>${t('негізгі есеп бағаланған','основных задач проверено')}</span></div></article>`;
  else if(selected)inner=problem();
  else inner=catalog();
  return `<section id="olympiadRoot" class="olympiad">${heading}${inner}</section>`;
 }
 function catalog(){
  const solved=new Set((data.work||[]).filter(w=>w.userId===ctx.user.id&&w.solved).map(w=>w.taskId));
  return `<article class="card olymp-intro"><div class="olymp-progress"><strong>${isTeacher()?'15':solved.size+'/15'}</strong><span>${t('есеп · жолдар, нұсқалар және қозғалыс','задач · строки, версии и движение')}</span></div><p>${t('Есепті оқы, Python кодын жаз, өз кірісіңмен орында және қосымша тестілермен тексер.','Прочитай условие, напиши Python-код, запусти на своём вводе и проверь дополнительными тестами.')}</p><p class="compact muted">${t('Тест нәтижесі — жаттығу көрсеткіші. Мұғалімнің негізгі бағалары мен XP ұпайлары бөлек сақталады.','Результат тестов — показатель тренировки. Основные оценки учителя и XP сохраняются отдельно.')}</p></article>${isTeacher()?pupils():''}<div class="olymp-levels">${[[0,'Барлығы','Все'],[1,'1 · Бастау','1 · Старт'],[2,'2 · Дамыту','2 · Развитие'],[3,'3 · Күрделі','3 · Сложные']].map(([n,kk,ru])=>button('level',t(kk,ru),`data-level="${n}"`,level===n?'active':'')).join('')}</div><div class="olymp-grid">${bank.filter(p=>!level||p.level===level).map(p=>{const w=(data.work||[]).find(w=>w.userId===ctx.user.id&&w.taskId===p.id),m=p[ctx.lang];return `<article class="card"><span class="badge">${String(p.number).padStart(2,'0')} · ${t('Деңгей','Уровень')} ${p.level}</span><h3>${esc(m.title)}</h3><span class="olymp-topic">${esc(t(p.topic,{Жолдар:'Строки',Нұсқалар:'Версии',Қозғалыс:'Движение'}[p.topic]))}</span><span>${w?.solved?'✓ '+t('Тестілерден өткен','Тесты пройдены'):w?label(w.verdict):t('Әлі басталмаған','Ещё не начато')}</span>${button('open',t('Есепті ашу','Открыть задачу'),`data-task="${p.id}"`,'primary')}</article>`;}).join('')}</div><p class="olymp-source">${t('Жүктелген 8-сынып олимпиадасының A, B, C бағыттарына сүйенген бейімделген жаттығулар.','Адаптированные тренировочные задачи по направлениям A, B, C из загруженного комплекта 8 класса.')}</p>`;
 }
 function pupils(){
  return `<details class="card" open><summary><strong>${t('Оқушылардың дайындығы және қолжетімділік','Подготовка учеников и доступ')}</strong></summary><p class="compact muted">${t('Автоматты режим: 8-сыныптың 12 негізгі есебі бағаланғанда ашылады. Тест нәтижелері оқушы браузерінен сақталады; мұғалім кодты қарап, тексере алады.','Автоматический режим: открывается после проверки 12 основных задач 8 класса. Результаты тестов сохраняются из браузера ученика; учитель может просмотреть и проверить код.')}</p>${data.users.map(u=>{const a=data.access.find(a=>a.userId===u.id),works=data.work.filter(w=>w.userId===u.id),solved=works.filter(w=>w.solved).length;return `<div class="olymp-pupil"><div><strong>${esc(u.name)}</strong><small>${esc(u.className)} · ${u.completed}/${u.total} ${t('негізгі есеп','основных задач')}</small></div><div>${a?.allowed?'🟢 '+t('Ашық','Открыто'):'🔒 '+t('Жабық','Закрыто')}<small>${solved}/15 · ${works.reduce((n,w)=>n+w.submissions,0)} ${t('тексеруге жіберу','отправок')}</small></div><div class="olymp-actions">${button('access',a?.allowed?t('Жабу','Закрыть'):t('Ашу','Открыть'),`data-user="${u.id}" data-allow="${!a?.allowed}"`)}${a?.manual?button('auto',t('Автоматты','Автоматически'),`data-user="${u.id}"`):''}</div></div>${works.length?`<details><summary>${esc(u.name)} · ${t('Кодтары мен нәтижелері','Код и результаты')}</summary>${works.map(w=>`<details class="history"><summary>${esc(bank.find(p=>p.id===w.taskId)?.[ctx.lang]?.title)} · ${label(w.verdict)} · ${w.passed}/${w.total}</summary><pre class="code-block olymp-code-review">${esc(w.code)}</pre><p>${t('Кіріс','Ввод')}</p><pre class="code-block">${esc(w.inputData)}</pre><p>${t('Соңғы нәтиже','Последний вывод')}</p><pre class="console">${esc(w.lastOutput)}</pre></details>`).join('')}</details>`:''}`;}).join('')||t('Белсенді оқушы жоқ.','Нет активных учеников.')}</details>`;
 }
 function problem(){
  const p=task(),m=p[ctx.lang],d=draft(p.id);
  return `${button('back','← '+t('Есептер тізімі','Список задач'),'','quiet')}<div class="olymp-workspace"><article class="card"><span class="badge">${p.number} · ${t('Деңгей','Уровень')} ${p.level}</span><h2>${esc(m.title)}</h2><p class="olymp-statement">${esc(m.statement)}</p><h3>${t('Кіріс деректері','Входные данные')}</h3><p>${esc(m.input)}</p><h3>${t('Шығыс деректері','Выходные данные')}</h3><p>${esc(m.output)}</p><h3>${t('Шектеулер','Ограничения')}</h3><p>${esc(p.limits)}</p><h3>${t('Мысалдар','Примеры')}</h3><div class="olymp-examples">${p.examples.map((e,i)=>`<div class="olymp-example"><div><strong>${t('Кіріс','Ввод')} ${i+1}</strong><pre class="code-block">${esc(e.input)}</pre>${button('example',t('Кіріске қою','Подставить ввод'),`data-example="${i}"`)}</div><div><strong>${t('Шығыс','Вывод')} ${i+1}</strong><pre class="code-block">${esc(e.output)}</pre></div></div>`).join('')}</div></article><article class="card olymp-editor-pane"><label class="field">Python 3<textarea class="code-editor olymp-code" data-olymp-field="code" spellcheck="false" autocapitalize="off" aria-label="Python 3">${esc(d.code)}</textarea></label><label class="field">${t('Кіріс деректері','Входные данные')}<textarea class="olymp-input" data-olymp-field="inputData">${esc(d.inputData)}</textarea></label><div class="olymp-actions">${button('run','▶ '+t('Орындау','Запустить'),'','primary')}${button('check',t('Тексеруге жіберу','Проверить тестами'))}${!isTeacher()?button('save',t('Жобаны сақтау','Сохранить черновик')):''}<button type="button" data-olymp="stop" ${!busy?'disabled':''}>■ ${t('Тоқтату','Остановить')}</button></div><p class="compact muted">${t('Алғашқы іске қосуға интернет керек. Әр тестке 8 секунд. Tab — шегініс.','При первом запуске нужен интернет. На тест отводится 8 секунд. Tab — отступ.')}</p><div class="olymp-status" data-olymp-status data-state="${esc(statusKind)}">${esc(status||t('Кодты жазып, орында.','Напиши код и запусти.'))}</div><strong>${t('Нәтиже','Вывод')}</strong><pre class="console olymp-console" data-olymp-output>${esc(d.lastOutput||'—')}</pre></article></div>`;
 }
 async function save(submission){
  if(isTeacher())return;
  const id=selected,d=draft(id),owner=ctx.user.id;
  const row=await ctx.api('saveOlympiadWork',{taskId:id,...d,lastOutput:d.lastOutput.slice(0,12000),...submission});
  if(owner!==ctx.user?.id)return;
  data.work=data.work.filter(w=>w.taskId!==id);data.work.push(row);
  try{localStorage.removeItem(key(id));}catch{}
 }
 function leave(){epoch++;job++;clearTimeout(timer);worker?.terminate();worker=null;busy=false;actionBusy=false;}
 async function run(check){
  if(busy)return;const p=task(),d=draft(p.id);
  if(!d.code.trim()){status=t('Алдымен Python кодын жаз.','Сначала напиши Python-код.');statusPaint();return;}
  busy=true;statusKind='';status=t('Python жүктелуде…','Загрузка Python…');statusPaint();
  const runId=++job,code=d.code,input=d.inputData,cases=check?p.tests:[{input}],inputs=cases.map(model.expand);let passed=0,index=0,finishing=false;
  worker=new Worker('olympiad-worker.js?v=12.0.0');
  const finish=async(verdict,message)=>{
   if(finishing||runId!==job)return;finishing=true;clearTimeout(timer);worker?.terminate();worker=null;
   statusKind=verdict;status=message;busy=false;actionBusy=true;statusPaint();
   try{await save(check?{submit:true,passed,verdict}:{});if(runId!==job)return;if(!isTeacher())status+=' · '+t('Сақталды','Сохранено');}
   catch(e){persist(p.id);status+='\n'+t('Браузерде сақталды; базаға сақтау қатесі: ','Сохранено в браузере; ошибка записи в базу: ')+e.message;}
   finally{if(runId===job){actionBusy=false;statusPaint();}}
  };
  const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>finish('timeout',t('Орындау уақыты аяқталды.','Время выполнения истекло.')),ms);};
  arm(120000);
  worker.onerror=e=>finish('error',String(e.message));
  worker.onmessage=({data:r})=>{
   if(runId!==job)return;
   if(r.type==='ready')arm(8000);
   else if(r.type==='case-start'){index=r.index;status=check?t('Тексерілуде: ','Проверка: ')+(index+1)+'/'+cases.length:t('Орындалуда…','Выполнение…');statusPaint();arm(8000);}
   else if(r.type==='load-error')finish('error',t('Python жүктеу қатесі: ','Ошибка загрузки Python: ')+r.message);
   else if(r.type==='case-result'){
    const output=r.output+(r.error?'\n'+r.error:'');
    if(!check||r.index<2){d.lastOutput=output;const el=document.querySelector('[data-olymp-output]');if(el)el.textContent=output||'—';}
    if(!r.ok){finish('error',t('Орындау қатесі. ','Ошибка исполнения. ')+(check?t('Тест: ','Тест: ')+(index+1):output));return;}
    if(check&&model.normalize(r.output)!==model.normalize(cases[r.index].output)){finish('wrong',t('Қате жауап. Өткен тестілер: ','Неверный ответ. Пройдено тестов: ')+passed+'/'+cases.length);return;}
    passed++;worker.postMessage({type:'next'});
   }else if(r.type==='complete')finish(check?'accepted':'draft',check?t('Барлық тестіден өтті: ','Все тесты пройдены: ')+passed+'/'+cases.length:t('Орындау аяқталды.','Выполнение завершено.'));
  };
  worker.postMessage({type:'start',code,inputs});
  window.CT_OLYMPIAD.stopRun=()=>finish('stopped',t('Орындау тоқтатылды.','Выполнение остановлено.'));
 }
 document.addEventListener('input',e=>{const field=e.target.closest('#olympiadRoot [data-olymp-field]');if(!field||!selected)return;draft(selected)[field.dataset.olympField]=field.value;persist(selected);});
 document.addEventListener('keydown',e=>{if(e.key==='Tab'&&!e.shiftKey&&e.target.matches('#olympiadRoot .olymp-code')){e.preventDefault();e.target.setRangeText('    ',e.target.selectionStart,e.target.selectionEnd,'end');draft(selected).code=e.target.value;persist(selected);}});
 document.addEventListener('click',async e=>{
  const b=e.target.closest('#olympiadRoot [data-olymp]');if(!b||b.disabled)return;const action=b.dataset.olymp;
  if(action==='stop'){window.CT_OLYMPIAD.stopRun?.();return;}
  if(busy||actionBusy)return;
  try{
   if(action==='open'){selected=b.dataset.task;status='';statusKind='';repaint();}
   else if(action==='back'){selected='';status='';repaint();}
   else if(action==='level'){level=Number(b.dataset.level);repaint();}
   else if(action==='example'){draft(selected).inputData=task().examples[Number(b.dataset.example)].input;persist(selected);repaint();}
   else if(action==='run'||action==='check')await run(action==='check');
   else if(action==='save'){actionBusy=true;statusPaint();await save({});status=t('Жоба базаға сақталды.','Черновик сохранён в базе.');actionBusy=false;statusPaint();}
   else if(action==='reload'){actionBusy=true;statusPaint();await load(ctx);actionBusy=false;repaint();}
   else if(action==='access'||action==='auto'){actionBusy=true;statusPaint();data=await ctx.api('setOlympiadAccess',{userId:b.dataset.user,allowed:b.dataset.allow==='true',mode:action==='auto'?'auto':'manual'});actionBusy=false;repaint();}
  }catch(e){actionBusy=false;status=t('Қате: ','Ошибка: ')+e.message;if(selected)statusPaint();else{error=e.message;repaint();}}
 });
 window.CT_OLYMPIAD={context,load,html,leave};
})();
