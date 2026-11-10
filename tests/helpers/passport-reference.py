"""Validate examples against the teacher's local reference material; never publish solutions.

Usage: python tests/helpers/passport-reference.py PATH_TO_TEACHER_MATERIALS_JSON
Prints example inputs/outputs only. No teacher code, account data or keys are emitted.
"""
import ast
import json
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
inputs = json.loads((root / 'tests/fixtures/error-passport-inputs.json').read_text(encoding='utf-8'))
materials = {r['sourceKey']: r for r in json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))}
result = {}
for key, examples in inputs.items():
    tree = ast.parse(materials[key]['sampleCode'])
    # Prompts are author-defined; compare the computation, not input() wording.
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'input':
            node.args = []
    code = ast.unparse(ast.fix_missing_locations(tree))
    result[key] = []
    for value in examples:
        run = subprocess.run([sys.executable, '-X', 'utf8', '-c', code], input=value + '\n', capture_output=True, text=True, encoding='utf-8', timeout=3)
        if run.returncode:
            raise RuntimeError(key + ': reference execution failed')
        result[key].append({'input': value, 'expected': run.stdout.rstrip()})
print(json.dumps(result, ensure_ascii=False, indent=2))
