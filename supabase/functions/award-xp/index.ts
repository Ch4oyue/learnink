import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const { module_id } = await req.json();

    if (!module_id) {
        throw new Error("Missing module_id");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Service Role for DB operations to ensure security
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check Progress & Claim Status
    const { data: progress, error: progressError } = await supabaseAdmin
        .from("user_progress")
        .select("is_completed, progress_percent, reward_claimed")
        .eq("user_id", user.id)
        .eq("module_id", module_id)
        .single();

    if (progressError || !progress) {
         return new Response(JSON.stringify({ error: "Progress not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (progress.reward_claimed) {
        return new Response(JSON.stringify({ error: "Reward already claimed", claimed: true }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Allow claim if completed OR progress >= 100
    // Sometimes progress calculation might be slightly off (e.g. 99.9), but usually explicit completion is best.
    // We check both for robustness.
    const isEligible = progress.is_completed || (progress.progress_percent ?? 0) >= 100;

    if (!isEligible) {
         return new Response(JSON.stringify({ error: "Module not completed yet" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Calculate Reward
    // Random between 50 and 150
    const xpReward = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

    // 3. Update Transaction (XP + Flag)

    // Update flag first
    const { error: updateError } = await supabaseAdmin
        .from("user_progress")
        .update({ reward_claimed: true })
        .eq("user_id", user.id)
        .eq("module_id", module_id);

    if (updateError) {
        throw updateError;
    }

    // Get current XP
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("xp")
        .eq("id", user.id)
        .single();

    const currentXp = profile?.xp || 0;
    const newXp = currentXp + xpReward;

    // Update XP
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ xp: newXp })
        .eq("id", user.id);

    if (profileError) {
        // If this fails, we have a partial state: reward claimed but XP not given.
        // In a production system, we would revert 'reward_claimed' or use a stored procedure (RPC).
        // For this task, we will log it.
        console.error("Failed to update XP after marking claimed:", profileError);
        // We could try to revert:
        await supabaseAdmin
            .from("user_progress")
            .update({ reward_claimed: false })
            .eq("user_id", user.id)
            .eq("module_id", module_id);

        throw new Error("Failed to update profile XP");
    }

    return new Response(JSON.stringify({ success: true, xp_gained: xpReward }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
