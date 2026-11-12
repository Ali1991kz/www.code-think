/* Optional reading aid. Never edits source, executes Python, or calls an API. */
(function(scope){
 'use strict';
 const model=scope.CT_CODE_MEANING,views=new Set();
 const labels={kk:{toggle:'Қазақша түсіндірме',hint:'Команданы бас немесе кодтағы жолды таңда. Python коды өзгермейді.',region:'Код жолының қазақша мағынасы',line:'Жол',words:'Осы жолдағы командалар',glossary:'Python → қазақша сөздік',meaning:'Команданың мағынасы',note:'Бұл — кодты оқуға арналған көмек. Дұрыстығын және нақты нәтижесін «Орындау» арқылы тексер. Атаулардың мәні мен түрі орындау кезінде анықталады.',shadow:'Сөздік командалардың әдеттегі мағынасын береді. Өзің сол атаумен функция не айнымалы жасасаң, оның мағынасы өзгеруі мүмкін.',storage:'Бұл браузер баптауды сақтай алмады; қосқыш осы бетте жұмыс істейді.'},ru:{toggle:'Пояснение по-казахски',hint:'Нажми команду или выбери строку кода. Код Python не меняется.',region:'Значение строки кода на казахском',line:'Строка',words:'Команды этой строки',glossary:'Python → казахский словарь',meaning:'Значение команды',note:'Это помощь в чтении кода. Правильность и фактический результат проверяй кнопкой «Выполнить». Значения и типы имён определяются при выполнении.',shadow:'Словарь показывает обычное значение команд. Если создать свою функцию или переменную с таким именем, значение может измениться.',storage:'Браузер не сохранил настройку; переключатель продолжит работать на этой странице.'}};
 function mount(editor,options={}){
  const lang=options.lang==='ru'?'ru':'kk',s=labels[lang],key=options.preferenceKey||'ct-code-help:v1',control=document.createElement('div'),panel=document.createElement('section');
  control.className='code-help-control';panel.className='code-help-panel';panel.setAttribute('aria-label',s.region);panel.setAttribute('role','region');
  control.innerHTML='<label class="code-help-switch"><input type="checkbox" data-code-help-toggle><span></span></label><small></small>';
  control.querySelector('span').textContent=s.toggle;control.querySelector('small').textContent=s.hint;
  panel.innerHTML='<div class="code-help-line-title"></div><pre class="code-help-source"></pre><p class="code-help-reading" lang="kk" role="status"></p><div class="code-help-chips" role="group"></div><div class="code-help-token" lang="kk" hidden><strong></strong><p></p></div><p class="code-help-note"></p><details class="code-help-dictionary"><summary></summary><p></p><div class="code-help-all" role="group"></div></details><small class="code-help-storage" role="status"></small>';
  const q=selector=>panel.querySelector(selector),toggle=control.querySelector('input');
  q('.code-help-chips').setAttribute('aria-label',s.words);q('.code-help-all').setAttribute('aria-label',s.glossary);q('summary').textContent=s.glossary;q('.code-help-dictionary>p').textContent=s.shadow;q('.code-help-note').textContent=s.note;
  const boundary=editor.closest('label.field')||editor;boundary.before(control);boundary.after(panel);
  let enabled=false,timer=null,destroyed=false,signature='',lastSource=null,lastOffset=-1,report=null;
  try{enabled=localStorage.getItem(key)==='on';}catch{}
  function showToken(item){
   const target=q('.code-help-token');target.hidden=!item;if(!item)return;
   target.querySelector('strong').textContent=item.token+' — '+item.title;target.querySelector('p').textContent=item.meaning;
   for(const b of panel.querySelectorAll('[data-code-help-token]'))b.setAttribute('aria-pressed',String(b.dataset.codeHelpToken===item.token));
  }
  function makeChip(item){const b=document.createElement('button');b.type='button';b.className='code-help-chip';b.dataset.codeHelpToken=item.token;b.textContent=item.token;b.title=item.title;b.setAttribute('aria-label',item.token+' — '+item.title);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>showToken(item));return b;}
  for(const [token,entry]of Object.entries(model.dictionary))q('.code-help-all').append(makeChip({token,title:entry[0],meaning:entry[1]}));
  function refresh({notify=true,force=false}={}){
   if(destroyed||!enabled)return;
   const source=String(editor.value||''),offset=editor.selectionStart||0;
   if(!force&&source===lastSource&&offset===lastOffset)return;
   lastSource=source;lastOffset=offset;report=model.analyze(source,offset);
   q('.code-help-line-title').textContent=s.line+' '+report.line;
   q('.code-help-source').textContent=report.source||'—';q('.code-help-reading').textContent=report.message;panel.dataset.readingKind=report.kind;
   const next=report.commands.map(x=>x.token+':'+x.meaning).join('|');if(next!==signature){signature=next;q('.code-help-chips').replaceChildren(...report.commands.map(makeChip));}
   showToken(report.picked);if(notify)options.onLine?.(report.line);
  }
  function setEnabled(value){enabled=!!value;toggle.checked=enabled;panel.hidden=!enabled;if(enabled)refresh({force:true});else options.onHide?.();}
  const view={key,refresh,isEnabled:()=>enabled,setLine(line){if(!enabled||destroyed)return;const lines=String(editor.value||'').split('\n');if(!Number.isInteger(line)||line<1||line>lines.length)return;const offset=lines.slice(0,line-1).reduce((sum,s)=>sum+s.length+1,0);editor.setSelectionRange(offset,offset+lines[line-1].length);refresh({notify:false,force:true});},setEnabled,destroy(){if(destroyed)return;destroyed=true;clearTimeout(timer);for(const type of ['input','click','keyup','select'])editor.removeEventListener(type,schedule);toggle.removeEventListener('change',change);views.delete(view);control.remove();panel.remove();options.onHide?.();}};
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>refresh(),80);}
  function change(){try{localStorage.setItem(key,toggle.checked?'on':'off');q('.code-help-storage').textContent='';}catch{q('.code-help-storage').textContent=s.storage;}for(const v of views)if(v.key===key)v.setEnabled(toggle.checked);}
  toggle.addEventListener('change',change);for(const type of ['input','click','keyup','select'])editor.addEventListener(type,schedule);
  views.add(view);setEnabled(enabled);return view;
 }
 scope.CT_CODE_HELP={version:'12.6.0',mount};
})(window);
