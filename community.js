/* One bounded heartbeat per account; stale sessions expire after 150 seconds.
 * Background tabs stop polling. Rendering never replaces the learning form.
 */
(() => {
 'use strict';
 let user=null,lang='kk',timer=null,epoch=0,inflight=false,rows=[],failed=false,paused=false,clockOffset=0;
 const model=window.CT_COMMUNITY_MODEL,t=(kk,ru)=>lang==='ru'?ru:kk;
 const bar=document.createElement('section');bar.className='community-bar';bar.hidden=true;
 bar.innerHTML='<div class="community-summary"><span class="community-dot" aria-hidden="true"></span><span data-community-count></span></div><div class="community-viewport" tabindex="0"><div class="community-track"></div></div><button class="community-toggle" type="button"></button>';
 document.querySelector('header.top').after(bar);
 const count=bar.querySelector('[data-community-count]'),track=bar.querySelector('.community-track'),viewport=bar.querySelector('.community-viewport'),toggle=bar.querySelector('button');
 toggle.onclick=()=>{paused=!paused;paint();};
 viewport.onclick=()=>{paused=!paused;paint();};
 function paint(){
  bar.hidden=!user;if(!user)return;
  const visible=model.online(rows,[],Date.now()+clockOffset);
  // Preserve published XP when filtering expiry a second time in the UI.
  const ids=new Set(visible.map(r=>r.userId)),list=rows.filter(r=>ids.has(r.userId));
  bar.setAttribute('aria-label',t('Онлайн қатысушылар және XP','Участники онлайн и XP'));
  count.textContent=failed?t('Онлайн: —','Онлайн: —'):t('Онлайн: ','Онлайн: ')+list.length;
  bar.dataset.paused=String(paused);bar.dataset.static=String(failed||!list.length);
  toggle.disabled=false;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?t('Қозғалысты жалғастыру','Продолжить движение'):t('Қозғалысты тоқтату','Приостановить движение'));
  toggle.hidden=failed||!list.length;
  const group=document.createElement('div');group.className='community-group';
  if(failed||!list.length){const message=document.createElement('span');message.className='community-message';message.textContent=failed?(user.role==='teacher'?t('Онлайн тізім қолжетімсіз. Жаңартылған Firestore ережелерін жариялап, бетті жаңартыңыз.','Список недоступен. Опубликуйте обновлённые правила Firestore и обновите страницу.'):t('Онлайн тізім уақытша қолжетімсіз','Список онлайн временно недоступен')):t('Қатысушылар тізімі жаңартылуда…','Список участников обновляется…');group.append(message);}
  for(const row of list){
   const item=document.createElement('span');item.className='community-person';
   const name=document.createElement('span');name.textContent=(row.role==='teacher'?'👩‍🏫 ':'🟢 ')+row.name;
   const score=document.createElement('strong');score.textContent=row.role==='teacher'?t('Мұғалім','Учитель'):row.xp===null?t('XP күтілуде','XP ожидается'):row.xp+' XP';
   item.append(name,document.createTextNode(' · '),score);group.append(item);
  }
  const signature=group.textContent+'|'+lang;
  if(track.dataset.signature!==signature){track.dataset.signature=signature;track.replaceChildren(group);if(list.length&&!failed){const clone=group.cloneNode(true);clone.setAttribute('aria-hidden','true');track.append(clone);}bar.style.setProperty('--community-duration',Math.max(25,list.length*7)+'s');}
  bar.title=t('Белсенділік соңғы 150 секунд бойынша. Жаңарту: шамамен 1 минут.','Активность за последние 150 секунд. Обновление: примерно раз в минуту.');
 }
 async function poll(){
  if(!user||document.hidden||inflight)return;
  const version=epoch;inflight=true;
  try{const result=await window.CT_FIREBASE.call('communityWorkspace');if(version!==epoch)return;rows=result.rows;clockOffset=result.serverNow-Date.now();failed=false;}
  catch{if(version!==epoch)return;rows=[];failed=true;}
  finally{inflight=false;if(version===epoch){paint();clearTimeout(timer);timer=setTimeout(poll,60000);}else if(user)poll();}
 }
 function setUser(next,nextLang){
  const changed=user?.id!==next?.id||user?.role!==next?.role;
  lang=nextLang||'kk';user=next&&!next.mustChangePassword?next:null;
  if(changed||!user){epoch++;clearTimeout(timer);rows=[];failed=false;paused=false;}
  paint();if(user&&changed)poll();
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)poll();});
 window.addEventListener('online',()=>poll());
 window.CT_COMMUNITY={setUser};
})();
