/* Small, deterministic debugging exercises. Browser practice is self-reported. */
(() => {
 'use strict';
 const bank=[
  {id:'lab-01',grade:'7',kind:'maximum',kk:{title:'Ең үлкен сан',goal:'Бір жолда берілген сандардың ең үлкенін шығар.',format:'1–20 бүтін сан, әрқайсысы −1000…1000. Барлығы бір жолда.',hint:'Код оң сандармен жұмыс істеп тұрғандай көрінеді. Оған басқа сандар беріп көр.'},ru:{title:'Наибольшее число',goal:'Выведи наибольшее из чисел, записанных в одной строке.',format:'От 1 до 20 целых чисел в пределах −1000…1000, в одной строке.',hint:'С положительными числами код выглядит исправным. Проверь другие числа.'},buggyCode:'numbers = list(map(int, input().split()))\nmaximum = 0\nfor x in numbers:\n    if x > maximum:\n        maximum = x\nprint(maximum)',example:'2 5 1',tests:['2 5 1','-8 -3 -6','-5','0','-2 0 3','9 9','-1000 -999'],witness:'-8 -3 -6'},
  {id:'lab-02',grade:'7',kind:'delivery',kk:{title:'Жеткізу құны',goal:'Тапсырыс 5000 теңге немесе одан көп болса, жеткізу тегін. Әйтпесе 500 теңге қосылады. Соңғы төлемді шығар.',format:'Бір бүтін сан: тапсырыс бағасы, 0…100000 теңге.',hint:'Кодты шекараға жақын бағалармен тексер.'},ru:{title:'Стоимость доставки',goal:'При заказе от 5000 включительно доставка бесплатна. Иначе добавляется 500. Выведи итоговую оплату.',format:'Одно целое число: цена заказа от 0 до 100000.',hint:'Проверь значения около границы условия.'},buggyCode:'price = int(input())\nif price > 5000:\n    print(price)\nelse:\n    print(price + 500)',example:'6000',tests:['0','4999','5000','5001','6000','100000'],witness:'5000'},
  {id:'lab-03',grade:'7',kind:'sign',kk:{title:'Санның белгісі',goal:'Оң санға POSITIVE, теріс санға NEGATIVE, нөлге ZERO сөзін шығар.',format:'Бір бүтін сан, −1000…1000.',hint:'Шарттардың барлық мүмкін жағдайын тексер.'},ru:{title:'Знак числа',goal:'Для положительного числа выведи POSITIVE, для отрицательного NEGATIVE, для нуля ZERO.',format:'Одно целое число от −1000 до 1000.',hint:'Проверь все возможные случаи условия.'},buggyCode:'n = int(input())\nif n >= 0:\n    print("POSITIVE")\nelif n < 0:\n    print("NEGATIVE")\nelse:\n    print("ZERO")',example:'5',tests:['5','-5','0','1000','-1000','1','-1'],witness:'0'},
  {id:'lab-04',grade:'7',kind:'average',kk:{title:'Орташа мән',goal:'Екі бүтін санның арифметикалық орташа мәнін шығар. Нәтиже бөлшек болуы мүмкін.',format:'Бір жолда екі бүтін сан, әрқайсысы −100…100.',hint:'Нәтижесі бүтін болмайтын сандар жұбын ойластыр.'},ru:{title:'Среднее значение',goal:'Выведи среднее арифметическое двух целых чисел. Результат может быть дробным.',format:'Два целых числа от −100 до 100 в одной строке.',hint:'Подумай о паре чисел с нецелым средним.'},buggyCode:'a, b = map(int, input().split())\nprint((a + b) // 2)',example:'2 4',tests:['2 4','2 3','-3 -2','0 0','-100 100','99 100','-100 -99'],witness:'2 3'},
  {id:'lab-05',grade:'8',kind:'sum',kk:{title:'Соңғы сан қайда?',goal:'1-ден n-ге дейінгі барлық бүтін сандардың қосындысын тап. n=0 болса, қосынды 0.',format:'Бір бүтін сан n, 0…1000.',hint:'Өте кішкентай n мәндерімен тексер.'},ru:{title:'Где последнее число?',goal:'Найди сумму целых чисел от 1 до n включительно. При n=0 сумма равна 0.',format:'Одно целое n от 0 до 1000.',hint:'Проверь самые маленькие значения n.'},buggyCode:'n = int(input())\ns = 0\nfor i in range(1, n):\n    s += i\nprint(s)',example:'0',tests:['0','1','2','5','100','1000'],witness:'1'},
  {id:'lab-06',grade:'8',kind:'digits',kk:{title:'Нөл де сан',goal:'Теріс емес бүтін санның ондық жазылуындағы цифрлар санын тап. Нөл бір цифрдан тұрады. Кірісте бастапқы артық нөлдер жоқ.',format:'Бір бүтін n, 0…100000000.',hint:'Қай мәнде цикл мүлде орындалмауы мүмкін?'},ru:{title:'Ноль тоже число',goal:'Найди количество цифр в десятичной записи неотрицательного числа. У нуля одна цифра. Ввод без лишних ведущих нулей.',format:'Одно целое n от 0 до 100000000.',hint:'При каком значении цикл может не выполниться ни разу?'},buggyCode:'n = int(input())\ncount = 0\nwhile n > 0:\n    count += 1\n    n //= 10\nprint(count)',example:'123',tests:['123','0','1','10','999','100000000'],witness:'0'},
  {id:'lab-07',grade:'8',kind:'product',kk:{title:'Барлық санның көбейтіндісі',goal:'Бір жолдағы барлық бүтін сандардың көбейтіндісін шығар.',format:'1–10 бүтін сан, әрқайсысы −5…5. Барлығы бір жолда.',hint:'Көбейтіндінің мәнін бірден өзгертетін сан бар ма?'},ru:{title:'Произведение всех чисел',goal:'Выведи произведение всех целых чисел из одной строки.',format:'От 1 до 10 целых чисел от −5 до 5 в одной строке.',hint:'Есть ли число, которое сразу меняет результат произведения?'},buggyCode:'numbers = list(map(int, input().split()))\nproduct = 1\nfor x in numbers:\n    if x != 0:\n        product *= x\nprint(product)',example:'2 3',tests:['2 3','2 0 3','0','-2 -3','1 1 1','-5 5 0','-1'],witness:'2 0 3'},
  {id:'lab-08',grade:'8',kind:'count',kk:{title:'Бір рет пе, бірнеше рет пе?',goal:'Берілген target саны тізімде неше рет кездесетінін шығар.',format:'Бірінші жолда target (−100…100). Екінші жолда 1–20 бүтін сан (−100…100).',hint:'Ізделген сан тізімде бірнеше рет кездессе не болады?'},ru:{title:'Один раз или несколько?',goal:'Выведи, сколько раз число target встречается в списке.',format:'В первой строке target (−100…100). Во второй — от 1 до 20 целых чисел (−100…100).',hint:'Что произойдёт, если искомое число встретится несколько раз?'},buggyCode:'target = int(input())\nnumbers = list(map(int, input().split()))\ncount = 0\nfor x in numbers:\n    if x == target:\n        count += 1\n        break\nprint(count)',example:'5\n1 5 2',tests:['5\n1 5 2','5\n5 1 5','0\n0 0 0','9\n1 2 3','-1\n-1 0 -1','2\n2'],witness:'5\n5 1 5'}
 ];
 function parse(task,input){
  const text=String(input??'').trim();
  if(!text||text.length>1000)return {ok:false,reason:'format'};
  const lines=text.split(/\r?\n/).map(s=>s.trim());
  if(lines.length!==(task.kind==='count'?2:1))return {ok:false,reason:'lines'};
  const tokens=text.split(/\s+/);if(tokens.some(s=>!/^[-+]?\d+$/.test(s)))return {ok:false,reason:'integer'};
  const a=tokens.map(Number);if(a.some(x=>!Number.isSafeInteger(x)))return {ok:false,reason:'bounds'};
  let ok=false;
  if(task.kind==='maximum')ok=a.length>=1&&a.length<=20&&a.every(x=>Math.abs(x)<=1000);
  else if(task.kind==='product')ok=a.length>=1&&a.length<=10&&a.every(x=>Math.abs(x)<=5);
  else if(task.kind==='average')ok=a.length===2&&a.every(x=>Math.abs(x)<=100);
  else if(task.kind==='count')ok=lines[0].split(/\s+/).length===1&&a.length>=2&&a.length<=21&&a.every(x=>Math.abs(x)<=100);
  else{const max=task.kind==='digits'?100000000:task.kind==='delivery'?100000:task.kind==='sum'?1000:1000;ok=a.length===1&&a[0]>= (task.kind==='sign'?-1000:0)&&a[0]<=max;}
  if(task.kind==='digits'&&ok)ok=/^(0|[1-9]\d*)$/.test(text);
  return ok?{ok:true,values:a}:{ok:false,reason:'bounds'};
 }
 function expected(task,input){
  const parsed=parse(task,input);if(!parsed.ok)throw Error('INVALID_LAB_INPUT');const a=parsed.values,n=a[0];
  if(task.kind==='maximum')return String(Math.max(...a));
  if(task.kind==='delivery')return String(n>=5000?n:n+500);
  if(task.kind==='sign')return n===0?'ZERO':n>0?'POSITIVE':'NEGATIVE';
  if(task.kind==='average')return String((a[0]+a[1])/2);
  if(task.kind==='sum')return String(n*(n+1)/2);
  if(task.kind==='digits')return String(String(n).length);
  if(task.kind==='product')return String(a.reduce((p,x)=>p*x,1));
  return String(a.slice(1).filter(x=>x===n).length);
 }
 const normalize=s=>String(s??'').trim().replace(/\s+/g,' ');
 function equal(left,right){
  const a=normalize(left),b=normalize(right);if(a===b)return true;
  const number=/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/;
  return number.test(a)&&number.test(b)&&Number.isFinite(Number(a))&&Number(a)===Number(b);
 }
 window.CT_DEBUG_LAB_MODEL={bank,parse,expected,equal,normalize};
})();
