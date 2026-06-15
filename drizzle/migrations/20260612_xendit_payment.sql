-- Add awaiting_payment status to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';

-- Add payment_expiry column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_expiry timestamptz;

-- Add payment_channel column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_channel text;
