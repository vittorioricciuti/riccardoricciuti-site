const state = { publications: [], congresses: [], profile: null, shownPubs: 8, shownActivities: 8, filter: 'Tutte', query: '' };
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
async function loadJson(path){ const res = await fetch(path); if(!res.ok) throw new Error(path); return res.json(); }
function el(tag, cls, html){ const n=document.createElement(tag); if(cls) n.className=cls; if(html!==undefined) n.innerHTML=html; return n; }
function renderProfile(){
  const p = state.profile;
  $('#stats').innerHTML = p.stats.map(s=>`<div class="credential"><strong>${s.value}</strong><span>${s.label}</span></div>`).join('');
  $('#profileText').innerHTML = p.profileText.map(t=>`<p>${t}</p>`).join('');
  $('#highlights').innerHTML = p.highlights.map(h=>`<span class="badge">${h}</span>`).join('');
}
function renderAreas(){
  const grid = $('#areasGrid');
  grid.innerHTML = state.profile.areas.map((a,i)=>`<article class="area-card ${a.priority?'priority':''} reveal">
    <div class="area-head" role="button" tabindex="0" aria-expanded="false">
      <div><div class="kicker">${a.kicker}</div><h3>${a.title}</h3><p class="area-summary">${a.summary}</p></div><div class="area-toggle">+</div>
    </div>
    <div class="area-details"><ul class="detail-list">${a.details.map(d=>`<li>${d}</li>`).join('')}</ul><div class="tags">${a.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div></div>
  </article>`).join('');
  $$('.area-head').forEach(head=>{
    const card=head.closest('.area-card');
    function toggle(){ card.classList.toggle('open'); const open=card.classList.contains('open'); head.setAttribute('aria-expanded', open); card.querySelector('.area-toggle').textContent=open?'−':'+'; }
    head.addEventListener('click',toggle); head.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }});
  });
}
function renderBooking(items){
  $('#bookingGrid').innerHTML = items.map(b=>`<article class="booking-card reveal"><div class="type">${b.type}</div><h3>${b.name}</h3><p>${b.description}</p><div class="booking-lines"><span>${b.address}</span><a href="tel:${b.phoneHref}">${b.phone}</a><a href="mailto:${b.email}">${b.email}</a></div><a class="btn" target="_blank" rel="noopener" href="${b.url}">Vai alla scheda</a></article>`).join('');
}
function publicationTags(){
  const tags = new Set(['Tutte']);
  state.publications.forEach(p => (p.tags||[]).forEach(t=>tags.add(t)));
  return [...tags].slice(0,12);
}
function renderPubFilters(){
  $('#pubFilters').innerHTML = publicationTags().map(t=>`<button class="filter-btn ${t===state.filter?'active':''}" data-filter="${t}">${t}</button>`).join('');
  $$('#pubFilters button').forEach(btn=>btn.addEventListener('click',()=>{ state.filter=btn.dataset.filter; state.shownPubs=8; renderPubFilters(); renderPublications(); }));
}
function filteredPubs(){
  const q = state.query.toLowerCase().trim();
  return state.publications.filter(p=>{
    const matchesFilter = state.filter==='Tutte' || (p.tags||[]).includes(state.filter);
    const text = `${p.title} ${p.authors} ${p.journal} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return matchesFilter && (!q || text.includes(q));
  });
}
function renderPublications(){
  const pubs = filteredPubs();
  $('#publicationList').innerHTML = pubs.slice(0,state.shownPubs).map(p=>`<article class="pub-item reveal"><div class="pub-year">${p.year}</div><div><div class="pub-title">${p.title}</div><div class="pub-meta">${p.authors}<br>${p.journal||''}</div><div class="pub-links">${p.doiUrl?`<a target="_blank" rel="noopener" href="${p.doiUrl}">DOI</a>`:''}<a target="_blank" rel="noopener" href="${p.pubmedSearchUrl||('https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(p.title))}">PubMed</a>${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div></article>`).join('');
  $('#showMorePublications').style.display = state.shownPubs < pubs.length ? 'inline-flex' : 'none';
  observeReveals();
}
function renderActivities(){
  const list = state.congresses.slice(0,state.shownActivities);
  $('#timeline').innerHTML = list.map(c=>`<article class="timeline-item reveal"><div class="timeline-year">${c.year}</div><div><h3>${c.title}</h3><div class="timeline-meta">${c.place||''} · ${c.role||''}</div><p>${c.topic||''}</p>${c.url?`<div class="pub-links"><a target="_blank" rel="noopener" href="${c.url}">Link</a></div>`:''}</div></article>`).join('');
  $('#showMoreActivities').style.display = state.shownActivities < state.congresses.length ? 'inline-flex' : 'none';
}
function renderNews(items){
  $('#newsGrid').innerHTML = items.map(n=>`<article class="news-card reveal"><div class="source">${n.source} · ${n.year}</div><h3>${n.title}</h3><p>${n.description}</p><a target="_blank" rel="noopener" href="${n.url}">Apri contenuto →</a></article>`).join('');
}
function observeReveals(){
  const io = new IntersectionObserver(entries => entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }}), {threshold:.08});
  $$('.reveal:not(.visible)').forEach(el=>io.observe(el));
}
function setupNav(){
  const btn=$('.nav-toggle'), nav=$('.site-nav');
  btn.addEventListener('click',()=>{ const open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open); });
  $$('.site-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
}
async function init(){
  setupNav();
  const [profile, publications, congresses, booking, news] = await Promise.all([loadJson('data/profile.json'),loadJson('data/publications.json'),loadJson('data/congresses.json'),loadJson('data/booking.json'),loadJson('data/news.json')]);
  state.profile=profile; state.publications=publications.sort((a,b)=>String(b.year).localeCompare(String(a.year))); state.congresses=congresses; renderProfile(); renderAreas(); renderBooking(booking); renderPubFilters(); renderPublications(); renderActivities(); renderNews(news); observeReveals();
  $('#pubSearch').addEventListener('input',e=>{ state.query=e.target.value; state.shownPubs=8; renderPublications(); });
  $('#showMorePublications').addEventListener('click',()=>{ state.shownPubs += 50; renderPublications(); });
  $('#showMoreActivities').addEventListener('click',()=>{ state.shownActivities += 50; renderActivities(); observeReveals(); });
}
init().catch(err=>{ console.error(err); document.body.insertAdjacentHTML('afterbegin','<div style="padding:12px;background:#fee;border-bottom:1px solid #faa">Errore nel caricamento dei dati del sito.</div>') });
