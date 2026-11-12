'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c=vm.createContext({});vm.runInContext('window=globalThis',c);for(const f of ['code-meaning.js','code-context.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const build=source=>JSON.parse(JSON.stringify(c.CT_CODE_CONTEXT.build(source))),message=(source,line)=>build(source).rows[line-1].message;
const weekly='expenses = []\n\nfor i in range(7):\n    expense = float(input())\n    expenses.append(expense)\n\ntotal = sum(expenses)\naverage = total / 7\n\nprint(f"Жалпы: {total:.2f}")\nprint(f"Орташа: {average:.2f}")';
test('all physical lines retain exact source and explain actual roles in the seven-value program',()=>{
 const p=build(weekly);assert.equal(p.rows.length,11);assert.equal(p.rows.map(x=>x.source).join('\n'),weekly);
 assert.match(p.rows[0].message,/бос тізімді/);assert.match(p.rows[2].message,/денесі 7 рет/);assert.match(p.rows[3].message,/нақты санға айналдырады/);assert.match(p.rows[3].message,/3-жолдағы for циклінің ішінде/);
 assert.match(p.rows[4].message,/енгізілген нақты сан/);assert.match(p.rows[4].message,/«expenses» тізімінің соңына қосады/);assert.ok(!p.rows[4].message.includes('(бос тізім)'));
 assert.match(p.rows[6].message,/мәндерді қосады.*«total»/);assert.match(p.rows[7].message,/қосындысы.*«7» мәніне бөледі/);
 assert.match(p.rows[10].message,/«Орташа: » мәтінін/);assert.match(p.rows[10].message,/қосындысын «7» мәніне бөлудің нәтижесі/);assert.match(p.rows[10].message,/2 таңбамен/);assert.ok(!p.rows[10].message.includes('«f"'));
});
test('editing the real divisor or identifier updates explanations without claiming a correct average',()=>{
 const wrong=weekly.replace('total / 7','total / 6');assert.match(message(wrong,8),/«6» мәніне бөледі/);assert.match(message(wrong,11),/«6» мәніне бөлудің нәтижесі/);assert.ok(!message(wrong,8).includes('орташа'));
 const renamed=weekly.replaceAll('expenses','a').replaceAll('expense','b').replaceAll('total','s').replaceAll('average','m');assert.match(message(renamed,11),/«m».*«a» мәндерінің қосындысын/);assert.ok(!message(renamed,11).includes('expenses'));
 assert.match(message(wrong.replace('total / 6','total / 7'),11),/«7» мәніне бөлудің/);
});
test('f-string fields show conversion and fixed precision, escaping and nested expressions stay safe',()=>{
 assert.match(message('x = 2\nprint(f"{{x}} = {x:.3f}")',2),/«{x} = » мәтінін.*3 таңбамен/);
 assert.match(message('print(f"{value!r}")',1),/repr көрінісіне/);
 assert.match(message('print(f"{amount:{width}.2f}")',1),/әзірге толық түсіндіре алмаймын/);
 assert.match(message('print(f"{data[\'key\']:.2f}")',1),/2 таңбамен/);
 assert.match(message('print(f"{__import__(\'os\').system(\'never execute\')}")',1),/never execute/);
 assert.match(message('print("{average:.2f}")',1),/мәндерін экранға/);assert.ok(!message('print("{average:.2f}")',1).includes('2 таңбамен'));
});
test('range uses written boundaries and step, including negative and empty ranges',()=>{
 assert.match(message('for j in range(8, 1, -2):',1),/денесі 4 рет/);assert.match(message('for j in range(0):',1),/денесі 0 рет/);
 assert.ok(!message('for j in range(n):',1).includes('денесі 7 рет'));assert.ok(!message('for j in range(1, 7, 0):',1).includes('рет орындалады'));
});
test('conditional assignments, function locals and unsupported lines do not leak guessed roles',()=>{
 const branch='x = sum(values)\nif ready:\n    x = 2\nprint(x)';assert.ok(!message(branch,4).includes('қосындысы'));
 const local='def work():\n    x = sum(values)\nprint(x)';assert.ok(!message(local,3).includes('қосындысы'));
 const unknown='x = sum(values)\nexec(text)\nprint(x)';assert.ok(message(unknown,2).includes('шақырады'));assert.ok(!message(unknown,3).includes('қосындысы'));
 for(const header of ['class Example:','def work(x=1):','async def work():']){const code=header+'\n    inner = sum(values)\nprint(inner)';assert.ok(!message(code,3).includes('қосындысы'),header);}
 const shadow='sum = custom\nx = sum(values)\nprint(x)';assert.ok(!message(shadow,3).includes('қосындысы'));
 assert.match(message('unknown.append(x)',1),/нақты әрекеті нысанның түріне байланысты/);
 assert.ok(!message('x = sum(values)\nx, y = pair\nprint(x)',3).includes('қосындысы'));
 for(const source of ['x = [n for n in data]','if age >=','x = "unfinished'])assert.ok(['unsupported','incomplete'].includes(build(source).rows[0].kind));
});
test('comments, blank lines and multiline literals remain literal, not program actions',()=>{
 const rows=build('# print(f"{x:.2f}")\n\nx = """hello\nif input()\nend"""').rows;assert.equal(rows[0].kind,'comment');assert.equal(rows[1].kind,'empty');assert.equal(rows[3].kind,'literal');assert.ok(!rows[3].message.includes('сұрайды'));
 assert.equal(build('').rows.length,1);
});
