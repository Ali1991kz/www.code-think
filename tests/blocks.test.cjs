'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function engine(lang='kk'){
 const c=vm.createContext({console,setTimeout,clearTimeout});vm.runInContext('window=globalThis',c);
 for(const f of ['vendor/blockly/blockly_compressed.js','vendor/blockly/blocks_compressed.js','vendor/blockly/python_compressed.js','vendor/blockly/msg/en.js','block-locale-kk.js','block-model.js'])vm.runInContext(read(f),c,{filename:f});
 const B=c.Blockly,g=c.python.pythonGenerator,m=c.CT_BLOCK_MODEL;if(lang==='kk')B.setLocale({...B.Msg,...c.CT_BLOCK_KK});m.install(B,g,lang);return {B,g,m};
}
const num=n=>({type:'math_number',fields:{NUM:n}}),text=s=>({type:'text',fields:{TEXT:s}}),expr=s=>({type:'ct_expr',fields:{EXPR:s}}),input=(type='str')=>({type:'ct_input',fields:{TYPE:type},inputs:{PROMPT:{block:text('')}}});
const put=(type,inputs={},fields={})=>({type,fields,inputs:Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,{block:v}]))});
const print=value=>put('ct_print',{VALUE:value});
function chain(...blocks){for(let i=0;i<blocks.length-1;i++)blocks[i].next={block:blocks[i+1]};return blocks[0];}
function program(e,blocks,variables=[]){const ws=new e.B.Workspace();e.B.serialization.workspaces.load({variables,blocks:{languageVersion:0,blocks}},ws);return ws;}
function python(code,input=''){
 const r=spawnSync('python',['-c',code],{input,encoding:'utf8',timeout:5000});assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.replace(/\r\n/g,'\n');
}
test('connected block programs generate real Python: input, arithmetic, text, conditions, lists, formatting and ranges',()=>{
 const e=engine(),cases=[
  {blocks:[print(input('str'))],input:'Айдана\n',out:'Айдана\n'},
  {blocks:[print(put('math_arithmetic',{A:input('int'),B:num(2)},{OP:'MULTIPLY'}))],input:'-3\n',out:'-6\n'},
  {blocks:[print(put('ct_format',{VALUE:input('float')},{DIGITS:'2'}))],input:'2.5\n',out:'2.50\n'},
  {blocks:[print(put('ct_count',{TEXT:text('АӘа'),NEEDLE:text('а')}))],out:'1\n'},
  {blocks:[print(put('ct_reverse',{VALUE:text('abcd')}))],out:'dcba\n'},
  {blocks:[print(put('ct_item',{LIST:{type:'lists_create_with',extraState:{itemCount:2},inputs:{ADD0:{block:num(9)},ADD1:{block:num(4)}}},INDEX:num(0)}))],out:'9\n'},
  {blocks:[put('controls_ifelse',{IF0:put('logic_compare',{A:input('int'),B:num(18)},{OP:'GTE'}),DO0:print(text('yes')),ELSE:print(text('no'))})],input:'18\n',out:'yes\n'},
  {blocks:[put('ct_range',{START:num(0),STOP:num(3),STEP:num(1),DO:print(expr('i'))},{VAR:{id:'i'}})],vars:[{id:'i',name:'i'}],out:'0\n1\n2\n'},
  {blocks:[put('ct_range',{START:num(3),STOP:num(0),STEP:num(-1),DO:print(expr('i'))},{VAR:{id:'i'}})],vars:[{id:'i',name:'i'}],out:'3\n2\n1\n'},
  {blocks:[put('ct_range',{START:num(0),STOP:num(5),STEP:num(1),DO:chain(print(expr('i')),{type:'ct_flow',fields:{FLOW:'BREAK'}})},{VAR:{id:'i'}})],vars:[{id:'i',name:'i'}],out:'0\n'},
  {blocks:[print(put('ct_round',{VALUE:num(2.456)},{DIGITS:'2'}))],out:'2.46\n'},
  {blocks:[print(put('math_modulo',{DIVIDEND:num(-3),DIVISOR:num(2)}))],out:'1\n'},
  {blocks:[chain(put('variables_set',{VALUE:num(0)},{VAR:{id:'i'}}),put('controls_whileUntil',{BOOL:put('logic_compare',{A:expr('i'),B:num(3)},{OP:'LT'}),DO:chain(print(expr('i')),put('math_change',{DELTA:num(1)},{VAR:{id:'i'}}))},{MODE:'WHILE'}))],vars:[{id:'i',name:'i'}],out:'0\n1\n2\n'},
  {blocks:[chain(put('variables_set',{VALUE:{type:'lists_create_empty'}},{VAR:{id:'values'}}),put('ct_append',{LIST:{type:'variables_get',fields:{VAR:{id:'values'}}},VALUE:num(4)}),print(put('ct_stats',{LIST:{type:'variables_get',fields:{VAR:{id:'values'}}}},{OP:'sum'})))],vars:[{id:'values',name:'values'}],out:'4\n'},
 ];
 for(const c of cases){const ws=program(e,c.blocks,c.vars);try{const result=e.m.generate(ws,e.g,'kk');assert.equal(result.issues.length,0,JSON.stringify(result.issues));assert.equal(python(result.code,c.input),c.out,result.code);}finally{ws.dispose();}}
});
test('a function definition and a connected main call remain valid separate top-level blocks',()=>{
 const e=engine(),ws=program(e,[{type:'procedures_defreturn',fields:{NAME:'twice'},inputs:{RETURN:{block:put('math_arithmetic',{A:num(2),B:num(3)},{OP:'MULTIPLY'})}}},print({type:'procedures_callreturn',extraState:{name:'twice',params:[]}})]);
 try{const result=e.m.generate(ws,e.g,'ru');assert.equal(result.issues.length,0);assert.ok(result.hasFunctions);assert.equal(python(result.code),'6\n');}finally{ws.dispose();}
});
test('empty, disconnected, missing values, zero range steps, misplaced breaks and multiline expressions cannot transfer',()=>{
 const e=engine(),cases=[ [[], 'empty'],[[num(1)],'loose'],[[print(text('a')),print(text('b'))],'stacks'],[[{type:'ct_print'}],'missing'],[[put('ct_range',{START:num(0),STOP:num(2),STEP:num(0)},{VAR:{id:'i'}})],'zero'],[[{type:'ct_flow',fields:{FLOW:'BREAK'}}],'break'],[[print(expr('1\nprint(2)'))],'expression'] ];
 for(const [blocks,issue]of cases){const ws=program(e,blocks,[{id:'i',name:'i'}]);try{const result=e.m.generate(ws,e.g,'kk');assert.ok(result.issues.some(x=>x.code===issue),issue);assert.equal(result.code,'');}finally{ws.dispose();}}
});
test('workspace serialization round trips and rejects broken or excessive files; local keys isolate projects, pupils and tasks',()=>{
 const e=engine(),ws=program(e,[print(text('Сәлем'))]);
 try{const raw=JSON.stringify(e.m.envelope(e.B,ws)),saved=e.m.parse(e.B,raw),copy=new e.B.Workspace();e.B.serialization.workspaces.load(saved.workspace,copy);assert.equal(e.g.workspaceToCode(copy),e.g.workspaceToCode(ws));copy.dispose();
  for(const raw of ['{}','not json',JSON.stringify({app:'CODE_THINK_BLOCKS',version:2,workspace:{}}),JSON.stringify({app:'CODE_THINK_BLOCKS',version:1,workspace:{blocks:{blocks:[{type:'unknown_block'}]}}}),' '.repeat(350001)])assert.throws(()=>e.m.parse(e.B,raw));
  const keys=[['p','s','a'],['p','s2','a'],['p2','s','a'],['p','s','b']].map(args=>e.m.storageKey(...args));assert.equal(new Set(keys).size,4);assert.throws(()=>e.m.storageKey('p','','a'));
 }finally{ws.dispose();}
});
test('all toolbox blocks exist in both languages; no task solution templates or execution are embedded',()=>{
 for(const lang of ['kk','ru']){const e=engine(lang),box=e.m.toolbox(lang);for(const cat of box.contents)for(const b of cat.contents||[])if(b.kind==='block')assert.ok(e.B.Blocks[b.type],b.type);assert.equal(box.contents.length,9);}
 for(const file of ['block-model.js','block-editor.js']){const s=read(file);assert.ok(!/CT_FIREBASE|sampleCode|teacher-materials|fetch\(/.test(s));}
 const s=read('block-editor.js');assert.match(s,/readCurrentCode/);assert.match(s,/data-block-replace/);assert.match(s,/test\.dispose/);assert.match(s,/c\.ws\?\.dispose/);
});
test('both entrypoints lazy-load the large vendor files only on request',()=>{
 for(const f of ['index.html','new-project/index.html']){const html=read(f);for(const asset of ['block-model.js','block-locale-kk.js','block-editor.js','block-editor.css'])assert.ok(html.includes(asset));assert.ok(!html.includes('src="vendor/blockly/'));assert.ok(html.indexOf('block-model.js')<html.indexOf('block-editor.js'));}
});
test('ordinary block-generated loops run in the unchanged teaching trace, including change-by',()=>{
 const e=engine(),ws=program(e,[chain(put('variables_set',{VALUE:num(0)},{VAR:{id:'i'}}),put('controls_repeat_ext',{TIMES:num(3),DO:chain(put('math_change',{DELTA:num(1)},{VAR:{id:'i'}}),print(expr('i')))}))],[{id:'i',name:'i'}]);
 try{const {code,issues}=e.m.generate(ws,e.g,'kk');assert.equal(issues.length,0);const trace=read('trace-engine.py');const result=python(trace+'\nprint(json.dumps(trace_code('+JSON.stringify(code)+', ""), ensure_ascii=False))\n');const data=JSON.parse(result);assert.equal(data.ok,true,JSON.stringify(data));assert.ok(data.frames.length>=3);}finally{ws.dispose();}
});
