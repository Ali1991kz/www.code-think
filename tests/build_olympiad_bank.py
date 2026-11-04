"""Reproducible training bank, reference algorithms and independent small-case checks.
Inspired by the user's Inf_8_kaz.pdf, A/B/C; these are adapted practice problems.
Run from repository root: python tests/build_olympiad_bank.py --check
"""
import json, random, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
R = random.Random(8042026)
TASKS = []

def add(title, ru, topic, family, body, rubody, inp, ruinp, out, ruout, limits, examples):
    n=len(TASKS)+1
    TASKS.append(dict(id=f'olymp-{n:02}',number=n,level=(n-1)//5+1,grade=8,topic=topic,
        source=f'Inf_8_kaz.pdf · {family}',limits=limits,
        kk=dict(title=title,statement=body,input=inp,output=out),
        ru=dict(title=ru,statement=rubody,input=ruinp,output=ruout),exampleInputs=examples))

add('Әріптер арасы','Расстояние между буквами','Жолдар','A, 1–2-бет',
 'Ұзындығы бірдей a және b жолдары берілген. Бір қадамда бір әріпті басқа әріпке ауыстырасың. Құны — олардың латын әліпбиіндегі нөмірлерінің абсолют айырмасы (a=1, …, z=26). Әр позиция тәуелсіз. a жолын b жолына айналдырудың ең аз жалпы құнын тап.',
 'Даны строки a и b одинаковой длины. За шаг можно заменить одну букву другой; стоимость равна модулю разности их номеров в латинском алфавите (a=1, …, z=26). Позиции независимы. Найдите минимальную суммарную стоимость преобразования a в b.',
 'Екі жол: алдымен a, кейін b. Тек кіші латын әріптері.','Две строки: a, затем b. Только строчные латинские буквы.',
 'Ең аз жалпы құнды бір бүтін санмен шығар.','Выведите минимальную общую стоимость одним целым числом.',
 '1 ≤ |a| = |b| ≤ 100000',['abc\nbcd\n','az\nza\n'])
add('Жақын таңбалар','Ближайшие символы','Жолдар','A, 1–2-бет',
 'c жолында x және y әріптерінің әрқайсысы бірнеше рет кездесуі мүмкін. c[j]=x және c[k]=y болатын позицияларды таңдап, |j−k| шамасының ең аз мәнін тап. Индекстер 1-ден басталады. x=y болса, бір позицияны екі рет таңдауға болады. Әріптің бірі жоқ болса, −1 шығар.',
 'В строке c найдите позиции j и k с c[j]=x и c[k]=y, минимизирующие |j−k|. Нумерация с 1. При x=y разрешено выбрать одну позицию дважды. Если хотя бы одной буквы нет, выведите −1.',
 'Бірінші жол — c. Екінші жол — бос орынмен бөлінген x және y.','Первая строка — c. Вторая — буквы x и y через пробел.',
 'Ең аз қашықтық немесе −1.','Минимальное расстояние или −1.',
 '1 ≤ |c| ≤ 100000; c, x, y — a…z',['abcaacb\na b\n','aaa\na z\n'])
add('Санның нұсқалары','Версии числа','Нұсқалар','B, 3–5-бет',
 'Алғашқы 1-нұсқадағы сан 0-ге тең. i-қадамда бұрынғы p нұсқасын таңдап, оның санына d қосып, i+1 нұсқасын жасайсың. Бұрынғы нұсқалар өзгермейді. Берілген сұраныстардағы нұсқалардың мәндерін тап.',
 'В версии 1 хранится число 0. На шаге i выбирают существующую версию p, прибавляют к её числу d и создают версию i+1. Старые версии неизменны. Ответьте на запросы значений версий.',
 'n q. Кейін n жолда p d (i-қадамда 1≤p≤i). Соңында q жолда v нұсқа нөмірі.','n q; далее n строк p d (на шаге i: 1≤p≤i), затем q номеров версий v.',
 'Әр сұранысқа мәнді жеке жолға шығар.','Для каждого запроса выведите значение отдельной строкой.',
 '1 ≤ n,q ≤ 100000; |d| ≤ 10^9; 1 ≤ v ≤ n+1',['3 4\n1 5\n2 -2\n1 9\n1\n2\n3\n4\n','1 2\n1 -7\n2\n1\n'])
