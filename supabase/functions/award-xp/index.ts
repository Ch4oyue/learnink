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

    // Use Service Role for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Detect APK status
    const userAgent = req.headers.get("user-agent") || "";
    const isApk = userAgent.includes("LearnInk-APK"); // Targeted detection for official APK

    // 2. Fetch System Settings & User Profile
    const [settingsRes, profileRes, progressRes] = await Promise.all([
        supabaseAdmin.from("system_settings").select("key, value"),
        supabaseAdmin.from("profiles").select("xp, points, labels, is_premium").eq("id", user.id).single(),
        supabaseAdmin.from("user_progress").select("is_completed, progress_percent, reward_claimed").eq("user_id", user.id).eq("module_id", module_id).single()
    ]);

    if (progressRes.error || !progressRes.data) {
         return new Response(JSON.stringify({ error: "Progress not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (progressRes.data.reward_claimed) {
        return new Response(JSON.stringify({ error: "Reward already claimed", claimed: true }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const isEligible = progressRes.data.is_completed || (progressRes.data.progress_percent ?? 0) >= 100;
    if (!isEligible) {
         return new Response(JSON.stringify({ error: "Module not completed yet" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const settings = (settingsRes.data || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, unknown>);

    const profile = profileRes.data;
    const globalMultiplier = parseFloat(settings.global_xp_multiplier || "1.0");
    const apkBonus = parseFloat(settings.apk_base_bonus || "0.0");

    // 3. Calculate Multipliers
    let combinedMultiplier = globalMultiplier;

    // APK Bonus
    if (isApk) {
        combinedMultiplier += apkBonus;
    }

    // Premium Multiplier (1.5x)
    if (profile?.is_premium) {
        combinedMultiplier *= 1.5;
    }

    // Label Multipliers
    const userLabels = profile?.labels || [];
    if (userLabels.length > 0) {
        const { data: labelConfigs } = await supabaseAdmin
            .from("label_configs")
            .select("multiplier")
            .in("id", userLabels)
            .eq("is_active", true);

        if (labelConfigs && labelConfigs.length > 0) {
            // Apply the highest multiplier found in labels
            const maxLabelMultiplier = Math.max(...labelConfigs.map(l => parseFloat(l.multiplier as unknown as string)));
            combinedMultiplier *= maxLabelMultiplier;
        }
    }

    // 4. Calculate Final Reward
    const baseReward = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
    const xpReward = Math.floor(baseReward * combinedMultiplier);
    const pointsReward = Math.floor(xpReward * 0.1); // 10% of XP becomes InkPoints

    // 5. Update Database
    // Mark as claimed
    const { error: updateError } = await supabaseAdmin
        .from("user_progress")
        .update({ reward_claimed: true })
        .eq("user_id", user.id)
        .eq("module_id", module_id);

    if (updateError) throw updateError;

    // Update Profile (XP + Points)
    const newXp = (profile?.xp || 0) + xpReward;
    const newPoints = (profile?.points || 0) + pointsReward;

    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ xp: newXp, points: newPoints })
        .eq("id", user.id);

    if (profileError) {
        // Revert claim flag if possible
        await supabaseAdmin
            .from("user_progress")
            .update({ reward_claimed: false })
            .eq("user_id", user.id)
            .eq("module_id", module_id);
        throw new Error("Failed to update profile data");
    }

    return new Response(JSON.stringify({
        success: true,
        xp_gained: xpReward,
        points_gained: pointsReward,
        multipliers: {
            global: globalMultiplier,
            apk: isApk ? (1 + apkBonus) : 1,
            labels: combinedMultiplier / (globalMultiplier * (isApk ? (1 + apkBonus) : 1))
        }
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
