// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const q=v=>{$("q").value=v;$("q").dispatchEvent(new Event("input"));return [...$("results").querySelectorAll("button")].map(b=>b.dataset.v);};
 openSheet("search");
 t("empty query lists the 286 engine verbs",q("").length===286&&OWN.size===286);
 let r=q("говорить"); t("говорить → hablar & decir",r.includes("hablar")&&r.includes("decir"));
 t("rows show all meanings",$("results").classList.contains("rows")&&$("results").querySelector('[data-v=hablar] small').textContent.includes("беседовать"));
 t("matched meaning bold",!!$("results").querySelector('[data-v=decir] small b'));
 r=q("сказал"); t("Russian past form → decir",r.includes("decir"));
 r=q("иметь"); t("иметь → tener",r[0]==="tener");
 r=q("проводить время"); t("two words → pasar, llevar",r.includes("pasar")&&r.includes("llevar"));
 r=q("начинать"); t("synonyms: empezar & comenzar",r.includes("empezar")&&r.includes("comenzar"));
 r=q("ёж"); t("unknown word → nothing",r.length===0);
 r=q("elijo"); t("form of a new verb → elegir",selVerb==="elegir");
 r=q("no hables"); t("negative imperative form found",selVerb==="hablar");
 t("card shows meanings",!!$("verbCard").querySelector(".means"));
 t("card has 18 tenses",$("verbCard").querySelectorAll(".card").length===18);
 sheet.close();
 // -se accepted, Russian synonym accepted
 cur="tener|si|3"; curRu=false; $("ans").value="tuviésemos"; check(); t("-se form accepted",$("fb").classList.contains("ok")&&$("fb").textContent.includes("-se"));
 step(); cur="comenzar|pres|0"; curRu=true; $("ans").value="empiezo"; check(); t("Russian synonym accepted",$("fb").classList.contains("ok")&&$("fb").textContent.includes("empezar"));
 step(); cur="comenzar|pres|0"; curRu=false; $("ans").value="empiezo"; check(); t("synonym not accepted in Spanish prompt",$("fb").classList.contains("bad"));
 step(); cur="hablar|impn|2"; curRu=false; $("ans").value="no hable"; check(); t("impn answer",$("fb").classList.contains("ok"));
 t("level 4 radio exists",!!$("l-4"));
 t("settings label 'negativo'",[...document.querySelectorAll(".tchip span")].some(s=>s.textContent==="negativo"));
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
