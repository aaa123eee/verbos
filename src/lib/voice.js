// The voice of every page: Google Translate's voice (fetched per word, needs the network), else a Spanish voice of
// speechSynthesis. Nothing is fetched until the learner presses a speaker.
let sysVoice = null, google = true, audio = null;
const voiceSubs = [];
export const onVoice = (f) => voiceSubs.push(f);
export const canSpeak = () => (google && navigator.onLine !== false) || !!sysVoice;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  sysVoice = vs.find((v) => /^es[-_]ES/i.test(v.lang)) || vs.find((v) => /^es\b/i.test(v.lang)) || null;
  voiceSubs.forEach((f) => f(vs.length > 0));
}
function speakSys(text) {
  if (!sysVoice) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = sysVoice; u.lang = sysVoice.lang; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {}
}
// Google answers with an mp3 (up to 200 characters; the page sends no referrer, see Base.astro); if it fails or
// doesn't start within 4 s, the system voice speaks, and for the rest of the visit it speaks right away
export function speak(text) {
  if (audio) { audio.pause(); audio = null; }
  try { speechSynthesis.cancel(); } catch (e) {}
  if (!google || navigator.onLine === false || text.length > 200) return speakSys(text);
  const a = (audio = new Audio("https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=" + encodeURIComponent(text)));
  let done = false;
  const fail = () => { if (done) return; done = true; clearTimeout(t); google = false; voiceSubs.forEach((f) => f(true)); if (audio === a) { audio = null; speakSys(text); } };
  const t = setTimeout(fail, 4000);
  a.addEventListener("playing", () => { done = true; clearTimeout(t); });
  a.addEventListener("error", fail);
  a.play().catch((e) => { if (e.name !== "AbortError") fail(); });
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); }
export const SPK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
