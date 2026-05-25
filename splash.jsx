/* global React, ReactDOM */
const { useEffect, useRef, useState } = React;

/* =========================================================
   Original mascot — "Cacto"
   Bumpy mint cactus with stubby legs, two arm-pads, blue
   flower on the side and big sparkly eyes. Hand-drawn vibe.
   ========================================================= */
function Stellar({ palette }) {
  // Generate a bumpy oval contour for the body.
  const bumpyBody = React.useMemo(() => {
    const cx = 120, cy = 130, rx = 78, ry = 88;
    const bumps = 22;
    let d = "";
    for (let i = 0; i < bumps; i++) {
      const a1 = (i / bumps) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / bumps) * Math.PI * 2 - Math.PI / 2;
      const aMid = (a1 + a2) / 2;
      const x1 = (cx + rx * Math.cos(a1)).toFixed(1);
      const y1 = (cy + ry * Math.sin(a1)).toFixed(1);
      const x2 = (cx + rx * Math.cos(a2)).toFixed(1);
      const y2 = (cy + ry * Math.sin(a2)).toFixed(1);
      // bump out: control point 7% beyond the oval
      const bumpR = 1.075;
      const cBx = (cx + rx * bumpR * Math.cos(aMid)).toFixed(1);
      const cBy = (cy + ry * bumpR * Math.sin(aMid)).toFixed(1);
      if (i === 0) d += `M ${x1} ${y1} `;
      d += `Q ${cBx} ${cBy} ${x2} ${y2} `;
    }
    d += "Z";
    return d;
  }, []);

  // Outline color used everywhere
  const OUTLINE = "#3a8d72";

  return (
    <svg viewBox="0 0 240 240" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        {/* mint body — soft seafoam with subtle right-side shading */}
        <linearGradient id="cactusBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#aeebcb" />
          <stop offset="0.55" stopColor="#8cdab2" />
          <stop offset="1" stopColor="#65bf90" />
        </linearGradient>
        {/* lighter belly panel */}
        <radialGradient id="cactusBelly" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#dbf5e6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#dbf5e6" stopOpacity="0" />
        </radialGradient>
        {/* blue flower petals */}
        <radialGradient id="petalG" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#d3eaff" />
          <stop offset="0.6" stopColor="#8cc7ee" />
          <stop offset="1" stopColor="#4a96c8" />
        </radialGradient>
        <radialGradient id="centerG" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="1" stopColor="#f0b426" />
        </radialGradient>
      </defs>

      {/* soft contact shadow */}
      <ellipse cx="120" cy="232" rx="64" ry="6" fill="#000" opacity="0.16">
        <animate attributeName="rx" values="64;52;64" dur="3.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.16;0.08;0.16" dur="3.4s" repeatCount="indefinite" />
      </ellipse>

      {/* whole-mascot bob */}
      <g style={{ transformOrigin: "120px 130px", animation: "bob 3.4s ease-in-out infinite" }}>

        {/* === Stubby legs (drawn behind body) === */}
        <g>
          {/* left leg */}
          <ellipse cx="98" cy="222" rx="14" ry="11" fill="url(#cactusBody)" stroke={OUTLINE} strokeWidth="3" />
          {/* right leg */}
          <ellipse cx="142" cy="222" rx="14" ry="11" fill="url(#cactusBody)" stroke={OUTLINE} strokeWidth="3" />
        </g>

        {/* === Left arm (raised, waving) === */}
        <g style={{ transformOrigin: "50px 130px", animation: "armL 2.8s ease-in-out infinite" }}>
          <path
            d="M 56 132
               Q 38 130 28 110
               Q 20 92 32 82
               Q 46 78 54 96
               Q 60 114 62 130 Z"
            fill="url(#cactusBody)"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* highlight */}
          <ellipse cx="36" cy="98" rx="4" ry="7" fill="#ffffff" opacity="0.55" transform="rotate(-20 36 98)" />
        </g>

        {/* === Right arm (extended out) === */}
        <g style={{ transformOrigin: "190px 150px", animation: "armR 2.8s ease-in-out infinite" }}>
          <path
            d="M 184 138
               Q 204 134 214 148
               Q 218 162 206 168
               Q 192 172 186 162
               Q 182 152 184 138 Z"
            fill="url(#cactusBody)"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="208" cy="150" rx="4" ry="5" fill="#ffffff" opacity="0.55" transform="rotate(40 208 150)" />
        </g>

        {/* === Main body (bumpy contour) === */}
        <path d={bumpyBody} fill="url(#cactusBody)" stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />

        {/* subtle center spine line for that "ribbed" hint */}
        <path d="M 138 70 Q 142 130 132 200" stroke="#4ca383" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.35" />

        {/* lighter belly panel */}
        <ellipse cx="118" cy="160" rx="46" ry="42" fill="url(#cactusBelly)" />

        {/* white specular highlight spots on body */}
        <g fill="#ffffff" opacity="0.7">
          <ellipse cx="68" cy="108" rx="3" ry="6" transform="rotate(-15 68 108)" />
          <ellipse cx="80" cy="90" rx="2" ry="4" transform="rotate(-15 80 90)" />
          <ellipse cx="160" cy="190" rx="3" ry="5" transform="rotate(20 160 190)" />
        </g>

        {/* === Flower (top-right, like the reference) === */}
        <g style={{ transformOrigin: "170px 70px", animation: "wobble 4s ease-in-out infinite" }}>
          {/* leaf behind */}
          <path d="M 158 78 Q 150 70 148 60 Q 156 60 162 70 Z" fill="#7fc59a" stroke={OUTLINE} strokeWidth="2.5" strokeLinejoin="round" />
          {/* petals (5) */}
          {[0, 72, 144, 216, 288].map((a) => (
            <g key={a} transform={`rotate(${a} 178 64)`}>
              <ellipse cx="178" cy="52" rx="9" ry="13" fill="url(#petalG)" stroke="#4a96c8" strokeWidth="2.2" />
            </g>
          ))}
          {/* center */}
          <circle cx="178" cy="64" r="6.5" fill="url(#centerG)" stroke="#c98a1c" strokeWidth="2" />
          <circle cx="176" cy="62" r="1.8" fill="#fff" opacity="0.85" />
        </g>

        {/* === Face === */}
        {/* eyes — big round with sparkle highlights */}
        <g>
          {/* left eye */}
          <ellipse cx="96" cy="148" rx="13" ry="16" fill="#2b1f3a" />
          <ellipse cx="100" cy="142" rx="5.5" ry="6.5" fill="#ffffff" />
          <circle cx="92" cy="156" r="2.4" fill="#ffffff" />
          {/* right eye */}
          <ellipse cx="144" cy="148" rx="13" ry="16" fill="#2b1f3a" />
          <ellipse cx="148" cy="142" rx="5.5" ry="6.5" fill="#ffffff" />
          <circle cx="140" cy="156" r="2.4" fill="#ffffff" />
          {/* blink overlay */}
          <ellipse cx="96" cy="148" rx="14" ry="17" fill="url(#cactusBody)" style={{ transformOrigin: "96px 148px", animation: "blink 5.5s ease-in-out infinite" }} />
          <ellipse cx="144" cy="148" rx="14" ry="17" fill="url(#cactusBody)" style={{ transformOrigin: "144px 148px", animation: "blink 5.5s ease-in-out infinite" }} />
        </g>

        {/* cheeks */}
        <ellipse cx="76" cy="170" rx="11" ry="6" fill="#f59aa0" opacity="0.85" />
        <ellipse cx="164" cy="170" rx="11" ry="6" fill="#f59aa0" opacity="0.85" />

        {/* mouth — small soft smile (no nose, like the ref) */}
        <path d="M 110 172 Q 120 184 130 172" stroke="#2b1f3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* =========================================================
   Orbital decorations
   ========================================================= */