add('Шатырлар жолы','Путь по крышам','Қозғалыс','C, 6–7-бет',
 'n ғимарат бір қатарда тұр. Зерттеуші s ғимаратынан t ғимаратына көрші ғимараттар арқылы ең қысқа тікелей жолмен барады. 1 биіктікке көтерілу u, түсу d уақыт алады. Биіктіктер тең болса, уақыт 0. Жолдың жалпы уақытын тап. Биіктік айырмасын әр өткелдің қозғалыс бағытымен есепте.',
 'Исследователь идёт от здания s к t по соседним зданиям без обходов. Подъём на единицу высоты стоит u времени, спуск — d. Между равными высотами время 0. Найдите суммарное время, учитывая направление каждого перехода.',
 'n; келесі жолда n биіктік; соңғы жолда s t u d.','n; следующая строка — n высот; последняя — s t u d.',
 'Жалпы уақытты шығар.','Выведите суммарное время.',
 '1 ≤ n ≤ 100000; 1 ≤ h[i] ≤ 10^9; 1 ≤ s,t ≤ n; 0 ≤ u,d ≤ 10^6',['5\n1 3 2 5 4\n1 3 2 1\n','3\n2 5 1\n3 1 1 2\n'])
add('Екі зерттеуші','Два исследователя','Қозғалыс','C, 6–7-бет',
 'АЛЬФА мен БЕТА зерттеушілері бір қатардағы ғимараттармен мақсатқа қарай жүреді. Олардың бастапқы орны және көтерілу/түсу құны әртүрлі. Екеуі де көршілес ғимараттар арқылы тікелей мақсатқа барады. Кім тез жететінін анықта. Бір мақсатта қатар тұру қозғалысқа кедергі келтірмейді.',
 'АЛЬФА и БЕТА идут по соседним зданиям прямо к общей цели. Начальные позиции и стоимости подъёма/спуска различаются. Определите, кто придёт раньше. Исследователи не мешают друг другу.',
 'n; n биіктік; Apos Aup Adown Bpos Bup Bdown target.','n; n высот; Apos Aup Adown Bpos Bup Bdown target.',
 'АЛЬФА бұрын жетсе ALFA, БЕТА бұрын жетсе BETA, тең болса TENG.','ALFA, если раньше АЛЬФА; BETA, если раньше БЕТА; TENG при равенстве.',
 '1 ≤ n ≤ 100000; 1 ≤ h[i] ≤ 10^9; орындар 1…n; 0 ≤ құндар ≤ 10^6',['5\n1 3 2 5 4\n1 1 1 5 1 1 3\n','3\n4 4 4\n1 2 3 3 5 6 2\n'])
add('Рұқсат етілген ауыстыру','Разрешённые замены','Жолдар','A, 1–2-бет',
 'a, b, c, d әріптерінен тұратын s және t жолдары берілген. Тек тізімде берілген бағытталған ауыстыруларды қолдануға болады: x y w — x әрпін y әрпіне w құнымен өзгерту. Кері бағыт автоматты рұқсат етілмейді. Аралық әріптерге ауыстырып, s жолын t жолына айналдырудың ең аз құнын тап. Бірдей әріпті өзгертудің қажеті жоқ.',
 'Даны строки s и t из букв a,b,c,d. Разрешены только перечисленные направленные замены x y w: из x в y за w. Обратная замена автоматически не разрешается. Можно использовать промежуточные буквы. Найдите минимальную стоимость преобразования s в t; одинаковые буквы менять не нужно.',
 's, t — екі бөлек жол; m; кейін m жолда x y w. Қайталанатын ережелер болуы мүмкін.','s, t на отдельных строках; m; затем m строк x y w. Правила могут повторяться.',
 'Ең аз жалпы құн; түрлендіру мүмкін болмаса −1.','Минимальная суммарная стоимость или −1, если преобразование невозможно.',
 '1 ≤ |s|=|t| ≤ 10000; 0 ≤ m ≤ 50; 0 ≤ w ≤ 10^6',['aa\ncc\n3\na b 2\nb c 3\na c 9\n','ab\nba\n1\na b 1\n'])
add('Жеңілдік көпірлері','Переходы со скидкой','Жолдар','A, 1–2-бет',
 'Ұзындықтары бірдей s және t жолдары берілген. Кез келген x әрпін y әрпіне әліпбидегі нөмірлер айырмасының модулі құнымен ауыстыруға болады. Қосымша m жеңілдік көпірі берілген: x y w екі бағытта да w құнымен ауыстыруға рұқсат береді. Бірнеше ауыстыруды тізбектеп қолдануға болады. Ең аз жалпы құнды тап.',
 'Можно заменить любую букву x на y за модуль разности их номеров в алфавите. Дополнительно заданы m двусторонних переходов x y w со стоимостью w. Замены разрешено выполнять цепочкой. Найдите минимальную общую стоимость преобразования s в t.',
 's; t; m; кейін m жолда x y w.','s; t; m; затем m строк x y w.',
 'Ең аз жалпы құн.','Минимальная общая стоимость.',
 '1 ≤ |s|=|t| ≤ 100000; 0 ≤ m ≤ 1000; 0 ≤ w ≤ 10^6; a…z',['az\nza\n1\na z 2\n','aa\nzz\n2\na m 1\nm z 1\n'])
