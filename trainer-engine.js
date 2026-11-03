/* Task-specific scenes consume real interpreter frames, never model answers. */
(function(scope){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const scenes=[
 ['greeting','👋','Танысу алаңы','Знакомство','name'],
 ['gate','🚪','Жас шегі','Возрастной порог','age'],
 ['calendar','📅','Апта күнтізбесі','Календарь недели','day'],
 ['letters','🔤','Сөз зертханасы','Лаборатория слов','word,result'],
 ['bars','🧾','Апталық шығын','Расходы за неделю','expenses,total,average'],
 ['meter','💡','Электр есептегіші','Счётчик энергии','kwh,price,payment'],
 ['route','🚌','Маршрут зертханасы','Лаборатория маршрута','distance,speed,time'],
 ['formula','📐','Индекс есебі','Расчёт индекса','weight,height,bmi'],
 ['receipt','🍎','Жеміс дүкені','Фруктовая лавка','price,kg,total'],
 ['bars','🏫','Сынып деректері','Данные класса','ages,average'],
 ['temperature','🌡️','Бес күннің ауа райы','Погода за пять дней','temperatures'],
 ['exchange','💱','Валюта айырбастау','Обмен валют','money,usd,eur'],
 ['route','👟','Қадамнан қашықтыққа','От шагов к расстоянию','steps,step_length,km'],
 ['calendar','📚','Оқу күнтізбесі','Календарь чтения','pages,per_day,days'],
 ['receipt','📱','Байланыс чегі','Чек связи','calls,sms,payment'],
 ['formula','🧮','Үш сан зертханасы','Лаборатория трёх чисел','a,b,c,total,product'],
 ['parity','⚖️','Жұптар алаңы','Пары чисел','number,remainder'],
 ['temperature','🌡️','Екі температура шкаласы','Две шкалы температуры','celsius,fahrenheit'],
 ['formula','➕','Қосу зертханасы','Лаборатория сложения','a,b,result'],
 ['loop','🤖','Тақ сандар жолы','Дорожка нечётных чисел','n,i'],
 ['loop','🪙','Жұп сандар жинағы','Накопитель чётных чисел','n,i,sum_even'],
 ['letters','🔎','Әріптер есептегіші','Счётчик букв','text,letter,count'],
 ['equation','⚖️','Теңдеу таразысы','Весы уравнения','a,b,x'],
 ['gate','🎯','Нәтиже шкаласы','Шкала результата','score'],
 ['receipt','🏷️','Жеңілдік чегі','Чек со скидкой','price,discount,final_price'],
 ['meter','📶','Интернет есептегіші','Счётчик интернета','gb,payment'],
 ['route','⛽','Автобус сапары','Поездка автобуса','distance,consumption,price,fuel,cost'],
 ['temperature','🌤️','Апталық ауа райы','Погода за неделю','temperatures,average,above'],
 ['savings','🏦','Жинақтың өсуі','Рост накоплений','balance,monthly,rate,month'],
 ['receipt','🍽️','Асхана кассасы','Касса столовой','prices,count,total,payment'],
 ['water','💧','Су шығыны','Расход воды','water,daily_limit,total,average,above']
 ].map((s,i)=>({sourceKey:'guide-'+String(i+1).padStart(2,'0'),kind:s[0],icon:s[1],kk:s[2],ru:s[3],variables:s[4].split(',')}));
 const labels={name:['Аты-жөні','Имя'],age:['Жас','Возраст'],day:['Күн','День'],word:['Сөз','Слово'],result:['Кодтағы нәтиже','Результат в коде'],total:['Барлығы','Итого'],average:['Орташа','Среднее'],kwh:['Энергия, кВт·сағ','Энергия, кВт·ч'],price:['Баға','Цена'],payment:['Төлем','Платёж'],distance:['Қашықтық','Расстояние'],speed:['Жылдамдық','Скорость'],time:['Уақыт','Время'],weight:['Салмақ','Масса'],height:['Бой','Рост'],bmi:['Есептелген индекс','Рассчитанный индекс'],kg:['Килограмм','Килограммы'],money:['Теңге','Тенге'],usd:['АҚШ доллары','Доллары США'],eur:['Еуро','Евро'],steps:['Қадам саны','Число шагов'],km:['Километр','Километры'],pages:['Бет саны','Число страниц'],per_day:['Күніне бет','Страниц в день'],days:['Күн саны','Число дней'],calls:['Қоңырау','Звонки'],sms:['SMS','SMS'],remainder:['Қалдық','Остаток'],celsius:['Цельсий','Цельсий'],fahrenheit:['Фаренгейт','Фаренгейт'],n:['Жоғарғы шек','Верхняя граница'],i:['Цикл мәні','Значение цикла'],sum_even:['Жинақталған қосынды','Накопленная сумма'],text:['Мәтін','Текст'],letter:['Ағымдағы әріп','Текущая буква'],count:['Саны','Количество'],a:['a','a'],b:['b','b'],c:['c','c'],x:['x','x'],score:['Балл','Балл'],discount:['Жеңілдік, %','Скидка, %'],final_price:['Соңғы баға','Итоговая цена'],gb:['Гигабайт','Гигабайты'],consumption:['100 км-ге шығын','Расход на 100 км'],fuel:['Жанармай','Топливо'],cost:['Шығын','Стоимость'],above:['Шектен асқандар','Выше порога'],balance:['Қаражат','Средства'],monthly:['Ай сайынғы салым','Ежемесячный взнос'],rate:['Мөлшерлеме, %','Ставка, %'],month:['Ай','Месяц'],daily_limit:['Тәуліктік шек','Суточный предел']};
 const fmt=v=>typeof v==='string'?v:JSON.stringify(v);
 function scene(key){return scenes.find(s=>s.sourceKey===key)||{kind:'formula',icon:'🐍',kk:'Python зертханасы',ru:'Лаборатория Python',variables:[]};}
 function model(key,frame){const s=scene(key),vars=frame?.variables||{};return {scene:s,frame,values:Object.entries(vars).filter(([k])=>!k.startsWith('_')),preferred:s.variables.filter(k=>Object.hasOwn(vars,k)).map(k=>[k,vars[k]]),output:String(frame?.output||'')};}
 function render(key,frame,lang='kk',stale=false){
  const m=model(key,frame),s=m.scene,ru=lang==='ru',t=(k,r)=>ru?r:k;
  const values=m.preferred.length?m.preferred:m.values;
  const arrays=m.values.filter(([,v])=>Array.isArray(v)),strings=m.values.filter(([,v])=>typeof v==='string');
  let art='';
  if(['bars','temperature','water'].includes(s.kind)){
   const data=arrays[0]?.[1]||values.filter(([,v])=>typeof v==='number').map(([,v])=>v),max=Math.max(1,...data.filter(Number.isFinite).map(Math.abs));
   art=`<div class="scene-bars" role="list" aria-label="${t('Кодтағы сандық мәндер','Числовые значения из кода')}">${data.slice(0,30).map((v,i)=>`<div class="scene-bar" role="listitem"><span>${esc(v)}</span><i style="height:${Number.isFinite(v)?Math.max(3,Math.abs(v)/max*92):3}px" class="${Number(v)<0?'negative':''}"></i><small>${i+1}</small></div>`).join('')}</div>`;
  }else if(s.kind==='letters'){
   art=strings.slice(0,2).map(([k,v])=>`<div class="scene-letters"><small>${esc(k)}</small><div>${Array.from(v).slice(0,60).map((c,i)=>`<span>${esc(c===' '?'␣':c)}<small>${i}</small></span>`).join('')}</div></div>`).join('');
  }else if(s.kind==='calendar'&&key==='guide-03'){
   const day=frame?.variables?.day;art=`<div class="scene-week">${(ru?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:['Дс','Сс','Ср','Бс','Жм','Сб','Жс']).map((d,i)=>`<span class="${day===i+1?'selected':''}">${d}<small>${i+1}</small></span>`).join('')}</div>`;
  }else if(s.kind==='route'||s.kind==='loop'){
   const track=s.kind==='loop'&&Number.isSafeInteger(frame?.variables?.i)?Array.from({length:Math.min(20,Math.max(0,frame.variables.i))},(_,i)=>i+1):(frame?.inputs||[]).slice(-8);
   art=`<div class="scene-route"><span>${s.icon}</span>${track.map(v=>`<i>${esc(fmt(v))}</i>`).join('')}<b>${frame?.line?t('Жол ','Строка ')+frame.line:'…'}</b></div>`;
  }else if(s.kind==='savings'){
   const month=frame?.variables?.month;art=`<div class="scene-week">${Array.from({length:12},(_,i)=>`<span class="${month===i+1?'selected':''}">${i+1}</span>`).join('')}</div>`;
  }else if(s.kind==='parity'&&Number.isSafeInteger(frame?.variables?.number)&&Math.abs(frame.variables.number)<=40){
   art=`<div class="scene-pairs">${Array.from({length:Math.abs(frame.variables.number)},(_,i)=>`<span class="${i%2?'pair-end':''}">●</span>`).join('')}</div>`;
  }else if(s.kind==='gate'){
   art=`<div class="scene-paths"><span class="${frame?.branch===true?'selected':''}">↗ ${t('Иә тармағы','Ветка да')}</span><span class="${frame?.branch===false?'selected':''}">↘ ${t('Жоқ тармағы','Ветка нет')}</span></div>`;
  }else if(s.kind==='receipt'){
   art=`<div class="scene-receipt"><b>CODE THINK · ${t('КАССА','КАССА')}</b>${values.map(([k,v])=>`<div><span>${esc(labels[k]?.[ru?1:0]||k)}</span><strong>${esc(fmt(v))}</strong></div>`).join('')||`<p>${t('Касса кодтағы мәндерді күтуде…','Касса ожидает значения из кода…')}</p>`}<small>${t('Чек — осы қадамдағы мәндер. Төлемді код есептейді.','Чек отражает значения этого шага. Платёж вычисляет код.')}</small></div>`;
  }else if(s.kind==='greeting'){
   art=`<div class="scene-chat"><span>👤</span><p>${esc(m.output||t('Кейіпкер бағдарлама хабарламасын күтуде…','Персонаж ждёт сообщение программы…'))}</p></div>`;
  }else if(s.kind==='meter'){
   art=`<div class="scene-meter"><span>${s.icon}</span><div>${values.length?values.map(([k,v])=>`<small>${esc(k)}</small><strong>${esc(fmt(v))}</strong>`).join(''):t('Есептегіш мәнін код анықтайды','Показания определяет код')}</div></div>`;
  }else if(s.kind==='exchange'){
   art=`<div class="scene-paths">${['money','usd','eur'].map(k=>`<span>${k==='money'?'₸':k==='usd'?'$':'€'} <strong>${Object.hasOwn(frame?.variables||{},k)?esc(fmt(frame.variables[k])):'—'}</strong></span>`).join('<b>→</b>')}</div>`;
  }else if(s.kind==='equation'){
   art=`<div class="scene-equation">${Object.hasOwn(frame?.variables||{},'a')?esc(fmt(frame.variables.a)):'a'} · x + ${Object.hasOwn(frame?.variables||{},'b')?esc(fmt(frame.variables.b)):'b'} = 0 <span>⚖️</span> x: ${Object.hasOwn(frame?.variables||{},'x')?esc(fmt(frame.variables.x)):'?'}</div>`;
  }else if(s.kind==='calendar'){
   art=`<div class="scene-chat"><span>📖</span><p>${values.map(([k,v])=>esc(labels[k]?.[ru?1:0]||k)+': '+esc(fmt(v))).join(' · ')||t('Кітап жоспарын кодпен жаса','Составь план чтения кодом')}</p></div>`;
  }else if(s.kind==='formula'){
   art=`<div class="scene-paths"><span>📥 ${t('Кіріс','Ввод')}: ${esc((frame?.inputs||[]).map(fmt).join(' · ')||'—')}</span><b>→ 🧮 →</b><span>📤 ${esc(m.output.trim()||'—')}</span></div>`;
  }
  return `<section class="task-scene ${stale?'scene-stale':''}" data-scene-kind="${s.kind}"><div class="scene-title"><span aria-hidden="true">${s.icon}</span><div><strong>${esc(s[lang]||s.kk)}</strong><small>${t('Оқушы кодының нақты қадамы','Реальный шаг кода ученика')}${frame?.line?' · '+t('жол ','строка ')+frame.line:''}</small></div></div>${stale?`<p class="note">${t('Код не кіріс өзгерді. Көрініс қайта есептелгенше алдыңғы қадам көрсетілген.','Код или ввод изменён. До пересчёта показан предыдущий шаг.')}</p>`:''}${art}<div class="scene-values">${values.slice(0,16).map(([k,v])=>`<div class="${frame?.changed?.includes(k)?'scene-changed':''}"><small>${esc(labels[k]?.[ru?1:0]||k)} <code>${esc(k)}</code></small><strong>${esc(fmt(v))}</strong></div>`).join('')||`<p class="muted">${t('Кодты жазып, кіріс мәндерін енгіз. Мәндер орындалған қадамнан кейін пайда болады.','Напиши код и введи данные. Значения появятся после выполнения шага.')}</p>`}</div>${frame?.operation?`<p class="scene-operation"><code>${esc(frame.operation)}</code></p>`:''}${frame?.failed?`<p class="error">${t('Осы қадамда қате бар. Көрініс дайын жауаппен алмастырылмайды.','На этом шаге ошибка. Вид не подменяется готовым ответом.')}</p>`:''}<div class="scene-output"><small>${t('Осы қадамда экранға шыққаны','Вывод на этом шаге')}</small><pre>${esc(m.output||'—')}</pre></div><small class="muted">${t('Мәндер, шарт пен нәтиже сенің кодыңнан алынады. Бұл дұрыс жауаптың дәлелі емес.','Значения, условие и вывод взяты из твоего кода. Это не доказательство правильного ответа.')}</small></section>`;
 }
 function activity(options={}){
  const idle=options.idleMs||90000;let last=null,touched=null,pending=0;
  return {touch(now){touched=now;},tick(now,enabled){if(last!==null&&enabled&&touched!==null){const end=Math.min(now,touched+idle),start=last;if(end>start)pending+=Math.min(end-start,5000);}last=now;return pending;},take(){const seconds=Math.floor(pending/1000);pending-=seconds*1000;return seconds;},reset(){last=null;touched=null;pending=0;},isActive(now){return touched!==null&&now<=touched+idle;},get pendingMs(){return pending;}};
 }
 scope.CT_TRAINER={scenes,scene,model,render,activity};
})(typeof window==='undefined'?globalThis:window);
