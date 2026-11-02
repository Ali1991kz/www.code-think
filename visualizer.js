(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = value => typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
  const captions = {Assign:'Мән беру', AnnAssign:'Мән беру', AugAssign:'Мәнді өзгерту', If:'Шартты тексеру', For:'Цикл қадамы', While:'Цикл шартын тексеру', Expr:'Әрекет', Break:'Циклден шығу', Continue:'Келесі айналымға өту', Pass:'Өткізу'};
  let uid = 0;

  function mount(root, options = {}) {
    const id = 'ctv' + (++uid);
    const russian = options.lang === 'ru';
    const dictionary = {"Python коды":"Код Python","Кіріс мәндері":"Входные данные","Әр input() үшін жеке жол":"Отдельная строка для каждого input()","▶ Визуализациялау":"▶ Визуализировать","Тоқтату":"Остановить","Кодты орындап, оның әр қадамын зерттеңіз.":"Выполните код и изучите каждый шаг.","Қолдау көрсетілетін мүмкіндіктер":"Поддерживаемые возможности","Кодтың орындалуы":"Выполнение кода","Басына қайту":"В начало","Алдыңғы қадам":"Предыдущий шаг","▶ Ойнату":"▶ Воспроизвести","Ⅱ Үзіліс":"Ⅱ Пауза","Келесі қадам":"Следующий шаг","Соңғы қадам":"Последний шаг","Жылдамдық":"Скорость","Орындалу қадамы":"Шаг выполнения","Орындалған код жолы":"Выполненная строка кода","Айнымалылар әлемі":"Мир переменных","3D көрініс":"Вид 3D","Бұрыш":"Угол","3D бұрышы":"Угол 3D","Нәтиже":"Результат","Осы қадамдағы нәтиже":"Результат на этом шаге","Әзірге нәтиже жоқ.":"Пока нет результата.","Блок-схема":"Блок-схема","Белсенді блок ерекшеленеді. Блокты басып, оның орындалған қадамына өтіңіз.":"Активный блок выделен. Нажмите на блок, чтобы перейти к шагу его выполнения.","Код құрылымы осында көрсетіледі.":"Здесь появится структура кода.","Айнымалылар код орындалған сайын осында пайда болады.":"Здесь будут появляться переменные по мере выполнения кода.","Алдымен нәтижені болжаңыз. Содан кейін «Визуализациялау» батырмасын басыңыз.":"Сначала предположите результат. Затем нажмите «Визуализировать».","Python кодының блок-схемасы":"Блок-схема кода Python","Бастау":"Начало","Аяқтау":"Конец","Алгоритм басталады":"Начало алгоритма","Алгоритм аяқталады":"Конец алгоритма","Иә":"Да","Жоқ":"Нет","Шығу":"Выход","Келесі":"Далее","Мән беру":"Присваивание","Мәнді өзгерту":"Изменение значения","Шартты тексеру":"Проверка условия","Цикл қадамы":"Шаг цикла","Цикл шартын тексеру":"Проверка условия цикла","Әрекет":"Действие","Циклден шығу":"Выход из цикла","Келесі айналымға өту":"Следующая итерация","Өткізу":"Пропуск","Код орындалып, қадамдар дайындалуда…":"Выполняем код и записываем шаги…","Python дайындалуда…":"Подготавливаем Python…","Код қадамдары есептелуде…":"Записываем шаги выполнения…","Python жүктелуде… Алғашқы ашылуы біраз уақыт алады.":"Загружается Python… Первая загрузка занимает некоторое время.","Өзгерістерді көру үшін қайта іске қосыңыз.":"Запустите снова, чтобы увидеть изменения.","Жаңа кодты визуализациялаңыз.":"Визуализируйте новый код.","Код өзгерді. Нәтижені қайта есептеңіз.":"Код изменён. Пересчитайте результат.","Код немесе кіріс мәні өзгерді. «Визуализациялау» батырмасын басыңыз.":"Код или входные данные изменены. Нажмите «Визуализировать».","Келесі қадамда алғашқы мән пайда болады.":"На следующем шаге появится первое значение.","Бұл блок осы кіріс мәндерімен орындалмады.":"Этот блок не выполнялся с данными входными значениями.","Код орындалмады. Сол жақтағы қате хабарын қарап, кодты түзетіңіз.":"Код не выполнен. Прочитайте сообщение слева и исправьте код.","Орындалған қадамдар жоқ.":"Выполненных шагов нет.","Код қатесін түзеткеннен кейін блок-схема пайда болады.":"Блок-схема появится после исправления ошибки в коде.","Төменде — индекс. Күлгін бағандар — теріс мәндер.":"Внизу — индекс. Фиолетовые столбцы обозначают отрицательные значения.","Орындау тоқтатылды. Кодты өзгертіп, қайта бастаңыз.":"Выполнение остановлено. Измените код и запустите снова.","Python жүктелмеді. Интернетті тексеріп, қайта қосыңыз.":"Python не загрузился. Проверьте интернет и повторите запуск.","Код ұзақ орындалғандықтан тоқтатылды. Цикл мен кіріс көлемін тексеріңіз.":"Код остановлен из-за длительного выполнения. Проверьте цикл и объём входных данных.","input, print, сандар, мәтін, тізім, индекстер, тілімдер, формулалар, if/elif/else, for, while, break, continue, тізімдік өрнектер және негізгі кіріктірілген функциялар. import, файлмен жұмыс, жеке функциялар мен кластар бұл оқу режиміне кірмейді.":"input, print, числа, строки, списки, индексы, срезы, формулы, if/elif/else, for, while, break, continue, списковые выражения и основные встроенные функции. import, файлы, собственные функции и классы не входят в учебный режим.","Ең көбі 1200 қадам, тізімнің алғашқы 100 элементі, мәтіннің алғашқы 300 таңбасы көрсетіледі. Python жүктелуіне интернет қажет.":"До 1200 шагов, первые 100 элементов списка и ограниченная часть строки. Для загрузки Python нужен интернет."};
    const translate = text => {
      if(!russian)return text;
      const raw=String(text),trim=raw.trim();
      if(dictionary[trim])return raw.replace(trim,dictionary[trim]);
      return raw.replace(/(\d+) қадам дайын\. → арқылы бастаңыз немесе ойнатыңыз\./g,'Готово шагов: $1. Нажмите → или воспроизведите.')
        .replace(/Кіріс: (\d+) мән оқылды/g,'Прочитано входных значений: $1').replace(/Кіріс: (\d+)/g,'Ввод: $1')
        .replace(/(\d+)-жол · /g,'Строка $1 · ').replace(/ · мәндерді салыстыру/g,' · сравнение значений')
        .replace(/(Мән беру|Мәнді өзгерту|Шартты тексеру|Цикл қадамы|Цикл шартын тексеру|Әрекет|Циклден шығу|Келесі айналымға өту|Өткізу)$/g,x=>dictionary[x]);
    };
    function localize() {
      if(!russian)return;
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode()){
        if(node.parentElement?.closest('textarea,pre,code,.v-scene,.v-explanation,.v-operation'))continue;
        if(node.parentElement?.closest('.v-flow-node')&&!node.parentElement.matches('.v-node-sub')&&!['start','end'].includes(node.parentElement.closest('.v-flow-node').dataset.node))continue;
        node.textContent=translate(node.textContent);
      }
      root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(el=>{
        if(el.closest('.v-flow-node')&&!['start','end'].includes(el.closest('.v-flow-node').dataset.node))return;
        ['aria-label','title','placeholder'].forEach(attr=>{if(el.hasAttribute(attr))el.setAttribute(attr,translate(el.getAttribute(attr)));});
      });
    }

    let result = null, position = 0, worker = null, timeout = null, playback = null, disposed = false;
    let threeD = false, busy = false;
    root.classList.add('ct-visualizer');
    root.innerHTML = `
      <div class="v-workbench">
        <section class="v-editor v-panel">
          <div class="v-panel-heading"><span><b>01</b> Python коды</span><button type="button" data-action="download" class="v-mini">↓ .py</button></div>
          <label class="v-sr" for="${id}-code">Python коды</label>
          <textarea id="${id}-code" data-v="code" class="v-code-input" spellcheck="false" autocapitalize="off" ${options.readOnly?'readonly':''}>${esc(options.code || '')}</textarea>
          <div class="v-input-wrap"><label for="${id}-input">Кіріс мәндері <small>Әр input() үшін жеке жол</small></label>
          <textarea id="${id}-input" data-v="input" class="v-input" spellcheck="false" ${options.readOnly?'readonly':''}>${esc(options.input || '')}</textarea></div>
          <div class="v-run-row"><button type="button" data-action="run" class="v-primary">▶ Визуализациялау</button><button type="button" data-action="cancel" hidden class="v-secondary">Тоқтату</button></div>
          <p class="v-status" data-v="status" role="status">Кодты орындап, оның әр қадамын зерттеңіз.</p>
          <details class="v-support"><summary>Қолдау көрсетілетін мүмкіндіктер</summary><p>input, print, сандар, мәтін, тізім, индекстер, тілімдер, формулалар, if/elif/else, for, while, break, continue, тізімдік өрнектер және негізгі кіріктірілген функциялар. import, файлмен жұмыс, жеке функциялар мен кластар бұл оқу режиміне кірмейді.</p><p>Ең көбі 1200 қадам, тізімнің алғашқы 100 элементі, мәтіннің алғашқы 300 таңбасы көрсетіледі. Python жүктелуіне интернет қажет.</p></details>
        </section>
        <section class="v-stage v-panel">
          <div class="v-panel-heading"><span><b>02</b> Кодтың орындалуы</span><span class="v-step-count" data-v="counter">0 / 0</span></div>
          <div class="v-player">
            <button type="button" data-action="first" aria-label="Басына қайту" title="Басына қайту">↶</button>
            <button type="button" data-action="prev" aria-label="Алдыңғы қадам" title="Алдыңғы қадам">←</button>
            <button type="button" data-action="play" class="v-play">▶ Ойнату</button>
            <button type="button" data-action="next" aria-label="Келесі қадам" title="Келесі қадам">→</button>
            <button type="button" data-action="last" aria-label="Соңғы қадам" title="Соңғы қадам">⇥</button>
            <label>Жылдамдық <select data-v="speed"><option value="1500">0.5×</option><option value="850" selected>1×</option><option value="400">2×</option><option value="150">4×</option></select></label>
          </div>
          <label class="v-sr" for="${id}-seek">Орындалу қадамы</label><input id="${id}-seek" class="v-seek" data-v="seek" type="range" min="0" max="0" value="0" disabled>
          <div class="v-explanation" data-v="explanation">Алдымен нәтижені болжаңыз. Содан кейін «Визуализациялау» батырмасын басыңыз.</div>
          <div class="v-code-trace" data-v="codeTrace" aria-label="Орындалған код жолы"></div>
          <div class="v-operation" data-v="operation" hidden></div>
          <div class="v-scene-heading"><h3>Айнымалылар әлемі</h3><div class="v-view-controls"><button type="button" data-action="3d" aria-pressed="false" class="v-mini">3D көрініс</button><label class="v-angle" hidden>Бұрыш <input data-v="angle" type="range" min="-25" max="25" value="-10" aria-label="3D бұрышы"></label></div></div>
          <div class="v-scene" data-v="scene"><div class="v-empty">Айнымалылар код орындалған сайын осында пайда болады.</div></div>
          <div data-v="chart" class="v-chart-wrap"></div>
          <div class="v-console-heading"><h3>Нәтиже</h3><span data-v="inputCount">Кіріс: 0</span></div>
          <pre data-v="output" class="v-output" aria-label="Осы қадамдағы нәтиже">Әзірге нәтиже жоқ.</pre>
        </section>
        <section class="v-flow-panel v-panel"><div class="v-panel-heading"><span><b>03</b> Блок-схема</span></div><p class="v-flow-hint">Белсенді блок ерекшеленеді. Блокты басып, оның орындалған қадамына өтіңіз.</p><div data-v="flow" class="v-flow"><div class="v-empty">Код құрылымы осында көрсетіледі.</div></div></section>
      </div>`;
    if(options.inline){
      root.classList.add('ct-inline-visualizer');
      const editor=root.querySelector('.v-editor'),stage=root.querySelector('.v-stage');
      stage.querySelector('.v-panel-heading').after(editor.querySelector('[data-v="status"]'));
      stage.append(editor.querySelector('.v-support'));editor.hidden=true;
    }
    const q = name => root.querySelector(`[data-v="${name}"]`);
    const btn = name => root.querySelector(`[data-action="${name}"]`);
    const status = (message, error=false) => {q('status').textContent=translate(message); q('status').classList.toggle('v-error', error);};
    function stopPlay() { clearInterval(playback); playback=null; btn('play').textContent=translate('▶ Ойнату'); }
    function stopWorker() { clearTimeout(timeout); if(worker) worker.terminate(); worker=null; busy=false; btn('cancel').hidden=true; btn('run').disabled=false; q('code').readOnly=!!options.readOnly; q('input').readOnly=!!options.readOnly; }
    function controls() {
      const available = !!result?.frames?.length && !busy;
      ['first','prev','next','last','play'].forEach(n=>btn(n).disabled=!available);
      if(available) {btn('first').disabled=btn('prev').disabled=position===0;btn('next').disabled=btn('last').disabled=position===result.frames.length-1;}
      q('seek').disabled=!available;
    }
    function invalidate() {
      stopPlay(); result=null; position=0;
      q('flow').innerHTML='<div class="v-empty">Жаңа кодты визуализациялаңыз.</div>';
      q('scene').innerHTML='<div class="v-empty">Код өзгерді. Нәтижені қайта есептеңіз.</div>';
      q('chart').innerHTML=''; q('codeTrace').innerHTML='';q('operation').hidden=true;q('output').textContent=russian?'Пока нет результата.':'Әзірге нәтиже жоқ.';
      q('counter').textContent='0 / 0';q('seek').value=0;q('seek').max=0;q('inputCount').textContent='Кіріс: 0';
      q('explanation').textContent='Код немесе кіріс мәні өзгерді. «Визуализациялау» батырмасын басыңыз.';
      status('Өзгерістерді көру үшін қайта іске қосыңыз.');controls();
      if(options.inline){q('explanation').textContent=russian?'Код или ввод изменён. Сделай прогноз и нажми «Выполнить» или «По шагам».':'Код немесе кіріс өзгерді. Болжам жасап, «Орындау» не «Қадамдап көру» батырмасын бас.';}
      if(options.inline){q('scene').innerHTML='<div class="v-empty">'+(russian?'Код изменён. Пересчитайте результат.':'Код өзгерді. Нәтижені қайта есептеңіз.')+'</div>';localize();}
      options.onEdit?.(q('code').value, q('input').value);
    }
    function fail(message) {stopWorker();status(message,true);controls();}
    function run() {
      if(busy||disposed) return;
      stopPlay(); invalidate(); busy=true; controls(); btn('run').disabled=true;btn('cancel').hidden=false;
      q('code').readOnly=q('input').readOnly=true;
      status('Python дайындалуда…');q('explanation').textContent='Код орындалып, қадамдар дайындалуда…';
      if(location.protocol==='file:') {fail('Алдымен жобадағы START_WINDOWS.cmd файлын іске қосыңыз. Python үшін жергілікті сервер қажет.');return;}
      try {worker = new Worker('visual-worker.js');} catch(e) {fail(e.message);return;}
      timeout=setTimeout(()=>fail('Python жүктелмеді. Интернетті тексеріп, қайта қосыңыз.'),120000);
      worker.onerror=e=>fail('Орындаушы қатесі: '+(e.message||'Қайта іске қосыңыз.'));
      worker.onmessage=({data})=>{
        if(data.type==='status') status(data.message);
        if(data.type==='ready') {clearTimeout(timeout);timeout=setTimeout(()=>fail('Код ұзақ орындалғандықтан тоқтатылды. Цикл мен кіріс көлемін тексеріңіз.'),8000);status('Код қадамдары есептелуде…');}
        if(data.type==='fatal') fail(data.message);
        if(data.type==='result') {
          stopWorker();result=data.result;position=0;
          q('seek').max=Math.max(0,result.frames.length-1);
          buildFlow();render();
          if(!result.frames.length) {q('explanation').textContent='Код орындалмады. Сол жақтағы қате хабарын қарап, кодты түзетіңіз.';q('scene').innerHTML='<div class="v-empty">Орындалған қадамдар жоқ.</div>';}
          if(result.error) status(`${result.error.line?result.error.line+'-жол. ':''}${result.error.type}: ${result.error.message}`,true);
          else status(`${Math.max(0,result.frames.length-1)} қадам дайын. → арқылы бастаңыз немесе ойнатыңыз.`);
          options.onResult?.(result);
        }
      };
      worker.postMessage({code:q('code').value,input:q('input').value});
    }
    function buildFlow() {
      if(!result.nodes.length) {q('flow').innerHTML='<div class="v-empty">Код қатесін түзеткеннен кейін блок-схема пайда болады.</div>';return;}
      const positions={};
      result.nodes.forEach((n,i)=>positions[n.id]={x:210+Math.min(n.depth,4)*18,y:45+i*100});
      const height=result.nodes.length*100;
      let svg=`<svg viewBox="0 0 480 ${height}" role="img" aria-label="Python кодының блок-схемасы"><defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>`;
      result.edges.forEach((e,i)=>{
        const a=positions[e.from],b=positions[e.to];if(!a||!b)return;
        const direct=b.y-a.y===100 && e.label!=='Жоқ';
        const lane=e.label==='Жоқ'?435+(i%3)*10:35+(i%3)*12;
        const path=direct?`M${a.x},${a.y+32} L${b.x},${b.y-32}`:`M${a.x+(lane<a.x?-120:120)},${a.y} H${lane} V${b.y} H${b.x+(lane<b.x?-120:120)}`;
        svg+=`<g data-edge-from="${e.from}" data-edge-to="${e.to}"><path class="v-flow-edge" d="${path}" marker-end="url(#${id}-arrow)"/>${e.label?`<text class="v-edge-label" x="${direct?a.x+12:lane+3}" y="${direct?a.y+56:a.y-9}">${esc(e.label)}</text>`:''}</g>`;
      });
      result.nodes.forEach(n=>{
        const {x,y}=positions[n.id],branch=['If','For','While'].includes(n.kind);
        const shape=branch?`<path d="M${x},${y-34} L${x+120},${y} L${x},${y+34} L${x-120},${y} Z"/>`:`<rect x="${x-120}" y="${y-30}" width="240" height="60" rx="${['Start','End'].includes(n.kind)?30:9}"/>`;
        const label=n.label.length>31?n.label.slice(0,28)+'…':n.label;
        svg+=`<g class="v-flow-node" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(n.label)}"><title>${esc(n.label)}</title>${shape}<text x="${x}" y="${y-5}" text-anchor="middle">${esc(label)}</text><text class="v-node-sub" x="${x}" y="${y+13}" text-anchor="middle">${n.line?n.line+'-жол · '+(captions[n.kind]||n.kind):n.label==='Бастау'?'Алгоритм басталады':'Алгоритм аяқталады'}</text></g>`;
      });
      svg+='</svg>';q('flow').innerHTML=svg;
      q('flow').querySelectorAll('[data-node]').forEach(node=>{
        const jump=()=>{
          const key=node.dataset.node;
          if(key==='start') seek(0);
          else if(key==='end'&&result.ok)seek(result.frames.length-1);
          else {let target=result.frames.findIndex((f,i)=>i>position&&String(f.line)===key);if(target<0)target=result.frames.findIndex(f=>String(f.line)===key);if(target>=0)seek(target);else status('Бұл блок осы кіріс мәндерімен орындалмады.');}
        };
        node.addEventListener('click',jump);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();jump();}});
      });
    }
    function explanation(f) {
      if(russian){
        if(!f.line)return 'Начальное состояние. Значения переменных ещё не заданы.';
        const n=result.nodes.find(n=>n.line===f.line);let text='Строка '+f.line+' · '+translate(captions[n?.kind]||'Әрекет')+'. ';
        if(f.failed)return text+'На этом действии возникла ошибка. Проверьте код и входные данные.';
        if(f.branch!==null)text+=['For','While'].includes(n?.kind)?(f.branch?'Переходим в тело цикла. ':'Повторение завершено. '):(f.branch?'Условие истинно: ветка «Да». ':'Условие ложно: ветка «Нет». ');
        if(f.changed.length)text+=f.changed.map(k=>k+' = '+fmt(f.variables[k])).join('; ')+'. ';
        const previous=result.frames[position-1];if(previous&&f.inputs.length>previous.inputs.length)text+='Прочитано входное значение. ';
        if(previous&&f.output!==previous.output)text+='Вывод дополнен. ';if(position===result.frames.length-1&&result.ok)text+='Программа завершена.';
        return text;
      }
      if(!f.line)return 'Бастапқы күй. Айнымалыларға әлі мән берілген жоқ.';
      const n=result.nodes.find(n=>n.line===f.line);
      let text=`${f.line}-жол · ${captions[n?.kind]||'Әрекет'}. `;
      if(f.failed)return text+'Осы әрекетте қате пайда болды. Кіріс мәні мен кодты тексеріңіз.';
      if(f.branch!==null)text+=['For','While'].includes(n?.kind)?(f.branch?'Цикл денесіне өтеміз. ':'Қайталау аяқталды. '):(f.branch?'Шарт ақиқат: «Иә» тармағы. ':'Шарт жалған: «Жоқ» тармағы. ');
      if(f.changed.length)text+=f.changed.map(k=>`${k} = ${fmt(f.variables[k])}`).join('; ')+'. ';
      const previous=result.frames[position-1];
      if(previous&&f.inputs.length>previous.inputs.length)text+='Кіріс мәні оқылды. ';
      if(previous&&f.output!==previous.output)text+='Экрандағы нәтиже толықты. ';
      if(position===result.frames.length-1&&result.ok)text+='Программа аяқталды.';
      return text;
    }
    function renderScene(f) {
      const values=Object.entries(f.variables);
      const prior=result.frames[position-1]?.variables||{};
      q('scene').innerHTML=values.length?values.map(([name,v])=>{
        const changed=f.changed.includes(name);
        const cells=Array.isArray(v)?v:(typeof v==='string'?Array.from(v):null);
        let content;
        if(cells)content=`<div class="v-cells">${cells.slice(0,100).map((x,i)=>`<span class="v-cell ${JSON.stringify(prior[name]?.[i])!==JSON.stringify(x)?'v-cell-changed':''}"><b>${esc(typeof x==='object'?fmt(x):x)}</b><small>${i}</small></span>`).join('')||(russian?'<span class="v-muted">Пустой список / строка</span>':'<span class="v-muted">Бос тізім / мәтін</span>')}</div>`;
        else content=`<strong class="v-value">${esc(fmt(v))}</strong>`;
        return `<article class="v-variable ${changed?'v-changed':''}"><div class="v-var-name"><code>${esc(name)}</code><span>${Array.isArray(v)?(russian?'список':'тізім'):typeof v==='string'?(russian?'строка':'мәтін'):typeof v==='number'?(russian?'число':'сан'):typeof v==='boolean'?(russian?'логическое':'логикалық'):(russian?'значение':'мән')}${changed?(russian?' · изменилось':' · өзгерді'):''}</span></div>${content}${changed&&name in prior?`<div class="v-before">${russian?'Раньше:':'Бұрын:'} ${esc(fmt(prior[name]))}</div>`:''}</article>`;
      }).join(''):'<div class="v-empty">'+(russian?'На следующем шаге появится первое значение.':'Келесі қадамда алғашқы мән пайда болады.')+'</div>';
      q('scene').classList.toggle('v-is-3d',threeD);
      renderChart(f);
    }
    function renderChart(f) {
      let name, values;
      const numeric=Object.entries(f.variables).filter(([,v])=>Array.isArray(v)&&v.length&&v.every(x=>typeof x==='number'&&Number.isFinite(x)));
      if(numeric.length) [name,values]=numeric[0];
      else if(options.scene==='history' && typeof f.variables.balance==='number') {
        name='balance · өзгеру тарихы';values=result.frames.slice(0,position+1).filter(x=>x.changed.includes('balance')).map(x=>x.variables.balance);
      }
      if(!values?.length) {q('chart').innerHTML='';return;}
      values=values.slice(0,100);
      const low=Math.min(0,...values),high=Math.max(0,...values),span=high-low||1;
      const y=v=>110-(v-low)/span*85, zero=y(0), w=Math.max(400,values.length*45);
      const barW=(w-50)/values.length;
      q('chart').innerHTML=`<h3>${esc(name)} · мәндерді салыстыру</h3><div class="v-chart-scroll"><svg role="img" aria-label="${esc(name)} мәндері" viewBox="0 0 ${w} 145" style="min-width:${Math.min(w,1300)}px"><line x1="25" y1="${zero}" x2="${w-10}" y2="${zero}" stroke="#8194aa"/>${values.map((v,i)=>{const top=Math.min(y(v),zero),height=Math.max(2,Math.abs(y(v)-zero)),x=30+i*barW;return `<g><rect class="v-chart-bar" x="${x}" y="${top}" width="${Math.max(4,barW-9)}" height="${height}" fill="${v<0?'#b18cff':'#42d5e8'}"/><text x="${x+barW/2-4}" y="${v>=0?top-6:top+height+12}" text-anchor="middle">${esc(Number(v.toFixed(2)))}</text><text x="${x+barW/2-4}" y="140" text-anchor="middle">${i}</text></g>`;}).join('')}</svg></div><small>Төменде — индекс. Күлгін бағандар — теріс мәндер.</small>`;
    }
    function render() {
      controls();const f=result?.frames[position];if(!f)return;
      options.onFrame?.(f,position);
      q('counter').textContent=`${position} / ${result.frames.length-1}`;q('seek').value=position;
      q('explanation').textContent=explanation(f);
      q('operation').hidden=!f.operation;
      q('operation').textContent=f.operation?(/^print\(/.test(f.operation)?(russian?'На экран добавлено: ':'Экранға қосылды: ')+String(f.output||'').slice(String(result.frames[Math.max(0,position-1)]?.output||'').length).trim():(russian?'Вычисляем: ':'Есептейміз: ')+f.operation):'';
      q('output').textContent=f.output||(russian?'Пока нет результата.':'Әзірге нәтиже жоқ.');
      q('inputCount').textContent=`Кіріс: ${f.inputs.length} мән оқылды`;
      q('codeTrace').innerHTML=result.source.split('\n').map((line,i)=>`<div class="v-trace-line ${f.line===i+1?'v-current-line':''}"><span>${i+1}</span><code>${esc(line)||' '}</code></div>`).join('');
      const active=q('codeTrace').querySelector('.v-current-line');
      if(active)q('codeTrace').scrollTop=Math.max(0,active.offsetTop-65);
      renderScene(f);
      q('flow').querySelectorAll('[data-node]').forEach(n=>n.classList.toggle('v-active',n.dataset.node===(f.line?String(f.line):'start')));
      q('flow').querySelectorAll('[data-edge-from]').forEach(e=>e.classList.toggle('v-active-edge',e.dataset.edgeFrom===(f.line?String(f.line):'start')&&e.dataset.edgeTo===(f.nextLine?String(f.nextLine):'end')&&!f.failed));
      const activeNode=q('flow').querySelector('.v-active');
      if(activeNode){const flow=q('flow');flow.scrollTop=Math.max(0,flow.scrollTop+activeNode.getBoundingClientRect().top-flow.getBoundingClientRect().top-100);}
      if(position===result.frames.length-1)stopPlay();localize();
    }
    function seek(n) {stopPlay();position=Math.max(0,Math.min(n,(result?.frames.length||1)-1));render();}
    function play() {
      if(playback){stopPlay();return;}if(!result?.frames.length)return;
      if(position===result.frames.length-1)position=0;
      btn('play').textContent=translate('Ⅱ Үзіліс');
      playback=setInterval(()=>{position++;render();},Number(q('speed').value));
    }
    btn('run').addEventListener('click',run);
    btn('cancel').addEventListener('click',()=>{stopWorker();status('Орындау тоқтатылды. Кодты өзгертіп, қайта бастаңыз.');controls();});
    btn('first').addEventListener('click',()=>seek(0));btn('last').addEventListener('click',()=>seek(result.frames.length-1));
    btn('prev').addEventListener('click',()=>seek(position-1));btn('next').addEventListener('click',()=>seek(position+1));
    btn('play').addEventListener('click',play);q('seek').addEventListener('input',()=>seek(Number(q('seek').value)));
    q('speed').addEventListener('change',()=>{if(playback){stopPlay();play();}});
    btn('3d').addEventListener('click',()=>{threeD=!threeD;btn('3d').setAttribute('aria-pressed',String(threeD));root.querySelector('.v-angle').hidden=!threeD;q('scene').classList.toggle('v-is-3d',threeD);});
    q('angle').addEventListener('input',()=>q('scene').style.setProperty('--turn',q('angle').value+'deg'));
    q('code').addEventListener('input',invalidate);q('input').addEventListener('input',invalidate);
    q('code').addEventListener('keydown',event=>{if(event.key==='Tab'&&!options.readOnly){event.preventDefault();const el=event.target,start=el.selectionStart;el.setRangeText('    ',start,el.selectionEnd,'end');invalidate();}});
    btn('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([q('code').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=(options.taskId||'code-think')+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    if(options.inline)q('explanation').textContent=russian?'Сначала запиши прогноз. Нажми «Выполнить» или «По шагам» слева.':'Алдымен болжам жаз. Сол жақтағы «Орындау» не «Қадамдап көру» батырмасын бас.';
    controls();localize();
    function load(snapshot,settings={}){
      stopPlay();stopWorker();result=snapshot;position=Math.max(0,Math.min(settings.position||0,(result.frames?.length||1)-1));
      q('seek').max=Math.max(0,(result.frames?.length||1)-1);buildFlow();render();
      if(result.error)status((result.error.line?result.error.line+' · ':'')+result.error.type+': '+result.error.message,true);
      else status((russian?'Готово шагов: ':'Дайын қадамдар: ')+Math.max(0,(result.frames?.length||1)-1));
      if(settings.autoplay&&result.frames?.length>1)play();
    }
    function setSource(code,input){q('code').value=code;q('input').value=input;invalidate();}
    function message(text){status(text,false);if(!result?.frames?.length)q('explanation').textContent=text;}
    return {run,load,setSource,message, getCode:()=>q('code').value, getInput:()=>q('input').value, destroy:()=>{disposed=true;stopPlay();stopWorker();root.innerHTML='';}};
  }

  function open(options) {
    const dialog=document.createElement('dialog');dialog.className='v-dialog';
    dialog.innerHTML=`<header class="v-dialog-header"><div><span class="v-eyebrow">CODE THINK · ВИЗУАЛИЗАЦИЯ</span><h2>${esc(options.title||'Кодтың орындалуы')}</h2></div><button type="button" class="v-secondary" aria-label="${options.lang==='ru'?'Закрыть визуализацию':'Визуализацияны жабу'}">✕ ${options.lang==='ru'?'Закрыть':'Жабу'}</button></header><div class="v-dialog-body"></div>`;
    document.body.append(dialog);const view=mount(dialog.querySelector('.v-dialog-body'),options);
    const close=()=>dialog.close();dialog.querySelector('header button').addEventListener('click',close);
    dialog.addEventListener('close',()=>{view.destroy();dialog.remove();},{once:true});
    dialog.showModal();view.run();
  }
  window.CodeThinkVisual={mount,open};
})();
