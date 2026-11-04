/* A fresh worker for each run/submission. No identity or auth token is sent here. */
let runtime;
self.onmessage=async({data})=>{
 if(data.type!=='start')return;
 try{
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
  runtime=await loadPyodide();self.postMessage({type:'ready'});
  for(let i=0;i<data.inputs.length;i++){
   self.postMessage({type:'case-start',index:i});
   runtime.globals.set('__ct_program',String(data.code));runtime.globals.set('__ct_stdin',String(data.inputs[i]));
   const result=await runtime.runPythonAsync(`
def __ct_execute(source, text):
    import sys, io, builtins, traceback
    previous = sys.stdin, sys.stdout, sys.stderr, builtins.input
    class LimitedOutput(io.StringIO):
        def write(self, text):
            if self.tell() + len(text) > 2000000:
                raise RuntimeError('OUTPUT_LIMIT')
            return super().write(text)
    output = LimitedOutput()
    sys.stdin = io.TextIOWrapper(io.BytesIO(text.encode('utf-8')), encoding='utf-8')
    sys.stdout = sys.stderr = output
    ok, error = True, ''
    try:
        exec(compile(source, '<solution>', 'exec'), {'__name__': '__main__'})
    except SystemExit as e:
        if e.code not in (None, 0): ok, error = False, str(e)
    except BaseException:
        ok, error = False, traceback.format_exc(limit=4)
    finally:
        sys.stdin, sys.stdout, sys.stderr, builtins.input = previous
    return {'ok': ok, 'output': output.getvalue(), 'error': error}
__ct_execute(__ct_program, __ct_stdin)
`);
   const converted=result.toJs({dict_converter:Object.fromEntries});result.destroy();
   self.postMessage({type:'case-result',index:i,...converted});
   // Pause until the main page has checked the output; wrong solutions do not
   // spend time running the remaining training tests.
   const proceed=await new Promise(resolve=>{self.onmessage=e=>resolve(e.data.type==='next');});
   if(!proceed)return;
  }
  self.postMessage({type:'complete'});
 }catch(e){self.postMessage({type:'load-error',message:String(e?.message||e)});}
};
