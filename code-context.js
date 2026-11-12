/* Local code-reading context. No execution, input values, task answers or network. */
(function(scope){
 'use strict';
 const base=scope.CT_CODE_MEANING,Q=s=>'«'+s+'»',comparisons=new Set(['==','!=','<','>','<=','>=','in','not in','is','is not']);
 const ungroup=n=>n?.kind==='group'?ungroup(n.items[0]):n;
 function stringBody(text){const m=text.match(/^([rubf]*)("""|'''|"|')/i);if(!m||!text.endsWith(m[2]))throw Error('string');return {prefix:m[1],body:text.slice(m[0].length,-m[2].length)};}
 // Parse only supported replacement fields; braces in quoted expressions and escaped
 // double braces are handled as text. Dynamic/nested format specifications fall back.
 function fParts(text){
  const {body}=stringBody(text),parts=[];let literal='';
  for(let i=0;i<body.length;){
   const ch=body[i];if((ch==='{'||ch==='}')&&body[i+1]===ch){literal+=ch;i+=2;continue;}
   if(ch==='}')throw Error('field');if(ch!=='{'){literal+=ch;i++;continue;}
   if(literal){parts.push({literal});literal='';}let j=i+1,depth=0,quote='',end=-1,colon=-1,bang=-1;
   for(;j<body.length;j++){const c=body[j];if(quote){if(c==='\\'){j++;continue;}if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if('([{'.includes(c)){depth++;continue;}if(c==='}'&&depth===0){end=j;break;}if(')]}'.includes(c)){depth--;if(depth<0)throw Error('field');continue;}if(depth===0&&c===':'&&colon<0)colon=j;if(depth===0&&c==='!'&&body[j+1]!=='='&&bang<0)bang=j;}
   if(end<0)throw Error('field');const split=Math.min(colon<0?end:colon,bang<0?end:bang),expression=body.slice(i+1,split).trim(),format=colon<0?'':body.slice(colon+1,end),conversion=bang<0?'':body.slice(bang+1,colon<0?end:colon);
   if(!expression||/[{}]/.test(format)||conversion&&!['r','s','a'].includes(conversion))throw Error('field');
   parts.push({expression,node:base.parseExpression(base.lex(expression)),format,conversion});i=end+1;
  }
  if(literal)parts.push({literal});return parts;
 }
 function rangeInfo(n){
  n=ungroup(n);if(n?.kind!=='call'||n.callee.kind!=='name'||n.callee.text!=='range'||n.args.some(x=>x.keyword)||n.args.length<1||n.args.length>3)return null;
  const integer=node=>{node=ungroup(node);if(node.kind==='number'&&/^\d[\d_]*$/.test(node.text))return Number(node.text.replaceAll('_',''));if(node.kind==='unary'&&['+','-'].includes(node.op)){const v=integer(node.value);return node.op==='-'?-v:v;}return NaN;};
  const values=n.args.map(x=>integer(x.value));if(values.some(x=>!Number.isSafeInteger(x)))return null;const start=values.length===1?0:values[0],stop=values.length===1?values[0]:values[1],step=values.length===3?values[2]:1;if(step===0)return null;
  const count=Math.max(0,Math.ceil((stop-start)/step));return Number.isSafeInteger(count)?{start,stop,step,count}:null;
 }
 function build(source){
  source=String(source);const reports=base.analyzeLines(source),tokens=base.lex(source),byLine=new Map();for(const t of tokens){if(!byLine.has(t.line))byLine.set(t.line,[]);byLine.get(t.line).push(t);}
  const environment=new Map(),stack=[],shadowed=new Set();
  // Builtins reassigned anywhere are treated conservatively, including function parameters.
  for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.kind!=='name')continue;if(['=','+=','-=','*=','/='].includes(tokens[i+1]?.text)||['def','class','as','for','import'].includes(tokens[i-1]?.text))shadowed.add(t.text);if(t.text==='def'){for(let j=i+3;j<tokens.length&&tokens[j].line===t.line&&tokens[j].text!==')';j++)if(tokens[j].kind==='name'&&['(',',','*','**'].includes(tokens[j-1]?.text))shadowed.add(tokens[j].text);}}
  const ref=(node,ts)=>ts.slice(node.a,node.b).map(t=>t.text).join(' '),symbol=name=>environment.get(name),builtin=(n,name)=>n?.kind==='call'&&n.callee.kind==='name'&&n.callee.text===name&&!shadowed.has(name),simple=n=>n.args.every(x=>!x.keyword);
  function valueName(node,ts){node=ungroup(node);if(node.kind==='name'){const info=symbol(node.text);return Q(node.text)+(info?.role?' ('+info.role+')':'');}return Q(ref(node,ts));}
  function valueRole(n,ts){
   n=ungroup(n);if(n.kind==='name')return symbol(n.text)||null;if(n.kind==='number')return {kind:'number',role:'сан'};if(n.kind==='list')return {kind:'list',role:'тізім'};
   if(builtin(n,'input')&&simple(n)&&n.args.length<=1)return {kind:'input',role:'енгізілген мәтін'};
   if(['int','float'].some(name=>builtin(n,name))&&simple(n)&&n.args.length===1){const from=valueRole(n.args[0].value,ts);return {kind:'number',role:from?.kind==='input'?'енгізілген '+(n.callee.text==='int'?'бүтін':'нақты')+' сан':n.callee.text==='int'?'бүтін сан':'нақты сан',input:from?.kind==='input'};}
   if(builtin(n,'sum')&&simple(n)&&n.args.length===1){const arg=ungroup(n.args[0].value);return {kind:'number',role:Q(ref(arg,ts))+' мәндерінің қосындысы',sumOf:arg.kind==='name'?arg.text:null};}
   if(builtin(n,'len')&&simple(n)&&n.args.length===1)return {kind:'number',role:Q(ref(n.args[0].value,ts))+' элементтерінің саны'};
   if(n.kind==='binary'&&n.op==='/'){const left=valueRole(n.left,ts);if(left?.sumOf)return {kind:'calculated',role:Q(left.sumOf)+' мәндерінің қосындысын '+Q(ref(n.right,ts))+' мәніне бөлудің нәтижесі'};}
   if(n.kind==='binary'&&!comparisons.has(n.op)&&!['and','or'].includes(n.op))return {kind:'calculated',role:Q(ref(n,ts))+' өрнегінің нәтижесі'};
   return null;
  }
  function expression(n,ts){
   n=ungroup(n);const v=x=>valueName(x,ts);
   if(n.kind==='call'&&simple(n)){
    if(['float','int'].some(name=>builtin(n,name))&&n.args.length===1&&builtin(ungroup(n.args[0].value),'input'))return 'Пайдаланушы енгізген мәтінді '+(n.callee.text==='int'?'бүтін':'нақты')+' санға айналдырады';
    if(builtin(n,'sum')&&n.args.length===1)return v(n.args[0].value)+' тізбегіндегі мәндерді қосады';
    if(builtin(n,'len')&&n.args.length===1)return v(n.args[0].value)+' нысанындағы элементтер санын табады';
    if(['min','max'].some(name=>builtin(n,name))&&n.args.length)return n.args.map(x=>v(x.value)).join(', ')+' ішінен ең '+(n.callee.text==='min'?'кіші':'үлкен')+' мәнді табады';
   }
   if(n.kind==='binary'&&['/','//','%','-','**'].includes(n.op)){const a=v(n.left),b=v(n.right);return {'/':a+' мәнін '+b+' мәніне бөледі','//':a+' мәнін '+b+' мәніне бөліп, бөліндіні төменгі бүтінге дөңгелектейді','%':a+' және '+b+' мәндеріне қалдық/мәтінді пішімдеу амалын қолданады','-':a+' мәнінен '+b+' мәнін азайтады','**':a+' мәнін '+b+' дәрежесіне шығарады'}[n.op];}
   if(n.kind==='binary'&&['+','*'].includes(n.op)){const numeric=[n.left,n.right].every(x=>valueRole(x,ts)?.kind==='number');return v(n.left)+' және '+v(n.right)+' мәндерін '+(n.op==='+'?(numeric?'қосады':'қосады/біріктіреді'):(numeric?'көбейтеді':'көбейтеді/қайталайды'));}
   return null;
  }
  function formatted(n,ts){
   const parts=fParts(n.text),phrases=[];for(const part of parts){if(part.literal!==undefined){if(part.literal)phrases.push(Q(part.literal)+' мәтінін');continue;}const fieldTokens=base.lex(part.expression);let phrase=valueName(part.node,fieldTokens)+' мәнін';if(part.conversion)phrase+=' '+({r:'repr көрінісіне',s:'мәтінге',a:'ASCII repr көрінісіне'})[part.conversion]+' айналдырып';if(part.format){const fixed=part.format.match(/^\.(\d{1,2})f$/);phrase+=fixed?' (бөлшек бөлігінде '+Number(fixed[1])+' таңбамен)': ' ('+Q(part.format)+' пішімімен)';}phrases.push(phrase);}
   return phrases.length?phrases.join(', ')+' бір мәтінге біріктіріп, экранға шығарады.':'Бос мәтінді экранға шығарады.';
  }
  function noteFor(stack){const frames=stack.filter(f=>!f.function&&['for','while','if','elif','else'].includes(f.kind));if(!frames.length)return '';return ' Бұл жол '+frames.map(f=>f.line+'-жолдағы '+(f.kind==='for'?'for циклінің':f.kind==='while'?'while циклінің':'шарт тармағының')+' ішінде').join(', ')+' орындалады.';}
  const rows=[];
  for(const report of reports){
   const ts=(byLine.get(report.line)||[]).filter(t=>t.kind!=='comment'),indent=report.source.match(/^[ \t]*/)[0].replaceAll('\t','        ').length;
   if(report.source.trim()&&report.kind!=='comment'&&report.kind!=='literal')while(stack.length&&indent<=stack.at(-1).indent){const frame=stack.pop();for(const name of frame.changed)environment.delete(name);if(frame.function){environment.clear();for(const [k,v]of frame.outer)environment.set(k,v);}}
   const row={...report,message:report.message,contextual:false},parentNote=noteFor(stack),first=ts[0]?.text;
   if(!['empty','literal','comment','unsupported','incomplete'].includes(report.kind))try{
    const parse=xs=>base.parseExpression(xs);let depth=0,at=-1;for(let i=0;i<ts.length;i++){const t=ts[i].text;if('([{'.includes(t))depth++;if(')]}'.includes(t))depth--;if(depth===0&&['=','+=','-=','*=','/=','//=','%=','**='].includes(t)){at=i;break;}}
    if(report.kind==='assignment'&&at===1&&ts[0].kind==='name'){
     const name=first,n=parse(ts.slice(at+1)),rhs=ts.slice(at+1),op=ts[at].text,action=expression(n,rhs),info=valueRole(n,rhs);
     if(n.kind==='list'&&op==='=')row.message=Q(name)+' айнымалысына '+(n.items.length?'көрсетілген мәндерден құрылған тізімді':'бос тізімді')+' сақтайды. Келесі әрекеттер осы тізімге мән қоса алады.';
     else if(action)row.message=action+'; нәтижені '+Q(name)+' айнымалысына '+(op==='='?'сақтайды.':Q(op)+' амалымен ағымдағы мәніне қолданып, жаңартады.');
     if(op==='='&&info)environment.set(name,{...info,line:report.line});else environment.delete(name);for(const frame of stack)frame.changed.add(name);
    }else if(report.kind==='assignment'){environment.clear();
    }else if(report.kind==='expression'){
     const n=parse(ts);if(builtin(n,'print')){const args=n.args.filter(a=>!a.keyword);if(args.length===1&&args[0].value.kind==='string'&&args[0].value.formatted){try{row.message=formatted(args[0].value,ts);}catch{row.message='f-жол үлгісінен мәтін құрап, экранға шығарады. Бұл күрделі не аяқталмаған үлгінің ішкі өрістерін әзірге толық түсіндіре алмаймын.';}}else if(args.length){row.message=args.map(x=>valueName(x.value,ts)).join(', ')+' мәндерін экранға шығарады.';}if(n.args.some(a=>a.keyword))row.message+=' Атаулы параметрлері шығару пішімін реттейді.';
     }else if(n.kind==='call'&&n.callee.kind==='member'&&n.callee.name==='append'&&simple(n)&&n.args.length===1){row.message=valueRole(n.callee.object,ts)?.kind==='list'?valueName(n.args[0].value,ts)+' мәнін '+Q(ref(n.callee.object,ts))+' тізімінің соңына қосады. Осы жол тізімнің өзін өзгертеді; append() None қайтарады.':Q(ref(n.callee,ts))+' әдісін '+valueName(n.args[0].value,ts)+' мәнімен шақырады. Әдістің нақты әрекеті нысанның түріне байланысты.';}
     else {const action=expression(n,ts);if(action)row.message=action+'.';if(n.kind==='call')environment.clear();}
    }else if(report.kind==='loop'){
     const k=ts.findIndex(t=>t.text==='in'),n=parse(ts.slice(k+1,-1)),range=!shadowed.has('range')?rangeInfo(n):null;
     if(range)row.message=Q(ts.slice(1,k).map(t=>t.text).join(' '))+' айнымалысы range('+n.args.map(a=>ref(a.value,ts.slice(k+1,-1))).join(', ')+') аралығындағы мәндерді кезекпен алады. Соңғы '+range.stop+' шегі кірмейді; қадамы '+range.step+'. Цикл ерте тоқтамаса, денесі '+range.count+' рет орындалады.';
    }
    row.contextual=row.message!==report.message;if(parentNote)row.message+=parentNote;
   }catch{/* Preserve the base analyzer's explicit limitation. */}
   rows.push(row);
   if(['for','while','if','elif','else','def','class','try','except','finally','with','match','case','async'].includes(first)&&ts.at(-1)?.text===':'&&!['literal','comment','incomplete'].includes(report.kind)){
    const frame={line:report.line,indent,kind:first,changed:new Set(),function:['def','class'].includes(first)||first==='async'&&ts[1]?.text==='def'};if(frame.function){frame.outer=new Map(environment);environment.clear();}stack.push(frame);
    if(first==='for'){for(const t of ts.slice(1,ts.findIndex(t=>t.text==='in')))if(t.kind==='name'){environment.delete(t.text);frame.changed.add(t.text);}}
   }
   // Unsupported statements may rebind arbitrary names. Do not carry stale roles.
   if(['unsupported','incomplete'].includes(report.kind)&&report.source.trim())environment.clear();
  }
  return {version:'12.6.1',rows,summary:'Түсіндірме осы жазылған кодтың құрылымы мен алдыңғы анықтамаларына сүйенеді. Нақты мәндерді «Орындау» арқылы тексер.'};
 }
 scope.CT_CODE_CONTEXT={version:'12.6.1',build};
})(window);
