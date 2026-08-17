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

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (req.method === "GET") {
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });
      if (listError) {
        res.status(502).json({ error: "list_users_failed", detail: listError.message });
        return;
      }

      const { data: counts, error: countsError } = await supabase
        .from("service_requests")
        .select("user_id")
        .not("user_id", "is", null);

      const requestCounts = {};
      if (!countsError) {
        for (const row of counts) {
          requestCounts[row.user_id] = (requestCounts[row.user_id] || 0) + 1;
        }
      }

      const users = userList.users.map((u) => ({
        id: u.id,
        email: u.email,
        provider: u.app_metadata?.provider || "email",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        emailConfirmedAt: u.email_confirmed_at,
        bannedUntil: u.banned_until || null,
        requestCount: requestCounts[u.id] || 0,
      }));

      res.status(200).json({ users });
      return;
    }

    if (req.method === "POST") {
      const { action, userId, email, password } = req.body || {};

      if (action === "create") {
        if (!email || !password) {
          res.status(400).json({ error: "missing_email_or_password" });
          return;
        }
        const { error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) {
          res.status(502).json({ error: "create_failed", detail: error.message });
          return;
        }
        res.status(200).json({ ok: true });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: "missing_user_id" });
        return;
      }

      if (action === "ban") {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "876000h", // ~100 years — effectively permanent until unbanned
        });
        if (error) {
          res.status(502).json({ error: "ban_failed", detail: error.message });
          return;
        }
      } else if (action === "unban") {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) {
          res.status(502).json({ error: "unban_failed", detail: error.message });
          return;
        }
      } else if (action === "confirmEmail") {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (error) {
          res.status(502).json({ error: "confirm_failed", detail: error.message });
          return;
        }
      } else if (action === "sendPasswordReset") {
        const { data: userData, error: getError } = await supabase.auth.admin.getUserById(userId);
        if (getError || !userData?.user?.email) {
          res.status(502).json({ error: "user_lookup_failed" });
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email);
        if (error) {
          res.status(502).json({ error: "reset_failed", detail: error.message });
          return;
        }
      } else if (action === "delete") {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          res.status(502).json({ error: "delete_failed", detail: error.message });
          return;
        }
      } else {
        res.status(400).json({ error: "unknown_action" });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/users crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}
