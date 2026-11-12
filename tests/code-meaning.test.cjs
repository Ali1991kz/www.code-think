'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),context=vm.createContext({});vm.runInContext(read('code-meaning.js'),context);const model=context.CT_CODE_MEANING;
const analyze=(code,offset=0)=>JSON.parse(JSON.stringify(model.analyze(code,offset)));
test('Kazakh descriptions explain nested input conversion, calculations and assignment without inventing values',()=>{
 const a=analyze('age = int(input())');assert.equal(a.kind,'assignment');assert.match(a.message,/Пайдаланушы енгізген мәтінді бүтін санға/);assert.match(a.message,/«age» айнымалысына/);
 const b=analyze('total = price * quantity');assert.match(b.message,/«price» және «quantity»/);assert.match(b.message,/көбейту/);assert.ok(!b.message.includes('100'));
 const c=analyze('values.append(price)');assert.match(c.message,/соңына «price» мәнін қосады/);assert.match(c.message,/None/);
});
test('assignment, equality, boundary comparisons and named arguments have distinct meanings',()=>{
 assert.equal(analyze('a = 1',2).picked.title,'Мән беру');assert.equal(analyze('a == 1',2).picked.title,'Теңдігін тексеру');assert.equal(analyze('a == 1').kind,'expression');
 const cond=analyze('if age >= 18:',8);assert.equal(cond.kind,'condition');assert.match(cond.picked.meaning,/тең мәнді/);
 const named=analyze('print("Hi", end="!")',15);assert.equal(named.commands.find(x=>x.token==='=').title,'Атаулы аргумент');assert.ok(!named.message.includes('«"!"» мәндерін'));
 assert.match(analyze('print(end="")').message,/Атаулы параметрлермен/);
});
test('range stops are exclusive and loop else is not described as an if else',()=>{
 assert.match(analyze('for i in range(1, 8, 2):').message,/кірмейтін соңғы шегі «8»/);
 assert.match(analyze('while total < 10:').message,/әр айналым алдында/);
 const code='for i in data:\n    print(i)\nelse:';assert.match(analyze(code,code.length-1).message,/break арқылы тоқтатылмай/);
 const branch='if ready:\n    print(1)\nelse:';assert.match(analyze(branch,branch.length-1).message,/ешбір шарты ақиқат болмаса/);
});
test('comments, string contents, triple quoted strings and UTF-16 selections do not become commands',()=>{
 assert.equal(analyze('# if input() == 3',5).commands.length,0);
 const a=analyze('text = "if input() == 3"',12);assert.ok(!a.commands.some(x=>x.token==='if'||x.token==='input'||x.token==='=='));assert.equal(a.picked,null);
 const code='text = """start\nif input()\nend"""';const b=analyze(code,code.indexOf('input'));assert.equal(b.kind,'literal');assert.equal(b.commands.length,0);
 const unicode='message = "💡"\nprint(message)';const c=analyze(unicode,unicode.indexOf('print'));assert.equal(c.line,2);assert.equal(c.source,'print(message)');assert.equal(c.picked.token,'print');
 assert.equal(analyze('\nprint(1)',0).start,0);
});
test('partial and unsupported Python is explicitly limited instead of fabricated',()=>{
 for(const code of ['name = input(','if age >=','x = "unfinished','values = [x for x in data]','x := 3','a = b = 3','x = {"a": 1}','a b = 2'])assert.ok(['unsupported','incomplete'].includes(analyze(code).kind),code);
 for(const code of ['if a < b < c:','print(a < b < c)'])assert.notEqual(analyze(code).kind,'assignment');assert.match(analyze('a < b < c').message,/тізбекті салыстыру/);
 const shadow='print = custom\nprint(3)';assert.ok(!analyze(shadow,shadow.length-1).message.includes('экранға шығарады'));
 for(let i=0;i<100;i++)assert.doesNotThrow(()=>analyze('('.repeat(i)+'x'+')'.repeat(i),i));
});
test('definitions and control statements describe actions without running them',()=>{
 assert.equal(analyze('def double(value):').kind,'definition');assert.match(analyze('return total').message,/функциядан қайтарып/);
 assert.match(analyze('break').message,/ең жақын цикл/);assert.match(analyze('pass').message,/тоқтатпайды/);
 const source='__import__("os").system("not executed")';assert.equal(analyze(source).kind,'expression');assert.ok(source.includes('not executed'));
});
function blocks(){const c=vm.createContext({console,setTimeout,clearTimeout});vm.runInContext('window=globalThis',c);for(const f of ['vendor/blockly/blockly_compressed.js','vendor/blockly/blocks_compressed.js','vendor/blockly/python_compressed.js','vendor/blockly/msg/en.js','block-model.js','code-meaning.js'])vm.runInContext(read(f),c);c.CT_BLOCK_MODEL.install(c.Blockly,c.python.pythonGenerator,'kk');return c;}
test('block-to-line links preserve byte-for-byte generated Python, workspace and generators',()=>{
 const c=blocks(),B=c.Blockly,g=c.python.pythonGenerator,ws=new B.Workspace(),n=x=>({block:{type:'math_number',fields:{NUM:x}}});
 const variable={type:'variables_get',id:'value',fields:{VAR:{id:'i'}}};
 const output={type:'ct_print',id:'out',inputs:{VALUE:{block:variable}}};
 const loop={type:'ct_range',id:'loop',fields:{VAR:{id:'i'}},inputs:{START:n(0),STOP:n(3),STEP:n(1),DO:{block:output}}};
 B.serialization.workspaces.load({variables:[{name:'i',id:'i'}],blocks:{languageVersion:0,blocks:[loop]}},ws);
 try{const source=g.workspaceToCode(ws),before=JSON.stringify(B.serialization.workspaces.save(ws)),fn=g.forBlock.ct_print,links=c.CT_CODE_MEANING.blockLines(ws,g,source),lines=source.split('\n');assert.equal(links.byLine[lines.findIndex(x=>x.startsWith('for '))+1],'loop');assert.equal(links.byLine[lines.findIndex(x=>x.includes('print('))+1],'out');assert.equal(links.byBlock.value,links.byBlock.out);assert.equal(g.workspaceToCode(ws),source);assert.equal(JSON.stringify(B.serialization.workspaces.save(ws)),before);assert.equal(g.forBlock.ct_print,fn);assert.equal(Object.keys(c.CT_CODE_MEANING.blockLines(ws,g,'different code').byLine).length,0);}finally{ws.dispose();}
});
test('duplicate statement text links to separate lines, never all to the first occurrence',()=>{
 const c=blocks(),B=c.Blockly,g=c.python.pythonGenerator,ws=new B.Workspace();B.serialization.workspaces.load({blocks:{languageVersion:0,blocks:[{type:'ct_print',id:'one',inputs:{VALUE:{block:{type:'math_number',fields:{NUM:1}}}},next:{block:{type:'ct_print',id:'two',inputs:{VALUE:{block:{type:'math_number',fields:{NUM:1}}}}}}}]}},ws);
 try{const code=g.workspaceToCode(ws),links=c.CT_CODE_MEANING.blockLines(ws,g,code);assert.notEqual(links.byBlock.one,links.byBlock.two);assert.equal(links.byLine[links.byBlock.one],'one');assert.equal(links.byLine[links.byBlock.two],'two');}finally{ws.dispose();}
});
