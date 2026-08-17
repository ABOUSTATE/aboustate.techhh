import { isAuthenticated } from "../_lib/adminAuth.js";

export default function handler(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.status(200).json({ authenticated: true });
}
