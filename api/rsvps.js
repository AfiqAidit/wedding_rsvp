import { handleList } from "../lib/rsvp.js";

// GET /api/rsvps  (header: x-admin-passcode)  -> list of responses, for the host only
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { status, body } = await handleList(req.method, req.headers["x-admin-passcode"]);
  res.status(status).json(body);
}
