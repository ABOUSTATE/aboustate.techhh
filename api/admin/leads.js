import { isAuthenticated } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const apiKey = process.env.ADMIN_SHEET_API_KEY;

  if (!appsScriptUrl || !apiKey) {
    res.status(500).json({ error: "server_not_configured" });
    return;
  }

  if (req.method === "GET") {
    try {
      const response = await fetch(`${appsScriptUrl}?key=${encodeURIComponent(apiKey)}`);
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(502).json({ error: "upstream_failed" });
    }
    return;
  }

  if (req.method === "PATCH") {
    const { id, status, notes } = req.body || {};
    if (!id) {
      res.status(400).json({ error: "missing_id" });
      return;
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateLead", key: apiKey, id, status, notes }),
      });
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(502).json({ error: "upstream_failed" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
