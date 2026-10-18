// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const k0=cur; $("ans").value="zzz"; $("go").click();
 t("wrong answer adds review",S.review[k0]&&S.total===1&&answered&&!$("undo").disabled);
 document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}));
 t("esc undoes",!S.review[k0]&&S.total===0&&!answered&&cur===k0&&$("undo").disabled&&$("ans").value==="");
 $("ans").value=form(...cur.split("|").map((x,i)=>i===2?+x:x)); $("go").click();
 t("right answer",S.right===1);
 $("undo").click(); t("undo button",S.right===0&&S.total===0);
 $("ans").value="zzz"; $("go").click(); $("tn-fut").click(); $("l-2").click(); $("l-2").dispatchEvent(new Event("change"));
 $("resetAll").click(); t("armed",$("resetAll").textContent.includes("Точно")&&S.total===1);
 $("resetAll").click();
 t("reset all",S.total===0&&!Object.keys(S.review).length&&selTenses.join()==="pres,pret"&&$("l-1").checked&&!$("tn-fut").checked&&localStorage.getItem(TKEY)===null&&$("resetAll").textContent.includes("Сбросить всё"));
 t("go label",$("go").textContent.includes("Проверить"));
}catch(e){R.push("ERR "+e)}
document.title=R.join(" | ");
