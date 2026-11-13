/* Public, browser-only demonstration. No Firebase configuration or credentials. */
window.CODE_THINK_CONFIG={platformName:'CODE THINK',backend:'local-demo',demo:true,firebase:{projectId:'code-think-demo-only'}};
window.CT_DEMO_STORAGE=(()=>{
 'use strict';
 const prefix='ct-demo:v1:';
 const memory=new Map();
 const store={getItem(key){try{return window.sessionStorage.getItem(prefix+key);}catch{return memory.get(key)||null;}},setItem(key,value){memory.set(key,String(value));try{window.sessionStorage.setItem(prefix+key,String(value));}catch{}},removeItem(key){memory.delete(key);try{window.sessionStorage.removeItem(prefix+key);}catch{}}};
 // Never read, replace or clear the real account's session token.
 store.setItem('ct11-token','local-demo');
 return store;
})();
