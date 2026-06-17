const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Cannot load ${path}`);
  return res.json();
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function renderProfile(profile) {
  $('#highlights').innerHTML = profile.highlights.map(item => `<div class="stat">${item}</div>`).join('');
  $('#interests').innerHTML = profile.interests.map(item => `<span class="chip">${item}</span>`).join('');
}

function publicationCard(pub) {
  const tags = (pub.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
  const doi = pub.doi ? `<a class="doi" href="https://doi.org/${pub.doi}" target="_blank" rel="noopener">doi: ${pub.doi}</a>` : '';
  return `
    <article class="pub-card reveal" data-tags="${(pub.tags || []).join('|')}">
      <div class="pub-top">
        <div>
          <span class="pub-year">${pub.year}</span>
          <h3>${pub.title}</h3>
        </div>
      </div>
      <p class="pub-meta">${pub.authors}</p>
      <p class="pub-meta"><strong>${pub.journal}</strong>${doi ? ` · ${doi}` : ''}</p>
      <div class="tag-row">${tags}</div>
    </article>`;
}

function renderPublications(publications) {
  const target = $('#publications');
  const sorted = [...publications].sort((a, b) => Number(b.year) - Number(a.year));
  target.innerHTML = sorted.map(publicationCard).join('');
  $$('.filter').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filter').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      $$('.pub-card').forEach(card => {
        const tags = card.dataset.tags || '';
        card.style.display = filter === 'all' || tags.includes(filter) ? '' : 'none';
      });
    });
  });
}

function renderCongresses(congresses) {
  $('#congresses').innerHTML = congresses.map(item => `
    <article class="event reveal">
      <small>${item.year} · ${item.place}</small>
      <h3>${item.title}</h3>
      <p><strong>${item.role}</strong></p>
      <p>${item.topic}</p>
    </article>
  `).join('');
}

function renderVideos(videos) {
  $('#videos').innerHTML = videos.map(video => {
    const media = video.embed
      ? `<iframe src="${video.embed}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`
      : `<span>Apri il contenuto video</span>`;
    return `
      <article class="video-card reveal">
        <a class="video-frame" href="${video.url}" target="_blank" rel="noopener">${media}</a>
        <div class="video-body">
          <span class="source">${video.source}</span>
          <h3>${video.title}</h3>
          <p>${video.description}</p>
          <a class="doi" href="${video.url}" target="_blank" rel="noopener">Guarda il video</a>
        </div>
      </article>
    `;
  }).join('');
}

function setupUI() {
  const header = $('[data-header]');
  const toggle = $('.menu-toggle');
  const nav = $('#nav');

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  });

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  $$('#nav a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  $('#year').textContent = new Date().getFullYear();
}

function reveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(node => observer.observe(node));
}

async function init() {
  setupUI();
  try {
    const [profile, publications, congresses, videos] = await Promise.all([
      loadJSON('data/profile.json'),
      loadJSON('data/publications.json'),
      loadJSON('data/congresses.json'),
      loadJSON('data/videos.json')
    ]);
    renderProfile(profile);
    renderPublications(publications);
    renderCongresses(congresses);
    renderVideos(videos);
  } catch (error) {
    console.error(error);
  } finally {
    reveal();
  }
}

init();
