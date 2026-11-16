'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../monitoring.js');
function fixture(){
 const users=[['a','7А'],['b','7a'],['c','8А'],['d','7А']].map(([id,className])=>({id,name:id,login:id,role:'student',grade:className[0],className}));
 const diag=(id,type,score,status='graded',extra={})=>({id:id+'-'+type,userId:id,attemptType:type,grade:users.find(u=>u.id===id).grade,status,totalScore:score,...extra});
 const attempts=[diag('a','baseline',8),diag('a','final',15),diag('b','baseline',20),diag('b','final',null,'submitted'),diag('c','baseline',0),diag('c','final',0),diag('d','baseline','')];
 const cls=[{id:'c7',name:'7А',grade:'7'},{id:'c8',name:'8А',grade:'8'}];
 const assignments=[{id:'as7',classId:'c7',status:'published',task:{id:'t7',sourceKey:'guide-01',grade:'7',title:'Task 7'},attempts:[{id:'work-a',userId:'a',status:'graded',score:9},{id:'work-b',userId:'b',status:'submitted',score:''}]},{id:'as8',classId:'c8',status:'published',task:{id:'t8',sourceKey:'guide-05',grade:'8',title:'Task 8'},attempts:[]}];
 return {dashboard:{users,attempts},workspace:{classes:cls,assignments},timings:[{id:'time-a',userId:'a',attemptId:'work-a',phase:'task',totalSeconds:120}],content:{tasks:[]}};
}
test('compares only the same assessed pupils; missing scores are never zero',()=>{
 const r=M.build(fixture());assert.equal(r.summary.students,4);assert.equal(r.summary.paired,2);
 assert.equal(r.summary.baseline,4);assert.equal(r.summary.final,7.5);assert.equal(r.summary.delta,3.5);
 assert.equal(r.rows.find(x=>x.user.id==='b').final.score,null);assert.equal(r.rows.find(x=>x.user.id==='d').baseline.score,null);
 assert.equal(r.rows.find(x=>x.user.id==='c').delta,0);assert.equal(r.summary.pendingDiagnostics,1);
});
test('class normalization joins Cyrillic/Latin case variants and does not mutate the snapshot',()=>{
 const f=fixture(),before=JSON.stringify(f),r=M.build(f,{classKey:M.classKey('7a','7')});
 assert.equal(r.summary.students,3);assert.equal(r.summary.paired,1);assert.equal(r.summary.delta,7);
 assert.equal(r.classes.length,2);assert.equal(JSON.stringify(f),before);
 assert.equal(M.build(f,{search:'B'}).rows[0].user.id,'b');
});
test('support is based on valid teacher grades, not unanswered or pending work',()=>{
 const r=M.build(fixture()),by=id=>r.rows.find(x=>x.user.id===id);
 assert.equal(by('a').support,true);assert.equal(by('b').support,false);assert.equal(by('c').support,true);assert.equal(by('d').support,false);
 assert.equal(r.summary.pendingTasks,1);assert.equal(r.difficulties[0].assessed,1);assert.equal(r.difficulties[0].low,1);assert.equal(r.difficulties[0].average,9);
 assert.equal(M.build(fixture(),{status:'paired'}).rows.length,2);assert.equal(M.build(fixture(),{status:'pending'}).rows.length,1);
});
test('archived/foreign users and previous-grade diagnoses never enter the comparison',()=>{
 const f=fixture();f.dashboard.users[0].deletedAt='2026-11-01';f.dashboard.attempts.push({id:'foreign',userId:'outside',attemptType:'final',status:'graded',totalScore:21});
 f.dashboard.attempts.find(x=>x.id==='c-final').grade='7';const r=M.build(f);
 assert.equal(r.summary.students,3);assert.equal(r.summary.paired,0);assert.equal(r.summary.delta,null);
});
test('latest attempt wins, including pending retakes; invalid scores stay unassessed',()=>{
 const f=fixture();f.dashboard.attempts.find(x=>x.id==='a-final').startedAt='2026-11-01';
 f.dashboard.attempts.push({id:'retake',userId:'a',grade:'7',attemptType:'final',status:'in_progress',startedAt:'2026-11-16',totalScore:21});
 f.dashboard.attempts.find(x=>x.id==='c-final').totalScore=99;
 const r=M.build(f);assert.equal(r.summary.paired,0);assert.equal(r.rows.find(x=>x.user.id==='a').final.status,'in_progress');assert.equal(r.rows.find(x=>x.user.id==='c').final.invalid,true);
});
test('assignment copies are deduplicated, old-class work and duplicate timing are excluded',()=>{
 const f=fixture();f.workspace.classes.push({id:'dup7',name:'7a',grade:'7'});
 f.workspace.assignments.push({...f.workspace.assignments[0],id:'duplicate',classId:'dup7',attempts:[]});
 f.workspace.assignments[1].attempts.push({id:'old-a',userId:'a',score:15,status:'graded'});
 f.timings.push({...f.timings[0]},{id:'foreign-time',userId:'b',attemptId:'work-a',totalSeconds:900},{id:'old-time',userId:'a',attemptId:'old-a',totalSeconds:900});
 const a=M.build(f).rows.find(x=>x.user.id==='a');assert.equal(a.tasks.total,1);assert.equal(a.tasks.graded,1);assert.equal(a.tasks.seconds,120);
});
test('empty cohorts have no invented averages, and negative growth remains visible',()=>{
 const f=fixture();f.dashboard.attempts.find(x=>x.id==='a-final').totalScore=5;
 assert.equal(M.build(f,{search:'a'}).summary.delta,-3);
 const r=M.build(f,{search:'nobody'});assert.equal(r.summary.students,0);assert.equal(r.summary.baseline,null);assert.equal(r.summary.delta,null);
});
test('render escapes user data and renders bilingual missing-data and paired-cohort explanations',()=>{
 const f=fixture();f.dashboard.users[0].name='<img src=x onerror=alert(1)>';
 const r=M.build(f);const kk=M.html(r,{lang:'kk'}),ru=M.html(r,{lang:'ru'});
 assert.ok(!kk.includes('<img'));assert.ok(kk.includes('&lt;img'));assert.match(kk,/21/);assert.match(kk,/Бағалау күтілуде/);assert.match(kk,/бірдей/);assert.match(ru,/одним и тем же/);
 assert.ok(!/NaN|undefined|Infinity/.test(kk));assert.match(M.html(M.build(f,{search:'none'})),/Оқушы табылмады/);
});