add('Айнымалылар журналы','Журнал переменных','Нұсқалар','B, 3–5-бет',
 'Бастапқыда айнымалы жоқ. SET x v — жаңа x айнымалысын v мәнімен жасайды; ADD x d — бар айнымалыға d қосады; GET x — ағымдағы мәнді сұрайды. Бұл есепте нұсқалар жасалмайды: бір ғана журнал өзгереді. SET кезінде x жоқ, ADD кезінде x бар екеніне кепіл беріледі. GET сұраған айнымалы жоқ болса, −1 шығар.',
 'Изначально переменных нет. SET x v создаёт новую переменную, ADD x d прибавляет d к существующей, GET x запрашивает текущее значение. Версий нет: изменяется один журнал. SET и ADD всегда корректны. Для отсутствующей переменной GET возвращает −1.',
 'q; кейін q жолда SET x v, ADD x d немесе GET x. Кемінде бір GET бар.','q; далее q команд SET x v, ADD x d или GET x. Есть хотя бы одна GET.',
 'Әр GET жауабын жеке жолға шығар.','Выведите ответы на GET, каждый с новой строки.',
 '1 ≤ q ≤ 100000; 1 ≤ x ≤ 10^9; |v|,|d| ≤ 10^9',['6\nGET 1\nSET 1 10\nADD 1 -3\nGET 1\nSET 2 0\nGET 2\n','2\nSET 5 -1\nGET 5\n'])
add('Шағын әлемдер','Маленькие миры','Нұсқалар','B, 3–5-бет',
 '1-әлем бос. i-тәжірибеде p әлемінің көшірмесін жасап, оған SET x v немесе ADD x d операциясын қолдан: нәтиже i+1-әлем болады. Бұрынғы әлемдер өзгермейді. SET айнымалысы таңдалған әлемде жоқ, ADD айнымалысы бар. Әр сұраныста әлем мен айнымалы берілген: мәнін немесе айнымалы жоқ болса −1 шығар.',
 'Мир 1 пуст. В опыте i копируют мир p и выполняют в копии SET x v или ADD x d; получается мир i+1. Старые миры неизменны. SET создаёт отсутствующую, ADD меняет существующую переменную. По номеру мира и переменной выведите значение либо −1, если её нет.',
 'n q; n жолда p SET x v немесе p ADD x d; кейін q жолда world x.','n q; n строк p SET x v или p ADD x d; затем q строк world x.',
 'Әр сұраныстың жауабы жеке жолда.','Каждый ответ с новой строки.',
 '1 ≤ n,q ≤ 300; i-тәжірибеде 1≤p≤i; 1≤world≤n+1; 1≤x≤1000; |v|,|d|≤10^9',['3 4\n1 SET 1 8\n2 ADD 1 5\n2 SET 2 4\n2 1\n3 1\n4 1\n4 2\n','1 2\n1 SET 1 0\n1 1\n2 1\n'])
add('Бірнеше бағыт','Несколько маршрутов','Қозғалыс','C, 6–7-бет',
 'Ғимарат биіктіктері өзгермейді. Әр сұраныс үшін s-тен t-ге дейін көршілес ғимараттармен тікелей жүру уақытын есепте. Көтерілу құны u, түсу құны d. Солға жүргенде де көтерілу мен түсуді қозғалыс бағыты бойынша анықта. Әр сұраныс тәуелсіз.',
 'Высоты зданий неизменны. Для каждого независимого запроса вычислите время прямого прохода от s к t по соседним зданиям. Подъём на единицу стоит u, спуск — d. При движении влево учитывайте фактическое направление перепадов.',
 'n q; n биіктік; кейін q жолда s t u d.','n q; n высот; затем q строк s t u d.',
 'Әр бағыттың уақытын жеке жолға шығар.','Для каждого маршрута выведите время с новой строки.',
 '1 ≤ n,q ≤ 100000; 1 ≤ h[i] ≤ 10^9; 1 ≤ s,t ≤ n; 0 ≤ u,d ≤ 10^6',['3 3\n1 4 2\n1 3 2 1\n3 1 2 1\n2 2 9 9\n','1 1\n10\n1 1 3 4\n'])
