/* Private formative progress, derived from existing teacher-reviewed records.
 * No writable XP counter, no reward for clicks, drafts or repeated submissions.
 */
(() => {
 'use strict';
 const avatars={robot:'🤖',rocket:'🚀',owl:'🦉',cat:'🐱',turtle:'🐢',star:'⭐'};
 const levels=[0,100,300,600,1000,1600,2400,3400,4600,6000];
 const number=(v,max)=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Math.max(0,Math.min(max,Number(v))):0;
 const text=x=>String(x??'').replace(/\r/g,'').trim();
 function compute({workspace={},corrections={},ped={},evidence=[],now=new Date()}={}){
  const all=[...(workspace.assignments||[]),...(workspace.history||[])],bySource=new Map(),byAttempt=new Map();
  for(const a of all){if(a.attempt)byAttempt.set(a.attempt.id,a);const key=a.task?.sourceKey||a.task?.id||a.taskId;if(!key)continue;
   const old=bySource.get(key),score=a.attempt?.status==='graded'?number(a.attempt.score,15):-1,prior=old?.attempt?.status==='graded'?number(old.attempt.score,15):-1;
   if(!old||score>prior)bySource.set(key,a);
  }
  const tasks=[...bySource.values()],graded=tasks.filter(a=>a.attempt?.status==='graded'),ledger=[];
  for(const a of graded){const xp=Math.round(number(a.attempt.score,15)*10);if(xp)ledger.push({kind:'task',sourceKey:a.task?.sourceKey||a.taskId,title:a.task?.title||a.title,xp,date:a.attempt.submittedAt||'',id:a.id});}
  const fixes=new Map();
  for(const c of corrections.history||[]){if(c.status!=='reviewed')continue;const a=byAttempt.get(c.sourceId),key=c.kind==='task'?'task:'+(a?.task?.sourceKey||a?.taskId||c.sourceId):'diagnostic:'+c.sourceId+':'+c.taskIndex;
   const max=c.kind==='task'?15:3,ratio=number(c.score,max)/max;if(!fixes.has(key)||ratio>fixes.get(key).ratio)fixes.set(key,{...c,ratio});
  }
  for(const c of fixes.values()){const xp=Math.round(c.ratio*15);if(xp)ledger.push({kind:'correction',xp,date:c.reviewedAt||'',id:c.id});}
  const probes=new Map();
  for(const p of ped.probes||workspace.transferProbes||[]){if(p.status!=='reviewed')continue;let scores;try{scores=JSON.parse(p.scoresJson);}catch{continue;}if(!Array.isArray(scores)||scores.length!==3)continue;
   const sum=scores.reduce((n,v)=>n+number(v,3),0),key=(p.sourceKey||byAttempt.get(p.attemptId)?.task?.sourceKey||p.attemptId)+':'+p.phase;
   if(!probes.has(key)||sum>probes.get(key).sum)probes.set(key,{...p,sum,adaptation:number(scores[2],3)});
  }
  for(const p of probes.values()){const xp=Math.round(p.sum*5);if(xp)ledger.push({kind:'transfer',xp,date:p.reviewedAt||'',id:p.id});}
  const xp=ledger.reduce((n,x)=>n+x.xp,0);let level=levels.findIndex(n=>n>xp);if(level<0)level=levels.length;const floor=levels[level-1],next=levels[level]??null;
  const runs=[...evidence,...(ped.evidence||[])];
  const predicted=graded.some(a=>number((a.attempt.steps||[]).find(s=>s.stepCode==='TH')?.score,3)>=2&&runs.some(r=>{if(r.kind!=='run'||r.attemptId!==a.attempt.id)return false;try{const d=JSON.parse(r.detailsJson);return d.completed&&text(d.prediction)!==''&&text(d.prediction)===text(d.output)&&text(d.code)===text(a.attempt.code)&&String(d.input||'')===String(a.attempt.inputData||'');}catch{return false;}}));
  const cycles=graded.filter(a=>/цикл|қайталау|повтор/i.test(a.task?.topic||'')&&number(a.attempt.score,15)>=10).length;
  const badges=[
   {id:'first',icon:'🏁',name:['Алғашқы қадам','Первый шаг'],description:['Алғашқы оқу есебінен мұғалімнің кемінде 1 балын ал.','Получи хотя бы 1 балл учителя за первую учебную задачу.'],earned:graded.some(a=>number(a.attempt.score,15)>0)},
   {id:'debugger',icon:'🔍',name:['Қате іздеуші','Искатель ошибок'],description:['Қатемен жұмыстан мұғалім бағасының кемінде 2/3 бөлігін ал.','Получи не меньше 2/3 максимальной оценки за исправление.'],earned:[...fixes.values()].some(c=>c.ratio>=2/3)},
   {id:'predictor',icon:'🔮',name:['Дәл болжам','Точный прогноз'],description:['Болжамың нәтижеге сәйкес келсін және мұғалім «Тексер» кезеңін кемінде 2/3 бағаласын.','Предскажи результат точно и получи минимум 2/3 за этап «Проверь».'],earned:predicted},
   {id:'cycles',icon:'🔁',name:['Цикл шебері','Мастер циклов'],description:['Цикл тақырыбындағы екі түрлі есептен кемінде 10/15 ал.','Получи минимум 10/15 за две разные задачи с циклами.'],earned:cycles>=2},
   {id:'transfer',icon:'💡',name:['Білімді қолданушы','Применяю знания'],description:['Дербес қолдану жұмысынан 6/9 және бейімдеу өлшемінен кемінде 2/3 ал.','Получи 6/9 за самостоятельный перенос и минимум 2/3 за адаптацию.'],earned:[...probes.values()].some(p=>p.sum>=6&&p.adaptation>=2)}
  ];
  const current=(workspace.assignments||[]),topics=new Map();for(const a of current){const key=a.task?.topic||'Python',v=topics.get(key)||{topic:key,total:0,submitted:0,graded:0};v.total++;if(['submitted','graded'].includes(a.attempt?.status))v.submitted++;if(a.attempt?.status==='graded')v.graded++;topics.set(key,v);}
  const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7));const end=new Date(start);end.setDate(end.getDate()+7);
  const weekly=graded.filter(a=>{const d=new Date(a.attempt.submittedAt);return d>=start&&d<end;}).length;
  return {xp,level,next,floor,levelProgress:next===null?100:Math.min(100,Math.round((xp-floor)/(next-floor)*100)),badges,ledger:ledger.sort((a,b)=>String(b.date).localeCompare(String(a.date))),topics:[...topics.values()],weekly,
   total:current.length,submitted:current.filter(a=>['submitted','graded'].includes(a.attempt?.status)).length,graded:current.filter(a=>a.attempt?.status==='graded').length,inProgress:current.filter(a=>a.attempt?.status==='in_progress').length};
 }
 window.CT_PROFILE={compute,avatars,levels};
})();
