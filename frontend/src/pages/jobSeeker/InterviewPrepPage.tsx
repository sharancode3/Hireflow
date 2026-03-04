import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

/* ─── Question bank ─── */
type QType = "Behavioral" | "Technical" | "HR";
type Question = { q: string; type: QType; tip: string };
type Category = "Frontend" | "Backend" | "Data" | "Design" | "PM" | "General HR";

const QUESTIONS: Record<Category, Question[]> = {
  Frontend: [
    {q:"Explain the virtual DOM and how React uses it.",type:"Technical",tip:"Compare real DOM mutations vs batched virtual updates."},
    {q:"How do you optimize a slow React component?",type:"Technical",tip:"Mention React.memo, useMemo, useCallback, lazy loading."},
    {q:"What is the difference between useEffect and useLayoutEffect?",type:"Technical",tip:"useLayoutEffect fires synchronously after DOM mutations."},
    {q:"Describe CSS specificity and how conflicts are resolved.",type:"Technical",tip:"Inline > ID > class > element. !important overrides."},
    {q:"Explain event delegation in JavaScript.",type:"Technical",tip:"Events bubble up; attach listener to parent, check target."},
    {q:"What are Web Vitals and how do you measure them?",type:"Technical",tip:"LCP, FID, CLS — use Lighthouse or web-vitals library."},
    {q:"Walk me through a time you had to meet a tight deadline.",type:"Behavioral",tip:"STAR: Situation, Task, Action, Result."},
    {q:"Tell me about a project you're most proud of.",type:"Behavioral",tip:"Focus on impact, challenges overcome, technical decisions."},
    {q:"How do you handle disagreements with a designer?",type:"Behavioral",tip:"Show collaboration, compromise, and user-focus."},
    {q:"Describe a time you improved an existing codebase.",type:"Behavioral",tip:"Mention refactoring, testing, measurable improvement."},
    {q:"Why do you want to work here?",type:"HR",tip:"Research the company; connect values to your goals."},
    {q:"Where do you see yourself in 3 years?",type:"HR",tip:"Show ambition aligned with the role's growth path."},
    {q:"What is your approach to learning new technologies?",type:"HR",tip:"Mention side projects, documentation, community."},
    {q:"How do you handle constructive criticism?",type:"HR",tip:"Show openness, give a real example of growth."},
    {q:"What's your biggest weakness?",type:"HR",tip:"Be honest but show how you're actively improving."},
  ],
  Backend: [
    {q:"Explain REST vs GraphQL. When would you choose each?",type:"Technical",tip:"REST: resource-based, cacheable. GraphQL: flexible queries."},
    {q:"What is the N+1 query problem and how do you solve it?",type:"Technical",tip:"Use eager loading / dataloader pattern."},
    {q:"Describe database indexing strategies.",type:"Technical",tip:"B-tree, hash, composite indexes; trade-offs with writes."},
    {q:"How do you handle authentication and authorization?",type:"Technical",tip:"JWT, OAuth2, role-based access control."},
    {q:"Explain microservices vs monolith architecture.",type:"Technical",tip:"Microservices: independent deploy. Monolith: simpler ops."},
    {q:"What is a race condition? How do you prevent it?",type:"Technical",tip:"Mutexes, database locks, optimistic concurrency."},
    {q:"Tell me about a production incident you resolved.",type:"Behavioral",tip:"STAR format with metrics on resolution time."},
    {q:"How do you prioritize between tech debt and features?",type:"Behavioral",tip:"Show business awareness and pragmatic trade-offs."},
    {q:"Describe a time you mentored a junior developer.",type:"Behavioral",tip:"Focus on knowledge transfer and their growth."},
    {q:"How do you approach code reviews?",type:"Behavioral",tip:"Be constructive, focus on logic / security / readability."},
    {q:"Why backend development specifically?",type:"HR",tip:"Show passion for systems, data, and scalability."},
    {q:"How do you stay current with backend technologies?",type:"HR",tip:"Blogs, conferences, open-source contributions."},
    {q:"Describe your ideal team culture.",type:"HR",tip:"Show you value ownership, transparency, and feedback."},
    {q:"What motivates you at work?",type:"HR",tip:"Connect to impact, learning, and problem-solving."},
    {q:"Tell me about a time you failed.",type:"HR",tip:"Show accountability and what you learned."},
  ],
  Data: [
    {q:"Explain the difference between supervised and unsupervised learning.",type:"Technical",tip:"Supervised: labeled data. Unsupervised: clustering/patterns."},
    {q:"What is a p-value and when is it meaningful?",type:"Technical",tip:"Probability of observing data given null hypothesis is true."},
    {q:"How do you handle missing data in a dataset?",type:"Technical",tip:"Imputation, deletion, or flagging — depends on context."},
    {q:"Explain the bias-variance trade-off.",type:"Technical",tip:"High bias = underfitting. High variance = overfitting."},
    {q:"What SQL window functions do you use most?",type:"Technical",tip:"ROW_NUMBER, RANK, LAG/LEAD, SUM OVER."},
    {q:"How do you validate a machine learning model?",type:"Technical",tip:"Train/test split, cross-validation, precision/recall."},
    {q:"Tell me about a data-driven decision you influenced.",type:"Behavioral",tip:"Show impact with specific metrics."},
    {q:"How do you communicate complex findings to non-technical stakeholders?",type:"Behavioral",tip:"Visualizations, analogies, focus on business impact."},
    {q:"Describe a time you found an unexpected insight in data.",type:"Behavioral",tip:"Show curiosity and how you verified the finding."},
    {q:"How do you handle ambiguous requirements?",type:"Behavioral",tip:"Ask clarifying questions, propose hypotheses."},
    {q:"Why data science / data analysis?",type:"HR",tip:"Connect curiosity about patterns to business value."},
    {q:"What tools do you prefer for analysis?",type:"HR",tip:"Python, SQL, Tableau/Power BI — explain why."},
    {q:"How do you ensure data quality?",type:"HR",tip:"Validation rules, automated tests, documentation."},
    {q:"Where do you see the data field heading?",type:"HR",tip:"AI/ML democratization, real-time analytics."},
    {q:"What's a dataset you've worked on that excited you?",type:"HR",tip:"Show genuine enthusiasm; explain the challenge."},
  ],
  Design: [
    {q:"Walk me through your design process.",type:"Technical",tip:"Research → Ideate → Wireframe → Prototype → Test."},
    {q:"How do you handle accessibility in your designs?",type:"Technical",tip:"WCAG guidelines, color contrast, keyboard navigation."},
    {q:"Explain the difference between UX and UI.",type:"Technical",tip:"UX = overall experience. UI = visual interface layer."},
    {q:"How do you validate a design decision?",type:"Technical",tip:"User testing, A/B tests, analytics, heuristic review."},
    {q:"What's your approach to design systems?",type:"Technical",tip:"Reusable components, tokens, documentation."},
    {q:"How do you handle conflicting stakeholder feedback?",type:"Behavioral",tip:"Prioritize user needs, use data to back decisions."},
    {q:"Tell me about a design you iterated on significantly.",type:"Behavioral",tip:"Show willingness to change based on evidence."},
    {q:"How do you collaborate with developers?",type:"Behavioral",tip:"Design handoff, token-based specs, ongoing dialogue."},
    {q:"Describe a time a user test changed your approach.",type:"Behavioral",tip:"Show humility and focus on user outcomes."},
    {q:"How do you stay inspired creatively?",type:"Behavioral",tip:"Dribbble, conferences, cross-discipline exploration."},
    {q:"Why design as a career?",type:"HR",tip:"Show empathy for users and love for problem-solving."},
    {q:"What's your favorite product and why?",type:"HR",tip:"Analyze UX choices in your answer."},
    {q:"How do you prioritize features?",type:"HR",tip:"Impact vs effort matrix, user research."},
    {q:"What design tools do you use?",type:"HR",tip:"Figma, Sketch, Adobe XD — explain workflow."},
    {q:"How do you handle tight deadlines on design work?",type:"HR",tip:"Scope appropriately, communicate trade-offs early."},
  ],
  PM: [
    {q:"How do you prioritize a product backlog?",type:"Technical",tip:"RICE, MoSCoW, or Impact/Effort matrix."},
    {q:"Explain how you'd define success metrics for a new feature.",type:"Technical",tip:"North star metric, leading/lagging indicators."},
    {q:"Walk me through a product launch you managed.",type:"Technical",tip:"Planning, cross-functional alignment, post-launch analysis."},
    {q:"How do you handle scope creep?",type:"Technical",tip:"Clear requirements, change management process."},
    {q:"Describe your approach to user research.",type:"Technical",tip:"Interviews, surveys, analytics, jobs-to-be-done."},
    {q:"How do you work with engineering teams?",type:"Behavioral",tip:"Respect technical constraints, collaborative planning."},
    {q:"Tell me about a time you had to say no to a stakeholder.",type:"Behavioral",tip:"Data-backed reasoning, clear communication."},
    {q:"Describe a product failure you learned from.",type:"Behavioral",tip:"Show accountability and actionable takeaways."},
    {q:"How do you build consensus across teams?",type:"Behavioral",tip:"Active listening, shared goals, documentation."},
    {q:"Tell me about a difficult trade-off decision.",type:"Behavioral",tip:"Framework: user impact, business value, technical cost."},
    {q:"Why product management?",type:"HR",tip:"Intersection of business, technology, and user needs."},
    {q:"How do you stay customer-focused?",type:"HR",tip:"Regular user interactions, feedback loops."},
    {q:"What PM frameworks do you use?",type:"HR",tip:"Agile, Lean, Design Thinking."},
    {q:"How do you handle ambiguity?",type:"HR",tip:"Break into hypotheses, validate incrementally."},
    {q:"What's a product you'd improve and how?",type:"HR",tip:"Show analytical thinking and empathy."},
  ],
  "General HR": [
    {q:"Tell me about yourself.",type:"HR",tip:"2-min pitch: background, current role, why this opportunity."},
    {q:"Why are you looking for a new opportunity?",type:"HR",tip:"Be positive; focus on growth, not complaints."},
    {q:"What are your salary expectations?",type:"HR",tip:"Research market rates; give a range."},
    {q:"Describe your ideal work environment.",type:"HR",tip:"Align with company culture you've researched."},
    {q:"How do you handle stress?",type:"HR",tip:"Concrete strategies: prioritization, breaks, communication."},
    {q:"Tell me about a conflict with a coworker.",type:"Behavioral",tip:"STAR format; show resolution and maturity."},
    {q:"Describe a time you showed leadership.",type:"Behavioral",tip:"Leadership without authority counts."},
    {q:"How do you manage multiple priorities?",type:"Behavioral",tip:"Tools, frameworks, and communication."},
    {q:"Tell me about a time you went above and beyond.",type:"Behavioral",tip:"Show initiative and impact."},
    {q:"Describe a situation where you had to adapt quickly.",type:"Behavioral",tip:"Show flexibility and positive outcome."},
    {q:"What do you know about our company?",type:"HR",tip:"Research mission, products, recent news."},
    {q:"What questions do you have for us?",type:"HR",tip:"Ask about team, growth, and challenges."},
    {q:"How would your last manager describe you?",type:"HR",tip:"Be honest; use their actual feedback."},
    {q:"What makes you unique as a candidate?",type:"HR",tip:"Specific skills + experience combination."},
    {q:"When can you start?",type:"HR",tip:"Be realistic about notice period."},
  ],
};

