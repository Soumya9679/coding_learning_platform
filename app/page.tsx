import Link from "next/link";
import { Code2, Gamepad2, Trophy, Zap, Brain, Sparkles, ArrowRight, Terminal, Star, Users } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui";

const stats = [
  { value: "10+", label: "Coding Challenges", icon: Trophy },
  { value: "5", label: "Mini-Games", icon: Gamepad2 },
  { value: "AI", label: "Powered Mentor", icon: Brain },
  { value: "∞", label: "Practice Sessions", icon: Zap },
];

const features = [
  {
    icon: Terminal,
    title: "Browser-Based IDE",
    desc: "Write and run Python directly in your browser with Pyodide. No setup, no installs—just code.",
  },
  {
    icon: Trophy,
    title: "Leaderboard & XP",
    desc: "Earn XP by solving challenges and playing games. Climb the rankings and unlock achievements.",
  },
  {
    icon: Gamepad2,
    title: "Game Lab",
    desc: "Five unique mini-games — type code, arrange programs, race an AI, match concepts, and blast falling expressions. All teaching Python.",
  },
  {
    icon: Brain,
    title: "AI Mentor",
    desc: "Gemini-powered hints that guide without spoiling. Smart nudges that adapt to your mistakes.",
  },
  {
    icon: Sparkles,
    title: "Instant Feedback",
    desc: "No waiting. Every code run, every quiz answer, every game move gives you real-time results.",
  },
  {
    icon: Star,
    title: "Progress Tracking",
    desc: "Your drafts auto-save. Pick up exactly where you left off, every time you return.",
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted border border-accent/20 text-accent-light text-sm">
                  <Sparkles className="w-4 h-4" />
                  AI-powered learning platform
                </div>
                <h1 className="text-display font-bold text-balance">
                  Master Python.{" "}
                  <span className="gradient-text">Play to learn.</span>
                </h1>
                <p className="text-lg text-muted leading-relaxed max-w-xl">
                  PulsePy combines an AI-mentored IDE, hands-on coding challenges,
                  and gamified mini-games into one seamless learning experience. No
                  setup required—start coding in seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/ide"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-accent to-accent-hot text-white font-medium rounded-xl hover:shadow-glow-lg transition-all duration-300 group"
                  >
                    Start Coding
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/gamified"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-bg-elevated border border-border text-white font-medium rounded-xl hover:border-accent/40 hover:bg-bg-hover transition-all duration-300"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Play Games
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} direction="left">
              <div className="relative">
                {/* Code preview card */}
                <div className="glass-card p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3 relative">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-danger/60" />
                      <div className="w-3 h-3 rounded-full bg-warning/60" />
                      <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <span className="text-xs text-muted font-mono">main.py</span>
                  </div>
                  <pre className="font-mono text-sm leading-relaxed relative">
                    <code>
                      <span className="text-muted"># PulsePy learning quest</span>{"\n"}
                      <span className="text-accent-light">for</span>{" "}
                      <span className="text-white">wave</span>{" "}
                      <span className="text-accent-light">in</span>{" "}
                      <span className="text-warning">range</span>
                      <span className="text-white">(</span>
                      <span className="text-success">3</span>
                      <span className="text-white">):</span>{"\n"}
                      {"    "}
                      <span className="text-warning">print</span>
                      <span className="text-white">(</span>
                      <span className="text-success">&quot;PulsePy &gt;&gt;&gt;&quot;</span>
                      <span className="text-white">, wave)</span>
                    </code>
                  </pre>
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-muted mb-1 font-mono">Output:</p>
                    <pre className="text-xs font-mono text-success/80">
                      PulsePy &gt;&gt;&gt; 0{"\n"}PulsePy &gt;&gt;&gt; 1{"\n"}PulsePy &gt;&gt;&gt; 2
                    </pre>
                  </div>
                </div>

                {/* Floating accent elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent-hot/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <StaggerItem key={stat.label}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-accent-muted flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent-light" />
                    </div>
                    <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-sm text-muted">{stat.label}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16 space-y-4">
            <h2 className="text-heading font-bold">
              Everything you need to{" "}
              <span className="gradient-text">learn Python</span>
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              From zero to confident Pythonista. Every tool, every game, every
              hint—designed to keep you in the flow.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <div className="glass-card-hover p-6 h-full space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-accent-muted flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent-light" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="glass-card p-12 text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-hot/5 to-accent/5 pointer-events-none" />
              <div className="relative space-y-6">
                <h2 className="text-heading font-bold">
                  Ready to start your Python journey?
                </h2>
                <p className="text-muted text-lg max-w-xl mx-auto">
                  Jump into the IDE, tackle a challenge, or play a game. No credit
                  card, no downloads—just open your browser and go.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-accent to-accent-hot text-white font-medium rounded-xl hover:shadow-glow-lg transition-all duration-300 group"
                  >
                    Create Free Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-bg-elevated border border-border text-white font-medium rounded-xl hover:border-accent/40 transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} PulsePy. Built for learners.
          </p>
        </div>
      </footer>
    </div>
  );
}
