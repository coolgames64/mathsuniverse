(function(){
  const KEY = 'mathsUniversePremiumUnlockedV2';
  const STATS_KEY = 'mathsUniversePremiumStatsV2';
  const CONFIG = window.MATHS_UNIVERSE_PREMIUM || {};
  const DEMO_CODES = (CONFIG.demoCodes || ['MATHS-STAR']).map(c => String(c).trim().toUpperCase());
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  function getCourseState(){
    try { return JSON.parse(localStorage.getItem('mathsUniverseProgressV1')) || {completed:[], quiz:{}}; }
    catch(e){ return {completed:[], quiz:{}}; }
  }
  function getGameStats(){
    try { return JSON.parse(localStorage.getItem('mathsUniverseGameStatsV1')) || {xp:0,coins:0,streak:0,best:0,wins:0}; }
    catch(e){ return {xp:0,coins:0,streak:0,best:0,wins:0}; }
  }
  function getPremiumStats(){
    try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {toolsOpened:0,bossBest:0,worksheets:0,hintsUsed:0}; }
    catch(e){ return {toolsOpened:0,bossBest:0,worksheets:0,hintsUsed:0}; }
  }
  function savePremiumStats(s){ localStorage.setItem(STATS_KEY, JSON.stringify(s)); }
  function updatePremiumStats(k, v){ const s=getPremiumStats(); s[k]=(s[k]||0)+v; savePremiumStats(s); }
  function unlocked(){ return localStorage.getItem(KEY) === 'true' || localStorage.getItem('mathsUniversePremiumUnlockedV1') === 'true'; }
  function setUnlocked(v){
    if(v){ localStorage.setItem(KEY,'true'); localStorage.setItem('mathsUniversePremiumUnlockedV1','true'); }
    else { localStorage.removeItem(KEY); localStorage.removeItem('mathsUniversePremiumUnlockedV1'); }
    renderPremium();
  }
  function msg(text, good=true){ const el=$('[data-premium-message]'); if(!el)return; el.className='auth-message '+(good?'good':'bad'); el.textContent=text; el.classList.remove('hidden'); }
  function esc(x){ return String(x).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  function renderPremium(){
    const ok = unlocked();
    $$('[data-premium-status]').forEach(e=>{ e.textContent=ok?'Premium Active':'Locked'; e.classList.toggle('active', ok); });
    $$('.premium-tool').forEach(card=>card.classList.toggle('locked', !ok));
    $$('[data-buy-premium]').forEach(a => {
      if(CONFIG.paymentLink){ a.setAttribute('href', CONFIG.paymentLink); a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); }
      else { a.setAttribute('href', '#unlock-premium'); a.removeAttribute('target'); a.removeAttribute('rel'); }
    });
  }

  function showPanel(title, subtitle, html){
    if(!unlocked()){
      msg('Premium is locked. Enter a premium code first.', false);
      location.hash='unlock-premium';
      return;
    }
    updatePremiumStats('toolsOpened',1);
    const panel=$('[data-tool-panel]');
    if(!panel)return;
    $('[data-tool-title]').textContent=title;
    $('[data-tool-subtitle]').textContent=subtitle;
    $('[data-tool-content]').innerHTML=html;
    panel.classList.remove('hidden');
    panel.scrollIntoView({behavior:'smooth', block:'start'});
    attachToolEvents();
  }

  function makeQuestion(kind){
    let q='', ans=0, hint='', explain='';
    if(kind==='times'){
      const a=rand(3,12), b=rand(3,12); q=`${a} × ${b}`; ans=a*b; hint=`Think ${a} groups of ${b}, or skip-count by ${b}.`; explain=`${a} × ${b} means ${a} groups of ${b}.`;
    } else if(kind==='fractions'){
      const den=[2,3,4,5,6,8,10][rand(0,6)], n=rand(1,den-1), whole=den*rand(2,8); q=`${n}/${den} of ${whole}`; ans=(whole/den)*n; hint=`Divide ${whole} by ${den}, then multiply by ${n}.`; explain=`First find 1/${den}, then take ${n} of those parts.`;
    } else if(kind==='algebra'){
      const x=rand(2,12), add=rand(3,15); ans=x; q=`x + ${add} = ${x+add}`; hint=`Do the opposite operation: subtract ${add} from both sides.`; explain=`To keep the equation balanced, subtract ${add} from both sides.`;
    } else if(kind==='subtract'){
      const a=rand(80,300), b=rand(15,79); q=`${a} − ${b}`; ans=a-b; hint=`Split ${b} into tens and ones, then subtract in parts.`; explain=`Subtraction means finding how much is left after taking away.`;
    } else {
      const a=rand(40,300), b=rand(20,200); q=`${a} + ${b}`; ans=a+b; hint=`Add hundreds/tens first, then ones. Check by estimating.`; explain=`Addition combines the two amounts.`;
    }
    return {q, ans, hint, explain, kind};
  }

  function smartHintTool(){
    const q=makeQuestion(['add','subtract','times','fractions','algebra'][rand(0,4)]);
    return `<div class="smart-hint-lab" data-smart-hint data-answer="${q.ans}" data-hint="${esc(q.hint)}" data-explain="${esc(q.explain)}">
      <div class="premium-question">${esc(q.q)} = ?</div>
      <label>Your answer<input data-smart-answer inputmode="decimal" placeholder="Type answer"></label>
      <div class="hero-actions"><button class="btn premium-btn" data-check-smart>Check answer</button><button class="btn secondary" data-new-smart>New question</button></div>
      <div class="premium-feedback" data-smart-feedback>Try it. If it is wrong, Premium will give a useful hint.</div>
    </div>`;
  }

  function gcd(a,b){ a=Math.abs(Number(a)||0); b=Math.abs(Number(b)||0); while(b){ const t=b; b=a%b; a=t; } return a||1; }
  function simplifyFrac(n,d){ const g=gcd(n,d); return [n/g,d/g]; }
  function frac(n,d){ const s=simplifyFrac(n,d); return s[1]===1 ? String(s[0]) : `${s[0]}/${s[1]}`; }
  function makeVisualBar(n,d){
    const pieces=[];
    for(let i=0;i<d;i++) pieces.push(`<span class="ws-bar-piece ${i<n?'on':''}"></span>`);
    return `<div class="ws-fraction-visual" aria-label="${n} out of ${d} fraction bar">${pieces.join('')}</div>`;
  }
  function pickTopic(topic){
    if(topic !== 'mixed') return topic;
    const topics=['times','division','add','subtract','fractions-equivalent','fractions-simplify','fractions-compare','fractions-add','decimals','percentages','ratio','algebra','geometry','measurement','statistics'];
    return topics[rand(0, topics.length-1)];
  }
  function levelRange(level){
    if(level==='easy') return {min:2,max:8,big:50};
    if(level==='hard') return {min:6,max:15,big:900};
    return {min:3,max:12,big:250};
  }
  function worksheetQuestion(topic, level){
    const r=levelRange(level);
    const t=pickTopic(topic);
    let prompt='', answer='', hint='', working='', visual='', accepted=[];
    if(t==='times'){
      const a=rand(r.min,r.max), b=rand(2,12); answer=String(a*b); prompt=`${a} × ${b} =`; hint=`Think ${a} groups of ${b}.`; working=`${a} × ${b} = ${a*b}`;
    } else if(t==='division'){
      const b=rand(2,12), ans=rand(r.min,r.max), a=b*ans; answer=String(ans); prompt=`${a} ÷ ${b} =`; hint=`Ask: ${b} times what number gives ${a}?`; working=`${a} ÷ ${b} = ${ans}`;
    } else if(t==='add'){
      const a=rand(10,r.big), b=rand(10,r.big); answer=String(a+b); prompt=`${a} + ${b} =`; hint='Add place values carefully. Check by estimating.'; working=`${a} + ${b} = ${a+b}`;
    } else if(t==='subtract'){
      const a=rand(Math.max(60,Math.floor(r.big/2)||60),r.big+100), b=rand(10,Math.min(a-5, level==='hard'?220:90)); answer=String(a-b); prompt=`${a} − ${b} =`; hint='Subtract in parts, then check by adding back.'; working=`${a} − ${b} = ${a-b}`;
    } else if(t==='fractions-equivalent'){
      const d=[2,3,4,5,6,8][rand(0,5)], n=rand(1,d-1), m=level==='easy'?2:rand(2,4); const nn=n*m, dd=d*m; answer=`${nn}/${dd}`; accepted=[answer, frac(nn,dd)]; prompt=`Make an equivalent fraction: ${n}/${d} = ___/${dd}`; hint=`Multiply the bottom by ${m}, so multiply the top by ${m} too.`; working=`${n}/${d} = ${nn}/${dd}`; visual=makeVisualBar(n,d)+makeVisualBar(nn,dd);
    } else if(t==='fractions-simplify'){
      const d=[4,6,8,10,12,15,18,20,24,30][rand(0,9)], n=rand(1,d-1); const m=rand(2,4); const nn=n*m, dd=d*m; answer=frac(nn,dd); prompt=`Simplify ${nn}/${dd} =`; hint='Divide the top and bottom by the same number.'; working=`${nn}/${dd} = ${answer}`; visual=makeVisualBar(Math.min(nn,dd),dd);
    } else if(t==='fractions-compare'){
      const d1=[3,4,5,6,8,10][rand(0,5)], d2=[3,4,5,6,8,10][rand(0,5)], n1=rand(1,d1-1), n2=rand(1,d2-1); const v1=n1/d1, v2=n2/d2; answer=v1===v2?'=':(v1>v2?'>':'<'); prompt=`${n1}/${d1} ___ ${n2}/${d2}`; hint='Use the bars, or make common denominators.'; working=`${n1}/${d1} ${answer} ${n2}/${d2}`; visual=makeVisualBar(n1,d1)+makeVisualBar(n2,d2);
    } else if(t==='fractions-add'){
      const d=[4,5,6,8,10,12][rand(0,5)], a=rand(1,d-2), b=rand(1,d-a-1); const raw=`${a+b}/${d}`; answer=frac(a+b,d); accepted=[answer, raw]; prompt=`${a}/${d} + ${b}/${d} =`; hint='Same denominator means same kind of pieces. Add the top numbers only.'; working=`${a}/${d} + ${b}/${d} = ${raw}${raw!==answer?' = '+answer:''}`; visual=makeVisualBar(a,d)+makeVisualBar(b,d);
    } else if(t==='decimals'){
      const a=(rand(12,99)/10).toFixed(1), b=(rand(11,88)/10).toFixed(1); const ans=(Number(a)+Number(b)).toFixed(1).replace(/\.0$/,''); answer=String(ans); prompt=`${a} + ${b} =`; hint='Line up the decimal points.'; working=`${a} + ${b} = ${ans}`;
    } else if(t==='percentages'){
      const perc=[10,20,25,50,75][rand(0,4)], amount=[40,60,80,100,120,200][rand(0,5)]; answer=String(amount*perc/100); prompt=`${perc}% of ${amount} =`; hint='Percent means out of 100. 50% is half, 25% is a quarter.'; working=`${perc}% of ${amount} = ${answer}`;
    } else if(t==='ratio'){
      const a=rand(1,5), b=rand(1,5), unit=level==='hard'?rand(8,20):rand(3,10), total=(a+b)*unit; answer=String(a*unit); prompt=`Share ${total} in the ratio ${a}:${b}. First share =`; hint=`Total parts = ${a+b}. One part = ${total} ÷ ${a+b}.`; working=`${a+b} parts, one part = ${unit}, first share = ${a*unit}`;
    } else if(t==='algebra'){
      const x=rand(2, level==='hard'?25:12), add=rand(3, level==='hard'?40:18); answer=String(x); prompt=`x + ${add} = ${x+add}, so x =`; hint=`Subtract ${add} from both sides.`; working=`x = ${x+add} − ${add} = ${x}`;
    } else if(t==='geometry'){
      const l=rand(4,level==='hard'?30:15), w=rand(3,level==='hard'?20:12); answer=String(l*w); prompt=`Rectangle area: length ${l} cm, width ${w} cm. Area = ___ cm²`; hint='Area of a rectangle = length × width.'; working=`${l} × ${w} = ${l*w} cm²`;
    } else if(t==='measurement'){
      const m=rand(2,level==='hard'?25:12); answer=String(m*100); prompt=`${m} m = ___ cm`; hint='1 m = 100 cm.'; working=`${m} × 100 = ${m*100} cm`;
    } else if(t==='statistics'){
      const count=level==='easy'?3:4; const nums=Array.from({length:count},()=>rand(2,20)); const sum=nums.reduce((a,b)=>a+b,0); const mean=sum/count; answer=String(mean % 1 ? mean.toFixed(1) : mean); prompt=`Find the mean of ${nums.join(', ')} =`; hint='Mean = total ÷ how many numbers.'; working=`Total ${sum}; ${sum} ÷ ${count} = ${answer}`;
    }
    if(!accepted.length) accepted=[answer];
    return {topic:t,prompt,answer,accepted,hint,working,visual};
  }
  function topicLabel(t){
    const labels={mixed:'Mixed Skills',times:'Times Tables',division:'Division',add:'Addition',subtract:'Subtraction','fractions-equivalent':'Equivalent Fractions','fractions-simplify':'Simplify Fractions','fractions-compare':'Compare Fractions','fractions-add':'Add Fractions',decimals:'Decimals',percentages:'Percentages',ratio:'Ratio',algebra:'Algebra',geometry:'Geometry',measurement:'Measurement',statistics:'Statistics'};
    return labels[t] || t;
  }
  function worksheetTool(){
    return `<div class="premium-generator upgraded-generator"><div class="worksheet-control-grid">
      <label>Learner name<input data-ws-name placeholder="Space cadet name"></label>
      <label>Worksheet title<input data-ws-title placeholder="Maths Universe Mission Sheet"></label>
      <label>Topic<select data-ws-topic><option value="mixed">Mixed Skills</option><option value="times">Times Tables</option><option value="division">Division</option><option value="add">Addition</option><option value="subtract">Subtraction</option><option value="fractions-equivalent">Equivalent Fractions</option><option value="fractions-simplify">Simplify Fractions</option><option value="fractions-compare">Compare Fractions</option><option value="fractions-add">Add Fractions</option><option value="decimals">Decimals</option><option value="percentages">Percentages</option><option value="ratio">Ratio</option><option value="algebra">Algebra</option><option value="geometry">Geometry</option><option value="measurement">Measurement</option><option value="statistics">Statistics</option></select></label>
      <label>Difficulty<select data-ws-level><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select></label>
      <label>Questions<select data-ws-count><option>6</option><option>8</option><option selected>10</option><option>12</option><option>15</option><option>20</option></select></label>
      <label>Theme<select data-ws-theme><option value="space">Space Mission</option><option value="monster">Monster Battle</option><option value="calm">Calm Classroom</option><option value="exam">Exam Practice</option></select></label>
      <label class="check-row"><input type="checkbox" data-ws-visuals checked> Add helpful diagrams</label>
      <label class="check-row"><input type="checkbox" data-ws-key checked> Add answer key</label>
    </div><div class="hero-actions"><button class="btn premium-btn" data-generate-ws>Generate Worksheet</button><button class="btn secondary" data-check-ws type="button">Check On Screen</button><button class="btn secondary" data-reveal-ws type="button">Reveal Answers</button><button class="btn secondary" data-clear-ws type="button">Clear Answers</button><button class="btn secondary" onclick="window.print()">Print / Save PDF</button></div><div class="generated-sheet upgraded-sheet" data-generated-sheet><p class="small">Choose options and press generate. You can print it, save as PDF, or answer on screen and check your score.</p></div></div>`;
  }
  function makeWorksheet(topic, level, count, opts={}){
    const title=(opts.title||'Maths Universe Mission Sheet').trim() || 'Maths Universe Mission Sheet';
    const name=(opts.name||'').trim();
    const theme=opts.theme || 'space';
    const includeKey=!!opts.includeKey;
    const includeVisuals=!!opts.includeVisuals;
    const icons={space:'🚀',monster:'👾',calm:'📘',exam:'✅'};
    const questions=[];
    for(let i=1;i<=count;i++) questions.push(worksheetQuestion(topic, level));
    const rows=questions.map((q,i)=>{
      const encoded=encodeURIComponent(JSON.stringify(q.accepted));
      return `<div class="worksheet-question-row" data-ws-row data-ws-hint="${esc(q.hint)}" data-ws-working="${esc(q.working)}"><div class="ws-number">${i+1}</div><div class="ws-question"><strong>${esc(q.prompt)}</strong>${includeVisuals && q.visual ? q.visual : ''}<div class="ws-answer-line"><span>Answer:</span><input data-ws-answer data-answers="${encoded}" autocomplete="off" placeholder="type here or print"></div><div class="ws-feedback" data-ws-feedback></div></div></div>`;
    }).join('');
    const key=questions.map((q,i)=>`<li><strong>${i+1}.</strong> ${esc(q.answer)} <span>${esc(q.working)}</span></li>`).join('');
    return `<div class="print-sheet premium-print-sheet" data-current-worksheet><div class="ws-sheet-head"><div><p class="ws-kicker">${icons[theme]||'🚀'} ${esc(topicLabel(topic))} • ${esc(level)} level</p><h2>${esc(title)}</h2><p>Name: ${name ? esc(name) : '__________________'} &nbsp;&nbsp; Date: __________________</p></div><div class="ws-score-badge" data-ws-score>Score: __/${count}</div></div><div class="ws-mission-box"><strong>Mission:</strong> Show your working. If you get stuck, use the hint after checking.</div><div class="premium-sheet-list upgraded-list">${rows}</div>${includeKey ? `<details class="answer-key-box"><summary>Answer Key</summary><ol>${key}</ol></details>` : ''}<p class="small ws-print-tip">Premium tip: print this page or use your browser's Save as PDF. On-screen answers can be checked before printing.</p></div>`;
  }
  function normaliseWsAnswer(x){ return String(x||'').trim().toLowerCase().replace(/\s+/g,'').replace(/×/g,'x').replace(/÷/g,'/').replace(/−/g,'-'); }
  function fractionValue(s){ const m=String(s).trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/); if(!m)return null; const d=Number(m[2]); if(!d)return null; return Number(m[1])/d; }
  function answerMatches(user, accepted){
    const u=normaliseWsAnswer(user);
    if(!u)return false;
    for(const a of accepted){
      const aa=normaliseWsAnswer(a);
      if(u===aa)return true;
      const fu=fractionValue(u), fa=fractionValue(aa);
      if(fu!==null && fa!==null && Math.abs(fu-fa)<1e-9)return true;
      if(!isNaN(Number(u)) && !isNaN(Number(aa)) && Math.abs(Number(u)-Number(aa))<1e-9)return true;
    }
    return false;
  }

  function snapshotTool(){
    const course=getCourseState(), game=getGameStats(), prem=getPremiumStats();
    const completed=(course.completed||[]).length;
    const percent=Math.round(completed/14*100);
    const next = completed < 14 ? `Mission ${completed+1}` : 'Certificate and extension work';
    return `<div class="grid-3"><div class="stat-card"><strong>${completed}/14</strong><span>Missions completed</span></div><div class="stat-card"><strong>${percent}%</strong><span>Course progress</span></div><div class="stat-card"><strong>${game.xp||0}</strong><span>Game XP</span></div><div class="stat-card"><strong>${game.coins||0}</strong><span>Coins</span></div><div class="stat-card"><strong>${game.best||0}</strong><span>Best streak</span></div><div class="stat-card"><strong>${prem.toolsOpened||0}</strong><span>Premium tools opened</span></div></div><div class="card pad" style="margin-top:1rem"><h3>Recommended next step</h3><p>Work on <strong>${esc(next)}</strong>, then use Smart Hint Lab for any mistakes.</p><button class="btn secondary" onclick="window.print()">Print Snapshot</button></div>`;
  }

  function bossTool(){
    return `<div class="mega-boss" data-mega-boss><div class="boss-score-row"><span>Score: <b data-boss-score>0</b></span><span>Question: <b data-boss-number>1</b>/10</span><span>Time: <b data-boss-time>60</b>s</span></div><div class="premium-question" data-boss-question>Press Start Boss</div><div class="battle-options" data-boss-options></div><div class="premium-feedback" data-boss-feedback>Beat 10 mixed questions before time runs out.</div><div class="hero-actions"><button class="btn premium-btn" data-start-boss>Start Boss</button><button class="btn secondary" data-reset-boss>Reset</button></div></div>`;
  }

  function adventureTool(){
    const packs = [
      ['🚀 Space Fractions','Use fraction bars to power a rocket.','fractions.html'],
      ['🐉 Dragon Algebra','Solve x problems to unlock dragon gates.','algebra.html'],
      ['🧊 Decimal Ice Cave','Compare decimals to cross frozen bridges.','decimals.html'],
      ['🏰 Geometry Castle','Use angles, area, and perimeter to repair the castle.','geometry.html']
    ];
    return `<div class="grid-2">${packs.map(p=>`<a class="card pad adventure-card" href="${p[2]}"><h3>${p[0]}</h3><p>${p[1]}</p><span class="badge premium-badge active">Premium Pack</span></a>`).join('')}</div>`;
  }

  function certificateTool(){
    return `<div class="premium-certificate-tool"><label>Learner name<input data-cert-name placeholder="Type learner name"></label><label>Achievement title<input data-cert-title placeholder="Premium Maths Star"></label><div class="certificate-preview mini-certificate" data-cert-preview><h2>Premium Maths Star</h2><p>awarded to</p><h1>Learner Name</h1><p>for brave effort, smart thinking, and maths progress in Maths Universe Premium.</p></div><button class="btn secondary" onclick="window.print()">Print Certificate</button></div>`;
  }

  function attachToolEvents(){
    const smart=$('[data-smart-hint]');
    if(smart){
      $('[data-check-smart]')?.addEventListener('click',()=>{
        const ans=Number(smart.dataset.answer);
        const val=Number($('[data-smart-answer]').value);
        const fb=$('[data-smart-feedback]');
        if(val===ans){ fb.className='premium-feedback good'; fb.textContent='Correct! Premium win: you understood the method.'; }
        else { updatePremiumStats('hintsUsed',1); fb.className='premium-feedback bad'; fb.innerHTML=`Not yet. <strong>Hint:</strong> ${esc(smart.dataset.hint)}<br><strong>Why:</strong> ${esc(smart.dataset.explain)}`; }
      });
      $('[data-new-smart]')?.addEventListener('click',()=>showPanel('Smart Hint Lab','Hints that teach, not just answers.', smartHintTool()));
    }
    $('[data-generate-ws]')?.addEventListener('click',()=>{
      const topic=$('[data-ws-topic]').value;
      const level=$('[data-ws-level]').value;
      const count=Number($('[data-ws-count]').value||10);
      const opts={
        name:$('[data-ws-name]')?.value||'',
        title:$('[data-ws-title]')?.value||'',
        theme:$('[data-ws-theme]')?.value||'space',
        includeKey:!!$('[data-ws-key]')?.checked,
        includeVisuals:!!$('[data-ws-visuals]')?.checked
      };
      $('[data-generated-sheet]').innerHTML=makeWorksheet(topic,level,count,opts);
      updatePremiumStats('worksheets',1);
    });
    $('[data-check-ws]')?.addEventListener('click',()=>{
      const rows=$$('[data-ws-row]');
      if(!rows.length){ $('[data-generated-sheet]').innerHTML='<p class="premium-feedback bad">Generate a worksheet first.</p>'; return; }
      let score=0;
      rows.forEach(row=>{
        const input=row.querySelector('[data-ws-answer]');
        const feedback=row.querySelector('[data-ws-feedback]');
        let accepted=[];
        try{ accepted=JSON.parse(decodeURIComponent(input.dataset.answers||'%5B%5D')); }catch(e){ accepted=[]; }
        if(answerMatches(input.value, accepted)){ score++; row.classList.add('correct'); row.classList.remove('wrong'); feedback.className='ws-feedback good'; feedback.textContent='Correct — nice work!'; }
        else { row.classList.add('wrong'); row.classList.remove('correct'); feedback.className='ws-feedback bad'; feedback.innerHTML='Not yet. Hint: '+esc(row.dataset.wsHint || 'Try the method again.'); }
      });
      const badge=$('[data-ws-score]'); if(badge) badge.textContent='Score: '+score+'/'+rows.length;
      updatePremiumStats('hintsUsed', rows.length-score);
    });
    $('[data-reveal-ws]')?.addEventListener('click',()=>{
      $$('[data-ws-row]').forEach(row=>{
        const input=row.querySelector('[data-ws-answer]');
        const feedback=row.querySelector('[data-ws-feedback]');
        let accepted=[];
        try{ accepted=JSON.parse(decodeURIComponent(input.dataset.answers||'%5B%5D')); }catch(e){ accepted=[]; }
        if(!input.value) input.value=accepted[0]||'';
        feedback.className='ws-feedback good';
        feedback.innerHTML='<strong>Answer:</strong> '+esc(accepted[0]||'')+'<br><strong>Working:</strong> '+esc(row.dataset.wsWorking||'');
      });
    });
    $('[data-clear-ws]')?.addEventListener('click',()=>{
      $$('[data-ws-row]').forEach(row=>{ row.classList.remove('correct','wrong'); const input=row.querySelector('[data-ws-answer]'); if(input) input.value=''; const fb=row.querySelector('[data-ws-feedback]'); if(fb){fb.className='ws-feedback'; fb.textContent='';} });
      const badge=$('[data-ws-score]'); if(badge) badge.textContent=badge.textContent.replace(/Score:.*/, 'Score: __/'+$$('[data-ws-row]').length);
    });
    $('[data-start-boss]')?.addEventListener('click', startBoss);
    $('[data-reset-boss]')?.addEventListener('click',()=>showPanel('Mega Boss Battle','A harder mixed premium challenge.', bossTool()));
    const certName=$('[data-cert-name]'), certTitle=$('[data-cert-title]'), prev=$('[data-cert-preview]');
    function renderCert(){ if(prev) prev.innerHTML=`<h2>${esc(certTitle?.value||'Premium Maths Star')}</h2><p>awarded to</p><h1>${esc(certName?.value||'Learner Name')}</h1><p>for brave effort, smart thinking, and maths progress in Maths Universe Premium.</p>`; }
    certName?.addEventListener('input', renderCert); certTitle?.addEventListener('input', renderCert);
  }

  let bossTimer=null, bossState=null;
  function startBoss(){
    bossState={score:0,n:1,time:60,question:null};
    clearInterval(bossTimer);
    bossTimer=setInterval(()=>{
      if(!bossState)return;
      bossState.time--;
      const t=$('[data-boss-time]'); if(t)t.textContent=bossState.time;
      if(bossState.time<=0)finishBoss();
    },1000);
    nextBossQuestion();
  }
  function nextBossQuestion(){
    if(!bossState)return;
    if(bossState.n>10){ finishBoss(); return; }
    const kinds=['add','subtract','times','fractions','algebra'];
    const q=makeQuestion(kinds[rand(0,kinds.length-1)]);
    bossState.question=q;
    $('[data-boss-score]').textContent=bossState.score;
    $('[data-boss-number]').textContent=bossState.n;
    $('[data-boss-time]').textContent=bossState.time;
    $('[data-boss-question]').textContent=q.q+' = ?';
    const opts=shuffle([q.ans,q.ans+rand(1,8),Math.max(0,q.ans-rand(1,8)),q.ans+rand(9,16)]);
    $('[data-boss-options]').innerHTML=opts.map(o=>`<button class="option" data-boss-answer="${o}">${o}</button>`).join('');
    $$('[data-boss-answer]').forEach(b=>b.addEventListener('click',()=>{
      if(Number(b.dataset.bossAnswer)===bossState.question.ans){ bossState.score++; $('[data-boss-feedback]').className='premium-feedback good'; $('[data-boss-feedback]').textContent='Correct! Boss damage.'; }
      else { $('[data-boss-feedback]').className='premium-feedback bad'; $('[data-boss-feedback]').textContent='Not that one. Hint: '+bossState.question.hint; }
      bossState.n++;
      setTimeout(nextBossQuestion,450);
    }));
  }
  function finishBoss(){
    clearInterval(bossTimer);
    const score=bossState?bossState.score:0;
    const s=getPremiumStats(); s.bossBest=Math.max(s.bossBest||0, score); savePremiumStats(s);
    $('[data-boss-question]').textContent='Mega Boss finished!';
    $('[data-boss-options]').innerHTML='';
    $('[data-boss-feedback]').className=score>=8?'premium-feedback good':'premium-feedback bad';
    $('[data-boss-feedback]').textContent=`Final score: ${score}/10. Best score saved: ${Math.max(s.bossBest||0, score)}/10.`;
    bossState=null;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    renderPremium();
    $('[data-premium-form]')?.addEventListener('submit',e=>{
      e.preventDefault();
      const code=String(new FormData(e.currentTarget).get('premiumCode')||'').trim().toUpperCase();
      if(DEMO_CODES.includes(code)){ setUnlocked(true); msg('Premium unlocked on this browser. Open a premium tool below.'); }
      else msg('That premium code is not valid. Check the spelling and try again.', false);
    });
    $('[data-lock-premium]')?.addEventListener('click',()=>{ setUnlocked(false); msg('Premium locked again on this browser.', true); });
    $$('[data-open-tool]').forEach(b=>b.addEventListener('click',()=>{
      const t=b.dataset.openTool;
      if(t==='hint') showPanel('Smart Hint Lab','Hints that teach, not just answers.', smartHintTool());
      if(t==='worksheet') showPanel('Worksheet Generator','Create printable practice instantly.', worksheetTool());
      if(t==='snapshot') showPanel('Parent Snapshot','A simple progress report from this browser.', snapshotTool());
      if(t==='boss') showPanel('Mega Boss Battle','A harder mixed premium challenge.', bossTool());
      if(t==='adventure') showPanel('Adventure Packs','Bonus themed premium practice missions.', adventureTool());
      if(t==='certificate') showPanel('Premium Certificate Builder','Create a printable premium certificate.', certificateTool());
    }));
    $('[data-close-tool]')?.addEventListener('click',()=> $('[data-tool-panel]')?.classList.add('hidden'));
    $$('[data-buy-premium]').forEach(a=>a.addEventListener('click',e=>{
      if(!CONFIG.paymentLink){ e.preventDefault(); location.hash='unlock-premium'; msg('Payment link is not connected yet. Add your Stripe link in premium-config.js. For testing, use MATHS-STAR.'); }
    }));
  });
})();
