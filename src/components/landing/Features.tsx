import { BarChart3, CalendarClock, Leaf, ShieldCheck, Sprout, Zap } from "lucide-react";

const features = [
  { icon: Sprout, title: "Demand matching", desc: "Smart routing of crop requests to nearby farmers with capacity." },
  { icon: CalendarClock, title: "Subscription orders", desc: "Set weekly or bi-weekly recurring deliveries — no re-ordering needed." },
  { icon: BarChart3, title: "Crop trend insights", desc: "Farmers see real demand data to plan plantings with confidence." },
  { icon: Zap, title: "Real-time tracking", desc: "Pending, accepted, in-progress, delivered — always know where things stand." },
  { icon: ShieldCheck, title: "Verified growers", desc: "Every farmer is vetted for quality, hygiene, and reliability." },
  { icon: Leaf, title: "48h farm to plate", desc: "Microgreens arrive within two days of harvest, at peak flavor." },
];

export const Features = () => (
  <section id="features" className="py-24 md:py-32 bg-gradient-soft">
    <div className="container">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">Features</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">Everything you need to source local.</h2>
      </div>
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-card transition-smooth">
            <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center group-hover:bg-gradient-primary transition-smooth">
              <f.icon className="h-5 w-5 text-accent-foreground group-hover:text-primary-foreground transition-smooth" />
            </div>
            <h3 className="mt-5 font-semibold text-lg">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