add('Көмекші жол','Вспомогательная строка','Жолдар','A, 1–2-бет',
 's жолын t жолына өзгерт. Бір әріпті кез келген басқа әріпке әліпби нөмірлерінің айырмасы құнымен ауыстыруға болады. Сонымен бірге c көмекші жолының кез келген j,k позицияларын таңдап, c[j] әрпін c[k] әрпіне |j−k| құнымен өзгертуге болады. Бір позицияда бірнеше операция жасауға және аралық әріптерді пайдалануға рұқсат. Ең аз жалпы құнды тап.',
 'Преобразуйте s в t. Любую букву можно заменить другой за модуль разности алфавитных номеров. Кроме того, для любых позиций j,k вспомогательной строки c разрешена замена c[j] на c[k] за |j−k|. Допускаются цепочки замен через промежуточные буквы. Найдите минимальную суммарную стоимость.',
 'Үш жол: s, t, c. Барлығы кіші латын әріптерінен тұрады.','Три строки: s, t, c. Только строчные латинские буквы.',
 'Ең аз жалпы құн.','Минимальная общая стоимость.',
 '1 ≤ |s|=|t| ≤ 200000; 1 ≤ |c| ≤ 200000',['az\nza\naz\n','aa\nzz\nazza\n'])
add('Ортақ таңба','Общий символ','Жолдар','A, 1–2-бет',
 's жолындағы барлық әріпті бір ортақ әріпке айналдыр. Тек берілген бағытталған ауыстырулар рұқсат: x y w. Аралық әріптерді пайдалануға болады. Жалпы құны ең аз болсын. Бірнеше ортақ әріп бірдей ең аз құн берсе, әліпби бойынша ең кішісін таңда. Өзгеріссіз қалдырудың құны 0.',
 'Преобразуйте все буквы строки s в одну общую букву. Разрешены только направленные замены x y w, в том числе через промежуточные буквы. Минимизируйте общую стоимость. При равенстве выберите наименьшую букву по алфавиту. Оставить букву без изменений стоит 0.',
 's; m; кейін m жолда x y w. Ережелер қайталануы мүмкін.','s; m; далее m строк x y w. Правила могут повторяться.',
 'Мүмкін болса бірінші жолда ең аз құн, екінші жолда таңдалған бір әріп. Мүмкін болмаса тек −1.','Если возможно: минимальная стоимость в первой строке и выбранная буква во второй. Иначе только −1.',
 '1 ≤ |s| ≤ 200000; 0 ≤ m ≤ 1000; 0 ≤ w ≤ 10^6; a…z',['ab\n2\na c 2\nb c 3\n','ab\n2\na b 0\nb a 0\n'])
add('Тармақталған әлемдер','Ветвящиеся миры','Нұсқалар','B, 3–5-бет',
 'Бос 1-әлемнен бастап n жаңа әлем жасалады. i-тәжірибеде бұрынғы p әлемінің көшірмесіне бір SET x v немесе ADD x d операциясын қолдан; жаңа әлем нөмірі i+1. Ескі нұсқалар өзгермейді. SET кезінде айнымалы жоқ, ADD кезінде бар. Соңында q сұраныста әлемдегі айнымалы мәнін тап; жоқ болса −1. Бұл жолы тәжірибелер саны үлкен.',
 'Из пустого мира 1 создают n новых миров. В опыте i копируют существующий мир p, выполняют SET x v либо ADD x d и получают мир i+1. Старые версии неизменны. SET/ADD корректны. Ответьте на q запросов значений переменных в мирах, либо −1 при отсутствии. Число опытов теперь велико.',
 'n q; n жолда p SET x v немесе p ADD x d; q жолда world x.','n q; n строк p SET x v или p ADD x d; q строк world x.',
 'Әр сұраныстың жауабы жеке жолда.','Каждый ответ с новой строки.',
 '1 ≤ n,q ≤ 20000; i-тәжірибеде 1≤p≤i; 1≤world≤n+1; 1≤x≤20000; |v|,|d|≤10^9',['4 5\n1 SET 1 4\n2 SET 2 7\n3 ADD 1 6\n2 ADD 1 -4\n1 1\n2 1\n4 1\n4 2\n5 1\n','2 3\n1 SET 1 -1\n1 SET 2 9\n2 1\n3 1\n3 2\n'])