function PurpleStar({ size = 80 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="starG" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#a87bff" />
          <stop offset="0.6" stopColor="#6a37d8" />
          <stop offset="1" stopColor="#3b1a8a" />
        </radialGradient>
      </defs>
      <path d="M50 6 L62 36 L94 40 L70 60 L78 92 L50 74 L22 92 L30 60 L6 40 L38 36 Z" fill="url(#starG)" />
      <circle cx="40" cy="42" r="3" fill="#ffe14a" />
      <circle cx="62" cy="55" r="2.5" fill="#ffe14a" />
      <circle cx="50" cy="68" r="2" fill="#ffe14a" />
      <circle cx="34" cy="60" r="1.6" fill="#ffe14a" />
    </svg>
  );
}

function MarsPlanet({ size = 60 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="marsG" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ff9a7a" />
          <stop offset="0.6" stopColor="#e35a4a" />
          <stop offset="1" stopColor="#7a1c1c" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#marsG)" />
      <ellipse cx="40" cy="40" rx="10" ry="5" fill="#7a1c1c" opacity="0.4" />
      <ellipse cx="62" cy="58" rx="8" ry="4" fill="#7a1c1c" opacity="0.35" />
      <ellipse cx="52" cy="70" rx="6" ry="3" fill="#7a1c1c" opacity="0.3" />
    </svg>
  );
}

