import { useEffect, useMemo, useState } from "react";
import { Plus, Sprout, CalendarClock, Package, MapPin, Repeat, Trash2, Search } from "lucide-react";
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
  browseListings,
  createRequest,
  createSubscription,
  deleteRequest,
  deleteSubscription,
  getRestaurantByUser,
  listCrops,
  listMyRequests,
  listMySubscriptions,
  listUpcomingOrders,
  updateOrderStatus,
} from "@/services/api";

export const RestaurantDashboard = () => {
  const { user, profile } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [cropId, setCropId] = useState("");
  const [weight, setWeight] = useState("");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  // browse filters
  const [bCrop, setBCrop] = useState<string>("all");
  const [bFreq, setBFreq] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");

  useEffect(() => {
    if (profile?.city && !cityFilter) setCityFilter(profile.city);
  }, [profile?.city]);

  const refresh = async () => {
    if (!user) return;
    // Always load crops independently so the form works even if restaurant row is missing
    listCrops().then(setCrops).catch(() => {});
    const r = await getRestaurantByUser(user.id);
    if (!r) return;
    setRestaurantId(r.id);
    const [mine, ss, os] = await Promise.all([
      listMyRequests(r.id),
      listMySubscriptions({ restaurantId: r.id }),
      listUpcomingOrders({ restaurantId: r.id }),
    ]);
    setMyRequests(mine);
    setSubs(ss);
    setOrders(os);
    await refreshListings();
  };

  const refreshListings = async (_cs?: Crop[]) => {
    const data = await browseListings({
      city: cityFilter || undefined,
      crop_id: bCrop !== "all" ? bCrop : undefined,
      frequency: bFreq !== "all" ? (bFreq as Frequency) : undefined,
    });
    setListings(data);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { if (restaurantId) refreshListings(); /* eslint-disable-next-line */ }, [bCrop, bFreq, cityFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !profile) return;
    if (!cropId || !weight || !pmin || !pmax) {
      return toast({ title: "Fill all fields", variant: "destructive" });
    }
    try {
      await createRequest({
        restaurant_id: restaurantId,
        crop_id: cropId,
        required_weight: Number(weight),
        price_range_min: Number(pmin),
        price_range_max: Number(pmax),
        frequency,
        city: profile.city,
      });
      setCropId(""); setWeight(""); setPmin(""); setPmax(""); setFrequency("weekly");
      setOpen(false);
      toast({ title: "Demand posted" });
      refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const startSubscription = async (listing: any) => {
    if (!restaurantId) return;
    try {
      await createSubscription({
        restaurant_id: restaurantId,
        farmer_id: listing.farmers.id,
        crop_id: listing.crop_id,
        quantity: Number(listing.available_weight),
        agreed_price: Number(listing.price_per_unit),
        frequency: listing.frequency,
      });
      toast({ title: "Subscription started", description: "First 4 deliveries scheduled." });
      refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const removeRequest = async (id: string) => {
    await deleteRequest(id);
    toast({ title: "Request removed" });
    refresh();
  };

  const removeSubscription = async (id: string) => {
    try {
      await deleteSubscription(id);
      toast({ title: "Subscription cancelled", description: "All future deliveries have been removed." });
      refresh();
    } catch (err: any) {
      toast({ title: "Failed to cancel subscription", description: err.message, variant: "destructive" });
    }
  };

  const markDelivered = async (id: string) => {
    await updateOrderStatus(id, "delivered");
    toast({ title: "Marked delivered" });
    refresh();
  };

  const upcoming = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const activeSubs = useMemo(() => subs.filter((s) => s.status === "active"), [subs]);

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Sprout} label="Active requests" value={myRequests.length} />
        <StatCard icon={CalendarClock} label="Active subscriptions" value={activeSubs.length} />
        <StatCard icon={Package} label="Upcoming deliveries" value={upcoming.length} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Marketplace</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="h-4 w-4" /> New demand</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post a crop request</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={cropId || undefined} onValueChange={setCropId}>
                  <SelectTrigger><SelectValue placeholder={crops.length ? "Pick a crop" : "Loading crops..."} /></SelectTrigger>
                  <SelectContent className="z-[100] max-h-72">
                    {crops.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No crops available</div>
                    ) : crops.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.weight_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qty">Required weight</Label>
                  <Input id="qty" type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pmin">Price min ($)</Label>
                  <Input id="pmin" type="number" min="0" step="0.01" value={pmin} onChange={(e) => setPmin(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pmax">Price max ($)</Label>
                  <Input id="pmax" type="number" min="0" step="0.01" value={pmax} onChange={(e) => setPmax(e.target.value)} />
                </div>
              </div>
              <Button variant="hero" type="submit" className="w-full">Post demand</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse"><Search className="h-4 w-4 mr-1" />Browse listings</TabsTrigger>
          <TabsTrigger value="requests">My requests</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="orders">Upcoming deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
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
            <p className="text-xs text-muted-foreground self-center">Showing listings in <strong>{cityFilter || "all cities"}</strong></p>
          </div>
          {listings.length === 0 ? (
            <EmptyState text="No matching listings yet." />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {listings.map((l) => (
                <div key={l.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{l.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {l.farmers?.profiles?.full_name || "Farmer"}
                      </p>
                    </div>
                    <Badge variant="secondary">${Number(l.price_per_unit).toFixed(2)}/{l.crops?.weight_type}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{l.available_weight} {l.crops?.weight_type}</span>
                    <span className="flex items-center gap-1 capitalize"><Repeat className="h-3.5 w-3.5" />{l.frequency}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{l.city}</span>
                  </div>
                  <Button size="sm" variant="hero" className="w-full mt-4" onClick={() => startSubscription(l)}>
                    Start subscription
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          {myRequests.length === 0 ? <EmptyState text="No requests yet — post your first demand." /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {myRequests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{r.crops?.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{r.frequency} · {r.city}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeRequest(r.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm mt-3">
                    Need <strong>{r.required_weight} {r.crops?.weight_type}</strong> — budget ${r.price_range_min}–${r.price_range_max}
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
                      <p className="text-sm text-muted-foreground">From {s.farmers?.profiles?.full_name || "Farmer"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{s.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => removeSubscription(s.id)} aria-label="Cancel Subscription">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => markDelivered(o.id)}>
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