add('Өзгермелі шатырлар','Изменяющиеся крыши','Қозғалыс','C, 6–7-бет',
 'Ғимарат биіктіктері өзгеруі мүмкін. 1 s t u d сұранысы — s-тен t-ге тікелей жүретін зерттеушінің уақытын есептеу. 2 p h сұранысы — p ғимаратының биіктігін h ету. Операциялар берілген ретпен орындалады. Көтерілу/түсу әр өткелдің бағытымен анықталады; тең биіктікте уақыт 0.',
 'Высоты могут меняться. Запрос 1 s t u d требует время прямого прохода от s к t. Запрос 2 p h меняет высоту здания p на h. Операции выполняются по порядку. Подъём и спуск определяются направлением перехода; между равными высотами время 0.',
 'n q; n биіктік; q жолда 1 s t u d немесе 2 p h. Кемінде бір 1-сұраныс бар.','n q; n высот; q запросов 1 s t u d или 2 p h. Есть хотя бы один запрос типа 1.',
 'Тек 1-сұраныстардың жауаптарын жеке жолдарға шығар.','Выведите ответы только на запросы типа 1, по одному в строке.',
 '1 ≤ n,q ≤ 20000; 1 ≤ h[i],h ≤ 10^9; 1≤s,t,p≤n; 0≤u,d≤10^6',['3 4\n1 4 2\n1 1 3 2 1\n2 2 1\n1 1 3 2 1\n1 3 1 2 1\n','1 3\n5\n1 1 1 7 2\n2 1 9\n1 1 1 1 1\n'])
add('Зерттеушілер жарысы','Гонка исследователей','Қозғалыс','C, 6–7-бет',
 'АЛЬФА мен БЕТА өзгеріп тұратын ғимараттар қатарында жарысады. 1 Apos Aup Adown Bpos Bup Bdown target сұранысында әрқайсысы өз орнынан ортақ мақсатқа көршілес ғимараттармен тікелей жүреді. Кім тез жететінін тап. 2 p h операциясы p ғимаратының биіктігін h етеді. Жарыс сұранысындағы орындар әр жолда жаңадан беріледі, ал биіктік өзгерістері кейінгі сұраныстарға сақталады.',
 'АЛЬФА и БЕТА соревнуются на изменяющемся ряду зданий. В запросе 1 Apos Aup Adown Bpos Bup Bdown target каждый идёт прямо по соседним зданиям от своей позиции к общей цели. Определите победителя. Операция 2 p h меняет высоту p на h. Позиции задаются заново в каждом запросе, изменения высот сохраняются.',
 'n q; n биіктік; q операция. 1-сұраныста жеті параметр, 2-сұраныста p h бар. Кемінде бір жарыс бар.','n q; n высот; q операций. После 1 идут семь параметров, после 2 — p h. Есть хотя бы одна гонка.',
 'Әр жарыс үшін ALFA, BETA немесе TENG шығар.','Для каждой гонки выведите ALFA, BETA либо TENG.',
 '1 ≤ n,q ≤ 20000; 1 ≤ биіктіктер ≤ 10^9; орындар 1…n; 0 ≤ құндар ≤ 10^6',['3 3\n1 3 2\n1 1 1 1 3 1 1 2\n2 2 1\n1 1 1 1 3 1 1 2\n','1 1\n8\n1 1 3 2 1 1 8 1\n'])

INF=10**30
def floyd(edges,base=False):
    d=[[abs(i-j) if base else (0 if i==j else INF) for j in range(26)] for i in range(26)]
    for x,y,w in edges: d[x][y]=min(d[x][y],w)
    for k in range(26):
        for i in range(26):
            for j in range(26): d[i][j]=min(d[i][j],d[i][k]+d[k][j])
    return d
def pathcost(h,s,t,u,d):
    step=1 if s<t else -1
    return sum(max(h[i+step]-h[i],0)*u+max(h[i]-h[i+step],0)*d for i in range(s,t,step))
def winner(h,a):
    ap,au,ad,bp,bu,bd,t=a
    x=pathcost(h,ap-1,t-1,au,ad);y=pathcost(h,bp-1,t-1,bu,bd)
    return 'ALFA' if x<y else 'BETA' if x>y else 'TENG'
def versions(lines):
    n,q=map(int,lines[0].split());ops=[l.split() for l in lines[1:n+1]];queries=[list(map(int,l.split())) for l in lines[n+1:]]
    worlds=[{},{}]
    for p,op,x,v in ops:
        state=worlds[int(p)].copy();x=int(x);v=int(v)
        assert (x not in state) if op=='SET' else (x in state)
        state[x]=v if op=='SET' else state[x]+v;worlds.append(state)
    return '\n'.join(str(worlds[w].get(x,-1)) for w,x in queries)
