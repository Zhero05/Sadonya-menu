
(function(){
"use strict";
/* ============================================================
   CONSTANTS & TRANSLATIONS
============================================================ */
const SUPABASE_URL = "https://ykdulxriwbfotphuynwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_huFfiSuOebKgVlejq_r7Eg_cZ9mBSuP";
const supabaseClient = (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY")
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const MENU_ID = "sadonya-cafe";
const STORAGE_BUCKET = "sadonya-images";
 
const UI = {
  en:{ popular:"Popular", noItems:"No items in this category yet.", hours:"Opening Hours", contact:"Contact", follow:"Follow Us", location:"Location", scan:"Scan the QR code at your table to view this menu", currency:"IQD", lobbyTag:"Coffee • Food • Desserts", lobbyMenu:"Menu", branchSadonya:"Sadonya", branchPlus:"Sadonya Plus", divider:"or", search:"Search the menu…", noResults:"No matching items found.", results:"results" },
  ku:{ popular:"بەناوبانگ", noItems:"هێشتا هیچ شتێک لەم بەشەدا نییە.", hours:"کاتی کارکردن", contact:"پەیوەندی", follow:"شوێنمان بکەون", location:"شوێن", scan:"کۆدی QR لەسەر مێزەکەت سکان بکە بۆ بینینی مینیو", currency:"IQD", lobbyTag:"قاوە • خواردن • شیرینی", lobbyMenu:"مێنیۆ", branchSadonya:"سادۆنیا", branchPlus:"سادۆنیا پلاس", divider:"یان", search:"گەڕان لە مێنیۆدا…", noResults:"هیچ ئەنجامێک نەدۆزرایەوە.", results:"ئەنجام" },
  ar:{ popular:"الأكثر طلبًا", noItems:"لا توجد عناصر في هذا القسم بعد.", hours:"ساعات العمل", contact:"تواصل معنا", follow:"تابعنا", location:"الموقع", scan:"امسح رمز QR الموجود على طاولتك لعرض القائمة", currency:"IQD", lobbyTag:"قهوة • أطعمة • حلويات", lobbyMenu:"منيو", branchSadonya:"سادونيا", branchPlus:"سادونيا بلس", divider:"أو", search:"ابحث في القائمة…", noResults:"لا توجد نتائج مطابقة.", results:"نتيجة" }
};
 
function tr(field, lang){
  if(!field) return "";
  if(typeof field === "string") return field;
  return field[lang] || field.en || "";
}
 
/* ============================================================
   DEFAULT DEMO DATA
============================================================ */
const DEFAULT_SETTINGS = {
  name: "Sadonya Cafe",
  description: { en:"Coffee • Food • Desserts", ku:"قاوە • خواردن • شیرینی", ar:"قهوة • طعام • حلويات" },
  logo: "",
  phone: "",
  instagram: "https://www.instagram.com/sadonya.1?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
  facebook: "https://www.facebook.com/share/1CnrcA5Mku/?mibextid=wwXIfr",
  snap: "",
  location: "",
  hours: "",
  publicUrl: "https://yourdomain.com/menu/sadonya-cafe"
};

const _urlLang = new URLSearchParams(location.search).get("lang");
const _savedLang = localStorage.getItem("sadonya_lang");
let state = { lang: ["en","ku","ar"].includes(_urlLang) ? _urlLang : (["en","ku","ar"].includes(_savedLang) ? _savedLang : "en"), settings: null };

async function loadSettings(){
  // The lobby should never wait for Supabase before becoming usable.
  // Show the built-in lobby immediately, then update the description/logo
  // in the background when the branch settings arrive.
  if(!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("sadonya_cafe_settings")
    .select("name,description,logo_url")
    .eq("id","sadonya-cafe")
    .maybeSingle();

  if(error){
    console.warn("Lobby settings could not be loaded:", error.message);
    return;
  }

  if(data){
    state.settings = {
      ...state.settings,
      name: data.name || state.settings.name,
      description: data.description || state.settings.description,
      logo: data.logo_url || state.settings.logo
    };
    renderLobby();
  }
}

function renderLobby(){
  const lang = state.lang;
  const s = state.settings;
  const brandNames = {
    en:{main:"Sadonya", plus:"Sadonya Plus"},
    ku:{main:"سادۆنیا", plus:"سادۆنیا پلاس"},
    ar:{main:"سادونيا", plus:"سادونيا بلس"}
  };
  document.getElementById("lobbyName").textContent = brandNames[lang].main;
  document.querySelector('[data-branch="sadonya"] .branch-label').textContent = brandNames[lang].main;
  document.querySelector('[data-branch="plus"] .branch-label').textContent = brandNames[lang].plus;
  document.getElementById("lobbyTag").textContent = s.description ? tr(s.description, lang) : (UI[lang].lobbyTag || "");
  document.getElementById("lobbyDivider").textContent = UI[lang].divider || "or";
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "en") ? "ltr" : "rtl";
  const langs = [["en","English"],["ku","کوردی"],["ar","العربية"]];
  document.getElementById("lobbyLangs").innerHTML = langs.map(([code,label])=>
    `<button data-lang="${code}" class="${state.lang===code?'active':''}">${label}</button>`
  ).join("");
  document.querySelectorAll("#lobbyLangs button").forEach(btn=>{
    btn.onclick = ()=>{
      if(btn.dataset.lang === state.lang) return;
      state.lang = btn.dataset.lang;
      localStorage.setItem("sadonya_lang", state.lang);
      renderLobby();
    };
  });
}

document.querySelectorAll(".lobby-branch-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    localStorage.setItem("sadonya_lang", state.lang);
    const target = btn.dataset.target;
    const lobby = document.getElementById("lobby");
    lobby.classList.add("lobby-leaving");
    const bgVideo = document.getElementById("lobbyBgVideo");
    if(bgVideo) bgVideo.pause(); // stop the moment we leave the lobby
    setTimeout(()=>{ location.href = target + "?lang=" + state.lang; }, 380);
  });
});

/* ============================================================
   BACKGROUND VIDEO — runs only in the lobby, loops smoothly,
   and pauses whenever it isn't visible so it never taxes the
   rest of the app (tab switch, minimized window, reduced-motion).
============================================================ */
(function bgVideo(){
  const video = document.getElementById("lobbyBgVideo");
  if(!video) return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduceMotion){
    // Respect the user's preference: show the poster frame only, no motion.
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  const tryPlay = ()=>{ const p = video.play(); if(p && p.catch) p.catch(()=>{}); };
  tryPlay();

  // Only start the slow zoom/drift once playback is genuinely smooth —
  // kicking it off immediately would fight the video's own first-frame
  // decode and show up as a little stutter right at the start.
  video.addEventListener("playing", ()=> video.classList.add("is-playing"));
  video.addEventListener("waiting", ()=> video.classList.remove("is-playing"));

  // Loop is handled natively via the `loop` attribute for a seamless replay,
  // no JS timing needed — keeps playback smooth with zero extra work.

  // Pause while the tab/app isn't visible, resume when it's back.
  document.addEventListener("visibilitychange", ()=>{
    if(document.hidden) video.pause();
    else if(document.getElementById("lobby").style.display !== "none") tryPlay();
  });
})();

(function boot(){
  // Render immediately — don't block the lobby on a network request.
  state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  document.getElementById("loading").style.display = "none";
  const lobby = document.getElementById("lobby");
  lobby.style.display = "flex";
  renderLobby();

  // Update from Supabase in the background.
  loadSettings();
})();
})();
