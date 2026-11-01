/* Latest-edit-wins worker ownership, warm loading and bounded execution. */
(function(scope){
  function create(options={}){
    const makeWorker=options.makeWorker||(()=>new Worker('live-worker.js'));
    const later=options.setTimeout||setTimeout,clear=options.clearTimeout||clearTimeout;
    let worker=null,ready=false,running=null,pending=null,timer=null,disposed=false;
    function stop(){const old=worker;worker=null;ready=false;running=null;clear(timer);timer=null;old?.terminate();}
    function fail(error){const job=running||pending;pending=null;stop();if(job)options.onError?.(job,error);}
    function pump(){if(!ready||running||!pending||disposed)return;running=pending;pending=null;
      options.onStatus?.(running,'running');
      timer=later(()=>fail({type:'timeout'}),options.runTimeout||8000);
      worker.postMessage({type:'run',...running});
    }
    function initialize(){if(worker||disposed)return;
      try{const created=makeWorker();worker=created;
        timer=later(()=>fail({type:'loading'}),options.loadTimeout||120000);
        created.onmessage=({data})=>{
          if(worker!==created||disposed)return;
          if(data.type==='ready'){clear(timer);timer=null;ready=true;pump();}
          else if(data.type==='result'&&running&&data.id===running.id){const job=running;running=null;clear(timer);timer=null;options.onResult?.(job,data.result);pump();}
          else if(data.type==='fatal')fail({type:'worker',message:data.message});
        };
        created.onerror=event=>{if(worker===created)fail({type:'worker',message:event.message});};
      }catch(error){fail({type:'worker',message:String(error.message||error)});}
    }
    return {
      submit(job){if(disposed)return;if(running)stop();pending=job;options.onStatus?.(job,worker&&ready?'queued':'loading');initialize();pump();},
      invalidate(){pending=null;if(running)stop();},
      dispose(){disposed=true;pending=null;stop();}
    };
  }
  scope.CodeThinkLive={create};
})(typeof window==='undefined'?globalThis:window);
