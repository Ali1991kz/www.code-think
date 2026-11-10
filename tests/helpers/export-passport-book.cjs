// Produce an offline, self-contained copy of the public teaching guide.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
let html=fs.readFileSync(path.join(root,'error-passports.html'),'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,f)=>'<style>'+fs.readFileSync(path.join(root,f.split('?')[0]),'utf8')+'</style>');
html=html.replace(/<script defer src="([^"]+)"><\/script>/g,(_,f)=>'<script>'+fs.readFileSync(path.join(root,f.split('?')[0]),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
const out=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html,'utf8');console.log(out);
