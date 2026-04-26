(function(){
  const KEY = 'mathsUniversePremiumUnlockedV1';
  const DEMO_CODE = 'MATHS-STAR';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  function unlocked(){ return localStorage.getItem(KEY) === 'true'; }
  function setUnlocked(v){ v ? localStorage.setItem(KEY,'true') : localStorage.removeItem(KEY); renderPremium(); }
  function msg(text, good=true){ const el=$('[data-premium-message]'); if(!el)return; el.className='auth-message '+(good?'good':'bad'); el.textContent=text; el.classList.remove('hidden'); }

  function renderPremium(){
    const ok = unlocked();
    $$('[data-premium-status]').forEach(e=>{e.textContent=ok?'Premium Active':'Locked'; e.classList.toggle('active', ok);});
    $$('.premium-tool').forEach(card=>card.classList.toggle('locked', !ok));
  }

  function showPanel(title, subtitle, html){
    if(!unlocked()){ msg('Premium is locked. Enter the demo code first.', false); location.hash='unlock-premium'; return; }
    const panel=$('[data-tool-panel]');
    if(!panel)return;
    $('[data-tool-title]').textContent=title;
    $('[data-tool-subtitle]').textContent=subtitle;
    $('[data-tool-content]').innerHTML=html;
    panel.classList.remove('hidden');
    panel.scrollIntoView({behavior:'smooth', block:'start'});
    attachToolEvents();
  }

  function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

  function worksheetTool(){
    return `<div class="premium-generator"><div class="grid-3"><label>Topic<select data-ws-topic><option value="fractions">Fractions</option><option value="times">Times Tables</option><option value="add">Addition</option><option value="subtract">Subtraction</option></select></label><label>Difficulty<select data-ws-level><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><div><button class="btn premium-btn" data-generate-ws>Generate Worksheet</button><button class="btn secondary" onclick="window.print()">Print</button></div></div><div class="generated-sheet" data-generated-sheet><p class="small">Choose a topic and press generate.</p></div></div>`;
  }

  function makeWorksheet(topic, level){
    const rows=[];
    for(let i=1;i<=5;i++){
      if(topic==='times'){ const a=rand(level==='hard'?6:2, level==='easy'?6:12), b=rand(2,12); rows.push(`${i}. ${a} × ${b} = ______`); }
      if(topic==='add'){ const max=level==='easy'?60:level==='medium'?200:900; rows.push(`${i}. ${rand(10,max)} + ${rand(10,max)} = ______`); }
      if(topic==='subtract'){ const a=rand(level==='easy'?40:100, level==='hard'?900:300), b=rand(10,Math.min(a-1, level==='easy'?39:180)); rows.push(`${i}. ${a} − ${b} = ______`); }
      if(topic==='fractions'){ const d=[4,5,6,8,10,12][rand(0,5)]; const a=rand(1,d-1), b=rand(1,d-a); rows.push(`${i}. ${a}/${d} + ${b}/${d} = ______`); }
    }
    return `<h3>Premium Mini Worksheet</h3><p class="small">Topic: ${topic}. Difficulty: ${level}.</p><ol class="premium-sheet-list">${rows.map(r=>`<li>${r.replace(/^\d+\. /,'')}</li>`).join('')}</ol><p class="small">Bonus: write one sentence explaining how you checked your answer.</p>`;
  }

  function hintTool(){
    const a=rand(2,9), b=rand(2,9), ans=a*b;
    return `<div class="smart-hint-lab"><h3>Question</h3><p class="premium-question">${a} × ${b} = ?</p><input data-hint-answer placeholder="Type your answer"><button class="btn premium-btn" data-check-hint data-answer="${ans}" data-a="${a}" data-b="${b}">Check</button><div class="battle-feedback" data-hint-output>Try it. If it is wrong, the hint will help you fix it.</div></div>`;
  }

  function snapshotTool(){
    let course={completed:[]}; let game={xp:0,coins:0,streak:0,best:0,wins:0};
    try{course=JSON.parse(localStorage.getItem('mathsUniverseProgressV5'))||course;}catch(e){}
    try{game=JSON.parse(localStorage.getItem('mathsUniverseGameStatsV1'))||game;}catch(e){}
    const done=(course.completed||[]).length;
    const next = done>=14 ? 'Certificate time!' : `Next mission: ${done+1} of 14`;
    return `<div class="premium-snapshot"><div class="grid-3"><div class="stat-card"><strong>${done}/14</strong><span>Missions complete</span></div><div class="stat-card"><strong>${game.xp||0}</strong><span>Game XP</span></div><div class="stat-card"><strong>${game.coins||0}</strong><span>Coins</span></div></div><h3>Recommended next step</h3><p>${next}</p><p class="small">Tip: If progress looks wrong, it may be saved on a different browser or device.</p></div>`;
  }

  function bossTool(){
    const a=rand(10,30), b=rand(2,12), ans=a+b;
    return `<div class="mega-boss"><h3>⚔️ Mega Boss Challenge</h3><p class="premium-question">Boss asks: ${a} + ${b} = ?</p><div class="battle-options">${[ans, ans+2, ans-3, ans+5].sort(()=>Math.random()-.5).map(v=>`<button class="option" data-boss-answer="${v}" data-answer="${ans}">${v}</button>`).join('')}</div><div class="battle-feedback" data-boss-output>Choose the answer. Correct = boss damage. Wrong = hint.</div></div>`;
  }

  function attachToolEvents(){
    const gen=$('[data-generate-ws]');
    if(gen)gen.addEventListener('click',()=>{ const topic=$('[data-ws-topic]').value, level=$('[data-ws-level]').value; $('[data-generated-sheet]').innerHTML=makeWorksheet(topic, level); });
    const hint=$('[data-check-hint]');
    if(hint)hint.addEventListener('click',()=>{ const v=Number($('[data-hint-answer]').value); const ans=Number(hint.dataset.answer); const out=$('[data-hint-output]'); if(v===ans){out.className='battle-feedback good';out.textContent='Correct! Premium streak energy +1.';} else {out.className='battle-feedback bad';out.textContent=`Hint: ${hint.dataset.a} × ${hint.dataset.b} means ${hint.dataset.a} groups of ${hint.dataset.b}. Try counting in ${hint.dataset.b}s.`;} });
    $$('[data-boss-answer]').forEach(btn=>btn.addEventListener('click',()=>{ const out=$('[data-boss-output]'); if(Number(btn.dataset.bossAnswer)===Number(btn.dataset.answer)){out.className='battle-feedback good';out.textContent='Critical hit! Boss defeated.';} else {out.className='battle-feedback bad';out.textContent='Shield hit! Hint: add the tens first, then the ones.';} }));
  }

  document.addEventListener('DOMContentLoaded',()=>{
    renderPremium();
    const form=$('[data-premium-form]');
    if(form)form.addEventListener('submit',e=>{ e.preventDefault(); const code=(new FormData(form).get('premiumCode')||'').toString().trim().toUpperCase(); if(code===DEMO_CODE){ setUnlocked(true); msg('Premium unlocked on this browser.'); } else { msg('Wrong premium code. Try MATHS-STAR for the demo.', false); } });
    const lock=$('[data-lock-premium]'); if(lock)lock.addEventListener('click',()=>{ setUnlocked(false); msg('Premium locked again on this browser.'); });
    $$('[data-open-tool]').forEach(btn=>btn.addEventListener('click',()=>{ const t=btn.dataset.openTool; if(t==='hint')showPanel('Smart Hint Lab','Get a helpful hint when an answer is wrong.', hintTool()); if(t==='worksheet')showPanel('Worksheet Generator','Create quick printable practice.', worksheetTool()); if(t==='snapshot')showPanel('Parent Snapshot','See progress saved on this browser.', snapshotTool()); if(t==='boss')showPanel('Mega Boss Battle','Try a harder premium challenge.', bossTool()); }));
    const close=$('[data-close-tool]'); if(close)close.addEventListener('click',()=> $('[data-tool-panel]').classList.add('hidden'));
  });
})();
