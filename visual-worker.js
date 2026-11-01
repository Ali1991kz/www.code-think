/* A dedicated, disposable interpreter for each visualization. */
self.onmessage = async ({data}) => {
  try {
    self.postMessage({type:'status', message:'Python жүктелуде… Алғашқы ашылуы біраз уақыт алады.'});
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    const py = await loadPyodide();
    const response = await fetch('trace-engine.py');
    if (!response.ok) throw new Error('Визуализация модулі табылмады. Жоба файлдарын толық көшіріңіз.');
    await py.runPythonAsync(await response.text());
    self.postMessage({type:'ready'});
    py.globals.set('_ct_source', String(data.code || ''));
    py.globals.set('_ct_input', String(data.input || ''));
    const result = await py.runPythonAsync('json.dumps(trace_code(_ct_source, _ct_input), ensure_ascii=False)');
    self.postMessage({type:'result', result:JSON.parse(result)});
  } catch (error) {
    self.postMessage({type:'fatal', message:String(error.message || error)});
  }
};
