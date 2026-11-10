/* CODE THINK: blocks describe an algorithm; Python remains the execution source. */
(function(scope){
 'use strict';
 const version='12.5.0',limit=240;
 const labels={
  kk:{io:'Кіріс / шығыс',data:'Мәндер және айнымалылар',math:'Есептеу',logic:'Шарттар',loops:'Циклдер',text:'Мәтін',lists:'Тізімдер',functions:'Функциялар',advanced:'Python өрнегі',print:'экранға шығару %1',input:'%1 енгізу · сұрағы %2',string:'мәтін',integer:'бүтін сан',decimal:'нақты сан',length:'ұзындығы %1',reverse:'кері ретпен %1',count:'%1 ішіндегі %2 саны',item:'%1 ішінен индексі %2 мән',append:'%1 тізіміне %2 қосу',stats:'%1 тізімінің %2',sum:'қосындысы',min:'ең кішісі',max:'ең үлкені',range:'%1 үшін range · басы %2 шегі %3 қадамы %4',do:'орында',rangeTip:'Python range: соңғы шек кірмейді. Мысалы, range(0, 3, 1) → 0, 1, 2. Қадам 0 болмауы керек.',format:'%1 санын %2 ондық таңбамен мәтінге айналдыру',round:'%1 санын %2 таңбаға дөңгелектеу',convert:'%1 мәнін %2 түріне айналдыру',expr:'Python өрнегі %1',exprTip:'Тек мән есептейтін өрнек: мысалы, a ** 2. Бір жол; input/print/циклді тиісті блокпен құрастыр.',abs:'модулі %1',empty:'Блоктар алаңы бос. Алдымен бір әрекет блогын қос.',loose:'Жеке қалған мән блогын әрекетке жалға немесе өшір.',stacks:'Негізгі әрекеттерді бір тізбекке жалға. Функция анықтамалары бөлек тұра алады.',missing:'Блоктың бос мән ұяшығын толтыр.',tooMany:'Блок саны 240-тан аспасын.',badFile:'Бұл CODE THINK блок жобасы емес немесе файл бүлінген.',zero:'range қадамы 0 бола алмайды.',break:'Циклден шығу блогын циклдің ішіне орналастыр.',expression:'Python өрнегі бос болмауы және бір жолдан тұруы керек.'},
  ru:{io:'Ввод / вывод',data:'Значения и переменные',math:'Вычисления',logic:'Условия',loops:'Циклы',text:'Текст',lists:'Списки',functions:'Функции',advanced:'Выражение Python',print:'вывести на экран %1',input:'ввести %1 · приглашение %2',string:'текст',integer:'целое число',decimal:'дробное число',length:'длина %1',reverse:'в обратном порядке %1',count:'число %2 в %1',item:'элемент %1 с индексом %2',append:'добавить в список %1 значение %2',stats:'для списка %1 найти %2',sum:'сумму',min:'минимум',max:'максимум',range:'для %1 range · начало %2 граница %3 шаг %4',do:'выполнить',rangeTip:'Python range: конечная граница не входит. Например, range(0, 3, 1) → 0, 1, 2. Шаг не должен быть 0.',format:'число %1 в текст с %2 знаками после точки',round:'округлить %1 до %2 знаков',convert:'значение %1 преобразовать в %2',expr:'выражение Python %1',exprTip:'Только выражение, вычисляющее значение: например, a ** 2. Одна строка; для input/print/цикла используй соответствующий блок.',abs:'модуль %1',empty:'Поле блоков пусто. Сначала добавь блок действия.',loose:'Присоедини отдельный блок значения к действию или удали его.',stacks:'Соедини основные действия в одну цепочку. Определения функций могут стоять отдельно.',missing:'Заполни пустой вход значения в блоке.',tooMany:'Используй не более 240 блоков.',badFile:'Это не проект блоков CODE THINK или файл повреждён.',zero:'Шаг range не может быть 0.',break:'Помести блок выхода из цикла внутрь цикла.',expression:'Выражение Python не должно быть пустым или многострочным.'}
 };
 const l=lang=>labels[lang==='ru'?'ru':'kk'];
 const block=(type,extra={})=>({kind:'block',type,...extra});
 const number=n=>({shadow:{type:'math_number',fields:{NUM:n}}});
 const text=s=>({shadow:{type:'text',fields:{TEXT:s}}});
 function install(B,g,lang){
  const s=l(lang),value=name=>({type:'input_value',name}),field=(name,options)=>({type:'field_dropdown',name,options});
  const definition=(type,message0,args0,style,statement=false,extra={})=>({type,message0,args0,style,inputsInline:true,...(statement?{previousStatement:null,nextStatement:null}:{output:null}),...extra});
  B.defineBlocksWithJsonArray([
   definition('ct_print',s.print,[value('VALUE')],'text_blocks',true),
   definition('ct_input',s.input,[field('TYPE',[[s.string,'str'],[s.integer,'int'],[s.decimal,'float']]),value('PROMPT')],'text_blocks'),
   definition('ct_length',s.length,[value('VALUE')],'text_blocks'),
   definition('ct_reverse',s.reverse,[value('VALUE')],'text_blocks'),
   definition('ct_count',s.count,[value('TEXT'),value('NEEDLE')],'text_blocks'),
   definition('ct_item',s.item,[value('LIST'),value('INDEX')],'list_blocks',false,{tooltip:lang==='ru'?'Индексы Python начинаются с 0.':'Python индексі 0-ден басталады.'}),
   definition('ct_append',s.append,[value('LIST'),value('VALUE')],'list_blocks',true),
   definition('ct_stats',s.stats,[value('LIST'),field('OP',[[s.sum,'sum'],[s.min,'min'],[s.max,'max']])],'list_blocks'),
   definition('ct_range',s.range,[{type:'field_variable',name:'VAR',variable:'i'},value('START'),value('STOP'),value('STEP')],'loop_blocks',true,{message1:s.do+' %1',args1:[{type:'input_statement',name:'DO'}],tooltip:s.rangeTip}),
   definition('ct_format',s.format,[value('VALUE'),field('DIGITS',['0','1','2','3','4'].map(x=>[x,x]))],'math_blocks'),
   definition('ct_round',s.round,[value('VALUE'),field('DIGITS',['0','1','2','3','4'].map(x=>[x,x]))],'math_blocks'),
   definition('ct_convert',s.convert,[value('VALUE'),field('TYPE',[[s.string,'str'],[s.integer,'int'],[s.decimal,'float']])],'math_blocks'),
   definition('ct_abs',s.abs,[value('VALUE')],'math_blocks'),
   definition('ct_flow','%1',[field('FLOW',lang==='ru'?[['выйти из цикла','BREAK'],['следующая итерация','CONTINUE']]:[['циклден шығу','BREAK'],['келесі айналым','CONTINUE']])],'loop_blocks',true),
   definition('ct_expr',s.expr,[{type:'field_input',name:'EXPR',text:'a ** 2'}],'math_blocks',false,{tooltip:s.exprTip})
  ]);
  const v=(b,n)=>g.valueToCode(b,n,g.ORDER_NONE)||'0';
  g.forBlock.ct_print=b=>'print('+v(b,'VALUE')+')\n';
  g.forBlock.ct_input=b=>{let code='input('+v(b,'PROMPT')+')';const type=b.getFieldValue('TYPE');if(type!=='str')code=type+'('+code+')';return [code,g.ORDER_FUNCTION_CALL];};
  g.forBlock.ct_length=b=>['len('+v(b,'VALUE')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_reverse=b=>['('+v(b,'VALUE')+')[::-1]',g.ORDER_MEMBER];
  g.forBlock.ct_count=b=>['('+v(b,'TEXT')+').count('+v(b,'NEEDLE')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_item=b=>['('+v(b,'LIST')+')['+v(b,'INDEX')+']',g.ORDER_MEMBER];
  g.forBlock.ct_append=b=>'('+v(b,'LIST')+').append('+v(b,'VALUE')+')\n';
  g.forBlock.ct_stats=b=>[b.getFieldValue('OP')+'('+v(b,'LIST')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_range=b=>{
   const name=g.getVariableName(b.getFieldValue('VAR'));
   return 'for '+name+' in range('+v(b,'START')+', '+v(b,'STOP')+', '+v(b,'STEP')+'):\n'+(g.statementToCode(b,'DO')||g.PASS);
  };
  g.forBlock.ct_format=b=>['format('+v(b,'VALUE')+", '."+b.getFieldValue('DIGITS')+"f')",g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_round=b=>['round('+v(b,'VALUE')+', '+b.getFieldValue('DIGITS')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_convert=b=>[b.getFieldValue('TYPE')+'('+v(b,'VALUE')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_abs=b=>['abs('+v(b,'VALUE')+')',g.ORDER_FUNCTION_CALL];
  g.forBlock.ct_flow=b=>(b.getFieldValue('FLOW')==='BREAK'?'break':'continue')+'\n';
  // Keep change-by as ordinary Python; initialise the variable before changing it.
  // Blockly's default emits an isinstance helper unsupported by our teaching trace.
  g.forBlock.math_change=b=>g.getVariableName(b.getFieldValue('VAR'))+' += '+v(b,'DELTA')+'\n';
  g.forBlock.ct_expr=b=>['('+String(b.getFieldValue('EXPR')).trim()+')',g.ORDER_ATOMIC];
 }
 function toolbox(lang){
  const s=l(lang),cat=(name,style,contents)=>({kind:'category',name, categorystyle:style,contents});
  return {kind:'categoryToolbox',contents:[
   cat(s.io,'text_category',[block('ct_print',{inputs:{VALUE:text('...')}}),block('ct_input',{inputs:{PROMPT:text('')}})]),
   cat(s.data,'variable_category',[block('math_number'),block('text'),block('variables_set',{inputs:{VALUE:number(0)}}),block('variables_get'),block('math_change',{inputs:{DELTA:number(1)}})]),
   cat(s.math,'math_category',[block('math_arithmetic',{inputs:{A:number(0),B:number(0)}}),block('math_modulo',{inputs:{DIVIDEND:number(0),DIVISOR:number(2)}}),block('ct_round',{inputs:{VALUE:number(0)}}),block('ct_format',{inputs:{VALUE:number(0)}}),block('ct_convert',{inputs:{VALUE:text('0')}}),block('ct_abs',{inputs:{VALUE:number(0)}})]),
   cat(s.logic,'logic_category',[block('controls_if',{inputs:{IF0:{shadow:{type:'logic_boolean'}}}}),block('controls_ifelse',{inputs:{IF0:{shadow:{type:'logic_boolean'}}}}),block('logic_compare',{inputs:{A:number(0),B:number(0)}}),block('logic_operation'),block('logic_negate'),block('logic_boolean')]),
   cat(s.loops,'loop_category',[block('ct_range',{inputs:{START:number(0),STOP:number(3),STEP:number(1)}}),block('controls_repeat_ext',{inputs:{TIMES:number(3)}}),block('controls_whileUntil',{inputs:{BOOL:{shadow:{type:'logic_boolean',fields:{BOOL:'FALSE'}}}}}),block('controls_forEach'),block('ct_flow')]),
   cat(s.text,'text_category',[block('text'),block('text_join'),block('ct_length',{inputs:{VALUE:text('')}}),block('ct_reverse',{inputs:{VALUE:text('')}}),block('ct_count',{inputs:{TEXT:text(''),NEEDLE:text('а')}})]),
   cat(s.lists,'list_category',[block('lists_create_empty'),block('lists_create_with'),block('ct_append'),block('ct_item',{inputs:{INDEX:number(0)}}),block('ct_length'),block('ct_stats')]),
   {kind:'category',name:s.functions,categorystyle:'procedure_category',custom:'PROCEDURE'},
   cat(s.advanced,'math_category',[{kind:'label',text:lang==='ru'?'Для знакомых с Python':'Python білетіндерге'},block('ct_expr')])
  ]};
 }
 const isFunction=b=>/^procedures_def/.test(b.type);
 function inspect(ws,lang){
  const s=l(lang),issues=[],enabled=b=>b.isEnabled(),all=ws.getAllBlocks(false).filter(b=>enabled(b)&&!b.isShadow()),tops=ws.getTopBlocks(true).filter(enabled);
  if(!all.length)issues.push({code:'empty',message:s.empty});
  if(ws.getAllBlocks(false).length>limit)issues.push({code:'limit',message:s.tooMany});
  if(tops.some(b=>b.outputConnection))issues.push({code:'loose',message:s.loose});
  if(tops.filter(b=>!isFunction(b)&&!b.outputConnection).length>1)issues.push({code:'stacks',message:s.stacks});
  for(const b of all){
   if(b.inputList.some(i=>i.type===1&&!i.connection?.targetBlock()))issues.push({code:'missing',blockId:b.id,message:s.missing});
   if(b.type==='ct_range'&&b.getInputTargetBlock('STEP')?.type==='math_number'&&Number(b.getInputTargetBlock('STEP').getFieldValue('NUM'))===0)issues.push({code:'zero',blockId:b.id,message:s.zero});
   if(['ct_flow','controls_flow_statements'].includes(b.type)){
    let p=b.getSurroundParent(),loop=false;
    while(p){if(['ct_range','controls_whileUntil','controls_forEach','controls_repeat_ext','controls_repeat'].includes(p.type)){loop=true;break;}if(isFunction(p))break;p=p.getSurroundParent();}
    if(!loop)issues.push({code:'break',blockId:b.id,message:s.break});
   }
   if(b.type==='ct_expr'&&(!String(b.getFieldValue('EXPR')).trim()||/[\r\n]/.test(b.getFieldValue('EXPR'))))issues.push({code:'expression',blockId:b.id,message:s.expression});
  }
  return {count:all.length,issues,hasFunctions:all.some(b=>/^procedures_/.test(b.type)),hasExpression:all.some(b=>b.type==='ct_expr')};
 }
 function generate(ws,g,lang){const report=inspect(ws,lang);return {...report,code:report.issues.length?'':g.workspaceToCode(ws)};}
 function storageKey(project,owner,context){if(!project||!owner||!context)throw Error('Missing block workspace owner');return 'ct-blocks-v1:'+JSON.stringify([String(project),String(owner),String(context)]);}
 function envelope(B,ws){return {app:'CODE_THINK_BLOCKS',version:1,workspace:B.serialization.workspaces.save(ws)};}
 function parse(B,raw){
  if(typeof raw!=='string'||raw.length>350000)throw Error('badFile');
  let data;try{data=JSON.parse(raw);}catch{throw Error('badFile');}
  if(data?.app!=='CODE_THINK_BLOCKS'||data.version!==1||!data.workspace||typeof data.workspace!=='object')throw Error('badFile');
  let count=0;function walk(x,depth){if(depth>100)throw Error('badFile');if(!x||typeof x!=='object')return;if(x.type){if(!B.Blocks[x.type]||++count>limit)throw Error('badFile');}for(const v of Object.values(x))if(v&&typeof v==='object')walk(v,depth+1);}
  walk(data.workspace,0);return data;
 }
 scope.CT_BLOCK_MODEL={version,limit,labels:l,install,toolbox,inspect,generate,storageKey,envelope,parse};
})(typeof window!=='undefined'?window:globalThis);
