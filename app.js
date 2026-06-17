const state = { publications: [], congresses: [], profile: null, shownPubs: 8, shownActivities: 8, filter: 'Tutte', query: '' };
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

async function loadJson(path, fallback = null){
  const url = `${path}?v=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Impossibile caricare ${path}`, err);
    return fallback;
  }
}
function el(tag, cls, html){ const n=document.createElement(tag); if(cls) n.className=cls; if(html!==undefined) n.innerHTML=html; return n; }
function safeText(v){ return v == null ? '' : String(v); }
function renderProfile(){
  const p = state.profile;
  const profileText = $('#profileText');
  const highlights = $('#highlights');
  if(profileText) profileText.innerHTML = (p.profileText||[]).map(t=>`<p>${t}</p>`).join('');
  if(highlights) highlights.innerHTML = (p.highlights||[]).map(h=>`<span class="badge">${h}</span>`).join('');
}
function renderAreas(){
  const grid = $('#areasGrid'); if(!grid) return;
  grid.innerHTML = (state.profile.areas||[]).map((a,i)=>`<article class="area-card ${a.priority?'priority':''} reveal">
    <div class="area-head" role="button" tabindex="0" aria-expanded="false">
      <div><div class="kicker">${safeText(a.kicker)}</div><h3>${safeText(a.title)}</h3><p class="area-summary">${safeText(a.summary)}</p></div><div class="area-toggle">+</div>
    </div>
    <div class="area-details"><ul class="detail-list">${(a.details||[]).map(d=>`<li>${d}</li>`).join('')}</ul><div class="tags">${(a.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div>
  </article>`).join('');
  $$('.area-head').forEach(head=>{
    const card=head.closest('.area-card');
    function toggle(){ card.classList.toggle('open'); const open=card.classList.contains('open'); head.setAttribute('aria-expanded', open); card.querySelector('.area-toggle').textContent=open?'−':'+'; }
    head.addEventListener('click',toggle); head.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }});
  });
}
function renderBooking(items){
  const grid = $('#bookingGrid'); if(!grid) return;
  grid.innerHTML = (items||[]).map(b=>`<article class="booking-card reveal"><div class="type">${safeText(b.type)}</div><h3>${safeText(b.name)}</h3><p>${safeText(b.description)}</p><div class="booking-lines"><span>${safeText(b.address)}</span>${b.phoneHref?`<a href="tel:${b.phoneHref}">${safeText(b.phone)}</a>`:''}${b.email?`<a href="mailto:${b.email}">${safeText(b.email)}</a>`:''}</div>${b.url?`<a class="btn" target="_blank" rel="noopener" href="${b.url}">Vai alla scheda</a>`:''}</article>`).join('');
}
function publicationTags(){
  const tags = new Set(['Tutte']);
  state.publications.forEach(p => (p.tags||[]).forEach(t=>tags.add(t)));
  return [...tags].slice(0,12);
}
function renderPubFilters(){
  const box = $('#pubFilters'); if(!box) return;
  box.innerHTML = publicationTags().map(t=>`<button class="filter-btn ${t===state.filter?'active':''}" data-filter="${t}">${t}</button>`).join('');
  $$('#pubFilters button').forEach(btn=>btn.addEventListener('click',()=>{ state.filter=btn.dataset.filter; state.shownPubs=8; renderPubFilters(); renderPublications(); }));
}
function filteredPubs(){
  const q = state.query.toLowerCase().trim();
  return state.publications.filter(p=>{
    const matchesFilter = state.filter==='Tutte' || (p.tags||[]).includes(state.filter);
    const text = `${safeText(p.title)} ${safeText(p.authors)} ${safeText(p.journal)} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return matchesFilter && (!q || text.includes(q));
  });
}
function renderPublications(){
  const list = $('#publicationList'); if(!list) return;
  const pubs = filteredPubs();
  list.innerHTML = pubs.slice(0,state.shownPubs).map(p=>`<article class="pub-item reveal"><div class="pub-year">${safeText(p.year)}</div><div><div class="pub-title">${safeText(p.title)}</div><div class="pub-meta">${safeText(p.authors)}${p.authors?'<br>':''}${safeText(p.journal)}</div><div class="pub-links">${p.doiUrl?`<a target="_blank" rel="noopener" href="${p.doiUrl}">DOI</a>`:''}<a target="_blank" rel="noopener" href="${p.pubmedSearchUrl||('https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(safeText(p.title)))}">PubMed</a>${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div></article>`).join('');
  const more = $('#showMorePublications'); if(more) more.style.display = state.shownPubs < pubs.length ? 'inline-flex' : 'none';
  observeReveals();
}
function renderActivities(){
  const timeline = $('#timeline'); if(!timeline) return;
  const list = state.congresses.slice(0,state.shownActivities);
  timeline.innerHTML = list.map(c=>`<article class="timeline-item reveal"><div class="timeline-year">${safeText(c.year)}</div><div><h3>${safeText(c.title)}</h3><div class="timeline-meta">${safeText(c.place)}${c.place&&c.role?' · ':''}${safeText(c.role)}</div><p>${safeText(c.topic)}</p>${c.url?`<div class="pub-links"><a target="_blank" rel="noopener" href="${c.url}">Link</a></div>`:''}</div></article>`).join('');
  const more = $('#showMoreActivities'); if(more) more.style.display = state.shownActivities < state.congresses.length ? 'inline-flex' : 'none';
}
function renderNews(items){
  const grid = $('#newsGrid'); if(!grid) return;
  grid.innerHTML = (items||[]).map(n=>`<article class="news-card reveal"><div class="source">${safeText(n.source)}${n.year?' · '+safeText(n.year):''}</div><h3>${safeText(n.title)}</h3><p>${safeText(n.description)}</p>${n.url?`<a target="_blank" rel="noopener" href="${n.url}">Apri contenuto →</a>`:''}</article>`).join('');
}
function observeReveals(){
  if(!('IntersectionObserver' in window)){ $$('.reveal').forEach(el=>el.classList.add('visible')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }}), {threshold:.08});
  $$('.reveal:not(.visible)').forEach(el=>io.observe(el));
}
function setupNav(){
  const btn=$('.nav-toggle'), nav=$('.site-nav');
  if(!btn || !nav) return;
  btn.addEventListener('click',()=>{ const open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open); });
  $$('.site-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
}
function sortPublications(items){
  return (Array.isArray(items) ? items : []).sort((a,b)=>{
    const ya = parseInt(String(a.year||'0').match(/\d{4}/)?.[0] || '0', 10);
    const yb = parseInt(String(b.year||'0').match(/\d{4}/)?.[0] || '0', 10);
    return yb - ya;
  });
}
async function init(){
  setupNav();
  const [profile, publications, congresses, booking, news] = await Promise.all([
    loadJson('data/profile.json', null),
    loadJson('data/publications.json', []),
    loadJson('data/congresses.json', []),
    loadJson('data/booking.json', []),
    loadJson('data/news.json', [])
  ]);
  if(!profile){
    document.body.insertAdjacentHTML('afterbegin','<div style="padding:12px;background:#fee;border-bottom:1px solid #faa">Errore nel caricamento del profilo. Controllare che il file data/profile.json sia presente.</div>');
    return;
  }
  state.profile=profile;
  state.publications=sortPublications(publications);
  state.congresses=Array.isArray(congresses) ? congresses : [];
  renderProfile(); renderAreas(); renderBooking(Array.isArray(booking)?booking:[]); renderPubFilters(); renderPublications(); renderActivities(); renderNews(Array.isArray(news)?news:[]); observeReveals();
  const pubSearch = $('#pubSearch'); if(pubSearch) pubSearch.addEventListener('input',e=>{ state.query=e.target.value; state.shownPubs=8; renderPublications(); });
  const showPubs = $('#showMorePublications'); if(showPubs) showPubs.addEventListener('click',()=>{ state.shownPubs += 50; renderPublications(); });
  const showActs = $('#showMoreActivities'); if(showActs) showActs.addEventListener('click',()=>{ state.shownActivities += 50; renderActivities(); observeReveals(); });
}
init().catch(err=>{ console.error(err); document.body.insertAdjacentHTML('afterbegin','<div style="padding:12px;background:#fee;border-bottom:1px solid #faa">Errore imprevisto nel caricamento del sito.</div>') });
