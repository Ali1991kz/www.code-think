const {test}=require('node:test');const assert=require('node:assert/strict');
test('Olympiad Rules enforce teacher-only access and private, explicitly self-reported work',{skip:!process.env.FIRESTORE_EMULATOR_HOST},async()=>{
 const host=process.env.FIRESTORE_EMULATOR_HOST;assert.match(host,/^(127\.0\.0\.1|localhost):\d+$/);
 const project='demo-code-think',base=`http://${host}/v1/projects/${project}/databases/(default)/documents`,school='olympTeacher';
 const val=v=>typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v},fields=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,val(v)]));
 const token=uid=>{const e=o=>Buffer.from(JSON.stringify(o)).toString('base64url');return e({alg:'none',typ:'JWT'})+'.'+e({iss:'https://securetoken.google.com/'+project,aud:project,sub:uid,user_id:uid,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,auth_time:Math.floor(Date.now()/1000),firebase:{sign_in_provider:'password',identities:{}}})+'.';};
 const req=(p,actor,body,method=body?'POST':'GET')=>fetch(base+p,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(actor==='owner'?'owner':token(actor))},body:body?JSON.stringify(body):undefined});
 const seed=async(p,row)=>assert.equal((await req('/'+p,'owner',{fields:fields(row)},'PATCH')).status,200);
 await seed('teacherAccess/'+school,{enabled:true});
 for(const uid of [school,'olympPupil1','olympPupil2']){await seed('identities/'+uid,{schoolId:school,userId:uid});await seed('schools/'+school+'/Users/'+uid,{id:uid,authUid:uid,name:uid,role:uid===school?'teacher':'student',active:true,mustChangePassword:false,grade:'8'});}
 const write=(actor,collection,id,row,create=false)=>req(':commit',actor,{writes:[{update:{name:`projects/${project}/databases/(default)/documents/schools/${school}/${collection}/${id}`,fields:fields(row)},updateTransforms:[{fieldPath:'__updatedAt',setToServerValue:'REQUEST_TIME'},...(create?[{fieldPath:'__createdAt',setToServerValue:'REQUEST_TIME'}]:[])]}]});
 const userId='olympPupil1',access={userId,allowed:false,manual:true,completed:0,total:12};
 assert.equal((await write(userId,'OlympiadAccess',userId,{...access,allowed:true},true)).status,403);
 assert.equal((await write(school,'OlympiadAccess',userId,access,true)).status,200);
 const work={id:userId+'__olymp-01',userId,__ownerId:userId,taskId:'olymp-01',code:'print(3)',inputData:'abc\nbcd\n',lastOutput:'3',verdict:'accepted',passed:11,total:11,submissions:1,solved:true,selfReported:true};
 assert.equal((await write(userId,'OlympiadWork',work.id,work,true)).status,403);
 // Metadata is server transformed; preserve creation time on an access update.
 const a=await (await req(`/schools/${school}/OlympiadAccess/${userId}`,school)).json();
 const allowBody={writes:[{update:{name:a.name,fields:{...a.fields,allowed:val(true)}},updateTransforms:[{fieldPath:'__updatedAt',setToServerValue:'REQUEST_TIME'}]}]};
 assert.equal((await req(':commit',school,allowBody)).status,200);
 assert.equal((await write(userId,'OlympiadWork',work.id,work,true)).status,200);
 assert.equal((await req(`/schools/${school}/OlympiadWork/${work.id}`,userId)).status,200);
 assert.equal((await req(`/schools/${school}/OlympiadWork/${work.id}`,'olympPupil2')).status,403);
 assert.equal((await req(`/schools/${school}/OlympiadWork/${work.id}`,school)).status,200);
 const original=await (await req(`/schools/${school}/OlympiadWork/${work.id}`,userId)).json();
 const altered={writes:[{update:{name:original.name,fields:{...original.fields,selfReported:val(false)}},updateTransforms:[{fieldPath:'__updatedAt',setToServerValue:'REQUEST_TIME'}]}]};
 assert.equal((await req(':commit',userId,altered)).status,403);
 altered.writes[0].update.fields={...original.fields,xp:val(999)};assert.equal((await req(':commit',userId,altered)).status,403);
 assert.equal((await write('olympPupil2','OlympiadWork',work.id,work,true)).status,403);
});
