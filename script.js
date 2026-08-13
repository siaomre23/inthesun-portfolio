async function getContent(){
  // 1. published content.json (what every visitor sees on the live site)
  try{
    const res = await fetch('content.json', {cache:'no-store'});
    if(res.ok) return await res.json();
  }catch(e){}
  // 2. this browser's unpublished local edits (admin preview only)
  try{
    const saved = localStorage.getItem('site_content');
    if(saved) return JSON.parse(saved);
  }catch(e){}
  // 3. hard-coded fallback
  return DEFAULT_CONTENT;
}

function applyAccent(hex){
  document.documentElement.style.setProperty('--accent', hex);
  // derive a lighter hover shade
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const lighten = c => Math.min(255, Math.round(c + (255-c)*0.28));
  const hoverHex = '#' + [lighten(r),lighten(g),lighten(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
  document.documentElement.style.setProperty('--accent-hover', hoverHex);
}

async function render(){
  const c = await getContent();
  document.title = c.name + ' — ' + c.tagline;
  document.getElementById('nav-name').textContent = c.name;
  document.getElementById('hero-name').textContent = c.name;
  document.getElementById('hero-sub').textContent = c.heroSub;
  document.getElementById('hero-tagline').textContent = c.tagline;
  document.getElementById('about-text').textContent = c.about;

  const visual = document.getElementById('about-visual');
  if(c.photo){
    visual.className = 'about-photo';
    visual.innerHTML = `<img src="${c.photo}" alt="${c.name}">`;
  }else{
    visual.className = 'about-mark';
    visual.textContent = '"';
  }

  // interests
  const ig = document.getElementById('interest-grid');
  ig.innerHTML = '';
  c.interests.forEach(i=>{
    const d = document.createElement('div');
    d.className = 'interest-card';
    d.innerHTML = `<span>${i}</span>`;
    ig.appendChild(d);
  });

  // skills
  const sl = document.getElementById('skills-list');
  sl.innerHTML = '';
  c.skills.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `<div class="name">${s.name}</div>
      <div class="skill-track"><div class="skill-fill" data-level="${s.level}"></div></div>
      <div class="pct">${s.level}%</div>`;
    sl.appendChild(row);
  });

  // contact
  const cl = document.getElementById('contact-links');
  cl.innerHTML = '';
  c.contact.forEach(link=>{
    const a = document.createElement('a');
    a.href = link.url; a.textContent = link.label;
    if(!link.url.startsWith('mailto:')) a.target = '_blank';
    cl.appendChild(a);
  });

  applyAccent(c.accent || '#C1121F');
  document.getElementById('accent-range').value = hexToSliderVal(c.accent || '#C1121F');

  buildOrbit(c.journey);
  document.getElementById('year-now').textContent = new Date().getFullYear();
}

/* --- accent slider: maps 0-100 between dark red and bright red --- */
function sliderValToHex(v){
  const dark = [0x6e,0x0a,0x11];   // dark red
  const bright = [0xff,0x2a,0x3a]; // bright red
  const t = v/100;
  const rgb = dark.map((c,i)=> Math.round(c + (bright[i]-c)*t));
  return '#'+rgb.map(x=>x.toString(16).padStart(2,'0')).join('');
}
function hexToSliderVal(hex){
  // rough inverse: use red channel distance
  const r = parseInt(hex.slice(1,3),16);
  return Math.max(0, Math.min(100, Math.round(((r-0x6e)/(0xff-0x6e))*100)));
}

function initAccentSlider(){
  // Visitor-side live preview only (dark red <-> bright red).
  // Not persisted: the published accent color always comes from content.json,
  // set once by you in the admin panel.
  const range = document.getElementById('accent-range');
  range.addEventListener('input', e=>{
    applyAccent(sliderValToHex(e.target.value));
  });
}

/* --- orbital timeline (signature element) --- */
function buildOrbit(journey){
  const svg = document.getElementById('orbit-svg');
  const w = 1000, h = 320;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const cx = w/2, cy = h/2 + 40, rx = w/2 - 60, ry = 70;
  const n = journey.length;
  let path = `M ${cx-rx} ${cy}`;
  path += ` A ${rx} ${ry} 0 0 1 ${cx+rx} ${cy}`;

  let nodesHTML = '';
  journey.forEach((j,i)=>{
    const t = n===1 ? 0.5 : i/(n-1);
    const angle = Math.PI - t*Math.PI; // sweep top arc
    const x = cx + rx*Math.cos(angle);
    const y = cy - ry*Math.sin(angle);
    nodesHTML += `
      <g class="orbit-node" data-i="${i}" transform="translate(${x},${y})">
        <circle r="7"></circle>
        <text class="year" x="0" y="-18" text-anchor="middle">${j.year}</text>
        <text class="label" x="0" y="34" text-anchor="middle">${j.label}</text>
      </g>`;
  });

  svg.innerHTML = `<path id="orbit-line" class="orbit-path" d="${path}"></path>` + nodesHTML;

  const line = document.getElementById('orbit-line');
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  line.style.strokeDashoffset = len;
  line.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)';

  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        line.style.strokeDashoffset = 0;
        line.classList.add('drawn');
        document.querySelectorAll('.orbit-node').forEach((node,i)=>{
          setTimeout(()=> node.classList.add('in'), 200 + i*180);
        });
        io.disconnect();
      }
    });
  }, {threshold:.4});
  io.observe(document.querySelector('.journey-wrap'));
}

/* --- scroll reveal for generic sections --- */
function initReveals(){
  const items = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  },{threshold:.2});
  items.forEach(i=>io.observe(i));
}

/* --- skill bar fill on view --- */
function initSkillBars(){
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.querySelectorAll('.skill-fill').forEach(f=>{
          f.style.width = f.dataset.level + '%';
        });
        io.unobserve(e.target);
      }
    });
  },{threshold:.3});
  const sl = document.getElementById('skills-list');
  if(sl) io.observe(sl);
}

/* --- ambient particle field behind hero, faint drifting points w/ constellation lines --- */
function initParticles(){
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let w,h,points;
  function resize(){
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  function makePoints(){
    const count = Math.floor((w*h)/16000);
    points = Array.from({length:count},()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-.5)*.15, vy:(Math.random()-.5)*.15
    }));
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C1121F';
    points.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
    });
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const dx=points[i].x-points[j].x, dy=points[i].y-points[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){
          ctx.strokeStyle = `rgba(193,18,31,${(1-d/110)*0.15})`;
          ctx.beginPath(); ctx.moveTo(points[i].x,points[i].y); ctx.lineTo(points[j].x,points[j].y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(234,234,234,0.5)';
    points.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x,p.y,1.1,0,Math.PI*2); ctx.fill(); });
    requestAnimationFrame(tick);
  }
  resize(); makePoints(); tick();
  window.addEventListener('resize', ()=>{ resize(); makePoints(); });
}

document.addEventListener('DOMContentLoaded', ()=>{
  render();
  initAccentSlider();
  initReveals();
  initSkillBars();
  initParticles();
});
