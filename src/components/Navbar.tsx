import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/verdantgrid-logo.jpg";

export const Navbar = () => {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <img src={logo} alt="VerdantGrid logo" className="h-9 w-9 rounded-xl object-cover" />
          VerdantGrid
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="/#how" className="hover:text-foreground transition-smooth">How it works</a>
          <a href="/#features" className="hover:text-foreground transition-smooth">Features</a>
          <a href="/#audience" className="hover:text-foreground transition-smooth">For you</a>
          <a href="/#pricing" className="hover:text-foreground transition-smooth">Pricing</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="outline" size="icon" onClick={async () => { await logout(); navigate("/"); }} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>Log in</Button>
              <Button variant="hero" onClick={() => navigate("/auth?mode=signup")}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