function EarthPlanet({ size = 90 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id="earthG" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#7ad7ff" />
          <stop offset="0.7" stopColor="#2a8fe0" />
          <stop offset="1" stopColor="#0e2a6b" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#earthG)" />
      <path d="M22 48 Q34 38 44 46 Q52 54 64 48 Q76 46 80 56 Q72 64 60 62 Q48 70 36 64 Q26 60 22 48 Z" fill="#3aa55a" />
      <path d="M30 70 Q40 66 50 72 Q58 78 66 74" stroke="#3aa55a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="34" rx="14" ry="4" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

function Flower({ size = 50 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d="M50 60 L50 92" stroke="#3aa55a" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 78 Q42 74 38 80" stroke="#3aa55a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="50" cy="32" rx="9" ry="14" fill="#ffd84a" transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#f29a1f" />
    </svg>
  );
}

function Bubble({ size = 60, hue = 270 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <radialGradient id={`bub${hue}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor={`hsl(${hue} 80% 80%)`} stopOpacity="0.7" />
          <stop offset="1" stopColor={`hsl(${hue} 70% 55%)`} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#bub${hue})`} />
      <ellipse cx="36" cy="32" rx="10" ry="6" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

/* =========================================================
   Tiny twinkling star field
   ========================================================= */
function Starfield({ count = 40, dark }) {
  const stars = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: 0.6 + Math.random() * 1.6,
      delay: Math.random() * 3,
      dur: 1.6 + Math.random() * 2.4,
    }));
  }, [count]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.3} fill={dark ? "#ffffff" : "#6a7bd6"} opacity="0.8">
          <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* =========================================================
   Splash
   ========================================================= */
const PALETTES = {
  cosmic: {
    bgLight: "linear-gradient(180deg, #f6f9ff 0%, #eef2ff 60%, #e6ebff 100%)",
    bgDark: "linear-gradient(180deg, #0b0e2a 0%, #131a4a 60%, #1b1240 100%)",
    accent: "#2a44e0",
    accentWarm: "#ffd84a",
    bodyTint: "#cfd8ff",
    grad: ["#1fc77a", "#2a44e0", "#9b4dff"],
  },
  sunrise: {
    bgLight: "linear-gradient(180deg, #fff8f0 0%, #ffeede 60%, #ffe1ee 100%)",
    bgDark: "linear-gradient(180deg, #2b1530 0%, #4a1a3a 60%, #5a2820 100%)",
    accent: "#e0612a",
    accentWarm: "#ffcf3a",
    bodyTint: "#ffd9c2",
    grad: ["#ffb340", "#ff5e8a", "#9b4dff"],
  },
  mint: {
    bgLight: "linear-gradient(180deg, #f0fbf5 0%, #e1f6ec 60%, #d9efff 100%)",
    bgDark: "linear-gradient(180deg, #0a2a22 0%, #0e3a48 60%, #1a1f6b 100%)",
    accent: "#1a9a78",
    accentWarm: "#7adfff",
    bodyTint: "#bfeed5",
    grad: ["#1fc77a", "#1aa6c7", "#5a7dff"],
  },
};

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cosmic",
  "mode": "light",
  "showLogo": true,
  "showLoader": true,
  "appName": "motus"
}/*EDITMODE-END*/;

