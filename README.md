# VerdantGird 🌿

A real-time B2B marketplace connecting farmers directly with restaurants and hotels to streamline farm-to-fork logistics.

## 🚀 Features

- **Dual Dashboards**: Separate interfaces for farmers and restaurants
- **Real-time Updates**: Live notifications for new orders and messages
- **Subscription System**: Automated recurring orders with delivery scheduling
- **Order Management**: Full lifecycle tracking from pending to delivered
- **Role-based Access**: Secure authentication for farmers and restaurants

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Realtime API, Edge Functions)
- **Authentication**: Supabase Auth
- **Database Schema**:
  - `crops` - Farm produce catalog
  - `farmers` - Farmer profiles with location and contact
  - `restaurants` - Restaurant profiles with preferences
  - `farmer_listings` - Available produce inventory
  - `restaurant_requests` - Crop requirements and demand
  - `subscriptions` - Recurring orders between parties
  - `orders` - Individual delivery orders

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 18.0.0 or higher
- [npm](https://www.npmjs.com/) 9.0.0 or higher
- Supabase Project (see `.env.local.example` for configuration)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd verdantgird
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```bash
# .env.local
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## 🔐 Authentication

The application uses email/password authentication:

**Farmer Credentials (Pre-registered):**
- **Email**: [EMAIL_ADDRESS]`
- **Password**: password

**Restaurant Credentials (Pre-registered):**
- **Email**: [EMAIL_ADDRESS]`
- **Password**: password

## 📡 API Services

### Core Services (`src/services/api.ts`)

**Crops**
- `listCrops()` - Fetch all available crops

**Identity**
- `getFarmerByUser(userId)` - Get farmer profile by user ID
- `getRestaurantByUser(userId)` - Get restaurant profile by user ID

**Farmer Listings**
- `createListing(input)` - Farmer creates produce listing
- `listMyListings(farmerId)` - List farmer's own listings
- `browseListings(filters)` - Browse listings with filters
- `deleteListing(id)` - Delete a listing

**Restaurant Requests**
- `createRequest(input)` - Restaurant creates crop request
- `listMyRequests(restaurantId)` - List restaurant's requests
- `browseRequests(filters)` - Browse requests with filters
- `deleteRequest(id)` - Delete a request

**Subscriptions**
- `createSubscription(input)` - Create recurring subscription
- `listMySubscriptions(opts)` - List subscriptions (farmer or restaurant)
- `deleteSubscription(id)` - Cancel a subscription

**Orders**
- `listUpcomingOrders(opts)` - List upcoming deliveries
- `updateOrderStatus(id, status)` - Update order status

## 📚 Database Schema (Key Tables)

### `crops`
```sql
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight_type TEXT NOT NULL -- e.g., 'kg', 'pieces'
);
```

### `farmers`
```sql
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  phone TEXT,
  city TEXT,
  -- Additional farmer-specific fields
  farm_size TEXT,
  organic_certified BOOLEAN DEFAULT FALSE
);
```

### `restaurants`
```sql
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  phone TEXT,
  city TEXT,
  -- Additional restaurant-specific fields
  cuisine_type TEXT,
  restaurant_type TEXT -- e.g., 'cafe', 'hotel'
);
```

### `farmer_listings`
```sql
CREATE TABLE public.farmer_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  crop_id UUID NOT NULL REFERENCES public.crops(id),
  available_weight NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  frequency TEXT NOT NULL, -- 'daily' | 'weekly' | 'bi-weekly'
  city TEXT NOT NULL,
  -- Additional listing fields
  organic_certified BOOLEAN DEFAULT FALSE,
  harvest_date DATE,
  delivery_window TEXT -- e.g., '7am-9am'
);
```

### `restaurant_requests`
```sql
CREATE TABLE public.restaurant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  crop_id UUID NOT NULL REFERENCES public.crops(id),
  required_weight NUMERIC NOT NULL,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  frequency TEXT NOT NULL, -- 'daily' | 'weekly' | 'bi-weekly'
  city TEXT NOT NULL,
  -- Additional request fields
  special_requirements TEXT,
  preferred_delivery_window TEXT
);
```

### `subscriptions`
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  crop_id UUID NOT NULL REFERENCES public.crops(id),
  quantity NUMERIC NOT NULL,
  agreed_price NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  -- Additional subscription fields
  status TEXT DEFAULT 'active'::subscription_status,
  payment_method TEXT,
  delivery_notes TEXT
);
```

### `orders`
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
  delivery_date DATE NOT NULL,
  quantity NUMERIC NOT NULL,
  -- Additional order fields
  status TEXT NOT NULL, -- 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  delivered_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'unpaid'::payment_status
);
```

## 🔄 Database Migrations

All Supabase migrations are located in `supabase/migrations/`:

- `20260428144529_65c0f900-0efb-4796-8abb-f81f38557ec3.sql` - Initial schema creation with:
  - User profiles for farmers and restaurants
  - Farmers table for farmer information
  - Restaurants table for restaurant information
  - Farmer listings, restaurant requests, subscriptions, and orders tables
  - RLS policies for secure data access
  - Trigger for auto-updating `updated_at` column

## 🔐 Realtime Subscriptions

Realtime functionality is enabled via Supabase Realtime API. Key realtime-enabled tables:

- `orders` - Realtime updates for order status changes
- `subscriptions` - Realtime updates for subscription status
- `farmer_listings` - Real
