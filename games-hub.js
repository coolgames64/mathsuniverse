
(function(){
  const KEY='mathsUniverseArcadeStatsV1';
  const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
  function stats(){try{return JSON.parse(localStorage.getItem(KEY))||{stars:0,best:0,races:0,puzzles:0,questStars:{}}}catch(e){return {stars:0,best:0,races:0,puzzles:0,questStars:{}}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s)); renderStats();}
  function renderStats(){const s=stats(); $$('[data-arcade-stars]').forEach(e=>e.textContent=s.stars||0); $$('[data-arcade-best]').forEach(e=>e.textContent=s.best||0); $$('[data-races-won]').forEach(e=>e.textContent=s.races||0); $$('[data-puzzles-solved]').forEach(e=>e.textContent=s.puzzles||0);}
  function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]];} return a}
  function safeEval(expr){
    if(!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Only numbers, +, -, *, / and brackets are allowed.');
    return Function('"use strict";return ('+expr+')')();
  }
  function makeQuestion(kind='mixed'){
    const types=kind==='mixed'?['add','times','fractions']: [kind];
    const t=types[rand(0,types.length-1)]; let q='', ans=0, hint='';
    if(t==='add'){const a=rand(12,99),b=rand(8,88); q=`${a} + ${b}`; ans=a+b; hint='Split into tens and ones, then add.';}
    if(t==='times'){const a=rand(2,12),b=rand(2,12); q=`${a} × ${b}`; ans=a*b; hint='Use a known times-table fact or double/halve.';}
    if(t==='fractions'){const d=[2,3,4,5,6,8][rand(0,5)]; const n=rand(1,d-1); const total=d*rand(2,8); q=`${n}/${d} of ${total}`; ans=total/d*n; hint='Divide by the bottom number, then multiply by the top number.';}
    const opts=[ans]; while(opts.length<4){let w=ans+rand(-10,10); if(w!==ans && w>=0 && !opts.includes(w)) opts.push(w)}
    return {q,ans,opts:shuffle(opts),hint};
  }
  function showOptions(container, opts, cb){container.innerHTML=opts.map(v=>`<button class="option" data-val="${v}">${v}</button>`).join(''); container.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>cb(Number(b.dataset.val), b)));}
  function showPanel(id){$$('[data-arcade-panel]').forEach(p=>p.classList.remove('active')); const p=$(`[data-arcade-panel="${id}"]`); if(p){p.classList.add('active'); p.scrollIntoView({behavior:'smooth',block:'start'});} }

  // filters
  const topic=$('[data-game-filter-topic]'), style=$('[data-game-filter-style]');
  function filterCards(){const t=topic?.value||'all', st=style?.value||'all'; $$('[data-game-card-grid] .arcade-game-card').forEach(c=>{const okT=t==='all'||(c.dataset.topic||'').includes(t); const okS=st==='all'||(c.dataset.style||'').includes(st); c.style.display=okT&&okS?'':'none';});}
  topic?.addEventListener('change',filterCards); style?.addEventListener('change',filterCards); $$('[data-open-panel]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.openPanel)));

  // Sprint
  let sprintTimer=null, sprintTime=30, sprintScore=0, sprintStreak=0, sprintCurrent=null;
  function renderSprintQ(){const kind=$('[data-sprint-topic]')?.value||'mixed'; sprintCurrent=makeQuestion(kind); $('[data-sprint-question]').textContent=sprintCurrent.q; showOptions($('[data-sprint-options]'), sprintCurrent.opts, (v,b)=>{if(!sprintCurrent)return; if(v===sprintCurrent.ans){sprintScore++; sprintStreak++; const s=stats(); s.stars=(s.stars||0)+1; s.best=Math.max(s.best||0,sprintStreak); save(s); $('[data-sprint-feedback]').textContent=`Correct! Score ${sprintScore}. Streak ${sprintStreak}.`; $('[data-sprint-feedback]').className='battle-feedback good'; renderSprintQ();}else{b.classList.add('wrong'); sprintStreak=0; $('[data-sprint-feedback]').textContent='Try again. Hint: '+sprintCurrent.hint; $('[data-sprint-feedback]').className='battle-feedback bad';}});}
  $('[data-start-sprint]')?.addEventListener('click',()=>{clearInterval(sprintTimer); sprintTime=30; sprintScore=0; sprintStreak=0; $('[data-sprint-time]').textContent=sprintTime; renderSprintQ(); sprintTimer=setInterval(()=>{sprintTime--; $('[data-sprint-time]').textContent=sprintTime; if(sprintTime<=0){clearInterval(sprintTimer); sprintCurrent=null; $('[data-sprint-options]').innerHTML=''; $('[data-sprint-question]').textContent='Time!'; $('[data-sprint-feedback]').textContent=`Final score: ${sprintScore}. Press start to play again.`;}},1000);});

  // Race
  let player=0, ghost=0, raceCurrent=null, raceInterval=null;
  function updateRace(){ $('[data-player-ship]').style.left=Math.min(player,100)+'%'; $('[data-ghost-ship]').style.left=Math.min(ghost,100)+'%'; }
  function raceQuestion(){raceCurrent=makeQuestion(Math.random()>0.5?'times':'add'); $('[data-race-question]').textContent=raceCurrent.q; showOptions($('[data-race-options]'), raceCurrent.opts, (v,b)=>{if(v===raceCurrent.ans){player+=14; $('[data-race-feedback]').textContent='Boost! Correct answer powered your ship.'; $('[data-race-feedback]').className='battle-feedback good'; if(player>=100){clearInterval(raceInterval); const s=stats(); s.races=(s.races||0)+1; s.stars=(s.stars||0)+10; save(s); $('[data-race-feedback]').textContent='You won the race! +10 stars.'; } else raceQuestion();}else{b.classList.add('wrong'); ghost+=6; $('[data-race-feedback]').textContent='Ghost boost. Hint: '+raceCurrent.hint; $('[data-race-feedback]').className='battle-feedback bad';} updateRace();});}
  $('[data-start-race]')?.addEventListener('click',()=>{clearInterval(raceInterval); player=0;ghost=0;updateRace();raceQuestion(); raceInterval=setInterval(()=>{ghost+=3; updateRace(); if(ghost>=100){clearInterval(raceInterval); $('[data-race-feedback]').textContent='The ghost won. Start again and go faster.'; $('[data-race-feedback]').className='battle-feedback bad';}},1200);});
  $('[data-reset-race]')?.addEventListener('click',()=>{clearInterval(raceInterval);player=0;ghost=0;updateRace();$('[data-race-question]').textContent='Press start race';$('[data-race-options]').innerHTML='';});

  // Logic
  const logicBank=[{n:[2,3,4,5],t:17,h:'Try 5 × 3, then add or subtract the other numbers.'},{n:[6,2,3,1],t:24,h:'Try multiplying 6 by a bracket.'},{n:[8,4,2,1],t:16,h:'Can you make 4 from two small numbers, then multiply?'},{n:[9,3,2,1],t:14,h:'Try 9 + 3, then use 2 and 1.'},{n:[7,5,2,2],t:20,h:'Try building 10 first, then double it.'}];
  let logic=logicBank[0];
  function newLogic(){logic=logicBank[rand(0,logicBank.length-1)]; $('[data-logic-target]').textContent=logic.t; $('[data-logic-numbers]').innerHTML=logic.n.map(n=>`<span>${n}</span>`).join(''); $('[data-logic-expression]').value=''; $('[data-logic-feedback]').textContent='Use every number once. You can use +, -, ×, ÷ and brackets.'; $('[data-logic-feedback]').className='battle-feedback';}
  $('[data-new-logic]')?.addEventListener('click',newLogic);
  $('[data-logic-hint]')?.addEventListener('click',()=>{ $('[data-logic-feedback]').textContent=logic.h; $('[data-logic-feedback]').className='battle-feedback good';});
  $('[data-check-logic]')?.addEventListener('click',()=>{let expr=$('[data-logic-expression]').value.replaceAll('×','*').replaceAll('÷','/'); try{const used=(expr.match(/\d+/g)||[]).map(Number).sort((a,b)=>a-b).join(','); const needed=[...logic.n].sort((a,b)=>a-b).join(','); if(used!==needed) throw new Error('Use each number shown exactly once.'); const val=safeEval(expr); if(Math.abs(val-logic.t)<1e-9){const s=stats();s.puzzles=(s.puzzles||0)+1;s.stars=(s.stars||0)+8;save(s); $('[data-logic-feedback]').textContent='Door opened! +8 stars. Nice reasoning.'; $('[data-logic-feedback]').className='battle-feedback good';} else { $('[data-logic-feedback]').textContent=`That makes ${val}, not ${logic.t}. Try another expression.`; $('[data-logic-feedback]').className='battle-feedback bad';}}catch(e){$('[data-logic-feedback]').textContent=e.message; $('[data-logic-feedback]').className='battle-feedback bad';}});

  // Quest board
  const quests=[
    {id:'moon',icon:'🌙',title:'Moon Market',story:'The Moon Market needs quick addition to open the stalls.',kind:'add',target:3},
    {id:'rocket',icon:'🚀',title:'Rocket Tables',story:'Fuel the rocket by solving times-table boosts.',kind:'times',target:3},
    {id:'pizza',icon:'🍕',title:'Fraction Feast',story:'Aliens ordered fraction pizzas. Work out the shares.',kind:'fractions',target:3}
  ];
  let activeQuest=null, questProgress=0, questCurrent=null;
  function renderQuestBoard(){const s=stats(); $('[data-quest-board]').innerHTML=quests.map(q=>{const got=(s.questStars&&s.questStars[q.id])||0; return `<button class="quest-card" data-quest="${q.id}"><span>${q.icon}</span><strong>${q.title}</strong><small>${'★'.repeat(got)}${'☆'.repeat(Math.max(0,3-got))}</small></button>`}).join(''); $$('[data-quest]').forEach(b=>b.addEventListener('click',()=>startQuest(b.dataset.quest)));}
  function startQuest(id){activeQuest=quests.find(q=>q.id===id); questProgress=0; $('[data-quest-play]').classList.remove('hidden'); $('[data-quest-title]').textContent=activeQuest.icon+' '+activeQuest.title; $('[data-quest-story]').textContent=activeQuest.story; nextQuestQ();}
  function nextQuestQ(){questCurrent=makeQuestion(activeQuest.kind); $('[data-quest-question]').textContent=questCurrent.q; showOptions($('[data-quest-options]'), questCurrent.opts, (v,b)=>{if(v===questCurrent.ans){questProgress++; const s=stats(); s.stars=(s.stars||0)+2; s.questStars=s.questStars||{}; s.questStars[activeQuest.id]=Math.max(s.questStars[activeQuest.id]||0, questProgress); save(s); renderQuestBoard(); if(questProgress>=activeQuest.target){$('[data-quest-feedback]').textContent='Quest complete! Stars saved on the quest board.'; $('[data-quest-feedback]').className='battle-feedback good'; $('[data-quest-options]').innerHTML='';} else {$('[data-quest-feedback]').textContent='Correct! The story moves forward.'; $('[data-quest-feedback]').className='battle-feedback good'; nextQuestQ();}} else {b.classList.add('wrong'); $('[data-quest-feedback]').textContent='Not yet. Hint: '+questCurrent.hint; $('[data-quest-feedback]').className='battle-feedback bad';}});}

  renderStats(); newLogic(); renderQuestBoard(); updateRace();
})();
