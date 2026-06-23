import { ClipboardList, Handshake, Truck } from "lucide-react";

const steps = [
  { icon: ClipboardList, title: "Post your demand", desc: "Restaurants share weekly crop needs — quantity, frequency, quality notes." },
  { icon: Handshake, title: "Match with a farmer", desc: "Local urban farmers accept the request and lock in a growing schedule." },
  { icon: Truck, title: "Receive fresh, weekly", desc: "Greens arrive within 48 hours of harvest. Track every order end to end." },
];

export const HowItWorks = () => (
  <section id="how" className="container py-24 md:py-32">
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-sm font-semibold text-primary uppercase tracking-wider">How it works</p>
      <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">From request to plate in three steps.</h2>
    </div>
    <div className="mt-16 grid md:grid-cols-3 gap-6">
      {steps.map((s, i) => (
        <div key={s.title} className="relative rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-elegant transition-smooth">
          <div className="absolute -top-4 left-8 text-xs font-bold text-primary bg-background border border-border rounded-full px-3 py-1">
            Step {i + 1}
          </div>
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <s.icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  </section>
);
