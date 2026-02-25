/**
 * SwarmAndBeeCRE.com — Interactive Landing Page
 * ==============================================
 * Search demo, skills grid, stat counters, code tabs.
 */

const API = 'https://router.swarmandbee.com';

// ── Search ──────────────────────────────────────────────

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const btn = document.getElementById('search-btn');
const resultsEl = document.getElementById('search-results');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  await runSearch(query);
});

// Example buttons
document.querySelectorAll('.example-btn').forEach(b => {
  b.addEventListener('click', () => {
    input.value = b.dataset.q;
    runSearch(b.dataset.q);
  });
});

async function runSearch(query) {
  btn.disabled = true;
  btn.textContent = 'Searching...';
  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-3)">Searching 6 subsystems...</div>';

  try {
    const res = await fetch(`${API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    renderResults(data);
  } catch (err) {
    resultsEl.innerHTML = `<div style="text-align:center;padding:24px;color:#ef4444">Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Search';
  }
}

function renderResults(data) {
  const p = data.parsed || {};
  const mkt = data.market_context;
  const mem = data.memory_results;
  const events = data.recent_events;
  const entities = data.related_entities;
  const skills = data.skills || {};

  let html = `
    <div class="result-header">
      <h3>Intelligence Package</h3>
      <div class="result-meta">
        <span class="latency">${data.latency_ms}ms</span>
        <span>Confidence: ${(p.confidence * 100).toFixed(0)}%</span>
        <span>Parser: ${p.method}</span>
      </div>
    </div>
    <div class="result-grid">
  `;

  // Parsed Query card
  html += `<div class="result-card">
    <h4>Parsed Query</h4>
    <div class="tags">`;
  if (p.asset_type) html += `<span class="tag">${p.asset_type.replace(/_/g, ' ')}</span>`;
  if (p.state) html += `<span class="tag">${p.state}</span>`;
  if (p.city) html += `<span class="tag">${p.city}</span>`;
  if (p.sf) html += `<span class="tag">${(p.sf / 1000).toFixed(0)}K SF</span>`;
  if (p.price) html += `<span class="tag">$${(p.price / 1e6).toFixed(1)}M</span>`;
  if (p.cap_rate) html += `<span class="tag">${p.cap_rate}% cap</span>`;
  if (p.intent) html += `<span class="tag">${p.intent.replace(/_/g, ' ')}</span>`;
  html += `</div></div>`;

  // Market Context card
  if (mkt) {
    const tierClass = mkt.tier === 1 ? 'tier1' : mkt.tier === 2 ? 'warm' : '';
    html += `<div class="result-card">
      <h4>Market Context</h4>
      <div class="tags">
        <span class="tag ${mkt.label === 'HOT' ? 'hot' : tierClass}">${mkt.label} (Tier ${mkt.tier})</span>
        <span class="tag">${mkt.state_name}</span>
        <span class="tag">Heat: ${mkt.heat}/100</span>
      </div>
      <p>${mkt.reason}</p>
      <p style="margin-top:6px;font-size:0.8rem;color:var(--text-3)">
        Cap: ${mkt.cap_rate_range ? mkt.cap_rate_range.map(r => (r * 100).toFixed(1) + '%').join(' - ') : 'N/A'} |
        Tax: ${mkt.property_tax_rate ? (mkt.property_tax_rate * 100).toFixed(2) + '%' : 'N/A'} |
        Income tax: ${mkt.income_tax ? 'Yes' : 'No'}
      </p>
    </div>`;
  }

  // Infrastructure card
  if (data.infrastructure) {
    const infra = data.infrastructure;
    const items = [];
    if (infra.ports?.length) items.push(`${infra.ports.length} port(s)`);
    if (infra.rail?.length) items.push(`${infra.rail.length} rail hub(s)`);
    if (infra.power?.length) items.push(`${infra.power.length} power zone(s)`);
    if (infra.last_mile?.length) items.push(`${infra.last_mile.length} last-mile zone(s)`);
    if (infra.air_cargo?.length) items.push(`${infra.air_cargo.length} air cargo airport(s)`);
    if (items.length) {
      html += `<div class="result-card">
        <h4>Infrastructure</h4>
        <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`;
    }
  }

  // Memory Results card
  if (mem && mem.results?.length) {
    html += `<div class="result-card">
      <h4>Memory (${mem.total} match${mem.total !== 1 ? 'es' : ''})</h4>
      <ul>${mem.results.slice(0, 5).map(r =>
        `<li>${r.summary || r.object_id} <span class="tag" style="font-size:0.7rem">${(r.score * 100).toFixed(0)}%</span></li>`
      ).join('')}</ul>
    </div>`;
  }

  // Events card
  if (events && events.events?.length) {
    html += `<div class="result-card">
      <h4>Recent Events (${events.total})</h4>
      <ul>${events.events.slice(0, 5).map(e =>
        `<li>${e.event_type?.replace(/_/g, ' ')} — ${e.summary || e.state || 'N/A'}</li>`
      ).join('')}</ul>
    </div>`;
  }

  // Entities card
  if (entities && entities.length) {
    html += `<div class="result-card">
      <h4>Entities (${entities.length})</h4>
      <ul>${entities.slice(0, 5).map(e =>
        `<li>${e.name} <span class="tag" style="font-size:0.7rem">${e.entity_type}</span></li>`
      ).join('')}</ul>
    </div>`;
  }

  // Skills card
  html += `<div class="result-card">
    <h4>Skills</h4>
    <div class="result-skills">`;
  if (skills.recommended?.length) {
    skills.recommended.forEach(s => {
      html += `<span class="skill-tag recommended">${s.replace(/_/g, ' ')}</span>`;
    });
  }
  html += `</div>
    <p style="margin-top:8px;font-size:0.8rem;color:var(--text-3)">${skills.available?.length || 19} skills available</p>
  </div>`;

  html += '</div>';
  resultsEl.innerHTML = html;
}

// ── Skills Grid ─────────────────────────────────────────

async function loadSkills() {
  const grid = document.getElementById('skills-grid');
  try {
    const res = await fetch(`${API}/skills`);
    const data = await res.json();
    const skills = data.skills || data;

    grid.innerHTML = skills.map(s => `
      <div class="skill-card" title="${s.description || ''}">
        <h4>${(s.name || '').replace(/_/g, ' ')}</h4>
        <div class="skill-ver">v${s.version || '1.0'}</div>
        <p>${truncate(s.description || s.role || '', 80)}</p>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-3);text-align:center;grid-column:1/-1">Loading skills...</p>';
  }
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

// ── Stat Counters (animate on scroll) ───────────────────

function animateCounters() {
  const stats = document.querySelectorAll('.stat');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target.querySelector('.stat-num');
        const target = parseInt(entry.target.dataset.target, 10);
        animateCount(el, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
}

function animateCount(el, target) {
  const duration = 1200;
  const start = performance.now();
  const suffix = target >= 300 ? '+' : '';

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Code Tabs ───────────────────────────────────────────

document.querySelectorAll('.code-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.code-block').forEach(b => b.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.code-block[data-lang="${tab.dataset.lang}"]`).classList.add('active');
  });
});

// ── Init ────────────────────────────────────────────────

loadSkills();
animateCounters();
