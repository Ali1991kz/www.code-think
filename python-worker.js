let pyodideReady = null;

async function getPython() {
  if (!pyodideReady) {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    pyodideReady = loadPyodide();
  }
  return pyodideReady;
}

self.onmessage = async event => {
  const { code, input, testing } = event.data;
  const output = [];
  try {
    const pyodide = await getPython();
    self.postMessage({ type: 'ready' });
    const lines = String(input || '').split(/\r?\n/);
    pyodide.setStdout({ batched: text => output.push(text) });
    pyodide.setStderr({ batched: text => output.push(text) });
    pyodide.setStdin({ stdin: () => lines.length ? lines.shift() : null });
    if (testing) await pyodide.runPythonAsync('import builtins\n_ct_original_input = builtins.input\nbuiltins.input = lambda prompt="": _ct_original_input()');
    await pyodide.runPythonAsync(String(code || ''));
    self.postMessage({ ok: true, output: output.join('\n') });
  } catch (error) {
    self.postMessage({ ok: false, output: output.concat(String(error && error.message ? error.message : error)).join('\n') });
  }
};
