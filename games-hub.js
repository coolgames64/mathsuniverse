(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'mathsUniverseKidPlayroomV2';
  const storeDefault = { score: 0, stars: 0, coins: 0, xp: 0, avatar: '🧑‍🚀', bestStreak: 0 };
  let round = { mode: null, score: 0, stars: 0, streak: 0, answered: 0, hearts: 3, q: null, locked: false };

  function load() { try { return { ...storeDefault, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { ...storeDefault }; } }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); renderStats(); }
  function addReward(points = 10) {
    const s = load();
    s.score += points;
    s.xp += points;
    s.coins += Math.max(1, Math.floor(points / 5));
    if (round.streak > s.bestStreak) s.bestStreak = round.streak;
    if (round.answered > 0 && round.answered % 5 === 0) { s.stars += 1; round.stars += 1; burst('⭐'); confetti(); }
    save(s);
  }
  function level(xp) { return Math.floor((xp || 0) / 100) + 1; }
  function renderStats() {
    const s = load();
    $('[data-play-score]').textContent = s.score;
    $('[data-play-stars]').textContent = s.stars;
    $('[data-play-coins]').textContent = s.coins;
    $('[data-play-level]').textContent = level(s.xp);
    $('[data-play-avatar]').textContent = s.avatar;
    $('[data-play-xpbar]').style.width = ((s.xp || 0) % 100) + '%';
  }
  function roundStats() {
    $('[data-round-score]').textContent = round.score;
    $('[data-round-stars]').textContent = round.stars;
    $('[data-round-streak]').textContent = round.streak;
    $('[data-round-progress]').style.width = Math.min(100, (round.answered % 5) * 20) + '%';
  }
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }
  function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a || 1); }
  function simplify(n, d) { const g = gcd(n, d); return [n / g, d / g]; }
  function same(n1, d1, n2, d2) { const a = simplify(n1, d1), b = simplify(n2, d2); return a[0] === b[0] && a[1] === b[1]; }
  function show(msg, type = '') { const el = $('[data-play-feedback]'); el.textContent = msg; el.className = 'play-feedback ' + type; }
  function beep(type = 'good') { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = type === 'good' ? 720 : 180; gain.gain.value = 0.04; osc.connect(gain); gain.connect(ctx.destination); osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, type === 'good' ? 90 : 150); } catch {} }
  function fractionText(n, d, big = false) { return `<span class="kid-fraction ${big ? 'big' : ''}"><span>${n}</span><i></i><span>${d}</span></span>`; }
  function pizzaSvg(n, d, size = 180) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    let parts = `<svg class="kid-pizza" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#e8c87a"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f7ead8"/>`;
    for (let i = 0; i < d; i++) {
      const sa = (i * 360) / d - 90, ea = ((i + 1) * 360) / d - 90;
      const s = Math.PI / 180 * sa, e = Math.PI / 180 * ea;
      const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
      const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
      const large = ea - sa > 180 ? 1 : 0;
      const filled = i < n;
      const fill = filled ? `hsl(${28 + i * 24}, 85%, 62%)` : '#f7ead8';
      parts += `<path class="pizza-piece" d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${fill}" stroke="#c4956a" stroke-width="3"/>`;
      if (filled) {
        const mid = (s + e) / 2;
        parts += `<circle cx="${cx + r * .52 * Math.cos(mid)}" cy="${cy + r * .52 * Math.sin(mid)}" r="5" fill="#d44" opacity=".8"/>`;
      }
    }
    return parts + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c4956a" stroke-width="4"/></svg>`;
  }
  function barSvg(n, d, width = 230) {
    let html = `<div class="kid-bar" style="--d:${d}">`;
    for (let i = 0; i < d; i++) html += `<span class="${i < n ? 'on' : ''}"></span>`;
    return html + '</div>';
  }
  function options(vals, answer, cb) {
    return `<div class="kid-options">${vals.map(v => `<button data-opt="${v}" class="kid-option">${typeof v === 'string' && v.includes('/') ? fractionText(...v.split('/').map(Number)) : v}</button>`).join('')}</div>`;
  }
  function setTitle(t) { $('[data-game-title]').textContent = t; }
  function openMode(mode) {
    round = { mode, score: 0, stars: 0, streak: 0, answered: 0, hearts: 3, q: null, locked: false };
    $('[data-play-menu]').classList.add('hidden');
    $('[data-play-game]').classList.remove('hidden');
    nextQuestion();
    window.scrollTo({ top: $('[data-play-game]').offsetTop - 90, behavior: 'smooth' });
  }
  function backMenu() { $('[data-play-menu]').classList.remove('hidden'); $('[data-play-game]').classList.add('hidden'); }

  function makePizzaQ() {
    const ds = [2, 3, 4, 5, 6, 8]; const d = ds[rand(0, ds.length - 1)]; const n = rand(1, d - 1);
    const wrong = new Set();
    while (wrong.size < 3) { const wd = ds[rand(0, ds.length - 1)], wn = rand(1, wd - 1); if (!(wn === n && wd === d)) wrong.add(`${wn}/${wd}`); }
    return { kind: 'pizza', n, d, answer: `${n}/${d}`, opts: shuffle([`${n}/${d}`, ...wrong]), hint: `Count the coloured slices: ${n} out of ${d}.` };
  }
  function makeBuilderQ() { const d = [2, 3, 4, 5, 6, 8][rand(0, 5)]; const n = rand(1, d - 1); return { kind: 'builder', n, d, answer: n, hint: `Colour ${n} block${n === 1 ? '' : 's'} out of ${d}.` }; }
  function makeCompareQ() { const d = [3, 4, 5, 6, 8][rand(0, 4)]; let n1 = rand(1, d - 1), n2 = rand(1, d - 1); while (n2 === n1) n2 = rand(1, d - 1); return { kind: 'compare', d, n1, n2, answer: n1 > n2 ? 'left' : 'right', hint: `Same bottom number: bigger top number wins.` }; }
  function makeMonsterQ() { const d = [4, 5, 6, 8][rand(0, 3)]; const a = rand(1, d - 2), b = rand(1, d - a); const target = a + b; return { kind: 'monster', d, a, b, target, answer: `${a}/${d}+${b}/${d}`, hint: `The monster needs ${target}/${d}. Pick pieces that add to ${target}.` }; }
  function makeBossQ() { const makers = [makePizzaQ, makeBuilderQ, makeCompareQ, makeMonsterQ]; return makers[rand(0, makers.length - 1)](); }

  function nextQuestion() {
    round.locked = false;
    if (round.mode === 'pizza') renderPizza(makePizzaQ());
    if (round.mode === 'builder') renderBuilder(makeBuilderQ());
    if (round.mode === 'compare') renderCompare(makeCompareQ());
    if (round.mode === 'monster') renderMonster(makeMonsterQ());
    if (round.mode === 'boss') renderBoss(makeBossQ());
    roundStats();
  }
  function correct(msg = 'Great!') {
    if (round.locked) return; round.locked = true;
    round.score += 10; round.streak += 1; round.answered += 1;
    addReward(10); show(msg + ' +10 points!', 'good'); beep('good'); burst('⭐');
    if (round.mode === 'boss' && round.answered >= 5) { show('🐲 Dragon defeated! You earned a Fraction Hero star!', 'good'); confetti(); }
    roundStats(); setTimeout(nextQuestion, 1100);
  }
  function wrong(msg) {
    if (round.locked) return;
    round.streak = 0; round.hearts -= 1; show(msg, 'bad'); beep('bad'); shake(); roundStats();
  }

  function renderPizza(q) {
    round.q = q; setTitle('🍕 Name That Fraction');
    $('[data-game-area]').innerHTML = `<p class="kid-prompt">How much pizza is coloured?</p>${pizzaSvg(q.n, q.d)}${options(q.opts, q.answer)}<p class="small">Tap the fraction that matches the pizza.</p>`;
    $$('[data-opt]').forEach(b => b.addEventListener('click', () => b.dataset.opt === q.answer ? correct('Amazing pizza maths!') : wrong(`Almost! ${q.hint}`)));
  }
  function renderBuilder(q) {
    round.q = q; setTitle('🎨 Colour It In');
    $('[data-game-area]').innerHTML = `<p class="kid-prompt">Colour ${fractionText(q.n, q.d, true)} of the blocks.</p><div class="builder-blocks">${Array.from({ length: q.d }, (_, i) => `<button data-block="${i}"></button>`).join('')}</div><button class="btn game-btn" data-check-builder>✅ Check!</button><p class="small">Tap blocks to colour them.</p>`;
    let count = 0;
    $$('[data-block]').forEach((b, idx) => b.addEventListener('click', () => { b.classList.toggle('on'); count = $$('[data-block].on').length; }));
    $('[data-check-builder]').addEventListener('click', () => count === q.n ? correct('Perfect colouring!') : wrong(`Count again. You coloured ${count}, but you need ${q.n}.`));
  }
  function renderCompare(q) {
    round.q = q; setTitle('🚀 Rocket Compare');
    $('[data-game-area]').innerHTML = `<p class="kid-prompt">Which rocket has the bigger fraction?</p><div class="rocket-compare"><button data-side="left"><span class="rocket">🚀</span>${pizzaSvg(q.n1, q.d, 120)}${fractionText(q.n1, q.d)}</button><strong>VS</strong><button data-side="right"><span class="rocket">🚀</span>${pizzaSvg(q.n2, q.d, 120)}${fractionText(q.n2, q.d)}</button></div>`;
    $$('[data-side]').forEach(b => b.addEventListener('click', () => { if (b.dataset.side === q.answer) { b.classList.add('fly'); correct('Rocket boost!'); } else wrong(q.hint); }));
  }
  function renderMonster(q) {
    round.q = q; setTitle('👾 Feed the Monster');
    const foods = shuffle([`${q.a}/${q.d}`, `${q.b}/${q.d}`, `${rand(1, q.d - 1)}/${q.d}`, `${rand(1, q.d - 1)}/${q.d}`]);
    $('[data-game-area]').innerHTML = `<p class="kid-prompt">The monster wants ${fractionText(q.target, q.d, true)} energy. Pick two snacks.</p><div class="monster-box"><div class="monster-face">👾</div>${barSvg(q.target, q.d)}</div><div class="snack-row">${foods.map(f => `<button data-food="${f}" class="snack">${fractionText(...f.split('/').map(Number))}</button>`).join('')}</div><button class="btn game-btn" data-feed-check>Feed!</button>`;
    const picked = [];
    $$('[data-food]').forEach(b => b.addEventListener('click', () => { if (picked.includes(b)) return; if (picked.length >= 2) return; picked.push(b); b.classList.add('picked'); }));
    $('[data-feed-check]').addEventListener('click', () => {
      if (picked.length !== 2) return wrong('Pick two snacks first.');
      const total = picked.map(b => Number(b.dataset.food.split('/')[0])).reduce((a, b) => a + b, 0);
      total === q.target ? correct('Monster is happy!') : wrong(`The snacks make ${total}/${q.d}. The monster needs ${q.target}/${q.d}.`);
    });
  }
  function renderBoss(q) {
    round.q = q; setTitle('🐲 Fraction Boss');
    if (round.answered >= 5) { $('[data-game-area]').innerHTML = `<div class="boss-win">🏆<h2>Fraction Dragon defeated!</h2><p>You answered 5 boss questions.</p><button class="btn game-btn" data-restart-boss>Play Again</button></div>`; $('[data-restart-boss]').addEventListener('click', () => openMode('boss')); return; }
    const wave = `<div class="boss-head"><span>🐲</span><div><strong>Dragon HP</strong><div class="boss-hp"><i style="width:${100 - round.answered * 20}%"></i></div></div><span>❤️ ${Math.max(0, round.hearts)}</span></div>`;
    $('[data-game-area]').innerHTML = wave + `<div class="boss-inner"></div>`;
    const holder = $('.boss-inner');
    if (q.kind === 'pizza') holder.innerHTML = `<p class="kid-prompt">Boss asks: how much pizza?</p>${pizzaSvg(q.n, q.d)}${options(q.opts, q.answer)}`;
    if (q.kind === 'builder') holder.innerHTML = `<p class="kid-prompt">Boss says: colour ${fractionText(q.n, q.d, true)}</p><div class="builder-blocks">${Array.from({ length: q.d }, (_, i) => `<button data-block="${i}"></button>`).join('')}</div><button class="btn game-btn" data-check-builder>Check</button>`;
    if (q.kind === 'compare') holder.innerHTML = `<p class="kid-prompt">Boss asks: which is bigger?</p><div class="rocket-compare"><button data-side="left">${pizzaSvg(q.n1, q.d, 120)}${fractionText(q.n1, q.d)}</button><strong>VS</strong><button data-side="right">${pizzaSvg(q.n2, q.d, 120)}${fractionText(q.n2, q.d)}</button></div>`;
    if (q.kind === 'monster') holder.innerHTML = `<p class="kid-prompt">Boss wants ${fractionText(q.target, q.d, true)} energy. Pick the answer.</p>${barSvg(q.target, q.d)}${options(shuffle([`${q.target}/${q.d}`, `${Math.max(1, q.target-1)}/${q.d}`, `${Math.min(q.d, q.target+1)}/${q.d}`]), `${q.target}/${q.d}`)}`;
    wireBoss(q);
  }
  function wireBoss(q) {
    if (q.kind === 'pizza') $$('[data-opt]').forEach(b => b.addEventListener('click', () => b.dataset.opt === q.answer ? correct('Boss hit!') : wrong(q.hint)));
    if (q.kind === 'builder') { let count = 0; $$('[data-block]').forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); count = $$('[data-block].on').length; })); $('[data-check-builder]').addEventListener('click', () => count === q.n ? correct('Boss hit!') : wrong(q.hint)); }
    if (q.kind === 'compare') $$('[data-side]').forEach(b => b.addEventListener('click', () => b.dataset.side === q.answer ? correct('Boss hit!') : wrong(q.hint)));
    if (q.kind === 'monster') $$('[data-opt]').forEach(b => b.addEventListener('click', () => b.dataset.opt === `${q.target}/${q.d}` ? correct('Boss hit!') : wrong(q.hint)));
  }
  function shake() { const a = $('.play-game-area'); a.classList.add('shake'); setTimeout(() => a.classList.remove('shake'), 400); }
  function burst(char) { const el = document.createElement('div'); el.className = 'kid-burst'; el.textContent = char; document.body.appendChild(el); setTimeout(() => el.remove(), 900); }
  function confetti() { for (let i = 0; i < 26; i++) { const c = document.createElement('span'); c.className = 'kid-confetti'; c.style.left = rand(5, 95) + '%'; c.style.background = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8'][i % 5]; c.style.animationDelay = (Math.random() * .3) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 1800); } }

  $$('[data-open-mode]').forEach(b => b.addEventListener('click', () => openMode(b.dataset.openMode)));
  $('[data-back-menu]').addEventListener('click', backMenu);
  $('[data-next-question]').addEventListener('click', nextQuestion);
  $('[data-play-hint]').addEventListener('click', () => round.q && show(round.q.hint || 'Look at the picture and count the pieces.', 'good'));
  $('[data-reset-playroom]').addEventListener('click', () => { if (confirm('Reset Playroom stars, score, coins, and XP?')) { localStorage.removeItem(KEY); renderStats(); } });
  $$('[data-avatar]').forEach(b => b.addEventListener('click', () => { const s = load(); s.avatar = b.dataset.avatar; save(s); }));
  renderStats(); roundStats();
})();
