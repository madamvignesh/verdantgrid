import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { RestaurantDashboard } from "@/components/dashboard/RestaurantDashboard";
import { FarmerDashboard } from "@/components/dashboard/FarmerDashboard";
import { EditProfileDialog } from "@/components/dashboard/EditProfileDialog";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

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
