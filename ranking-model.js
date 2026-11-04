/* Teacher-published class rankings. Weekly growth is measured from snapshots,
 * never reconstructed from pupil submission times or self-reported test runs. */
(() => {
 'use strict';
 const OFFSET=5*60*60*1000,DAY=86400000;
 const badges=[
  {id:'first',icon:'🌱',kk:'Алғашқы қадам',ru:'Первый шаг',kkHelp:'Бір түрлі есептен мұғалімнің оң бағасын алды.',ruHelp:'Получена положительная оценка учителя за одну задачу.'},
  {id:'five',icon:'🏅',kk:'Алғашқы 5 тапсырма',ru:'Первые 5 задач',kkHelp:'Бес түрлі есептен мұғалімнің оң бағасын алды.',ruHelp:'Положительно оценены пять разных задач.'},
  {id:'ten',icon:'🚀',kk:'10 тапсырма',ru:'10 задач',kkHelp:'Он түрлі есептен мұғалімнің оң бағасын алды.',ruHelp:'Положительно оценены десять разных задач.'},
  {id:'corrected',icon:'🔍',kk:'Қатесін түзетті',ru:'Исправил ошибку',kkHelp:'Түзету үшін мұғалімнен ең жоғары бағаның кемінде 2/3 бөлігін алды.',ruHelp:'За исправление получено не менее 2/3 максимальной оценки учителя.'},
  {id:'persistent',icon:'🧩',kk:'Табанды зерттеуші',ru:'Настойчивый исследователь',kkHelp:'Үш түрлі түзетуден мұғалімнің кемінде 2/3 бағасын алды.',ruHelp:'Три разных исправления оценены учителем не ниже 2/3 максимума.'}
 ];
 function weekKey(now=Date.now()){
  const d=new Date(Number(new Date(now))+OFFSET),day=(d.getUTCDay()+6)%7;
  d.setUTCDate(d.getUTCDate()-day);return d.toISOString().slice(0,10);
 }
 function period(key){const start=new Date(key+'T00:00:00+05:00');return {start:start.toISOString(),end:new Date(+start+7*DAY).toISOString()};}
 function project(tables,compute,previous=[],now=Date.now()){
  const old=new Map(previous.map(r=>[r.userId,r])),classes=new Map((tables.Classes||[]).map(c=>[c.id,c]));
  const membership=new Map((tables.ClassStudents||[]).map(c=>[c.userId,c.classId])),assignments=new Map((tables.Assignments||[]).map(a=>[a.id,a])),tasks=new Map((tables.Tasks||[]).map(t=>[t.id,t]));
  const prefs=new Map((tables.StudentProfiles||[]).map(p=>[p.userId,p])),week=weekKey(now),stamp=new Date(now).toISOString();
  return (tables.Users||[]).filter(u=>u.role==='student'&&String(u.active)==='true'&&!u.deletedAt&&membership.has(u.id)).map(u=>{
   const history=(tables.TaskAttempts||[]).filter(a=>a.userId===u.id).map(attempt=>{const a=assignments.get(attempt.assignmentId);return a&&tasks.has(a.taskId)?{...a,task:tasks.get(a.taskId),attempt}:null;}).filter(Boolean);
   const fixes=(tables.Corrections||[]).filter(c=>c.userId===u.id),probes=(tables.TransferProbes||[]).filter(p=>p.userId===u.id);
   const profile=compute({workspace:{history,transferProbes:probes},corrections:{history:fixes}}),completed=profile.ledger.filter(l=>l.kind==='task').length;
   const byAttempt=new Map(history.map(a=>[a.attempt.id,a])),corrected=new Set();
   for(const c of fixes){const max=c.kind==='task'?15:3;if(c.status!=='reviewed'||Number(c.score)<max*2/3||!Number.isFinite(Number(c.score)))continue;
    const a=byAttempt.get(c.sourceId),key=c.kind==='task'?'task:'+(a?.task?.sourceKey||a?.task?.id||c.sourceId):'diagnostic:'+c.sourceId+':'+c.taskIndex;corrected.add(key);
   }
   const earned=[];if(completed>=1)earned.push('first');if(completed>=5)earned.push('five');if(completed>=10)earned.push('ten');if(corrected.size>=1)earned.push('corrected');if(corrected.size>=3)earned.push('persistent');
   const prior=old.get(u.id),classId=membership.get(u.id),xp=profile.xp;
   const sameWeek=prior?.weekKey===week&&prior.classId===classId;
   const weekStartXP=prior&&prior.classId===classId?(sameWeek?prior.weekStartXP:prior.xp):xp;
   const baselineXP=prior?.baselineXP??xp;
   return {userId:u.id,name:u.name,classId,className:classes.get(classId)?.name||u.className||'',grade:String(u.grade||''),avatar:['robot','rocket','owl','cat','turtle','star'].includes(prefs.get(u.id)?.avatar)?prefs.get(u.id).avatar:'robot',xp,completed,corrections:corrected.size,badges:earned,weekKey:week,weekStartXP,weeklyXP:Math.max(0,xp-weekStartXP),baselineXP,growthXP:Math.max(0,xp-baselineXP),trackingSince:prior?.trackingSince||stamp};
  });
 }
 function board(rows,{classId,mode='total',now=Date.now()}={}){
  const key=weekKey(now),metric=mode==='weekly'?'weeklyXP':'xp',ids=new Set();
  const result=rows.filter(r=>r.classId===classId&&!ids.has(r.userId)&&ids.add(r.userId)).map(r=>({...r,value:mode==='weekly'&&r.weekKey!==key?0:Math.max(0,Number(r[metric])||0)}));
  result.sort((a,b)=>b.value-a.value||String(a.name).localeCompare(String(b.name),'kk')||a.userId.localeCompare(b.userId));
  let prior=-1,rank=0;return result.map((r,i)=>{if(r.value!==prior){rank=i+1;prior=r.value;}return {...r,rank:r.value>0?rank:null,tied:r.value>0&&result.filter(x=>x.value===r.value).length>1};});
 }
 function nextGap(rows,userId){const me=rows.find(r=>r.userId===userId);if(!me)return null;const higher=rows.filter(r=>r.value>me.value);return higher.length?Math.min(...higher.map(r=>r.value))-me.value+1:null;}
 window.CT_RANKING_MODEL={weekKey,period,project,board,nextGap,badges};
})();
