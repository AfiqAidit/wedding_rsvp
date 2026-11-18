import { handleWishes } from "../lib/rsvp.js";

// GET /api/wishes -> public list of guest wishes (name + message) for the "Ucapan" section
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { status, body } = await handleWishes(req.method);
  res.status(status).json(body);
}
