"""Independent CPython checks of authored mission scaffolds and candidate fixes."""
import json, subprocess, sys
payload=json.load(sys.stdin)
reports=[]
for mission in payload['bank']:
    code=mission['starter']
    for before,after in payload['fixes'][mission['key']]:
        assert before in code, (mission['key'],before)
        code=code.replace(before,after)
    result={'key':mission['key'],'fixed':[],'starter':[]}
    for variant,source in [('fixed',code),('starter',mission['starter'])]:
        for case in mission['cases']:
            process=subprocess.run([sys.executable,'-X','utf8','-c',source],input=case['input']+'\n',capture_output=True,text=True,encoding='utf-8',timeout=3)
            result[variant].append({'ok':process.returncode==0,'output':process.stdout if process.returncode==0 else process.stderr})
    reports.append(result)
print(json.dumps(reports,ensure_ascii=False))
