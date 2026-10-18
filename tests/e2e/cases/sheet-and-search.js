// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 t("panels hidden, sheet closed",!sheet.open&&[...document.querySelectorAll(".panel")].every(x=>x.hidden));
 document.querySelector('[data-open=irregular]').click();
 t("opens on tab",sheet.open&&!$("irregular").hidden&&$("regular").hidden&&document.querySelector('[data-tab=irregular]').getAttribute("aria-selected")==="true");
 document.querySelector('[data-tab=other]').click(); t("tab switch",!$("other").hidden&&$("irregular").hidden);
 document.querySelector('[data-tab=search]').click();
 t("empty search lists all",$("results").querySelectorAll("button").length===ALL.length&&$("verbCard").innerHTML==="");
 const q=v=>{$("q").value=v;$("q").dispatchEvent(new Event("input"));};
 q("tuve"); t("form search → tener card",selVerb==="tener"&&$("verbCard").querySelector(".found .f").textContent==="tuve");
 q("иметь"); t("russian search",[...$("results").querySelectorAll("button")].some(b=>b.dataset.v==="tener"));
 q("fui"); const vs=[...$("results").querySelectorAll("button")].map(b=>b.dataset.v); t("fui → ser & ir",vs.includes("ser")&&vs.includes("ir"));
 q("hecho"); t("participle → hacer",selVerb==="hacer");
 q("habriamos hablado"); t("compound w/o accent",selVerb==="hablar"&&$("verbCard").querySelector(".found"));
 q("habl"); t("prefix",$("results").querySelector("button").dataset.v==="hablar");
 q("zzzz"); t("nothing found",$("results").textContent.includes("Ничего"));
 q("oir"); t("oír without accent",selVerb==="oír");
 t("irregular marked",[...$("verbCard").querySelectorAll(".f.x")].some(x=>x.textContent==="oigo"));
 // answer while sheet closed, then esc inside sheet must not undo
 sheet.close();
 $("ans").value="zzz"; $("go").click(); t("fb visible after answer",!$("fb").hidden&&$("fb").classList.contains("bad"));
 sheet.showModal(); document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"})); t("esc in sheet doesn't undo",answered&&S.total===1); sheet.close();
 $("go").click(); t("next word clears result",$("fb").hidden&&!$("fb").classList.contains("bad"));
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