def fast_versions(lines):
    n,q=map(int,lines[0].split());children=[[] for _ in range(n+2)];queries=[[] for _ in range(n+2)]
    for i,line in enumerate(lines[1:n+1],2):
        p,op,x,v=line.split();children[int(p)].append((i,op,int(x),int(v)))
    for i,line in enumerate(lines[n+1:]):w,x=map(int,line.split());queries[w].append((i,x))
    state={};ans=[0]*q;events=[('visit',1)]
    while events:
        event=events.pop();kind=event[0]
        if kind=='undo':
            _,x,old=event
            if old is None:state.pop(x,None)
            else:state[x]=old
        elif kind=='enter':
            _,w,op,x,v=event;old=state.get(x);state[x]=v if op=='SET' else state[x]+v
            events.append(('undo',x,old));events.append(('visit',w))
        else:
            w=event[1]
            for i,x in queries[w]:ans[i]=state.get(x,-1)
            for child,op,x,v in reversed(children[w]):events.append(('enter',child,op,x,v))
    return '\n'.join(map(str,ans))
class Heights:
    def __init__(self,h):
        self.h=h[:];self.n=len(h);self.up=[0]*(self.n+1);self.down=[0]*(self.n+1)
        for i in range(1,self.n):self.edge(i,1)
    def add(self,a,i,v):
        while i<=self.n:a[i]+=v;i+=i&-i
    def edge(self,i,k):
        if 1<=i<self.n:
            d=self.h[i]-self.h[i-1];self.add(self.up,i,k*max(d,0));self.add(self.down,i,k*max(-d,0))
    def change(self,p,v):
        self.edge(p,-1);self.edge(p+1,-1);self.h[p]=v;self.edge(p,1);self.edge(p+1,1)
    def prefix(self,a,i):
        z=0
        while i:z+=a[i];i-=i&-i
        return z
    def cost(self,s,t,u,d):
        l,r=sorted((s,t));up=self.prefix(self.up,r)-self.prefix(self.up,l);down=self.prefix(self.down,r)-self.prefix(self.down,l)
        return up*u+down*d if s<=t else down*u+up*d
def solve(num,text,slow=False):
    ls=text.strip().splitlines();out=[]
    if num==1:return str(sum(abs(ord(x)-ord(y)) for x,y in zip(ls[0],ls[1])))
    if num==2:
        c=ls[0];x,y=ls[1].split();last={};ans=INF
        for i,ch in enumerate(c):
            last[ch]=i
            if ch==x and y in last:ans=min(ans,i-last[y])
            if ch==y and x in last:ans=min(ans,i-last[x])
        return str(ans if ans<INF else -1)
    if num==3:
        n,q=map(int,ls[0].split());vs=[0,0]
        for l in ls[1:n+1]:p,d=map(int,l.split());vs.append(vs[p]+d)
        return '\n'.join(str(vs[int(l)]) for l in ls[n+1:])
    if num==4:
        h=list(map(int,ls[1].split()));s,t,u,d=map(int,ls[2].split());return str(pathcost(h,s-1,t-1,u,d))
    if num==5:return winner(list(map(int,ls[1].split())),list(map(int,ls[2].split())))
    if num in (6,7):
        edges=[]
        for l in ls[3:]:x,y,w=l.split();edges.append((ord(x)-97,ord(y)-97,int(w)))
        if num==7:edges+=[(y,x,w) for x,y,w in edges[:]]
        dist=floyd(edges,num==7);cost=[dist[ord(x)-97][ord(y)-97] for x,y in zip(ls[0],ls[1])]
        return str(-1 if any(c>=INF for c in cost) else sum(cost))
    if num==8:
        state={}
        for line in ls[1:]:
            a=line.split();x=int(a[1])
            if a[0]=='GET':out.append(str(state.get(x,-1)))
            elif a[0]=='SET':state[x]=int(a[2])
            else:state[x]+=int(a[2])
        return '\n'.join(out)
    if num in (9,13):return versions(ls) if num==9 or slow else fast_versions(ls)
    if num==10:
        h=list(map(int,ls[1].split()));sums=Heights(h)
        return '\n'.join(str(pathcost(h,s-1,t-1,u,d) if slow else sums.cost(s-1,t-1,u,d)) for s,t,u,d in (map(int,l.split()) for l in ls[2:]))
    if num==11:
        c=ls[2];edges=[]
        if slow:
            for i,x in enumerate(c):
                for j,y in enumerate(c):edges.append((ord(x)-97,ord(y)-97,abs(i-j)))
        else:
            for x,y in zip(c,c[1:]):edges.extend([(ord(x)-97,ord(y)-97,1),(ord(y)-97,ord(x)-97,1)])
        dist=floyd(edges,True);return str(sum(dist[ord(x)-97][ord(y)-97] for x,y in zip(ls[0],ls[1])))
    if num==12:
        edges=[(ord(x)-97,ord(y)-97,int(w)) for x,y,w in (l.split() for l in ls[2:])];dist=floyd(edges)
        freq=[ls[0].count(chr(i+97)) for i in range(26)];ans=(INF,0)
        for y in range(26):
            if any(freq[x] and dist[x][y]>=INF for x in range(26)):continue
            ans=min(ans,(sum(freq[x]*dist[x][y] for x in range(26)),y))
        return '-1' if ans[0]>=INF else str(ans[0])+'\n'+chr(ans[1]+97)
    if num in (14,15):
        h=list(map(int,ls[1].split()));tree=Heights(h)
        for line in ls[2:]:
            a=list(map(int,line.split()))
            if a[0]==2:
                h[a[1]-1]=a[2];tree.change(a[1]-1,a[2])
            elif num==14:
                _,s,t,u,d=a;out.append(str(pathcost(h,s-1,t-1,u,d) if slow else tree.cost(s-1,t-1,u,d)))
            elif slow:out.append(winner(h,a[1:]))
            else:
                _,ap,au,ad,bp,bu,bd,t=a;x=tree.cost(ap-1,t-1,au,ad);y=tree.cost(bp-1,t-1,bu,bd)
                out.append('ALFA' if x<y else 'BETA' if x>y else 'TENG')
        return '\n'.join(out)
    raise ValueError(num)

