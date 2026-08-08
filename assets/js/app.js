const summary = [{"course": "اینشات", "level": "مبتدی", "icon": "🎬", "days": 20, "weight": 4}, {"course": "سامسونگ", "level": "مبتدی", "icon": "📱", "days": 4, "weight": 1}, {"course": "پیکسلب", "level": "مبتدی", "icon": "✍️", "days": 7, "weight": 1}, {"course": "کالرپیکر", "level": "مبتدی", "icon": "🎨", "days": 1, "weight": 1}, {"course": "پیکس آرت", "level": "متوسط", "icon": "🖼️", "days": 8, "weight": 2}, {"course": "هایپیک", "level": "متوسط", "icon": "✨", "days": 4, "weight": 1}, {"course": "پوستر میکر", "level": "متوسط", "icon": "🪧", "days": 5, "weight": 1}, {"course": "کنوا", "level": "متوسط", "icon": "🟣", "days": 6, "weight": 1}, {"course": "کپ کات", "level": "متوسط", "icon": "✂️", "days": 8, "weight": 2}, {"course": "کپشنو", "level": "متوسط", "icon": "📝", "days": 1, "weight": 1}, {"course": "کپشنرز", "level": "متوسط", "icon": "💬", "days": 1, "weight": 1}, {"course": "پینترست", "level": "متوسط", "icon": "📌", "days": 1, "weight": 1}, {"course": "سنپسید", "level": "پیشرفته", "icon": "🌿", "days": 3, "weight": 1}, {"course": "الایت موشن", "level": "پیشرفته", "icon": "🎞️", "days": 8, "weight": 2}, {"course": "لایت روم", "level": "پیشرفته", "icon": "📷", "days": 5, "weight": 1}, {"course": "لئوناردو", "level": "هوش مصنوعی", "icon": "🤖", "days": 1, "weight": 1}, {"course": "پرامپت نویسی", "level": "هوش مصنوعی", "icon": "🧠", "days": 1, "weight": 1}];
function readStoredObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_) {
    return {};
  }
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

let done = readStoredObject("et_done_v2");
let notes = readStoredObject("et_notes_v2");
if (!Object.keys(notes).length) {
  const oldNotes = readStoredObject("notes");
  if (Object.keys(oldNotes).length) {
    notes = oldNotes;
    localStorage.setItem("et_notes_v2", JSON.stringify(notes));
  }
}
let filter = "همه";
const tabs = ["همه","مبتدی","متوسط","پیشرفته","هوش مصنوعی"];
const supportUrl = "https://rubika.ir/editorsteamir";
const groupUrl = "https://rubika.ir/joing/BBAEJBICI0KSHFTVXWHINBVKFFWZDRXC";
const videoLinks = {"اینشات": "https://rubika.ir/editorsteamir/BHBIFFFDHIHACAAJ", "سامسونگ": "https://rubika.ir/editorsteamir/BHDADEFDCGBJCAAJ", "پیکسلب": "https://rubika.ir/editorsteamir/BHDBFIAJFFBBHAAJ", "کالرپیکر": "https://rubika.ir/editorsteamir/BGGJIDDBEJEDBAAJ", "پیکس آرت": "https://rubika.ir/editorsteamir/BHCECAHBJHDJIAAJ", "هایپیک": "https://rubika.ir/editorsteamir/BHDDFEAJDJACFAAJ", "پوستر میکر": "https://rubika.ir/editorsteamir/BHDDFIHJGDGGIAAJ", "کنوا": "https://rubika.ir/editorsteamir/BHDDFJHJGHHDEAAJ", "کپ کات": "https://rubika.ir/editorsteamir/BHDDGACJHBFJAAAJ", "کپشنو": "https://rubika.ir/editorsteamir/BGGJIEABFBCBFAAJ", "کپشنرز": "https://rubika.ir/editorsteamir/BGGJIBEBDGCBBAAJ", "پینترست": "https://rubika.ir/editorsteamir/BGGJICFBEDFCBAAJ", "سنپسید": "https://rubika.ir/editorsteamir/BHDDGBBJHFBEGAAJ", "الایت موشن": "https://rubika.ir/editorsteamir/BHDDGBGJHJCEDAAJ", "لایت روم": "https://rubika.ir/editorsteamir/BHDDGCAJIBCCJAAJ", "لئوناردو": "https://rubika.ir/editorsteamir/BGGJIEDBFCAGGAAJ", "پرامپت نویسی": "https://rubika.ir/editorsteamir/BHGFEFEHJHEDBAAJ"};

