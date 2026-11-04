/* General orientation before the first baseline attempt; no diagnostic answers. */
(() => {
 'use strict';
 const copy={
  kk:{
   eyebrow:'ЖҰМЫСҚА КІРІСПЕ · 1–2 МИНУТ',title:'Python және алгоритмдік ойлау',
   lead:'Диагностиканы бастамас бұрын платформамен қысқаша танысып ал.',
   pythonTitle:'Python деген не?',
   python:'Python — компьютерге нұсқау жазуға арналған программалау тілі. Оның көмегімен есептеулер жүргізуге, ақпаратты өңдеуге және түрлі бағдарламалар жасауға болады.',
   thinkingTitle:'Алгоритмдік ойлау деген не?',
   thinking:'Алгоритмдік ойлау — мәселені түсініп, оны шешу жолын ретімен құра білу. Мысалы, мектепке дайындалғанда не істейтініңді ретімен жоспарлайсың. Компьютерге де әрекеттерді түсінікті әрі дұрыс ретпен беру керек.',
   journeyTitle:'Бұл платформада қалай үйренесің?',
   steps:[['Түсін','Есепте не берілгенін және нені табу керегін анықта.'],['Жоспарла','Шешу жолын ретімен ойластыр.'],['Кодта және тексер','Жоспарыңды Python кодына айналдырып, нәтижесін тексер.'],['Қорытындыла','Шешіміңді түсіндіріп, не үйренгеніңді айт.']],
   beforeTitle:'Енді бастапқы біліміңді байқап көр',
   before:'Барлығын білу міндетті емес. Өз білгеніңмен жауап бер: жауаптарың қай тақырыпты үйрену қажет екенін анықтауға көмектеседі.',
   how:'Жауаптарды берілген өріске жаз. Әр бетте сақтау және келесі қадамға өту батырмаларын пайдалан. Қажет болса, жұмысты сақтап, кейін жалғастыра аласың.',
   button:'Түсіндім, диагностиканы бастау'
  },
  ru:{
   eyebrow:'ПЕРЕД НАЧАЛОМ · 1–2 МИНУТЫ',title:'Python и алгоритмическое мышление',
   lead:'Перед началом диагностики кратко познакомься с платформой.',
   pythonTitle:'Что такое Python?',
   python:'Python — язык программирования, на котором записывают инструкции для компьютера. С его помощью можно выполнять вычисления, обрабатывать информацию и создавать разные программы.',
   thinkingTitle:'Что такое алгоритмическое мышление?',
   thinking:'Алгоритмическое мышление — умение понять задачу и последовательно выстроить путь её решения. Например, собираясь в школу, ты планируешь свои действия по порядку. Компьютеру тоже нужны понятные инструкции в правильном порядке.',
   journeyTitle:'Как ты будешь учиться на платформе?',
   steps:[['Пойми','Определи, что дано в задаче и что нужно найти.'],['Спланируй','Продумай последовательность решения.'],['Напиши код и проверь','Переведи план в код Python и проверь результат.'],['Подведи итог','Объясни решение и расскажи, чему научился.']],
   beforeTitle:'Теперь проверь свои начальные знания',
   before:'Знать всё необязательно. Отвечай самостоятельно: твои ответы помогут определить, какие темы тебе предстоит изучить.',
   how:'Записывай ответы в отведённые поля. Пользуйся кнопками сохранения и перехода к следующему шагу. При необходимости можно сохранить работу и продолжить позже.',
   button:'Понятно, начать диагностику'
  }
 };
 function view(lang='kk'){
  const c=copy[lang]||copy.kk;
  return `<section class="diagnostic-intro" aria-labelledby="diagnostic-intro-title"><article class="card intro-welcome"><span class="eyebrow">${c.eyebrow}</span><h1 id="diagnostic-intro-title">${c.title}</h1><p class="intro-lead">${c.lead}</p></article><div class="intro-concepts"><article class="card"><span class="intro-symbol" aria-hidden="true">Py</span><h2>${c.pythonTitle}</h2><p>${c.python}</p></article><article class="card"><span class="intro-symbol" aria-hidden="true">1 · 2 · 3</span><h2>${c.thinkingTitle}</h2><p>${c.thinking}</p></article></div><article class="card"><h2>${c.journeyTitle}</h2><ol class="intro-steps">${c.steps.map(([title,text],i)=>`<li><span class="intro-step-number" aria-hidden="true">${i+1}</span><div><strong>${title}</strong><p>${text}</p></div></li>`).join('')}</ol></article><article class="card intro-start"><h2>${c.beforeTitle}</h2><p>${c.before}</p><p class="muted">${c.how}</p><button type="button" class="primary intro-start-button" data-do="diagnostic-intro-start">${c.button} →</button></article></section>`;
 }
 window.CT_DIAGNOSTIC_INTRO={view};
})();
