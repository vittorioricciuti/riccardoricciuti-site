const state = {
  config: {}, profile: null, publications: [], congresses: [], booking: [], news: [], videos: [], faqs: [], pathway: [],
  shownPubs: 5, shownActivities: 0, filter: 'Tutte', query: ''
};
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const cacheBust = () => `v=${Date.now()}`;

async function loadJson(path, fallback = null){
  try{
    const res = await fetch(`${path}?${cacheBust()}`, {cache:'no-store'});
    if(!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return await res.json();
  }catch(err){
    console.warn(`Impossibile caricare ${path}`, err);
    return fallback;
  }
}

function parseCsv(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"'){
      if(q && n==='"'){ cell+='"'; i++; } else q=!q;
    } else if(c===',' && !q){ row.push(cell); cell=''; }
    else if((c==='\n' || c==='\r') && !q){
      if(c==='\r' && n==='\n') i++;
      row.push(cell); cell='';
      if(row.some(v=>String(v).trim()!=='')) rows.push(row);
      row=[];
    } else cell+=c;
  }
  row.push(cell); if(row.some(v=>String(v).trim()!=='')) rows.push(row);
  if(rows.length<2) return [];
  const headers=rows[0].map(h=>String(h).trim());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h, (r[i] ?? '').trim()])));
}
async function loadCsv(url){
  const res=await fetch(`${url}${url.includes('?')?'&':'?'}${cacheBust()}`, {cache:'no-store'});
  if(!res.ok) throw new Error(`Google Sheet CSV HTTP ${res.status}`);
  return parseCsv(await res.text());
}
function splitPipe(v){ return String(v||'').split('|').map(x=>x.trim()).filter(Boolean); }
function visibleRow(row){ const v=String(row.visible ?? row.pubblica ?? row.online ?? '').trim().toLowerCase(); return !['no','false','0','n','non'].includes(v); }
function normalizeContent(kind, rows){
  return rows.filter(visibleRow).map(r=>{
    if(kind==='news') return { year:r.year||r.anno||'', source:r.source||r.fonte||'', title:r.title||r.titolo||'', description:r.description||r.descrizione||'', url:r.url||r.link||'' };
    if(kind==='congresses') return { year:r.year||r.anno||'', title:r.title||r.titolo||'', place:r.place||r.luogo||r.citta||'', role:r.role||r.ruolo||'', topic:r.topic||r.argomento||r.descrizione||'', url:r.url||r.link||'' };
    if(kind==='videos') return { year:r.year||r.anno||'', source:r.source||r.piattaforma||'Video', title:r.title||r.titolo||'', description:r.description||r.descrizione||'', url:r.url||r.link||'' };
    if(kind==='booking') return { type:r.type||r.tipo||'', name:r.name||r.nome||'', description:r.description||r.descrizione||'', address:r.address||r.indirizzo||'', phone:r.phone||r.telefono||'', phoneHref:r.phoneHref||r.tel_link||'', email:r.email||'', url:r.url||r.link||'' };
    return r;
  });
}
async function loadManaged(kind, localPath){
  const local = await loadJson(localPath, []);
  const url = state.config?.googleSheets?.[kind];
  if(!url) return Array.isArray(local) ? local : [];
  try{
    const rows = await loadCsv(url);
    const normalized = normalizeContent(kind, rows);
    return normalized.length ? normalized : local;
  }catch(err){
    console.warn(`Google Sheet non disponibile per ${kind}; uso dati locali`, err);
    return Array.isArray(local) ? local : [];
  }
}
function el(tag, cls, html){ const n=document.createElement(tag); if(cls) n.className=cls; if(html!==undefined) n.innerHTML=html; return n; }
function safe(v){ return v==null ? '' : String(v); }
function esc(v){ return safe(v).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function renderProfile(){
  const p=state.profile || {};
  $('#profileText').innerHTML = (p.profileText||[]).map(t=>`<p>${esc(t)}</p>`).join('');
  const roles = $('#institutionalRoles');
  if(roles){
    roles.innerHTML = (p.credentials||[]).map(r=>`<article class="institutional-card"><span>${esc(r.label)}</span><strong>${esc(r.title)}</strong><p>${esc(r.text)}</p></article>`).join('');
  }
  const highlights = $('#highlights');
  if(highlights){ highlights.innerHTML = (p.highlights||[]).slice(0,4).map(h=>`<span class="badge">${esc(h)}</span>`).join(''); }
  const links = [
    ['LinkedIn',p.linkedin],['PubMed',p.pubmed],['Scopus',p.scopus],['ORCID',p.orcid]
  ].filter(x=>x[1]);
  $('#profileLinks').innerHTML = links.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`).join('');
  $('#footerLinks').innerHTML = links.slice(0,3).map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>`).join('');
}
function renderAreas(){
  const grid=$('#areasGrid'); if(!grid) return;
  grid.innerHTML = (state.profile?.areas||[]).map(a=>`<article class="area-card reveal">
    <div class="area-head" role="button" tabindex="0" aria-expanded="false">
      <div><div class="kicker">${esc(a.kicker)}</div><h3>${esc(a.title)}</h3><p class="area-summary">${esc(a.summary)}</p></div><div class="area-toggle">+</div>
    </div>
    <div class="area-details"><ul class="detail-list">${(a.details||[]).map(d=>`<li>${esc(d)}</li>`).join('')}</ul><div class="tags">${(a.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>
  </article>`).join('');
  $$('.area-head').forEach(head=>{
    const card=head.closest('.area-card');
    function toggle(){ card.classList.toggle('open'); const open=card.classList.contains('open'); head.setAttribute('aria-expanded', String(open)); card.querySelector('.area-toggle').textContent=open?'−':'+'; }
    head.addEventListener('click', toggle); head.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); }});
  });
}
function renderPathway(){
  const box=$('#pathwayList'); if(!box) return;
  box.innerHTML = (state.pathway||[]).map(s=>`<article class="path-item reveal"><div class="path-num">${esc(s.step)}</div><div><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div></article>`).join('');
}
function renderFaqs(){
  const box=$('#faqList'); if(!box) return;
  box.innerHTML = (state.faqs||[]).map(f=>`<article class="faq-item reveal"><button class="faq-question" type="button"><span>${esc(f.question)}</span><span>+</span></button><div class="faq-answer"><p>${esc(f.answer)}</p></div></article>`).join('');
  $$('.faq-question').forEach(btn=>btn.addEventListener('click',()=>{ const item=btn.closest('.faq-item'); item.classList.toggle('open'); btn.querySelector('span:last-child').textContent=item.classList.contains('open')?'−':'+'; }));
}
function renderBooking(){
  const grid=$('#bookingGrid'); if(!grid) return;
  grid.innerHTML = (state.booking||[]).map(b=>`<article class="booking-card reveal"><div class="type">${esc(b.type)}</div><h3>${esc(b.name)}</h3><p>${esc(b.description)}</p><div class="booking-lines"><span>${esc(b.address)}</span>${b.phoneHref||b.phone?`<a href="tel:${esc(b.phoneHref||b.phone)}">${esc(b.phone)}</a>`:''}${b.email?`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`:''}</div>${b.url?`<a class="btn" target="_blank" rel="noopener" href="${esc(b.url)}">Vai alla scheda</a>`:''}</article>`).join('');
}
function renderNews(){
  const grid=$('#newsGrid'); if(!grid) return;
  const items = [...(state.news||[]), ...(state.videos||[])].filter(x=>x.title).slice(0,9);
  grid.innerHTML = items.map(n=>`<article class="news-card reveal"><div class="source">${esc(n.source)}${n.year?' · '+esc(n.year):''}</div><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p>${n.url?`<a target="_blank" rel="noopener" href="${esc(n.url)}">Apri contenuto →</a>`:''}</article>`).join('');
}
function renderActivities(){
  const timeline=$('#timeline'); if(!timeline) return;
  timeline.innerHTML = (state.congresses||[]).slice(0,state.shownActivities).map(c=>`<article class="timeline-item reveal"><div class="timeline-year">${esc(c.year)}</div><div><h3>${esc(c.title)}</h3><div class="timeline-meta">${esc(c.place)}${c.place&&c.role?' · ':''}${esc(c.role)}</div><p>${esc(c.topic)}</p>${c.url?`<div class="pub-links"><a target="_blank" rel="noopener" href="${esc(c.url)}">Link</a></div>`:''}</div></article>`).join('');
  const more=$('#showMoreActivities'); if(more) more.style.display = state.shownActivities < (state.congresses||[]).length ? 'inline-flex' : 'none';
}
function publicationTags(){ const set=new Set(['Tutte']); state.publications.forEach(p=>(p.tags||[]).forEach(t=>set.add(t))); return [...set].slice(0,11); }
function renderPubFilters(){
  const box=$('#pubFilters'); if(!box) return;
  box.innerHTML = publicationTags().map(t=>`<button class="filter-btn ${t===state.filter?'active':''}" data-filter="${esc(t)}">${esc(t)}</button>`).join('');
  $$('#pubFilters button').forEach(btn=>btn.addEventListener('click',()=>{ state.filter=btn.dataset.filter; state.shownPubs=5; renderPubFilters(); renderPublications(); }));
}
function filteredPubs(){
  const q=state.query.toLowerCase().trim();
  return (state.publications||[]).filter(p=>{
    const okFilter = state.filter==='Tutte' || (p.tags||[]).includes(state.filter);
    const text = `${safe(p.title)} ${safe(p.authors)} ${safe(p.journal)} ${(p.tags||[]).join(' ')}`.toLowerCase();
    return okFilter && (!q || text.includes(q));
  });
}
function sortPublications(items){
  return (Array.isArray(items)?items:[]).sort((a,b)=>{
    const ya=parseInt(String(a.year||'0').match(/\d{4}/)?.[0]||'0',10); const yb=parseInt(String(b.year||'0').match(/\d{4}/)?.[0]||'0',10);
    return yb-ya;
  });
}
function renderPubMeta(meta){
  const box=$('#pubMetaCard'); if(!box) return;
  const n = meta?.works || state.publications.length;
  box.innerHTML = `<strong>${esc(n)} pubblicazioni</strong><br><span>Fonte: ${esc(meta?.source || 'ORCID / archivio locale')}</span>`;
}
function renderPublications(){
  const list=$('#publicationList'); if(!list) return;
  const pubs=filteredPubs();
  list.innerHTML = pubs.slice(0,state.shownPubs).map(p=>`<article class="pub-item reveal"><div class="pub-year">${esc(p.year)}</div><div><div class="pub-title">${esc(p.title)}</div><div class="pub-meta">${esc(p.authors)}${p.authors?'<br>':''}${esc(p.journal)}</div><div class="pub-links">${p.doiUrl?`<a target="_blank" rel="noopener" href="${esc(p.doiUrl)}">DOI</a>`:''}<a target="_blank" rel="noopener" href="${esc(p.pubmedSearchUrl||('https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(safe(p.title))))}">PubMed</a>${p.orcidUrl?`<a target="_blank" rel="noopener" href="${esc(p.orcidUrl)}">ORCID</a>`:''}${(p.tags||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div></article>`).join('');
  const more=$('#showMorePublications'); if(more) more.style.display = state.shownPubs < pubs.length ? 'inline-flex' : 'none';
  observeReveals();
}
function observeReveals(){
  if(!('IntersectionObserver' in window)){ $$('.reveal').forEach(x=>x.classList.add('visible')); return; }
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }}),{threshold:.08});
  $$('.reveal:not(.visible)').forEach(x=>io.observe(x));
}
function setupNav(){ const btn=$('.nav-toggle'), nav=$('.site-nav'); if(!btn||!nav) return; btn.addEventListener('click',()=>{ const open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',String(open)); }); $$('.site-nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open'))); }
async function init(){
  setupNav();
  state.config = await loadJson('data/site-config.json', {});
  const [profile, publications, meta, congresses, booking, news, videos, faqs, pathway] = await Promise.all([
    loadJson('data/profile.json', null),
    loadJson('data/publications.json', []),
    loadJson('data/publications.meta.json', null),
    loadManaged('congresses','data/congresses.json'),
    loadManaged('booking','data/booking.json'),
    loadManaged('news','data/news.json'),
    loadManaged('videos','data/videos.json'),
    loadJson('data/faqs.json', []),
    loadJson('data/pathway.json', [])
  ]);
  if(!profile){ document.body.insertAdjacentHTML('afterbegin','<div style="padding:12px;background:#fee;border-bottom:1px solid #faa">Errore nel caricamento del profilo. Controllare data/profile.json.</div>'); return; }
  state.profile=profile; state.publications=sortPublications(publications); state.congresses=congresses; state.booking=booking; state.news=news; state.videos=videos; state.faqs=faqs; state.pathway=pathway;
  renderProfile(); renderAreas(); renderFaqs(); renderBooking(); renderNews(); renderPubMeta(meta); renderPubFilters(); renderPublications(); observeReveals();
  $('#pubSearch')?.addEventListener('input',e=>{ state.query=e.target.value; state.shownPubs=5; renderPublications(); });
  $('#showMorePublications')?.addEventListener('click',()=>{ state.shownPubs += 50; renderPublications(); });
}
init().catch(err=>{ console.error(err); document.body.insertAdjacentHTML('afterbegin','<div style="padding:12px;background:#fee;border-bottom:1px solid #faa">Errore imprevisto nel caricamento del sito.</div>'); });
