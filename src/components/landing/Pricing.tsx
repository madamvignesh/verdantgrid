import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    name: "Sprout",
    price: "Free",
    desc: "Try it out — perfect for a single farmer or a tasting kitchen.",
    features: ["Up to 3 active orders", "Basic demand feed", "Email support"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Harvest",
    price: "$49",
    suffix: "/month",
    desc: "For working kitchens and growing urban farms.",
    features: ["Unlimited orders", "Subscription deliveries", "Demand trend insights", "Priority support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Estate",
    price: "Custom",
    desc: "For groups, cloud kitchens, and multi-site farms.",
    features: ["Multi-location accounts", "Dedicated success lead", "Custom integrations", "SLA guarantees"],
    cta: "Talk to sales",
    highlight: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-24 md:py-32 bg-gradient-soft">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight">Simple plans that scale with the season.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-3xl border p-8 transition-smooth ${
                t.highlight
                  ? "border-primary/50 bg-card shadow-elegant scale-[1.02]"
                  : "border-border bg-card hover:shadow-card"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-8 bg-gradient-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-glow">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold">{t.price}</span>
                {t.suffix && <span className="text-muted-foreground">{t.suffix}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={t.highlight ? "hero" : "outline"}
                className="mt-8 w-full"
                onClick={() => navigate("/auth?mode=signup")}
              >
                {t.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
