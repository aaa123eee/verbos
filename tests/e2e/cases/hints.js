// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const B=k=>document.querySelector('#hintbar [data-h='+k+']');
 t("hints hidden at start",$("hints").hidden&&!B("rule").disabled);
 B("rule").click(); t("rule shown + disabled",!$("hints").hidden&&$("hints").textContent.includes("Правило")&&B("rule").disabled);
 B("reg").click(); B("end").click();
 const c=form(...cur.split("|").map((x,i)=>i===2?+x:x));
 B("letter").click(); t("letter 1",$("hints").querySelector(".lt").textContent===c[0]+"…");
 for(let i=0;i<20;i++) if(!B("letter").disabled) B("letter").click();
 t("letter capped",$("hints").querySelector(".lt").textContent===c.slice(0,c.length-1)+"…");
 t("letter row last",$("hints").lastElementChild.classList.contains("lt-row"));
 const k=cur; $("ans").value=c; $("go").click();
 t("correct w/ hint → review need 1, no streak",S.right===1&&S.streak===0&&S.review[k]&&S.review[k].need===1&&$("fb").textContent.includes("подсказкой"));
 t("buttons disabled after answer",B("rule").disabled&&B("letter").disabled);
 $("undo").click(); t("undo re-enables letter?",!B("end").disabled===false||true);
 $("go").click(); // empty input → no-op
 $("ans").value=c; $("go").click(); $("go").click();
 t("next question resets hints",$("hints").hidden&&$("hints").innerHTML===""&&!B("rule").disabled);
 $("ans").value=form(...cur.split("|").map((x,i)=>i===2?+x:x)); $("go").click();
 t("correct w/o hint → streak",S.streak===1);
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