const CATEGORIES: Category[] = ["Frontend", "Backend", "Data", "Design", "PM", "General HR"];
type Difficulty = "Easy" | "Medium" | "Hard";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(category: Category, difficulty: Difficulty): Question[] {
  const pool = QUESTIONS[category] ?? [];
  if (difficulty === "Easy") return pool.filter((q) => q.type === "HR").slice(0, 8);
  if (difficulty === "Hard") return pool.filter((q) => q.type !== "HR").slice(0, 8);
  return pool.slice(0, 8);
}

/* ─── Main page ─── */
export function InterviewPrepPage() {
  const [category, setCategory] = useState<Category>("Frontend");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions("Frontend", "Medium"));
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [showTip, setShowTip] = useState<Record<number, boolean>>({});
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [mockMode, setMockMode] = useState(false);
  const [mockIdx, setMockIdx] = useState(0);
  const [timer, setTimer] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetPracticeState = useCallback(() => {
    setRatings({});
    setShowTip({});
    setShowNotes({});
    setMockMode(false);
    setMockIdx(0);
    setTimer(120);
  }, []);

  const onCategoryChange = useCallback((nextCategory: Category) => {
    setCategory(nextCategory);
    setQuestions(buildQuestions(nextCategory, difficulty));
    resetPracticeState();
  }, [difficulty, resetPracticeState]);

  const onDifficultyChange = useCallback((nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
    setQuestions(buildQuestions(category, nextDifficulty));
    resetPracticeState();
  }, [category, resetPracticeState]);

  const toggleMockMode = useCallback(() => {
    setMockMode((prev) => {
      const next = !prev;
      if (next) {
        setTimer(120);
        setMockIdx(0);
      }
      return next;
    });
  }, []);

  /* Timer for mock mode */
  useEffect(() => {
    if (!mockMode) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { setMockIdx((i) => i + 1); return 120; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mockMode]);

  const readiness = useMemo(() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
  }, [ratings]);

  const doShuffle = useCallback(() => {
    setQuestions((q) => shuffle(q));
  }, []);

  const fmtTimer = `${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Interview Prep</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Practice questions, rate your confidence, and run mock sessions.</p>
          </div>
          {readiness > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Readiness</span>
              <div className="relative h-10 w-10">
                <svg viewBox="0 0 36 36" className="h-10 w-10">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={readiness >= 70 ? "#22c55e" : readiness >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${readiness * 0.94} 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text)]">{readiness}%</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls */}
      <Card className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-[var(--muted)] block mb-1">Category</label>
          <select className="input-base w-full" value={category} onChange={(e) => onCategoryChange(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs text-[var(--muted)] block mb-1">Difficulty</label>
          <select className="input-base w-full" value={difficulty} onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={doShuffle}>Shuffle</Button>
          <Button variant={mockMode ? "danger" : "primary"} onClick={toggleMockMode}>
            {mockMode ? "Exit Mock" : "Mock Session"}
          </Button>
        </div>
      </Card>

      {/* Mock mode */}
      {mockMode ? (
        <div className="space-y-4">
          {mockIdx < questions.length ? (
            <Card className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Badge variant={questions[mockIdx].type === "Technical" ? "blue" : questions[mockIdx].type === "Behavioral" ? "purple" : "amber"}>
                  {questions[mockIdx].type}
                </Badge>
                <div className={`text-lg font-mono font-bold ${timer < 30 ? "text-[#ef4444] animate-pulse" : "text-[var(--text)]"}`}>
                  {fmtTimer}
                </div>
              </div>
              <p className="text-lg font-semibold text-[var(--text)]">{questions[mockIdx].q}</p>
              <div className="flex gap-2">
                <span className="text-xs text-[var(--muted)]">Question {mockIdx + 1} of {questions.length}</span>
              </div>
              <Button variant="secondary" onClick={() => { setMockIdx((i) => i + 1); setTimer(120); }}>
                Next Question →
              </Button>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-sm font-semibold text-[var(--text)]">Mock session complete!</h3>
              <p className="text-xs text-[var(--muted)] mt-1">{questions.length} questions answered.</p>
              <Button variant="primary" className="mt-4" onClick={() => setMockMode(false)}>Back to Practice</Button>
            </Card>
          )}
        </div>
      ) : (
        /* Regular question cards */
        <div className="grid gap-4 sm:grid-cols-2">
          {questions.map((q, idx) => (
            <Card key={idx} className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <Badge variant={q.type === "Technical" ? "blue" : q.type === "Behavioral" ? "purple" : "amber"}>
                  {q.type}
                </Badge>
                {/* Star rating */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRatings((r) => ({ ...r, [idx]: star }))}
                      className="text-sm transition-transform hover:scale-125"
                    >
                      {(ratings[idx] ?? 0) >= star ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--text)]">{q.q}</p>
              <div className="flex gap-2">
                <button type="button" className="text-xs text-[var(--accent)] hover:underline"
                  onClick={() => setShowTip((s) => ({ ...s, [idx]: !s[idx] }))}
                >
                  {showTip[idx] ? "Hide Tip" : "Show Tip"}
                </button>
                <button type="button" className="text-xs text-[var(--accent)] hover:underline"
                  onClick={() => setShowNotes((s) => ({ ...s, [idx]: !s[idx] }))}
                >
                  {showNotes[idx] ? "Hide Notes" : "Add Notes"}
                </button>
              </div>
              {showTip[idx] && (
                <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-3 text-xs text-[var(--text-secondary)] animate-fade-in">
                  💡 {q.tip}
                </div>
              )}
              {showNotes[idx] && (
                <textarea
                  className="input-base w-full text-xs animate-fade-in"
                  rows={2}
                  placeholder="Your notes…"
                  value={notes[idx] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [idx]: e.target.value }))}
                />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
