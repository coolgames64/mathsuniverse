const { useState, useEffect, useCallback } = React;

// ── helpers ──
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const simplify = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };

// ── Pizza SVG ──
function PizzaSVG({ numerator, denominator, size = 160, highlight = true, animate = false }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  const slices = [];
  for (let i = 0; i < denominator; i++) {
    const startAngle = (i * 360) / denominator - 90;
    const endAngle = ((i + 1) * 360) / denominator - 90;
    const s = (Math.PI / 180) * startAngle;
    const e = (Math.PI / 180) * endAngle;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const filled = i < numerator;
    slices.push(
      <g key={i} style={animate ? { animation: `popIn 0.4s ${i * 0.06}s both` } : {}}>
        <path
          d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
          fill={filled && highlight ? `hsl(${30 + i * 25}, 85%, 62%)` : "#f5e6d3"}
          stroke="#c4956a"
          strokeWidth="2.5"
        />
        {filled && highlight && (
          <>
            {[...Array(3)].map((_, j) => {
              const midA = (s + e) / 2;
              const pr = r * (0.35 + j * 0.18);
              const offA = midA + (j - 1) * 0.25;
              return (
                <circle key={j} cx={cx + pr * Math.cos(offA)} cy={cy + pr * Math.sin(offA)}
                  r={size * 0.028} fill="#d44" opacity="0.85" />
              );
            })}
          </>
        )}
      </g>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 3} fill="#e8c87a" />
      <circle cx={cx} cy={cy} r={r} fill="#f5e6d3" />
      {slices}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c4956a" strokeWidth="3" />
    </svg>
  );
}

// ── Bar Model ──
function BarModel({ numerator, denominator, size = 200 }) {
  const h = 44, gap = 2;
  const w = (size - gap * (denominator - 1)) / denominator;
  return (
    <svg width={size} height={h + 8} viewBox={`0 0 ${size} ${h + 8}`}>
      <rect x={0} y={4} width={size} height={h} rx={8} fill="#e0e0e0" stroke="#bbb" strokeWidth={2} />
      {[...Array(denominator)].map((_, i) => (
        <rect key={i} x={i * (w + gap)} y={4} width={w} height={h} rx={4}
          fill={i < numerator ? `hsl(${200 + i * 20}, 75%, 58%)` : "transparent"}
          stroke={i < numerator ? `hsl(${200 + i * 20}, 75%, 42%)` : "transparent"}
          strokeWidth={1.5}
          style={{ animation: i < numerator ? `popIn 0.3s ${i * 0.08}s both` : 'none' }}
        />
      ))}
    </svg>
  );
}

// ── Fraction Display ──
function FractionText({ n, d, big = false }) {
  const s = big ? 38 : 26;
  return (
    <span style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Fredoka', 'Comic Sans MS', cursive", fontWeight: 600, fontSize: s,
      lineHeight: 1.05, color: "#5a3e28", margin: "0 6px"
    }}>
      <span>{n}</span>
      <span style={{ width: "110%", height: 3, background: "#5a3e28", borderRadius: 2, margin: "1px 0" }} />
      <span>{d}</span>
    </span>
  );
}

// ── Star Burst ──
function StarBurst({ show }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }}>
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: "50%", fontSize: 28 + Math.random() * 20,
          animation: `starBurst 0.9s ${i * 0.04}s both`,
          transform: `rotate(${i * 20}deg)`,
        }}>⭐</div>
      ))}
    </div>
  );
}

