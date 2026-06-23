import { Check, ChefHat, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const restaurant = ["Post weekly crop requirements", "Subscribe for steady supply", "Track every order in real time", "Discover seasonal varieties"];
const farmer = ["See real local demand", "Accept orders that fit your shelves", "Build recurring revenue", "Plan plantings with confidence"];

export const Audience = () => {
  const navigate = useNavigate();
  return (
    <section id="audience" className="container py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="relative rounded-3xl border border-border bg-card p-8 md:p-12 shadow-card overflow-hidden">
          <div className="absolute -top-20 -right-20 h-60 w-60 bg-gradient-primary rounded-full blur-3xl opacity-20" />
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mt-5 font-display text-3xl font-bold">For Restaurants</h3>
            <p className="mt-2 text-muted-foreground">Lock in fresh, hyper-local greens without the broker markup.</p>
            <ul className="mt-6 space-y-3">
              {restaurant.map((i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-accent flex items-center justify-center"><Check className="h-3 w-3 text-primary" /></span>
                  {i}
                </li>
              ))}
            </ul>
            <Button variant="hero" className="mt-8" onClick={() => navigate("/auth?mode=signup&role=restaurant")}>I run a kitchen</Button>
          </div>
        </div>

        <div className="relative rounded-3xl border border-border bg-card p-8 md:p-12 shadow-card overflow-hidden">
          <div className="absolute -bottom-20 -left-20 h-60 w-60 bg-gradient-primary rounded-full blur-3xl opacity-20" />
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-foreground flex items-center justify-center">
              <Tractor className="h-6 w-6 text-background" />
            </div>
            <h3 className="mt-5 font-display text-3xl font-bold">For Farmers</h3>
            <p className="mt-2 text-muted-foreground">Turn your shelves into a stable, predictable business.</p>
            <ul className="mt-6 space-y-3">
              {farmer.map((i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-accent flex items-center justify-center"><Check className="h-3 w-3 text-primary" /></span>
                  {i}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-8" onClick={() => navigate("/auth?mode=signup&role=farmer")}>I grow greens</Button>
          </div>
        </div>
      </div>
    </section>
  );
};
