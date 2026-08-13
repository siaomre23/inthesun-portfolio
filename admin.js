const PASS_KEY = 'site_admin_pass';
const CONTENT_KEY = 'site_content';

function getContent(){
  try{
    const saved = localStorage.getItem(CONTENT_KEY);
    if(saved) return JSON.parse(saved);
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
}
function saveContent(c){ localStorage.setItem(CONTENT_KEY, JSON.stringify(c)); }

/* ---------- password gate ---------- */
function initGate(){
  const hasPass = !!localStorage.getItem(PASS_KEY);
  const title = document.getElementById('gate-title');
  const hint = document.getElementById('gate-hint');
  const input = document.getElementById('pass-input');
  const btn = document.getElementById('gate-btn');

  if(hasPass){
    title.textContent = 'Enter password';
    hint.textContent = 'This browser has an admin password set.';
  }

  btn.addEventListener('click', unlock);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') unlock(); });

  function unlock(){
    const val = input.value.trim();
    if(!val){ return; }
    if(!hasPass){
      localStorage.setItem(PASS_KEY, btoa(val));
      openAdmin();
      return;
    }
    if(btoa(val) === localStorage.getItem(PASS_KEY)){
      openAdmin();
    }else{
      hint.textContent = 'Wrong password. Try again.';
      hint.style.color = '#E63946';
      input.value = '';
    }
  }
}

function openAdmin(){
  document.getElementById('gate').style.display = 'none';
  document.getElementById('admin-wrap').classList.add('active');
  loadFormFromContent(getContent());
}

/* ---------- form population ---------- */
let state;

function loadFormFromContent(c){
  state = JSON.parse(JSON.stringify(c));
  document.getElementById('f-name').value = state.name;
  document.getElementById('f-tagline').value = state.tagline;
  document.getElementById('f-heroSub').value = state.heroSub;
  document.getElementById('f-about').value = state.about;
  document.getElementById('f-accent').value = state.accent || '#C1121F';

  renderJourney();
  renderInterests();
  renderSkills();
  renderContacts();
}

function renderJourney(){
  const wrap = document.getElementById('journey-list');
  wrap.innerHTML = '';
  state.journey.forEach((j,i)=>{
    const div = document.createElement('div');
    div.className = 'repeat-item';
    div.innerHTML = `
      <span class="remove" data-i="${i}">remove</span>
      <div class="row">
        <div><label>Year</label><input type="text" data-field="year" data-i="${i}" value="${escapeHtml(j.year)}"></div>
        <div><label>Description</label><input type="text" data-field="label" data-i="${i}" value="${escapeHtml(j.label)}"></div>
      </div>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('.remove').forEach(el=>el.addEventListener('click', e=>{
    state.journey.splice(+e.target.dataset.i,1); renderJourney();
  }));
  wrap.querySelectorAll('input').forEach(el=>el.addEventListener('input', e=>{
    state.journey[+e.target.dataset.i][e.target.dataset.field] = e.target.value;
  }));
}

function renderInterests(){
  const wrap = document.getElementById('interests-list');
  wrap.innerHTML = '';
  state.interests.forEach((val,i)=>{
    const div = document.createElement('div');
    div.className = 'repeat-item';
    div.innerHTML = `<span class="remove" data-i="${i}">remove</span>
      <input type="text" data-i="${i}" value="${escapeHtml(val)}">`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('.remove').forEach(el=>el.addEventListener('click', e=>{
    state.interests.splice(+e.target.dataset.i,1); renderInterests();
  }));
  wrap.querySelectorAll('input').forEach(el=>el.addEventListener('input', e=>{
    state.interests[+e.target.dataset.i] = e.target.value;
  }));
}

function renderSkills(){
  const wrap = document.getElementById('skills-list-admin');
  wrap.innerHTML = '';
  state.skills.forEach((s,i)=>{
    const div = document.createElement('div');
    div.className = 'repeat-item';
    div.innerHTML = `
      <span class="remove" data-i="${i}">remove</span>
      <div class="row">
        <div><label>Skill</label><input type="text" data-field="name" data-i="${i}" value="${escapeHtml(s.name)}"></div>
        <div><label>Level (0-100)</label><input type="number" min="0" max="100" data-field="level" data-i="${i}" value="${s.level}"></div>
      </div>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('.remove').forEach(el=>el.addEventListener('click', e=>{
    state.skills.splice(+e.target.dataset.i,1); renderSkills();
  }));
  wrap.querySelectorAll('input').forEach(el=>el.addEventListener('input', e=>{
    const field = e.target.dataset.field;
    state.skills[+e.target.dataset.i][field] = field==='level' ? +e.target.value : e.target.value;
  }));
}

function renderContacts(){
  const wrap = document.getElementById('contact-list');
  wrap.innerHTML = '';
  state.contact.forEach((c,i)=>{
    const div = document.createElement('div');
    div.className = 'repeat-item';
    div.innerHTML = `
      <span class="remove" data-i="${i}">remove</span>
      <div class="row">
        <div><label>Label</label><input type="text" data-field="label" data-i="${i}" value="${escapeHtml(c.label)}"></div>
        <div><label>URL (use mailto: for email)</label><input type="text" data-field="url" data-i="${i}" value="${escapeHtml(c.url)}"></div>
      </div>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('.remove').forEach(el=>el.addEventListener('click', e=>{
    state.contact.splice(+e.target.dataset.i,1); renderContacts();
  }));
  wrap.querySelectorAll('input').forEach(el=>el.addEventListener('input', e=>{
    state.contact[+e.target.dataset.i][e.target.dataset.field] = e.target.value;
  }));
}

function escapeHtml(str){
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ---------- actions ---------- */
function initFormActions(){
  document.getElementById('add-journey').addEventListener('click', ()=>{
    state.journey.push({year:'20XX', label:'New moment'}); renderJourney();
  });
  document.getElementById('add-interest').addEventListener('click', ()=>{
    state.interests.push('New interest'); renderInterests();
  });
  document.getElementById('add-skill').addEventListener('click', ()=>{
    state.skills.push({name:'New skill', level:50}); renderSkills();
  });
  document.getElementById('add-contact').addEventListener('click', ()=>{
    state.contact.push({label:'Label', url:'https://'}); renderContacts();
  });

  document.getElementById('admin-form').addEventListener('submit', e=>{
    e.preventDefault();
    state.name = document.getElementById('f-name').value;
    state.tagline = document.getElementById('f-tagline').value;
    state.heroSub = document.getElementById('f-heroSub').value;
    state.about = document.getElementById('f-about').value;
    state.accent = document.getElementById('f-accent').value;
    saveContent(state);
    showStatus('Saved. Open the site to see it live.');
  });

  document.getElementById('export-btn').addEventListener('click', ()=>{
    // sync latest text fields before export
    state.name = document.getElementById('f-name').value;
    state.tagline = document.getElementById('f-tagline').value;
    state.heroSub = document.getElementById('f-heroSub').value;
    state.about = document.getElementById('f-about').value;
    state.accent = document.getElementById('f-accent').value;
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'content.json'; a.click();
    URL.revokeObjectURL(url);
    showStatus('content.json downloaded — replace the old one to deploy these changes elsewhere.');
  });

  document.getElementById('import-btn').addEventListener('click', ()=>{
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      try{
        const parsed = JSON.parse(ev.target.result);
        loadFormFromContent(parsed);
        showStatus('Imported. Click "Save changes" to apply it to this site.');
      }catch(err){
        showStatus('That file could not be read as valid JSON.');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('reset-btn').addEventListener('click', ()=>{
    if(confirm('Reset all content to the original defaults? This cannot be undone.')){
      localStorage.removeItem(CONTENT_KEY);
      loadFormFromContent(DEFAULT_CONTENT);
      showStatus('Reset to defaults. Click "Save changes" to confirm.');
    }
  });
}

function showStatus(msg){
  const el = document.getElementById('status');
  el.textContent = msg;
  setTimeout(()=>{ if(el.textContent===msg) el.textContent=''; }, 5000);
}

document.addEventListener('DOMContentLoaded', ()=>{
  initGate();
  initFormActions();
});
