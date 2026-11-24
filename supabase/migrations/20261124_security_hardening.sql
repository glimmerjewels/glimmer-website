-- ==============================================================================
-- GLIMMER JEWELS: SUPABASE ROW LEVEL SECURITY (RLS) & STORAGE HARDENING
-- Migration: 20261124_security_hardening.sql
-- ==============================================================================

-- 1. DEFINE HELPER FUNCTION TO CHECK IF CURRENT USER IS AN AUTHORIZED ADMIN
-- ------------------------------------------------------------------------------
-- Replace or extend the email list with your authorized admin email address(es)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN (
      'glimmer.jewels2000@gmail.com'
      -- Add additional admin emails here if needed
    ) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Grant execute access to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;


-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL APPLICATION TABLES
-- ==============================================================================
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 3. POLICIES FOR: products
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Allow public read access to active catalogue items
CREATE POLICY "Public can view products"
  ON public.products
  FOR SELECT
  TO public
  USING (true);

-- Restrict product creation, updates, and deletion to authenticated admins only
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 4. POLICIES FOR: product_images
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;

CREATE POLICY "Public can view product images"
  ON public.product_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 5. POLICIES FOR: offers & offer_rules
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
DROP POLICY IF EXISTS "Public can view offer rules" ON public.offer_rules;
DROP POLICY IF EXISTS "Admins can manage offer rules" ON public.offer_rules;

CREATE POLICY "Public can view offers"
  ON public.offers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage offers"
  ON public.offers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Public can view offer rules"
  ON public.offer_rules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage offer rules"
  ON public.offer_rules
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 6. POLICIES FOR: reviews
-- ==============================================================================
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can insert validated reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;

-- Anyone can view customer reviews
CREATE POLICY "Public can view reviews"
  ON public.reviews
  FOR SELECT
  TO public
  USING (true);

-- Anyone can submit a review with rating bounded between 1 and 5
CREATE POLICY "Public can insert validated reviews"
  ON public.reviews
  FOR INSERT
  TO public
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND length(trim(customer_name)) >= 1 AND length(trim(customer_name)) <= 100
    AND length(trim(review)) >= 1 AND length(trim(review)) <= 2000
  );

-- Only admins can delete or update reviews
CREATE POLICY "Admins can manage reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 7. POLICIES FOR: orders & order_items (GUEST SHOPPERS & ORDER CREATION)
-- ==============================================================================
-- Since Glimmer does not require customer accounts, guest shoppers must be able
-- to place orders and receive their order ID for the WhatsApp confirmation message.

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view and update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view and update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;

-- 1) Public guest shoppers can insert new orders during checkout
CREATE POLICY "Public can create orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (
    grand_total >= 0
    AND total_quantity > 0
    AND length(trim(customer_name)) >= 1
    AND length(trim(customer_mobile)) = 10
  );

-- 2) Public can select orders (REQUIRED so Supabase .insert().select().single()
-- can return the newly created order.id back to the guest browser without throwing an RLS error)
CREATE POLICY "Public can view orders"
  ON public.orders
  FOR SELECT
  TO public
  USING (true);

-- 3) Only authenticated admins can modify or delete orders (status updates, cancellation)
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4) Public guest shoppers can insert order items
CREATE POLICY "Public can insert order items"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (
    quantity > 0 AND price >= 0 AND subtotal >= 0
  );

-- 5) Public can view order items (REQUIRED for order confirmation and line item verification)
CREATE POLICY "Public can view order items"
  ON public.order_items
  FOR SELECT
  TO public
  USING (true);

-- 6) Only authenticated admins can modify or delete order items
CREATE POLICY "Admins can update order items"
  ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete order items"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ==============================================================================
-- 8. STORAGE BUCKET POLICIES: product-images
-- ==============================================================================
-- Ensure the storage bucket exists and is public for reading
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies on product-images bucket
DROP POLICY IF EXISTS "Public can view product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images storage" ON storage.objects;

-- Allow anyone to view and download images from product-images
CREATE POLICY "Public can view product images storage"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Only authenticated admins can upload new product images
CREATE POLICY "Admins can upload product images storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only authenticated admins can update product images
CREATE POLICY "Admins can update product images storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only authenticated admins can delete product images
CREATE POLICY "Admins can delete product images storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
