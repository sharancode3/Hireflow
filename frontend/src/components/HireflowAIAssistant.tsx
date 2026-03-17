import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiJson } from "../api/client";

type Message = { id: string; from: "ai" | "user"; text: string };

const quickSuggestions = [
  "What internships are open today?",
  "How do I improve my profile for shortlist?",
  "Give me a coding interview prep plan",
];

function pageHint(pathname: string) {
  if (pathname.includes("resume-builder")) return "I can help optimize your resume for ATS and role-specific keywords.";
  if (pathname.includes("profile")) return "I can help write profile summaries and improve your experience bullets.";
  if (pathname.includes("jobs")) return "I can help tailor your profile for roles you are viewing.";
  return "I can help with resume writing, skills, interviews, and career strategy.";
}

function fallbackAssistantReply(input: string, pathname: string) {
  const q = input.toLowerCase();

  if (q.includes("internship") || q.includes("internships") || q.includes("open today")) {
    return "To find internships quickly, open Jobs & Internships, set Job Type to Internship, keep Experience Level as Fresher/Junior, then sort using recent listings and apply from Hireflow Jobs for in-app tracking.";
  }

  if (q.includes("profile") || q.includes("shortlist")) {
    return "For better shortlisting, complete Profile Builder basics, keep skills role-specific, add measurable experience bullets, and upload at least one clean resume. Recruiters usually prioritize clear role alignment + recent activity.";
  }

  if (q.includes("coding") || q.includes("dsa") || q.includes("interview")) {
    return "Use a 3-part prep cycle: 1) DSA drills (arrays, strings, trees, DP), 2) role-focused CS topics (DB, APIs, OS basics), 3) mock interviews twice a week. I can generate a day-by-day plan if you share your target role.";
  }

  if (pathname.includes("jobs")) {
    return "You are on a jobs-related page. I can help with filter strategy, resume targeting, and deciding whether to apply now or save for later.";
  }

  return "I am tuned for Hireflow. Ask me about internships/jobs discovery, profile optimization, resume strategy, interview prep, and how to use each dashboard effectively.";
}

function BotHeadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="7" width="14" height="11" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9.5" cy="12" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" />
      <path d="M9 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 11H3.7M20.3 11H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function HireflowAIAssistant() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const messageCounterRef = useRef(2);
  const storageKey = `hireflow_ai_session:${user?.id ?? "guest"}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as Message[];
    } catch {
      // Ignore invalid persisted data.
    }
    return [
      { id: "m1", from: "ai", text: `Hi ${user?.email?.split("@")[0] ?? "there"}! I am Hireflow AI. How can I help you today?` },
      { id: "m2", from: "ai", text: pageHint(location.pathname) },
    ];
  });

  const contextualTip = useMemo(() => pageHint(location.pathname), [location.pathname]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  function sendMessage(content?: string) {
    const value = (content ?? text).trim();
    if (!value) return;

    messageCounterRef.current += 1;
    const userMsg: Message = { id: `u_${messageCounterRef.current}`, from: "user", text: value };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setTyping(true);

    void (async () => {
      try {
        const data = await apiJson<{ reply: string }>("/ai/assistant", {
          method: "POST",
          token,
          body: {
            message: value,
            pagePath: location.pathname,
            role: user?.role || "JOB_SEEKER",
          },
        });

        messageCounterRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${messageCounterRef.current}`,
            from: "ai",
            text: data.reply || fallbackAssistantReply(value, location.pathname),
          },
        ]);
      } catch {
        messageCounterRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${messageCounterRef.current}`,
            from: "ai",
            text: `${fallbackAssistantReply(value, location.pathname)} ${contextualTip}`,
          },
        ]);
      } finally {
        setTyping(false);
      }
    })();
  }

  if (!user) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120]">
      {open ? (
        <div className="pointer-events-auto flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lift max-sm:h-[65vh] max-sm:w-[calc(100vw-16px)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-text">Hireflow AI</div>
              <div className="flex items-center gap-1 text-xs text-text-muted"><span className="h-2 w-2 rounded-full bg-green-500" />Online</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-raised hover:text-text"
                onClick={() => setMinimized((v) => !v)}
                aria-label={minimized ? "Expand assistant" : "Minimize assistant"}
                aria-pressed={minimized}
              >
                {minimized ? "Expand" : "Minimize"}
              </button>
              <button type="button" aria-label="Close assistant" className="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-raised hover:text-text" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>

          {!minimized ? <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "bg-[var(--color-accent)] text-[var(--color-sidebar-active-text)]" : "bg-surface-raised text-text"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing ? (
              <div className="inline-flex rounded-2xl bg-surface-raised px-3 py-2 text-sm text-text-muted">...</div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((s) => (
                <button key={s} type="button" onClick={() => sendMessage(s)} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:border-[var(--color-accent)] hover:text-text">
                  {s}
                </button>
              ))}
            </div>
          </div> : null}

          {!minimized ? <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about your career..."
                className="h-10 flex-1 rounded-lg border border-border bg-surface-raised px-3 text-sm text-text outline-none"
              />
              <button type="button" aria-label="Send message" onClick={() => sendMessage()} className="btn-base h-10 w-10 rounded-lg p-0 text-[var(--color-sidebar-active-text)]" style={{ background: "linear-gradient(120deg,var(--color-accent),var(--accent-purple))" }}>
                →
              </button>
            </div>
          </div> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tooltip-trigger pointer-events-auto relative mt-3 flex h-14 w-14 items-center justify-center rounded-full text-[var(--color-sidebar-active-text)] shadow-lift transition hover:scale-110"
        style={{ background: "linear-gradient(120deg,var(--color-accent),var(--accent-purple))", animation: "pulse-glow 2.5s ease-in-out infinite" }}
        aria-label="Ask Hireflow AI"
      >
        <span className="tooltip">Ask Hireflow AI</span>
        <BotHeadIcon />
      </button>
    </div>
  );
}
