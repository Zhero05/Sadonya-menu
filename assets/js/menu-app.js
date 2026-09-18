
(function(){
"use strict";

/* ============================================================
   CONSTANTS & TRANSLATIONS
============================================================ */
const APP_CONFIG = window.SADONYA_CONFIG || {};
document.title = `${(window.SADONYA_CONFIG && window.SADONYA_CONFIG.defaultName) || "Sadonya"} — Menu`;
const SUPABASE_URL = APP_CONFIG.supabaseUrl || "";
const SUPABASE_ANON_KEY = APP_CONFIG.supabasePublishableKey || "";
const supabaseClient = (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const MENU_ID = APP_CONFIG.menuId || "sadonya-cafe";
const STORAGE_BUCKET = APP_CONFIG.storageBucket || "sadonya-images";
const SETTINGS_TABLE = APP_CONFIG.settingsTable || "sadonya_cafe_settings";
const CATEGORIES_TABLE = APP_CONFIG.categoriesTable || "sadonya_cafe_categories";
const ITEMS_TABLE = APP_CONFIG.itemsTable || "sadonya_cafe_items";
 
const UI = {
  en:{ popular:"Popular", noItems:"No items in this category yet.", hours:"Opening Hours", contact:"Contact", follow:"Follow Us", location:"Location", scan:"Scan the QR code at your table to view this menu", currency:"IQD", lobbyTag:"Coffee • Food • Desserts", lobbyMenu:"Menu", lobbyHint:"Tap the button above to open the menu", search:"Search the menu…", noResults:"No matching items found.", results:"results", back:"Back" },
  ku:{ popular:"بەناوبانگ", noItems:"هێشتا هیچ شتێک لەم بەشەدا نییە.", hours:"کاتی کارکردن", contact:"پەیوەندی", follow:"شوێنمان بکەون", location:"شوێن", scan:"کۆدی QR لەسەر مێزەکەت سکان بکە بۆ بینینی مینیو", currency:"IQD", lobbyTag:"قاوە • خواردن • شیرینی", lobbyMenu:"مێنیۆ", lobbyHint:"بوتنەکەی سەوەوە داگرە بۆ کراوەكانی مێنیۆ", search:"گەڕان لە مێنیۆدا…", noResults:"هیچ ئەنجامێک نەدۆزرایەوە.", results:"ئەنجام", back:"گەڕانەوە" },
  ar:{ popular:"الأكثر طلبًا", noItems:"لا توجد عناصر في هذا القسم بعد.", hours:"ساعات العمل", contact:"تواصل معنا", follow:"تابعنا", location:"الموقع", scan:"امسح رمز QR الموجود على طاولتك لعرض القائمة", currency:"IQD", lobbyTag:"قهوة • أطعمة • حلويات", lobbyMenu:"منيو", lobbyHint:"اضغط على الزر لفتح القائمة", search:"ابحث في القائمة…", noResults:"لا توجد نتائج مطابقة.", results:"نتيجة", back:"رجوع" }
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
  name: "Sadonya",
  description: { en:"Coffee • Food • Desserts", ku:"قاوە • خواردن • شیرینی", ar:"قهوة • طعام • حلويات" },
  logo: "data:image/jpeg;base64,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",
  phone: "",
  instagram: "https://www.instagram.com/sadonya.1?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
  facebook: "https://www.facebook.com/share/1CnrcA5Mku/?mibextid=wwXIfr",
  snap: "",
  location: "",
  hours: "",
  publicUrl: (APP_CONFIG.publicUrl || "")
};
const DEFAULT_CATEGORIES = [
  { id:"coffee", name:{en:"Coffee",ku:"قاوە",ar:"قهوة"}, order:1, hidden:false },
  { id:"cold-drinks", name:{en:"Cold Drinks",ku:"خواردنەوە ساردەکان",ar:"المشروبات الباردة"}, order:2, hidden:false },
  { id:"desserts", name:{en:"Desserts",ku:"شیرینی",ar:"الحلويات"}, order:3, hidden:false }
];
 
const DEFAULT_ITEMS = [
  { id:"esp", categoryId:"coffee", order:1, price:3000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Espresso",ku:"ئێسپرێسۆ",ar:"إسبريسو"},
    description:{en:"Rich and concentrated shot of espresso.",ku:"شاتێکی چڕ و بەهێزی قاوە.",ar:"جرعة إسبريسو غنية ومركزة."} },
  { id:"amer", categoryId:"coffee", order:2, price:4000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Americano",ku:"ئەمریکانۆ",ar:"أمريكانو"},
    description:{en:"Espresso diluted with hot water.",ku:"ئێسپرێسۆ تێکەڵ بە ئاوی گەرم.",ar:"إسبريسو ممزوج بالماء الساخن."} },
  { id:"capp", categoryId:"coffee", order:3, price:5000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Cappuccino",ku:"کاپەچینۆ",ar:"كابتشينو"},
    description:{en:"Espresso topped with steamed milk foam.",ku:"ئێسپرێسۆ لەگەڵ کەفی شیری گەرمکراو.",ar:"إسبريسو مع رغوة حليب مبخر."} },
  { id:"span-latte", categoryId:"coffee", order:4, price:6000, available:true, hidden:false, popular:true, image:"",
    name:{en:"Spanish Latte",ku:"لاتێی ئیسپانی",ar:"لاتيه إسباني"},
    description:{en:"Creamy latte sweetened with condensed milk.",ku:"لاتێیەکی کرێمی و شیرین بە شیری کۆنسانتری.",ar:"لاتيه كريمي محلى بالحليب المكثف."} },
  { id:"caramel-mac", categoryId:"coffee", order:5, price:6000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Caramel Macchiato",ku:"کارامێل ماکیاتۆ",ar:"كراميل ماكياتو"},
    description:{en:"Espresso with vanilla, milk and caramel drizzle.",ku:"ئێسپرێسۆ لەگەڵ ڤانیلا، شیر و کارامێل.",ar:"إسبريسو مع الفانيليا والحليب وصوص الكراميل."} },
  { id:"iced-latte", categoryId:"cold-drinks", order:1, price:6000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Iced Latte",ku:"لاتێی سارد",ar:"لاتيه مثلج"},
    description:{en:"Chilled espresso and milk over ice.",ku:"ئێسپرێسۆ و شیری سارد لەسەر سەهۆڵ.",ar:"إسبريسو وحليب بارد على الثلج."} },
  { id:"iced-amer", categoryId:"cold-drinks", order:2, price:5000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Iced Americano",ku:"ئەمریکانۆی سارد",ar:"أمريكانو مثلج"},
    description:{en:"Espresso and cold water served over ice.",ku:"ئێسپرێسۆ و ئاوی سارد لەسەر سەهۆڵ.",ar:"إسبريسو وماء بارد يقدم على الثلج."} },
  { id:"mojito", categoryId:"cold-drinks", order:3, price:6000, available:true, hidden:false, popular:true, image:"",
    name:{en:"Mojito",ku:"مۆجیتۆ",ar:"موخيتو"},
    description:{en:"Refreshing mint and lime mocktail.",ku:"خواردنەوەیەکی ئارامبەخشی پونگ و لیمۆ.",ar:"مشروب منعش بالنعناع والليمون."} },
  { id:"cheesecake", categoryId:"desserts", order:1, price:7000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Cheesecake",ku:"چیزکەیک",ar:"تشيز كيك"},
    description:{en:"Classic creamy baked cheesecake.",ku:"چیزکەیکی کرێمی و کلاسیک.",ar:"تشيز كيك كلاسيكي كريمي."} },
  { id:"choc-cake", categoryId:"desserts", order:2, price:7000, available:true, hidden:false, popular:false, image:"",
    name:{en:"Chocolate Cake",ku:"کێیکی چۆکلێت",ar:"كيك الشوكولاتة"},
    description:{en:"Rich layered chocolate cake.",ku:"کێیکێکی چڕ و چینەیی لە چۆکلێت.",ar:"كيك شوكولاتة غني ومتعدد الطبقات."} },
  { id:"tiramisu", categoryId:"desserts", order:3, price:8000, available:true, hidden:false, popular:true, image:"",
    name:{en:"Tiramisu",ku:"تیرامیسو",ar:"تيراميسو"},
    description:{en:"Coffee-soaked layers with mascarpone cream.",ku:"چینەکانی تڕکردوو بە قاوە لەگەڵ کرێمی ماسکارپۆنی.",ar:"طبقات منقوعة بالقهوة مع كريمة الماسكاربوني."} }
];
 
/* ============================================================
   STATE
============================================================ */
const _urlLang = new URLSearchParams(location.search).get("lang");
const _savedLang = localStorage.getItem("sadonya_lang");
let state = {
  lang: ["en","ku","ar"].includes(_urlLang) ? _urlLang : (["en","ku","ar"].includes(_savedLang) ? _savedLang : "en"),
  settings: null,
  categories: null,
  items: null,
  activeCat: "popular",
  query: "",
  adminTab: "items",
  isAdminAuthed: false
};
 
/* ============================================================
   SUPABASE — BRANCH-ISOLATED DATA + STORAGE
   Each HTML file points to its own tables and storage bucket.
============================================================ */
function isConfigured(){ return !!supabaseClient; }

function cloneDefaults(){
  state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
}

function mapSettings(row){
  if(!row) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  return {
    name: row.name || DEFAULT_SETTINGS.name,
    description: row.description || JSON.parse(JSON.stringify(DEFAULT_SETTINGS.description)),
    logo: row.logo_url || "",
    phone: row.phone || "",
    instagram: row.instagram || "",
    facebook: row.facebook || "",
    snap: row.snap || "",
    location: row.location || "",
    hours: row.hours || "",
    publicUrl: row.public_url || (location.origin + location.pathname)
  };
}
function mapCategory(row){
  return { id:row.id, name:row.name || {en:"",ku:"",ar:""}, order:Number(row.order_no||0), hidden:!!row.hidden };
}
function mapItem(row){
  return {
    id:row.id, categoryId:row.category_id, order:Number(row.order_no||0), price:Number(row.price||0),
    available:row.available !== false, hidden:!!row.hidden, popular:!!row.popular,
    image:row.image_url || "", name:row.name || {en:"",ku:"",ar:""},
    description:row.description || {en:"",ku:"",ar:""}
  };
}

async function loadAll(){
  if(!supabaseClient){ cloneDefaults(); return; }
  const [settingsRes, catsRes, itemsRes] = await Promise.all([
    supabaseClient.from(SETTINGS_TABLE).select("*").eq("id", MENU_ID).maybeSingle(),
    supabaseClient.from(CATEGORIES_TABLE).select("*").order("order_no", {ascending:true}),
    supabaseClient.from(ITEMS_TABLE).select("*").order("order_no", {ascending:true})
  ]);
  if(settingsRes.error) console.error(settingsRes.error);
  if(catsRes.error) console.error(catsRes.error);
  if(itemsRes.error) console.error(itemsRes.error);
  state.settings = mapSettings(settingsRes.data);
  state.categories = (catsRes.data || []).map(mapCategory);
  state.items = (itemsRes.data || []).map(mapItem);
  // Empty branch tables use the built-in demo content until the owner saves real data.
  if(!state.categories.length) state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  if(!state.items.length) state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  if(!state.settings.publicUrl || state.settings.publicUrl.includes("yourdomain.com")){
    state.settings.publicUrl = location.origin + location.pathname;
  }
}

async function persistSettings(){
  if(!supabaseClient){ alert("Supabase is not configured yet."); return false; }
  const s = state.settings;
  const { error } = await supabaseClient.from(SETTINGS_TABLE).upsert({
    id:MENU_ID, name:s.name, description:s.description, logo_url:s.logo || null,
    phone:s.phone || null, instagram:s.instagram || null, facebook:s.facebook || null,
    snap:s.snap || null, location:s.location || null, hours:s.hours || null,
    public_url:s.publicUrl || null, updated_at:new Date().toISOString()
  });
  if(error){ console.error(error); alert("Could not save settings: " + error.message); return false; }
  return true;
}

async function persistCategories(){
  if(!supabaseClient){ alert("Supabase is not configured yet."); return false; }
  const table = CATEGORIES_TABLE;
  const now = new Date().toISOString();

  // Upsert first so item foreign keys always have valid categories.
  const rows = (state.categories || []).map(c=>({
    id:String(c.id),
    name:c.name,
    order_no:Number(c.order||0),
    hidden:!!c.hidden,
    updated_at:now
  }));

  if(rows.length){
    const { error } = await supabaseClient.from(table).upsert(rows, { onConflict:"id" });
    if(error){ console.error(error); alert("Could not save categories: " + error.message); return false; }
  }

  // Remove categories that no longer exist in the editor.
  const keepIds = new Set((state.categories || []).map(c=>String(c.id)));
  const { data: existing, error:existingError } = await supabaseClient.from(table).select("id");
  if(existingError){ console.error(existingError); alert("Could not check categories: " + existingError.message); return false; }

  const removed = (existing || []).map(r=>r.id).filter(id=>!keepIds.has(String(id)));
  if(removed.length){
    const { error } = await supabaseClient.from(table).delete().in("id", removed);
    if(error){ console.error(error); alert("Could not remove old categories: " + error.message); return false; }
  }

  return true;
}

async function ensureCategoriesForItems(){
  if(!supabaseClient) return false;
  const needed = [...new Set((state.items || []).map(i=>i.categoryId).filter(Boolean).map(String))];
  if(!needed.length) return true;

  const known = new Set((state.categories || []).map(c=>String(c.id)));
  const missing = needed.filter(id=>!known.has(id));

  // If an old/local item points to a category that is not in state,
  // create a safe placeholder category so the FK can never fail.
  if(missing.length){
    missing.forEach((id, idx)=>{
      state.categories.push({
        id,
        name:{en:"Uncategorized", ku:"بێ پۆل", ar:"غير مصنف"},
        order: state.categories.length + idx + 1,
        hidden:false
      });
    });
  }

  const rows = state.categories
    .filter(c=>needed.includes(String(c.id)))
    .map(c=>({
      id:String(c.id),
      name:c.name,
      order_no:Number(c.order||0),
      hidden:!!c.hidden,
      updated_at:new Date().toISOString()
    }));

  if(rows.length){
    const { error } = await supabaseClient.from(CATEGORIES_TABLE).upsert(rows, { onConflict:"id" });
    if(error){ console.error(error); alert("Could not prepare categories: " + error.message); return false; }
  }
  return true;
}

async function persistItems(){
  if(!supabaseClient){ alert("Supabase is not configured yet."); return false; }

  // IMPORTANT: categories must exist before item rows because of the FK.
  if(!(await ensureCategoriesForItems())) return false;

  const rows = (state.items || []).map(i=>({
    id:String(i.id),
    category_id:i.categoryId ? String(i.categoryId) : null,
    name:i.name,
    description:i.description || {},
    price:Number(i.price||0),
    order_no:Number(i.order||0),
    available:i.available !== false,
    hidden:!!i.hidden,
    popular:!!i.popular,
    image_url:i.image || null,
    updated_at:new Date().toISOString()
  }));

  // The RPC performs the delete/upsert as one database transaction.
  // If validation, RLS, FK checks, or the upsert fails, PostgreSQL rolls
  // the whole operation back instead of leaving the menu partially saved.
  const rpcName = MENU_ID === "sadonya-plus"
    ? "save_sadonya_plus_items"
    : "save_sadonya_cafe_items";
  const { error } = await supabaseClient.rpc(rpcName, { p_rows: rows });
  if(error){
    console.error(error);
    alert("Could not save items: " + error.message);
    return false;
  }
  return true;
}

async function uploadDataUrl(dataUrl, folder, filename){
  if(!supabaseClient || !dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `${folder}/${filename}.jpg`;
  const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, blob, {
    contentType:"image/jpeg", upsert:true, cacheControl:"31536000"
  });
  if(error) throw error;
    const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function requireAuth(){
  if(!supabaseClient) return false;
  const { data } = await supabaseClient.auth.getSession();
  if(!data.session){ state.isAdminAuthed=false; return false; }
  // A valid Supabase account is not enough: it must belong to THIS branch.
  const { data:access, error } = await supabaseClient
    .from("branch_access")
    .select("branch_key")
    .eq("user_id", data.session.user.id)
    .eq("branch_key", MENU_ID)
    .maybeSingle();
  if(error){ console.error(error); state.isAdminAuthed=false; return false; }
  state.isAdminAuthed = !!access;
  if(!access) await supabaseClient.auth.signOut();
  return state.isAdminAuthed;
}

/* ============================================================
   UTIL
============================================================ */
function uid(prefix){ return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmtPrice(n){ return Number(n||0).toLocaleString() + " " + UI[state.lang].currency; }
 
/*
 * Resize + compress every uploaded image BEFORE it is sent to Supabase.
 * maxSize is the longest side in pixels. Images are always converted to JPEG.
 */
function resizeImage(file, maxSize = 1200, quality = 0.78){
  return new Promise((resolve, reject)=>{
    if(!file || !file.type.startsWith("image/")){
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = e =>{
      const img = new Image();
      img.onload = ()=>{
        try{
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          const scale = Math.min(1, maxSize / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d", {alpha:false});
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);

          // JPEG compression happens here, before the image is uploaded.
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          if(!dataUrl || dataUrl === "data:,"){
            reject(new Error("Could not process the selected image."));
            return;
          }
          resolve(dataUrl);
        }catch(err){
          reject(err);
        }
      };
      img.onerror = ()=> reject(new Error("Could not read the selected image."));
      img.src = e.target.result;
    };
    reader.onerror = ()=> reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}
 
const ICON_CUP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h13a3 3 0 0 1 0 6h-1M4 8v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M4 8V6M9 3v2M13 3v2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6L22 9.6l-5 4.9 1.2 7-6.2-3.6L5.8 21.5 7 14.5l-5-4.9 7.1-1z"/></svg>`;
 
/* ============================================================
   ROUTER (menu page — no lobby)
============================================================ */
function handleRoute(){
  const hash = location.hash;
  if(hash.startsWith("#admin")){
    document.getElementById("customerView").style.display = "none";
    document.getElementById("adminView").style.display = "block";
    if(state.isAdminAuthed){ showAdminDashboard(); } else { showAdminLogin(); }
    return;
  }
  document.getElementById("adminView").style.display = "none";
  document.getElementById("customerView").style.display = "block";
  renderCustomer();
}
window.addEventListener("hashchange", handleRoute);

 
/* ============================================================
   SEARCH
============================================================ */
let _searchDebounce;
document.getElementById("searchInput").addEventListener("input", e=>{
  state.query = e.target.value;
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(renderCustomer, 150);
});
document.getElementById("searchClear").addEventListener("click", ()=>{
  state.query = "";
  document.getElementById("searchInput").value = "";
  renderCustomer();
  document.getElementById("searchInput").focus();
});
 
/* ============================================================
   LANGUAGE
============================================================ */
let languageTransitionTimer = null;
function setLang(lang){
  if(!lang || lang === state.lang) return;
  localStorage.setItem("sadonya_lang", lang);

  const customer = document.getElementById("customerView");
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fade the current language out first. This prevents the text, direction,
  // and layout from changing abruptly in the same frame.
  if(reducedMotion){
    state.lang = lang;
    const dir = (lang === "en") ? "ltr" : "rtl";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    renderCustomer();
    return;
  }

  clearTimeout(languageTransitionTimer);
  customer.classList.remove("language-entering");
  customer.classList.add("language-transitioning");

  languageTransitionTimer = setTimeout(()=>{
    state.lang = lang;
    const dir = (lang === "en") ? "ltr" : "rtl";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    renderCustomer();

    // Let the browser paint the new language while hidden, then animate it in.
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        customer.classList.remove("language-transitioning");
        customer.classList.add("language-entering");
        setTimeout(()=>customer.classList.remove("language-entering"), 500);
      });
    });
  }, 190);
}
 
function socialUrl(v, kind){
  const val = (v || "").trim();
  if(!val) return "";
  if(/^https?:\/\//i.test(val)) return val;
  const host = (kind === "instagram") ? "instagram.com/" : (kind === "snapchat") ? "snapchat.com/add/" : "facebook.com/";
  return "https://" + host + val.replace(/^@/, "");
}
function mapsEmbedUrl(loc, cafeName){
  const val = (loc || "").trim();
  if(!val) return "";
  const at = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if(at) return "https://maps.google.com/maps?q=" + at[1] + "," + at[2] + "&z=16&output=embed";
  const q = val.match(/[?&]q=([^&]+)/);
  if(q) return "https://maps.google.com/maps?q=" + q[1] + "&output=embed";
  if(/maps\.app\.goo\.gl|goo\.gl/i.test(val)){
    // short links can't be read in the browser; search for the cafe name instead
    const name = (cafeName || (APP_CONFIG.defaultName || "Sadonya Cafe")).trim();
    return "https://maps.google.com/maps?q=" + encodeURIComponent(name) + "&z=16&output=embed";
  }
  if(/^https?:\/\//i.test(val)) return "https://maps.google.com/maps?q=" + encodeURIComponent(cafeName || "") + "&z=16&output=embed";
  return "https://maps.google.com/maps?q=" + encodeURIComponent(val) + "&output=embed";
}
const ICON_CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" stroke-linecap="round"/></svg>`;
const ICON_INSTAGRAM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>`;
const ICON_FACEBOOK = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>`;
const ICON_SNAPCHAT = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a6.1 6.1 0 0 1 6.06 6.16c0 .48-.03 1.02-.05 1.5.36.16.74.1 1.1-.05.4-.16.88-.08 1.06.32.19.4-.06.82-.46 1.03-.63.33-1.7.5-1.95 1.24-.1.3-.02.66.1.98.5 1.32 1.5 2.44 2.86 2.93.36.13.6.47.44.83-.2.44-.87.99-2.24 1.19-.16.02-.28.28-.35.55-.06.24-.14.5-.35.28-.3-.3-.87-.37-1.44-.26-.6.11-1.1.5-1.7.5-.9 0-1.4-.4-2.16-.4s-1.26.4-2.16.4c-.6 0-1.1-.39-1.44-.5-.57-.11-1.14-.04-1.44.26-.2.22-.29-.02-.35-.26-.07-.27-.19-.53-.35-.55-1.37-.2-2.04-.75-2.24-.95-.16-.36.08-.7.44-.83 1.36-.49 2.36-1.61 2.86-2.93.12-.3.2-.6.05-.83-.25-.4-.9-.4-1.35-.63-.4-.2-.65-.63-.46-1.03.18-.4.67-.48 1.06-.33.36.15.74.21 1.1.05-.02-.48-.05-1.02-.05-1.5A6.1 6.1 0 0 1 12 2z"/></svg>`;
 
/* ============================================================
   CUSTOMER RENDER
============================================================ */
function normalizeSearch(v){
  return (v||"").toString().toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,"")
    .replace(/[أإآٱ]/g,"ا").replace(/[ةۀ]/g,"ه").replace(/[یيىێ]/g,"ی")
    .replace(/[كک]/g,"ک").replace(/[ؤو]/g,"و").replace(/[ڕ]/g,"ر").replace(/[ڵ]/g,"ل")
    .replace(/\s+/g," ").trim();
}
function itemMatchesQuery(item, q){
  if(!q) return true;
  const fields = [item.name, item.description];
  return fields.some(f=>{
    if(!f) return false;
    const vals = (typeof f === "string") ? [f] : Object.values(f);
    return vals.some(v=> normalizeSearch(v).includes(q));
  });
}
 
function renderCustomer(){
  const lang = state.lang;
  const s = state.settings;
 
  // Persistent customer feedback action beneath Back, matching the menu's gold controls.
  // Both buttons live in a shared flex column so the gap between them stays
  // consistent no matter how long the translated "Back" label is.
  let feedbackBtn = document.getElementById("openFeedbackBtn");
  if (!feedbackBtn) {
    const header = document.querySelector(".site-header");
    const backBtnEl = document.getElementById("backToLobbyBtn");
    let actions = header.querySelector(".header-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "header-actions";
      if (backBtnEl) {
        backBtnEl.parentNode.insertBefore(actions, backBtnEl);
        actions.appendChild(backBtnEl);
      } else {
        header.appendChild(actions);
      }
    }
    feedbackBtn = document.createElement("button");
    feedbackBtn.id = "openFeedbackBtn"; feedbackBtn.type = "button";
    feedbackBtn.className = "menu-feedback-btn";
    feedbackBtn.innerHTML = '<span aria-hidden="true">★</span><span id="feedbackButtonText">Feedback</span>';
    actions.appendChild(feedbackBtn);
    feedbackBtn.addEventListener("click", openFeedbackForm);
  }
  const feedbackText = document.getElementById("feedbackButtonText");
  if (feedbackText) feedbackText.textContent = ({en:"Feedback",ku:"ڕەخنە و پێشنیار",ar:"ملاحظاتك"})[lang] || "Feedback";

  // header
  document.getElementById("cafeNameEl").textContent = s.name || (APP_CONFIG.defaultName || "Sadonya Cafe");
  document.getElementById("cafeDescEl").textContent = tr(s.description, lang);
  const logoWrap = document.getElementById("logoWrap");
  logoWrap.innerHTML = s.logo ? `<img src="${s.logo}" alt="logo">` : `<svg viewBox="0 0 24 24" fill="none" stroke="#141210" stroke-width="1.6"><path d="M4 8h13a3 3 0 0 1 0 6h-1M4 8v6a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8M4 8V6M9 3v2M13 3v2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 
  const backBtn = document.getElementById("backToLobbyText");
  if(backBtn) backBtn.textContent = UI[lang].back || "Back";

  // language switch
  const langs = [["en","English"],["ku","کوردی"],["ar","العربية"]];
  document.getElementById("langSwitch").innerHTML = langs.map(([code,label])=>
    `<button data-lang="${code}" class="${state.lang===code?'active':''}">${label}</button>`
  ).join("");
  document.querySelectorAll("#langSwitch button").forEach(btn=>{
    btn.onclick = ()=> setLang(btn.dataset.lang);
  });
 
  // categories (visible only, sorted) -> build ordered list of sections (Popular first, if any)
  const visibleCats = state.categories.filter(c=>!c.hidden).sort((a,b)=>a.order-b.order);
  const q = normalizeSearch(state.query);
  const shown = i=> i.available && !i.hidden && itemMatchesQuery(i, q);
  const hasPopular = !q && state.items.some(i=>i.popular && i.available && !i.hidden);
  let sections = [];
  if(hasPopular) sections.push({ id:"popular", label: UI[lang].popular,
    items: state.items.filter(i=>i.popular && shown(i)).sort((a,b)=>(a.order||0)-(b.order||0)) });
  visibleCats.forEach(c=> sections.push({ id:c.id, label: tr(c.name, lang),
    items: state.items.filter(i=>i.categoryId===c.id && shown(i)).sort((a,b)=>(a.order||0)-(b.order||0)) }));
  if(q) sections = sections.filter(sec=> sec.items.length > 0);
 
  // search bar (labels + result count + visibility of category nav)
  const searchInput = document.getElementById("searchInput");
  searchInput.placeholder = UI[lang].search;
  searchInput.dir = (lang === "en") ? "ltr" : "rtl";
  document.getElementById("searchClear").style.display = state.query ? "flex" : "none";
  document.querySelector(".cat-nav-wrap").style.display = q ? "none" : "";
  const matchCount = sections.reduce((n,sec)=> n + (sec.id === "popular" ? 0 : sec.items.length), 0);
  let countEl = document.getElementById("searchCount");
  if(!countEl){
    countEl = document.createElement("div");
    countEl.id = "searchCount";
    countEl.className = "search-count";
    document.querySelector(".search-wrap").appendChild(countEl);
  }
  countEl.textContent = q ? `${matchCount} ${UI[lang].results}` : "";
 
  // nav pills
  document.getElementById("catNav").innerHTML = sections.map((sec,i)=>`
    <button class="cat-pill ${i===0?'active':''}" data-cat="${sec.id}">
      ${escapeHtml(sec.label)}
      <svg class="stroke" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M2 6 Q 25 2, 50 6 T 98 5" stroke="var(--gold)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
    </button>
  `).join("");
 
  // stacked sections
  const wrap = document.getElementById("menuSections");
  if(sections.length === 0){
    wrap.innerHTML = `<div class="empty-note">${q ? UI[lang].noResults : UI[lang].noItems}</div>`;
  } else {
    wrap.innerHTML = sections.map(sec=>`
      <section class="menu-section" id="sec-${sec.id}" data-cat="${sec.id}">
        <div class="section-label">${escapeHtml(sec.label)}</div>
        ${sec.items.length === 0
          ? `<div class="empty-note">${UI[lang].noItems}</div>`
          : `<div class="item-grid">${sec.items.map(item=>`
              <div class="item-card">
                                ${item.image ? `<img class="item-img" src="${item.image}" alt="${escapeHtml(tr(item.name,lang))}" loading="lazy" decoding="async">`
                              : `<div class="item-img-placeholder">${ICON_CUP.replace('currentColor', '#FFC72C')}</div>`}
                <div class="item-body">
                  <div class="item-top">
                    <h3 class="item-name">${escapeHtml(tr(item.name, lang))}</h3>
                    ${item.popular ? `<span class="badge-popular">${ICON_STAR}${UI[lang].popular}</span>` : ""}
                  </div>
                  <p class="item-desc">${escapeHtml(tr(item.description, lang))}</p>
                  <div class="item-price">${fmtPrice(item.price)}</div>
                </div>
              </div>`).join("")}</div>`
        }
      </section>
    `).join("");
  }
 
  // click a pill -> smooth scroll to that section
  document.querySelectorAll(".cat-pill").forEach(btn=>{
    btn.onclick = ()=>{
      const target = document.getElementById("sec-" + btn.dataset.cat);
      if(target){
        const navHeight = document.querySelector(".cat-nav-wrap").offsetHeight;
        const y = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };
  });
 
  // scroll-spy -> highlight the pill for whichever section is in view
  if(window._menuScrollObserver) window._menuScrollObserver.disconnect();
  const navHeightPx = document.querySelector(".cat-nav-wrap").offsetHeight;
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.dataset.cat;
        document.querySelectorAll(".cat-pill").forEach(p=> p.classList.toggle("active", p.dataset.cat === id));
        const activePill = document.querySelector(`.cat-pill[data-cat="${id}"]`);
        if(activePill) activePill.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
      }
    });
  }, { rootMargin: `-${navHeightPx + 10}px 0px -70% 0px`, threshold: 0 });
  document.querySelectorAll(".menu-section").forEach(sec=> observer.observe(sec));
  window._menuScrollObserver = observer;
 
  // footer
  const contactParts = [];
  if(s.phone) contactParts.push(`<div class="footer-row">${UI[lang].contact}: <span class="ltr-iso">${escapeHtml(s.phone)}</span></div>`);
  if(s.location) contactParts.push(`<div class="footer-row">${UI[lang].location}: ${escapeHtml(s.location)}</div>`);
  const socialParts = [];
  if(s.instagram) socialParts.push(`<a class="social-link" href="${escapeHtml(socialUrl(s.instagram,"instagram"))}" target="_blank" rel="noopener">${ICON_INSTAGRAM}<span>Instagram</span></a>`);
  if(s.facebook) socialParts.push(`<a class="social-link" href="${escapeHtml(socialUrl(s.facebook,"facebook"))}" target="_blank" rel="noopener">${ICON_FACEBOOK}<span>Facebook</span></a>`);
  if(s.snap) socialParts.push(`<a class="social-link" href="${escapeHtml(socialUrl(s.snap,"snapchat"))}" target="_blank" rel="noopener">${ICON_SNAPCHAT}<span>Snapchat</span></a>`);
  document.getElementById("footerContact").innerHTML = contactParts.join("") + (socialParts.length ? `<div class="social-row">${socialParts.join("")}</div>` : "");
  const hoursCard = document.getElementById("footerHoursCard");
  if(s.hours){
    hoursCard.style.display = "block";
    document.getElementById("hoursClock").innerHTML = ICON_CLOCK;
    document.getElementById("hoursTitleTxt").textContent = UI[lang].hours;
    document.getElementById("hoursBody").textContent = s.hours;
    document.getElementById("hoursBody").classList.add("ltr-iso");
    document.getElementById("hoursBody").style.display = "block";
  } else hoursCard.style.display = "none";
  const embed = mapsEmbedUrl(s.location, s.name);
  document.getElementById("footerMap").innerHTML = embed ? `<iframe class="map-embed" src="${embed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="${UI[lang].location}"></iframe>` : "";
  document.getElementById("footerScan").textContent = UI[lang].scan;
}
 
/* ============================================================
   ADMIN — AUTH (Supabase Auth)
============================================================ */
function showAdminLogin(){
  document.getElementById("adminLogin").style.display = "flex";
  document.getElementById("adminDashboard").style.display = "none";
}
function showAdminDashboard(){
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminDashboard").style.display = "block";
  renderAdminTabs();
}
document.getElementById("adminLoginBtn").addEventListener("click", async ()=>{
  const email = document.getElementById("adminEmailInput").value.trim();
  const password = document.getElementById("adminPassInput").value;
  if(!supabaseClient){ document.getElementById("loginError").textContent = "Supabase is not configured. Add the URL and anon key first."; document.getElementById("loginError").style.display = "block"; return; }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error){ document.getElementById("loginError").textContent = error.message; document.getElementById("loginError").style.display = "block"; return; }
  const { data:access, error:accessError } = await supabaseClient
    .from("branch_access").select("branch_key").eq("user_id", data.user.id).eq("branch_key", MENU_ID).maybeSingle();
  if(accessError || !access){
    await supabaseClient.auth.signOut();
    state.isAdminAuthed = false;
    document.getElementById("loginError").textContent = "This account is not authorized for this branch.";
    document.getElementById("loginError").style.display = "block";
    return;
  }
  state.isAdminAuthed = true;
  document.getElementById("loginError").style.display = "none";
  showAdminDashboard();
});
document.getElementById("adminPassInput").addEventListener("keydown", e=>{ if(e.key === "Enter") document.getElementById("adminLoginBtn").click(); });
document.getElementById("backToMenuLink").addEventListener("click", e=>{ e.preventDefault(); location.hash = ""; });
document.getElementById("logoutBtn").addEventListener("click", async ()=>{ if(supabaseClient) await supabaseClient.auth.signOut(); state.isAdminAuthed = false; location.hash=""; });
 
/* ============================================================
   ADMIN — TABS
============================================================ */
document.getElementById("adminTabs").addEventListener("click", e=>{
  const btn = e.target.closest(".tab-btn");
  if(!btn) return;
  state.adminTab = btn.dataset.tab;
  renderAdminTabs();
});
 
function renderAdminTabs(){
  document.querySelectorAll(".tab-btn").forEach(b=> b.classList.toggle("active", b.dataset.tab === state.adminTab));
  const el = document.getElementById("tabContent");
  if(state.adminTab === "items") renderItemsTab(el);
  else if(state.adminTab === "categories") renderCategoriesTab(el);
  else if(state.adminTab === "settings") renderSettingsTab(el);
  else if(state.adminTab === "qr") renderQrTab(el);
  else if(state.adminTab === "feedback") renderFeedbackTab(el);
}
 
/* ---------------- CATEGORIES TAB ---------------- */
function renderCategoriesTab(el){
  const cats = [...state.categories].sort((a,b)=>a.order-b.order);
  el.innerHTML = `
    <div class="toolbar"><button class="btn btn-gold btn-sm" id="addCatBtn">+ Add Category</button></div>
    ${cats.map((c,idx)=>`
      <div class="admin-card row-between" data-id="${c.id}">
        <div>
          <div style="font-weight:700;">${escapeHtml(c.name.en)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(c.name.ku||"")} · ${escapeHtml(c.name.ar||"")}</div>
        </div>
        <div class="row-between" style="gap:14px;">
          <label class="pill-toggle"><span class="switch"><input type="checkbox" class="cat-visible" ${!c.hidden?'checked':''}><span class="slider"></span></span>Visible</label>
          <div class="mini-btns">
            <button class="icon-btn cat-up" ${idx===0?'disabled':''} title="Move up">↑</button>
            <button class="icon-btn cat-down" ${idx===cats.length-1?'disabled':''} title="Move down">↓</button>
            <button class="icon-btn cat-edit" title="Edit">✎</button>
            <button class="icon-btn cat-del" title="Delete">✕</button>
          </div>
        </div>
      </div>
    `).join("")}
  `;
  document.getElementById("addCatBtn").onclick = ()=> openCategoryModal(null);
  el.querySelectorAll(".admin-card").forEach(card=>{
    const id = card.dataset.id;
    const cat = state.categories.find(c=>c.id===id);
    card.querySelector(".cat-visible").onchange = e=>{ cat.hidden = !e.target.checked; persistCategories(); };
    card.querySelector(".cat-edit").onclick = ()=> openCategoryModal(cat);
    card.querySelector(".cat-del").onclick = async ()=>{
      if(confirm(`Delete category "${cat.name.en}"? Items inside it will become uncategorized until reassigned.`)){
        state.categories = state.categories.filter(c=>c.id!==id);
        state.items.forEach(i=>{ if(i.categoryId===id) i.categoryId = null; });
        if(await persistCategories()) await persistItems();
        renderCategoriesTab(el);
      }
    };
    const upBtn = card.querySelector(".cat-up"), downBtn = card.querySelector(".cat-down");
    if(upBtn) upBtn.onclick = ()=> swapOrder(state.categories, cat, -1, persistCategories, ()=>renderCategoriesTab(el));
    if(downBtn) downBtn.onclick = ()=> swapOrder(state.categories, cat, 1, persistCategories, ()=>renderCategoriesTab(el));
  });
}
 
function swapOrder(list, item, dir, persistFn, rerenderFn){
  const sameCat = item.categoryId !== undefined;
  let sorted = [...list].sort((a,b)=>(a.order||0)-(b.order||0));
  if(sameCat) sorted = sorted.filter(x=>x.categoryId === item.categoryId);
  const idx = sorted.findIndex(x=>x.id===item.id);
  const swapIdx = idx + dir;
  if(swapIdx < 0 || swapIdx >= sorted.length) return;
  const tmp = sorted[idx].order;
  sorted[idx].order = sorted[swapIdx].order;
  sorted[swapIdx].order = tmp;
  persistFn(); rerenderFn();
}
 
function openCategoryModal(cat){
  const isNew = !cat;
  const draft = cat ? JSON.parse(JSON.stringify(cat)) : { id: uid("cat"), name:{en:"",ku:"",ar:""}, order: state.categories.length+1, hidden:false };
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>${isNew ? "Add Category" : "Edit Category"}</h3>
      <div class="field"><label>Name (English)</label><input id="mCatEn" value="${escapeHtml(draft.name.en)}"></div>
      <div class="field"><label>Name (Kurdish)</label><input id="mCatKu" value="${escapeHtml(draft.name.ku)}" dir="rtl"></div>
      <div class="field"><label>Name (Arabic)</label><input id="mCatAr" value="${escapeHtml(draft.name.ar)}" dir="rtl"></div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="mCatCancel">Cancel</button>
        <button class="btn btn-primary" id="mCatSave">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#mCatCancel").onclick = ()=> overlay.remove();
  overlay.onclick = e=>{ if(e.target===overlay) overlay.remove(); };
  overlay.querySelector("#mCatSave").onclick = async ()=>{
    const en = overlay.querySelector("#mCatEn").value.trim();
    if(!en){ alert("English name is required."); return; }
    draft.name.en = en;
    draft.name.ku = overlay.querySelector("#mCatKu").value.trim();
    draft.name.ar = overlay.querySelector("#mCatAr").value.trim();
    if(isNew) state.categories.push(draft);
    else Object.assign(cat, draft);
    const saveBtn = overlay.querySelector("#mCatSave");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    if(await persistCategories()){
      overlay.remove();
      renderAdminTabs();
    }else{
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  };
}
 
/* ---------------- ITEMS TAB ---------------- */
function renderItemsTab(el){
  const cats = [...state.categories].sort((a,b)=>a.order-b.order);
  const filterId = el.dataset.filter || "all";
  el.innerHTML = `
    <div class="toolbar">
      <button class="btn btn-gold btn-sm" id="addItemBtn">+ Add Item</button>
      <select class="cat-filter" id="itemFilter">
        <option value="all">All categories</option>
        ${cats.map(c=>`<option value="${c.id}" ${filterId===c.id?'selected':''}>${escapeHtml(c.name.en)}</option>`).join("")}
      </select>
    </div>
    <div id="itemsList"></div>
  `;
  function drawList(){
    const filter = document.getElementById("itemFilter").value;
    const items = state.items.filter(i=> filter==="all" || i.categoryId===filter).sort((a,b)=>(a.order||0)-(b.order||0));
    document.getElementById("itemsList").innerHTML = items.map(item=>{
      const cat = state.categories.find(c=>c.id===item.categoryId);
      return `
      <div class="admin-card" data-id="${item.id}">
        <div class="row-between">
          <div class="item-row">
            ${item.image ? `<img class="thumb" src="${item.image}">` : `<div class="thumb-placeholder">${ICON_CUP.replace('currentColor','#8A7B6C')}</div>`}
            <div class="item-row-info">
              <div class="n">${escapeHtml(item.name.en)} ${item.popular?'⭐':''}</div>
              <div class="p">${cat?escapeHtml(cat.name.en):'Uncategorized'} · ${fmtPrice(item.price)}</div>
            </div>
          </div>
          <div class="mini-btns">
            <button class="icon-btn it-up" title="Move up">↑</button>
            <button class="icon-btn it-down" title="Move down">↓</button>
            <button class="icon-btn it-edit" title="Edit">✎</button>
            <button class="icon-btn it-del" title="Delete">✕</button>
          </div>
        </div>
        <div class="row-between" style="margin-top:10px;">
          <label class="pill-toggle"><span class="switch"><input type="checkbox" class="it-avail" ${item.available?'checked':''}><span class="slider"></span></span>Available</label>
          <label class="pill-toggle"><span class="switch"><input type="checkbox" class="it-pop" ${item.popular?'checked':''}><span class="slider"></span></span>Popular</label>
          <label class="pill-toggle"><span class="switch"><input type="checkbox" class="it-hidden" ${!item.hidden?'checked':''}><span class="slider"></span></span>Visible</label>
        </div>
      </div>`;
    }).join("") || `<p style="color:var(--text-muted);font-size:13px;">No items in this category yet.</p>`;
 
    document.querySelectorAll("#itemsList .admin-card").forEach(card=>{
      const id = card.dataset.id;
      const item = state.items.find(i=>i.id===id);
      card.querySelector(".it-avail").onchange = e=>{ item.available = e.target.checked; persistItems(); };
      card.querySelector(".it-pop").onchange = e=>{ item.popular = e.target.checked; persistItems(); };
      card.querySelector(".it-hidden").onchange = e=>{ item.hidden = !e.target.checked; persistItems(); };
      card.querySelector(".it-up").onclick = ()=> swapOrder(state.items, item, -1, persistItems, ()=>drawList());
      card.querySelector(".it-down").onclick = ()=> swapOrder(state.items, item, 1, persistItems, ()=>drawList());
      card.querySelector(".it-edit").onclick = ()=> openItemModal(item);
      card.querySelector(".it-del").onclick = ()=>{
        if(confirm(`Delete "${item.name.en}"?`)){
          state.items = state.items.filter(i=>i.id!==id);
          persistItems(); drawList();
        }
      };
    });
  }
  document.getElementById("addItemBtn").onclick = ()=> openItemModal(null);
  document.getElementById("itemFilter").onchange = drawList;
  drawList();
}
 
function openItemModal(item){
  const isNew = !item;
  const draft = item ? JSON.parse(JSON.stringify(item)) : {
    id: uid("item"), categoryId: state.categories[0] ? state.categories[0].id : "",
    order: state.items.length+1, price:0, available:true, hidden:false, popular:false, image:"",
    name:{en:"",ku:"",ar:""}, description:{en:"",ku:"",ar:""}
  };
  let activeLangTab = "en";
  const cats = [...state.categories].sort((a,b)=>a.order-b.order);
 
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>${isNew ? "Add Menu Item" : "Edit Menu Item"}</h3>
 
      <div class="img-upload-box">
        <img id="mImgPreview" class="img-preview" src="${draft.image || ''}" style="${draft.image?'':'display:none;'}">
        <input type="file" id="mImgFile" accept="image/*" style="display:none;">
        <button class="btn btn-outline btn-sm" id="mImgPick" type="button">Upload Image</button>
        <button class="btn btn-danger btn-sm" id="mImgRemove" type="button" style="${draft.image?'':'display:none;'} margin-left:6px;">Remove</button>
      </div>
 
      <div class="field" style="margin-top:14px;"><label>Category</label>
        <select id="mItemCat">${cats.map(c=>`<option value="${c.id}" ${draft.categoryId===c.id?'selected':''}>${escapeHtml(c.name.en)}</option>`).join("")}</select>
      </div>
 
      <div class="lang-tabs">
        <button class="lang-tab active" data-l="en" type="button">English</button>
        <button class="lang-tab" data-l="ku" type="button">Kurdish</button>
        <button class="lang-tab" data-l="ar" type="button">Arabic</button>
      </div>
      <div class="field"><label>Name</label><input id="mItemName" value="${escapeHtml(draft.name.en)}"></div>
      <div class="field"><label>Description</label><textarea id="mItemDesc">${escapeHtml(draft.description.en)}</textarea></div>
 
      <div class="field"><label>Price (IQD)</label><input id="mItemPrice" type="number" min="0" step="250" value="${draft.price}"></div>
 
      <div class="grid-2">
        <label class="pill-toggle"><span class="switch"><input type="checkbox" id="mItemAvail" ${draft.available?'checked':''}><span class="slider"></span></span>Available</label>
        <label class="pill-toggle"><span class="switch"><input type="checkbox" id="mItemPop" ${draft.popular?'checked':''}><span class="slider"></span></span>Popular</label>
      </div>
 
      <div class="modal-actions">
        <button class="btn btn-outline" id="mItemCancel">Cancel</button>
        <button class="btn btn-primary" id="mItemSave">Save Item</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
 
  // keep an in-memory copy of the 3 languages while editing, save on tab switch
  const langDraft = JSON.parse(JSON.stringify({name:draft.name, description:draft.description}));
  function flushCurrentLang(){
    langDraft.name[activeLangTab] = overlay.querySelector("#mItemName").value;
    langDraft.description[activeLangTab] = overlay.querySelector("#mItemDesc").value;
  }
  function loadLang(l){
    overlay.querySelector("#mItemName").value = langDraft.name[l] || "";
    overlay.querySelector("#mItemDesc").value = langDraft.description[l] || "";
    overlay.querySelector("#mItemName").dir = (l==="en") ? "ltr" : "rtl";
    overlay.querySelector("#mItemDesc").dir = (l==="en") ? "ltr" : "rtl";
  }
  overlay.querySelectorAll(".lang-tab").forEach(tabBtn=>{
    tabBtn.onclick = ()=>{
      flushCurrentLang();
      activeLangTab = tabBtn.dataset.l;
      overlay.querySelectorAll(".lang-tab").forEach(b=>b.classList.toggle("active", b===tabBtn));
      loadLang(activeLangTab);
    };
  });
 
  overlay.querySelector("#mImgPick").onclick = ()=> overlay.querySelector("#mImgFile").click();
  overlay.querySelector("#mImgFile").onchange = async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const dataUrl = await resizeImage(file, 900, 0.78);
    draft.image = dataUrl;
    overlay.querySelector("#mImgPreview").src = dataUrl;
    overlay.querySelector("#mImgPreview").style.display = "block";
    overlay.querySelector("#mImgRemove").style.display = "inline-block";
  };
  overlay.querySelector("#mImgRemove").onclick = ()=>{
    draft.image = "";
    overlay.querySelector("#mImgPreview").style.display = "none";
    overlay.querySelector("#mImgRemove").style.display = "none";
  };
 
  overlay.querySelector("#mItemCancel").onclick = ()=> overlay.remove();
  overlay.onclick = e=>{ if(e.target===overlay) overlay.remove(); };
  overlay.querySelector("#mItemSave").onclick = async ()=>{
    flushCurrentLang();
    if(!langDraft.name.en.trim()){ alert("English name is required."); return; }
    draft.name = langDraft.name;
    draft.description = langDraft.description;
    draft.categoryId = overlay.querySelector("#mItemCat").value;
    draft.price = Number(overlay.querySelector("#mItemPrice").value) || 0;
    draft.available = overlay.querySelector("#mItemAvail").checked;
    draft.popular = overlay.querySelector("#mItemPop").checked;
    const btn = overlay.querySelector("#mItemSave"); btn.disabled = true; btn.textContent = "Saving…";
    try{
      if(draft.image && draft.image.startsWith("data:")) draft.image = await uploadDataUrl(draft.image, "items", draft.id);
      if(isNew) state.items.push(draft); else Object.assign(item, draft);
      if(!(await persistItems())) return;
      overlay.remove(); renderAdminTabs();
    }catch(err){ console.error(err); alert("Could not upload the image: " + err.message); btn.disabled=false; btn.textContent="Save Item"; }
  };
}
 
/* ---------------- SETTINGS TAB ---------------- */
function renderSettingsTab(el){
  const s = state.settings;
  el.innerHTML = `
    <div class="admin-card">
      <div class="img-upload-box">
        <img id="sLogoPreview" class="img-preview" style="max-width:120px;border-radius:50%;aspect-ratio:1/1;" src="${s.logo||''}" ${s.logo?'':'style="display:none;"'}>
        <input type="file" id="sLogoFile" accept="image/*" style="display:none;">
        <button class="btn btn-outline btn-sm" id="sLogoPick" type="button">Upload Logo</button>
        <button class="btn btn-danger btn-sm" id="sLogoRemove" type="button" style="${s.logo?'':'display:none;'} margin-left:6px;">Remove</button>
      </div>
    </div>
    <div class="admin-card">
      <div class="field"><label>Café Name</label><input id="sName" value="${escapeHtml(s.name)}"></div>
      <div class="lang-tabs">
        <button class="lang-tab active" data-l="en" type="button">English</button>
        <button class="lang-tab" data-l="ku" type="button">Kurdish</button>
        <button class="lang-tab" data-l="ar" type="button">Arabic</button>
      </div>
      <div class="field"><label>Description</label><input id="sDesc" value="${escapeHtml(s.description.en)}"></div>
    </div>
    <div class="admin-card">
      <div class="grid-2">
        <div class="field"><label>Phone</label><input id="sPhone" value="${escapeHtml(s.phone)}"></div>
        <div class="field"><label>Location (Google Maps link — shown as a live map at the bottom of the menu)</label><input id="sLocation" value="${escapeHtml(s.location)}" placeholder="https://maps.app.goo.gl/... or https://www.google.com/maps?q=..."></div>
        <div class="field"><label>Instagram</label><input id="sInstagram" value="${escapeHtml(s.instagram)}"></div>
        <div class="field"><label>Facebook</label><input id="sFacebook" value="${escapeHtml(s.facebook)}"></div>
        <div class="field"><label>Snapchat</label><input id="sSnap" value="${escapeHtml(s.snap||"")}" placeholder="handle or full link"></div>
      </div>
      <div class="field"><label>Opening Hours</label><textarea id="sHours">${escapeHtml(s.hours)}</textarea></div>
    </div>
    <button class="btn btn-primary" id="sSaveBtn">Save Settings</button>
    <span id="sSavedNote" style="display:none;color:var(--sage);font-size:12.5px;margin-left:10px;">Saved ✓</span>
  `;
  const descDraft = JSON.parse(JSON.stringify(s.description));
  let activeLang = "en";
  function flush(){ descDraft[activeLang] = el.querySelector("#sDesc").value; }
  el.querySelectorAll(".lang-tab").forEach(btn=>{
    btn.onclick = ()=>{
      flush();
      activeLang = btn.dataset.l;
      el.querySelectorAll(".lang-tab").forEach(b=>b.classList.toggle("active", b===btn));
      const input = el.querySelector("#sDesc");
      input.value = descDraft[activeLang] || "";
      input.dir = activeLang==="en" ? "ltr":"rtl";
    };
  });
  el.querySelector("#sLogoPick").onclick = ()=> el.querySelector("#sLogoFile").click();
  el.querySelector("#sLogoFile").onchange = async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const dataUrl = await resizeImage(file, 512, 0.82);
    s.logo = dataUrl;
    el.querySelector("#sLogoPreview").src = dataUrl;
    el.querySelector("#sLogoPreview").style.display = "block";
    el.querySelector("#sLogoRemove").style.display = "inline-block";
  };
  el.querySelector("#sLogoRemove").onclick = ()=>{
    s.logo = "";
    el.querySelector("#sLogoPreview").style.display = "none";
    el.querySelector("#sLogoRemove").style.display = "none";
  };
  el.querySelector("#sSaveBtn").onclick = async ()=>{
    flush();
    s.name = el.querySelector("#sName").value.trim() || "Sadonya";
    s.description = descDraft;
    s.phone = el.querySelector("#sPhone").value.trim();
    s.location = el.querySelector("#sLocation").value.trim();
    s.instagram = el.querySelector("#sInstagram").value.trim();
    s.facebook = el.querySelector("#sFacebook").value.trim();
    s.snap = el.querySelector("#sSnap").value.trim();
    s.hours = el.querySelector("#sHours").value.trim();
    if(s.logo && s.logo.startsWith("data:")) s.logo = await uploadDataUrl(s.logo, "branding", "logo");
    await persistSettings();
    const note = el.querySelector("#sSavedNote");
    note.style.display = "inline";
    setTimeout(()=> note.style.display = "none", 1800);
  };
}
 
/* ---------------- QR TAB ---------------- */
function renderQrTab(el){
  const s = state.settings;
  el.innerHTML = `
    <div class="admin-card">
      <div class="field"><label>Public Menu URL</label>
        <input id="qrUrlInput" value="${escapeHtml(s.publicUrl)}">
      </div>
      <p style="font-size:12px;color:var(--text-muted);">Set this to the real, published web address of your menu once it's live (for example: yourdomain.com/menu/sadonya-cafe). The QR code below always encodes whatever address is in this field.</p>
      <button class="btn btn-gold btn-sm" id="qrRegenBtn">Update QR Code</button>
    </div>
    <div class="qr-box">
      <div id="qrcode-canvas-wrap"></div>
      <button class="btn btn-primary" id="qrDownloadBtn">Download QR Code</button>
    </div>
  `;
  function draw(){
    const wrap = document.getElementById("qrcode-canvas-wrap");
    wrap.innerHTML = "";
    new QRCode(wrap, { text: s.publicUrl || "https://example.com", width:220, height:220, colorDark:"#2B1F1A", colorLight:"#ffffff" });
  }
  draw();
  document.getElementById("qrRegenBtn").onclick = ()=>{
    s.publicUrl = document.getElementById("qrUrlInput").value.trim() || s.publicUrl;
    persistSettings();
    draw();
  };
  document.getElementById("qrDownloadBtn").onclick = ()=>{
    setTimeout(()=>{
      const canvas = document.querySelector("#qrcode-canvas-wrap canvas");
      const img = document.querySelector("#qrcode-canvas-wrap img");
      const src = canvas ? canvas.toDataURL("image/png") : (img ? img.src : null);
      if(!src){ alert("QR code not ready yet."); return; }
      const a = document.createElement("a");
      a.href = src; a.download = ((APP_CONFIG.menuId || "sadonya-cafe") + "-qr-code.png");
      a.click();
    }, 50);
  };
}
 
/* ---------------- Floating Back-to-top ---------------- */
function setupBackToTop(){
  const btn = document.getElementById("backToTopBtn");
  if(!btn) return;
  // Keep the control outside the menu layout so it truly follows the viewport.
  if(btn.parentElement !== document.body) document.body.appendChild(btn);
  const update = ()=> {
    btn.classList.toggle("show", window.scrollY > 320);
  };
  update();
  window.addEventListener("scroll", update, {passive:true});
  btn.onclick = ()=> window.scrollTo({top:0, behavior:"smooth"});
}

/* ============================================================
   CUSTOMER FEEDBACK + ADMIN INBOX
============================================================ */
function ensureFeedbackModal(){
  if(document.getElementById("feedbackModal")) return;
  const modal=document.createElement("div"); modal.id="feedbackModal"; modal.className="feedback-modal"; modal.hidden=true;
  modal.innerHTML=`<div class="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle">
    <button type="button" class="feedback-close" id="feedbackClose" aria-label="Close">×</button>
    <h2 id="feedbackTitle">Send us your feedback</h2><p class="feedback-subtitle">How was your experience?</p>
    <form id="feedbackForm"><div class="feedback-stars" role="radiogroup" aria-label="Rating">
      ${[1,2,3,4,5].map(n=>`<button type="button" class="feedback-star" data-rating="${n}" role="radio" aria-checked="false" aria-label="${n} star${n>1?'s':''}">★</button>`).join("")}
    </div><input type="hidden" id="feedbackRating" value="">
    <label for="feedbackMessage">Your message*</label><textarea id="feedbackMessage" required maxlength="2000" placeholder="Write your message here..."></textarea>
    <div class="feedback-fields"><div><label for="feedbackName">Name</label><input id="feedbackName" maxlength="120" autocomplete="name"></div><div><label for="feedbackEmail">Email</label><input id="feedbackEmail" type="email" maxlength="254" autocomplete="email"></div></div>
    <p id="feedbackStatus" role="status" class="feedback-status"></p><button class="feedback-submit" type="submit">Submit</button></form></div>`;
  document.body.appendChild(modal);
  document.getElementById("feedbackClose").onclick=()=>modal.hidden=true;
  modal.addEventListener("click",e=>{if(e.target===modal) modal.hidden=true;});
  modal.querySelectorAll(".feedback-star").forEach(btn=>btn.onclick=()=>{document.getElementById("feedbackRating").value=btn.dataset.rating;modal.querySelectorAll(".feedback-star").forEach(b=>{b.classList.toggle("selected",Number(b.dataset.rating)<=Number(btn.dataset.rating));b.setAttribute("aria-checked",String(b===btn));});});
  document.getElementById("feedbackForm").addEventListener("submit",submitFeedback);
}
function openFeedbackForm(){ensureFeedbackModal();const m=document.getElementById("feedbackModal");m.hidden=false;document.getElementById("feedbackStatus").textContent="";}
async function submitFeedback(e){
  e.preventDefault(); const rating=Number(document.getElementById("feedbackRating").value); const message=document.getElementById("feedbackMessage").value.trim();
  const status=document.getElementById("feedbackStatus");
  if(!rating){status.textContent="Please choose a star rating.";return;} if(!message){status.textContent="Please write a message.";return;}
  if(!supabaseClient){status.textContent="Feedback is unavailable right now. Please try again later.";return;}
  const btn=e.currentTarget.querySelector(".feedback-submit");btn.disabled=true;status.textContent="Sending…";
  const {error}=await supabaseClient.from("customer_feedback").insert({branch_key:MENU_ID,rating,message,name:document.getElementById("feedbackName").value.trim()||null,email:document.getElementById("feedbackEmail").value.trim()||null});
  btn.disabled=false;
  if(error){console.error(error);status.textContent="Could not send feedback. Please try again.";return;}
  status.textContent="Thank you! Your feedback has been sent.";document.getElementById("feedbackForm").reset();document.getElementById("feedbackRating").value="";document.querySelectorAll(".feedback-star").forEach(b=>b.classList.remove("selected"));
}
async function renderFeedbackTab(el){
  el.innerHTML='<div class="admin-card">Loading feedback…</div>';
  if(!supabaseClient){el.innerHTML='<div class="admin-card">Supabase is not configured.</div>';return;}
  const {data,error}=await supabaseClient.from("customer_feedback").select("id,rating,message,name,email,created_at").eq("branch_key",MENU_ID).order("created_at",{ascending:false}).limit(300);
  if(error){console.error(error);el.innerHTML='<div class="admin-card">Could not load feedback. Check the feedback SQL migration and admin access policies.</div>';return;}
  const rows=data||[];const avg=rows.length?(rows.reduce((sum,r)=>sum+r.rating,0)/rows.length).toFixed(1):"—";
  el.innerHTML=`<div class="admin-card"><strong>${rows.length} feedback entries</strong> · Average rating: <strong>${avg} / 5 ★</strong></div>${rows.length?rows.map(r=>`<article class="admin-card feedback-entry"><div class="feedback-entry-head"><strong>${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</strong><time>${new Date(r.created_at).toLocaleString()}</time></div><p>${escapeHtml(r.message)}</p><small>${escapeHtml(r.name||"Anonymous")}${r.email?" · "+escapeHtml(r.email):""}</small><button class="btn btn-outline btn-sm feedback-delete" data-feedback-id="${r.id}">Delete</button></article>`).join(""):'<div class="admin-card">No feedback yet.</div>'}`;
  el.querySelectorAll(".feedback-delete").forEach(btn=>btn.onclick=async()=>{if(!confirm("Delete this feedback?"))return;const {error}=await supabaseClient.from("customer_feedback").delete().eq("id",btn.dataset.feedbackId).eq("branch_key",MENU_ID);if(error){alert("Could not delete feedback.");return;}renderFeedbackTab(el);});
}

/* ============================================================
   BOOT
============================================================ */
(async function boot(){
  await loadAll();
  await requireAuth();
  document.getElementById("loading").style.display = "none";
  document.documentElement.lang = state.lang;
  document.documentElement.dir = (state.lang === "en") ? "ltr" : "rtl";
  setupBackToTop();
  handleRoute();
})();

})();
