/* Teacher-facing descriptive summaries. Empty responses are not mistakes.
 * Scores come only from teacher-reviewed work. No automated grade is assigned.
 */
(() => {
 'use strict';const codes=['C','OD','E','TH','INK'];
 const stamp=a=>String(a.submittedAt||a.lastRunAt||a.startedAt||a.__createdAt||'');
 function attempts(ws={}){const unique=new Map();for(const a of ws.assignments||[])for(const at of a.attempts||[])if(!unique.has(at.id))unique.set(at.id,{...at,assignment:a,task:a.task});return [...unique.values()];}
 function thinking({users=[],workspace={}}={}){
  const all=attempts(workspace),rows=users.filter(u=>!u.deletedAt).map(u=>{const list=all.filter(a=>a.userId===u.id).sort((a,b)=>stamp(b).localeCompare(stamp(a))),at=list[0];
   return {user:u,attempt:at,cells:codes.map(code=>{const s=at?.steps?.find(x=>x.stepCode===code),reviewed=at?.status==='graded'&&s?.score!==''&&s?.score!==undefined;return {code,score:reviewed?Number(s.score):null,state:reviewed?(Number(s.score)<2?'support':'reviewed'):s?.response?.trim()?'saved':'empty'};})};
  });
  const difficulties=codes.map(code=>{const latest=new Map();for(const at of all){if(at.status!=='graded'||!users.some(u=>u.id===at.userId&&!u.deletedAt))continue;const s=at.steps?.find(s=>s.stepCode===code);if(s?.score===undefined||s.score===''||s.score===null)continue;const previous=latest.get(at.userId),time=String(at.__updatedAt||stamp(at));if(!previous||time>previous.time)latest.set(at.userId,{time,score:Number(s.score)});}const low=[...latest].filter(([,v])=>v.score<2).map(([id])=>id);return {code,count:low.length,assessed:latest.size,userIds:low};}).filter(x=>x.count).sort((a,b)=>b.count-a.count||codes.indexOf(a.code)-codes.indexOf(b.code));
  return {rows,difficulties};
 }
 function timeline(review={}){
  const out=[];for(const r of review.evidence||[]){if(r.kind!=='run')continue;let d;try{d=JSON.parse(r.detailsJson);}catch{continue;}if(!d.completed)continue;out.push({id:r.id,kind:'run',time:r.__createdAt||r.updatedAt||'',code:d.code||'',input:d.input||'',output:d.output||'',prediction:d.prediction||'',comparison:d.comparison||'',explanation:d.explanation||''});}
  const at=review.attempt||{};out.push({id:at.id,kind:at.status==='in_progress'?'draft':'submitted',time:at.submittedAt||at.__createdAt||'',code:at.code||'',input:at.inputData||'',output:at.output||'',explanation:at.teacherComment||''});
  for(const c of review.corrections||[])out.push({id:c.id,kind:'correction',time:c.createdAt||'',code:c.code||'',input:c.inputData||'',output:c.output||'',explanation:c.explanation||'',feedback:c.feedback||'',status:c.status,score:c.score});
  return out.sort((a,b)=>String(a.time).localeCompare(String(b.time))||String(a.id).localeCompare(String(b.id)));
 }
 function diff(before='',after=''){
  const left=String(before).split('\n'),right=String(after).split('\n'),n=Math.min(250,Math.max(left.length,right.length));
  return Array.from({length:n},(_,i)=>({line:i+1,before:left[i]??'',after:right[i]??'',changed:left[i]!==right[i]}));
 }
 window.CT_TEACHER={attempts,thinking,timeline,diff,codes};
})();
