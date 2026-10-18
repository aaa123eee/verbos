// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const ans=v=>{$("ans").value=v;check();};
 const enter=el=>el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
 cur="tener|pret|0"; ans("tení"); t("1st mistake: no drill",!S.drill&&!$("fb").querySelector(".drillnote"));
 step(); t("next question normal",!drilling&&$("drill").hidden);
 cur="tener|pret|2"; ans("tenió"); t("2nd mistake → drill pending",S.drill==="tener|pret"&&!!$("fb").querySelector(".drillnote"));
 undo(); t("undo cancels drill",!S.drill);
 cur="tener|pret|2"; ans("tenió"); t("pending again",S.drill==="tener|pret");
 step(); const rows=[...document.querySelectorAll("#drill .dr")];
 t("drill started, 6 rows, answer hidden",drilling&&rows.length===6&&document.querySelector(".answer").hidden&&$("hintbar").hidden&&$("undo").disabled);
 t("first row focused",document.activeElement===rows[0].querySelector("input"));
 const i0=rows[0].querySelector("input"); i0.value="tení"; enter(i0);
 t("wrong row shows answer and clears",rows[0].classList.contains("bad")&&rows[0].textContent.includes("tuve")&&i0.value==="");
 i0.value="tuv"; document.querySelector('.keys [data-k="é"]').click(); t("accent key types into row",i0.value==="tuvé");
 i0.value="tuve"; enter(i0); t("row ok, focus moves",rows[0].classList.contains("ok")&&document.activeElement===rows[1].querySelector("input"));
 const total=S.total;
 ["tuviste","tuvo","tuvimos","tuvisteis"].forEach((f,k)=>{const i=rows[k+1].querySelector("input");i.value=f;enter(i);});
 t("still drilling before last",drilling&&!!S.drill);
 const il=rows[5].querySelector("input"); il.value="tuvieron"; enter(il);
 t("drill done",!drilling&&!S.drill&&$("fb").classList.contains("ok")&&answered&&S.total===total);
 document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"})); t("Esc after drill does nothing",!S.drill&&answered);
 step(); t("back to normal",!drilling&&$("drill").hidden&&!document.querySelector(".answer").hidden&&!$("hintbar").hidden&&!!cur);
 S.drill="ser|imp"; show(); t("pending drill resumes on show (reload)",drilling&&document.querySelectorAll("#drill .dr").length===6);
 $("vos").checked=false; $("vos").dispatchEvent(new Event("change")); t("settings change keeps drill, vos off → 5 rows",drilling&&document.querySelectorAll("#drill .dr").length===5);
 S.drill="hablar|impa"; show(); t("imperative drill skips yo",document.querySelectorAll("#drill .dr").length===4);
 S.miss={"x|pres":{n:1,t:S.t-100}}; cur="ir|pres|0"; S.drill=null; drilling=false; answered=false; ans("va"); t("old misses pruned",!S.miss["x|pres"]&&S.miss["ir|pres"].n===1);
}catch(e){R.push("FAIL exc "+e.message)}
document.title=R.join(" | ");