// ── Confetti ──
function Confetti({ show }) {
  if (!show) return null;
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998, overflow: "hidden" }}>
      {[...Array(40)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: -20,
          width: 8 + Math.random() * 8,
          height: 8 + Math.random() * 8,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `confettiFall ${1.5 + Math.random()}s ${Math.random() * 0.5}s both`,
        }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════
// GAME MODES
// ══════════════════════════════════════════════

// ── Mode 1: Pizza Party – identify the fraction ──
function PizzaParty({ onScore, level }) {
  const [q, setQ] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const generate = useCallback(() => {
    const denoms = level === 1 ? [2, 3, 4] : level === 2 ? [3, 4, 5, 6] : [4, 5, 6, 8];
    const d = denoms[Math.floor(Math.random() * denoms.length)];
    const n = 1 + Math.floor(Math.random() * (d - 1));
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const wd = denoms[Math.floor(Math.random() * denoms.length)];
      const wn = 1 + Math.floor(Math.random() * (wd - 1));
      if (wn !== n || wd !== d) wrongs.add(`${wn}/${wd}`);
    }
    const opts = shuffle([`${n}/${d}`, ...wrongs]);
    setQ({ n, d, opts, answer: `${n}/${d}` });
    setSelected(null);
    setResult(null);
  }, [level]);

  useEffect(() => { generate(); }, [generate]);

  const check = (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.answer;
    setResult(correct);
    if (correct) onScore(10);
    setTimeout(generate, correct ? 1200 : 2000);
  };

  if (!q) return null;

  return (
    <div style={{ textAlign: "center" }}>
      <p style={styles.prompt}>🍕 How much pizza has been eaten? Pick the right fraction!</p>
      <div style={{ margin: "16px auto" }}>
        <PizzaSVG numerator={q.n} denominator={q.d} size={180} animate />
      </div>
      <div style={styles.optionGrid}>
        {q.opts.map((o) => {
          const [on, od] = o.split("/").map(Number);
          const isCorrect = o === q.answer;
          const isSelected = selected === o;
          let bg = "#fff";
          if (isSelected) bg = isCorrect ? "#c6f6d5" : "#fed7d7";
          else if (selected && isCorrect) bg = "#c6f6d5";
          return (
            <button key={o} onClick={() => check(o)} style={{
              ...styles.optBtn, background: bg,
              border: isSelected ? `3px solid ${isCorrect ? "#38a169" : "#e53e3e"}` : "3px solid #e8d5c4",
              transform: isSelected && isCorrect ? "scale(1.1)" : "scale(1)",
              cursor: selected ? "default" : "pointer",
            }}>
              <FractionText n={on} d={od} />
            </button>
          );
        })}
      </div>
      {result !== null && (
        <p style={{ ...styles.feedback, color: result ? "#38a169" : "#e53e3e" }}>
          {result ? "🎉 Amazing! You got it right!" : `😅 Oops! The answer was ${q.answer}`}
        </p>
      )}
    </div>
  );
}

