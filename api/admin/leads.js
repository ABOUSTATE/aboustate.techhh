import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "server_not_configured" });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) {
        res.status(502).json({ error: "database_read_failed" });
        return;
      }

      res.status(200).json({ leads: data.map(toDashboardShape) });
      return;
    }

    if (req.method === "POST") {
      const {
        type,
        name,
        email,
        phone,
        projectDescription,
        timeline,
        isStudentProject,
        services,
        otherServiceDescription,
        status,
        notes,
        userId,
      } = req.body || {};

      if (!name || !email || (type !== "appointment" && type !== "quotation")) {
        res.status(400).json({ error: "invalid_payload" });
        return;
      }

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          type,
          name,
          email,
          phone: phone || null,
          project_description: projectDescription || null,
          timeline: timeline || null,
          is_student_project: Boolean(isStudentProject),
          services: Array.isArray(services) ? services : [],
          other_service_description: otherServiceDescription || null,
          status: status || "New",
          notes: notes || "",
          user_id: userId || null,
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        res.status(502).json({ error: "database_insert_failed", detail: error.message });
        return;
      }

      res.status(200).json({ ok: true, id: data.id });
      return;
    }

    if (req.method === "PATCH") {
      const { id, status, notes } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "missing_id" });
        return;
      }

      const patch = {};
      if (typeof status === "string") patch.status = status;
      if (typeof notes === "string") patch.notes = notes;

      const { error } = await supabase.from("service_requests").update(patch).eq("id", id);

      if (error) {
        res.status(502).json({ error: "database_update_failed" });
        return;
      }

      res.status(200).json({ status: "ok" });
      return;
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "missing_id" });
        return;
      }

      const { error } = await supabase.from("service_requests").delete().eq("id", id);

      if (error) {
        res.status(502).json({ error: "database_delete_failed" });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/leads crashed:", error);
    res.status(500).json({ error: "unexpected_error" });
  }
}

// Matches the shape the dashboard already expects (originally the Apps
// Script doGet response), so Dashboard.jsx/BoardView.jsx/csv.js need no
// changes for this migration.
function toDashboardShape(row) {
  return {
    ID: row.id,
    UserId: row.user_id,
    Timestamp: row.submitted_at,
    Type: row.type,
    Name: row.name,
    Email: row.email,
    Phone: row.phone,
    "Project Description": row.project_description,
    Timeline: row.timeline,
    "Student Project": row.is_student_project ? "Yes" : "No",
    Services: Array.isArray(row.services) ? row.services.join(", ") : "",
    "Other Service Description": row.other_service_description,
    Status: row.status,
    Notes: row.notes,
  };
}
