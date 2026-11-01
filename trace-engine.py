"""CODE THINK: bounded educational Python tracing, shared by browser and tests."""
import ast
import sys
import io
import json
import math
import builtins
import copy
import itertools


def trace_code(source, input_text='', max_steps=1200, interactive=False, batch_input=''):
    frames, nodes, edges, inputs = [], [], [], []
    output = io.StringIO()
    pending = None
    env = {}
    error = None
    waiting = None
    input_requests, site_counts = [], {}
    lines = source.splitlines()
    statement_map = {}
    max_steps = min(max(int(max_steps), 1), 1200)

    def value(v, depth=0):
        if depth > 3:
            return '…'
        if v is None or isinstance(v, (bool, int, str)):
            return v[:300] + ('…' if len(v) > 300 else '') if isinstance(v, str) else v
        if isinstance(v, float):
            return v if math.isfinite(v) else str(v)
        if isinstance(v, (list, tuple, range)):
            return [value(x, depth + 1) for x in v[:100]] + (['…'] if len(v) > 100 else [])
        if isinstance(v, dict):
            return {str(k)[:80]: value(x, depth + 1) for k, x in itertools.islice(v.items(), 50)}
        return str(v)[:300]

    def snapshot(line, next_line=None, failed=False):
        vals = {k: value(v) for k, v in env.items() if not k.startswith('_')}
        old = frames[-1]['variables'] if frames else {}
        changed = [k for k in vals if k not in old or vals[k] != old[k]]
        stmt = statement_map.get(line)
        operation = None
        expr = stmt.value if isinstance(stmt, (ast.Assign, ast.AnnAssign, ast.AugAssign, ast.Expr)) else stmt.test if isinstance(stmt, (ast.If, ast.While)) else stmt.iter if isinstance(stmt, ast.For) else None
        if expr is not None:
            class Substitute(ast.NodeTransformer):
                def visit_Name(self, node):
                    v = old.get(node.id)
                    if node.id in old and (v is None or isinstance(v, (int, float, bool, str))):
                        return ast.copy_location(ast.Constant(value=v), node)
                    return node
            operation = ast.unparse(Substitute().visit(copy.deepcopy(expr)))[:250]
        branch = None
        if not failed and isinstance(stmt, (ast.If, ast.For, ast.While)):
            body_lines = {n.lineno for part in stmt.body for n in ast.walk(part) if hasattr(n, 'lineno')}
            branch = next_line in body_lines
        frames.append({'line': line, 'nextLine': next_line, 'variables': vals,
                       'changed': changed, 'output': output.getvalue(), 'inputs': list(inputs),
                       'branch': branch, 'failed': failed, 'operation': operation})

    def edge(a, b, label=''):
        edges.append({'from': a, 'to': b, 'label': label})

    def block(stmts, successor, depth=0, loop=None):
        entry = successor
        for s in reversed(stmts):
            sid = str(s.lineno)
            statement_map[s.lineno] = s
            kind = type(s).__name__
            label = lines[s.lineno - 1].strip()[:140]
            nodes.append({'id': sid, 'line': s.lineno, 'kind': kind, 'label': label, 'depth': depth})
            if isinstance(s, ast.If):
                yes = block(s.body, entry, depth + 1, loop)
                no = block(s.orelse, entry, depth + 1, loop) if s.orelse else entry
                edge(sid, yes, 'Иә'); edge(sid, no, 'Жоқ')
            elif isinstance(s, (ast.For, ast.While)):
                end = block(s.orelse, entry, depth + 1, loop) if s.orelse else entry
                body = block(s.body, sid, depth + 1, (entry, sid))
                edge(sid, body, 'Иә'); edge(sid, end, 'Жоқ')
            elif isinstance(s, ast.Break):
                edge(sid, loop[0], 'Шығу')
            elif isinstance(s, ast.Continue):
                edge(sid, loop[1], 'Келесі')
            else:
                edge(sid, entry)
            entry = sid
        return entry

    class LimitError(Exception):
        pass

    class CapturedOutput:
        def write(self, text):
            if output.tell() + len(text) > 12000:
                raise LimitError('Нәтиже 12 000 таңбадан асты. Кіріс көлемін азайтыңыз.')
            output.write(text)
            return len(text)
        def flush(self):
            pass

    class WaitingForInput(Exception):
        pass

    batch = str(batch_input).replace('\r\n', '\n').split('\n') if batch_input else []
    supplied = iter(input_text if isinstance(input_text, list) else str(input_text).replace('\r\n', '\n').split('\n'))

    def read_input(prompt=''):
        if prompt:
            CapturedOutput().write(str(prompt))
        stmt = statement_map.get(pending)
        target = ast.unparse(stmt.targets[0]) if isinstance(stmt, ast.Assign) else ''
        site_counts[pending] = site_counts.get(pending, 0) + 1
        key = str(pending) + ':' + str(site_counts[pending]) + ':' + target + ':' + str(prompt)
        numeric = any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ('int', 'float') for n in ast.walk(stmt)) if stmt else False
        request = {'key': key, 'index': len(inputs), 'line': pending, 'prompt': str(prompt), 'target': target, 'numeric': numeric}
        input_requests.append(request)
        try:
            if interactive and isinstance(input_text, dict):
                if key in input_text:
                    answer = str(input_text[key])
                elif len(inputs) < len(batch):
                    answer = batch[len(inputs)]
                else:
                    raise StopIteration
            else:
                answer = str(next(supplied))
        except StopIteration:
            if interactive:
                raise WaitingForInput()
            raise EOFError('Кіріс мәндері жетіспейді. Әр input() үшін жеке жол енгізіңіз.')
        request['value'] = answer
        inputs.append(answer)
        return answer

    def tracer(frame, event, arg):
        nonlocal pending
        if frame.f_code.co_filename != '<student>' or frame.f_code.co_name != '<module>':
            return None
        if event == 'line':
            if pending is not None:
                snapshot(pending, frame.f_lineno)
            if len(frames) >= max_steps:
                pending = None
                raise LimitError('Қадам шегі аяқталды. Цикл шартын немесе кіріс көлемін тексеріңіз.')
            pending = frame.f_lineno
        return tracer

    original_stdout, original_trace = sys.stdout, sys.gettrace()
    try:
        if not source.strip():
            raise ValueError('Алдымен Python кодын жазыңыз.')
        if len(source) > 12000:
            raise ValueError('Код 12 000 таңбадан аспауы керек.')
        tree = ast.parse(source, filename='<student>')
        allowed_statements = (ast.Assign, ast.AugAssign, ast.AnnAssign, ast.Expr, ast.If,
                              ast.For, ast.While, ast.Break, ast.Continue, ast.Pass)
        forbidden_names = {'eval', 'exec', 'compile', 'open', 'globals', 'locals', 'getattr',
                           'setattr', 'delattr', 'vars', 'dir', 'help', 'breakpoint', 'type', 'object'}
        seen_lines = set()
        for n in ast.walk(tree):
            if isinstance(n, ast.stmt) and not isinstance(n, allowed_statements):
                raise ValueError(f'{n.lineno}-жол: {type(n).__name__} бұл оқу визуализаторында қолдау таппайды.')
            if isinstance(n, ast.stmt):
                if n.lineno in seen_lines:
                    raise ValueError(f'{n.lineno}-жол: әр әрекетті жеке жолға жазыңыз. Шарт пен цикл денесі келесі жолдан басталуы керек.')
                seen_lines.add(n.lineno)
                if not isinstance(n, (ast.If, ast.For, ast.While)) and n.end_lineno != n.lineno:
                    raise ValueError(f'{n.lineno}-жол: қадамдық көрініс үшін осы өрнекті бір жолға орналастырыңыз.')
                test_expr = n.test if isinstance(n, (ast.If, ast.While)) else n.iter if isinstance(n, ast.For) else None
                if test_expr is not None and test_expr.end_lineno != n.lineno:
                    raise ValueError(f'{n.lineno}-жол: шартты немесе цикл тақырыбын бір жолға орналастырыңыз.')
            if isinstance(n, (ast.Lambda, ast.NamedExpr, ast.GeneratorExp, ast.Await, ast.Yield)):
                raise ValueError('Бұл өрнекке визуализация әзірге қолдау көрсетпейді.')
            if isinstance(n, ast.Name) and (n.id.startswith('_') or n.id in forbidden_names):
                raise ValueError(f'{n.lineno}-жол: {n.id} бұл оқу режимінде қолжетімсіз.')
            if isinstance(n, ast.Attribute) and n.attr.startswith('_'):
                raise ValueError('Ішкі атрибуттар бұл оқу режимінде қолжетімсіз.')
        compiled = compile(tree, '<student>', 'exec')
        first = block(tree.body, 'end')
        nodes.sort(key=lambda n: n['line'])
        nodes.insert(0, {'id': 'start', 'line': 0, 'kind': 'Start', 'label': 'Бастау', 'depth': 0})
        nodes.append({'id': 'end', 'line': 0, 'kind': 'End', 'label': 'Аяқтау', 'depth': 0})
        edge('start', first)
        names = 'abs all any bool dict enumerate float int len list max min pow range reversed round set sorted str sum tuple zip chr ord divmod format'.split()
        env['__builtins__'] = {name: getattr(builtins, name) for name in names}
        env['__builtins__'].update({'input': read_input, 'print': builtins.print})
        snapshot(0, tree.body[0].lineno)
        sys.stdout = CapturedOutput()
        sys.settrace(tracer)
        exec(compiled, env, env)
        sys.settrace(original_trace)
        if pending is not None:
            snapshot(pending)
    except WaitingForInput:
        sys.settrace(original_trace)
        waiting = input_requests[-1]
        if pending is not None:
            snapshot(pending, next_line=pending)
    except BaseException as exc:
        sys.settrace(original_trace)
        line = getattr(exc, 'lineno', None) or pending
        error = {'type': type(exc).__name__, 'message': str(exc), 'line': line}
        if pending is not None:
            snapshot(pending, failed=True)
    finally:
        sys.stdout = original_stdout
        sys.settrace(original_trace)
    return {'ok': error is None and waiting is None, 'waiting': waiting, 'inputRequests': input_requests, 'frames': frames, 'nodes': nodes, 'edges': edges,
            'error': error, 'output': output.getvalue(), 'source': source}
