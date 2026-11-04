/* Shared display model. XP always comes from teacher-published summaries. */
(() => {
 'use strict';
 const ONLINE_MS=150000;
 function scores(tables,compute){
  const assignments=new Map((tables.Assignments||[]).map(a=>[a.id,a]));
  const tasks=new Map((tables.Tasks||[]).map(t=>[t.id,t]));
  const classes=new Map((tables.ClassStudents||[]).map(c=>[c.userId,c.classId]));
  return (tables.Users||[]).filter(u=>u.role==='student'&&String(u.active)==='true'&&!u.deletedAt&&classes.has(u.id)).map(u=>{
   const history=(tables.TaskAttempts||[]).filter(a=>a.userId===u.id).map(attempt=>{
    const a=assignments.get(attempt.assignmentId);return a&&tasks.has(a.taskId)?{...a,task:tasks.get(a.taskId),attempt}:null;
   }).filter(Boolean);
   const corrections={history:(tables.Corrections||[]).filter(c=>c.userId===u.id)};
   const probes=(tables.TransferProbes||[]).filter(p=>p.userId===u.id);
   return {userId:u.id,name:u.name,classId:classes.get(u.id),xp:compute({workspace:{history,transferProbes:probes},corrections}).xp};
  });
 }
 function online(presence,scoreRows,now=Date.now()){
  const published=new Map(scoreRows.map(s=>[s.userId,s])),unique=new Map();
  for(const p of presence){
   const seen=Date.parse(p.lastSeen),age=now-seen;
   if(!Number.isFinite(seen)||age< -10000||age>ONLINE_MS||!['student','teacher'].includes(p.role))continue;
   const score=published.get(p.userId),xp=score&&score.classId===p.classId&&Number.isInteger(score.xp)&&score.xp>=0?score.xp:null;
   const row={userId:p.userId,name:String(p.name||''),role:p.role,xp:p.role==='student'?xp:null,lastSeen:p.lastSeen};
   if(!unique.has(p.userId)||seen>Date.parse(unique.get(p.userId).lastSeen))unique.set(p.userId,row);
  }
  return [...unique.values()].sort((a,b)=>(a.role===b.role?0:a.role==='teacher'?-1:1)||(b.xp??-1)-(a.xp??-1)||a.name.localeCompare(b.name));
 }
 window.CT_COMMUNITY_MODEL={scores,online,ONLINE_MS};
})();
