import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moduleId, questionCount = 5 } = await req.json();

    if (!moduleId) {
      return new Response(
        JSON.stringify({ error: "Module ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get module content
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      console.error("Module fetch error:", moduleError);
      return new Response(
        JSON.stringify({ error: "Module not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating quiz for module: ${module.title}`);

    // Generate quiz using Gemini
    const prompt = `Berdasarkan materi pembelajaran berikut, buat ${questionCount} soal kuis dalam format JSON.

JUDUL: ${module.title}
RINGKASAN: ${module.summary || ""}
KONTEN:
${module.content || ""}

Buat soal dengan kombinasi tipe:
- multiple_choice (pilihan ganda dengan 4 opsi)
- true_false (benar/salah)
- fill_blank (isian singkat)

Format JSON yang diharapkan:
{
  "title": "Kuis: [Judul Modul]",
  "description": "Kuis untuk menguji pemahaman materi",
  "questions": [
    {
      "question_text": "Pertanyaan lengkap di sini",
      "question_type": "multiple_choice",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correct_answer": "Opsi A",
      "explanation": "Penjelasan mengapa jawaban ini benar",
      "points": 10
    },
    {
      "question_text": "Pernyataan untuk benar/salah",
      "question_type": "true_false",
      "options": null,
      "correct_answer": "benar",
      "explanation": "Penjelasan",
      "points": 10
    },
    {
      "question_text": "Pertanyaan isian: ... adalah ...",
      "question_type": "fill_blank",
      "options": null,
      "correct_answer": "jawaban singkat",
      "explanation": "Penjelasan",
      "points": 10
    }
  ]
}

PENTING:
- Gunakan bahasa Indonesia yang baik dan benar
- Soal harus relevan dengan materi
- Pastikan jawaban benar akurat
- Untuk true_false, correct_answer harus "benar" atau "salah" (huruf kecil)
- Berikan penjelasan yang edukatif
- Hanya kembalikan JSON tanpa teks lain`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate quiz content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error("No content generated");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response
    let quizData;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, generatedText);
      return new Response(
        JSON.stringify({ error: "Failed to parse quiz data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        module_id: moduleId,
        title: quizData.title || `Kuis: ${module.title}`,
        description: quizData.description || "Kuis untuk menguji pemahaman materi",
        time_limit_minutes: 15,
        passing_score: 70,
        created_by: userId,
      })
      .select()
      .single();

    if (quizError) {
      console.error("Quiz insert error:", quizError);
      return new Response(
        JSON.stringify({ error: "Failed to create quiz" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Quiz created with ID: ${quiz.id}`);

    // Create questions
    const questions = quizData.questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points || 10,
      order_index: index,
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questions);

    if (questionsError) {
      console.error("Questions insert error:", questionsError);
      // Delete the quiz if questions failed
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      return new Response(
        JSON.stringify({ error: "Failed to create quiz questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created ${questions.length} questions for quiz`);

    return new Response(
      JSON.stringify({
        success: true,
        quiz: {
          ...quiz,
          questions_count: questions.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate quiz error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
