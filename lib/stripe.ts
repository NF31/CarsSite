import Stripe from "stripe";

if (!process.env.STRIPE_SECRET) {
  throw new Error("STRIPE_SECRET is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

