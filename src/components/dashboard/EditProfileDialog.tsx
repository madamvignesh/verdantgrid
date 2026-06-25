import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export const EditProfileDialog = ({ open, onOpenChange }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");
  const [dialogRole, setDialogRole] = useState<Role>("restaurant");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user || !profile) return;
    setFullName(profile.full_name || "");
    setCity(profile.city || "");
    if (profile.role) setDialogRole(profile.role);

    const table = profile.role === "farmer" ? "farmers" : "restaurants";
    supabase
      .from(table)
      .select(profile.role === "farmer" ? "phone, farm_capacity" : "phone, restaurant_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const profileData = data as { phone?: string; farm_capacity?: string; restaurant_type?: string } | null;
        setPhone(profileData?.phone || "");
        setExtra(profile.role === "farmer" ? profileData?.farm_capacity || "" : profileData?.restaurant_type || "");
      });
  }, [open, user, profile]);

  const valid = fullName.trim().length > 0 && city.trim().length > 0;

  const save = async () => {
    if (!user || !profile || !valid) return;
    setSaving(true);
    try {
      // 1. Update profiles full_name
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("user_id", user.id);
      if (pErr) throw pErr;

      // 2. Call setup_user_profile RPC to handle role update, city, phone, and extra details
      const { error: rpcErr } = await supabase.rpc("setup_user_profile", {
        chosen_role: dialogRole,
        user_city: city.trim(),
        user_phone: phone.trim(),
        user_extra: extra.trim(),
      });
      if (rpcErr) throw rpcErr;

      await refreshProfile();
      toast({ title: "Profile updated" });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Failed to save", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label>I am a</Label>
            <Select value={dialogRole} onValueChange={(v) => setDialogRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant / Kitchen</SelectItem>
                <SelectItem value="farmer">Urban Farmer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct">City</Label>
            <Input id="ct" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ex">{dialogRole === "farmer" ? "Farm capacity" : "Restaurant type"}</Label>
            <Input id="ex" value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={120} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button variant="hero" onClick={save} disabled={!valid || saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
