import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { NotionToMarkdown } from "./notion-to-md.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pageId, notionApiKey } = await req.json();

    if (!pageId || !notionApiKey) {
      throw new Error("Missing pageId or notionApiKey");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const converter = new NotionToMarkdown(notionApiKey);

    // 1. Fetch Page Properties
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
         headers: {
            "Authorization": `Bearer ${notionApiKey}`,
            "Notion-Version": "2022-06-28",
         }
    });

    if (!pageRes.ok) {
        throw new Error(`Failed to fetch page: ${pageRes.statusText}`);
    }

    const pageData = await pageRes.json();
    const props = pageData.properties;

    // Extract Properties
    const title = props.Name?.title?.[0]?.plain_text || "Untitled";
    const summary = props.Summary?.rich_text?.[0]?.plain_text || "";
    const level = props.Level?.select?.name || "Pemula";

    // Fix: Case Sensitive Category and Multi-select support
    let category = "Umum";
    if (props.Category?.select) {
        category = props.Category.select.name;
    } else if (props.Category?.multi_select) {
        category = props.Category.multi_select.map((c: any) => c.name).join(", ");
    } else if (props.category?.select) { // Fallback to lowercase
        category = props.category.select.name;
    }

    const track = props.Track?.select?.name || "General";

    // New Fields: Slug & Cover
    const slug = props.Slug?.rich_text?.[0]?.plain_text || "";

    let cover = "";
    if (pageData.cover) {
        if (pageData.cover.type === 'external') {
            cover = pageData.cover.external.url;
        } else if (pageData.cover.type === 'file') {
            cover = pageData.cover.file.url;
        }
    }

    // 2. Recursive Fetch & Convert
    const blocks = await converter.getBlocks(pageId);
    const content = converter.toMarkdown(blocks);

    // 3. Upsert into Supabase
    // Check if exists
    const { data: existing } = await supabase
        .from("incoming_contents")
        .select("id")
        .eq("source", "Notion")
        .contains("raw_content", { notion_page_id: pageId })
        .maybeSingle();

    const payload = {
        source: "Notion",
        title,
        summary,
        content,
        level,
        category,
        track,
        // Store extended metadata in raw_content since columns might not exist
        raw_content: {
            notion_page_id: pageId,
            metadata: pageData,
            slug,
            cover
        },
        status: "pending"
    };

    // Try to insert slug/cover if columns exist (Supabase ignores extra fields if properly typed,
    // but here we are using JS client which might error if column missing.
    // We will stick to raw_content for safety unless user confirmed columns exist.
    // However, to satisfy the requirement "include slug & cover fields", we add them to the payload.
    // If the columns don't exist, this might fail.
    // Use `upsert` or `update`/`insert` explicitly.

    let result;

    if (existing) {
        // Update
        const { data, error } = await supabase
            .from("incoming_contents")
            .update(payload)
            .eq("id", existing.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        // Insert
        const { data, error } = await supabase
            .from("incoming_contents")
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        result = data;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
