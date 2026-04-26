(() => {
  const KEY = "mathsUniverseFractionAdventureV1";
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const games = {
    pizza: {
      title: "Pizza Builder",
      goal: "Make the fraction by clicking the pizza slices.",
      mode: "Visual fractions",
      hint: "The bottom number tells how many equal pieces. The top number tells how many pieces to colour.",
      questions: [
        { den: 2, num: 1, text: "Make 1/2 of the pizza." },
        { den: 4, num: 1, text: "Make 1/4 of the pizza." },
        { den: 4, num: 2, text: "Make 2/4 of the pizza." },
        { den: 3, num: 2, text: "Make 2/3 of the pizza." },
        { den: 6, num: 4, text: "Make 4/6 of the pizza." }
      ]
    },
    match: {
      title: "Fraction Match",
      goal: "Look at the coloured pieces, then choose the matching fraction.",
      mode: "Picture to number",
      hint: "Count coloured pieces for the top number. Count all equal pieces for the bottom number.",
      questions: [
        { den: 2, num: 1, options: ["1/2","1/4","2/2"], text: "Which fraction does the picture show?" },
        { den: 4, num: 2, options: ["1/4","2/4","3/4"], text: "Which fraction does the picture show?" },
        { den: 3, num: 1, options: ["1/3","2/3","3/3"], text: "Which fraction does the picture show?" },
        { den: 5, num: 3, options: ["2/5","3/5","4/5"], text: "Which fraction does the picture show?" },
        { den: 8, num: 4, options: ["4/8","2/8","6/8"], text: "Which fraction does the picture show?" }
      ]
    },
    rocket: {
      title: "Rocket Compare",
      goal: "Choose the bigger fraction and watch the rocket win.",
      mode: "Compare fractions",
      hint: "Use the bars. The fraction that covers more space is bigger.",
      questions: [
        { left: [1,2], right: [1,4], answer: "left", text: "Which rocket has more fuel?" },
        { left: [2,4], right: [1,2], answer: "same", text: "Which rocket has more fuel?" },
        { left: [3,4], right: [2,4], answer: "left", text: "Which rocket has more fuel?" },
        { left: [2,6], right: [3,6], answer: "right", text: "Which rocket has more fuel?" },
        { left: [3,8], right: [5,8], answer: "right", text: "Which rocket has more fuel?" }
      ]
    },
    monster: {
      title: "Feed the Monster",
      goal: "Choose two foods that add up to the monster’s target fraction.",
      mode: "Same-denominator addition",
      hint: "The bottom number stays the same. Add the top numbers only.",
      questions: [
        { target: [3,6], pieces: [[1,6],[2,6],[3,6],[4,6]], answer: ["1/6","2/6"], text: "Monster needs 3/6 energy. Choose two foods." },
        { target: [4,8], pieces: [[1,8],[2,8],[3,8],[4,8]], answer: ["1/8","3/8"], text: "Monster needs 4/8 energy. Choose two foods." },
        { target: [5,10], pieces: [[1,10],[2,10],[3,10],[4,10]], answer: ["2/10","3/10"], text: "Monster needs 5/10 energy. Choose two foods." },
        { target: [5,7], pieces: [[1,7],[2,7],[3,7],[4,7]], answer: ["2/7","3/7"], text: "Monster needs 5/7 energy. Choose two foods." },
        { target: [6,12], pieces: [[1,12],[2,12],[4,12],[5,12]], answer: ["2/12","4/12"], text: "Monster needs 6/12 energy. Choose two foods." }
      ]
    },
    boss: {
      title: "Fraction Dragon",
      goal: "Beat the dragon with all your fraction powers.",
      mode: "Boss battle",
      hint: "Use the picture first, then the numbers.",
      questions: [
        { type: "pizza", den: 2, num: 1, text: "Dragon Shield 1: Show 1/2." },
        { type: "match", den: 4, num: 2, options: ["1/4","2/4","3/4"], text: "Dragon Shield 2: What does the picture show?" },
        { type: "rocket", left: [3,4], right: [1,4], answer: "left", text: "Dragon Shield 3: Which is bigger?" },
        { type: "calc", prompt: "1/5 + 2/5 = ?", options: ["3/5","3/10","2/5"], answer: "3/5", text: "Dragon Shield 4: Add the fractions." },
        { type: "calc", prompt: "3/6 - 1/6 = ?", options: ["2/6","2/12","4/6"], answer: "2/6", text: "Final hit: subtract the fractions." }
      ]
    }
  };

  let state = load();
  let currentGame = "pizza";
  let qIndex = 0;
  let score = 0;
  let hearts = 3;
  let selectedSlices = new Set();
  let selectedFoods = [];
  let soundOn = true;

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY)) || { xp:0, stars:0, coins:0, completed:{}, bestScore:0 }; }
    catch(e){ return { xp:0, stars:0, coins:0, completed:{}, bestScore:0 }; }
  }
  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
    renderStats();
  }

  function beep(freq=540, dur=0.08){
    if(!soundOn) return;
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch(e){}
  }

  function renderStats(){
    const xp = state.xp || 0;
    const rank = xp >= 500 ? "Fraction Hero" : xp >= 250 ? "Rocket Ranger" : xp >= 100 ? "Pizza Pilot" : "Rookie Explorer";
    $('[data-fa-xp]').textContent = xp;
    $('[data-fa-stars]').textContent = state.stars || 0;
    $('[data-fa-coins]').textContent = state.coins || 0;
    $('[data-fa-rank]').textContent = rank;
    $('[data-fa-xpbar]').style.width = Math.min(100, xp % 100) + "%";
    $('[data-fa-score]').textContent = score;
    $('[data-fa-hearts]').textContent = "❤️".repeat(hearts) + "🖤".repeat(Math.max(0,3-hearts));
    $('[data-fa-stage]').textContent = Object.keys(games).indexOf(currentGame) + 1;
    updateMapLocks();
  }

  function updateMapLocks(){
    const order = Object.keys(games);
    $$('[data-fa-level]').forEach((btn, i) => {
      const slug = btn.dataset.faLevel;
      const prev = order[i-1];
      const unlocked = i === 0 || state.completed[prev];
      btn.classList.toggle('locked', !unlocked);
      btn.classList.toggle('done', !!state.completed[slug]);
      btn.disabled = !unlocked;
      btn.querySelector('span').textContent = state.completed[slug] ? "✓" : String(i+1);
    });
  }

  function setFeedback(text, type='neutral'){
    const box = $('[data-fa-feedback]');
    box.textContent = text;
    box.className = "fraction-feedback " + type;
  }

  function setGame(slug){
    if(!games[slug]) return;
    currentGame = slug;
    qIndex = 0;
    score = 0;
    hearts = 3;
    selectedSlices = new Set();
    selectedFoods = [];
    $$('[data-fa-level]').forEach(b => b.classList.toggle('active', b.dataset.faLevel === slug));
    renderQuestion();
  }

  function currentQuestion(){
    return games[currentGame].questions[qIndex];
  }

  function renderQuestion(){
    const game = games[currentGame];
    const q = currentQuestion();
    $('[data-fa-game-title]').textContent = game.title;
    $('[data-fa-game-goal]').textContent = game.goal;
    $('[data-fa-mode]').textContent = game.mode;
    $('[data-fa-hint]').textContent = game.hint;
    $('[data-fa-prompt]').textContent = q.text;
    $('[data-fa-question-count]').textContent = qIndex + 1;
    selectedSlices = new Set();
    selectedFoods = [];
    renderStats();

    const type = q.type || currentGame;
    if(type === "pizza") renderPizza(q);
    if(type === "match") renderMatch(q);
    if(type === "rocket") renderRocket(q);
    if(type === "monster") renderMonster(q);
    if(type === "calc") renderCalc(q);
    setFeedback("Play the challenge. If you get stuck, press Show Hint.", "neutral");
  }

  function fractionBar(num, den, label=""){
    let cells = "";
    for(let i=0;i<den;i++) cells += `<span class="${i<num?'on':''}"></span>`;
    return `<div class="fraction-bar-wrap"><div class="fraction-bar" style="grid-template-columns:repeat(${den},1fr)">${cells}</div><strong>${label || num + "/" + den}</strong></div>`;
  }

  function renderPizza(q){
    const area = $('[data-fa-stage-area]');
    area.innerHTML = `<div class="pizza-game">
      <div class="pizza-grid den-${q.den}" data-pizza-grid></div>
      <div class="fraction-big-label">${selectedSlices.size}/${q.den}</div>
    </div>`;
    const grid = $('[data-pizza-grid]');
    for(let i=0;i<q.den;i++){
      const btn = document.createElement('button');
      btn.className = 'pizza-slice';
      btn.textContent = i+1;
      btn.addEventListener('click', () => {
        if(selectedSlices.has(i)) selectedSlices.delete(i); else selectedSlices.add(i);
        btn.classList.toggle('selected');
        $('.fraction-big-label').textContent = `${selectedSlices.size}/${q.den}`;
      });
      grid.appendChild(btn);
    }
    $('[data-fa-controls]').innerHTML = `<button class="btn game-btn" data-check>Check ${q.num}/${q.den}</button>`;
    $('[data-check]').addEventListener('click', () => checkPizza(q));
  }

  function checkPizza(q){
    if(selectedSlices.size === q.num){
      good(`Great! ${q.num} out of ${q.den} equal pieces is ${q.num}/${q.den}.`);
    } else {
      bad(`Almost! You coloured ${selectedSlices.size}/${q.den}. You need ${q.num}/${q.den}. Count the coloured pieces again.`);
    }
  }

  function renderMatch(q){
    $('[data-fa-stage-area]').innerHTML = `<div class="match-stage">${fractionBar(q.num, q.den, "Picture")}</div>`;
    $('[data-fa-controls]').innerHTML = `<div class="fraction-option-row">${q.options.map(o=>`<button class="fraction-card-option" data-opt="${o}">${o}</button>`).join('')}</div>`;
    $$('[data-opt]').forEach(b => b.addEventListener('click', () => {
      if(b.dataset.opt === `${q.num}/${q.den}`) good(`Yes! The picture shows ${q.num}/${q.den}.`);
      else bad(`Not quite. Count coloured pieces for the top number and all pieces for the bottom number.`);
    }));
  }

  function renderRocket(q){
    const [ln,ld] = q.left, [rn,rd] = q.right;
    $('[data-fa-stage-area]').innerHTML = `<div class="rocket-race-stage">
      <div class="rocket-lane"><div class="rocket" data-rocket-left>🚀</div>${fractionBar(ln,ld,`${ln}/${ld}`)}</div>
      <div class="rocket-lane"><div class="rocket" data-rocket-right>🚀</div>${fractionBar(rn,rd,`${rn}/${rd}`)}</div>
    </div>`;
    $('[data-fa-controls]').innerHTML = `<div class="fraction-option-row">
      <button class="fraction-card-option" data-rocket="left">Left is bigger</button>
      <button class="fraction-card-option" data-rocket="same">Same size</button>
      <button class="fraction-card-option" data-rocket="right">Right is bigger</button>
    </div>`;
    $$('[data-rocket]').forEach(b => b.addEventListener('click', () => {
      const choice = b.dataset.rocket;
      animateRockets(q.answer);
      if(choice === q.answer) good(`Correct! ${formatCompare(q)}.`);
      else bad(`Look at the bars. The one covering more space is bigger. If they cover the same space, they are equal.`);
    }));
  }

  function formatCompare(q){
    const [ln,ld] = q.left, [rn,rd] = q.right;
    if(q.answer === "same") return `${ln}/${ld} is the same size as ${rn}/${rd}`;
    if(q.answer === "left") return `${ln}/${ld} is bigger than ${rn}/${rd}`;
    return `${rn}/${rd} is bigger than ${ln}/${ld}`;
  }
  function animateRockets(winner){
    const left = $('[data-rocket-left]');
    const right = $('[data-rocket-right]');
    if(!left || !right) return;
    left.style.transform = winner === 'left' || winner === 'same' ? 'translateX(80px)' : 'translateX(35px)';
    right.style.transform = winner === 'right' || winner === 'same' ? 'translateX(80px)' : 'translateX(35px)';
  }

  function renderMonster(q){
    $('[data-fa-stage-area]').innerHTML = `<div class="monster-stage">
      <div class="friendly-monster">👾</div>
      <div class="monster-speech">I need exactly <strong>${q.target[0]}/${q.target[1]}</strong> energy!</div>
      ${fractionBar(0, q.target[1], "Target")}
    </div>`;
    $('[data-fa-controls]').innerHTML = `<div class="fraction-option-row">${q.pieces.map(p=>`<button class="fraction-card-option food" data-food="${p[0]}/${p[1]}">⚡ ${p[0]}/${p[1]}</button>`).join('')}</div><button class="btn game-btn" data-feed-check>Feed Monster</button>`;
    $$('[data-food]').forEach(b => b.addEventListener('click', () => {
      const val = b.dataset.food;
      if(selectedFoods.includes(val)){
        selectedFoods = selectedFoods.filter(x => x !== val);
        b.classList.remove('selected');
      } else if(selectedFoods.length < 2){
        selectedFoods.push(val);
        b.classList.add('selected');
      }
      setFeedback(selectedFoods.length ? `Selected: ${selectedFoods.join(" + ")}` : "Choose two foods.", "neutral");
    }));
    $('[data-feed-check]').addEventListener('click', () => {
      const sorted = selectedFoods.slice().sort().join(',');
      const ans = q.answer.slice().sort().join(',');
      if(sorted === ans) good(`Yum! ${q.answer.join(" + ")} = ${q.target[0]}/${q.target[1]}.`);
      else bad(`Try again. Same denominator means same kind of pieces. Add the top numbers only.`);
    });
  }

  function renderCalc(q){
    $('[data-fa-stage-area]').innerHTML = `<div class="boss-calc-stage"><div class="dragon">🐉</div><div class="boss-question">${q.prompt}</div></div>`;
    $('[data-fa-controls]').innerHTML = `<div class="fraction-option-row">${q.options.map(o=>`<button class="fraction-card-option" data-calc="${o}">${o}</button>`).join('')}</div>`;
    $$('[data-calc]').forEach(b => b.addEventListener('click', () => {
      if(b.dataset.calc === q.answer) good(`Dragon hit! The answer is ${q.answer}.`);
      else bad(`Careful! If the denominators match, keep the bottom number the same.`);
    }));
  }

  function good(msg){
    beep(720, .08); setTimeout(()=>beep(920,.08),90);
    score += 10;
    state.xp = (state.xp || 0) + 12;
    state.coins = (state.coins || 0) + 3;
    setFeedback("✅ " + msg + " +12 XP", "good");
    sparkle();
    save();
    setTimeout(nextQuestion, 900);
  }

  function bad(msg){
    beep(220, .12);
    hearts -= 1;
    setFeedback("💡 " + msg, "bad");
    if(hearts <= 0){
      setFeedback("🛡 Shield empty. The level restarts, but you keep learning!", "bad");
      setTimeout(() => { hearts = 3; score = Math.max(0, score - 5); qIndex = 0; renderQuestion(); }, 1000);
    }
    renderStats();
  }

  function sparkle(){
    const area = $('[data-fa-stage-area]');
    const s = document.createElement('div');
    s.className = 'fraction-sparkle';
    s.textContent = '⭐';
    area.appendChild(s);
    setTimeout(()=>s.remove(), 800);
  }

  function nextQuestion(){
    const game = games[currentGame];
    if(qIndex < game.questions.length - 1){
      qIndex++;
      renderQuestion();
    } else {
      completeLevel();
    }
  }

  function completeLevel(){
    const wasDone = !!state.completed[currentGame];
    state.completed[currentGame] = true;
    state.stars = (state.stars || 0) + (wasDone ? 0 : 1);
    state.xp = (state.xp || 0) + 40;
    state.coins = (state.coins || 0) + 15;
    state.bestScore = Math.max(state.bestScore || 0, score);
    save();
    setFeedback(`🏆 ${games[currentGame].title} complete! You earned a star and unlocked the next zone.`, "good");
    const order = Object.keys(games);
    const next = order[order.indexOf(currentGame)+1];
    if(next){
      setTimeout(() => setGame(next), 1400);
    } else {
      $('[data-fa-stage-area]').innerHTML = `<div class="fraction-victory"><div>🏆</div><h2>Fraction Hero!</h2><p>You beat Fraction Planet and defeated the Fraction Dragon.</p><a class="btn game-btn" href="fractions.html">Go to Fractions Lesson</a></div>`;
      $('[data-fa-controls]').innerHTML = '';
    }
  }

  function showHint(){
    const game = games[currentGame];
    const q = currentQuestion();
    let extra = game.hint;
    if((q.type || currentGame) === "pizza") extra = `You need ${q.num} coloured pieces out of ${q.den}.`;
    if((q.type || currentGame) === "monster") extra = `Find two top numbers that add to ${q.target[0]}. The bottom number stays ${q.target[1]}.`;
    setFeedback("💡 Hint: " + extra, "neutral");
  }

  $$('[data-fa-level]').forEach(btn => btn.addEventListener('click', () => setGame(btn.dataset.faLevel)));
  $('[data-fa-start]')?.addEventListener('click', () => setGame('pizza'));
  $('[data-fa-next]')?.addEventListener('click', nextQuestion);
  $('[data-fa-hint-button]')?.addEventListener('click', showHint);
  $('[data-fa-sound]')?.addEventListener('click', (e) => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? "Sound: On" : "Sound: Off"; });
  $('[data-fa-reset]')?.addEventListener('click', () => {
    if(confirm("Reset Fraction Adventure progress on this browser?")){
      localStorage.removeItem(KEY);
      state = load();
      setGame('pizza');
    }
  });

  renderStats();
  renderQuestion();
})();