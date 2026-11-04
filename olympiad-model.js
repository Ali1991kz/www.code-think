/* Olympiad practice is distinct from teacher grades and profile XP. */
(() => {
 'use strict';
 function readiness(tables,u){
  const tasks=new Map((tables.Tasks||[]).map(x=>[x.id,x]));
  // The existing 7/8 task keys are interleaved; use the canonical grade bank.
  const expected=new Set((window.CT_CORE?.taskSeed||[]).filter(t=>String(t.grade)===String(u.grade)).map(t=>t.sourceKey));
  const assignments=new Map((tables.Assignments||[]).map(a=>[a.id,a]));
  const finished=new Set();
  for(const attempt of tables.TaskAttempts||[]){
   if(attempt.userId!==u.id||attempt.status!=='graded')continue;
   const a=assignments.get(attempt.assignmentId),key=tasks.get(a?.taskId)?.sourceKey;
   if(expected.has(key))finished.add(key);
  }
  const total=expected.size,completed=finished.size;
  return {completed,total,allowed:String(u.grade)==='8'&&total===12&&completed===total};
 }
 const normalize=x=>String(x??'').trim().split(/\s+/).filter(Boolean).join(' ');
 function expand(test){
  if(!test.recipe)return test.input;
  const task=test.recipe.task,n=[11,12].includes(task)?200000:[1,7,10].includes(task)?100000:20000;
  if(task===1)return 'a'.repeat(n)+'\n'+'z'.repeat(n)+'\n';
  if(task===7)return 'a'.repeat(n)+'\n'+'z'.repeat(n)+'\n1\na z 0\n';
  if(task===11)return 'a'.repeat(n)+'\n'+'z'.repeat(n)+'\n'+'az'.repeat(n/2)+'\n';
  if(task===12)return 'a'.repeat(n)+'\n1\na b 0\n';
  if(task===13)return n+' 3\n1 SET 1 1000000000\n'+Array.from({length:n-1},(_,i)=>(i+2)+' ADD 1 1000000000').join('\n')+'\n1 1\n'+(n+1)+' 1\n2 1\n';
  const h=Array.from({length:n},(_,i)=>i+1).join(' ');
  const commands=task===10?['1 '+n+' 2 3',n+' 1 2 3']:task===14?['1 1 '+n+' 2 3','2 '+n+' 1','1 1 '+n+' 2 3']:['1 1 2 3 '+n+' 2 3 '+n,'2 '+n+' 1','1 1 2 3 '+n+' 2 3 '+n];
  return n+' '+commands.length+'\n'+h+'\n'+commands.join('\n')+'\n';
 }
 window.CT_OLYMPIAD_MODEL={readiness,normalize,expand};
})();
