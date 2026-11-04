/* Optional real-emulator checks. Never target a production Firebase project. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const host=process.env.FIRESTORE_EMULATOR_HOST;
test('ranking Rules: teacher-only publication, class isolation and field validation',{skip:!host},async()=>{
 assert.match(host,/^(127\.0\.0\.1|localhost):\d+$/);
 const project='demo-code-think',base=`http://${host}/v1/projects/${project}/databases/(default)/documents`,school='ranking-t';
 const val=v=>typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(val)}}:{stringValue:v};
 const fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,val(v)]));
 const token=uid=>{const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');return enc({alg:'none',typ:'JWT'})+'.'+enc({iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,auth_time:Math.floor(Date.now()/1000),firebase:{sign_in_provider:'password',identities:{}}})+'.';};
 const request=(suffix,auth,body,method=body?'POST':'GET')=>fetch(base+suffix,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:body?JSON.stringify(body):undefined});
 const seed=async(suffix,o)=>assert.equal((await request('/'+suffix,'owner',{fields:fields(o)},'PATCH')).status,200);
 await seed('teacherAccess/'+school,{enabled:true});
 for(const [uid,role,cls]of [[school,'teacher',''],['ranking-a','student','7a'],['ranking-b','student','7a'],['ranking-c','student','8a']]){
  await seed('identities/'+uid,{schoolId:school,userId:uid});await seed(`schools/${school}/Users/${uid}`,{id:uid,authUid:uid,name:uid,grade:'7',role,active:true,mustChangePassword:false});if(cls)await seed(`schools/${school}/ClassStudents/${uid}`,{userId:uid,classId:cls});
 }
 const row={userId:'ranking-a',name:'ranking-a',classId:'7a',className:'7 A',grade:'7',avatar:'cat',xp:100,completed:1,corrections:0,badges:['first'],weekKey:'2026-11-02',weekStartXP:100,weeklyXP:0,baselineXP:100,growthXP:0,trackingSince:'2026-11-04T10:00:00Z'};
 const publish=(actor,r)=>request(':commit',token(actor),{writes:[{update:{name:`projects/${project}/databases/(default)/documents/schools/${school}/Rankings/${r.userId}`,fields:fields(r)},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]});
 assert.equal((await publish(school,row)).status,200);assert.equal((await publish('ranking-a',{...row,xp:99999})).status,403);
 assert.equal((await publish(school,{...row,weeklyXP:100})).status,403);assert.equal((await publish(school,{...row,xp:-1})).status,403);assert.equal((await publish(school,{...row,badges:['hacked']})).status,403);assert.equal((await publish(school,{...row,answer:'private'})).status,403);
 const suffix=`/schools/${school}/Rankings/ranking-a`;
 assert.equal((await request(suffix,token('ranking-b'))).status,200);assert.equal((await request(suffix,token('ranking-c'))).status,403);assert.equal((await request(suffix,null)).status,403);
 const query=cls=>({structuredQuery:{from:[{collectionId:'Rankings'}],...(cls?{where:{fieldFilter:{field:{fieldPath:'classId'},op:'EQUAL',value:val(cls)}}}:{})}});
 assert.equal((await request(`/schools/${school}:runQuery`,token('ranking-b'),query('7a'))).status,200);assert.equal((await request(`/schools/${school}:runQuery`,token('ranking-b'),query(null))).status,403);assert.equal((await request(`/schools/${school}:runQuery`,token(school),query(null))).status,200);
 assert.equal((await request(`/schools/${school}/Users/ranking-a`,token('ranking-b'))).status,403);
});
