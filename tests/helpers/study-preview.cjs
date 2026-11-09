'use strict';
// Local, disposable visual QA. Every authenticated response is synthetic.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {workspace}=require('./study-ui.cjs'),root=path.resolve(__dirname,'../..');
const fixtures={student:workspace('student'),teacher:workspace('teacher')};
const config=`window.CODE_THINK_CONFIG={firebase:{projectId:'demo-code-think'},platformName:'CODE THINK'};window.__QA_ROLE=new URLSearchParams(location.search).get('role')==='teacher'?'teacher':'student';window.__QA_FIXTURES=${JSON.stringify(fixtures)};sessionStorage.setItem('ct11-token','local-test');sessionStorage.setItem('ct11-token:code-think-new','local-test');`;
const adapter=`(()=>{const f=window.__QA_FIXTURES[window.__QA_ROLE];window.__QA_CALLS=[];window.CT_FIREBASE={status:()=>({customStudentLogins:true}),invalidate(){},async call(action,p){window.__QA_CALLS.push(action);if(action==='sessionUser')return {user:f.user};if(action==='schoolWorkspace')return f.data;if(action==='rankingWorkspace')return {rows:[{userId:'s',name:'Сынақ оқушысы',classId:'c',className:'8А',xp:120,weeklyXP:0,completed:1,growthXP:0,avatar:'robot',badges:[]}],classes:[{id:'c',name:'8А'}],serverNow:'2026-11-09T10:00:00Z'};if(action==='debugLabWorkspace')return {allowed:true,work:[]};if(action==='olympiadWorkspace')return {allowed:false,completed:1,total:12,work:[],users:[],access:[]};throw Error('Local fixture does not support '+action);}};})();`;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(root,name||'index.html');
 res.setHeader('Cache-Control','no-store');
 if(name==='config.js'||name==='new-project/config.js'){res.setHeader('Content-Type',types['.js']);return res.end(config);}
 if(name==='firebase-direct.js'||name==='new-project/firebase-direct.js'){res.setHeader('Content-Type',types['.js']);return res.end(adapter);}
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
 const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 if(!fs.existsSync(target)){res.writeHead(404);return res.end('Not found');}
 res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
}).listen(8894,'127.0.0.1',()=>console.log('Synthetic study UI preview: http://127.0.0.1:8894/ (no production Firebase)'));
