// runs inside the page module (see the e2e hook): every other verb (level 5, verbs.json) in the search, the card and the trainer
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
return verbsReady.then(()=>{
try{
 t("thousands of verbs added",MORE.length>8000&&ALL.length===OWN.size+MORE.length);
 const q=v=>{$("q").value=v;$("q").dispatchEvent(new Event("input"));return [...$("results").querySelectorAll("button")].map(b=>b.dataset.v);};
 openSheet("search");
 t("empty query says how many more there are",$("results").textContent.includes("И ещё"));
 q("recontar"); t("infinitive of a level-5 verb",selVerb==="recontar"&&$("verbCard").textContent.includes("Все остальные")&&$("verbCard").textContent.includes("как contar"));
 q("recuento"); t("form of a level-5 verb → its card",q("recuento").includes("recontar")&&$("verbCard").querySelector(".found .f")?.textContent==="recuento");
 q("previó"); t("prever: previó",q("previó").includes("prever"));
 q("копать"); t("Russian meaning finds a level-5 verb",q("копать").includes("excavar"));
 q("arrepentir"); t("a -se verb says so",$("verbCard").textContent.includes("arrepentirse"));
 q("atañer"); t("a defective verb says so",$("verbCard").textContent.includes("Неполный"));
 sheet.close();
 // the trainer on level 5: tasks come from the added verbs, always in Spanish
 $("l-5").checked=true; $("m-ru").checked=true; $("l-5").dispatchEvent(new Event("change"));
 let ok=true; for(let i=0;i<30;i++){ show(); const v=cur.split("|")[0]; if(TIER[v]!==5||DEFECTIVE[v]||curRu) ok=false; }
 t("level 5: added verbs, no defective ones, Spanish prompts",ok);
 cur="recontar|pres|0"; curRu=false; $("ans").value="recuento"; check(); t("answer to a level-5 task",$("fb").classList.contains("ok"));
 step(); cur="recontar|pres|2"; curRu=false; $("ans").value="reconta"; check(); t("mistake explained with the model",$("fb").classList.contains("bad")&&$("fb").textContent.includes("Спрягается как contar"));
 $("l-1").checked=true; $("m-es").checked=true; $("l-1").dispatchEvent(new Event("change"));
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
});
