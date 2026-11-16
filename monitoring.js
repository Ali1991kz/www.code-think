/* Local, descriptive teacher monitoring. No transport, storage, timers or grading. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CT_MONITORING=api;
})(typeof window==='object'?window:null,function(){
 'use strict';
 const arr=v=>Array.isArray(v)?v:[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const score=(v,max)=>v===null||v===undefined||typeof v==='boolean'||String(v).trim()===''?null:Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=max?Number(v):null;
 const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
 const stamp=a=>String(a.startedAt||a.createdAt||a.__createdAt||a.submittedAt||'');
 const newer=(a,b)=>!b||stamp(a)>stamp(b);
 function classKey(name,grade){
  const alike={'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X','У':'Y'};
  return String(grade??'')+':'+String(name||'').normalize('NFKC').toUpperCase().replace(/\s+/g,'').replace(/[АВСЕНКМОРТХУ]/g,c=>alike[c]);
 }
 function diagnostic(a){
  const value=a?.status==='graded'?score(a.totalScore,21):null;
  return {id:a?.id||'',status:a?.status||'not_started',score:value,invalid:a?.status==='graded'&&value===null};
 }
 function build(input={},filters={}){
  const dashboard=input.dashboard||{},workspace=input.workspace||{},classes=arr(workspace.classes);
  const users=arr(dashboard.users).filter(u=>u.id&&!u.deletedAt&&(!u.role||u.role==='student'));
  const options=new Map();
  for(const c of [...classes,...users.map(u=>({name:u.className,grade:u.grade}))]){
   if(!c.name)continue;const key=classKey(c.name,c.grade);
   if(!options.has(key))options.set(key,{key,name:String(c.name),grade:String(c.grade??'')});
  }
  const diagnostics=new Map();
  const userMap=new Map(users.map(u=>[u.id,u]));
  for(const a of arr(dashboard.attempts)){
   const u=userMap.get(a.userId);if(!u||(a.grade&&String(a.grade)!==String(u.grade)))continue;
   const type=a.attemptType||'baseline';if(!['baseline','final'].includes(type))continue;
   const key=a.userId+':'+type;if(newer(a,diagnostics.get(key)))diagnostics.set(key,a);
  }
  const taskLists=new Map(users.map(u=>[u.id,new Map()]));
  const byClass=new Map();for(const u of users){const k=classKey(u.className,u.grade);if(!byClass.has(k))byClass.set(k,[]);byClass.get(k).push(u);}
  const classMap=new Map(classes.map(c=>[c.id,c]));
  const catalogue=new Map(arr(input.content?.tasks).map(t=>[t.sourceKey,t]));
  for(const a of arr(workspace.assignments)){
   if(a.status&&a.status!=='published')continue;
   const cls=a.classInfo||classMap.get(a.classId),task=a.task;if(!cls||!task||task.active===false||task.active==='false')continue;
   const key=(task.sourceKey||task.id||a.taskId)+':'+String(task.grade??cls.grade);
   const inClass=byClass.get(classKey(cls.name,cls.grade))||[];
   const latest=new Map();for(const at of arr(a.attempts))if(newer(at,latest.get(at.userId)))latest.set(at.userId,at);
   for(const u of inClass){
    if(task.grade&&String(task.grade)!==String(u.grade))continue;
    const list=taskLists.get(u.id),previous=list.get(key),candidate=latest.get(u.id);
    const best=candidate&&(!previous?.attempt||newer(candidate,previous.attempt))?candidate:previous?.attempt;
    list.set(key,{key,task:catalogue.get(task.sourceKey)||task,attempt:best,assignmentId:best===candidate?a.id:previous?.assignmentId||a.id});
   }
  }
  const search=String(filters.search||'').trim().toLocaleLowerCase();
  let rows=users.filter(u=>(!filters.classKey||classKey(u.className,u.grade)===filters.classKey)&&(!search||(u.name+' '+u.login).toLocaleLowerCase().includes(search))).map(u=>{
   const baseline=diagnostic(diagnostics.get(u.id+':baseline')),final=diagnostic(diagnostics.get(u.id+':final'));
   const paired=baseline.score!==null&&final.score!==null,delta=paired?final.score-baseline.score:null;
   const work=[...taskLists.get(u.id).values()].map(w=>({...w,score:w.attempt?.status==='graded'?score(w.attempt.score,15):null}));
   const ids=new Set(work.map(w=>w.attempt?.id).filter(Boolean)),times=new Map();
   for(const tm of arr(input.timings))if(tm.userId===u.id&&ids.has(tm.attemptId)&&['task','correction'].includes(tm.phase||'task')){
    const value=score(tm.totalSeconds,Number.MAX_SAFE_INTEGER);if(value===null)continue;
    const key=tm.id||tm.attemptId+':'+(tm.phase||'task'),old=times.get(key);
    if(!old||value>old.seconds)times.set(key,{seconds:value,phase:tm.phase||'task'});
   }
   const current=final.score!==null?final.score:baseline.score,reasons=[];
   if(current!==null&&current<14)reasons.push(final.score!==null?'final-low':'baseline-low');
   if(delta!==null&&delta<0)reasons.push('decrease');
   if(work.some(w=>w.score!==null&&w.score<10))reasons.push('task-low');
   const pendingDiagnostics=[baseline,final].filter(d=>d.status==='submitted').length;
   const pendingTasks=work.filter(w=>w.attempt?.status==='submitted').length;
   return {user:{id:u.id,name:u.name||u.login||'',login:u.login||'',grade:String(u.grade||''),className:u.className||'',active:u.active},baseline,final,paired,delta,support:reasons.length>0,reasons,pending:pendingDiagnostics+pendingTasks,pendingDiagnostics,
    tasks:{work,total:work.length,started:work.filter(w=>w.attempt).length,submitted:work.filter(w=>['submitted','graded'].includes(w.attempt?.status)).length,graded:work.filter(w=>w.score!==null).length,pending:pendingTasks,average:mean(work.filter(w=>w.score!==null).map(w=>w.score)),seconds:[...times.values()].some(t=>t.phase==='task')?[...times.values()].filter(t=>t.phase==='task').reduce((n,t)=>n+t.seconds,0):null,correctionSeconds:[...times.values()].some(t=>t.phase==='correction')?[...times.values()].filter(t=>t.phase==='correction').reduce((n,t)=>n+t.seconds,0):null}};
  });
  if(filters.status==='support')rows=rows.filter(r=>r.support);
  else if(filters.status==='paired')rows=rows.filter(r=>r.paired);
  else if(filters.status==='pending')rows=rows.filter(r=>r.pending>0);
  else if(filters.status==='unpaired')rows=rows.filter(r=>!r.paired);
  rows.sort((a,b)=>a.user.name.localeCompare(b.user.name));
  const paired=rows.filter(r=>r.paired),difficulties=new Map();
  for(const r of rows)for(const w of r.tasks.work){
   if(!difficulties.has(w.key))difficulties.set(w.key,{key:w.key,task:w.task,values:[],low:0,pending:0});
   const d=difficulties.get(w.key);if(w.score!==null){d.values.push(w.score);if(w.score<10)d.low++;}if(w.attempt?.status==='submitted')d.pending++;
  }
  return {rows,classes:[...options.values()].sort((a,b)=>a.key.localeCompare(b.key)),filters:{...filters},
   summary:{students:rows.length,paired:paired.length,baseline:mean(paired.map(r=>r.baseline.score)),final:mean(paired.map(r=>r.final.score)),delta:mean(paired.map(r=>r.delta)),improved:paired.filter(r=>r.delta>0).length,unchanged:paired.filter(r=>r.delta===0).length,decreased:paired.filter(r=>r.delta<0).length,support:rows.filter(r=>r.support).length,pendingDiagnostics:rows.reduce((n,r)=>n+r.pendingDiagnostics,0),pendingTasks:rows.reduce((n,r)=>n+r.tasks.pending,0)},
   difficulties:[...difficulties.values()].filter(d=>d.values.length||d.pending).map(d=>({key:d.key,task:d.task,assessed:d.values.length,low:d.low,pending:d.pending,average:mean(d.values)})).sort((a,b)=>b.low-a.low||b.assessed-a.assessed||a.key.localeCompare(b.key))};
 }
 function html(report,options={}){
  const ru=options.lang==='ru',t=(kk,rr)=>ru?rr:kk,s=report.summary;
  const number=n=>n===null?'—':Number.isInteger(n)?String(n):n.toLocaleString(ru?'ru-RU':'kk-KZ',{maximumFractionDigits:1});
  const signed=n=>n===null?'—':(n>0?'+':'')+number(n);
  const status=d=>d.invalid?t('Бағаны нақтылау қажет','Нужно уточнить оценку'):({not_started:t('Басталмаған','Не начато'),in_progress:t('Орындалуда','В процессе'),submitted:t('Бағалау күтілуде','Ожидает оценки'),graded:t('Бағаланды','Оценено')})[d.status]||t('Дерек жоқ','Нет данных');
  const mark=d=>d.score===null?`<span class="monitor-muted">${status(d)}</span>`:`<strong>${number(d.score)}<small>/21</small></strong>`;
  const time=n=>n===null?'—':Math.floor(n/60)+' '+t('мин','мин')+' '+Math.floor(n%60)+' '+t('с','с');
  const taskTitle=task=>task?.[ru?'ru':'kk']?.title||task?.title||task?.sourceKey||t('Тапсырма','Задание');
  const reason=key=>({'baseline-low':t('Бастапқы нәтиже 14/21-ден төмен','Начальный результат ниже 14/21'),'final-low':t('Қорытынды нәтиже 14/21-ден төмен','Итоговый результат ниже 14/21'),decrease:t('Қорытынды балл бастапқыдан төмен','Итоговый балл ниже начального'),'task-low':t('Бағаланған оқу жұмысы 10/15-тен төмен','Оценённая учебная работа ниже 10/15')})[key];
  const delta=r=>r.delta===null?`<span class="monitor-muted">${t('Екі баға қажет','Нужны две оценки')}</span>`:`<span class="monitor-delta ${r.delta>0?'positive':r.delta<0?'negative':'neutral'}">${signed(r.delta)} ${t('балл','баллов')}</span>`;
  const opt=(value,label,current)=>`<option value="${esc(value)}" ${value===current?'selected':''}>${esc(label)}</option>`;
  const selected=report.rows.find(r=>r.user.id===options.selectedId);
  const metric=(label,value,sub)=>`<article class="monitor-metric"><span>${label}</span><strong>${value}</strong><small>${sub}</small></article>`;
  const graphRow=(label,value,cls)=>`<div class="monitor-bar-row"><span>${label}</span><div class="monitor-track" aria-hidden="true"><span class="${cls}" style="width:${value===null?0:value/21*100}%"></span></div><strong>${number(value)}${value===null?'':'/21'}</strong></div>`;
  let out=`<section class="monitoring" aria-labelledby="monitor-title"><div class="monitor-heading"><div><span class="eyebrow">${t('МҰҒАЛІМ МОНИТОРИНГІ','МОНИТОРИНГ УЧИТЕЛЯ')}</span><h2 id="monitor-title">${t('Оқу ілгерілеуі бір көріністе','Учебный прогресс в одном окне')}</h2><p class="muted">${t('Бастапқы деңгей, қорытынды нәтиже және келесі оқу қадамы.','Начальный уровень, итоговый результат и следующий учебный шаг.')}</p></div><button type="button" data-do="monitor-export" ${report.rows.length?'':'disabled'}>${t('Кестені CSV жүктеу','Скачать таблицу CSV')}</button></div>
  <div class="monitor-freshness" role="status"><span>${options.loadedAt?t('Кабинетке жүктелген уақыт: ','Загружено в кабинет: ')+esc(new Date(options.loadedAt).toLocaleString(ru?'ru-RU':'kk-KZ')):t('Кабинетте жүктелген деректер көрсетілген.','Показаны данные, загруженные в кабинет.')}</span><small>${t('Сүзгілер мен талдау жергілікті есептеледі. Жаңа нәтижелер үшін жоғарыдағы «Жаңарту» батырмасын басыңыз.','Фильтры и анализ рассчитываются локально. Для новых результатов нажмите «Обновить» вверху.')}</small></div>
  <form class="monitor-filters" data-form="monitor-filter"><label>${t('Сынып','Класс')}<select data-monitor-class>${opt('',t('Барлық сынып','Все классы'),report.filters.classKey)}${report.classes.map(c=>opt(c.key,c.name,report.filters.classKey)).join('')}</select></label><label>${t('Оқушыны іздеу','Поиск ученика')}<input type="search" data-monitor-search value="${esc(report.filters.search||'')}" placeholder="${t('Аты-жөні немесе логин','ФИО или логин')}"></label><label>${t('Көрсетілетін оқушылар','Показать учеников')}<select data-monitor-status>${[['','Барлығы','Все'],['paired','Екі диагностикасы бағаланған','Обе диагностики оценены'],['unpaired','Салыстыру толық емес','Сравнение неполное'],['pending','Бағалау күтілуде','Ожидают оценки'],['support','Қолдау белгілері бар','Есть признаки затруднений']].map(([key,kk,rr])=>opt(key,t(kk,rr),report.filters.status||'')).join('')}</select></label><button type="submit">${t('Іздеу','Найти')}</button><button type="button" data-do="monitor-reset" class="quiet">${t('Сүзгіні тазарту','Сбросить фильтры')}</button></form>
  <div class="monitor-metrics">${metric(t('Оқушы','Учеников'),s.students,t('Таңдалған сүзгіде','В выбранном фильтре'))}${metric(t('Салыстыруға дайын','Готовы к сравнению'),s.paired+'/'+s.students,t('Екі диагностика да бағаланған','Обе диагностики оценены'))}${metric(t('Орташа өзгеріс','Среднее изменение'),signed(s.delta),t('Балл · бірдей оқушылар бойынша','Баллы · по одним и тем же ученикам'))}${metric(t('Бағалау кезегі','Ожидают оценки'),s.pendingTasks+s.pendingDiagnostics,t('Диагностика: ','Диагностики: ')+s.pendingDiagnostics+' · '+t('Оқу жұмысы: ','Учебные работы: ')+s.pendingTasks)}</div>
  <div class="monitor-grid"><article class="card"><h3>${t('Бастапқы → қорытынды','Начало → итог')}</h3><p class="compact muted">${t('Екі диагностикасы да бағаланған бірдей','Одни и те же ученики с двумя оценёнными диагностиками:')} ${s.paired} ${t('оқушы. Ең жоғары балл — 21.','чел. Максимум — 21 балл.')}</p>${graphRow(t('Бастапқы','Начальная'),s.baseline,'baseline')}${graphRow(t('Қорытынды','Итоговая'),s.final,'final')}<p class="monitor-distribution"><span>${t('Өсті','Рост')}: <b>${s.improved}</b></span><span>${t('Өзгермеді','Без изменений')}: <b>${s.unchanged}</b></span><span>${t('Төмендеді','Снижение')}: <b>${s.decreased}</b></span></p>${!s.paired?`<p class="note">${t('Салыстыру үшін екі диагностика да бағалануы керек. Жоқ баға нөлге ауыстырылмайды.','Для сравнения нужны оценки обеих диагностик. Отсутствующая оценка не заменяется нулём.')}</p>`:''}</article>
  <article class="card"><h3>${t('Келесі педагогикалық қадам','Следующий педагогический шаг')}</h3><strong class="monitor-support-count">${s.support} ${t('оқушыда қолдау белгісі бар','учеников с признаками затруднений')}</strong><p>${t('Белгі — мұғалімге жұмысты қарап, көмек түрін таңдауға арналған бағдар. Бұл автоматты баға немесе оқушыға берілген қорытынды емес.','Метка помогает учителю проверить работу и выбрать поддержку. Это не автоматическая оценка и не заключение об ученике.')}</p><details><summary>${t('Қандай өлшемдер қолданылды?','Какие критерии использованы?')}</summary><p class="compact">${t('Соңғы бағаланған диагностика 14/21-ден төмен; қорытынды балл төмендеген; не бағаланған оқу жұмысы 10/15-тен төмен. Бағаланбаған жұмыс қиындық деп саналмайды. Алдыңғы сынып деңгейінің жұмыстары бұл есепке кірмейді.','Последняя оценённая диагностика ниже 14/21; итоговый балл снизился; либо оценённая учебная работа ниже 10/15. Непроверенная работа не считается затруднением. Работы прежней параллели в расчёт не входят.')}</p></details></article></div>
  <section class="card monitor-table-card"><h3>${t('Оқушы бойынша салыстыру','Сравнение по ученикам')}</h3><p class="compact muted">${t('Диагностика — /21, оқу жұмысы — /15. Оқушыны ашып, жеке деректерін қараңыз.','Диагностики — /21, учебные работы — /15. Откройте ученика для подробностей.')}</p><div class="table-wrap"><table class="monitor-table"><caption class="monitor-sr">${t('Диагностика мен оқу барысы','Диагностики и учебный прогресс')}</caption><thead><tr>${[t('Оқушы','Ученик'),t('Бастапқы','Начальная'),t('Қорытынды','Итоговая'),t('Өзгеріс','Изменение'),t('Оқу жұмыстары','Учебные работы'),t('Қолдау','Поддержка'),t('Толығырақ','Подробнее')].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${report.rows.map(r=>`<tr><th scope="row"><strong>${esc(r.user.name)}</strong><small>${esc(r.user.className)}${r.user.active===false?' · '+t('Бұғатталған','Заблокирован'):''}</small></th><td>${mark(r.baseline)}</td><td>${mark(r.final)}</td><td>${delta(r)}</td><td><strong>${r.tasks.submitted}/${r.tasks.total}</strong><small>${t('тапсырылған','сдано')} · ${t('бағаланған','оценено')}: ${r.tasks.graded}</small></td><td>${r.support?`<span class="monitor-flag">${t('Қарау қажет','Нужно просмотреть')}</span>`:'—'}</td><td><button type="button" class="small" data-do="monitor-student" data-id="${esc(r.user.id)}" aria-label="${esc(r.user.name)} · ${t('Толығырақ','Подробнее')}" aria-expanded="${selected?.user.id===r.user.id}">${t('Ашу','Открыть')}</button></td></tr>`).join('')||`<tr><td colspan="7">${t('Оқушы табылмады. Сүзгіні өзгертіңіз немесе оқушыларды тіркеңіз.','Ученики не найдены. Измените фильтр или зарегистрируйте учеников.')}</td></tr>`}</tbody></table></div></section>`;
  if(selected){const r=selected;out+=`<section class="card monitor-detail" id="monitor-student-detail" tabindex="-1" aria-labelledby="monitor-student-name"><div class="row between"><div><span class="eyebrow">${t('ЖЕКЕ МОНИТОРИНГ','ИНДИВИДУАЛЬНЫЙ МОНИТОРИНГ')}</span><h3 id="monitor-student-name">${esc(r.user.name)}</h3><p class="compact muted">${esc(r.user.className)}</p></div><button type="button" data-do="monitor-close" class="quiet">${t('Жабу','Закрыть')}</button></div><div class="monitor-person-scores"><span>${t('Бастапқы','Начальная')}: ${mark(r.baseline)}</span><span>${t('Қорытынды','Итоговая')}: ${mark(r.final)}</span>${delta(r)}</div>${r.reasons.length?`<ul>${r.reasons.map(k=>`<li>${reason(k)}</li>`).join('')}</ul>`:`<p>${t('Жүктелген бағалар бойынша қолдау белгісі анықталмады. Бұл барлық дағды меңгерілді дегенді білдірмейді.','По загруженным оценкам признаков затруднений не выявлено. Это не означает освоения всех навыков.')}</p>`}<p>${t('Белсенді уақыт','Активное время')}: <strong>${time(r.tasks.seconds)}</strong> · ${t('Түзету уақыты','Время исправлений')}: <strong>${time(r.tasks.correctionSeconds)}</strong></p><p class="compact muted">${t('Уақыт — тіркелген белсенді әрекеттің шамасы. Ол бағаға әсер етпейді; тіркелмеген уақыт қалпына келтірілмейді.','Время — приблизительная длительность зарегистрированной активности. Оно не влияет на оценку; незаписанное время не восстанавливается.')}</p><div class="table-wrap"><table><thead><tr><th>${t('Оқу тапсырмасы','Учебная задача')}</th><th>${t('Күйі','Статус')}</th><th>${t('Балл','Балл')}</th></tr></thead><tbody>${r.tasks.work.map(w=>`<tr><td>${esc(taskTitle(w.task))}</td><td>${status({status:w.attempt?.status||'not_started',invalid:w.attempt?.status==='graded'&&w.score===null})}</td><td>${w.score===null?'—':number(w.score)+'/15'}</td></tr>`).join('')||`<tr><td colspan="3">${t('Осы сыныпқа жарияланған тапсырма жоқ.','Нет заданий, опубликованных для этого класса.')}</td></tr>`}</tbody></table></div></section>`;}
  out+=`<section class="card monitor-table-card"><h3>${t('Қай тапсырмаларда көмек қажет?','В каких заданиях нужна помощь?')}</h3><p class="compact muted">${t('Әр оқушының әр тапсырмадағы соңғы жұмысы есептеледі. Қолдау шегі — мұғалім бағасы 10/15-тен төмен.','Учитывается последняя работа каждого ученика по каждой задаче. Порог поддержки — оценка учителя ниже 10/15.')}</p><div class="table-wrap"><table><thead><tr>${[t('Тапсырма','Задача'),t('Бағаланған','Оценено'),t('Орташа /15','Средний /15'),t('Шектен төмен','Ниже порога'),t('Бағалау күтілуде','Ожидают оценки')].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${report.difficulties.map(d=>`<tr><th scope="row">${esc(taskTitle(d.task))}<small>${esc(d.task.grade||'')} ${t('сынып','класс')}</small></th><td>${d.assessed}</td><td>${number(d.average)}</td><td>${d.low}/${d.assessed}</td><td>${d.pending}</td></tr>`).join('')||`<tr><td colspan="5">${t('Бағаланған немесе тапсырылған оқу жұмысы әлі жоқ.','Оценённых или сданных учебных работ пока нет.')}</td></tr>`}</tbody></table></div></section><p class="compact muted monitor-method-note">${t('Бұл — оқу барысының сипаттамалық есебі. Балл өзгерісі платформаның тиімділігін өздігінен дәлелдемейді; тапсырмалардың салыстырмалылығы мен оқыту жағдайын мұғалім ескереді.','Это описательный отчёт об обучении. Изменение баллов само по себе не доказывает эффективность платформы; учитель учитывает сопоставимость заданий и условия обучения.')}</p></section>`;
  return out;
 }
 function csv(report,lang='kk'){
  const t=(kk,ru)=>lang==='ru'?ru:kk;
  const display=d=>d.score!==null?d.score:d.invalid?t('Бағаны нақтылау қажет','Уточнить оценку'):d.status==='submitted'?t('Бағалау күтілуде','Ожидает оценки'):d.status==='in_progress'?t('Орындалуда','В процессе'):t('Басталмаған','Не начато');
  return [[t('Оқушы','Ученик'),t('Сынып','Класс'),t('Бастапқы /21','Начальная /21'),t('Қорытынды /21','Итоговая /21'),t('Айырма, балл','Разница, баллы'),t('Тапсырылған жұмыс','Сдано работ'),t('Жарияланған тапсырма','Опубликовано задач'),t('Бағаланған жұмыс','Оценено работ'),t('Қолдау белгісі','Признак затруднения')],...report.rows.map(r=>[r.user.name,r.user.className,display(r.baseline),display(r.final),r.delta??'',r.tasks.submitted,r.tasks.total,r.tasks.graded,r.support?t('Қарау қажет','Нужно просмотреть'):''])];
 }
 return Object.freeze({classKey,build,html,csv});
});
