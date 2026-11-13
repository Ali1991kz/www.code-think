/* Formative browser execution evidence. No teacher grade or XP is awarded. */
(function(scope){
 'use strict';
 const bank=key=>scope.CT_MISSION_BANK?.[key]||null;
 const normalize=s=>String(s??'').trim().replace(/\r/g,'').split(/\s+/).filter(Boolean);
 const number=s=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)&&Number.isFinite(Number(s));
 function same(a,b){const x=normalize(a),y=normalize(b);return x.length===y.length&&x.every((v,i)=>number(v)&&number(y[i])?Math.abs(Number(v)-Number(y[i]))<=1e-6*Math.max(1,Math.abs(Number(y[i]))):v===y[i]);}
 function check(key,outputs){const m=bank(key);if(!m||!Array.isArray(outputs)||outputs.length!==m.cases.length)throw Error('Миссия сынақтары толық емес. / Проверки миссии неполные.');const checks=m.cases.map((c,i)=>({input:c.input,expected:c.output,output:String(outputs[i]?.output??'').slice(0,2000),ok:outputs[i]?.ok===true,passed:outputs[i]?.ok===true&&same(outputs[i].output,c.output)}));return {checks,passed:checks.filter(x=>x.passed).length,total:checks.length,success:checks.every(x=>x.passed)};}
 function results(key,record){const m=bank(key),valid=!!m&&record?.version===m.version&&record.key===key;const latest=valid?record.latest:null;return {complete:!!latest&&latest.success===true&&String(latest.reason||'').trim().length>0,passed:latest?.passed||0,total:m?.cases.length||0,attempts:valid?record.attempts||0:0};}
 function record(key,previous,p){
  const m=bank(key);if(!m)throw Error('Бұл есепке миссия жоқ. / Для задачи нет миссии.');
  const code=String(p.code||''),reason=String(p.reason||'').trim(),runId=String(p.runId||'');
  if(!code.trim()||code.length>4000||reason.length>1200||!runId||runId.length>100||String(p.runCode)!==code)throw Error('Миссия кодын қайта тексер. / Проверь текущий код миссии.');
  if(!Array.isArray(p.outputs)||p.outputs.some(x=>typeof x?.output!=='string'||x.output.length>2000||typeof x.ok!=='boolean'))throw Error('Орындау жазбасы қате. / Неверная запись выполнения.');
  const checked=check(key,p.outputs),old=previous?.key===key&&previous.version===m.version?previous:null;
  if(old?.latest?.runId===runId&&(old.latest.code!==code||JSON.stringify(old.latest.checks)!==JSON.stringify(checked.checks)))throw Error('Орындау нұсқасы өзгерген. / Версия запуска изменилась.');
  const latest={runId,code,reason,hints:Math.max(0,Math.min(2,Math.trunc(Number(p.hints)||0))),...checked},fresh=old?.latest?.runId!==runId;
  return {key,version:m.version,selfReported:true,attempts:(old?.attempts||0)+(fresh?1:0),first:old?.first||latest,latest};
 }
 function fields(key,record){const m=bank(key);if(!results(key,record).complete)return ['',''];const l=record.latest;return ['Бекіту миссиясы / Миссия закрепления\n'+m.kk.goal+'\n'+m.ru.goal+'\nPython:\n'+l.code+'\nСынақтар / Проверки: '+l.passed+'/'+l.total+'\nКөмек / Подсказки: '+l.hints+'\n'+l.checks.map((x,i)=>(i+1)+'. Кіріс / Ввод: '+x.input+'\nНәтиже / Вывод: '+x.output.slice(0,500)).join('\n'),l.reason];}
 scope.CT_MISSIONS={version:'12.7.0',bank,same,check,results,record,fields};
})(window);
