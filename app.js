(function() {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[TimeTracker] init DOM ready');
    try {


// ------------------ Constants & state ------------------
const STORE_KEY = 'tt_entries_v1';
const SETTINGS_KEY = 'tt_settings_v1';

let entries = loadEntries();
let editingId = null;
const settings = loadSettings();

// Cloud (Vercel KV) optional
let CLOUD_KEY = localStorage.getItem('tt_cloud_key') || '';

// ------------------ Utils ------------------
const pad = n => String(n).padStart(2,'0');
function hmToMin(hm){ if(!hm) return 0; const [h,m] = hm.split(':').map(Number); return h*60 + m; }
function minToHM(min){ const h = Math.floor(Math.abs(min)/60); const m = Math.abs(min)%60; return `${min<0?'-':''}${h}h${pad(m)}`; }
function toDateKey(d){ return d.toISOString().slice(0,10); }
function mondayOf(d){ const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = (x.getUTCDay()+6)%7; x.setUTCDate(x.getUTCDate()-day); return x; }
function weekRangeOf(dateStr){ const d = new Date(dateStr + 'T12:00:00Z'); const m = mondayOf(d); const s = toDateKey(m); const e = new Date(m); e.setUTCDate(m.getUTCDate()+6); return {start:s,end:toDateKey(e)}; }

function loadEntries(){ try{ return JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); }catch{ return []; } }
function saveEntries(){ localStorage.setItem(STORE_KEY, JSON.stringify(entries)); }
function loadSettings(){ try{ return JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'); }catch{ return {}; } }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

function computeMinutes(entry){
  const a = hmToMin(entry.start), b = hmToMin(entry.lunchStart), c = hmToMin(entry.lunchEnd), d = hmToMin(entry.end);
  if(!entry.lunchStart || !entry.lunchEnd){
    if(!entry.start || !entry.end) return 0;
    return Math.max(0, d-a);
  }
  if(!entry.start || !entry.end) return 0;
  const first = Math.max(0,b-a);
  const second = Math.max(0,d-c);
  return first+second;
}
function sumMinutes(filterFn){ return entries.filter(filterFn).reduce((acc,e)=>acc+computeMinutes(e),0); }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ------------------ DOM ------------------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const dateInput = $('#date');
const startInput = $('#start'); const lStartInput = $('#lunchStart'); const lEndInput = $('#lunchEnd'); const endInput = $('#end'); const notesInput = $('#notes');
const btnToday = $('#btnToday'); const btnSave = $('#btnSave'); const btnClear = $('#btnClear'); const btnDuplicate = $('#btnDuplicate'); const btnDelete = $('#btnDelete');
const weeklyTargetInput = $('#weeklyTarget');
const statDay = $('#statDay'); const statWeek = $('#statWeek'); const statMonth = $('#statMonth'); const statYear = $('#statYear'); const weekProgress = $('#weekProgress');
const tbody = $('#tbody'); const sumWeek = $('#sumWeek'); const sumMonth = $('#sumMonth'); const sumYear = $('#sumYear'); const sumAll = $('#sumAll'); const deltaWeek = $('#deltaWeek'); const deltaMonth = $('#deltaMonth'); const deltaYear = $('#deltaYear'); const entriesCount = $('#entriesCount');
const weekLabel = $('#weekLabel'); const monthLabel = $('#monthLabel'); const yearLabel = $('#yearLabel');
const btnExportJSON = $('#btnExportJSON'); const btnExportCSV = $('#btnExportCSV'); const btnExportYAML = $('#btnExportYAML'); const fileImport = $('#fileImport');
const prevPeriod = $('#prevPeriod'); const nextPeriod = $('#nextPeriod');
const weekPicker = $('#weekPicker'); const monthPicker = $('#monthPicker'); const yearPicker = $('#yearPicker');
const btnCloudKey = $('#btnCloudKey'); const btnCloudLoad = $('#btnCloudLoad'); const btnCloudSave = $('#btnCloudSave');

// ------------------ Period filtering (independent) ------------------
let currentFilter = 'week';
let periodAnchorKey = toDateKey(new Date());

function openPicker(el){ if(!el) return; if(el.showPicker) el.showPicker(); else { el.style.display='inline-block'; el.focus(); el.click(); } }

weekLabel.addEventListener('click', ()=>{ currentFilter='week';  render(); openPicker(weekPicker); });
monthLabel.addEventListener('click', ()=>{ currentFilter='month'; render(); openPicker(monthPicker); });
yearLabel.addEventListener('click', ()=>{ currentFilter='year';  render(); yearPicker.style.display='inline-block'; yearPicker.focus(); });

function isoWeekStart(value){ // value ex: "2025-W46"
  const [y,wStr] = value.split('-W'); const yNum = +y, w = +wStr; const jan4 = new Date(Date.UTC(yNum,0,4));
  const jan4Dow = (jan4.getUTCDay()+6)%7; const mondayWeek1 = new Date(jan4); mondayWeek1.setUTCDate(jan4.getUTCDate()-jan4Dow);
  const mondayTarget = new Date(mondayWeek1); mondayTarget.setUTCDate(mondayWeek1.getUTCDate()+(w-1)*7); return mondayTarget;
}

if(weekPicker){ weekPicker.addEventListener('change', ()=>{ if(!weekPicker.value) return; const d = isoWeekStart(weekPicker.value); periodAnchorKey = toDateKey(d); render(); }); }
if(monthPicker){ monthPicker.addEventListener('change', ()=>{ if(!monthPicker.value) return; const [yy,mm] = monthPicker.value.split('-').map(Number); const d = new Date(Date.UTC(yy,mm-1,1)); periodAnchorKey = toDateKey(d); render(); }); }
if(yearPicker){ yearPicker.addEventListener('change', ()=>{ const y = parseInt(yearPicker.value,10); if(!isFinite(y)) return; const d = new Date(Date.UTC(y,0,1)); periodAnchorKey = toDateKey(d); render(); }); }

function shiftAnchor(delta){
  const d = new Date(periodAnchorKey+'T12:00:00Z');
  if(currentFilter==='week') d.setUTCDate(d.getUTCDate()+7*delta);
  else if(currentFilter==='month') d.setUTCMonth(d.getUTCMonth()+delta);
  else d.setUTCFullYear(d.getUTCFullYear()+delta);
  periodAnchorKey = toDateKey(d); render();
}
if(prevPeriod) prevPeriod.addEventListener('click', ()=> shiftAnchor(-1));
if(nextPeriod) nextPeriod.addEventListener('click', ()=> shiftAnchor(+1));

// ------------------ Init ------------------
if(!dateInput.value) dateInput.valueAsNumber = Date.now() - (new Date()).getTimezoneOffset()*60000;
weeklyTargetInput.value = settings.weeklyTarget ?? 35;

// Init pickers from current anchor
(function initPickers(){ const d = new Date(periodAnchorKey+'T12:00:00Z'); const y = d.getUTCFullYear(); const m = String(d.getUTCMonth()+1).padStart(2,'0');
  if(monthPicker) monthPicker.value = `${y}-${m}`; if(yearPicker) yearPicker.value = String(y);
  if(weekPicker){ const onejan = new Date(Date.UTC(y,0,1)); const week = Math.ceil((((d-onejan)/86400000) + onejan.getUTCDay()+1)/7); weekPicker.value = `${y}-W${String(week).padStart(2,'0')}`; }
})();

// ------------------ Form live stats ------------------
;[startInput, lStartInput, lEndInput, endInput, dateInput].forEach(i=> i.addEventListener('input', updateLiveStats));
btnToday.addEventListener('click', ()=>{ dateInput.valueAsNumber = Date.now() - (new Date()).getTimezoneOffset()*60000; updateLiveStats(); });
btnDuplicate.addEventListener('click', duplicateYesterday);

btnSave.addEventListener('click', ()=>{
  const e = collectForm();
  if(!e.date){ alert('Choisis une date.'); return; }
  if(!(e.start && e.end)) { if(!confirm('Heures d\\'arrivée et de départ non complètes. Enregistrer quand même ?')) return; }
  if(editingId){ const idx = entries.findIndex(x=>x.id===editingId); if(idx>-1) entries[idx] = {...entries[idx], ...e}; }
  else { const existingIdx = entries.findIndex(x=>x.date===e.date); if(existingIdx>-1) entries.splice(existingIdx,1); entries.push({ id: crypto.randomUUID(), ...e }); }
  entries.sort((a,b)=> a.date.localeCompare(b.date)); saveEntries(); clearForm(); render();
});

btnDelete.addEventListener('click', ()=>{ if(!editingId) return; const idx = entries.findIndex(x=>x.id===editingId); if(idx>-1){ entries.splice(idx,1); saveEntries(); } clearForm(); render(); });
btnClear.addEventListener('click', clearForm);

weeklyTargetInput.addEventListener('change', ()=>{ const v = parseFloat(weeklyTargetInput.value||'35'); settings.weeklyTarget = isFinite(v)? v : 35; saveSettings(); render(); });

btnExportJSON.addEventListener('click', ()=> download('timetracker.json', JSON.stringify(entries, null, 2)));
btnExportCSV.addEventListener('click', ()=> download('timetracker.csv', toCSV(entries)));
btnExportYAML.addEventListener('click', ()=> download('timetracker.yaml', toYAML(entries)));
fileImport.addEventListener('change', importFile);

// ------------------ Core functions ------------------
function collectForm(){ return { date: dateInput.value || null, start: startInput.value || '', lunchStart: lStartInput.value || '', lunchEnd: lEndInput.value || '', end: endInput.value || '', notes: (notesInput.value||'').trim() }; }
function clearForm(){ editingId = null; startInput.value = lStartInput.value = lEndInput.value = endInput.value = notesInput.value = ''; btnDelete.style.display = 'none'; updateLiveStats(); }

function duplicateYesterday(){
  const d = new Date(dateInput.value? dateInput.value+'T12:00:00' : new Date()); d.setDate(d.getDate()-1);
  const key = toDateKey(d);
  const y = entries.find(e=>e.date===key);
  if(!y){ alert('Aucune saisie la veille.'); return; }
  startInput.value = y.start||''; lStartInput.value = y.lunchStart||''; lEndInput.value = y.lunchEnd||''; endInput.value = y.end||''; notesInput.value = y.notes||'';
  updateLiveStats();
}

function updateLiveStats(){
  const e = collectForm(); const minutes = computeMinutes(e); statDay.textContent = minToHM(minutes);
  const today = e.date || toDateKey(new Date());
  const {start,end} = weekRangeOf(today);
  const weekMin = sumMinutes(x=> x.date>=start && x.date<=end);
  const monthMin = sumMinutes(x=> x.date.slice(0,7) === today.slice(0,7));
  const yearMin = sumMinutes(x=> x.date.slice(0,4) === today.slice(0,4));
  statWeek.textContent = minToHM(weekMin); statMonth.textContent = minToHM(monthMin); statYear.textContent = minToHM(yearMin);
  updateWeekProgress(weekMin);
}
function updateWeekProgress(weekMin){
  const targetMin = (parseFloat(weeklyTargetInput.value||'35')||35)*60;
  const p = Math.max(0, Math.min(100, Math.round(weekMin*100/targetMin)));
  weekProgress.style.width = p + '%';
}

function render(){
  const anchor = periodAnchorKey || toDateKey(new Date());
  const {start:wStart, end:wEnd} = weekRangeOf(anchor);

  [weekLabel, monthLabel, yearLabel].forEach(el=> el.classList.remove('active'));
  (currentFilter==='week'?weekLabel:currentFilter==='month'?monthLabel:yearLabel).classList.add('active');
  if(weekPicker)  weekPicker.style.display  = currentFilter==='week'  ? 'inline-block' : 'none';
  if(monthPicker) monthPicker.style.display = currentFilter==='month' ? 'inline-block' : 'none';
  if(yearPicker)  yearPicker.style.display  = currentFilter==='year'  ? 'inline-block' : 'none';

  weekLabel.textContent  = `Semaine ${wStart} → ${wEnd}`;
  monthLabel.textContent = `Mois ${anchor.slice(0,7)}`;
  yearLabel.textContent  = `Année ${anchor.slice(0,4)}`;

  const inRange = (e)=> currentFilter==='week'  ? (e.date>=wStart && e.date<=wEnd)
                        : currentFilter==='month' ? (e.date.slice(0,7)===anchor.slice(0,7))
                        : (e.date.slice(0,4)===anchor.slice(0,4));

  tbody.innerHTML = '';
  for(const e of entries.filter(inRange)){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.date}</td><td>${e.start||''}</td><td>${e.lunchStart||''}</td><td>${e.lunchEnd||''}</td><td>${e.end||''}</td><td>${minToHM(computeMinutes(e))}</td><td>${escapeHtml(e.notes||'')}</td>`;
    tr.addEventListener('click', ()=>{ editingId = e.id; dateInput.value = e.date; startInput.value = e.start||''; lStartInput.value = e.lunchStart||''; lEndInput.value = e.lunchEnd||''; endInput.value = e.end||''; notesInput.value = e.notes||''; btnDelete.style.display = 'inline-block'; updateLiveStats(); window.scrollTo({top:0, behavior:'smooth'}); });
    tbody.appendChild(tr);
  }

  const weekMin  = sumMinutes(x=> x.date>=wStart && x.date<=wEnd);
  const monthMin = sumMinutes(x=> x.date.slice(0,7) === anchor.slice(0,7));
  const yearMin  = sumMinutes(x=> x.date.slice(0,4) === anchor.slice(0,4));
  const allMin   = sumMinutes(()=>true);

  sumWeek.textContent  = minToHM(weekMin);
  sumMonth.textContent = minToHM(monthMin);
  sumYear.textContent  = minToHM(yearMin);
  sumAll.textContent   = minToHM(allMin);
  entriesCount.textContent = `${entries.length} saisie${entries.length>1?'s':''}`;

  const targetMin = Math.round((parseFloat(weeklyTargetInput.value||'35')||35)*60);
  const weekDelta = weekMin - targetMin;
  deltaWeek.textContent = weekDelta>0 ? `+${minToHM(weekDelta)} vs cible` : '—';
  deltaWeek.className = weekDelta>0 ? 'delta plus' : 'delta';

  const monthTargetMin = Math.round(monthTarget(anchor, parseFloat(weeklyTargetInput.value||'35')||35) * 60);
  const yearTargetMin  = Math.round(yearTarget(anchor,  parseFloat(weeklyTargetInput.value||'35')||35) * 60);
  const monthDelta = monthMin - monthTargetMin; const yearDelta = yearMin - yearTargetMin;
  deltaMonth.textContent = monthDelta>0 ? `+${minToHM(monthDelta)} vs cible` : '—';
  deltaMonth.className = monthDelta>0 ? 'delta plus' : 'delta';
  deltaYear.textContent  = yearDelta>0 ? `+${minToHM(yearDelta)} vs cible` : '—';
  deltaYear.className = yearDelta>0 ? 'delta plus' : 'delta';

  updateWeekProgress(weekMin);
}

function monthTarget(nowKey, weekly){
  const y = +nowKey.slice(0,4); const m = +nowKey.slice(5,7) - 1;
  const first = new Date(Date.UTC(y,m,1)); const last = new Date(Date.UTC(y,m+1,0));
  let countWeeks = 0; let d = new Date(first);
  while(d <= last){ if(d.getUTCDay()===1){ countWeeks++; } d.setUTCDate(d.getUTCDate()+1);}
  return countWeeks * weekly;
}
function yearTarget(nowKey, weekly){
  const y = +nowKey.slice(0,4);
  const weeks = 52 + (isLeapYear(y)? 0.286 : 0.286);
  return weeks * weekly;
}
function isLeapYear(y){ return (y%4===0 && y%100!==0) || (y%400===0); }

// ------------------ Export/Import helpers ------------------
function download(filename, text){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'text/plain'})); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

function toCSV(data){
  const head=['date','start','lunchStart','lunchEnd','end','minutes','notes'];
  const rows=data.map(e=>[e.date,e.start||'',e.lunchStart||'',e.lunchEnd||'',e.end||'',computeMinutes(e),(e.notes||'').replaceAll('"','""')]);
  const csv=[head.join(','),...rows.map(r=>r.map(x=>`"${x}"`).join(','))].join('\n'); return csv;
}

function yamlEscape(str){
  return String(str).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/\r/g,'').replace(/"/g,'\\"');
}
function toYAML(data){
  let out = 'entries:\\n';
  for(const e of data){
    out += '  - date: "'+yamlEscape(e.date)+'"\\n';
    out += '    start: "'+yamlEscape(e.start||'')+'"\\n';
    out += '    lunchStart: "'+yamlEscape(e.lunchStart||'')+'"\\n';
    out += '    lunchEnd: "'+yamlEscape(e.lunchEnd||'')+'"\\n';
    out += '    end: "'+yamlEscape(e.end||'')+'"\\n';
    out += '    notes: "'+yamlEscape(e.notes||'')+'"\\n';
  }
  return out;
}

function parseYAML(text){
  const lines = text.replace(/\r/g,'').split('\n');
  let i=0; const next = ()=> i<lines.length? lines[i++] : null;
  const arr = [];
  let line;
  while((line=next())!==null){ if(line.trim()==='') continue; if(line.trim()==='entries:') break; else throw new Error('Manque la clé racine "entries:"'); }
  let cur=null;
  while((line=next())!==null){
    if(!line.trim()) continue;
    if(/^\s*-\s*/.test(line)){ if(cur) arr.push(cur); cur={}; continue; }
    const m = line.match(/^\s{2,}([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if(!m) continue; const k=m[1]; let v=m[2].trim();
    if(/^".*"$/.test(v)){ v=v.slice(1,-1).replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\\\/g,'\\'); }
    cur[k]=v;
  }
  if(cur) arr.push(cur);
  return arr.map(o=>({ date:o.date||'', start:o.start||'', lunchStart:o.lunchStart||'', lunchEnd:o.lunchEnd||'', end:o.end||'', notes:o.notes||'' }));
}

async function importFile(ev){
  const f = ev.target.files[0]; if(!f) return;
  const text = await f.text(); const lower = f.name.toLowerCase();
  if(lower.endsWith('.json')){
    try{ const arr = JSON.parse(text); if(!Array.isArray(arr)) throw 0; mergeEntries(arr); } catch{ alert('JSON invalide.'); }
  } else if(lower.endsWith('.csv')){
    const arr = parseCSV(text); mergeEntries(arr);
  } else if(lower.endsWith('.yaml') || lower.endsWith('.yml')){
    try{ const arr = parseYAML(text); mergeEntries(arr); } catch(e){ alert('YAML invalide: ' + (e?.message||e)); }
  } else alert('Format non supporté.');
  fileImport.value = ''; render();
}
function parseCSV(csv){
  const lines = csv.split(/\r?\n/).filter(Boolean); const head = lines.shift().split(',').map(s=>s.replaceAll('"','').trim()); const idx = k => head.indexOf(k); const out=[];
  for(const line of lines){
    const cols = line.match(/("(?:[^"]|"")*"|[^,]+)/g).map(s=> s.replace(/^"|"$/g,'').replaceAll('""','"'));
    out.push({ date: cols[idx('date')]||'', start: cols[idx('start')]||'', lunchStart: cols[idx('lunchStart')]||'', lunchEnd: cols[idx('lunchEnd')]||'', end: cols[idx('end')]||'', notes: cols[idx('notes')]||'' });
  }
  return out;
}
function mergeEntries(arr){
  for(const r of arr){
    if(!r.date) continue;
    const idx = entries.findIndex(x=>x.date===r.date);
    const obj = { id: idx>-1? entries[idx].id : crypto.randomUUID(), date: r.date, start: r.start||'', lunchStart: r.lunchStart||'', lunchEnd: r.lunchEnd||'', end: r.end||'', notes: r.notes||'' };
    if(idx>-1) entries[idx]=obj; else entries.push(obj);
  }
  entries.sort((a,b)=> a.date.localeCompare(b.date)); saveEntries();
}

// ------------------ Cloud sync (Vercel KV) ------------------
btnCloudKey.addEventListener('click', ()=>{
  const k = prompt('Entre une clé perso (ex: prenom-email-35h) :', CLOUD_KEY || '');
  if (k !== null) {
    CLOUD_KEY = k.trim();
    localStorage.setItem('tt_cloud_key', CLOUD_KEY);
    alert(CLOUD_KEY ? 'Clé enregistrée ✅' : 'Clé effacée.');
  }
});

btnCloudLoad.addEventListener('click', async ()=>{
  if(!CLOUD_KEY) return alert('Définis d’abord ta clé (Cloud : clé).');
  try{
    const r = await fetch(`/api/data?key=${encodeURIComponent(CLOUD_KEY)}`);
    if(!r.ok) throw new Error('HTTP '+r.status);
    const j = await r.json();
    if(!Array.isArray(j?.entries)) return alert('Aucune donnée (ou format invalide).');
    entries = j.entries.map(e => ({ id: crypto.randomUUID(), ...e }));
    entries.sort((a,b)=> a.date.localeCompare(b.date));
    saveEntries();
    render();
    alert('Chargé depuis le cloud ✅');
  }catch(e){
    alert('Chargement cloud impossible : '+(e?.message||e));
  }
});

btnCloudSave.addEventListener('click', async ()=>{
  if(!CLOUD_KEY) return alert('Définis d’abord ta clé (Cloud : clé).');
  try{
    const payload = { entries: entries.map(({id, ...rest}) => rest) };
    const r = await fetch(`/api/data?key=${encodeURIComponent(CLOUD_KEY)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    alert('Sauvegardé sur le cloud ✅');
  }catch(e){
    alert('Sauvegarde cloud impossible : '+(e?.message||e));
  }
});

// ------------------ Kick off ------------------
render();

    } catch (err) {
      console.error('[TimeTracker] Erreur fatale:', err);
      alert('Erreur JavaScript : ' + err.message);
    }
  });
})();

