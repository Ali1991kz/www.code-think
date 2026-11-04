const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=f=>fs.readFileSync(path.join(root,f),'utf8');
function model(){const c=vm.createContext({window:{}});vm.runInContext(source('profile-engine.js'),c);vm.runInContext(source('ranking-model.js'),c);return c.window;}
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(){return {
 Users:[{id:'u1',name:'Айым',grade:'7',className:'7 А',role:'student',active:true},{id:'u2',name:'Мәди',grade:'7',role:'student',active:true},{id:'u3',name:'Other',grade:'8',role:'student',active:true},{id:'old',name:'Archived',grade:'7',role:'student',active:false}],
 ClassStudents:[{userId:'u1',classId:'c7'},{userId:'u2',classId:'c7'},{userId:'u3',classId:'c8'},{userId:'old',classId:'c7'}],Classes:[{id:'c7',name:'7 А',active:true},{id:'c8',name:'8 А',active:true}],
 Tasks:[{id:'t1',sourceKey:'one'},{id:'t2',sourceKey:'one'},{id:'t3',sourceKey:'two'}],Assignments:[{id:'a1',taskId:'t1'},{id:'a2',taskId:'t2'},{id:'a3',taskId:'t3'}],
 TaskAttempts:[{id:'try1',userId:'u1',assignmentId:'a1',status:'graded',score:8},{id:'try2',userId:'u1',assignmentId:'a2',status:'graded',score:12},{id:'try3',userId:'u1',assignmentId:'a3',status:'submitted',score:15}],
 Corrections:[{id:'f1',userId:'u1',kind:'task',sourceId:'try1',status:'reviewed',score:10},{id:'f2',userId:'u1',kind:'task',sourceId:'try2',status:'reviewed',score:15},{id:'f3',userId:'u1',kind:'task',sourceId:'try3',status:'submitted',score:15}],
 TransferProbes:[{id:'p1',userId:'u1',sourceKey:'one',phase:'independent',status:'reviewed',scoresJson:'[3,3,3]'}],
 StudentProfiles:[{userId:'u1',avatar:'cat',goalText:'PRIVATE GOAL',weeklyTarget:5}],DebugLabWork:[{userId:'u1',status:'practiced',passed:99}],OlympiadWork:[{userId:'u1',solved:true}]
};}
test('teacher-reviewed best work only: XP parity, unique tasks/fixes, public safe fields and badges',()=>{
 const w=model(),tables=fixture(),rows=w.CT_RANKING_MODEL.project(tables,w.CT_PROFILE.compute,[],'2026-11-04T12:00:00Z'),r=rows[0];
 assert.equal(rows.length,3);assert.equal(r.xp,180);assert.equal(r.completed,1);assert.equal(r.corrections,1);assert.equal(r.avatar,'cat');assert.deepEqual(copy(r.badges),['first','corrected']);assert.equal(r.weeklyXP,0);assert.equal(r.growthXP,0);
 const other=copy(tables);other.DebugLabWork=[];other.OlympiadWork=[];assert.deepEqual(copy(w.CT_RANKING_MODEL.project(other,w.CT_PROFILE.compute,[],'2026-11-04T12:00:00Z')),copy(rows));
 assert.ok(!JSON.stringify(r).includes('PRIVATE'));assert.ok(!Object.keys(r).some(k=>/login|password|goal|answer|code|scoreJson/i.test(k)));
});
test('week starts Monday in UTC+5, first publication excludes old XP; repeats and downgrades do not farm XP',()=>{
 const w=model(),m=w.CT_RANKING_MODEL,t=fixture(),compute=w.CT_PROFILE.compute;
 assert.equal(m.weekKey('2026-11-08T18:59:59Z'),'2026-11-02');assert.equal(m.weekKey('2026-11-08T19:00:00Z'),'2026-11-09');
 assert.deepEqual(copy(m.period('2026-11-02')),{start:'2026-11-01T19:00:00.000Z',end:'2026-11-08T19:00:00.000Z'});
 let rows=m.project(t,compute,[],'2026-11-04T12:00:00Z');assert.equal(rows[0].weeklyXP,0);
 t.TaskAttempts[1].score=15;rows=m.project(t,compute,rows,'2026-11-04T13:00:00Z');assert.equal(rows[0].weeklyXP,30);assert.equal(rows[0].growthXP,30);
 rows=m.project(t,compute,rows,'2026-11-04T14:00:00Z');assert.equal(rows[0].weeklyXP,30);
 t.TaskAttempts[1].score=10;rows=m.project(t,compute,rows,'2026-11-05T14:00:00Z');assert.equal(rows[0].weeklyXP,0);assert.equal(rows[0].growthXP,0);
 t.TaskAttempts[1].score=15;rows=m.project(t,compute,rows,'2026-11-06T14:00:00Z');assert.equal(rows[0].weeklyXP,30);
 const stale=rows;rows=m.project(t,compute,rows,'2026-11-09T00:00:00Z');assert.equal(rows[0].weeklyXP,0);assert.equal(rows[0].growthXP,30);
 assert.equal(m.board(stale,{classId:'c7',mode:'weekly',now:'2026-11-09T00:00:00Z'})[0].value,0);
 t.TaskAttempts.push({id:'try4',userId:'u1',assignmentId:'a3',status:'graded',score:10});rows=m.project(t,compute,rows,'2026-11-09T01:00:00Z');assert.equal(rows[0].weeklyXP,100);
 t.ClassStudents[0].classId='c8';rows=m.project(t,compute,rows,'2026-11-09T02:00:00Z');assert.equal(rows[0].weeklyXP,0);assert.equal(rows[0].classId,'c8');
});
test('same XP shares place, zeros never win, class scope and next target are exact',()=>{
 const m=model().CT_RANKING_MODEL,rows=[{userId:'a',name:'A',classId:'c7',xp:100},{userId:'b',name:'B',classId:'c7',xp:100},{userId:'c',name:'C',classId:'c7',xp:50},{userId:'d',name:'D',classId:'c7',xp:0},{userId:'other',name:'E',classId:'c8',xp:999}];
 const board=m.board(rows,{classId:'c7'});assert.deepEqual(copy(board.map(r=>r.rank)),[1,1,3,null]);assert.equal(board[0].tied,true);assert.equal(m.nextGap(board,'c'),51);assert.equal(m.nextGap(board,'a'),null);assert.equal(m.nextGap(board,'d'),51);assert.equal(m.nextGap(board,'absent'),null);
 assert.ok(m.board(rows.map(r=>({...r,xp:0})),{classId:'c7'}).every(r=>r.rank===null));
});
test('badge thresholds count distinct positive reviewed tasks and qualifying corrections',()=>{
 const w=model(),t=fixture();for(let i=0;i<10;i++){t.Tasks.push({id:'new'+i,sourceKey:'new'+i});t.Assignments.push({id:'new'+i,taskId:'new'+i});t.TaskAttempts.push({id:'new'+i,assignmentId:'new'+i,userId:'u2',status:'graded',score:1});}
 for(let i=0;i<3;i++)t.Corrections.push({id:'c'+i,userId:'u2',kind:'task',sourceId:'new'+i,status:'reviewed',score:10});
 const r=w.CT_RANKING_MODEL.project(t,w.CT_PROFILE.compute)[1];assert.equal(r.completed,10);assert.deepEqual(copy(r.badges),['first','five','ten','corrected','persistent']);
});
test('pupil and teacher UI: tabs, own highlight, tie labels, escaped names, weekly reset and Russian',async()=>{
 const listeners={},rootNode={outerHTML:''},w=model();
 const c=vm.createContext({window:w,document:{querySelector:s=>s==='#rankingRoot'?rootNode:null,addEventListener:(name,f)=>listeners[name]=f},console});vm.runInContext(source('ranking.js'),c);
 const rows=w.CT_RANKING_MODEL.project(fixture(),w.CT_PROFILE.compute,[],'2026-11-04T12:00:00Z');rows[0].name='<img src=x onerror=alert(1)>';
 const data={rows,classes:[{id:'c7',name:'7 А'}],serverNow:'2026-11-04T12:00:00Z',updatedAt:'2026-11-04T12:00:00Z'};
 const context={user:{id:'u1',role:'student',className:'7 А'},lang:'kk',api:async a=>{assert.equal(a,'rankingWorkspace');return data;}};
 await w.CT_RANKING.load(context);let html=w.CT_RANKING.html();assert.match(html,/aria-current="true"/);assert.match(html,/&lt;img/);assert.ok(!html.includes('<img src=x'));assert.match(html,/Жалпы рейтинг/);assert.ok(!html.includes('<select'));
 await listeners.click({target:{closest:()=>({dataset:{ranking:'mode',mode:'weekly'}})}});html=w.CT_RANKING.html();assert.match(html,/Аптаның үздіктері/);assert.ok(!html.includes('class="ranking-leader"'));
 w.CT_RANKING.context({...context,lang:'ru'});assert.match(w.CT_RANKING.html(),/Лидеры недели/);
 await w.CT_RANKING.load({...context,user:{id:'teacher',role:'teacher'}});assert.match(w.CT_RANKING.html(),/data-ranking-class/);
 assert.match(source('platform.js'),/data-page="ranking"/);assert.match(source('platform.js'),/data-tab="ranking"/);assert.match(source('index.html'),/ranking-model.js\?v=12.2.0.*firebase-direct.js\?v=12.2.0.*ranking.js\?v=12.2.0/);
});
test('late loads cannot leak a previous account and errors provide a retry',async()=>{
 const w=model();vm.runInContext(source('ranking.js'),vm.createContext({window:w,document:{querySelector:()=>null,addEventListener(){}}}));let resolve;
 const pending=w.CT_RANKING.load({user:{id:'one',role:'student'},lang:'kk',api:()=>new Promise(r=>resolve=r)});
 w.CT_RANKING.context({user:{id:'two',role:'student'},lang:'kk',api:async()=>{throw Error('offline');}});resolve({rows:[{name:'PRIVATE OLD ACCOUNT'}],classes:[]});await pending;assert.ok(!w.CT_RANKING.html().includes('PRIVATE OLD ACCOUNT'));
 await w.CT_RANKING.load({user:{id:'two',role:'student'},lang:'kk',api:async()=>{throw Error('offline');}});assert.match(w.CT_RANKING.html(),/offline/);assert.match(w.CT_RANKING.html(),/data-ranking="refresh"/);
});
module.exports={fixture};
