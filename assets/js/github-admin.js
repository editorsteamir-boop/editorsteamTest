(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const DEFAULT_AVATAR = "./assets/images/default-avatar.svg";
  const SUPABASE_URL = "https://yxzekduddsewulkbdcoz.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rr0hMzT-HuRk4a-frH4QPQ_ZWCgQyHB";
  const SUPABASE_SESSION_KEY = "editorsTeam.supabase.adminSession.v1";
  let requestRows = [];
  const state = { projects: [], editors: [], projectQueue: [], projectEdit: null, editorEdit: null, editorFile: null, editorExistingImage: DEFAULT_AVATAR, editorPortfolioQueue: [] };
  const toast = text => { const el=$("toast"); el.textContent=text; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2200); };
  const esc = value => String(value ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const slug = value => String(value||"item").toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff]+/g,"-").replace(/^-|-$/g,"") || `item-${Date.now()}`;
  function settings(){ return { owner:$("ghOwner").value.trim(), repo:$("ghRepo").value.trim(), branch:$("ghBranch").value.trim()||"main", token:$("ghToken").value.trim() }; }
  function assertSettings(){ const s=settings(); if(!s.owner||!s.repo||!s.token) throw new Error("نام کاربری، نام مخزن و توکن را کامل کنید."); return s; }
  function apiPath(path){ const s=assertSettings(); return `https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(s.branch)}`; }
  async function ghFetch(url, options={}){ const s=assertSettings(); const r=await fetch(url,{...options,headers:{Accept:"application/vnd.github+json",Authorization:`Bearer ${s.token}`,"X-GitHub-Api-Version":"2022-11-28",...(options.headers||{})}}); if(!r.ok){ let msg=`خطای GitHub (${r.status})`; try{const j=await r.json();if(j.message)msg+=`: ${j.message}`}catch{} throw new Error(msg); } return r.status===204?null:r.json(); }
  function bytesToBase64(bytes){ let binary=""; const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk)); return btoa(binary); }
  function textToBase64(text){ return bytesToBase64(new TextEncoder().encode(text)); }
  function base64ToText(content){ const bin=atob(content.replace(/\n/g,"")); const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes); }
  async function getContent(path){ try{return await ghFetch(apiPath(path));}catch(e){ if(String(e.message).includes("404"))return null; throw e; } }
  async function putContent(path, contentB64, message){ const s=assertSettings(); const existing=await getContent(path); const url=`https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`; const body={message,content:contentB64,branch:s.branch}; if(existing?.sha)body.sha=existing.sha; return ghFetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); }
  async function saveJson(path,data,message){ return putContent(path,textToBase64(JSON.stringify(data,null,2)),message); }
  async function uploadFile(path,file,message){ return putContent(path,bytesToBase64(new Uint8Array(await file.arrayBuffer())),message); }
  function localSettingsLoad(){ try{const s=JSON.parse(localStorage.getItem("editorsTeam.github.settings")||"{}"); if(s.owner)$("ghOwner").value=s.owner;if(s.repo)$("ghRepo").value=s.repo;if(s.branch)$("ghBranch").value=s.branch;}catch{} }
  function localSettingsSave(){ const s=settings(); localStorage.setItem("editorsTeam.github.settings",JSON.stringify({owner:s.owner,repo:s.repo,branch:s.branch})); toast("تنظیمات غیرحساس ذخیره شد"); }
  async function connect(){ const status=$("connectionStatus"); status.className="status"; status.textContent="در حال اتصال..."; try{ const s=assertSettings(); const repoUrl=`https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}`; await ghFetch(repoUrl); const [p,e]=await Promise.all([getContent("data/projects.json"),getContent("data/editors.json")]); state.projects=p?JSON.parse(base64ToText(p.content)):[]; state.editors=e?JSON.parse(base64ToText(e.content)):[]; state.projects=Array.isArray(state.projects)?state.projects:[];state.editors=Array.isArray(state.editors)?state.editors:[]; normalizeOrders();renderProjects();renderEditors();status.className="status ok";status.textContent="اتصال موفق بود و اطلاعات مخزن دریافت شد.";localSettingsSave(); }
    catch(err){status.className="status bad";status.textContent=err.message;}
  }
  function normalizeOrders(){ state.projects.forEach((x,i)=>x.order=i+1);state.editors.forEach((x,i)=>x.order=i+1); }
  function renderProjects(){ $("projectCount").textContent=`${state.projects.length} پروژه`; $("projectsAdminList").innerHTML=state.projects.map((p,i)=>`<article class="admin-row"><div style="font-size:34px">${esc(p.icon||"🎨")}</div><div><h3>${esc(p.title)}</h3><p>${(p.images||[]).length} تصویر • ${p.active===false?"مخفی":"فعال"}</p></div><div class="row-actions"><button data-kind="project" data-act="up" data-i="${i}">↑</button><button data-kind="project" data-act="down" data-i="${i}">↓</button><button data-kind="project" data-act="edit" data-i="${i}">ویرایش</button><button data-kind="project" data-act="toggle" data-i="${i}">${p.active===false?"نمایش":"مخفی"}</button><button class="danger" data-kind="project" data-act="delete" data-i="${i}">حذف</button></div></article>`).join("")||"<p>پروژه‌ای ثبت نشده است.</p>"; }
  function renderEditors(){ $("editorCount").textContent=`${state.editors.length} ادیتور`; $("editorsAdminList").innerHTML=state.editors.map((x,i)=>`<article class="admin-row editor"><img src="${esc(x.image||DEFAULT_AVATAR)}" onerror="this.src='${DEFAULT_AVATAR}'"><div><h3>${esc(x.fullName||"بدون نام")} ${x.verified?"✓":""}</h3><p>${esc(x.badge||"ادیتور")} • ${esc(x.specialty||"—")} • ${esc(x.city||"—")} • ${x.active===false?"مخفی":"فعال"}</p></div><div class="row-actions"><button data-kind="editor" data-act="up" data-i="${i}">↑</button><button data-kind="editor" data-act="down" data-i="${i}">↓</button><button data-kind="editor" data-act="edit" data-i="${i}">ویرایش</button><button data-kind="editor" data-act="toggle" data-i="${i}">${x.active===false?"نمایش":"مخفی"}</button><button class="danger" data-kind="editor" data-act="delete" data-i="${i}">حذف</button></div></article>`).join("")||"<p>ادیتوری ثبت نشده است.</p>"; }
  function resetProject(){ state.projectEdit=null;state.projectQueue=[];$("projectForm").reset();$("projectActive").checked=true;$("projectIcon").value="🎨";$("projectFormTitle").textContent="افزودن باکس پروژه";renderQueue(); }
  function editProject(i){ const p=state.projects[i];state.projectEdit=i;$("projectTitle").value=p.title||"";$("projectIcon").value=p.icon||"🎨";$("projectDescription").value=p.description||"";$("projectActive").checked=p.active!==false;state.projectQueue=(p.images||[]).map(x=>({type:"existing",src:x.src,alt:x.alt||""}));$("projectFormTitle").textContent="ویرایش پروژه";renderQueue();scrollTo({top:0,behavior:"smooth"}); }
  function renderQueue(){ $("projectImageQueue").innerHTML=state.projectQueue.map((x,i)=>`<div class="queue-item"><img src="${esc(x.preview||x.src)}"><small>${esc(x.name||x.alt||`تصویر ${i+1}`)}</small><div class="queue-actions"><button type="button" data-q="up" data-i="${i}">↑</button><button type="button" data-q="down" data-i="${i}">↓</button><button type="button" class="danger" data-q="remove" data-i="${i}">×</button></div></div>`).join(""); }
  async function saveProject(e){ e.preventDefault(); try{ const s=assertSettings(); const title=$("projectTitle").value.trim(); if(!title)throw new Error("نام پروژه را وارد کنید."); const old=state.projectEdit===null?null:state.projects[state.projectEdit]; const id=old?.id||`${slug(title)}-${Date.now().toString().slice(-5)}`; const images=[]; let uploadIndex=0; for(const item of state.projectQueue){ if(item.type==="existing"){images.push({src:item.src,alt:item.alt||title});continue;} const ext=(item.file.name.split('.').pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg"; const path=`assets/images/projects/${id}/${Date.now()}-${String(++uploadIndex).padStart(2,"0")}.${ext}`; toast(`در حال آپلود تصویر ${uploadIndex}...`); await uploadFile(path,item.file,`Upload image for ${title}`); images.push({src:`./${path}`,alt:`${title} ${images.length+1}`}); }
      const record={id,title,icon:$("projectIcon").value.trim()||"🎨",description:$("projectDescription").value.trim()||`نمونه پروژه‌های ${title}`,active:$("projectActive").checked,order:old?.order||state.projects.length+1,images}; if(state.projectEdit===null)state.projects.push(record);else state.projects[state.projectEdit]=record;normalizeOrders();await saveJson("data/projects.json",state.projects,`Update projects: ${title}`);renderProjects();resetProject();toast("پروژه روی GitHub ذخیره شد"); }
    catch(err){alert(err.message);} }
  function inferPortfolioType(src, explicit){ if(explicit==="video"||explicit==="image")return explicit;return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(String(src||""))?"video":"image"; }
  function existingPortfolioMedia(x){
    if(Array.isArray(x.portfolioMedia)&&x.portfolioMedia.length)return x.portfolioMedia.filter(Boolean).map((m,i)=>typeof m==="string"?{type:"existing",src:m,mediaType:inferPortfolioType(m),title:`پروژه ${i+1}`}:{type:"existing",src:m.src,mediaType:inferPortfolioType(m.src,m.type),title:m.title||`پروژه ${i+1}`}).filter(m=>m.src);
    return (Array.isArray(x.portfolioImages)?x.portfolioImages:[]).map((src,i)=>({type:"existing",src,mediaType:inferPortfolioType(src),title:`پروژه ${i+1}`}));
  }
  function resetEditor(){ state.editorEdit=null;state.editorFile=null;state.editorExistingImage=DEFAULT_AVATAR;state.editorPortfolioQueue=[];$("editorForm").reset();$("editorActive").checked=true;$("avatarPreview").src=DEFAULT_AVATAR;$("editorFormTitle").textContent="افزودن ادیتور";renderEditorPortfolioQueue(); }
  function editEditor(i){ const x=state.editors[i];state.editorEdit=i;state.editorFile=null;state.editorExistingImage=x.image||DEFAULT_AVATAR;state.editorPortfolioQueue=existingPortfolioMedia(x); for(const id of ["fullName","badge","age","city","specialty","rating","bio"])$(id).value=x[id]||"";$("projectsDone").value=x.projects||"";$("verified").checked=!!x.verified;$("online").checked=!!x.online;$("editorActive").checked=x.active!==false;$("avatarPreview").src=state.editorExistingImage;$("editorFormTitle").textContent="ویرایش ادیتور";renderEditorPortfolioQueue();scrollTo({top:0,behavior:"smooth"}); }

  function renderEditorPortfolioQueue(){ const el=$("editorPortfolioQueue"); if(!el)return;el.innerHTML=state.editorPortfolioQueue.map((x,i)=>{const mediaType=x.mediaType||inferPortfolioType(x.src||x.name);const preview=x.preview||x.src;const visual=mediaType==="video"?`<div class="queue-video"><video src="${esc(preview)}#t=0.1" muted playsinline preload="metadata"></video><span>▶</span></div>`:`<img src="${esc(preview)}">`;return `<div class="queue-item">${visual}<small>${esc(x.name||x.title||`نمونه‌کار ${i+1}`)}</small><div class="queue-actions"><button type="button" data-epq="up" data-i="${i}">↑</button><button type="button" data-epq="down" data-i="${i}">↓</button><button type="button" class="danger" data-epq="remove" data-i="${i}">×</button></div></div>`;}).join(""); }
  function validateSquareJpg(file){ return new Promise((resolve,reject)=>{ if(!/image\/jpeg/.test(file.type)&&!/(\.jpe?g)$/i.test(file.name))return reject(new Error("تصویر ادیتور باید با فرمت JPG باشد.")); const img=new Image();img.onload=()=>{URL.revokeObjectURL(img.src); if(img.naturalWidth!==img.naturalHeight)return reject(new Error("ابعاد تصویر ادیتور باید دقیقاً نسبت ۱ به ۱ باشد."));resolve();};img.onerror=()=>reject(new Error("تصویر قابل خواندن نیست."));img.src=URL.createObjectURL(file); }); }
  async function saveEditor(e){ e.preventDefault(); try{assertSettings();const name=$("fullName").value.trim();if(!name)throw new Error("نام ادیتور را وارد کنید.");const old=state.editorEdit===null?null:state.editors[state.editorEdit];const id=old?.id||`editor-${Date.now()}`;let image=state.editorExistingImage;if(state.editorFile){const path=`assets/images/editors/${id}.jpg`;toast("در حال آپلود تصویر ادیتور...");await uploadFile(path,state.editorFile,`Upload editor photo: ${name}`);image=`./${path}?v=${Date.now()}`;}const portfolioMedia=[];let portfolioIndex=0;for(const item of state.editorPortfolioQueue){if(item.type==="existing"){portfolioMedia.push({src:item.src,type:item.mediaType||inferPortfolioType(item.src),title:item.title||`پروژه ${portfolioMedia.length+1}`});continue;}const mediaType=item.mediaType||inferPortfolioType(item.file.name,item.file.type?.startsWith("video/")?"video":"image");const ext=(item.file.name.split('.').pop()||(mediaType==="video"?"mp4":"jpg")).toLowerCase().replace(/[^a-z0-9]/g,"")||(mediaType==="video"?"mp4":"jpg");const path=`assets/images/editors/${id}/portfolio/${Date.now()}-${String(++portfolioIndex).padStart(2,"0")}.${ext}`;toast(`در حال آپلود نمونه‌کار ${portfolioIndex}...`);await uploadFile(path,item.file,`Upload portfolio ${mediaType}: ${name}`);portfolioMedia.push({src:`./${path}`,type:mediaType,title:`پروژه ${portfolioMedia.length+1}`});}const portfolioImages=portfolioMedia.filter(m=>m.type==="image").map(m=>m.src); const x={id,fullName:name,badge:$("badge").value.trim(),age:$("age").value.trim(),city:$("city").value.trim(),specialty:$("specialty").value.trim(),rating:$("rating").value.trim(),projects:$("projectsDone").value.trim(),portfolioImages,portfolioMedia,bio:$("bio").value.trim(),image,verified:$("verified").checked,online:$("online").checked,active:$("editorActive").checked,order:old?.order||state.editors.length+1};if(state.editorEdit===null)state.editors.push(x);else state.editors[state.editorEdit]=x;normalizeOrders();await saveJson("data/editors.json",state.editors,`Update editors: ${name}`);renderEditors();resetEditor();toast("ادیتور روی GitHub ذخیره شد");}catch(err){alert(err.message);} }
  async function persistOrder(kind){ normalizeOrders(); if(kind==="project")await saveJson("data/projects.json",state.projects,"Reorder projects");else await saveJson("data/editors.json",state.editors,"Reorder editors");toast("ترتیب روی GitHub ذخیره شد"); }
  async function listAction(e){ const b=e.target.closest("button[data-kind]");if(!b)return;const kind=b.dataset.kind,act=b.dataset.act,i=+b.dataset.i,arr=kind==="project"?state.projects:state.editors;try{if(act==="edit")return kind==="project"?editProject(i):editEditor(i);if(act==="delete"&&!confirm("این مورد حذف شود؟"))return;if(act==="delete")arr.splice(i,1);if(act==="toggle")arr[i].active=arr[i].active===false;if(act==="up"&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];if(act==="down"&&i<arr.length-1)[arr[i+1],arr[i]]=[arr[i],arr[i+1]];kind==="project"?renderProjects():renderEditors();await persistOrder(kind);}catch(err){alert(err.message);} }
  $("tokenFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;$("ghToken").value=(await f.text()).trim();toast("توکن از فایل خوانده شد");});
  $("projectImages").addEventListener("change",e=>{for(const file of e.target.files){state.projectQueue.push({type:"new",file,name:file.name,preview:URL.createObjectURL(file)});}renderQueue();e.target.value="";});
  $("projectImageQueue").addEventListener("click",e=>{const b=e.target.closest("button[data-q]");if(!b)return;const i=+b.dataset.i,a=b.dataset.q;if(a==="remove")state.projectQueue.splice(i,1);if(a==="up"&&i>0)[state.projectQueue[i-1],state.projectQueue[i]]=[state.projectQueue[i],state.projectQueue[i-1]];if(a==="down"&&i<state.projectQueue.length-1)[state.projectQueue[i+1],state.projectQueue[i]]=[state.projectQueue[i],state.projectQueue[i+1]];renderQueue();});
  $("editorImage").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{await validateSquareJpg(f);state.editorFile=f;$("avatarPreview").src=URL.createObjectURL(f);toast("تصویر معتبر است");}catch(err){e.target.value="";alert(err.message);}});
  $("editorPortfolioImages").addEventListener("change",e=>{for(const file of e.target.files){const mediaType=file.type.startsWith("video/")?"video":"image";if(mediaType==="video"&&file.size>45*1024*1024){alert(`ویدئوی ${file.name} بیشتر از ۴۵ مگابایت است.`);continue;}state.editorPortfolioQueue.push({type:"new",file,name:file.name,mediaType,preview:URL.createObjectURL(file)});}renderEditorPortfolioQueue();e.target.value="";});
  $("editorPortfolioQueue").addEventListener("click",e=>{const b=e.target.closest("button[data-epq]");if(!b)return;const i=+b.dataset.i,a=b.dataset.epq;if(a==="remove")state.editorPortfolioQueue.splice(i,1);if(a==="up"&&i>0)[state.editorPortfolioQueue[i-1],state.editorPortfolioQueue[i]]=[state.editorPortfolioQueue[i],state.editorPortfolioQueue[i-1]];if(a==="down"&&i<state.editorPortfolioQueue.length-1)[state.editorPortfolioQueue[i+1],state.editorPortfolioQueue[i]]=[state.editorPortfolioQueue[i],state.editorPortfolioQueue[i+1]];renderEditorPortfolioQueue();});
  function loadSupabaseSession(){
    try { return JSON.parse(sessionStorage.getItem(SUPABASE_SESSION_KEY) || "null"); } catch (_) { return null; }
  }
  function saveSupabaseSession(session){
    if(session) sessionStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SUPABASE_SESSION_KEY);
  }
  function authHeaders(token){ return { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${token}`, "Content-Type":"application/json" }; }
  function setRequestsLoggedIn(loggedIn){
    const auth=$("requestsAuthBox"), toolbar=$("requestsToolbar");
    if(auth) auth.hidden=loggedIn;
    if(toolbar) toolbar.hidden=!loggedIn;
  }
  function setDbStatus(kind,text){
    const el=$("supabaseConnectionStatus");
    if(!el)return;
    el.className=`db-connection-status ${kind||"neutral"}`;
    el.textContent=text;
  }
  function humanSupabaseError(data,status){
    const raw=String(data?.error_description||data?.msg||data?.message||data?.error||"").trim();
    const low=raw.toLowerCase();
    if(low.includes("invalid login credentials")) return "ایمیل یا رمز عبور صحیح نیست.";
    if(low.includes("email not confirmed")) return "ایمیل این کاربر هنوز تأیید نشده است. در Supabase کاربر را Confirm کنید.";
    if(low.includes("user not found")) return "این کاربر در Supabase پیدا نشد.";
    if(status===429) return "تعداد تلاش‌های ورود زیاد بوده؛ کمی بعد دوباره امتحان کنید.";
    return raw || `خطای Supabase (${status||"نامشخص"})`;
  }
  async function testSupabaseConnection(showToast=true){
    const btn=$("supabaseCheckBtn");
    if(btn){btn.disabled=true;btn.textContent="در حال بررسی...";}
    setDbStatus("checking","در حال بررسی اتصال به Supabase و جدول درخواست‌ها...");
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),10000);
      const r=await fetch(`${SUPABASE_URL}/rest/v1/training_requests?select=id&limit=1`,{
        method:"GET",
        headers:{"apikey":SUPABASE_KEY,"Accept":"application/json"},
        cache:"no-store",
        signal:controller.signal
      });
      clearTimeout(timer);
      let data=null;try{data=await r.json();}catch{}
      if(!r.ok) throw new Error(humanSupabaseError(data,r.status));
      setDbStatus("ok","✓ اتصال به دیتابیس برقرار است و جدول training_requests در دسترس است.");
      if(showToast)toast("اتصال دیتابیس موفق بود");
      return true;
    }catch(err){
      const msg=err?.name==="AbortError"?"پاسخی از دیتابیس دریافت نشد؛ اینترنت یا Supabase را بررسی کنید.":err.message;
      setDbStatus("bad",`✕ اتصال ناموفق: ${msg}`);
      if(showToast)toast("اتصال دیتابیس ناموفق بود");
      return false;
    }finally{
      if(btn){btn.disabled=false;btn.textContent="بررسی اتصال دیتابیس";}
    }
  }
  async function supabaseLogin(){
    const email=$("supabaseEmail").value.trim(), password=$("supabasePassword").value;
    const status=$("requestsStatus");
    if(!email||!password){if(status)status.textContent="ایمیل و رمز مدیر را وارد کنید.";toast("ایمیل و رمز را کامل کنید");return;}
    const connected=await testSupabaseConnection(false);
    if(!connected){if(status)status.textContent="ابتدا مشکل اتصال دیتابیس را برطرف کنید.";return;}
    const btn=$("supabaseLoginBtn"); btn.disabled=true;btn.textContent="در حال ورود...";
    if(status)status.textContent="اتصال برقرار است؛ در حال بررسی حساب مدیر...";
    try{
      const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
        method:"POST",
        headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({email,password}),cache:"no-store"
      });
      let data={};try{data=await r.json();}catch{}
      if(!r.ok||!data.access_token)throw new Error(humanSupabaseError(data,r.status));
      saveSupabaseSession({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600),email:data.user?.email||email});
      setRequestsLoggedIn(true);
      $("supabasePassword").value="";
      if(status)status.textContent=`ورود ${data.user?.email||email} موفق بود؛ در حال دریافت درخواست‌ها...`;
      await fetchRequests();
      toast("ورود مدیر موفق بود");
    }catch(err){
      saveSupabaseSession(null);setRequestsLoggedIn(false);
      if(status)status.textContent=`ورود ناموفق: ${err.message}`;
      setDbStatus("ok","✓ دیتابیس متصل است؛ مشکل مربوط به ورود حساب مدیر است.");
      toast("ورود مدیر ناموفق بود");
    }finally{btn.disabled=false;btn.textContent="ورود و دریافت درخواست‌ها";}
  }
  async function refreshSupabaseSession(session){
    if(!session?.refresh_token)return null;
    const r=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:session.refresh_token})});
    const data=await r.json();
    if(!r.ok||!data.access_token)return null;
    const next={access_token:data.access_token,refresh_token:data.refresh_token||session.refresh_token,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600),email:data.user?.email||session.email};
    saveSupabaseSession(next);return next;
  }
  async function validSession(){
    let s=loadSupabaseSession();
    if(!s)return null;
    if((s.expires_at||0)-60<=Math.floor(Date.now()/1000))s=await refreshSupabaseSession(s);
    if(!s){saveSupabaseSession(null);setRequestsLoggedIn(false);}return s;
  }
  let requestEditorsCache=null;
  async function loadRequestEditors(){
    if(requestEditorsCache)return requestEditorsCache;
    try{
      const r=await fetch(`./data/editors.json?requests=${Date.now()}`,{cache:"no-store"});
      if(!r.ok)throw new Error("editors.json");
      const data=await r.json();
      requestEditorsCache=Array.isArray(data)?data:[];
    }catch(_){requestEditorsCache=[];}
    return requestEditorsCache;
  }
  function faDigitsToEn(value){
    return String(value||"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  }
  async function hydrateRequestPreviews(rows){
    const editors=await loadRequestEditors();
    if(!editors.length)return rows;
    return rows.map(r=>{
      if(r.thumbnail||r.media_src)return r;
      const editor=editors.find(e=>String(e.id||"")===String(r.editor_id||"")) || editors.find(e=>String(e.fullName||"")===String(r.editor_name||""));
      if(!editor)return r;
      const rawNo=r.project_id||r.project_no||String(r.project_name||"").replace(/[^0-9۰-۹]/g,"");
      const n=Number(faDigitsToEn(rawNo));
      if(!Number.isFinite(n)||n<1)return r;
      const media=Array.isArray(editor.portfolioMedia)&&editor.portfolioMedia.length?editor.portfolioMedia:(editor.portfolioImages||[]).map(src=>({type:"image",src}));
      const item=media[n-1];
      if(!item?.src)return r;
      return {...r,thumbnail:new URL(item.src,window.location.href).href,media_type:item.type==="video"?"video":"image"};
    });
  }

  function renderRequests(){
    const el=$("requestsAdminList"), count=$("requestCount"), q=($("requestSearch")?.value||"").trim().toLowerCase();
    if(!el)return;
    const rows=requestRows.filter(r=>!q||[r.full_name,r.phone,r.editor_name,r.project_name,r.project_no].some(v=>String(v||"").toLowerCase().includes(q)));
    if(count)count.textContent=`${requestRows.length} درخواست`;
    el.innerHTML=rows.length?rows.map(r=>{
      const mediaType=r.media_type==="video"?"video":"image";
      const src=String(r.thumbnail||r.media_src||"").trim();
      const preview=src
        ? (mediaType==="video"
          ? `<div class="request-project-preview request-project-video"><video src="${esc(src)}#t=0.1" muted playsinline preload="metadata"></video><span>▶</span><em>ویدئو</em></div>`
          : `<div class="request-project-preview"><img src="${esc(src)}" alt="پروژه ${esc(r.project_no||"")}" loading="lazy"><em>تصویر</em></div>`)
        : `<div class="request-project-preview request-project-fallback">✉<em>قدیمی</em></div>`;
      const projectNo=r.project_id||r.project_no||String(r.project_name||"").replace(/[^0-9۰-۹]/g,"")||"—";
      return `<article class="admin-row request-row">${preview}<div class="request-info"><h3>${esc(r.full_name||"بدون نام")}</h3><p>📞 ${esc(r.phone||"—")}<br>👤 ادیتور: ${esc(r.editor_name||"—")}<br>🎬 پروژه ${esc(projectNo)}<br>🕒 ${esc(r.created_at?new Date(r.created_at).toLocaleString("fa-IR"):"—")}</p></div><div class="row-actions"><button class="danger" data-request-delete="${esc(r.id)}">حذف درخواست</button></div></article>`;
    }).join(""):"<p>درخواستی برای نمایش وجود ندارد.</p>";
  }
  async function fetchRequests(){
    const status=$("requestsStatus");
    const session=await validSession();
    if(!session){if(status)status.textContent="برای مشاهده درخواست‌ها ابتدا وارد شوید.";requestRows=[];renderRequests();return;}
    setRequestsLoggedIn(true);if(status)status.textContent="در حال دریافت درخواست‌ها...";
    try{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/training_requests?select=*&order=created_at.desc`,{headers:authHeaders(session.access_token)});
      const data=await r.json();if(!r.ok)throw new Error(data.message||"دریافت درخواست‌ها ناموفق بود");
      requestRows=Array.isArray(data)?data:[];requestRows=await hydrateRequestPreviews(requestRows);renderRequests();if(status)status.textContent=requestRows.length?"آخرین درخواست‌ها دریافت شدند.":"هنوز درخواستی ثبت نشده است.";
    }catch(err){if(status)status.textContent=`خطا: ${err.message}`;}
  }
  async function deleteRequest(id){
    if(!confirm("این درخواست حذف شود؟"))return;
    const session=await validSession();if(!session){alert("نشست مدیر منقضی شده است. دوباره وارد شوید.");return;}
    const r=await fetch(`${SUPABASE_URL}/rest/v1/training_requests?id=eq.${encodeURIComponent(id)}`,{method:"DELETE",headers:{...authHeaders(session.access_token),"Prefer":"return=minimal"}});
    if(!r.ok){let data={};try{data=await r.json()}catch{};alert(data.message||"حذف درخواست انجام نشد");return;}
    requestRows=requestRows.filter(x=>String(x.id)!==String(id));renderRequests();toast("درخواست حذف شد");
  }
  function supabaseLogout(){ saveSupabaseSession(null);requestRows=[];setRequestsLoggedIn(false);renderRequests();$("requestsStatus").textContent="از حساب مدیر خارج شدید.";toast("خروج انجام شد"); }
  $("requestsAdminList")?.addEventListener("click",e=>{const b=e.target.closest("[data-request-delete]");if(b)deleteRequest(b.dataset.requestDelete);});
  $("supabaseCheckBtn")?.addEventListener("click",()=>testSupabaseConnection(true));
  $("supabaseLoginBtn")?.addEventListener("click",supabaseLogin);
  $("refreshRequestsBtn")?.addEventListener("click",fetchRequests);
  $("supabaseLogoutBtn")?.addEventListener("click",supabaseLogout);
  $("requestSearch")?.addEventListener("input",renderRequests);
  document.querySelector(".admin-tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]");if(!b)return;document.querySelectorAll(".admin-tabs button").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab));if(b.dataset.tab==="requestsTab")fetchRequests();});
  $("connectBtn").onclick=connect;$("saveSettingsBtn").onclick=localSettingsSave;$("projectForm").onsubmit=saveProject;$("editorForm").onsubmit=saveEditor;$("newProjectBtn").onclick=resetProject;$("cancelProjectEdit").onclick=resetProject;$("newEditorBtn").onclick=resetEditor;$("cancelEditorEdit").onclick=resetEditor;$("projectsAdminList").onclick=listAction;$("editorsAdminList").onclick=listAction;
  localSettingsLoad();resetProject();resetEditor();if($("requestsTab")){setRequestsLoggedIn(!!loadSupabaseSession());renderRequests();testSupabaseConnection(false);}
})();
