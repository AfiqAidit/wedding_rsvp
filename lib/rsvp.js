// Shared logic: validation, storage, and the request handlers.
// Used by the Vercel functions in /api and by dev-server.mjs, so local and production behave the same.

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";

export const MAX_PAX = Number(process.env.MAX_PAX || 10);
export const MAX_MESSAGE = 300;

const LOCAL_FILE = path.join(process.cwd(), ".data", "rsvps.json");

/* ------------------------------ validation ------------------------------ */

export function validate(body) {
  if (!body || typeof body !== "object") return { error: "invalid" };
  // Honeypot: real guests never see or fill this field.
  if (body.website) return { spam: true };

  const name = String(body.name ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 80) return { error: "name" };

  if (typeof body.attending !== "boolean") return { error: "attending" };
  const attending = body.attending;

  let pax = 0;
  if (attending) {
    pax = Number(body.pax);
    if (!Number.isInteger(pax) || pax < 1 || pax > MAX_PAX) return { error: "pax" };
  }

  const message = String(body.message ?? "").replace(/\s+/g, " ").trim();
  if (message.length > MAX_MESSAGE) return { error: "message" };

  return { name, attending, pax, message };
}

/* -------------------------------- storage ------------------------------- */

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  const headers = { apikey: key, "Content-Type": "application/json" };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys do not.
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  return { url, headers };
}

async function readLocal() {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveRsvp({ name, attending, pax, message }) {
  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/rest/v1/rsvps`, {
      method: "POST",
      headers: { ...sb.headers, Prefer: "return=minimal" },
      body: JSON.stringify({ name, attending, pax, message: message || null }),
    });
    if (!res.ok) throw new Error(`Supabase insert failed (${res.status})`);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_KEY are not set on this deployment");
  }
  // Local dev fallback: a JSON file in .data/ (git-ignored).
  const all = await readLocal();
  all.push({
    id: all.length + 1,
    name,
    attending,
    pax,
    message: message || null,
    created_at: new Date().toISOString(),
  });
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(all, null, 2));
}

export async function listRsvps() {
  const sb = supabase();
  if (sb) {
    const res = await fetch(
      `${sb.url}/rest/v1/rsvps?select=id,name,attending,pax,message,created_at&order=created_at.desc&limit=1000`,
      { headers: sb.headers },
    );
    if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
    return res.json();
  }
  return (await readLocal()).reverse().map((r) => ({ attending: true, message: null, ...r }));
}

/** Public wishes for the "Ucapan" section: name + message only, newest first. */
export async function listWishes(limit = 30) {
  const sb = supabase();
  let rows;
  if (sb) {
    const res = await fetch(
      `${sb.url}/rest/v1/rsvps?select=name,message,created_at&order=created_at.desc&limit=200`,
      { headers: sb.headers },
    );
    if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
    rows = await res.json();
  } else {
    rows = (await readLocal()).reverse();
  }
  return rows
    .filter((r) => r.message)
    .slice(0, limit)
    .map(({ name, message, created_at }) => ({ name, message, created_at }));
}

/* -------------------------------- handlers ------------------------------ */
// Each returns { status, body } so any server (Vercel, dev-server) can send it.

export async function handleSubmit(method, body) {
  if (method !== "POST") return { status: 405, body: { error: "method" } };
  const v = validate(body);
  if (v.spam) return { status: 200, body: { ok: true } }; // pretend success, store nothing
  if (v.error) return { status: 400, body: { error: v.error } };
  try {
    await saveRsvp(v);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error("RSVP save failed:", err.message);
    return { status: 500, body: { error: "server" } };
  }
}

export async function handleWishes(method) {
  if (method !== "GET") return { status: 405, body: { error: "method" } };
  try {
    return { status: 200, body: { wishes: await listWishes() } };
  } catch (err) {
    console.error("Wishes read failed:", err.message);
    return { status: 500, body: { error: "server" } };
  }
}

function passcodeOk(given) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected || typeof given !== "string") return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function handleList(method, passcode) {
  if (method !== "GET") return { status: 405, body: { error: "method" } };
  if (!process.env.ADMIN_PASSCODE) return { status: 503, body: { error: "not_configured" } };
  if (!passcodeOk(passcode)) return { status: 401, body: { error: "passcode" } };
  try {
    return { status: 200, body: { rsvps: await listRsvps() } };
  } catch (err) {
    console.error("RSVP list failed:", err.message);
    return { status: 500, body: { error: "server" } };
  }
}
