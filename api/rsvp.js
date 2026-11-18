import { handleSubmit } from "../lib/rsvp.js";

// POST /api/rsvp  { name, pax }
export default async function handler(req, res) {
  const { status, body } = await handleSubmit(req.method, req.body);
  res.status(status).json(body);
}