// ── Mode 2: Fraction Builder – tap to colour ──
function FractionBuilder({ onScore, level }) {
  const [q, setQ] = useState(null);
  const [userN, setUserN] = useState(0);
  const [result, setResult] = useState(null);

  const generate = useCallback(() => {
    const denoms = level === 1 ? [2, 3, 4] : level === 2 ? [3, 4, 5, 6] : [4, 5, 6, 8];
    const d = denoms[Math.floor(Math.random() * denoms.length)];
    const n = 1 + Math.floor(Math.random() * (d - 1));
    setQ({ n, d });
    setUserN(0);
    setResult(null);
  }, [level]);

  useEffect(() => { generate(); }, [generate]);

  const check = () => {
    const correct = userN === q.n;
    setResult(correct);
    if (correct) onScore(10);
    setTimeout(generate, correct ? 1200 : 2000);
  };

  if (!q) return null;

  return (
    <div style={{ textAlign: "center" }}>
      <p style={styles.prompt}>🎨 Colour in <FractionText n={q.n} d={q.d} big /> of the blocks!</p>
      <p style={{ fontSize: 14, color: "#8B7355", marginBottom: 8 }}>Tap the blocks to colour them, then press "Check!"</p>
      <div style={{ margin: "12px auto", maxWidth: 320 }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
          {[...Array(q.d)].map((_, i) => (
            <button key={i} onClick={() => {
              if (result !== null) return;
              if (i < userN) setUserN(i);
              else setUserN(i + 1);
            }} style={{
              width: Math.min(60, 280 / q.d), height: 60, borderRadius: 10,
              border: "3px solid #c4956a",
              background: i < userN ? `hsl(${150 + i * 30}, 70%, 55%)` : "#f5e6d3",
              cursor: result !== null ? "default" : "pointer",
              transition: "all 0.2s",
              transform: i < userN ? "scale(1.05)" : "scale(1)",
            }} />
          ))}
        </div>
        <p style={{ fontFamily: "'Fredoka', cursive", fontSize: 20, margin: "10px 0", color: "#5a3e28" }}>
          You coloured: <FractionText n={userN} d={q.d} />
        </p>
        {result === null && (
          <button onClick={check} style={styles.checkBtn}>✅ Check!</button>
        )}
      </div>
      {result !== null && (
        <p style={{ ...styles.feedback, color: result ? "#38a169" : "#e53e3e" }}>
          {result ? "🌟 Perfect! You're a star!" : `🤔 Not quite — you needed to colour ${q.n} blocks`}
        </p>
      )}
    </div>
  );
}

// ── Mode 3: Fraction Math – add / compare fractions ──
function FractionMath({ onScore, level }) {
  const [q, setQ] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const generate = useCallback(() => {
    const mode = level <= 2 ? "compare" : "add";
    if (mode === "compare") {
      const d = [2, 3, 4, 6][Math.floor(Math.random() * 4)];
      const n1 = 1 + Math.floor(Math.random() * (d - 1));
      let n2 = 1 + Math.floor(Math.random() * (d - 1));
      while (n2 === n1) n2 = 1 + Math.floor(Math.random() * (d - 1));
      const answer = n1 > n2 ? "left" : "right";
      setQ({ mode: "compare", d, n1, n2, answer });
    } else {
      const d = [2, 3, 4][Math.floor(Math.random() * 3)];
      const n1 = 1 + Math.floor(Math.random() * Math.max(1, d - 2));
      const n2 = 1 + Math.floor(Math.random() * Math.max(1, d - n1));
      const ansN = n1 + n2;
      const [sn, sd] = ansN >= d ? [d, d] : simplify(ansN, d);
      const wrongs = new Set();
      while (wrongs.size < 2) {
        const wn = 1 + Math.floor(Math.random() * d);
        const wd = d;
        if (wn !== ansN) wrongs.add(`${wn}/${wd}`);
      }
      const opts = shuffle([`${sn}/${sd}`, ...wrongs]);
      setQ({ mode: "add", d, n1, n2, ansN: sn, ansD: sd, opts, answer: `${sn}/${sd}` });
    }
    setSelected(null);
    setResult(null);
  }, [level]);

  useEffect(() => { generate(); }, [generate]);

  if (!q) return null;

  if (q.mode === "compare") {
    const check = (choice) => {
      if (selected) return;
      setSelected(choice);
      const correct = choice === q.answer;
      setResult(correct);
      if (correct) onScore(15);
      setTimeout(generate, correct ? 1200 : 2000);
    };
    return (
      <div style={{ textAlign: "center" }}>
        <p style={styles.prompt}>⚖️ Which fraction is bigger? Tap the bigger one!</p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <button onClick={() => check("left")} style={{
            ...styles.compareCard,
            border: selected === "left" ? `4px solid ${result ? "#38a169" : "#e53e3e"}` : "4px solid #e8d5c4",
            background: selected === "left" ? (result ? "#c6f6d5" : "#fed7d7") : (selected && q.answer === "left" ? "#c6f6d5" : "#fff"),
          }}>
            <PizzaSVG numerator={q.n1} denominator={q.d} size={120} />
            <FractionText n={q.n1} d={q.d} />
          </button>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#c4956a" }}>VS</span>
          <button onClick={() => check("right")} style={{
            ...styles.compareCard,
            border: selected === "right" ? `4px solid ${result ? "#38a169" : "#e53e3e"}` : "4px solid #e8d5c4",
            background: selected === "right" ? (result ? "#c6f6d5" : "#fed7d7") : (selected && q.answer === "right" ? "#c6f6d5" : "#fff"),
          }}>
            <PizzaSVG numerator={q.n2} denominator={q.d} size={120} />
            <FractionText n={q.n2} d={q.d} />
          </button>
        </div>
        {result !== null && (
          <p style={{ ...styles.feedback, color: result ? "#38a169" : "#e53e3e" }}>
            {result ? "🎯 That's right! Great eyes!" : "💡 Look closely — the one with more coloured slices is bigger!"}
          </p>
        )}
      </div>
    );
  }

  // add mode
  const check = (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.answer;
    setResult(correct);
    if (correct) onScore(20);
    setTimeout(generate, correct ? 1200 : 2000);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={styles.prompt}>➕ Fraction Addition! What's the answer?</p>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        <div style={{ textAlign: "center" }}>
          <BarModel numerator={q.n1} denominator={q.d} size={140} />
          <FractionText n={q.n1} d={q.d} />
        </div>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#c4956a" }}>+</span>
        <div style={{ textAlign: "center" }}>
          <BarModel numerator={q.n2} denominator={q.d} size={140} />
          <FractionText n={q.n2} d={q.d} />
        </div>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#c4956a" }}>=</span>
        <span style={{ fontSize: 32, color: "#5a3e28" }}>❓</span>
      </div>
      <div style={styles.optionGrid}>
        {q.opts.map((o) => {
          const [on, od] = o.split("/").map(Number);
          const isCorrect = o === q.answer;
          const isSelected = selected === o;
          let bg = "#fff";
          if (isSelected) bg = isCorrect ? "#c6f6d5" : "#fed7d7";
          else if (selected && isCorrect) bg = "#c6f6d5";
          return (
            <button key={o} onClick={() => check(o)} style={{
              ...styles.optBtn, background: bg,
              border: isSelected ? `3px solid ${isCorrect ? "#38a169" : "#e53e3e"}` : "3px solid #e8d5c4",
            }}>
              <FractionText n={on} d={od} />
            </button>
          );
        })}
      </div>
      {result !== null && (
        <p style={{ ...styles.feedback, color: result ? "#38a169" : "#e53e3e" }}>
          {result ? "🚀 Brilliant! You nailed the addition!" : `😊 Keep going! ${q.n1}/${q.d} + ${q.n2}/${q.d} = ${q.ansN}/${q.ansD}`}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════
const MODES = [
  { id: "pizza", label: "🍕 Name That Fraction", desc: "See it, say it!", Component: PizzaParty },
  { id: "builder", label: "🎨 Colour It In", desc: "Build fractions", Component: FractionBuilder },
  { id: "math", label: "🧮 Fraction Maths", desc: "Compare & add", Component: FractionMath },
];

function FractionGame() {
  const [mode, setMode] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [showStars, setShowStars] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const onScore = (pts) => {
    setScore((s) => s + pts);
    setQuestionsAnswered((q) => {
      const next = q + 1;
      if (next % 5 === 0) {
        setStars((s) => s + 1);
        setShowStars(true);
        setShowConfetti(true);
        setTimeout(() => { setShowStars(false); setShowConfetti(false); }, 1200);
        if (next % 10 === 0 && level < 3) setLevel((l) => l + 1);
      }
      return next;
    });
  };

  // ── Menu ──
  if (!mode) {
    return (
      <div style={styles.container}>
        <style>{keyframes}</style>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>🍕 Fraction Adventure 🎮</h1>
          <p style={styles.subtitle}>Learn fractions the fun way!</p>
        </div>
        <div style={styles.menuGrid}>
          {MODES.map((m, i) => (
            <button key={m.id} onClick={() => { setMode(m.id); setScore(0); setStars(0); setLevel(1); setQuestionsAnswered(0); }}
              style={{ ...styles.menuCard, animationDelay: `${i * 0.12}s` }}>
              <span style={{ fontSize: 44 }}>{m.label.slice(0, 2)}</span>
              <div style={{ flex: 1 }}>
                <span style={styles.menuLabel}>{m.label.slice(2)}</span>
                <span style={styles.menuDesc}>{m.desc}</span>
              </div>
            </button>
          ))}
        </div>
        <div style={styles.howTo}>
          <h3 style={{ margin: "0 0 6px", color: "#5a3e28" }}>🎯 How to Play</h3>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Pick a game to start → Answer correctly to earn points → Get ⭐ every 5 correct answers → Collect stars to level up!
          </p>
        </div>
      </div>
    );
  }

  // ── Game ──
  const current = MODES.find((m) => m.id === mode);
  const Comp = current.Component;

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      <StarBurst show={showStars} />
      <Confetti show={showConfetti} />

      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => setMode(null)} style={styles.backBtn}>← Back</button>
        <div style={styles.scoreBar}>
          <span style={styles.scoreItem}>🏆 {score}</span>
          <span style={styles.scoreItem}>⭐ {stars}</span>
          <span style={styles.levelBadge}>Lv.{level}</span>
        </div>
      </div>

      <h2 style={styles.modeTitle}>{current.label}</h2>

      <div style={styles.gameArea}>
        <Comp onScore={onScore} level={level} />
      </div>

      {/* Progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${(questionsAnswered % 5) * 20}%` }} />
        </div>
        <span style={{ fontSize: 13, color: "#8B7355" }}>Next ⭐ in {5 - (questionsAnswered % 5)} questions</span>
      </div>
    </div>
  );
}

// ── Styles ──
const styles = {
  container: {
    minHeight: "100%",
    background: "linear-gradient(170deg, #FFF8F0 0%, #FFECD2 40%, #FCE4CC 100%)",
    fontFamily: "'Fredoka', 'Comic Sans MS', 'Segoe UI', cursive",
    padding: "16px",
    maxWidth: 520,
    margin: "0 auto",
    position: "relative",
    overflow: "hidden",
  },
  titleWrap: {
    textAlign: "center",
    padding: "24px 0 12px",
    animation: "popIn 0.6s both",
  },
  title: {
    fontSize: "clamp(28px, 7vw, 40px)",
    fontWeight: 700,
    color: "#5a3e28",
    margin: 0,
    textShadow: "2px 2px 0 #f7d794",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B7355",
    margin: "6px 0 0",
  },
  menuGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    margin: "20px 0",
  },
  menuCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 20px",
    background: "#fff",
    borderRadius: 18,
    border: "3px solid #e8d5c4",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 4px 15px rgba(180,130,80,0.12)",
    animation: "slideUp 0.5s both",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  menuLabel: {
    display: "block",
    fontSize: 20,
    fontWeight: 600,
    color: "#5a3e28",
  },
  menuDesc: {
    display: "block",
    fontSize: 14,
    color: "#8B7355",
  },
  howTo: {
    background: "rgba(255,255,255,0.7)",
    borderRadius: 14,
    padding: "14px 18px",
    fontSize: 14,
    color: "#6d5a45",
    border: "2px dashed #e8d5c4",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    fontWeight: 600,
    color: "#c4956a",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "4px 8px",
  },
  scoreBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderRadius: 30,
    padding: "6px 14px",
    border: "2px solid #e8d5c4",
    boxShadow: "0 2px 8px rgba(180,130,80,0.1)",
  },
  scoreItem: {
    fontSize: 16,
    fontWeight: 600,
    color: "#5a3e28",
  },
  levelBadge: {
    background: "linear-gradient(135deg, #f7d794, #f5a623)",
    color: "#fff",
    borderRadius: 12,
    padding: "2px 10px",
    fontSize: 14,
    fontWeight: 700,
  },
  modeTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: 700,
    color: "#5a3e28",
    margin: "8px 0 12px",
  },
  gameArea: {
    background: "#fff",
    borderRadius: 20,
    padding: "20px 16px",
    border: "3px solid #e8d5c4",
    boxShadow: "0 6px 24px rgba(180,130,80,0.1)",
    minHeight: 300,
  },
  prompt: {
    fontSize: 18,
    fontWeight: 600,
    color: "#5a3e28",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  optionGrid: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    margin: "14px 0",
  },
  optBtn: {
    padding: "12px 20px",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    minWidth: 70,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  compareCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: 14,
    borderRadius: 18,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    background: "#fff",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
  },
  feedback: {
    fontSize: 18,
    fontWeight: 700,
    margin: "12px 0 0",
    animation: "popIn 0.4s both",
  },
  checkBtn: {
    background: "linear-gradient(135deg, #6bcb77, #38a169)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "10px 28px",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 3px 10px rgba(56,161,105,0.3)",
  },
  progressWrap: {
    textAlign: "center",
    marginTop: 16,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    background: "#e8d5c4",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #f7d794, #f5a623)",
    borderRadius: 10,
    transition: "width 0.4s",
  },
};

// ── Keyframes ──
const keyframes = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.7); }
  70% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes starBurst {
  0% { opacity: 1; transform: translate(0,0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx, 80px), var(--dy, -120px)) scale(0.3) rotate(360deg); }
}
@keyframes confettiFall {
  0% { opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
}

button:hover { filter: brightness(1.03); }
button:active { transform: scale(0.97) !important; }
`;


ReactDOM.createRoot(document.getElementById("fraction-game-root")).render(<FractionGame />);
