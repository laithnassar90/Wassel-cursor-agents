import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger as honoLogger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// Base path for this function (keeps API_URL alignment with the frontend)
const BASE = "/make-server-cdfdab65" as const;

// Supabase admin client (service role) for server-side operations
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const app = new Hono();

// Logger and CORS
app.use("*", honoLogger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helpers
async function getUserIdFromAuthHeader(c: any): Promise<string | null> {
  const auth = c.req.header("authorization") || c.req.header("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

const requireAuth = async (c: any, next: any) => {
  const userId = await getUserIdFromAuthHeader(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  c.set("userId", userId);
  await next();
};

// Health
app.get(`${BASE}/health`, (c) => c.json({ status: "ok" }));

// ============ AUTH ============
app.post(`${BASE}/auth/signup`, async (c) => {
  try {
    const body = await c.req.json();
    const email: string = body?.email;
    const password: string = body?.password;
    const firstName: string = body?.firstName ?? "";
    const lastName: string = body?.lastName ?? "";
    const phone: string | undefined = body?.phone;

    if (!email || !password) return c.json({ error: "Email and password required" }, 400);

    // Create user (confirmed by default). Adjust to your needs.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      phone,
      user_metadata: { full_name: `${firstName} ${lastName}`.trim() },
    });
    if (createErr || !created.user) return c.json({ error: createErr?.message || "Signup failed" }, 400);

    // Create profile row
    const fullName = `${firstName} ${lastName}`.trim() || email;
    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      email_verified: false,
      phone_verified: false,
    });
    if (profileErr) return c.json({ error: profileErr.message }, 400);

    return c.json({ id: created.user.id, email, full_name: fullName }, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/auth/profile`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

// ============ TRIPS ============
app.post(`${BASE}/trips`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const payload = await c.req.json();

    const insert = {
      driver_id: userId,
      vehicle_id: payload?.vehicle_id ?? null,
      trip_type: payload?.trip_type ?? "wasel",
      status: payload?.status ?? "draft",
      from_location: payload?.from_location,
      from_lat: payload?.from_lat,
      from_lng: payload?.from_lng,
      to_location: payload?.to_location,
      to_lat: payload?.to_lat,
      to_lng: payload?.to_lng,
      departure_date: payload?.departure_date,
      departure_time: payload?.departure_time,
      available_seats: payload?.available_seats,
      price_per_seat: payload?.price_per_seat,
      notes: payload?.notes ?? null,
      instant_booking: payload?.instant_booking ?? false,
    };

    // Basic validation
    const required = [
      "from_location",
      "from_lat",
      "from_lng",
      "to_location",
      "to_lat",
      "to_lng",
      "departure_date",
      "departure_time",
      "available_seats",
      "price_per_seat",
    ];
    for (const key of required) {
      if (insert[key as keyof typeof insert] === undefined || insert[key as keyof typeof insert] === null) {
        return c.json({ error: `Missing field: ${key}` }, 400);
      }
    }

    const { data, error } = await admin
      .from("trips")
      .insert(insert)
      .select("*")
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/trips/search`, async (c) => {
  try {
    const from = c.req.query("from");
    const to = c.req.query("to");
    const date = c.req.query("date");

    let query = admin
      .from("trips")
      .select("*")
      .eq("status", "published");

    if (from) query = query.ilike("from_location", `%${from}%`);
    if (to) query = query.ilike("to_location", `%${to}%`);
    if (date) query = query.gte("departure_date", date);

    const { data, error } = await query.order("departure_date", { ascending: true }).limit(50);
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/trips/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const { data, error } = await admin
      .from("trips")
      .select(
        `*,
         driver:profiles!driver_id(*),
         vehicle:vehicles(*),
         stops:trip_stops(*)`
      )
      .eq("id", id)
      .single();
    if (error) return c.json({ error: error.message }, 404);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/trips/driver`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const { data, error } = await admin
      .from("trips")
      .select("*")
      .eq("driver_id", userId)
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

// ============ BOOKINGS ============
app.post(`${BASE}/bookings`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const tripId: string = body?.tripId;
    const seatsBooked: number = Number(body?.seatsBooked ?? 1);
    if (!tripId || seatsBooked <= 0) return c.json({ error: "Invalid tripId or seatsBooked" }, 400);

    // Fetch trip for price
    const { data: trip, error: tripErr } = await admin
      .from("trips")
      .select("id, price_per_seat")
      .eq("id", tripId)
      .single();
    if (tripErr || !trip) return c.json({ error: tripErr?.message || "Trip not found" }, 404);

    const totalPrice = Number(trip.price_per_seat) * seatsBooked;

    const { data, error } = await admin
      .from("bookings")
      .insert({
        trip_id: tripId,
        passenger_id: userId,
        seats_requested: seatsBooked,
        total_price: totalPrice,
      })
      .select("*")
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/bookings/user`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const { data, error } = await admin
      .from("bookings")
      .select("*")
      .eq("passenger_id", userId)
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

// ============ MESSAGES ============
app.post(`${BASE}/messages`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const tripId: string = body?.tripId;
    const message: string = body?.message;
    if (!tripId || !message) return c.json({ error: "tripId and message are required" }, 400);

    const { data, error } = await admin
      .from("messages")
      .insert({
        conversation_id: tripId,
        sender_id: userId,
        message_type: "text",
        content: message,
      })
      .select("*")
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.get(`${BASE}/messages/conversations`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    // Simple inbox: list last message per conversation where user is sender
    const { data, error } = await admin
      .from("messages")
      .select("conversation_id, content, created_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return c.json({ error: error.message }, 400);

    // Group by conversation_id (in-memory)
    const map = new Map<string, any>();
    for (const m of data || []) {
      if (!map.has(m.conversation_id)) map.set(m.conversation_id, m);
    }
    return c.json(Array.from(map.values()));
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

// ============ WALLET ============
app.get(`${BASE}/wallet`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const { data, error } = await admin
      .from("profiles")
      .select("wallet_balance, total_earned, total_spent, currency")
      .eq("id", userId)
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

app.post(`${BASE}/wallet/add-funds`, requireAuth, async (c) => {
  try {
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: "Invalid amount" }, 400);

    const { data, error } = await admin
      .from("transactions")
      .insert({
        to_user_id: userId,
        amount,
        currency: "AED",
        payment_method: "wallet",
        payment_status: "completed",
        description: "Wallet top-up",
      })
      .select("*")
      .single();
    if (error) return c.json({ error: error.message }, 400);
    return c.json(data, 201);
  } catch (e: any) {
    return c.json({ error: e?.message || "Unexpected error" }, 500);
  }
});

// Start server
Deno.serve(app.fetch);