/* Warm, local interpreter for debounced previews. No code is sent to a server. */
let interpreter;
async function initialize(){
  try{
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    interpreter=await loadPyodide();
    const response=await fetch('trace-engine.py');
    if(!response.ok)throw Error('trace-engine.py: '+response.status);
    await interpreter.runPythonAsync(await response.text());
    self.postMessage({type:'ready'});
  }catch(error){self.postMessage({type:'fatal',message:String(error.message||error)});}
}
self.onmessage=async({data})=>{
  if(data.type!=='run'||!interpreter)return;
  try{
    interpreter.globals.set('_ct_source',String(data.code||''));
    interpreter.globals.set('_ct_values_json',JSON.stringify(data.values||{}));
    interpreter.globals.set('_ct_batch',String(data.batch||''));
    const serialized=await interpreter.runPythonAsync('json.dumps(trace_code(_ct_source, json.loads(_ct_values_json), interactive=True, batch_input=_ct_batch), ensure_ascii=False)');
    self.postMessage({type:'result',id:data.id,result:JSON.parse(serialized)});
  }catch(error){self.postMessage({type:'fatal',id:data.id,message:String(error.message||error)});}
};
initialize();
