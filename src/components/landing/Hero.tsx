import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-farm.jpg";

export const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              The marketplace for hyper-local greens
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Hyper-local greens, <span className="text-gradient">grown on demand.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              VerdantGrid connects boutique kitchens with urban farmers. Post what you need, subscribe to a steady supply, and skip the broken cold chain.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="hero" size="xl" onClick={() => navigate("/auth?mode=signup")}>
                Start growing demand <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                See how it works
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div><div className="text-2xl font-bold text-foreground">120+</div>Local farms</div>
              <div><div className="text-2xl font-bold text-foreground">350+</div>Restaurants</div>
              <div><div className="text-2xl font-bold text-foreground">48h</div>Farm to plate</div>
            </div>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "120ms" }}>
            <div className="absolute -inset-6 bg-gradient-primary rounded-[2rem] opacity-20 blur-3xl" />
            <div className="relative rounded-[2rem] overflow-hidden shadow-elegant border border-border/50 animate-float">
              <img
                src={heroImg}
                alt="Vertical farm with microgreens under soft purple grow lights"
                width={1536}
                height={1024}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
