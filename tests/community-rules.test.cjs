/* Real Firestore emulator tests; never send test data to a production project. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const host=process.env.FIRESTORE_EMULATOR_HOST;
test('community Rules: identity, class isolation, timestamp and teacher-only XP',{skip:!host},async()=>{
 assert.match(host,/^(127\.0\.0\.1|localhost):\d+$/);
 const project='demo-code-think',base=`http://${host}/v1/projects/${project}/databases/(default)/documents`;
 const value=v=>typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v};
 const fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,value(v)]));
 const token=uid=>{const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');return enc({alg:'none',typ:'JWT'})+'.'+enc({iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,auth_time:Math.floor(Date.now()/1000),firebase:{sign_in_provider:'password',identities:{}}})+'.';};
 const request=(suffix,auth,body,method=body?'POST':'GET')=>fetch(base+suffix,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:body?JSON.stringify(body):undefined});
 const seed=async(suffix,o)=>assert.equal((await request('/'+suffix,'owner',{fields:fields(o)},'PATCH')).status,200);
 await seed('teacherAccess/t',{enabled:true});
 for(const [uid,role,cls] of [['t','teacher','__teacher__'],['s1','student','7a'],['s2','student','7a'],['s3','student','8a']]){
  await seed('identities/'+uid,{schoolId:'t',userId:uid});await seed('schools/t/Users/'+uid,{id:uid,authUid:uid,name:uid,role,active:true,mustChangePassword:false});
  if(role==='student')await seed('schools/t/ClassStudents/'+uid,{userId:uid,classId:cls});
 }
 const pulse=async(uid,data)=>request(':commit',token(uid),{writes:[{update:{name:`projects/${project}/databases/(default)/documents/schools/t/Presence/${data.userId}`,fields:fields(data)},updateTransforms:[{fieldPath:'lastSeen',setToServerValue:'REQUEST_TIME'}]}]});
 for(const uid of ['s1','s2','s3','t'])assert.equal((await pulse(uid,{userId:uid,name:uid,role:uid==='t'?'teacher':'student',classId:uid==='t'?'__teacher__':uid==='s3'?'8a':'7a'})).status,200);
 assert.equal((await pulse('s1',{userId:'s2',name:'s2',role:'student',classId:'7a'})).status,403);
 assert.equal((await pulse('s1',{userId:'s1',name:'FAKE',role:'student',classId:'7a'})).status,403);
 assert.equal((await pulse('s1',{userId:'s1',name:'s1',role:'teacher',classId:'__teacher__'})).status,403);
 assert.equal((await pulse('s1',{userId:'s1',name:'s1',role:'student',classId:'8a'})).status,403);
 assert.equal((await pulse('s1',{userId:'s1',name:'s1',role:'student',classId:'7a',xp:9999})).status,403);
 assert.equal((await request('/schools/t/Presence/s2',token('s1'))).status,200);
 assert.equal((await request('/schools/t/Presence/t',token('s1'))).status,200);
 assert.equal((await request('/schools/t/Presence/s3',token('s1'))).status,403);
 assert.equal((await request('/schools/t/Presence/s1',null)).status,403);
 assert.equal((await request('/schools/t/Users/s2',token('s1'))).status,403);
 const query=scope=>({structuredQuery:{from:[{collectionId:'Presence'}],...(scope?{where:{fieldFilter:{field:{fieldPath:'classId'},op:'IN',value:{arrayValue:{values:scope.map(value)}}}}}:{})}});
 assert.equal((await request('/schools/t:runQuery',token('s1'),query(['7a','__teacher__']))).status,200);
 assert.equal((await request('/schools/t:runQuery',token('s1'),query(null))).status,403);
 assert.equal((await request('/schools/t:runQuery',token('t'),query(null))).status,200);
 const score=async(uid,xp)=>request(':commit',token(uid),{writes:[{update:{name:`projects/${project}/databases/(default)/documents/schools/t/CommunityScores/s1`,fields:fields({userId:'s1',name:'s1',classId:'7a',xp})},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]});
 assert.equal((await score('s1',9999)).status,403);assert.equal((await score('t',180)).status,200);assert.equal((await score('t',-1)).status,403);
 assert.equal((await request('/schools/t/CommunityScores/s1',token('s2'))).status,200);
 assert.equal((await request('/schools/t/CommunityScores/s1',token('s3'))).status,403);
 await seed('schools/t/Users/s1',{id:'s1',authUid:'s1',name:'s1',role:'student',active:false,mustChangePassword:false});
 assert.equal((await pulse('s1',{userId:'s1',name:'s1',role:'student',classId:'7a'})).status,403);
});
