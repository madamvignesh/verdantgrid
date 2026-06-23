import { useEffect, useMemo, useState } from "react";
import { Plus, Inbox, ListChecks, Sprout, MapPin, Repeat, Package, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "./StatCard";
import { CitySwitcher } from "./CitySwitcher";
import { toast } from "@/hooks/use-toast";
import {
  type Crop,
  type Frequency,
  browseRequests,
  createListing,
  deleteListing,
  getFarmerByUser,
  listCrops,
  listMyListings,
  listMySubscriptions,
  listUpcomingOrders,
  updateOrderStatus,
} from "@/services/api";

export const FarmerDashboard = () => {
  const { user, profile } = useAuth();
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [cropId, setCropId] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const [bCrop, setBCrop] = useState("all");
  const [bFreq, setBFreq] = useState("all");
  const [cityFilter, setCityFilter] = useState<string>("");

  useEffect(() => {
    if (profile?.city && !cityFilter) setCityFilter(profile.city);
  }, [profile?.city]);

  const refresh = async () => {
    if (!user) return;
    const f = await getFarmerByUser(user.id);
    if (!f) return;
    setFarmerId(f.id);
    const [cs, mine, ss, os] = await Promise.all([
      listCrops(),
      listMyListings(f.id),
      listMySubscriptions({ farmerId: f.id }),
      listUpcomingOrders({ farmerId: f.id }),
    ]);
    setCrops(cs);
    setMyListings(mine);
    setSubs(ss);
    setOrders(os);
    await refreshRequests();
  };

  const refreshRequests = async () => {
    const data = await browseRequests({
      city: cityFilter || undefined,
      crop_id: bCrop !== "all" ? bCrop : undefined,
      frequency: bFreq !== "all" ? (bFreq as Frequency) : undefined,
    });
    setRequests(data);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { if (farmerId) refreshRequests(); /* eslint-disable-next-line */ }, [bCrop, bFreq, cityFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !profile) return;
    if (!cropId || !weight || !price) return toast({ title: "Fill all fields", variant: "destructive" });
    try {
      await createListing({
        farmer_id: farmerId,
        crop_id: cropId,
        available_weight: Number(weight),
        price_per_unit: Number(price),
        frequency,
        city: profile.city,
      });
      setCropId(""); setWeight(""); setPrice(""); setFrequency("weekly");
      setOpen(false);
      toast({ title: "Listing posted" });
      refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const removeListing = async (id: string) => {
    await deleteListing(id);
    toast({ title: "Listing removed" });
    refresh();
  };

  const markDelivered = async (id: string) => {
    await updateOrderStatus(id, "delivered");
    toast({ title: "Marked delivered" });
    refresh();
  };

  const trends = useMemo(() => {
    const map = new Map<string, number>();
    requests.forEach((r) => {
      const name = r.crops?.name || "—";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [requests]);

  const activeSubs = subs.filter((s) => s.status === "active");
  const upcoming = orders.filter((o) => o.status === "pending");

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Inbox} label="Open requests nearby" value={requests.length} />
        <StatCard icon={ListChecks} label="Active subscriptions" value={activeSubs.length} />
        <StatCard icon={Sprout} label="Upcoming deliveries" value={upcoming.length} />
      </div>

      {trends.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Demand trends in {profile?.city || "your city"}</h3>
          <p className="text-sm text-muted-foreground">Plan your next planting based on what kitchens want most.</p>
          <div className="mt-4 space-y-2">
            {trends.map(([crop, count]) => {
              const max = trends[0][1];
              const pct = (count / max) * 100;
              return (
                <div key={crop} className="flex items-center gap-3 text-sm">
                  <div className="w-32 truncate">{crop}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-right text-muted-foreground">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Marketplace</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4" /> New listing</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>List a crop you offer</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={cropId} onValueChange={setCropId}>
                  <SelectTrigger><SelectValue placeholder="Pick a crop" /></SelectTrigger>
                  <SelectContent>
                    {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.weight_type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="w">Available weight</Label>
                  <Input id="w" type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p">Price per unit ($)</Label>
                  <Input id="p" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="hero" type="submit" className="w-full">Publish listing</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><Search className="h-4 w-4 mr-1" />Browse demand</TabsTrigger>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="orders">Upcoming deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <Select value={bCrop} onValueChange={setBCrop}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Crop" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All crops</SelectItem>
                {crops.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={bFreq} onValueChange={setBFreq}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any frequency</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
              </SelectContent>
            </Select>
            <CitySwitcher city={cityFilter} onChange={setCityFilter} defaultCity={profile?.city} />
            <p className="text-xs text-muted-foreground self-center">Showing demand in <strong>{cityFilter || "all cities"}</strong></p>
          </div>
          {requests.length === 0 ? (
            <EmptyState text="No open requests right now." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{r.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground">{r.restaurants?.profiles?.full_name || "Restaurant"}</p>
                    </div>
                    <Badge variant="secondary">${r.price_range_min}–${r.price_range_max}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{r.required_weight} {r.crops?.weight_type}</span>
                    <span className="flex items-center gap-1 capitalize"><Repeat className="h-3.5 w-3.5" />{r.frequency}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.city}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Restaurants start subscriptions from your listings. Make sure you have a matching listing posted.
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          {myListings.length === 0 ? <EmptyState text="No listings yet — publish your first." /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {myListings.map((l) => (
                <div key={l.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{l.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{l.frequency} · {l.city}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeListing(l.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm mt-3">
                    {l.available_weight} {l.crops?.weight_type} · ${Number(l.price_per_unit).toFixed(2)}/{l.crops?.weight_type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subs" className="mt-4">
          {subs.length === 0 ? <EmptyState text="No subscriptions yet." /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {subs.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{s.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground">For {s.restaurants?.profiles?.full_name || "Restaurant"}</p>
                    </div>
                    <Badge>{s.status}</Badge>
                  </div>
                  <p className="text-sm mt-3 text-muted-foreground">
                    {s.quantity} {s.crops?.weight_type} · {s.frequency} · ${Number(s.agreed_price).toFixed(2)} per unit
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? <EmptyState text="No upcoming deliveries." /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {orders.map((o) => (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold">{o.subscriptions?.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground">Delivery {o.delivery_date}</p>
                    </div>
                    <Badge variant={o.status === "delivered" ? "secondary" : "default"}>{o.status}</Badge>
                  </div>
                  <p className="text-sm mt-2">{o.quantity} {o.subscriptions?.crops?.weight_type}</p>
                  {o.status === "pending" && (
                    <Button size="sm" variant="hero" className="mt-3 w-full" onClick={() => markDelivered(o.id)}>
                      Mark delivered
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
    {text}
  </div>
);
