
(function(){
  const GAME_KEY='mathsUniverseGameStatsV1';
  const LAB_KEY='mathsUniverseInteractiveLabV1';
  const AVATAR_KEY='mathsUniverseAvatarV1';
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const today=()=>new Date().toISOString().slice(0,10);
  function safeParse(key, fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch(e){return fallback}}
  function save(key, value){localStorage.setItem(key, JSON.stringify(value));}
  function game(){return safeParse(GAME_KEY,{xp:0,coins:0,streak:0,best:0,wins:0,daily:false});}
  function saveGame(g){save(GAME_KEY,g); renderHud();}
  function lab(){return safeParse(LAB_KEY,{dailyDone:'',speedBest:0,builds:0,equationWins:0,spins:0});}
  function saveLab(l){save(LAB_KEY,l); renderLabStatus();}
  function level(xp){return Math.floor((xp||0)/100)+1;}
  function reward(xp,coins,message){const g=game();g.xp=(g.xp||0)+xp;g.coins=(g.coins||0)+coins;g.streak=(g.streak||0)+1;g.best=Math.max(g.best||0,g.streak||0);saveGame(g); pop(message||`+${xp} XP, +${coins} coins`);}
  function pop(text){const t=document.createElement('div');t.className='toast lab-toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
  function renderHud(){const g=game();$$('[data-game-xp]').forEach(e=>e.textContent=g.xp||0);$$('[data-game-coins]').forEach(e=>e.textContent=g.coins||0);$$('[data-game-streak]').forEach(e=>e.textContent=g.streak||0);$$('[data-game-best]').forEach(e=>e.textContent=g.best||0);$$('[data-game-level]').forEach(e=>e.textContent=level(g.xp||0));}
  function renderLabStatus(){const l=lab();$$('[data-today-status]').forEach(e=>e.textContent=l.dailyDone===today()?'Complete':'Not started');$$('[data-speed-best]').forEach(e=>e.textContent=l.speedBest||0);$$('[data-build-count]').forEach(e=>e.textContent=l.builds||0);$$('[data-equation-wins]').forEach(e=>e.textContent=l.equationWins||0);}
  function avatar(){return localStorage.getItem(AVATAR_KEY)||'🚀';}
  function renderAvatar(){const a=avatar();$$('[data-avatar-display],[data-home-avatar]').forEach(e=>e.textContent=a);$$('[data-avatar-option]').forEach(b=>b.classList.toggle('active',b.dataset.avatarOption===a));}
  function initAvatar(){const grid=$('[data-avatar-grid]'); if(!grid)return; $$('[data-avatar-option]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem(AVATAR_KEY,btn.dataset.avatarOption);renderAvatar();pop('Avatar saved!')}));}
  const quests=[
    {q:'7 × 8 = ?', a:'56', opts:['54','56','64','48'], hint:'Use 7 lots of 8.'},
    {q:'Which is bigger: 1/2 or 3/8?', a:'1/2', opts:['1/2','3/8','same','not sure'], hint:'Half is 4/8, so compare 4/8 with 3/8.'},
    {q:'Round 347 to the nearest 10.', a:'350', opts:['340','347','350','300'], hint:'The ones digit is 7, so round up.'},
    {q:'Simplify 6/10.', a:'3/5', opts:['3/5','6/5','3/10','1/2'], hint:'Divide top and bottom by 2.'},
    {q:'x + 9 = 15. What is x?', a:'6', opts:['4','5','6','24'], hint:'Subtract 9 from both sides.'},
    {q:'What is 25% of 80?', a:'20', opts:['10','20','25','40'], hint:'25% is one quarter.'}
  ];
  function dayQuest(){const d=new Date();return quests[(d.getFullYear()+d.getMonth()*31+d.getDate())%quests.length];}
  function buildOptions(q, done){return q.opts.map(o=>`<button class="option" data-quest-answer="${o}" ${done?'disabled':''}>${o}</button>`).join('');}
  function initDaily(){
    const boxes=$$('[data-daily-quest], [data-home-daily-quest]'); if(!boxes.length)return;
    const q=dayQuest(); const l=lab(); const done=l.dailyDone===today();
    boxes.forEach(box=>{
      const compact=box.matches('[data-home-daily-quest]');
      box.innerHTML=`${compact?'<div class="avatar-bubble" data-home-avatar>'+avatar()+'</div>':''}<h3>${compact?'Daily Quest':'Today’s Daily Quest'}</h3><p class="daily-question">${q.q}</p><div class="daily-options">${buildOptions(q,done)}</div><p class="feedback ${done?'good':'hidden'}" data-daily-feedback>${done?'Completed today. Come back tomorrow for a new quest.':''}</p>${compact?'<a class="btn secondary" href="interactive-lab.html#daily-quest">Open Lab</a>':''}`;
    });
    $$('[data-quest-answer]').forEach(btn=>btn.addEventListener('click',()=>{
      const l=lab(); if(l.dailyDone===today())return;
      const fb=btn.closest('[data-daily-quest], [data-home-daily-quest]').querySelector('[data-daily-feedback]');
      if(btn.dataset.questAnswer===q.a){btn.classList.add('correct');l.dailyDone=today();saveLab(l);reward(20,15,'Daily quest complete! +20 XP, +15 coins');$$('[data-quest-answer]').forEach(b=>b.disabled=true);$$('[data-daily-feedback]').forEach(f=>{f.className='feedback good';f.textContent='Correct! Daily reward claimed.'});}
      else{btn.classList.add('wrong'); if(fb){fb.className='feedback bad';fb.textContent='Hint: '+q.hint;}}
    }));
  }
  function gcd(a,b){while(b){[a,b]=[b,a%b]}return Math.abs(a)||1;}
  function initFractionBuilder(){const wrap=$('[data-fraction-pieces]'); if(!wrap)return; const denSel=$('[data-denominator]'); let shaded=new Set(); function render(){const den=Number(denSel.value); shaded=new Set([...shaded].filter(i=>i<den)); wrap.style.gridTemplateColumns=`repeat(${Math.min(den,6)},1fr)`; wrap.innerHTML=''; for(let i=0;i<den;i++){const b=document.createElement('button');b.className='fraction-piece '+(shaded.has(i)?'shaded':'');b.textContent=shaded.has(i)?'★':'';b.setAttribute('aria-label','fraction piece '+(i+1));b.onclick=()=>{shaded.has(i)?shaded.delete(i):shaded.add(i);render();};wrap.appendChild(b);} const n=shaded.size; const g=gcd(n,den); const simple=n?`${n/g}/${den/g}`:'0'; $('[data-fraction-readout]').textContent=`${n}/${den}`; $('[data-fraction-message]').innerHTML=n===0?'Click pieces to start.':`Simplified: <strong>${simple}</strong>. ${n*2===den?'That is exactly one half!':n*2>den?'More than one half.':'Less than one half.'}`;}
    denSel.addEventListener('change',()=>{shaded.clear();render();});$('[data-fraction-clear]').addEventListener('click',()=>{shaded.clear();render();});$('[data-fraction-reward]').addEventListener('click',()=>{if(!shaded.size)return pop('Shade at least one piece first.');const l=lab();l.builds=(l.builds||0)+1;saveLab(l);reward(5,3,'Fraction build saved! +5 XP, +3 coins');});render();}
  function initPlaceValue(){const input=$('[data-place-value-input]'),out=$('[data-place-value-output]'); if(!input||!out)return; function render(){let n=Math.max(0,Math.min(999,Number(input.value)||0));input.value=n;const h=Math.floor(n/100),t=Math.floor((n%100)/10),o=n%10;out.innerHTML=`<div class="pv-card"><strong>${h}</strong><span>hundreds</span><div class="pv-blocks">${'█'.repeat(h)}</div></div><div class="pv-card"><strong>${t}</strong><span>tens</span><div class="pv-blocks">${'▮'.repeat(t)}</div></div><div class="pv-card"><strong>${o}</strong><span>ones</span><div class="pv-blocks">${'●'.repeat(o)}</div></div><p class="small">${n} = ${h*100} + ${t*10} + ${o}</p>`;} input.addEventListener('input',render);render();}
  let eq={x:7,a:4,b:11}; function newEq(){const x=Math.floor(Math.random()*12)+1;const a=Math.floor(Math.random()*12)+1;eq={x,a,b:x+a};$('[data-left-pan]').textContent=`x + ${a}`;$('[data-right-pan]').textContent=String(x+a);const inp=$('[data-equation-answer]');if(inp)inp.value='';const fb=$('[data-equation-feedback]'); if(fb)fb.className='feedback hidden';}
  function initEquation(){if(!$('[data-check-equation]'))return; newEq();$('[data-new-equation]').addEventListener('click',newEq);$('[data-check-equation]').addEventListener('click',()=>{const val=Number($('[data-equation-answer]').value);const fb=$('[data-equation-feedback]'); if(val===eq.x){fb.className='feedback good';fb.textContent='Balanced! You found x = '+eq.x;const l=lab();l.equationWins=(l.equationWins||0)+1;saveLab(l);reward(10,6,'Equation balanced! +10 XP, +6 coins');newEq();}else{fb.className='feedback bad';fb.textContent=`Not balanced yet. Hint: subtract ${eq.a} from ${eq.b}.`;}});}
  function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;} function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rand(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
  let speed={active:false,time:30,score:0,timer:null,ans:0}; function speedQ(){const a=rand(2,12),b=rand(2,12);speed.ans=a*b;let opts=[speed.ans];while(opts.length<4){let w=speed.ans+rand(-15,15);if(w>0&&!opts.includes(w))opts.push(w);}opts=shuffle(opts);$('[data-speed-question]').textContent=`${a} × ${b} = ?`;$('[data-speed-options]').innerHTML=opts.map(o=>`<button class="option" data-speed-answer="${o}">${o}</button>`).join('');$$('[data-speed-answer]').forEach(b=>b.addEventListener('click',()=>{if(!speed.active)return;if(Number(b.dataset.speedAnswer)===speed.ans){speed.score++;b.classList.add('correct');speedQ();}else{b.classList.add('wrong');}}));}
  function endSpeed(){speed.active=false;clearInterval(speed.timer);const l=lab();l.speedBest=Math.max(l.speedBest||0,speed.score);saveLab(l);const fb=$('[data-speed-feedback]');fb.className='feedback good';fb.textContent=`Speed run finished. Score: ${speed.score}. Reward: +${speed.score*3} XP and +${speed.score} coins.`;reward(speed.score*3,speed.score,'Speed run reward claimed!');}
  function initSpeed(){if(!$('[data-speed-start]'))return;$('[data-speed-start]').addEventListener('click',()=>{speed={active:true,time:30,score:0,timer:null,ans:0};$('[data-speed-time]').textContent=speed.time;$('[data-speed-feedback]').className='feedback hidden';speedQ();speed.timer=setInterval(()=>{speed.time--; $('[data-speed-time]').textContent=speed.time; if(speed.time<=0)endSpeed();},1000);});$('[data-speed-stop]').addEventListener('click',()=>{if(speed.active)endSpeed();});}
  function initWheel(){const wheel=$('[data-reward-wheel]'); if(!wheel)return; let spinning=false; const rewards=[['+5 XP',5,0],['+10 coins',0,10],['Hint token',3,3],['+20 XP',20,0],['Bonus +15 coins',0,15],['Retry boost',7,7]]; $('[data-spin-wheel]').addEventListener('click',()=>{if(spinning)return;spinning=true;const index=rand(0,rewards.length-1);const deg=720+(index*60)+rand(5,50);wheel.style.transform=`rotate(${deg}deg)`;setTimeout(()=>{const r=rewards[index];reward(r[1],r[2],`Wheel reward: ${r[0]}`);const fb=$('[data-wheel-feedback]');fb.className='feedback good';fb.textContent='You won: '+r[0];const l=lab();l.spins=(l.spins||0)+1;saveLab(l);spinning=false;},1100);});$('[data-reset-lab]').addEventListener('click',()=>{if(confirm('Reset lab stats, avatar, XP and coins on this browser?')){localStorage.removeItem(LAB_KEY);localStorage.removeItem(GAME_KEY);localStorage.removeItem(AVATAR_KEY);location.reload();}});}
  document.addEventListener('DOMContentLoaded',()=>{renderHud();renderLabStatus();renderAvatar();initAvatar();initDaily();initFractionBuilder();initPlaceValue();initEquation();initSpeed();initWheel();});
})();
