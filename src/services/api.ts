import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Frequency = Database["public"]["Enums"]["frequency_type"];
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type Crop = Database["public"]["Tables"]["crops"]["Row"];
export type FarmerListing = Database["public"]["Tables"]["farmer_listings"]["Row"];
export type RestaurantRequest = Database["public"]["Tables"]["restaurant_requests"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];

// ---------- Identity helpers ----------
export async function getFarmerByUser(userId: string) {
  const { data } = await supabase.from("farmers").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function getRestaurantByUser(userId: string) {
  const { data } = await supabase.from("restaurants").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

// ---------- Crops ----------
export async function listCrops(): Promise<Crop[]> {
  const { data, error } = await supabase.from("crops").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

// ---------- Farmer listings ----------
export async function createListing(input: {
  farmer_id: string;
  crop_id: string;
  available_weight: number;
  price_per_unit: number;
  frequency: Frequency;
  city: string;
}) {
  const { data, error } = await supabase.from("farmer_listings").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listMyListings(farmerId: string) {
  const { data, error } = await supabase
    .from("farmer_listings")
    .select("*, crops(name, weight_type)")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function browseListings(filters: { city?: string; crop_id?: string; frequency?: Frequency }) {
  let q = supabase
    .from("farmer_listings")
    .select("*, crops(name, weight_type), farmers(id, user_id, phone, profiles:user_id(full_name))");
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.crop_id) q = q.eq("crop_id", filters.crop_id);
  if (filters.frequency) q = q.eq("frequency", filters.frequency);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteListing(id: string) {
  const { error } = await supabase.from("farmer_listings").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Restaurant requests ----------
export async function createRequest(input: {
  restaurant_id: string;
  crop_id: string;
  required_weight: number;
  price_range_min: number;
  price_range_max: number;
  frequency: Frequency;
  city: string;
}) {
  const { data, error } = await supabase.from("restaurant_requests").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listMyRequests(restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurant_requests")
    .select("*, crops(name, weight_type)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function browseRequests(filters: { city?: string; crop_id?: string; frequency?: Frequency }) {
  let q = supabase
    .from("restaurant_requests")
    .select("*, crops(name, weight_type), restaurants(id, user_id, phone, profiles:user_id(full_name))");
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.crop_id) q = q.eq("crop_id", filters.crop_id);
  if (filters.frequency) q = q.eq("frequency", filters.frequency);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteRequest(id: string) {
  const { error } = await supabase.from("restaurant_requests").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Subscriptions ----------
function nextDeliveryDates(start: Date, frequency: Frequency, count: number): string[] {
  const dates: string[] = [];
  const stepDays = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 14;
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + stepDays * i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function createSubscription(input: {
  restaurant_id: string;
  farmer_id: string;
  crop_id: string;
  quantity: number;
  agreed_price: number;
  frequency: Frequency;
}) {
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .insert({ ...input, start_date: new Date().toISOString().slice(0, 10) })
    .select()
    .single();
  if (error) throw error;

  // Auto-generate first 4 orders
  const dates = nextDeliveryDates(new Date(), input.frequency, 4);
  const orders = dates.map((d) => ({
    subscription_id: sub.id,
    delivery_date: d,
    quantity: input.quantity,
    status: "pending" as OrderStatus,
  }));
  const { error: oErr } = await supabase.from("orders").insert(orders);
  if (oErr) throw oErr;
  return sub;
}

export async function listMySubscriptions(opts: { farmerId?: string; restaurantId?: string }) {
  let q = supabase
    .from("subscriptions")
    .select(
      "*, crops(name, weight_type), farmers(id, user_id, profiles:user_id(full_name)), restaurants(id, user_id, profiles:user_id(full_name))"
    );
  if (opts.farmerId) q = q.eq("farmer_id", opts.farmerId);
  if (opts.restaurantId) q = q.eq("restaurant_id", opts.restaurantId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
  const { error } = await supabase.from("subscriptions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteSubscription(id: string) {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Orders ----------
export async function listUpcomingOrders(opts: { farmerId?: string; restaurantId?: string }) {
  // get subscriptions for the user, then their orders
  const subs = await listMySubscriptions(opts);
  const ids = subs.map((s) => s.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, subscriptions(*, crops(name, weight_type))")
    .in("subscription_id", ids)
    .order("delivery_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}
