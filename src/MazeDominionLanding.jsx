import { useState, useEffect, useRef } from "react";

const RECAPTCHA_SITE_KEY = "6Lf3GYssAAAAAKCkJr7dsq0Qj4-McmQ0tVs4p9YD";

const HONEYPOT_STYLE = {
  position: "absolute", left: "-9999px", top: "-9999px",
  opacity: 0, height: 0, width: 0, overflow: "hidden",
  tabIndex: -1, autoComplete: "off",
};

async function submitForm(formType, data) {
  const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: formType });
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formType, recaptchaToken: token, ...data }),
  });
  return res.ok;
}

const TIERS = [
  {
    id: "scout",
    name: "Scout",
    price: "$50",
    amount: 50,
    color: "#7a8a6a",
    accent: "#a0b485",
    badge: "🪶",
    tagline: "You believe in the maze before it exists.",
    perks: [
      "Founding Backer Nameplate — unique gold name color visible to opponents and spectators",
      "Name in Credits — listed permanently under \"Founding Scouts\"",
      "Private Dev Newsletter — bi-weekly screenshots, design decisions, patch previews",
      "Backers-Only Discord Channel — watch development happen in real time",
    ],
    closing: "This tier closes permanently when Early Access launches.",
    limited: false,
  },
  {
    id: "architect",
    name: "Architect",
    price: "$150",
    amount: 150,
    color: "#c9a84c",
    accent: "#f0d080",
    badge: "🏗️",
    tagline: "You helped build it. Now wear it.",
    perks: [
      "Everything in Scout",
      "Exclusive Architect Hero Skin — dark slate robes with glowing blueprint patterns. Never sold in the shop.",
      "Founding Architect Title — displayed on hero select screen and in every match",
      "Closed Beta Access — play before public launch, shape the balance",
      "Name Engraved on an In-Game Wall — a Stone Wall tile in the tutorial map lists all Architect backers",
    ],
    closing: "This tier closes permanently when Early Access launches.",
    limited: false,
    popular: true,
  },
  {
    id: "warlord",
    name: "Warlord",
    price: "$350",
    amount: 350,
    color: "#cc2222",
    accent: "#ff6655",
    badge: "⚔️",
    tagline: "First to breach. Last to fall.",
    perks: [
      "Everything in Architect",
      "Exclusive Warlord Hero Skin — battle-scorched black armor with ember glow. Never sold in the shop.",
      "Exclusive Warlord Tower Skin Pack — all 10 towers get a dark iron and ember theme",
      "Founding Warlord Maze Border — animated red-ember border around your grid, visible to all",
      "Closed Alpha Access — play before Beta backers with direct influence on development",
      "30-Minute Design Call — direct video call with the lead developer to give input on mechanics",
    ],
    closing: "This tier closes permanently when Early Access launches.",
    limited: false,
  },
  {
    id: "conqueror",
    name: "Conqueror",
    price: "$750",
    amount: 750,
    color: "#9b59b6",
    accent: "#c27de0",
    badge: "👑",
    tagline: "You didn't just back the game. You're part of it.",
    perks: [
      "Everything in Warlord",
      "All 5 Founding Hero Skins — every hero with a founding edition tag. No other player gets this. Ever.",
      "Executive Producer Credit — your name above the team in the credits",
      "Permanently Name One In-Game Mechanic — a tower upgrade, round event, or map location. Permanent.",
      "Custom Conqueror Title In-Game — unique title on leaderboard and spectator view. Never in the shop.",
      "Lifetime Season 1 & 2 Cosmetics — every cosmetic pack from the first two seasons, free",
      "Founding Conqueror Digital Art Card — high-quality art card with your name. Limited to 100 ever made.",
    ],
    closingNote: "We schedule a short call to agree on the name before it's locked into the build. Max 30 characters. Must be appropriate for a general audience.",
    closing: "Limited to 100 founders. Closes permanently at Early Access launch.",
    limited: true,
    slots: 87,
  },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Units Breach Your Maze",
    desc: "Units don't walk around walls — they attack and destroy them. Gaps stay open until you rebuild. The core mechanic no tower defense has ever had.",
  },
  {
    icon: "🧩",
    title: "3 Upgrade Tiers Per Unit",
    desc: "Every unit you send has a T1, T2, and T3 version. Runners become Phantom Runners. Breachers become Cataclysmers. Titan becomes an Ancient Colossus.",
  },
  {
    icon: "🦸",
    title: "5 Heroes in Your Maze",
    desc: "Heroes live physically inside your maze. They can be attacked. Position them wrong and units will target them. Position them right and they change the game.",
  },
  {
    icon: "🏰",
    title: "Walls Are a Separate System",
    desc: "Wood, Stone, Iron walls — each with HP, cost, and behavior. Ghost units phase through Wood. Iron walls slow even the Titan. The maze is your weapon.",
  },
  {
    icon: "🧠",
    title: "Information Warfare",
    desc: "Your opponent can't see your maze by default. Scout units reveal sections. Intel research shows their gold. Phantom hero can Blackout their vision entirely.",
  },
  {
    icon: "🔥",
    title: "Named Combo Discovery",
    desc: "When you first discover a synergy pattern that results in exceptional kills, the game names it after you — permanently. Your strategy. Your legacy.",
  },
];

