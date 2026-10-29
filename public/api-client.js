/* ORIGIN — API client.
 * Connects the (unchanged) front-end to the Express/SQLite backend.
 * It never alters markup or styles: it only hydrates data and sends form submissions to the server.
 * If the API is unreachable, the page keeps working exactly as the original static version. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function api(path, opts) {
    const r = await fetch('/api' + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Request failed'); e.status = r.status; throw e; }
    return data;
  }
  const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });

  /* ---------- hydrate: stats ---------- */
  api('/stats').then(rows => {
    document.querySelectorAll('.stat').forEach(st => {
      const lbl = st.querySelector('.lbl'), num = st.querySelector('.num[data-target]');
      const row = lbl && num && rows.find(r => r.label.toLowerCase() === lbl.textContent.trim().toLowerCase());
      if (!row) return;
      num.dataset.target = row.value;
      if (num.dataset.done) num.textContent = row.value.toLocaleString();
    });
  }).catch(() => {});

  /* ---------- hydrate: leaderboard ---------- */
  api('/leaderboard').then(rows => {
    const board = document.getElementById('board');
    if (!board || !rows.length) return;
    board.innerHTML = rows.map((x, i) =>
      '<div class="row-lb"><span class="rank">' + String(i + 1).padStart(2, '0') + '</span><span class="lb-name"><span class="mini">' +
      esc(x.name.split(' ').map(w => w[0]).join('')) + '</span>' + esc(x.name) + '</span><span class="lb-cat">' + esc(x.category) +
      '</span><span class="lb-xp">' + x.xp.toLocaleString() + ' XP</span><div class="lb-track"><div class="lb-fill" data-w="' +
      Math.round(x.xp / rows[0].xp * 100) + '"></div></div></div>').join('');
    if (board.classList.contains('in')) setTimeout(() => board.querySelectorAll('.lb-fill').forEach(b => b.style.width = b.dataset.w + '%'), 60);
  }).catch(() => {});

  /* ---------- hydrate: team ---------- */
  api('/team').then(M => {
    const g = document.getElementById('teamGrid');
    if (!g || !M.length) return;
    g.innerHTML = M.map((m, i) => {
      let cells = '';
      for (let k = 0; k < 42; k++) { const l = Math.random() < (m.projects / 14) ? .15 : Math.random() < (m.projects / 7) ? .4 : 0; cells += '<i class="' + (l ? 'l' + l : '') + '"></i>'; }
      const init = m.name.split(' ').map(x => x[0]).join('');
      const avatar = m.name === 'K. Aishwarya' ? '<img src="/team/aishwarya.jpg" alt="K. Aishwarya">' : m.name === 'M. Rakesh' ? '<img src="/team/rakesh.jpg" alt="M. Rakesh">' : m.name === 'P. Nishank' ? '<img src="/team/nishank.jpg" alt="P. Nishank">' : m.name === 'S. Abhinav Rishi' ? '<img src="/team/abhinav-rishi.jpg" alt="S. Abhinav Rishi">' : m.name === 'Mohit' ? '<img src="/team/mohit.jpg" alt="Mohit">' : m.name === 'Trideepa' ? '<img src="/team/trideepa.jpg" alt="Trideepa">' : esc(init);
      return '<div class="member reveal d' + (i % 3) + '"><div class="avatar">' + avatar + '</div><div style="flex:1"><h3>' + esc(m.name) + '</h3><div class="role">' + esc(m.role) +
        '</div><div class="mission">' + esc(m.mission) + '</div><div class="skills">' + m.skills.map(x => '<span>' + esc(x) + '</span>').join('') +
        '</div><div class="contrib">' + cells + '</div><div class="stats"><span><b>' + m.projects + '</b>PROJECTS</span><span><b>' + m.wins +
        '</b>HACKATHON WINS</span><span><b>' + (m.projects * 137 + m.wins * 421) + '</b>XP</span></div></div></div>';
    }).join('');
    const io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }), { threshold: .15 });
    g.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }).catch(() => {});

  /* ---------- hydrate: mission cards ---------- */
  api('/missions').then(rows => {
    const box = document.querySelector('.missions');
    if (!box || !rows.length) return;
    box.innerHTML = rows.map(m =>
      '<div class="mission-card"><div class="m-top"><span class="m-name">' + esc(m.name) + '</span><span class="m-status ' +
      (m.status === 'live' ? 'st-live">● LIVE' : 'st-soon">◌ SOON') + '</span></div><div class="m-desc">' + esc(m.description) + '</div></div>').join('');
  }).catch(() => {});

  /* ---------- hydrate: gallery ---------- */
  api('/gallery').then(G => {
    const grid = document.getElementById('galleryGrid');
    if (!grid || !G.length) return;
    const hues = [265, 190, 320, 150, 40, 210];
    grid.innerHTML = G.map((g, i) => '<div class="g-item" data-cat="' + esc(g.category) + '"><div class="g-bg" style="background:radial-gradient(circle at 30% 30%,hsla(' +
      hues[i % 6] + ',80%,60%,.25),transparent 60%),linear-gradient(150deg,#0d1430,#070b1c)">' + esc(g.icon) + '</div><div class="g-cap">' + esc(g.caption) +
      '<small>' + esc(g.meta) + '</small></div></div>').join('');
    const active = document.querySelector('.chip.active');
    if (active && active.dataset.f !== 'all') active.click();
  }).catch(() => {});

  /* ---------- application forms ---------- */
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (form.id !== 'applyForm' && form.id !== 'applyFormModal') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const f = form.elements;
    const body = { name: f[0].value, email: f[1].value, domain: f[2].value, about: f[3].value };
    const btn = form.querySelector('button[type=submit]');
    const old = form.querySelector('.api-err'); if (old) old.remove();
    btn.disabled = true;
    post('/applications', body).then(res => {
      form.innerHTML = '<div style="text-align:center;padding:30px 0"><div style="font-size:44px">🚀</div><h3 style="margin:16px 0 8px">Application received.</h3><p class="mono" style="color:var(--muted);font-size:12px">TRANSMISSION ID: ' +
        esc(res.transactionId) + '<br>Response ETA: 48 hours. Start building something meanwhile.</p></div>';
      if (typeof unlock === 'function') unlock('builder', '🔥', 'BUILDER', 'Badge unlocked: application deployed.');
    }).catch(err => {
      btn.disabled = false;
      const d = document.createElement('div');
      d.className = 'api-err mono';
      d.style.cssText = 'font-size:12px;color:#ff5f57;text-align:center';
      d.textContent = err.message || 'Could not reach the server. Try again.';
      btn.insertAdjacentElement('afterend', d);
    });
  }, true);

  /* ---------- newsletter (original UI runs as-is; we also persist) ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#nlBtn')) return;
    const v = document.getElementById('nlInput').value.trim();
    if (v.includes('@')) post('/newsletter', { email: v }).catch(() => {});
  }, true);

  /* ---------- ORI assistant: answers come from the server ---------- */
  function askServer(q) {
    oriUser(q);
    post('/ori', { question: q }).then(res => {
      setTimeout(() => {
        if (res.action === 'apply') { oriSay(res.answer); setTimeout(() => openApply(), 600); }
        else oriSay(res.answer);
      }, 350);
    }).catch(() => oriSay('I lost my connection to mission control. Try again in a moment.'));
  }
  document.addEventListener('click', function (e) {
    const chip = e.target.closest('#oriChips button');
    if (chip) { e.stopImmediatePropagation(); askServer(chip.textContent); return; }
    if (e.target.closest('#oriSend')) {
      e.stopImmediatePropagation();
      const i = document.getElementById('oriInput');
      if (i.value.trim()) { askServer(i.value.trim()); i.value = ''; }
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.id !== 'oriInput') return;
    e.stopImmediatePropagation();
    if (e.target.value.trim()) { askServer(e.target.value.trim()); e.target.value = ''; }
  }, true);
})();
