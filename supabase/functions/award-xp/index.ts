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
      return new Response(JSON.stringify({ error: "Authorization required" }), {
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

    // SECURITY IMPLEMENTATION: Atomic check-and-update to prevent race conditions (XP grinding)
    // We only update reward_claimed to true IF it was false AND module is completed
    const { data: updatedProgress, error: updateError } = await supabaseAdmin
        .from("user_progress")
        .update({ reward_claimed: true })
        .eq("user_id", user.id)
        .eq("module_id", module_id)
        .eq("reward_claimed", false)
        // Eligibility: must be completed OR have 100% progress
        .or("is_completed.eq.true,progress_percent.gte.100")
        .select()
        .single();

    if (updateError || !updatedProgress) {
        console.error("Claim eligibility error or already claimed:", updateError);
        return new Response(JSON.stringify({
            error: "Reward already claimed or module not completed yet",
            claimed: true
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Calculate Reward
    // Random between 50 and 150
    const xpReward = Math.floor(Math.random() * (150 - 50 + 1)) + 50;

    // 3. Update Profile XP (Atomic increment using RPC if possible, or careful update)
    let finalXp;
    const { data: xpData, error: xpError } = await supabaseAdmin
        .rpc('increment_user_xp', {
            target_user_id: user.id,
            xp_to_add: xpReward
        });

    if (xpError) {
        console.warn("RPC increment_user_xp failed, falling back to manual update:", xpError);

        // Fallback: Get current XP and update
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("xp")
            .eq("id", user.id)
            .single();

        const currentXp = profile?.xp || 0;
        finalXp = currentXp + xpReward;

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ xp: finalXp })
            .eq("id", user.id);

        if (profileError) {
            console.error("Critical: Failed to update XP after marking claimed:", profileError);
            // Revert reward_claimed to allow retry
            await supabaseAdmin
                .from("user_progress")
                .update({ reward_claimed: false })
                .eq("user_id", user.id)
                .eq("module_id", module_id);

            throw new Error("Failed to update profile XP");
        }
    } else {
        finalXp = xpData;
    }

    return new Response(JSON.stringify({
        success: true,
        xp_gained: xpReward,
        new_total_xp: finalXp
    }), {
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