const GAME_MODES = [
  { name: "1v1 Duel", desc: "Pure skill. 15–20 min. The ranked mode.", icon: "⚔️" },
  { name: "2v2 Alliance", desc: "Coordinated sends. Shared life pool.", icon: "🤝" },
  { name: "4v4 Lane Conquest", desc: "Win your lane → invade others → collapse.", icon: "🗺️" },
  { name: "Draft Mode", desc: "Ban towers. Pick heroes. New meta every game.", icon: "📋" },
];

// Animated grid background
function GridBG() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none",
    }}>
      <div style={{
        position: "absolute", inset: "-50%",
        backgroundImage: `linear-gradient(rgba(201,168,76,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.035) 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
        animation: "gridDrift 25s linear infinite",
      }} />
      <style>{`@keyframes gridDrift { to { transform: translate(44px,44px); } }`}</style>
    </div>
  );
}

// Floating particles
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size: `${2 + Math.random() * 3}px`,
    opacity: 0.15 + Math.random() * 0.25,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", bottom: "-10px", left: p.left,
          width: p.size, height: p.size,
          background: "#c9a84c", borderRadius: "50%",
          opacity: p.opacity,
          animation: `floatUp ${p.duration} ${p.delay} infinite ease-in`,
        }} />
      ))}
      <style>{`@keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:0} 10%{opacity:1} 90%{opacity:.5} 100%{transform:translateY(-100vh) scale(0.3);opacity:0} }`}</style>
    </div>
  );
}

function TierCard({ tier, onSelect, selected, slotsLeft }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(tier)}
      style={{
        position: "relative", cursor: "pointer",
        background: active ? `rgba(${tier.id==="architect"?"201,168,76":tier.id==="warlord"?"204,34,34":tier.id==="conqueror"?"155,89,182":"120,138,106"},0.12)` : "rgba(19,19,31,0.9)",
        border: `1px solid ${active ? tier.accent : "#2a2a3e"}`,
        borderRadius: "6px", padding: "28px 24px",
        transition: "all 0.25s ease",
        transform: active ? "translateY(-4px)" : "none",
        boxShadow: active ? `0 12px 40px ${tier.color}30, 0 0 0 1px ${tier.accent}40` : "none",
        backdropFilter: "blur(8px)",
      }}
    >
      {tier.popular && (
        <div style={{
          position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
          background: "#c9a84c", color: "#0a0a0f",
          fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "3px",
          textTransform: "uppercase", padding: "4px 14px", borderRadius: "20px", fontWeight: 700,
          whiteSpace: "nowrap",
        }}>Most Popular</div>
      )}
      {tier.limited && (
        <div style={{
          position: "absolute", top: "-12px", right: "16px",
          background: tier.color, color: "white",
          fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "2px",
          textTransform: "uppercase", padding: "4px 10px", borderRadius: "20px",
        }}>{slotsLeft} left</div>
      )}
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: `linear-gradient(90deg, ${tier.accent}, transparent)`,
        borderRadius: "6px 6px 0 0", opacity: active ? 1 : 0.4,
        transition: "opacity 0.25s",
      }} />

      <div style={{ fontSize: "32px", marginBottom: "10px" }}>{tier.badge}</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: "20px", fontWeight: 700,
        color: tier.accent, letterSpacing: "3px", textTransform: "uppercase",
        marginBottom: "4px",
      }}>{tier.name}</div>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace", fontSize: "17px",
        color: "#7a7060", letterSpacing: "2px", textTransform: "uppercase",
        marginBottom: "16px",
      }}>{tier.tagline}</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: "32px", fontWeight: 900,
        color: "#f0d080", marginBottom: "20px",
        textShadow: active ? `0 0 30px ${tier.color}80` : "none",
        transition: "text-shadow 0.25s",
      }}>{tier.price}</div>

      <div style={{ marginBottom: "24px" }}>
        {tier.perks.map((perk, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "6px 0", borderBottom: "1px solid rgba(42,42,62,0.5)",
            fontSize: "16px", color: "#d4c9a8",
          }}>
            <span style={{ color: tier.accent, fontSize: "16px", marginTop: "4px", flexShrink: 0 }}>▸</span>
            {perk}
          </div>
        ))}
      </div>

      {tier.closing && (
        <div style={{
          fontSize: "13px", color: "#cc2222", fontFamily: "'Share Tech Mono', monospace",
          letterSpacing: "1px", textAlign: "center", padding: "10px 0 6px",
          borderTop: "1px solid rgba(204,34,34,0.2)",
          marginBottom: "12px",
        }}>
          {tier.closing}
        </div>
      )}

      <button style={{
        width: "100%", padding: "12px",
        background: active ? tier.color : "transparent",
        border: `1px solid ${active ? tier.color : "#2a2a3e"}`,
        borderRadius: "4px", color: active ? "white" : "#7a7060",
        fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
        letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer",
        transition: "all 0.2s",
      }}>
        {active ? "Select This Tier →" : "View Tier"}
      </button>
    </div>
  );
}

function SupportModal({ tier, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [custom, setCustom] = useState("");
  const [honeypot, setHoneypot] = useState("");

  if (!tier) return null;

  const handleSubmit = async () => {
    if (!email || honeypot) return;
    setSubmitting(true);
    await submitForm("support", {
      name, email, message: custom, website: honeypot,
      tierName: tier.name, tierPrice: tier.price,
    });
    setSubmitting(false);
    setSubmitted(true);
    if (onSubmit) onSubmit(tier);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "#0f0f1a", border: `1px solid ${tier.accent}`,
        borderRadius: "8px", padding: "40px", maxWidth: "480px", width: "100%",
        position: "relative",
        boxShadow: `0 0 80px ${tier.color}30`,
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px",
          background: "none", border: "none", color: "#7a7060",
          fontSize: "20px", cursor: "pointer", lineHeight: 1,
        }}>✕</button>

        {!submitted ? (
          <>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "16px",
              color: tier.accent, letterSpacing: "4px", textTransform: "uppercase",
              marginBottom: "8px",
            }}>Support Maze Dominion</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "22px",
              color: "#f0d080", marginBottom: "4px",
            }}>{tier.badge} {tier.name} Tier — {tier.price}</div>
            <p style={{ color: "#7a7060", fontSize: "16px", marginBottom: "28px", fontStyle: "italic" }}>
              Leave your details and we'll reach out with payment instructions and keep you updated on development.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Commander..."
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#13131f", border: "1px solid #2a2a3e",
                  borderRadius: "4px", color: "#d4c9a8",
                  fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                  outline: "none",
                }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Email Address *</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#13131f", border: `1px solid ${email ? tier.accent+"60" : "#2a2a3e"}`,
                  borderRadius: "4px", color: "#d4c9a8",
                  fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                  outline: "none",
                }} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Message (optional)</label>
              <textarea value={custom} onChange={e => setCustom(e.target.value)}
                placeholder="Any questions, custom amount offer, or just a war cry..."
                rows={3}
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#13131f", border: "1px solid #2a2a3e",
                  borderRadius: "4px", color: "#d4c9a8",
                  fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                  outline: "none", resize: "vertical",
                }} />
            </div>

            {/* Honeypot */}
            <div style={HONEYPOT_STYLE}>
              <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              style={{
                width: "100%", padding: "14px",
                background: email && !submitting ? tier.color : "#1a1a2e",
                border: `1px solid ${email && !submitting ? tier.color : "#2a2a3e"}`,
                borderRadius: "4px", color: email && !submitting ? "white" : "#7a7060",
                fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
                letterSpacing: "4px", textTransform: "uppercase", cursor: email && !submitting ? "pointer" : "default",
                transition: "all 0.2s",
              }}>
              {submitting ? "Submitting..." : "Submit Interest →"}
            </button>

            <p style={{ color: "#7a7060", fontSize: "16px", marginTop: "14px", textAlign: "center", fontStyle: "italic" }}>
              No payment yet — we'll contact you directly with next steps.
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚔️</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", color: "#f0d080", marginBottom: "12px" }}>
              Welcome, {tier.name}.
            </div>
            <p style={{ color: "#d4c9a8", fontSize: "17px", lineHeight: 1.7, marginBottom: "24px" }}>
              Your interest has been recorded. We'll reach out to <strong style={{ color: tier.accent }}>{email}</strong> with payment details and your first dev update shortly.
            </p>
            <p style={{ color: "#7a7060", fontSize: "17px", fontStyle: "italic" }}>
              The maze awaits. The breach is coming.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Section({ children, id, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <section id={id} ref={ref} style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(30px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      ...style,
    }}>{children}</section>
  );
}

export default function MazeDominionLanding() {
  const [selectedTier, setSelectedTier] = useState(null);
  const [modalTier, setModalTier] = useState(null);
  const [wishlistEmail, setWishlistEmail] = useState("");
  const [wishlistDone, setWishlistDone] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", email: "", role: "", message: "" });
  const [teamSubmitted, setTeamSubmitted] = useState(false);
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [wishlistSubmitting, setWishlistSubmitting] = useState(false);
  const [wishlistHoneypot, setWishlistHoneypot] = useState("");
  const [teamHoneypot, setTeamHoneypot] = useState("");

  const handleWishlistSubmit = async () => {
    if (!wishlistEmail || wishlistHoneypot) return;
    setWishlistSubmitting(true);
    await submitForm("wishlist", { email: wishlistEmail, website: wishlistHoneypot });
    setWishlistSubmitting(false);
    setWishlistDone(true);
  };

  const handleTeamSubmit = async () => {
    if (!teamForm.name || !teamForm.email || !teamForm.role || teamHoneypot) return;
    setTeamSubmitting(true);
    await submitForm("team", { ...teamForm, website: teamHoneypot });
    setTeamSubmitting(false);
    setTeamSubmitted(true);
  };
  const [conquerorSlotsLeft, setConquerorSlotsLeft] = useState(() => {
    const saved = localStorage.getItem("conqueror_slots_left");
    return saved !== null ? parseInt(saved, 10) : 87;
  });

  const decrementConquerorSlots = () => {
    setConquerorSlotsLeft(prev => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem("conqueror_slots_left", next);
      return next;
    });
  };

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Share+Tech+Mono&display=swap');`;

  return (
    <div style={{
      background: "#0a0a0f", minHeight: "100vh", color: "#d4c9a8",
      fontFamily: "'Crimson Pro', serif", fontSize: "19px", lineHeight: "1.7",
      overflowX: "hidden", position: "relative",
    }}>
      <style>{`
        ${fonts}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #7a5f28; border-radius: 3px; }
        input, textarea { font-family: 'Crimson Pro', serif; }
        @keyframes shimmer { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
        @keyframes heroReveal { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(201,168,76,0.4); } 70% { transform:scale(1); box-shadow:0 0 0 14px rgba(201,168,76,0); } 100% { transform:scale(0.95); } }
      `}</style>

      <GridBG />
      <Particles />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "14px 48px",
        background: navScrolled ? "rgba(10,10,15,0.95)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        borderBottom: navScrolled ? "1px solid #1a1a2e" : "none",
        transition: "all 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: 900, color: "#c9a84c", letterSpacing: "4px", textTransform: "uppercase" }}>
          Maze<span style={{ color: "#cc2222" }}>·</span>Dominion
        </div>
        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          {[["Game", "game"], ["Heroes", "heroes"], ["Support", "support"], ["Wishlist", "wishlist"], ["Join Us", "join-team"]].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", color: "#7a7060",
              fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
              letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#c9a84c"}
              onMouseLeave={e => e.target.style.color = "#7a7060"}
            >{label}</button>
          ))}
          <a href="/gdd.html" style={{
            color: "#7a7060", textDecoration: "none",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
            letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer",
            transition: "color 0.2s",
          }}
            onMouseEnter={e => e.target.style.color = "#c9a84c"}
            onMouseLeave={e => e.target.style.color = "#7a7060"}
          >GDD</a>
          <button onClick={() => scrollTo("support")} style={{
            padding: "8px 20px",
            background: "transparent", border: "1px solid #c9a84c",
            borderRadius: "3px", color: "#c9a84c",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "17px",
            letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.target.style.background = "#c9a84c"; e.target.style.color = "#0a0a0f"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#c9a84c"; }}
          >Support Us</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "100px 48px 80px", position: "relative",
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,26,26,0.18) 0%, transparent 70%)",
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
          letterSpacing: "5px", color: "#c9a84c", textTransform: "uppercase",
          marginBottom: "20px", animation: "heroReveal 1s ease forwards",
          opacity: 0, animationDelay: "0.2s",
        }}>
          ── Now in Development ──
        </div>

        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(56px, 9vw, 112px)",
          fontWeight: 900, color: "#f0d080",
          letterSpacing: "10px", textTransform: "uppercase",
          lineHeight: 0.85, marginBottom: "10px",
          textShadow: "0 0 100px rgba(201,168,76,0.25), 0 0 200px rgba(139,26,26,0.15)",
          animation: "heroReveal 1s ease forwards", opacity: 0,
          animationDelay: "0.4s",
        }}>
          Maze<br />
          <span style={{ color: "#cc2222", letterSpacing: "8px" }}>Dominion</span>
        </h1>

        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: "clamp(13px, 1.8vw, 18px)",
          color: "#7a7060", letterSpacing: "8px", textTransform: "uppercase",
          marginBottom: "36px",
          animation: "heroReveal 1s ease forwards", opacity: 0,
          animationDelay: "0.6s",
        }}>
          Competitive Tower Defense · PvP Strategy
        </p>

        <p style={{
          fontSize: "22px", fontStyle: "italic", color: "#d4c9a8",
          maxWidth: "680px", lineHeight: 1.6, marginBottom: "52px",
          animation: "heroReveal 1s ease forwards", opacity: 0,
          animationDelay: "0.8s",
        }}>
          "You are not reacting to waves.<br />
          You are fighting another mind —<br />
          and your maze is your weapon."
        </p>

        <div style={{
          display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center",
          animation: "heroReveal 1s ease forwards", opacity: 0,
          animationDelay: "1s",
        }}>
          <button onClick={() => scrollTo("support")} style={{
            padding: "16px 40px",
            background: "#c9a84c", border: "none",
            borderRadius: "3px", color: "#0a0a0f",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
            letterSpacing: "4px", textTransform: "uppercase", cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 0 30px rgba(201,168,76,0.3)",
            animation: "pulse-ring 2.5s ease-in-out infinite",
            transition: "all 0.2s",
          }}>
            Support the Game
          </button>
          <button onClick={() => scrollTo("wishlist")} style={{
            padding: "16px 40px",
            background: "transparent", border: "1px solid #2a2a3e",
            borderRadius: "3px", color: "#7a7060",
            fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
            letterSpacing: "4px", textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.target.style.borderColor = "#c9a84c"; e.target.style.color = "#c9a84c"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#2a2a3e"; e.target.style.color = "#7a7060"; }}
          >
            Join Wishlist
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: "56px", marginTop: "72px", flexWrap: "wrap", justifyContent: "center",
          animation: "heroReveal 1s ease forwards", opacity: 0, animationDelay: "1.2s",
        }}>
          {[["F2P", "Free to Play"], ["5", "Playable Heroes"], ["3", "Unit Tiers Each"], ["18", "GDD Sections"], ["4v4", "Lane Conquest"]].map(([val, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: 900, color: "#c9a84c", lineHeight: 1 }}>{val}</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "2px", textTransform: "uppercase", color: "#7a7060", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CORE MECHANIC CALLOUT */}
      <Section style={{
        padding: "80px 48px",
        background: "rgba(139,26,26,0.08)",
        borderTop: "1px solid #1a1a2e", borderBottom: "1px solid #1a1a2e",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#cc2222", marginBottom: "16px" }}>The Core Innovation</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(28px, 4vw, 48px)", color: "#f0d080", lineHeight: 1.2, marginBottom: "24px", fontWeight: 600 }}>
            Units Don't Walk Around Walls.<br />They Destroy Them.
          </h2>
          <p style={{ fontSize: "18px", color: "#d4c9a8", maxWidth: "680px", margin: "0 auto 36px", lineHeight: 1.7 }}>
            Inspired by Warcraft 3's Line Tower Wars — the greatest competitive tower defense maps ever made — Maze Dominion inherits the brilliant send-and-defend loop and adds one mechanic that changes everything.
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px",
            background: "#1a1a2e", border: "1px solid #1a1a2e", borderRadius: "6px", overflow: "hidden",
            maxWidth: "720px", margin: "0 auto",
          }}>
            {[
              ["WC3 Anti-Cheat NPC", "Destroys blocking towers arbitrarily", "❌ Feels arbitrary"],
              ["Our Breach Mechanic", "Units attack and destroy obstacles surgically", "✓ Organic. Strategic."],
              ["The Result", "Blocking is now a tactic, not an exploit", "⚔️ New meta every game"],
            ].map(([title, desc, tag]) => (
              <div key={title} style={{ padding: "24px 20px", background: "#0f0f1a", textAlign: "center" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "17px", color: "#c9a84c", marginBottom: "8px", letterSpacing: "1px" }}>{title}</div>
                <div style={{ fontSize: "17px", color: "#7a7060", marginBottom: "10px", lineHeight: 1.5 }}>{desc}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", color: "#d4c9a8", letterSpacing: "2px" }}>{tag}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section id="game" style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "12px" }}>What Makes It Different</div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 3.5vw, 38px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" }}>Core Features</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: "rgba(19,19,31,0.8)", border: "1px solid #2a2a3e",
                borderRadius: "6px", padding: "28px 24px",
                transition: "all 0.2s",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c40"; e.currentTarget.style.background = "rgba(201,168,76,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.background = "rgba(19,19,31,0.8)"; }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #7a5f28, transparent)" }} />
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "17px", color: "#c9a84c", letterSpacing: "2px", marginBottom: "10px", textTransform: "uppercase" }}>{f.title}</div>
                <p style={{ color: "#7a7060", fontSize: "16px", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* GAME MODES */}
      <Section style={{ padding: "80px 48px", background: "rgba(15,15,26,0.6)", borderTop: "1px solid #1a1a2e" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "12px" }}>Four Ways to Play</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(22px, 3vw, 34px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "44px" }}>Game Modes</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {GAME_MODES.map((m, i) => (
              <div key={i} style={{
                padding: "28px 20px", background: "rgba(19,19,31,0.9)",
                border: "1px solid #2a2a3e", borderRadius: "6px",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{m.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "#c9a84c", letterSpacing: "2px", marginBottom: "8px", textTransform: "uppercase" }}>{m.name}</div>
                <div style={{ color: "#7a7060", fontSize: "17px" }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* HEROES PREVIEW */}
      <Section id="heroes" style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "12px" }}>Choose Your Commander</div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(22px, 3vw, 34px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>5 Heroes, 5 Playstyles</h2>
            <p style={{ color: "#7a7060", fontSize: "16px", maxWidth: "560px", margin: "0 auto" }}>Each hero lives physically in your maze — they can be attacked, they level up mid-match, and they define your entire macro strategy.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px" }}>
            {[
              { name: "The Architect", role: "Control", color: "#c9a84c", desc: "Seal breaches. Redirect units. The maze is your domain.", icon: "🏗️" },
              { name: "The Warlord", role: "Burst", color: "#cc2222", desc: "Overcharge towers. Airstrike. Snipe the Titan.", icon: "⚔️" },
              { name: "The Broker", role: "Economy", color: "#4daa57", desc: "Emergency gold. Sabotage income. Never stay down.", icon: "💰" },
              { name: "The Phantom", role: "Intel", color: "#9b59b6", desc: "Veil sends. Scout. Blackout. Win with information.", icon: "🕵️" },
              { name: "The Sentinel", role: "Tank", color: "#ff6b35", desc: "Hold the line. Shockwave. Become the fortress.", icon: "🛡️" },
            ].map(h => (
              <div key={h.name} style={{
                background: "rgba(19,19,31,0.85)", border: "1px solid #2a2a3e",
                borderRadius: "6px", padding: "24px 18px",
                borderTop: `2px solid ${h.color}`,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = h.color + "60"; e.currentTarget.style.background = `rgba(${h.color === "#c9a84c" ? "201,168,76" : h.color === "#cc2222" ? "204,34,34" : "19,19,31"},0.12)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.background = "rgba(19,19,31,0.85)"; }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{h.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: h.color, letterSpacing: "1px", marginBottom: "4px", textTransform: "uppercase" }}>{h.name}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "2px", color: "#7a7060", textTransform: "uppercase", marginBottom: "10px" }}>{h.role}</div>
                <div style={{ color: "#7a7060", fontSize: "17px", lineHeight: 1.5 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SUPPORT TIERS */}
      <Section id="support" style={{
        padding: "96px 48px",
        background: "rgba(15,15,26,0.7)",
        borderTop: "1px solid #1a1a2e",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "12px" }}>Help Us Build This</div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 3.5vw, 40px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>Support Tiers</h2>
            <p style={{ color: "#7a7060", fontSize: "16px", maxWidth: "600px", margin: "0 auto 12px" }}>
              Every supporter helps build the game. In return, you get exclusive skins, early access, and your name in the credits. No payment is taken until we reach out personally.
            </p>
            <p style={{ color: "#7a5f28", fontSize: "17px", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>
              Custom offer? Use the message field in any tier — we'll work something out.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginTop: "44px" }}>
            {TIERS.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                selected={selectedTier?.id === tier.id}
                onSelect={(t) => { setSelectedTier(t); setModalTier(t); }}
                slotsLeft={tier.id === "conqueror" ? conquerorSlotsLeft : undefined}
              />
            ))}
          </div>

          <div style={{
            textAlign: "center", marginTop: "44px",
            padding: "28px", background: "rgba(19,19,31,0.6)",
            border: "1px solid #2a2a3e", borderRadius: "6px",
          }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "17px", color: "#c9a84c", marginBottom: "8px" }}>Want to offer your own amount?</div>
            <p style={{ color: "#7a7060", fontSize: "16px", marginBottom: "16px" }}>Click any tier, use the message field, and tell us what you'd like to contribute. We'll respond personally.</p>
            <button onClick={() => setModalTier({ id: "custom", name: "Custom", price: "Your Amount", amount: 0, color: "#c9a84c", accent: "#f0d080", badge: "✦" })} style={{
              padding: "12px 32px", background: "transparent",
              border: "1px solid #c9a84c", borderRadius: "3px",
              color: "#c9a84c", fontFamily: "'Share Tech Mono', monospace",
              fontSize: "16px", letterSpacing: "3px", textTransform: "uppercase",
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.target.style.background = "#c9a84c"; e.target.style.color = "#0a0a0f"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#c9a84c"; }}
            >Make a Custom Offer →</button>
          </div>
        </div>
      </Section>

      {/* WC3 HERITAGE STRIP */}
      <Section style={{
        padding: "72px 48px",
        background: "rgba(78,205,196,0.04)",
        borderTop: "1px solid #1a1a2e",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#4ecdc4", marginBottom: "16px" }}>Built on a Legacy</div>
          <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", color: "#f0d080", marginBottom: "20px", fontWeight: 400, fontStyle: "italic" }}>
            "The spiritual successor to WC3 Line Tower Wars —<br />the competitive format that launched a thousand games."
          </h3>
          <p style={{ color: "#7a7060", fontSize: "17px", maxWidth: "680px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            We took everything that made the WC3 tower defense maps legendary — income sends, life-stealing, maze-building — and fixed every flaw: no more anti-cheat NPC, no more brutal snowballing, no more "it's a mod so it died." Maze Dominion is standalone, on Steam, with heroes, unit upgrade tiers, and the breach mechanic that changes everything.
          </p>
          <div style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
            {["No Anti-Cheat NPC", "3 Unit Tiers", "5 Heroes", "Draft Mode", "Named Combos", "Match Replay"].map(tag => (
              <div key={tag} style={{
                fontFamily: "'Share Tech Mono', monospace", fontSize: "17px",
                letterSpacing: "2px", textTransform: "uppercase",
                color: "#4ecdc4", padding: "6px 14px",
                border: "1px solid rgba(78,205,196,0.2)", borderRadius: "3px",
              }}>{tag}</div>
            ))}
          </div>
        </div>
      </Section>

      {/* WISHLIST */}
      <Section id="wishlist" style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#c9a84c", marginBottom: "12px" }}>Stay in the Loop</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 3.5vw, 38px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
            Join the Wishlist
          </h2>
          <p style={{ color: "#7a7060", fontSize: "16px", marginBottom: "36px", lineHeight: 1.7 }}>
            Get notified when we launch on Steam Early Access, open the closed beta, and ship major dev updates. No spam — only milestones that matter.
          </p>

          {!wishlistDone ? (
            <div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  value={wishlistEmail}
                  onChange={e => setWishlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  style={{
                    flex: 1, padding: "14px 18px",
                    background: "#13131f", border: `1px solid ${wishlistEmail ? "#c9a84c60" : "#2a2a3e"}`,
                    borderRadius: "4px 0 0 4px", color: "#d4c9a8",
                    fontSize: "16px", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onKeyDown={e => { if (e.key === "Enter") handleWishlistSubmit(); }}
                />
                <button
                  onClick={handleWishlistSubmit}
                  disabled={wishlistSubmitting}
                  style={{
                    padding: "14px 24px",
                    background: wishlistEmail && !wishlistSubmitting ? "#c9a84c" : "#1a1a2e",
                    border: "none", borderRadius: "0 4px 4px 0",
                    color: wishlistEmail && !wishlistSubmitting ? "#0a0a0f" : "#7a7060",
                    fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
                    letterSpacing: "3px", textTransform: "uppercase",
                    cursor: wishlistEmail && !wishlistSubmitting ? "pointer" : "default",
                    transition: "all 0.2s", whiteSpace: "nowrap",
                }}
              >{wishlistSubmitting ? "..." : "Join →"}</button>
              </div>
              {/* Honeypot */}
              <div style={HONEYPOT_STYLE}>
                <input type="text" name="website" value={wishlistHoneypot} onChange={e => setWishlistHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
              </div>
            </div>
          ) : (
            <div style={{
              padding: "32px", background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.3)", borderRadius: "6px",
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚔️</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "18px", color: "#f0d080", marginBottom: "8px" }}>You're on the list.</div>
              <p style={{ color: "#7a7060", fontSize: "16px" }}>We'll reach out to <strong style={{ color: "#c9a84c" }}>{wishlistEmail}</strong> when the gates open.</p>
            </div>
          )}

          <p style={{ color: "#7a5f28", fontSize: "16px", marginTop: "16px", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>
            Unsubscribe any time. No third parties. No spam.
          </p>
        </div>
      </Section>

      {/* JOIN THE TEAM */}
      <Section id="join-team" style={{
        padding: "96px 48px",
        background: "rgba(78,205,196,0.04)",
        borderTop: "1px solid #1a1a2e",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", letterSpacing: "4px", textTransform: "uppercase", color: "#4ecdc4", marginBottom: "12px" }}>We Need You</div>
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(24px, 3.5vw, 38px)", color: "#f0d080", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "16px" }}>
              Join the Team
            </h2>
            <p style={{ color: "#7a7060", fontSize: "18px", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7 }}>
              Maze Dominion is built by a small, passionate team. If you have skills that can help — art, code, sound, marketing, community — we want to hear from you.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "40px" }}>
            {[
              { icon: "🎨", title: "Artists", desc: "2D/3D, UI, VFX" },
              { icon: "💻", title: "Developers", desc: "Unity, C#, Networking" },
              { icon: "🎵", title: "Audio", desc: "SFX, Music, Voice" },
              { icon: "📣", title: "Marketing", desc: "Social, Content, PR" },
              { icon: "🎮", title: "Game Design", desc: "Balance, Systems, UX" },
              { icon: "🤝", title: "Community", desc: "Discord, Streaming, Mods" },
            ].map(r => (
              <div key={r.title} style={{
                background: "rgba(19,19,31,0.85)", border: "1px solid #2a2a3e",
                borderRadius: "6px", padding: "20px 16px", textAlign: "center",
                borderTop: "2px solid #4ecdc4",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{r.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", color: "#4ecdc4", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{r.title}</div>
                <div style={{ color: "#7a7060", fontSize: "16px" }}>{r.desc}</div>
              </div>
            ))}
          </div>

          {!teamSubmitted ? (
            <div style={{
              background: "rgba(19,19,31,0.9)", border: "1px solid #2a2a3e",
              borderRadius: "8px", padding: "36px",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Your Name *</label>
                  <input value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    style={{
                      width: "100%", padding: "12px 14px",
                      background: "#13131f", border: `1px solid ${teamForm.name ? "#4ecdc460" : "#2a2a3e"}`,
                      borderRadius: "4px", color: "#d4c9a8",
                      fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                      outline: "none",
                    }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Email *</label>
                  <input value={teamForm.email} onChange={e => setTeamForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    type="email"
                    style={{
                      width: "100%", padding: "12px 14px",
                      background: "#13131f", border: `1px solid ${teamForm.email ? "#4ecdc460" : "#2a2a3e"}`,
                      borderRadius: "4px", color: "#d4c9a8",
                      fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                      outline: "none",
                    }} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>What role interests you? *</label>
                <select value={teamForm.role} onChange={e => setTeamForm(f => ({ ...f, role: e.target.value }))}
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: "#13131f", border: `1px solid ${teamForm.role ? "#4ecdc460" : "#2a2a3e"}`,
                    borderRadius: "4px", color: teamForm.role ? "#d4c9a8" : "#7a7060",
                    fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                    outline: "none", cursor: "pointer",
                  }}>
                  <option value="">Select a role...</option>
                  <option value="artist">Artist (2D/3D/UI/VFX)</option>
                  <option value="developer">Developer (Unity/C#/Networking)</option>
                  <option value="audio">Audio (SFX/Music/Voice)</option>
                  <option value="marketing">Marketing (Social/Content/PR)</option>
                  <option value="game-design">Game Design (Balance/Systems/UX)</option>
                  <option value="community">Community (Discord/Streaming/Mods)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: "16px", letterSpacing: "3px", textTransform: "uppercase", color: "#7a7060", marginBottom: "6px" }}>Tell us about yourself</label>
                <textarea value={teamForm.message} onChange={e => setTeamForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Your experience, portfolio links, what excites you about Maze Dominion..."
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: "#13131f", border: "1px solid #2a2a3e",
                    borderRadius: "4px", color: "#d4c9a8",
                    fontFamily: "'Crimson Pro', serif", fontSize: "17px",
                    outline: "none", resize: "vertical",
                  }} />
              </div>

              {/* Honeypot */}
              <div style={HONEYPOT_STYLE}>
                <input type="text" name="website" value={teamHoneypot} onChange={e => setTeamHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
              </div>

              <button onClick={handleTeamSubmit} disabled={teamSubmitting}
                style={{
                  width: "100%", padding: "16px",
                  background: (teamForm.name && teamForm.email && teamForm.role && !teamSubmitting) ? "#4ecdc4" : "#1a1a2e",
                  border: `1px solid ${(teamForm.name && teamForm.email && teamForm.role && !teamSubmitting) ? "#4ecdc4" : "#2a2a3e"}`,
                  borderRadius: "4px", color: (teamForm.name && teamForm.email && teamForm.role && !teamSubmitting) ? "#0a0a0f" : "#7a7060",
                  fontFamily: "'Share Tech Mono', monospace", fontSize: "16px",
                  letterSpacing: "4px", textTransform: "uppercase",
                  cursor: (teamForm.name && teamForm.email && teamForm.role && !teamSubmitting) ? "pointer" : "default",
                  fontWeight: 700, transition: "all 0.2s",
                }}>
                {teamSubmitting ? "Submitting..." : "Apply to Join →"}
              </button>

              <p style={{ color: "#7a5f28", fontSize: "16px", marginTop: "14px", textAlign: "center", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>
                Passion project — all roles are currently volunteer-based.
              </p>
            </div>
          ) : (
            <div style={{
              padding: "40px", background: "rgba(78,205,196,0.08)",
              border: "1px solid rgba(78,205,196,0.3)", borderRadius: "8px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🤝</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", color: "#f0d080", marginBottom: "12px" }}>
                Application Received!
              </div>
              <p style={{ color: "#d4c9a8", fontSize: "17px", lineHeight: 1.7, marginBottom: "8px" }}>
                Thanks, <strong style={{ color: "#4ecdc4" }}>{teamForm.name}</strong>. We'll review your application and reach out to <strong style={{ color: "#4ecdc4" }}>{teamForm.email}</strong> soon.
              </p>
              <p style={{ color: "#7a7060", fontSize: "16px", fontStyle: "italic" }}>
                The maze needs builders. Welcome aboard.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* FOOTER */}
      <footer style={{
        padding: "44px 48px",
        background: "#0a0a0f", borderTop: "1px solid #1a1a2e",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "20px",
      }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "17px", fontWeight: 900, color: "#c9a84c", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "4px" }}>
            Maze Dominion
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", color: "#7a7060", letterSpacing: "2px" }}>
            Currently in Development · Pre-Alpha
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {[["Contact", "#"], ["Game Design Document", "/gdd.html"]].map(([label, href]) => (
            <a key={label} href={href} style={{
              color: "#7a7060", textDecoration: "none",
              fontFamily: "'Share Tech Mono', monospace", fontSize: "17px",
              letterSpacing: "2px", textTransform: "uppercase",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#c9a84c"}
              onMouseLeave={e => e.target.style.color = "#7a7060"}
            >{label}</a>
          ))}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "17px", color: "#7a5f28", letterSpacing: "2px" }}>
          © 2026 Maze Dominion · All Rights Reserved
        </div>
      </footer>

      {/* MODAL */}
      {modalTier && (
        <SupportModal tier={modalTier} onClose={() => setModalTier(null)} onSubmit={(t) => { if (t.id === "conqueror") decrementConquerorSlots(); }} />
      )}
    </div>
  );
}