def world_case(n,q):
    worlds=[{},{}];ops=[]
    for i in range(1,n+1):
        p=R.randrange(1,i+1);state=worlds[p].copy();x=R.randrange(1,12);v=R.randrange(-100,101);op='ADD' if x in state else 'SET'
        ops.append(f'{p} {op} {x} {v}');state[x]=state.get(x,0)+v if op=='ADD' else v;worlds.append(state)
    asks=[f'{R.randrange(1,n+2)} {R.randrange(1,14)}' for _ in range(q)]
    return f'{n} {q}\n'+'\n'.join(ops+asks)+'\n'
def travel_case(num,n,q):
    h=[R.randrange(1,100) for _ in range(n)];lines=[f'{n} {q}' if num>=10 else str(n),' '.join(map(str,h))]
    race=lambda:[R.randrange(1,n+1),R.randrange(0,8),R.randrange(0,8),R.randrange(1,n+1),R.randrange(0,8),R.randrange(0,8),R.randrange(1,n+1)]
    route=lambda:[R.randrange(1,n+1),R.randrange(1,n+1),R.randrange(0,8),R.randrange(0,8)]
    if num==4:lines.append(' '.join(map(str,route())))
    elif num==5:lines.append(' '.join(map(str,race())))
    else:
        for i in range(q):
            a=([2,R.randrange(1,n+1),R.randrange(1,100)] if num>=14 and i and R.random()<.35 else ([1]+race() if num==15 else [1]+route() if num==14 else route()))
            lines.append(' '.join(map(str,a)))
    return '\n'.join(lines)+'\n'
