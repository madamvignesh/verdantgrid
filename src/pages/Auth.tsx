import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Leaf, Moon, Sun, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type Role } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const initialRole = (params.get("role") as Role) || "restaurant";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast({ title: "Email and password required", variant: "destructive" });
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim() || !city.trim()) {
          toast({ title: "Please fill in all fields", variant: "destructive" });
          return;
        }
        if (password.length < 6) {
          toast({ title: "Password must be at least 6 characters", variant: "destructive" });
          return;
        }
        const r = await signup({
          email: email.trim(),
          password,
          full_name: name.trim(),
          city: city.trim(),
          role,
          phone: phone.trim(),
          farm_capacity: role === "farmer" ? extra.trim() : undefined,
          restaurant_type: role === "restaurant" ? extra.trim() : undefined,
        });
        if (!r.ok) {
          toast({ title: r.error, variant: "destructive" });
          return;
        }
        toast({ title: `Welcome to VerdantGrid, ${name.split(" ")[0]}!` });
      } else {
        const r = await login(email.trim(), password);
        if (!r.ok) {
          toast({ title: r.error, variant: "destructive" });
          return;
        }
        toast({ title: "Welcome back!" });
      }
      navigate("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-hero">
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
      <div className="relative w-full container max-w-md flex flex-col justify-center py-12">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </span>
            VerdantGrid
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur shadow-elegant p-8">
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole("restaurant")}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${role === "restaurant" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Utensils className="h-5 w-5" />
              <span>Restaurant / Kitchen</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${role === "farmer" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Leaf className="h-5 w-5" />
              <span>Urban Farmer</span>
            </button>
          </div>

          <div className="flex p-1 bg-muted rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-smooth ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Log in</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-smooth ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Sign up</button>
          </div>

          <h1 className="font-display text-2xl font-bold text-center sm:text-left">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
            {mode === "login" 
              ? `Log in to manage your ${role === "farmer" ? "listings and orders" : "orders and requests"}.` 
              : "Join the local food network in seconds."
            }
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-6"
            onClick={() => signInWithGoogle(role, city.trim(), phone.trim(), extra.trim())}
            disabled={busy}
          >
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 my-4 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Greene" maxLength={80} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kitchen.com" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" maxLength={64} />
            </div>
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brooklyn" maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555…" maxLength={30} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="extra">{role === "farmer" ? "Farm capacity" : "Restaurant type"}</Label>
                  <Input
                    id="extra"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder={role === "farmer" ? "e.g. 200 sq ft vertical" : "e.g. Fine dining"}
                    maxLength={120}
                  />
                </div>
              </>
            )}
            <Button type="submit" variant="hero" size="lg" className="w-full mt-2" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
