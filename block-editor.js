/* Lazy, local-only Blockly studio. It never executes code or writes Firebase. */
(function(scope){
 'use strict';
 const model=scope.CT_BLOCK_MODEL,assetBase=new URL('vendor/blockly/',document.baseURI),scripts=new Map();
 let libraries=null,locales=null,current=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const words={
  kk:{title:'Блоктармен құрастыр',close:'Жабу · Python-ға қайту',intro:'Блокты таңда, алаңға сүйреп әкел және әрекеттерді бір-біріне жалға. Python коды оң жақта бірден жаңарады.',python:'Блоктардан жасалған Python',apply:'Python кодына қолдану',cancel:'Қолданбай жабу',overwrite:'Редактордағы қазіргі Python кодын осы кодпен ауыстыруға келісемін.',note:'Блоктарды құрастыру кодты орындамайды және баға қоймайды. «Қолдану» басқан соң болжамыңды жазып, кәдімгі «Орындау» батырмасымен тексер.',help:'Қалай жұмыс істейді?',help1:'«Кіріс / шығыс» санатынан экранға шығару блогын ал. Мән ұяшығына мәтін не есептеу блогын жалға.',help2:'Шарт пен циклдің ішіне әрекет блоктарын орналастыр. range соңғы шекті қамтымайды; тізім индексі 0-ден басталады.',help3:'Кодты қолдан да, кемінде екі түрлі кіріспен тексер. Нәтижеге қоса, алгоритмнің неге жұмыс істейтінін түсіндір.',help4:'Python-нан блоктарға автоматты түрлендіру жоқ. Бұрынғы Python коды тек «Қолдану» басылғанда өзгереді. Блок жобасы әр жұмысқа бөлек сақталады.',saved:'Блок жобасы осы браузерде сақталды.',unsaved:'Браузер сақтай алмады. Жобаны JSON файлына жүктеп ал.',loaded:'Сақталған блок жобасы қалпына келтірілді.',corrupt:'Сақталған блок жобасы ашылмады. Бастапқы сақталған нұсқа өзгертілмейді; JSON көшірмесін жүктеп алып, жаңа блоктар құрастыр.',download:'JSON жүктеу',import:'JSON ашу',importLabel:'Блок жобасының JSON файлы',undo:'↶ Болдырмау',redo:'↷ Қайталау',clear:'Блоктарды тазалау',clearConfirm:'Алаңдағы блоктарды тазала. Қате бассаң, «Болдырмау» батырмасын қолдан.',clearButton:'Тазалауды растау',ready:'Блоктар жалғанды. Кодты қолдануға болады.',loading:'Блок редакторы жүктелуде…',error:'Блок редакторы ашылмады. Python редакторы жұмыс істейді. Бетті жаңартып, қайта көр.',changed:'Python коды өзгеріп кетті. Оны жоғалтпау үшін редакторды жауып, қайта аш.',functions:'Функциялар мен күрделі Python өрнектері Python-да орындалады. Қадамдық көрініс оларды қолдамаса, Python нәтижесін қара.',invalid:'Кодты жасау мүмкін болмады. Блок ұяшықтары мен атауларын тексер.',exportFailed:'Файлды жүктеу мүмкін болмады. Браузердің жүктеу рұқсатын тексер.',restore:'Алдыңғы Python кодын қайтару',restoreHint:'Қолдануға дейінгі кодтың көшірмесі осы браузерде сақталады.',limit:'Ең көбі 240 блок. Жоба тек осы құрылғыда сақталады.'},
  ru:{title:'Собери из блоков',close:'Закрыть · вернуться к Python',intro:'Выбери блок, перетащи на поле и соедини действия. Код Python справа обновляется сразу.',python:'Python из блоков',apply:'Применить код Python',cancel:'Закрыть без применения',overwrite:'Согласен заменить текущий код Python в редакторе этим кодом.',note:'Сборка блоков не запускает код и не выставляет оценку. После применения запиши прогноз и проверь обычной кнопкой «Выполнить».',help:'Как это работает?',help1:'В категории «Ввод / вывод» выбери вывод на экран. Присоедини к входу значения блок текста или вычисления.',help2:'Помести действия внутрь условия или цикла. range не включает конечную границу; индексы списков начинаются с 0.',help3:'Примени код и проверь хотя бы с двумя разными входами. Объясни, почему алгоритм работает, а не только его результат.',help4:'Автоматического перевода Python в блоки нет. Прежний код меняется только при применении. Для каждой работы сохраняется отдельный проект блоков.',saved:'Проект блоков сохранён в этом браузере.',unsaved:'Браузер не смог сохранить проект. Скачай JSON.',loaded:'Сохранённый проект блоков восстановлен.',corrupt:'Сохранённый проект не открылся. Исходная сохранённая версия не меняется; скачай резервный JSON и собери новые блоки.',download:'Скачать JSON',import:'Открыть JSON',importLabel:'JSON-файл проекта блоков',undo:'↶ Отменить',redo:'↷ Повторить',clear:'Очистить блоки',clearConfirm:'Очисти поле блоков. Если ошибся, нажми «Отменить».',clearButton:'Подтвердить очистку',ready:'Блоки соединены. Можно применить код.',loading:'Загружаем редактор блоков…',error:'Редактор блоков не открылся. Редактор Python работает. Обнови страницу и повтори.',changed:'Код Python изменился. Чтобы не потерять его, закрой и снова открой блоки.',functions:'Функции и сложные выражения выполняются в Python. Если пошаговый вид их не поддерживает, смотри результат Python.',invalid:'Не удалось построить код. Проверь входы блоков и имена.',exportFailed:'Не удалось скачать файл. Проверь разрешение на загрузки.',restore:'Вернуть предыдущий код Python',restoreHint:'Копия кода до применения сохраняется в этом браузере.',limit:'Не более 240 блоков. Проект хранится только на этом устройстве.'}
 };
 function loadScript(path){
  if(scripts.has(path))return scripts.get(path);
  const job=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(path,assetBase).href;s.onload=()=>resolve();s.onerror=()=>{s.remove();scripts.delete(path);reject(Error('Blockly asset: '+path));};document.head.append(s);});
  scripts.set(path,job);return job;
 }
 async function ensure(){
  if(libraries)return libraries;
  libraries=(async()=>{await loadScript('blockly_compressed.js');await loadScript('blocks_compressed.js');await loadScript('python_compressed.js');await loadScript('msg/en.js');const en={...scope.Blockly.Msg};await loadScript('msg/ru.js');locales={en,ru:{...scope.Blockly.Msg}};return scope.Blockly;})();
  try{return await libraries;}catch(e){libraries=null;throw e;}
 }
 function download(text,name){const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 function close(){if(!current)return;const c=current;c.flush?.();current=null;clearTimeout(c.timer);c.observer?.disconnect();c.explainer?.destroy();c.ws?.dispose();if(c.dialog.open)c.dialog.close();c.dialog.remove();c.options.onClose?.();}
 async function open(options){
  close();const lang=options.lang==='ru'?'ru':'kk',s=words[lang];
  if(!options.userId||!options.context||typeof options.onApply!=='function')throw Error(s.error);
  const key=model.storageKey(options.project,options.userId,options.context),dialog=document.createElement('dialog');dialog.className='ct-block-dialog';dialog.setAttribute('aria-labelledby','ct-block-title');
  dialog.innerHTML=`<div class="ct-block-shell"><header class="ct-block-head"><div><h2 id="ct-block-title">${s.title}</h2><p>${esc(options.title||'Python')}</p></div><button type="button" data-block-close aria-label="${s.close}">✕</button></header><div class="ct-block-body"><div class="ct-block-canvas-wrap"><div class="ct-block-canvas" data-block-canvas></div></div><aside class="ct-block-sidebar"><p class="ct-block-note">${s.intro}</p>${options.scenario?`<details><summary>${lang==='ru'?'Условие задания':'Есеп шарты'}</summary><p>${esc(options.scenario)}</p></details>`:''}<h3>${s.python}</h3><textarea class="ct-block-preview" readonly spellcheck="false" aria-label="${s.python}"></textarea><p class="ct-block-status" data-block-status role="status">${s.loading}</p><p class="ct-block-note" data-block-functions hidden>${s.functions}</p><label class="ct-block-confirm" hidden><input type="checkbox" data-block-replace>${s.overwrite}</label><p class="ct-block-note">${s.note}</p><details><summary>${s.help}</summary><ol><li>${s.help1}</li><li>${s.help2}</li><li>${s.help3}</li><li>${s.help4}</li></ol><p>${s.limit}</p></details><details><summary>${s.clear}</summary><p>${s.clearConfirm}</p><button type="button" data-block-clear>${s.clearButton}</button></details><span class="ct-block-storage" data-block-storage></span></aside></div><footer class="ct-block-footer"><button type="button" data-block-undo>${s.undo}</button><button type="button" data-block-redo>${s.redo}</button><button type="button" data-block-export>${s.download}</button><button type="button" data-block-import>${s.import}</button><input type="file" accept=".json,application/json" data-block-file aria-label="${s.importLabel}" hidden><button type="button" class="primary ct-block-apply" data-block-apply disabled>${s.apply}</button><button type="button" data-block-close>${s.cancel}</button></footer></div>`;
  document.body.append(dialog);const c={dialog,options,key,lang,ws:null,timer:null,observer:null,report:null,corrupt:null,original:String(options.readCurrentCode?.()||'')};current=c;
  const q=sel=>dialog.querySelector(sel),status=(text,error=false)=>{q('[data-block-status]').textContent=text;q('[data-block-status]').dataset.error=String(error);};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{if(current===c)close();});
  dialog.querySelectorAll('[data-block-close]').forEach(b=>b.onclick=close);dialog.showModal();
  try{
   const B=await ensure();if(current!==c)return;
   B.setLocale(lang==='ru'?{...locales.ru,...scope.CT_BLOCK_RU}:{...locales.en,...scope.CT_BLOCK_KK});
   const g=scope.python.pythonGenerator;model.install(B,g,lang);
   c.ws=B.inject(q('[data-block-canvas]'),{toolbox:model.toolbox(lang),horizontalLayout:matchMedia('(max-width:850px)').matches,toolboxPosition:'start',renderer:'zelos',media:assetBase.href+'media/',sounds:false,trashcan:true,maxBlocks:model.limit,oneBasedIndex:false,zoom:{controls:true,wheel:true,startScale:.85,maxScale:1.5,minScale:.45,scaleSpeed:1.1},move:{scrollbars:true,drag:true,wheel:true},grid:{spacing:24,length:2,colour:'#d1deeb',snap:true}});
   let raw=null;try{raw=localStorage.getItem(key);}catch{}
   if(raw){try{B.serialization.workspaces.load(model.parse(B,raw).workspace,c.ws);q('[data-block-storage]').textContent=s.loaded;}catch{c.ws.clear();c.corrupt=raw;q('[data-block-storage]').textContent=s.corrupt;}}
   function update(save=false){
    if(current!==c)return;
    try{
     c.report=model.generate(c.ws,g,lang);q('.ct-block-preview').value=c.report.code;
     c.links=null;c.explainer?.refresh({force:true});
     q('[data-block-functions]').hidden=!(c.report.hasFunctions||c.report.hasExpression);
     const replacement=!!c.original.trim()&&c.original!==c.report.code;q('.ct-block-confirm').hidden=!replacement;
     q('[data-block-apply]').disabled=!!c.report.issues.length||(replacement&&!q('[data-block-replace]').checked);
     status(c.report.issues[0]?.message||s.ready,!!c.report.issues.length);
     if(save){
      if(c.corrupt){q('[data-block-storage]').textContent=s.corrupt;return;}
      try{localStorage.setItem(key,JSON.stringify(model.envelope(B,c.ws)));q('[data-block-storage]').textContent=s.saved;}
      catch{q('[data-block-storage]').textContent=s.unsaved;}
     }
    }catch{c.report=null;q('.ct-block-preview').value='';q('[data-block-apply]').disabled=true;status(s.invalid,true);}
   }
   update();
   // Optional source-reading aid; links never insert markers into pupil code.
   function links(){if(!c.links){try{c.links=scope.CT_CODE_MEANING.blockLines(c.ws,g,c.report?.code||'');}catch{c.links={byLine:{},byBlock:{}};}}return c.links;}
   c.explainer=scope.CT_CODE_HELP?.mount(q('.ct-block-preview'),{lang,preferenceKey:'ct-code-help:v1:'+options.project+':'+options.userId,
    onLine:line=>c.ws.highlightBlock(links().byLine[line]||null),onHide:()=>c.ws.highlightBlock(null)});
   c.ws.addChangeListener(e=>{if(e.type===B.Events.SELECTED&&c.explainer?.isEnabled()){const line=links().byBlock[e.newElementId];if(line)c.explainer.setLine(line);}});
   c.flush=()=>update(true);
   c.ws.clearUndo();
   c.ws.addChangeListener(e=>{if(e.isUiEvent)return;clearTimeout(c.timer);c.timer=setTimeout(()=>update(true),150);});
   q('[data-block-replace]').onchange=()=>update();
   q('[data-block-undo]').onclick=()=>{c.ws.undo(false);update(true);};q('[data-block-redo]').onclick=()=>{c.ws.undo(true);update(true);};
   q('[data-block-clear]').onclick=()=>{B.Events.setGroup(true);try{c.ws.clear();}finally{B.Events.setGroup(false);}update(true);};
   q('[data-block-export]').onclick=()=>{try{download(c.corrupt||JSON.stringify(model.envelope(B,c.ws),null,2),'CODE_THINK_BLOCKS.json');}catch{status(s.exportFailed,true);}};
   q('[data-block-import]').onclick=()=>q('[data-block-file]').click();
   q('[data-block-file]').onchange=async e=>{
    const file=e.target.files?.[0];if(!file)return;let backup;
    try{
     if(file.size>350000)throw Error('badFile');const data=model.parse(B,await file.text());if(current!==c)return;
     // Validate in a disposable workspace before replacing the visible project.
     const test=new B.Workspace();try{B.serialization.workspaces.load(data.workspace,test);}finally{test.dispose();}
     backup=B.serialization.workspaces.save(c.ws);B.serialization.workspaces.load(data.workspace,c.ws);c.corrupt=null;update(true);
    }catch{if(backup)B.serialization.workspaces.load(backup,c.ws);status(model.labels(lang).badFile,true);}finally{e.target.value='';}
   };
   q('[data-block-apply]').onclick=()=>{
    update();if(!c.report||q('[data-block-apply]').disabled)return;
    if(String(options.readCurrentCode?.()||'')!==c.original){status(s.changed,true);return;}
    try{
     options.onApply(c.report.code,c.original);close();
    }catch(e){status(e.message||s.changed,true);}
   };
   if(typeof ResizeObserver!=='undefined'){c.observer=new ResizeObserver(()=>B.svgResize(c.ws));c.observer.observe(q('[data-block-canvas]'));}
   B.svgResize(c.ws);
  }catch{if(current===c)status(s.error,true);}
 }
 scope.CT_BLOCKS={version:model.version,open,close,ensure};
})(window);
