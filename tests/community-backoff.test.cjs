const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('quota cooldown survives online/visibility events and language rerenders; successful recovery resumes normal polling',async()=>{
 let now=1000000,calls=0,fail=true;const timers=new Map(),events={},browserEvents={};let next=0;
 class Node{
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.attrs={};this.value='Сақталмаған жауап';}
  set textContent(s){this.text=String(s);this.children=[];}get textContent(){return (this.text||'')+this.children.map(x=>x.textContent).join('');}
  append(...a){this.children.push(...a);}replaceChildren(...a){this.children=a;}cloneNode(){const n=new Node();n.textContent=this.textContent;return n;}setAttribute(k,v){this.attrs[k]=v;}
  querySelector(q){if(!this.parts[q]){this.parts[q]=new Node();this.append(this.parts[q]);}return this.parts[q];}set innerHTML(s){this.parts={};}
 }
 const body=new Node(),form=new Node(),header={after:n=>body.append(n)},doc={hidden:false,createElement:()=>new Node(),createTextNode:s=>{const n=new Node();n.textContent=s;return n;},querySelector:()=>header,addEventListener:(k,f)=>events[k]=f};
 const w={CT_COMMUNITY_MODEL:{online:rows=>rows},addEventListener:(k,f)=>browserEvents[k]=f,CT_FIREBASE:{call:async()=>{calls++;if(fail){const e=Error('limit');e.code='RESOURCE_EXHAUSTED';e.retryAt=now+3600000;throw e;}return {rows:[],serverNow:now};}}};
 const c=vm.createContext({window:w,document:doc,Date:{now:()=>now},setTimeout:(fn,delay)=>{timers.set(++next,{fn,delay});return next;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../community.js'),'utf8'),c);
 const user={id:'t',role:'teacher'},flush=()=>new Promise(r=>setImmediate(r));
 w.CT_COMMUNITY.setUser(user,'kk');await flush();assert.equal(calls,1);assert.equal([...timers.values()][0].delay,3600000);assert.ok(body.textContent.includes('сұрау шегіне'));
 for(let i=0;i<4;i++){browserEvents.online();events.visibilitychange();w.CT_COMMUNITY.setUser(user,'ru');}await flush();assert.equal(calls,1);assert.equal(form.value,'Сақталмаған жауап');assert.ok(!body.textContent.includes('правила'));
 now+=3600001;fail=false;events.visibilitychange();await flush();assert.equal(calls,2);assert.equal([...timers.values()][0].delay,60000);
 w.CT_COMMUNITY.setUser(null,'kk');assert.equal(timers.size,0);
});
