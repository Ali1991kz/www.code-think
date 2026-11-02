/* Teacher-only temporary-password receipts. AES-GCM ciphertext lives in the
 * existing private RegistrationJobs collection. No pupil's chosen password is
 * captured. The key is derived from the teacher password, never sent to Firestore.
 */
(() => {
 'use strict';
 const SESSION='ct113-teacher-vault-key';let key=null,owner='';
 const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
 const bytes=s=>{if(typeof s!=='string'||s.length%2||!/^[0-9a-f]*$/.test(s))throw Error('Invalid encrypted receipt');return Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));};
 const project=()=>window.CODE_THINK_CONFIG?.firebase?.projectId||'';
 const namespace=id=>project()+'|'+id;
 function lock(){key=null;owner='';sessionStorage.removeItem(SESSION);}
 async function restore(user){
  if(user?.role!=='teacher'){lock();return false;}
  const id=user.authUid||user.id;if(owner===id&&key)return true;
  key=null;owner='';
  try{const saved=JSON.parse(sessionStorage.getItem(SESSION)||'null');if(!saved||saved.scope!==namespace(id)||saved.expiresAt<Date.now())return false;key=await crypto.subtle.importKey('raw',bytes(saved.key),{name:'AES-GCM'},false,['encrypt','decrypt']);owner=id;return true;}catch{return false;}
 }
 async function unlock(user,password){
  if(user?.role!=='teacher'||!password)throw Error('Teacher authentication required');
  const id=user.authUid||user.id;
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode('CODE_THINK|'+namespace(id)+'|temporary-passwords|v1'),iterations:210000,hash:'SHA-256'},material,256);
  key=await crypto.subtle.importKey('raw',bits,{name:'AES-GCM'},false,['encrypt','decrypt']);owner=id;
  sessionStorage.setItem(SESSION,JSON.stringify({scope:namespace(id),key:hex(bits),expiresAt:Date.now()+12*3600000}));return true;
 }
 function aad(record){return new TextEncoder().encode(namespace(owner)+'|'+record.userId+'|'+record.login+'|v1');}
 async function seal(record){
  if(!key||!owner)throw Error('Уақытша парольдер қорын ашыңыз. / Откройте хранилище временных паролей.');
  const iv=crypto.getRandomValues(new Uint8Array(12)),issuedAt=new Date().toISOString();
  const plain={userId:record.userId,login:record.login,temporaryPassword:record.temporaryPassword,issuedAt};
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(plain)},key,new TextEncoder().encode(JSON.stringify(plain)));
  return {credentialVersion:1,userId:plain.userId,login:plain.login,issuedAt,iv:hex(iv),ciphertext:hex(ciphertext)};
 }
 async function open(record){
  if(!key||!owner)throw Error('Teacher vault is locked');
  const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(record.iv),additionalData:aad(record)},key,bytes(record.ciphertext));
  const result=JSON.parse(new TextDecoder().decode(raw));
  if(result.userId!==record.userId||result.login!==record.login||typeof result.temporaryPassword!=='string')throw Error('Invalid encrypted receipt');
  return result;
 }
 window.CT_CREDENTIAL_VAULT={unlock,restore,seal,open,lock};
})();
