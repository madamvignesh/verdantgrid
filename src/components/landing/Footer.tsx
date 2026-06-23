import { Leaf } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border">
    <div className="container py-12 grid gap-8 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </span>
          VerdantGrid
        </div>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm">
          Hyper-local greens, grown on demand. Connecting kitchens and urban farms, one harvest at a time.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-sm">Product</h4>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><a href="#features" className="hover:text-foreground transition-smooth">Features</a></li>
          <li><a href="#pricing" className="hover:text-foreground transition-smooth">Pricing</a></li>
          <li><a href="#how" className="hover:text-foreground transition-smooth">How it works</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-sm">Company</h4>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="hover:text-foreground transition-smooth">About</a></li>
          <li><a href="#" className="hover:text-foreground transition-smooth">Contact</a></li>
          <li><a href="#" className="hover:text-foreground transition-smooth">Privacy</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-6 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} VerdantGrid. All rights reserved.</span>
        <span>Made with care for local growers.</span>
      </div>
    </div>
  </footer>
);
