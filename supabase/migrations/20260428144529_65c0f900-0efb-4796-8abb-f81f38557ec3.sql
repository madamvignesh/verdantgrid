-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('farmer', 'restaurant');
CREATE TYPE public.frequency_type AS ENUM ('daily', 'weekly', 'biweekly');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('pending', 'delivered', 'cancelled');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ Auto-create profile + role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'city', '')
  );

  -- role from metadata, default 'restaurant'
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'restaurant'::public.app_role);
  EXCEPTION WHEN OTHERS THEN
    v_role := 'restaurant'::public.app_role;
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  IF v_role = 'farmer' THEN
    INSERT INTO public.farmers (user_id, phone, farm_capacity)
    VALUES (NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'farm_capacity', ''));
  ELSE
    INSERT INTO public.restaurants (user_id, phone, restaurant_type)
    VALUES (NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'restaurant_type', ''));
  END IF;

  RETURN NEW;
END;
$$;

-- ============ FARMERS ============
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL DEFAULT '',
  farm_capacity TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers viewable by authenticated"
  ON public.farmers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farmer can update own row"
  ON public.farmers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Farmer can insert own row"
  ON public.farmers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_farmers_updated BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RESTAURANTS ============
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL DEFAULT '',
  restaurant_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants viewable by authenticated"
  ON public.restaurants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Restaurant can update own row"
  ON public.restaurants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Restaurant can insert own row"
  ON public.restaurants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now create the trigger (after farmers/restaurants tables exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CROPS ============
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  weight_type TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crops are readable by everyone authenticated"
  ON public.crops FOR SELECT TO authenticated USING (true);

INSERT INTO public.crops (name, weight_type) VALUES
  ('Basil', 'kg'), ('Mint', 'kg'), ('Cilantro', 'kg'),
  ('Pea Shoots', 'g'), ('Sunflower Microgreens', 'g'),
  ('Radish Microgreens', 'g'), ('Arugula', 'kg'),
  ('Wheatgrass', 'g'), ('Kale Microgreens', 'g'), ('Beet Microgreens', 'g');

-- ============ FARMER LISTINGS ============
CREATE TABLE public.farmer_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  available_weight NUMERIC NOT NULL CHECK (available_weight > 0),
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
  frequency public.frequency_type NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.farmer_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings viewable by authenticated"
  ON public.farmer_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farmer can insert own listings"
  ON public.farmer_listings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid()));
CREATE POLICY "Farmer can update own listings"
  ON public.farmer_listings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid()));
CREATE POLICY "Farmer can delete own listings"
  ON public.farmer_listings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid()));
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.farmer_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RESTAURANT REQUESTS ============
CREATE TABLE public.restaurant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  required_weight NUMERIC NOT NULL CHECK (required_weight > 0),
  price_range_min NUMERIC NOT NULL CHECK (price_range_min >= 0),
  price_range_max NUMERIC NOT NULL CHECK (price_range_max >= price_range_min),
  frequency public.frequency_type NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.restaurant_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by authenticated"
  ON public.restaurant_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Restaurant can insert own requests"
  ON public.restaurant_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid()));
CREATE POLICY "Restaurant can update own requests"
  ON public.restaurant_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid()));
CREATE POLICY "Restaurant can delete own requests"
  ON public.restaurant_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid()));
CREATE TRIGGER trg_requests_updated BEFORE UPDATE ON public.restaurant_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  agreed_price NUMERIC NOT NULL CHECK (agreed_price >= 0),
  frequency public.frequency_type NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view their subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
  );
CREATE POLICY "Restaurant can create subscriptions"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid()));
CREATE POLICY "Parties can update subscriptions"
  ON public.subscriptions FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
  );
CREATE POLICY "Parties can delete subscriptions"
  ON public.subscriptions FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = farmer_id AND f.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
  );
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORDERS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view orders"
  ON public.orders FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      LEFT JOIN public.farmers f ON f.id = s.farmer_id
      LEFT JOIN public.restaurants r ON r.id = s.restaurant_id
      WHERE s.id = subscription_id AND (f.user_id = auth.uid() OR r.user_id = auth.uid())
    )
  );
CREATE POLICY "Parties can update orders"
  ON public.orders FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      LEFT JOIN public.farmers f ON f.id = s.farmer_id
      LEFT JOIN public.restaurants r ON r.id = s.restaurant_id
      WHERE s.id = subscription_id AND (f.user_id = auth.uid() OR r.user_id = auth.uid())
    )
  );
CREATE POLICY "Parties can insert orders"
  ON public.orders FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      LEFT JOIN public.farmers f ON f.id = s.farmer_id
      LEFT JOIN public.restaurants r ON r.id = s.restaurant_id
      WHERE s.id = subscription_id AND (f.user_id = auth.uid() OR r.user_id = auth.uid())
    )
  );
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_listings_match ON public.farmer_listings(crop_id, city, frequency);
CREATE INDEX idx_requests_match ON public.restaurant_requests(crop_id, city, frequency);
CREATE INDEX idx_subs_farmer ON public.subscriptions(farmer_id);
CREATE INDEX idx_subs_restaurant ON public.subscriptions(restaurant_id);
CREATE INDEX idx_orders_sub ON public.orders(subscription_id);