function save() {
  localStorage.setItem("et_done_v2", JSON.stringify(done));
  localStorage.setItem("et_notes_v2", JSON.stringify(notes));
}
function showView(id, btn) {
  const wasInProjects = document.getElementById("projects")?.classList.contains("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".navbtn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  if(wasInProjects && id!=="projects") backProjects();
  if(id==="notes") renderNotes();
  if(id==="editors" && typeof renderEditors === "function") renderEditors();
  updateProgress();
}
function initTabs(){
  const el=document.getElementById("tabs");
  tabs.forEach(t=>{
    const b=document.createElement("button");
    b.className="tab"+(t===filter?" active":"");
    b.textContent=t;
    b.onclick=()=>{filter=t; document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderList();};
    el.appendChild(b);
  });
}
function renderSummary(){
  const el=document.getElementById("summary");
  el.innerHTML="";
  summary.forEach(s=>{
    const d=document.createElement("div");
    d.className="summary-item";
    d.innerHTML=`<b>${s.icon} ${s.course}</b><br>${s.level} | ${s.days} روز<br><span class="small-link">باز کردن لینک آموزش</span>`;
    d.onclick=()=>{ if(videoLinks[s.course]) window.open(videoLinks[s.course], '_blank'); };
    d.style.cursor='pointer';
    el.appendChild(d);
  });
  const today = plan.find(x=>!done[x.id]) || plan[plan.length-1];
  document.getElementById("todayInfo").textContent = today ? `امروز: ${today.course}` : "";
}
function renderList(){
  const q=(document.getElementById("search")?.value || "").trim();
  const list=document.getElementById("list");
  if(!list) return;

  const rows=plan.filter(x=>(filter==="همه"||x.level===filter) && (!q || x.course.includes(q) || x.level.includes(q)));
  const count=document.getElementById("resultCount");
  if(count) count.textContent = rows.length + " مورد";

  const fragment=document.createDocumentFragment();
  rows.forEach(x=>{
    const card=document.createElement("div");
    card.className="card"+(done[x.id]?" done":"");
    card.dataset.id=String(x.id);
    card.innerHTML=`
      <div class="top-row">
        <div style="display:flex;align-items:center;gap:9px">
          <div class="icon">${x.icon}</div>
          <div>
            <div class="badge">هفته ${x.week} | روز ${x.day}</div>
            <div class="course-title">${x.course}</div>
          </div>
        </div>
        <button class="smallbtn done-toggle" style="max-width:90px" data-id="${x.id}">${done[x.id]?'لغو':'انجام شد'}</button>
      </div>
      <div class="meta">سطح: ${x.level} | جلسه ${x.lesson} از ${x.lessonCount}<br>${x.task}</div>
      <textarea id="note-${x.id}" class="note" data-id="${x.id}" placeholder="یادداشت این آموزش...">${notes[x.id]||""}</textarea>
      <div class="card-actions">
        <button class="smallbtn alt done-toggle" data-id="${x.id}">${done[x.id]?'لغو':'انجام شد'}</button>
        <button class="smallbtn note-save" data-id="${x.id}">ثبت یادداشت</button>
      </div>`;
    fragment.appendChild(card);
  });

  list.replaceChildren(fragment);
  updateProgress();
}

function updateCardDoneState(id){
  const card=document.querySelector(`.card[data-id="${id}"]`);
  if(!card) return;
  card.classList.toggle("done", Boolean(done[id]));
  card.querySelectorAll(".done-toggle").forEach(btn=>{
    btn.textContent=done[id]?"لغو":"انجام شد";
  });
}



function showNoteToast(){
  const t=document.getElementById("noteToast");
  if(!t) return;
  t.classList.add("show");
  clearTimeout(window.__noteToastTimer);
  window.__noteToastTimer=setTimeout(()=>t.classList.remove("show"),1800);
}

function saveNote(id){
 const el=document.getElementById("note-"+id);
 if(el){
   notes[id]=el.value;
   localStorage.setItem("et_notes_v2", JSON.stringify(notes));
}
}

function renderNotes(){
  const el=document.getElementById("notesList");
  el.innerHTML="";
  const entries=Object.entries(notes).filter(([k,v])=>v && v.trim());
  if(!entries.length){el.innerHTML='<div class="empty">هنوز یادداشتی ثبت نشده است.</div>'; return;}
  entries.forEach(([id,note])=>{
    const item=plan.find(x=>x.id==id);
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=`<div class="badge">${item.week ? 'هفته '+item.week : ''}</div><div class="course-title">${item.icon} ${item.course}</div><div class="meta">${note.replace(/</g,'&lt;')}</div><div style="display:flex;gap:8px;margin-top:10px"><button class="smallbtn" onclick="editNote(${id})">ویرایش</button><button class="smallbtn alt" onclick="deleteNote(${id})">حذف</button></div>`;
    el.appendChild(d);
  });
}

function deleteNote(id){
 if(confirm('یادداشت حذف شود؟')){
   delete notes[id];
   save();
   renderNotes();
   renderList();
 }
}
function editNote(id){
 const v=prompt('ویرایش یادداشت', notes[id]||'');
 if(v!==null){
   notes[id]=v;
   save();
   renderNotes();
   renderList();
 }
}

function toggleDone(id){
  done[id]=!done[id];
  save();
  updateCardDoneState(id);
  renderSummary();
  updateProgress();
}
function setNote(id, val){ notes[id]=val; save(); }
function updateProgress(){
  const c=Object.values(done).filter(Boolean).length;
  const p=Math.round(c/plan.length*100);
  document.getElementById("doneCount").textContent=c;
  document.getElementById("percent").textContent=p+"٪";
  document.getElementById("bar").style.width=p+"%";
}


function openImage(src){
  document.getElementById("modalImage").src=src;
  document.getElementById("imageModal").classList.add("active");
}
function closeImage(){
  document.getElementById("imageModal").classList.remove("active");
  document.getElementById("modalImage").src="";
}



const searchInput=document.getElementById("search");
if(searchInput){
  searchInput.addEventListener("input", debounce(renderList, 250));
}

const listElement=document.getElementById("list");
if(listElement){
  listElement.addEventListener("click", event=>{
    const doneButton=event.target.closest(".done-toggle");
    if(doneButton){
      toggleDone(Number(doneButton.dataset.id));
      return;
    }
    const saveButton=event.target.closest(".note-save");
    if(saveButton){
      saveNote(Number(saveButton.dataset.id));
      showNoteToast();
    }
  });
}

initTabs(); renderSummary(); renderList(); updateProgress();

(function activateRequestedView(){
  const params=new URLSearchParams(location.search);
  let storedView="";
  try { storedView=sessionStorage.getItem("editorsTeam.returnView")||""; sessionStorage.removeItem("editorsTeam.returnView"); } catch (_) {}
  const requested=(params.get("view")||location.hash.replace(/^#/,"")||storedView).trim();
  if(!requested) return;
  const target=document.getElementById(requested);
  if(!target || !target.classList.contains("view")) return;
  const btn=[...document.querySelectorAll(".navbtn")].find(b=>{
    const oc=b.getAttribute("onclick")||"";
    return oc.includes(`showView('${requested}'`) || oc.includes(`showView(\"${requested}\"`);
  });
  if(btn) showView(requested,btn);
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=8.0.0", { updateViaCache: "none" });
      await registration.update();
    } catch (_) {}
  });
}
