// Keep the spreadsheet parser out of the login and pupil page load.
(() => {
 'use strict';
 let excelPromise=null;
 window.CT_ASSETS={excel(){
  if(window.XLSX)return Promise.resolve(window.XLSX);
  if(excelPromise)return excelPromise;
  excelPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=new URL('vendor/xlsx.full.min.js',document.baseURI).href;
   script.async=true;
   script.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error('Excel модулі жүктелмеді. / Модуль Excel не загрузился.'));
   script.onerror=()=>reject(Error('Excel модулі жүктелмеді. Байланысты тексеріп, қайталаңыз. / Модуль Excel не загрузился. Проверьте соединение и повторите.'));
   document.head.appendChild(script);
  }).catch(error=>{excelPromise=null;throw error;});
  return excelPromise;
 }};
})();