function Splash() {
  const tweaks = window.useTweaks(DEFAULTS);
  const [t, setTweak] = [tweaks[0], tweaks[1]];
  const palette = PALETTES[t.theme] || PALETTES.cosmic;
  const dark = t.mode === "dark";
  const [runKey, setRunKey] = useState(0);

  const restart = () => setRunKey((k) => k + 1);

  return (
    <div
      key={runKey}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 874,
        background: dark ? palette.bgDark : palette.bgLight,
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        color: dark ? "#fff" : "#0a0f3d",
      }}
    >
      {/* Starfield */}
      <Starfield count={dark ? 80 : 30} dark={dark} />

      {/* Ambient glow blobs */}
      <div style={{
        position: "absolute", left: "-20%", top: "10%", width: 320, height: 320,
        background: `radial-gradient(circle, ${palette.grad[0]}55, transparent 65%)`,
        filter: "blur(10px)", animation: "drift1 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", right: "-25%", top: "30%", width: 360, height: 360,
        background: `radial-gradient(circle, ${palette.grad[2]}55, transparent 65%)`,
        filter: "blur(10px)", animation: "drift2 10s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", left: "20%", bottom: "-10%", width: 280, height: 280,
        background: `radial-gradient(circle, ${palette.grad[1]}44, transparent 65%)`,
        filter: "blur(10px)", animation: "drift3 12s ease-in-out infinite",
      }} />

      {/* Orbital decorations — each in its own orbit ring */}
      <div className="stage">
        {/* Outer ring rotates slowly */}
        <div className="orbit orbit-1">
          <Floater dx={-130} dy={-180} delay={0.25} duration={0.9} float="floatA">
            <PurpleStar size={86} />
          </Floater>
          <Floater dx={150} dy={-150} delay={0.4} duration={0.85} float="floatB">
            <MarsPlanet size={62} />
          </Floater>
          <Floater dx={-160} dy={150} delay={0.55} duration={0.9} float="floatC">
            <Bubble size={70} hue={265} />
          </Floater>
          <Floater dx={155} dy={170} delay={0.7} duration={0.85} float="floatA">
            <EarthPlanet size={92} />
          </Floater>
        </div>
        {/* Inner ring */}
        <div className="orbit orbit-2">
          <Floater dx={-50} dy={-220} delay={0.6} duration={0.7} float="floatB">
            <Flower size={52} />
          </Floater>
          <Floater dx={195} dy={20} delay={0.5} duration={0.7} float="floatC">
            <Bubble size={64} hue={275} />
          </Floater>
          <Floater dx={-200} dy={30} delay={0.8} duration={0.7} float="floatA">
            <Bubble size={50} hue={255} />
          </Floater>
        </div>

        {/* Centered hero wordmark */}
        <div className="hero">
          {/* glow halo behind */}
          <div
            className="hero-glow"
            style={{
              background: `radial-gradient(ellipse at center, ${palette.grad[1]}55 0%, ${palette.grad[2]}33 40%, transparent 70%)`,
            }}
          />
          {t.showLogo && (
            <div className="wordmark-hero">
              {Array.from(t.appName).map((ch, i) => (
                <span
                  key={i}
                  className="letter"
                  style={{
                    backgroundImage: `linear-gradient(180deg, ${palette.grad[0]}, ${palette.grad[1]} 55%, ${palette.grad[2]})`,
                    animationDelay: `${0.4 + i * 0.09}s, ${1.6 + (i % 3) * 0.25}s`,
                  }}
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </div>
          )}
          <div
            className="tagline-hero"
            style={{ color: dark ? "rgba(255,255,255,0.7)" : "rgba(10,15,61,0.55)" }}
          >
            Pequenos passos, grandes jornadas
          </div>
        </div>
      </div>

      {/* Loading dots */}
      {t.showLoader && (
        <div className="loader">
          <span style={{ background: palette.grad[0] }} />
          <span style={{ background: palette.grad[1] }} />
          <span style={{ background: palette.grad[2] }} />
        </div>
      )}

      {/* Restart pill */}
      <button onClick={restart} className="replay" aria-label="Replay animation">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </svg>
        Replay
      </button>

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Theme" />
        <window.TweakRadio
          label="Palette"
          value={t.theme}
          onChange={(v) => setTweak("theme", v)}
          options={["cosmic", "sunrise", "mint"]}
        />
        <window.TweakRadio
          label="Mode"
          value={t.mode}
          onChange={(v) => setTweak("mode", v)}
          options={["light", "dark"]}
        />
        <window.TweakSection label="Motion" />
        <window.TweakButton label="Replay animation" onClick={restart} />
        <window.TweakSection label="Brand" />
        <window.TweakText label="App name" value={t.appName} onChange={(v) => setTweak("appName", v)} />
        <window.TweakToggle label="Show wordmark" value={t.showLogo} onChange={(v) => setTweak("showLogo", v)} />
        <window.TweakToggle label="Show loader" value={t.showLoader} onChange={(v) => setTweak("showLoader", v)} />
      </window.TweaksPanel>
    </div>
  );
}

/* A floater positions its child relative to the stage center,
   plays a stagger zoom-in, then a continuous gentle float. */
function Floater({ dx, dy, delay, duration, float, children }) {
  return (
    <div
      className="floater"
      style={{
        "--dx": `${dx}px`,
        "--dy": `${dy}px`,
        "--delay": `${delay}s`,
        "--duration": `${duration}s`,
        animation: `popIn var(--duration) cubic-bezier(0.34, 1.6, 0.5, 1) var(--delay) both`,
      }}
    >
      <div style={{ animation: `${float} ${4 + Math.random() * 2}s ease-in-out infinite` }}>
        {children}
      </div>
    </div>
  );
}

window.Splash = Splash;
