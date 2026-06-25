import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Pencil } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/context/AuthContext";
import { RestaurantDashboard } from "@/components/dashboard/RestaurantDashboard";
import { FarmerDashboard } from "@/components/dashboard/FarmerDashboard";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  // Setup form states
  const [setupRole, setSetupRole] = useState<Role>("restaurant");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      toast({ title: "City is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("setup_user_profile", {
        chosen_role: setupRole,
        user_city: city.trim(),
        user_phone: phone.trim(),
        user_extra: extra.trim(),
      });

      if (error) throw error;

      toast({ title: "Setup complete! Welcome to VerdantGrid." });
      await refreshProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Failed to complete setup", description: message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // If the user role is not set, show the Setup Profile screen
  if (!profile.role) {
    return (
      <div className="min-h-screen flex bg-gradient-hero relative items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="relative w-full max-w-md space-y-8 rounded-3xl border border-border bg-card/80 backdrop-blur shadow-elegant p-8">
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Complete your profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please choose your role and enter details to get started.
            </p>
          </div>

          <form onSubmit={handleSetupSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label>I am a</Label>
              <Select value={setupRole} onValueChange={(v) => setSetupRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant / Kitchen</SelectItem>
                  <SelectItem value="farmer">Urban Farmer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="setup-city">City</Label>
                <Input
                  id="setup-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Brooklyn"
                  maxLength={80}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-phone">Phone</Label>
                <Input
                  id="setup-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555…"
                  maxLength={30}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-extra">
                {setupRole === "farmer" ? "Farm capacity" : "Restaurant type"}
              </Label>
              <Input
                id="setup-extra"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder={setupRole === "farmer" ? "e.g. 200 sq ft vertical" : "e.g. Fine dining"}
                maxLength={120}
              />
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full mt-6" disabled={busy}>
              {busy ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {(profile.full_name || profile.email).split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {profile.role ?? "member"} · {profile.city || "City not set"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </Button>
        </div>
        {profile.role === "farmer" ? <FarmerDashboard /> : <RestaurantDashboard />}
        <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      </main>
    </div>
  );
};

export default Dashboard;
