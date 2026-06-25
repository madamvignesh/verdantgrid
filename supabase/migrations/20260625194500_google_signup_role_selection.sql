-- 1. Update the new user trigger to NOT default the role to restaurant
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

  -- Only insert role and profile tables if role metadata exists
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
      
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
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors and let user select role later
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create the setup_user_profile RPC function to complete profile setup
CREATE OR REPLACE FUNCTION public.setup_user_profile(
  chosen_role public.app_role,
  user_city text,
  user_phone text,
  user_extra text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Clear existing roles for this user and insert the new role
  DELETE FROM public.user_roles WHERE user_id = auth.uid();
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), chosen_role);

  -- 2. Update the profile city
  UPDATE public.profiles
  SET city = COALESCE(user_city, '')
  WHERE user_id = auth.uid();

  -- 3. Create the corresponding profile table (farmer or restaurant)
  IF chosen_role = 'farmer' THEN
    INSERT INTO public.farmers (user_id, phone, farm_capacity)
    VALUES (auth.uid(), COALESCE(user_phone, ''), COALESCE(user_extra, ''))
    ON CONFLICT (user_id) DO UPDATE
    SET phone = COALESCE(user_phone, ''), farm_capacity = COALESCE(user_extra, '');
    
    DELETE FROM public.restaurants WHERE user_id = auth.uid();
  ELSE
    INSERT INTO public.restaurants (user_id, phone, restaurant_type)
    VALUES (auth.uid(), COALESCE(user_phone, ''), COALESCE(user_extra, ''))
    ON CONFLICT (user_id) DO UPDATE
    SET phone = COALESCE(user_phone, ''), restaurant_type = COALESCE(user_extra, '');
    
    DELETE FROM public.farmers WHERE user_id = auth.uid();
  END IF;
END;
$$;