def cases(num):
    out=TASKS[num-1]['exampleInputs'][:]
    for k in range(8):
        n=[1,2,5,12,30,60,90,180][k]
        if num==1:
            a=''.join(R.choice('abmz') for _ in range(n));b=a if k==0 else ''.join(R.choice('azcy') for _ in range(n));v=a+'\n'+b+'\n'
        elif num==2:v=''.join(R.choice('abcz') for _ in range(n))+'\n'+('a a' if k%3==0 else 'a z' if k%3==1 else 'x y')+'\n'
        elif num==3:
            ops=[f'{R.randrange(1,i+1)} {R.randrange(-10**9,10**9)}' for i in range(1,n+1)];v=f'{n} {n+1}\n'+'\n'.join(ops+[str(i) for i in range(1,n+2)])+'\n'
        elif num in (4,5,10,14,15):v=travel_case(num,n,n+1)
        elif num in (6,7):
            alphabet='abcd' if num==6 else 'abmyz';a=''.join(R.choice(alphabet) for _ in range(n));b=''.join(R.choice(alphabet) for _ in range(n));edges=[f'{R.choice(alphabet)} {R.choice(alphabet)} {R.randrange(0,30)}' for _ in range(k*4)];v=a+'\n'+b+'\n'+str(len(edges))+'\n'+'\n'.join(edges)+'\n'
        elif num==8:
            ops=['GET 1'];keys=set()
            for i in range(n):
                x=R.randrange(1,10)
                if R.random()<.35:ops.append(f'GET {x}')
                else:ops.append(f'{"ADD" if x in keys else "SET"} {x} {R.randrange(-100,101)}');keys.add(x)
            v=str(len(ops))+'\n'+'\n'.join(ops)+'\n'
        elif num in (9,13):v=world_case(n,n+1)
        elif num==11:v=''.join(R.choice('abmyz') for _ in range(n))+'\n'+''.join(R.choice('abmyz') for _ in range(n))+'\n'+''.join(R.choice('azcy') for _ in range(n))+'\n'
        elif num==12:
            edges=[f'{R.choice("abcd")} {R.choice("abcd")} {R.randrange(0,20)}' for _ in range(k*4)];v=''.join(R.choice('abcd') for _ in range(n))+'\n'+str(len(edges))+'\n'+'\n'.join(edges)+'\n'
        out.append(v)
    # Boundary/performance cases without very large output files.
    if num in (1,7,11,12):
        n=200000 if num>=11 else 100000
        if num==1:out.append('a'*n+'\n'+'z'*n+'\n')
        elif num==7:out.append('a'*n+'\n'+'z'*n+'\n1\na z 0\n')
        elif num==11:out.append('a'*n+'\n'+'z'*n+'\n'+'az'*(n//2)+'\n')
        else:out.append('a'*n+'\n1\na b 0\n')
    if num==13:
        n=20000;out.append(f'{n} 3\n1 SET 1 1000000000\n'+'\n'.join(f'{i} ADD 1 1000000000' for i in range(2,n+1))+f'\n1 1\n{n+1} 1\n2 1\n')
    if num in (10,14,15):
        n=20000 if num>=14 else 100000
        heights=' '.join(str(i+1) for i in range(n))
        commands=([f'1 {n} 2 3',f'{n} 1 2 3'] if num==10 else [f'1 1 {n} 2 3',f'2 {n} 1',f'1 1 {n} 2 3'] if num==14 else [f'1 1 2 3 {n} 2 3 {n}',f'2 {n} 1',f'1 1 2 3 {n} 2 3 {n}'])
        out.append(f'{n} {len(commands)}\n'+heights+'\n'+'\n'.join(commands)+'\n')
    return out

def verify():
    # Independent copy-vs-rollback, pairwise-vs-adjacent edges and direct-vs-Fenwick checks.
    for num in (10,11,13,14,15):
        for _ in range(30):
            text=world_case(20,30) if num==13 else ('abzy\nzyab\n'+''.join(R.choice('azby') for _ in range(12))+'\n') if num==11 else travel_case(num,10,20)
            assert solve(num,text)==solve(num,text,True),(num,text)
    # Bellman-Ford independent oracle for directed shortest paths.
    for _ in range(20):
        edges=[(R.randrange(4),R.randrange(4),R.randrange(8)) for _ in range(8)];d=floyd(edges)
        for start in range(4):
            best=[INF]*26;best[start]=0
            for step in range(25):
                for x,y,w in edges:best[y]=min(best[y],best[x]+w)
            assert best==d[start]
    for _ in range(50):
        c=''.join(R.choice('abcd') for _ in range(30));x,y=R.choice('abcd'),R.choice('abcde');expected=min((abs(i-j) for i,a in enumerate(c) for j,b in enumerate(c) if a==x and b==y),default=-1)
        assert int(solve(2,c+'\n'+x+' '+y))==expected

def main():
    verify();bank=[]
    for n,task in enumerate(TASKS,1):
        inputs=cases(n);tests=[dict(input=v,output=solve(n,v)) for v in inputs]
        item={k:v for k,v in task.items() if k!='exampleInputs'};item['examples']=tests[:2]
        if n in (1,7,10,11,12,13,14,15):
            last=tests[-1];last['recipe']={'task':n};last.pop('input')
        item['tests']=tests;bank.append(item)
    text='/* Adapted training tasks based on the user-supplied 2026 grade-8 A/B/C set.\n * Browser practice tests are public assets, not a secure contest judge. */\nwindow.CT_OLYMPIAD_BANK='+json.dumps(bank,ensure_ascii=False,separators=(',',':'))+';\n'
    target=ROOT/'olympiad-bank.js'
    if '--check' in sys.argv:
        assert target.read_text()==text,'Bank is out of date; rebuild it.'
    else:target.write_text(text)
    print(f'15 problems, {sum(len(x["tests"]) for x in bank)} cases; Independent differential checks passed.')
if __name__=='__main__':main()
