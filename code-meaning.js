/* Local, non-executing descriptions of a deliberately limited Python subset. */
(function(scope){
 'use strict';
 const dictionary={
  input:['Енгізу','Пайдаланушыдан бір жол оқып, мәтін қайтарады. Сан керек болса, оны int() не float() арқылы түрлендір.'],
  print:['Экранға шығару','Берілген мәндерді экранға шығарады. Әдетте олардың арасына бос орын, соңына жаңа жол қояды.'],
  int:['Бүтін санға айналдыру','Жарамды мәннен бүтін сан жасайды. Нақты сан берілсе, бөлшек бөлігін нөлге қарай алып тастайды; жарамсыз мәтінде қате болады.'],
  float:['Нақты санға айналдыру','Жарамды мәннен жылжымалы нүктелі сан жасайды. Ондық бөлшек мәтінінде нүкте қолданылады.'],
  str:['Мәтінге айналдыру','Мәннің мәтіндік көрінісін қайтарады.'],
  len:['Ұзындық','Мәтіндегі таңбалар не тізімдегі элементтер санын қайтарады.'],
  range:['Сандар аралығы','Басы, кірмейтін соңғы шегі және қадамы арқылы бүтін сандар тізбегін сипаттайды. range(3) → 0, 1, 2. Қадам 0 болмауы керек.'],
  if:['Егер','Шартты тексереді. Шарт ақиқат болса, осы тармақтың шегініспен жазылған әрекеттері орындалады.'],
  elif:['Әйтпесе, егер','Алдыңғы if/elif тармақтары орындалмаса, келесі шартты тексереді.'],
  else:['Әйтпесе','if-тен кейін: бұрынғы тармақтардың шарттары жалған болса орындалады. for/while-дан кейін: цикл break арқылы тоқтатылмай аяқталса орындалады.'],
  for:['Әр мән үшін қайталау','Берілген нысанның әр мәнін кезекпен алып, цикл денесін орындайды.'],
  in:['Ішінде / ішінен','for ішінде қайдан мән алынатынын көрсетеді. Салыстыруда элементтің құрамда бар-жоғын тексереді.'],
  while:['Шарт бойынша қайталау','Шартты әр айналым алдында тексереді. Шарт ақиқат кезде денесін қайталайды.'],
  break:['Циклді тоқтату','Ішінде тұрған ең жақын циклді бірден аяқтайды.'],
  continue:['Келесі айналым','Ішінде тұрған ең жақын циклдің қалған әрекеттерін өткізіп, келесі айналымға көшеді.'],
  def:['Функция анықтау','Атауы мен параметрлері бар функцияны анықтайды. Денесі функция шақырылғанда орындалады.'],
  return:['Нәтиже қайтару','Ағымдағы функцияны аяқтайды және көрсетілген мәнді шақырған жерге қайтарады. Мән жазылмаса, None қайтады.'],
  pass:['Бос әрекет','Әрекет орындалмайтын орынды белгілейді. Өздігінен циклді тоқтатпайды.'],
  True:['Ақиқат','Python-дағы ақиқат логикалық тұрақтысы.'],False:['Жалған','Python-дағы жалған логикалық тұрақтысы.'],None:['Арнайы бос мән','Нәтиженің жоқтығын белгілеуге жиі қолданылатын арнайы мән. Бұл 0 саны немесе бос мәтін емес.'],
  and:['Логикалық «және»','Алғашқы жалған мәнді, ал барлығы ақиқат болса соңғы мәнді қайтарады. Қажет болмаған кейінгі өрнек есептелмейді.'],
  or:['Логикалық «немесе»','Алғашқы ақиқат мәнді, ал барлығы жалған болса соңғы мәнді қайтарады. Қажет болмаған кейінгі өрнек есептелмейді.'],
  not:['Логикалық терістеу','Мәннің ақиқат/жалған ретінде бағалануын кері өзгертеді.'],
  '=':['Мән беру','Оң жақтағы мәнді сол жақтағы атауға не элементке береді. Теңдікті тексермейді.'],
  '==':['Теңдігін тексеру','Екі мәннің теңдігін салыстырады. Айнымалыға жаңа мән бермейді.'],
  '!=':['Тең еместігін тексеру','Екі мәннің тең еместігін салыстырады.'],
  '>':['Үлкен бе?','Сол жақтағы мәннің оң жақтағы мәннен үлкендігін тексереді.'],
  '<':['Кіші ме?','Сол жақтағы мәннің оң жақтағы мәннен кішілігін тексереді.'],
  '>=':['Үлкен немесе тең бе?','Шекараға тең мәнді де қамтиды.'],
  '<=':['Кіші немесе тең бе?','Шекараға тең мәнді де қамтиды.'],
  '+':['Қосу / біріктіру','Сандарды қосады, сәйкес мәтіндер мен тізімдерді біріктіреді. Нақты әрекет мәндердің түріне байланысты.'],
  '-':['Азайту / таңбаны өзгерту','Екі санның айырмасын табады; санның алдында тұрса, таңбасын өзгертеді.'],
  '*':['Көбейту / қайталау','Сандарды көбейтеді; мәтін не тізім мен бүтін сан үшін қайталау болуы мүмкін.'],
  '/':['Бөлу','Сандарды кәдімгі бөлу. Нөлге бөлуге болмайды.'],
  '//':['Төменгі бүтінге бөлу','Бөліндіні төменгі бүтінге қарай дөңгелектейді: -3 // 2 → -2. Нәтиже түрі операндтарға байланысты.'],
  '%':['Қалдық / мәтінді пішімдеу','Сандар үшін бөлуден қалған қалдықты табады. Мәтіннің сол жағында тұрса, пішімдеу амалы болуы мүмкін.'],
  '**':['Дәрежелеу','Сол жақтағы мәнді оң жақтағы дәреже көрсеткішіне шығарады.'],
  '+=':['Қосып жаңарту','Сол жақтағы ағымдағы мәнге оң жақтағы мәнді қосып/біріктіріп жаңартады.'],
  '-=':['Азайтып жаңарту','Сол жақтағы ағымдағы мәннен оң жақтағы мәнді азайтып жаңартады.'],
  '*=':['Көбейтіп жаңарту','Сол жақтағы ағымдағы мәнге көбейту/қайталау амалын қолданып жаңартады.'],
  '/=':['Бөліп жаңарту','Сол жақтағы ағымдағы мәнді оң жақтағы мәнге бөліп жаңартады.'],
  ':':['Құрылым белгісі','Шарт, цикл не функция тақырыбынан кейін шегіністі әрекеттер басталатынын көрсетеді. Кесінді ішінде шекараларды бөледі.'],
  sum:['Қосынды','Берілген тізбек мәндерінің қосындысын есептейді.'],min:['Ең кіші мән','Берілген мәндердің ең кішісін табады.'],max:['Ең үлкен мән','Берілген мәндердің ең үлкенін табады.'],
  round:['Дөңгелектеу','Санды берілген дәлдікке дейін дөңгелектейді. Тең қашықтықта жұп жаққа дөңгелектеу қолданылады; нақты сандардың сақтау дәлдігі нәтижеге әсер етуі мүмкін.'],
  abs:['Модуль','Санның абсолют мәнін қайтарады.'],list:['Тізім жасау','Бос тізім жасайды немесе берілген тізбекті тізімге айналдырады.'],
  sorted:['Реттелген жаңа тізім','Элементтерден сұрыпталған жаңа тізім қайтарады. Бастапқы тізімді өздігінен өзгертпейді.'],
  format:['Пішімделген мәтін','Мәнді көрсетілген пішім бойынша мәтінге айналдырады.'],
  enumerate:['Индекс пен мән','Тізбектегі элементтерді индексімен бірге алуға мүмкіндік береді. Әдепкі индекс 0-ден басталады.'],
  append:['Тізімге қосу','Тізімнің соңына бір мән қосады. Тізімнің өзін өзгертеді және None қайтарады.'],
  count:['Кездесу санын табу','Мәтінде үзінді не тізімде мән неше рет кездесетінін санайды.'],
  lower:['Кіші әріптер','Мәтіннің кіші әріппен жазылған нұсқасын қайтарады. Бастапқы мәтіннің өзін өзгертпейді.'],
  upper:['Бас әріптер','Мәтіннің бас әріппен жазылған нұсқасын қайтарады.'],
  strip:['Шеттерін тазалау','Әдепкіде мәтіннің басы мен соңындағы бос таңбаларды алып тастаған жаңа мәтін қайтарады.'],
  split:['Мәтінді бөлу','Мәтінді бөліктерге бөліп, тізім қайтарады.'],
  import:['Модульді қосу','Кодта модульді пайдалануға мүмкіндік береді.'],from:['Модульден алу','Модульдің нақты атауларын импорттауға қатысады.'],as:['Басқа атау беру','Импортталған атауға жергілікті балама атау береді.']
 };
 // Token offsets use UTF-16, like textarea selectionStart/selectionEnd.
 function lex(source){
  source=String(source);const out=[];let i=0,line=1;
  const add=(kind,start,end,startLine,extra={})=>out.push({kind,text:source.slice(start,end),start,end,line:startLine,...extra});
  while(i<source.length){
   const ch=source[i];if(ch==='\n'){line++;i++;continue;}if(/\s/.test(ch)){i++;continue;}
   const start=i,startLine=line;
   if(ch==='#'){while(i<source.length&&source[i]!=='\n')i++;add('comment',start,i,startLine);continue;}
   const prefix=source.slice(i).match(/^(?:br|rb|fr|rf|r|u|b|f)(?=['"])/i)?.[0]||'';
   if(ch==='"'||ch==="'"||prefix){
    i+=prefix.length;const quote=source[i],triple=source.slice(i,i+3)===quote.repeat(3),marker=quote.repeat(triple?3:1);i+=marker.length;let complete=false;
    while(i<source.length){if(source[i]==='\\'){if(source[i+1]==='\n')line++;i+=Math.min(2,source.length-i);continue;}if(source.slice(i,i+marker.length)===marker){i+=marker.length;complete=true;break;}if(source[i]==='\n'){line++;if(!triple){i++;break;}}i++;}
    add('string',start,i,startLine,{complete,formatted:/f/i.test(prefix),multiline:line!==startLine});continue;
   }
   const name=source.slice(i).match(/^[\p{L}_][\p{L}\p{N}_]*/u)?.[0];if(name){i+=name.length;add('name',start,i,startLine);continue;}
   const number=source.slice(i).match(/^(?:(?:\d[\d_]*\.[\d_]*|\.[\d_]+|\d[\d_]*)(?:[eE][+-]?[\d_]+)?)/)?.[0];if(number){i+=number.length;add('number',start,i,startLine);continue;}
   const op=source.slice(i).match(/^(?:\*\*=|\/\/=|==|!=|>=|<=|\+=|-=|\*=|\/=|%=|\*\*|\/\/|:=|->|[+\-*\/%=<>()[\]{},.:;])/u)?.[0];
   i+=op?op.length:1;add(op?'op':'unknown',start,i,startLine);
  }
  return out;
 }
 const quote=s=>'«'+s+'»',raw=(node,tokens)=>tokens.slice(node.a,node.b).map(t=>t.text).join(' ');
 function parseExpression(tokens){
  let p=0,depth=0;const peek=()=>tokens[p]?.text,accept=s=>peek()===s?(p++,true):false,need=s=>{if(!accept(s))throw Error('incomplete');};
  const precedence={or:1,and:2,'==':4,'!=':4,'>':4,'<':4,'>=':4,'<=':4,in:4,is:4,'+':7,'-':7,'*':8,'/':8,'//':8,'%':8,'**':10};
  function expression(min=0){
   if(++depth>45)throw Error('complex');const a=p,t=tokens[p++];if(!t)throw Error('incomplete');let n;
   if(['+','-','not'].includes(t.text)){const v=expression(t.text==='not'?3:9);n={kind:'unary',op:t.text,value:v,a,b:p};}
   else if(t.text==='('||t.text==='['){const end=t.text==='('?')':']',items=[];if(peek()!==end){items.push(expression());while(accept(',')){if(peek()===end)break;items.push(expression());}}need(end);n={kind:t.text==='['?'list':items.length===1?'group':'tuple',items,a,b:p};}
   else if(t.kind==='number'||t.kind==='string'||t.kind==='name'){if(t.kind==='string'&&(!t.complete||t.multiline))throw Error('incomplete');if(t.kind==='name'&&['lambda','for','if','else','await','yield','class','def','return','import','from','as','del','try','except','with','raise','assert','global','nonlocal','match','case','async','break','continue','pass'].includes(t.text))throw Error('unsupported');n={kind:t.kind,text:t.text,formatted:t.formatted,a,b:p};}
   else throw Error('unsupported');
   while(p<tokens.length){
    if(peek()==='('){p++;const args=[];if(peek()!==')'){do{if(peek()===')')break;let keyword=null;if(tokens[p]?.kind==='name'&&tokens[p+1]?.text==='='){keyword=tokens[p].text;p+=2;}args.push({keyword,value:expression()});}while(accept(','));}need(')');n={kind:'call',callee:n,args,a,b:p};continue;}
    if(accept('.')){const name=tokens[p++];if(name?.kind!=='name')throw Error('incomplete');n={kind:'member',object:n,name:name.text,a,b:p};continue;}
    if(accept('[')){const items=[];let slice=false;if(peek()!==']'){while(peek()!==']'&&p<tokens.length){if(accept(':')){slice=true;items.push(null);}else{items.push(expression());if(peek()!==':')break;}}}need(']');n={kind:'index',object:n,items,slice,a,b:p};continue;}
    let op=peek(),width=1;if(op==='not'&&tokens[p+1]?.text==='in'){op='not in';width=2;}if(op==='is'&&tokens[p+1]?.text==='not'){op='is not';width=2;}const priority=precedence[op]??(['not in','is not'].includes(op)?4:undefined);if(priority===undefined||priority<min)break;
    p+=width;const right=expression(op==='**'?priority:priority+1);n={kind:'binary',op,left:n,right,a,b:p};
   }
   depth--;return n;
  }
  const node=expression();if(p!==tokens.length)throw Error('unsupported');return node;
 }
 function describe(node,tokens,shadowed=new Set()){
  const r=n=>quote(raw(n,tokens));if(node.kind==='group')return describe(node.items[0],tokens,shadowed);
  if(node.kind==='string')return node.formatted?'f-жол үлгісіндегі өрнектерді мәтінге енгізеді':'Мәтіндік мәнді алады';
  if(node.kind==='number')return r(node)+' сандық мәнін алады';
  if(node.kind==='name')return ['True','False','None'].includes(node.text)?quote(node.text)+' арнайы мәнін алады':r(node)+' атауының ағымдағы мәнін алады';
  if(node.kind==='list')return node.items.length?'Көрсетілген мәндерден тізім жасайды':'Бос тізім жасайды';
  if(node.kind==='tuple')return 'Көрсетілген мәндерден кортеж құрады';
  if(node.kind==='index')return node.slice?r(node.object)+' нысанынан көрсетілген кесіндіні алады':r(node.object)+' нысанынан '+r(node.items[0])+' индексіндегі мәнді алады';
  if(node.kind==='unary')return node.op==='not'?r(node.value)+' мәнінің логикалық бағасын кері өзгертеді':r(node.value)+' мәніне '+quote(node.op)+' таңба амалын қолданады';
  if(node.kind==='binary'){
   if(['==','!=','>','<','>=','<=','in','not in','is','is not'].includes(node.op)&&node.left.kind==='binary'&&['==','!=','>','<','>=','<=','in','not in','is','is not'].includes(node.left.op))return r(node)+' тізбекті салыстыруын орындайды: көршілес мәндердің шарттары бірге тексеріледі';
   const operations={'+':'қосу/біріктіру','-':'азайту','*':'көбейту/қайталау','/':'бөлу','//':'төменгі бүтінге бөлу','%':'қалдық/пішімдеу','**':'дәрежелеу','==':'теңдігін салыстыру','!=':'тең еместігін салыстыру','>':'үлкендігін салыстыру','<':'кішілігін салыстыру','>=':'үлкен немесе теңдігін салыстыру','<=':'кіші немесе теңдігін салыстыру',in:'құрамында болуын тексеру','not in':'құрамында болмауын тексеру',is:'бір нысан болуын тексеру','is not':'бір нысан болмауын тексеру',and:'логикалық «және»',or:'логикалық «немесе»'};
   return r(node.left)+' және '+r(node.right)+' үшін '+operations[node.op]+' амалын орындайды';
  }
  if(node.kind==='call'){
   const name=node.callee.kind==='name'?node.callee.text:null,values=node.args.map(x=>x.value),simple=node.args.every(x=>!x.keyword);
   if(name&&!shadowed.has(name)){
    if(name==='input'&&simple&&values.length<=1)return 'Пайдаланушыдан бір жол мәтін енгізуді сұрайды';
    if(['int','float','str'].includes(name)&&simple&&values.length===1){const source=values[0],entry=source.kind==='call'&&source.callee.kind==='name'&&source.callee.text==='input'&&!shadowed.has('input')?'Пайдаланушы енгізген мәтінді':r(source)+' мәнін';return entry+' '+({int:'бүтін санға',float:'нақты санға',str:'мәтінге'})[name]+' айналдырады';}
    if(name==='print'){const positional=node.args.filter(x=>!x.keyword).map(x=>x.value),keywords=node.args.some(x=>x.keyword);return (positional.length?positional.map(r).join(', ')+' мәндерін экранға шығарады':keywords?'Атаулы параметрлермен экранға шығару әрекетін орындайды':'Бос жолды экранға шығарады')+(keywords?'; атаулы параметрлері шығару пішімін реттейді':'');}
    if(name==='len'&&simple&&values.length===1)return r(values[0])+' нысанының ұзындығын табады';
    if(name==='range'&&simple&&values.length>=1&&values.length<=3)return 'Бүтін сандар аралығын дайындайды: басы '+(values.length===1?'0':r(values[0]))+', кірмейтін соңғы шегі '+r(values.length===1?values[0]:values[1])+', қадамы '+(values.length===3?r(values[2]):'1');
    if(['sum','min','max','abs','round','sorted','list','format','enumerate'].includes(name)&&simple)return quote(name)+' функциясын '+(values.length?values.map(r).join(', ')+' мәндерімен':'аргументсіз')+' шақырады — '+dictionary[name][0].toLocaleLowerCase('kk');
   }
   if(node.callee.kind==='member'&&node.callee.name==='append'&&simple&&values.length===1)return r(node.callee.object)+' тізімінің соңына '+r(values[0])+' мәнін қосады; қайтарылатын мәні — None';
   return r(node.callee)+' функциясын/әдісін '+(values.length?values.map(r).join(', ')+' аргументтерімен':'аргументсіз')+' шақырады';
  }
  throw Error('unsupported');
 }
 function lineTokens(tokens,index){return tokens.filter(t=>t.line===index&&t.kind!=='comment');}
 function bindings(tokens){
  const names=new Set();for(let i=0;i<tokens.length;i++){
   const t=tokens[i];if(t.kind!=='name')continue;
   if(['=','+=','-=','*=','/='].includes(tokens[i+1]?.text)||['def','class','as','for','import'].includes(tokens[i-1]?.text))names.add(t.text);
   if(t.text==='def'){let j=i+3;while(j<tokens.length&&tokens[j].text!==')'&&tokens[j].line===t.line){if(tokens[j].kind==='name'&&['(',',','*','**'].includes(tokens[j-1]?.text))names.add(tokens[j].text);j++;}}
  }return names;
 }
 function tokenMeaning(token){if(!token)return null;const entry=dictionary[token.text];return entry?{token:token.text,title:entry[0],meaning:entry[1]}:null;}
 function analyze(source,offset=0,prepared=null){
  source=String(source);offset=Math.max(0,Math.min(Number(offset)||0,source.length));const tokens=prepared?.tokens||lex(source),line=source.slice(0,offset).split('\n').length,lines=prepared?.lines||source.split('\n'),text=lines[line-1]||'',ts=lineTokens(tokens,line),shadowed=prepared?.shadowed||bindings(tokens);
  const start=offset===0?0:source.lastIndexOf('\n',offset-1)+1,end=start+text.length;
  const covering=tokens.find(t=>t.start<start&&t.end>start);
  function contextual(t){if(!t||t.kind==='comment'||t.kind==='string')return null;const i=ts.indexOf(t);if(t.text==='='&&i>=0){let depth=0;for(const x of ts.slice(0,i)){if(x.text==='(')depth++;if(x.text===')')depth--;}if(depth>0)return {token:'=',title:ts[0]?.text==='def'?'Параметрдің әдепкі мәні':'Атаулы аргумент',meaning:ts[0]?.text==='def'?'Функция параметрінің әдепкі мәнін белгілейді.':'Функцияға аргументті атымен береді; бұл жолда сыртқы айнымалыға мән беру емес.'};}return tokenMeaning(t);}
  const picked=tokens.find(t=>t.start<=offset&&t.end>offset)||tokens.find(t=>t.end===offset),pickedMeaning=contextual(picked);
  const commands=[];for(const t of ts){const item=contextual(t);if(item&&!commands.some(x=>x.token===item.token))commands.push(item);}
  const result={line,source:text,start,end,commands,picked:pickedMeaning,kind:'unsupported',message:'Бұл жолдың толық құрылымына әзірге түсіндірме жоқ. Командалар мағынасын сөздіктен қарап, кодты «Орындау» арқылы тексер.'};
  if(!text.trim())return {...result,kind:'empty',message:'Бұл — бос жол. Код жаз немесе түсіндірілетін жолды таңда.'};
  if(covering?.kind==='string')return {...result,commands:[],picked:null,kind:'literal',message:'Бұл жол көпжолды мәтіннің ішінде тұр. Оның ішіндегі сөздер Python командалары ретінде орындалмайды.'};
  if(!ts.length)return {...result,kind:'comment',message:'Бұл — # таңбасынан кейінгі түсініктеме. Python оны әрекет ретінде орындамайды.'};
  if(ts.some(t=>t.kind==='unknown'||(t.kind==='string'&&!t.complete)))return {...result,kind:'incomplete',message:'Жол әлі толық жазылмаған немесе бұл құрылымға түсіндірме жоқ. Жақшалар мен тырнақшаларды толықтыр.'};
  try{
   const first=ts[0].text,last=ts.at(-1).text,expr=xs=>parseExpression(xs),desc=xs=>describe(expr(xs),xs,shadowed),cond=xs=>quote(xs.map(t=>t.text).join(' '));
   if(['if','elif','while'].includes(first)&&last===':'){
    expr(ts.slice(1,-1));const condition=cond(ts.slice(1,-1));
    return {...result,kind:'condition',message:first==='if'?'Егер '+condition+' шарты ақиқат болса, келесі шегіністі әрекеттерді орындайды.':first==='elif'?'Алдыңғы if/elif тармақтары орындалмаса, '+condition+' шартын тексеріп, ақиқат кезде осы тармақты орындайды.':condition+' шартын әр айналым алдында тексеріп, ақиқат кезде цикл денесін қайталайды.'};
   }
   if(first==='else'&&ts.length===2&&last===':'){
    const indent=text.match(/^\s*/)[0].length;let parent='';for(let i=line-2;i>=0;i--){const s=lines[i];if(!s.trim()||s.trim().startsWith('#'))continue;const n=s.match(/^\s*/)[0].length;if(n<indent)break;if(n===indent){parent=s.trim().split(/\s|:/)[0];break;}}
    return {...result,kind:'branch',message:['for','while'].includes(parent)?'Цикл break арқылы тоқтатылмай аяқталса, осы шегіністі тармақ орындалады.':['if','elif'].includes(parent)?'Алдыңғы if/elif тармақтарының ешбір шарты ақиқат болмаса, осы шегіністі әрекеттер орындалады.':dictionary.else[1]};
   }
   if(first==='for'&&last===':'){
    const k=ts.findIndex(t=>t.text==='in');if(k<2||!ts.slice(1,k).every(t=>t.kind==='name'||t.text===','))throw Error('unsupported');const iterable=ts.slice(k+1,-1),n=expr(iterable);
    return {...result,kind:'loop',message:quote(ts.slice(1,k).map(t=>t.text).join(' '))+' атауына тізбектің әр мәнін кезекпен беріп, шегіністі әрекеттерді қайталайды. '+describe(n,iterable,shadowed)+'.'};
   }
   if(first==='def'&&ts[1]?.kind==='name'&&ts[2]?.text==='('&&ts.at(-2)?.text===')'&&last===':'&&ts.slice(3,-2).every(t=>t.kind==='name'||t.text===','))return {...result,kind:'definition',message:quote(ts[1].text)+' функциясын анықтайды. Параметрлері: '+(ts.slice(3,-2).map(t=>t.text).join(' ')||'жоқ')+'. Денесі функция шақырылғанда орындалады.'};
   if(['break','continue','pass'].includes(first)&&ts.length===1)return {...result,kind:'control',message:dictionary[first][1]};
   if(first==='return')return {...result,kind:'return',message:ts.length===1?'Ағымдағы функцияны аяқтап, None мәнін қайтарады.':desc(ts.slice(1))+'; осы мәнді функциядан қайтарып, функцияны аяқтайды.'};
   let balance=0,assignment=-1;for(let i=0;i<ts.length;i++){if(['(','[','{'].includes(ts[i].text))balance++;if([')',']','}'].includes(ts[i].text))balance--;if(!balance&&['=','+=','-=','*=','/=','//=','%=','**='].includes(ts[i].text)){if(assignment!==-1)throw Error('unsupported');assignment=i;}}
   if(assignment>=0){
    const targets=ts.slice(0,assignment),operator=ts[assignment].text,right=ts.slice(assignment+1);if(!targets.length||!right.length)throw Error('incomplete');
    // A target is a name, a simple tuple of names, or an indexed/member target.
    let target;if(targets.every((t,i)=>i%2===0?t.kind==='name'&&!['True','False','None','if','for','while'].includes(t.text):t.text===',')&&targets.length%2===1)target=quote(targets.map(t=>t.text).join(' '))+(targets.some(t=>t.text===',')?' атауларына ретімен':' айнымалысына');else{const n=expr(targets);if(!['index','member'].includes(n.kind))throw Error('unsupported');target=quote(targets.map(t=>t.text).join(' '))+' орнына';}
    const action=desc(right);return {...result,kind:'assignment',message:operator==='='?action+'; алынған мәнді '+target+' береді.':action+'; '+quote(targets.map(t=>t.text).join(' '))+' ағымдағы мәнін '+quote(operator)+' амалымен жаңартады.'};
   }
   return {...result,kind:'expression',message:desc(ts)+'.'};
  }catch{return {...result,kind:'unsupported'};}
 }
 // Map existing Blockly output without inserting markers or changing generated Python.
 function blockLines(ws,g,expected){
  const original={...g.forBlock},records=[];let code;
  try{
   for(const [type,fn]of Object.entries(original))g.forBlock[type]=function(b,generator){const before={...g.definitions_},value=fn.call(this,b,generator);if(!b.outputConnection){let fragment=typeof value==='string'?value:'';if(!fragment&&/^procedures_def/.test(type))fragment=Object.entries(g.definitions_||{}).filter(([k,v])=>before[k]!==v&&String(v).includes('def ')).map(([,v])=>v).join('\n');if(fragment.trim())records.push({id:b.id,fragment});}return value;};
   code=g.workspaceToCode(ws);
  }finally{for(const [type,fn]of Object.entries(original))g.forBlock[type]=fn;}
  if(code!==expected)return {byLine:{},byBlock:{}};
  const lines=code.split('\n'),used=new Set(),byLine={},byBlock={};
  for(const record of records){const fragment=record.fragment.trimEnd().split('\n'),first=fragment.find(s=>s.trim()&&!s.trim().startsWith('#'));if(!first)continue;const index=lines.findIndex((s,i)=>s.trim()===first.trim()&&!used.has(i));if(index<0)continue;used.add(index);byBlock[record.id]=index+1;for(let i=index;i<Math.min(lines.length,index+fragment.length);i++)if(lines[i].trim()&&!byLine[i+1])byLine[i+1]=record.id;}
  // Value blocks share the Python line of their containing statement.
  for(const b of ws.getAllBlocks(false)){let parent=b;while(parent&&!byBlock[parent.id])parent=parent.getParent();if(parent)byBlock[b.id]=byBlock[parent.id];}
  return {byLine,byBlock};
 }
 function analyzeLines(source){source=String(source);const tokens=lex(source),lines=source.split('\n'),prepared={tokens,lines,shadowed:bindings(tokens)};let offset=0;return lines.map(text=>{const report=analyze(source,offset,prepared);offset+=text.length+1;return report;});}
 scope.CT_CODE_MEANING={version:'12.6.1',lex,analyze,analyzeLines,parseExpression,tokenMeaning,dictionary,blockLines};
})(typeof window!=='undefined'?window:globalThis);
