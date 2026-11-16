import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsFor, preflight } from "../_shared/cors.ts";
import { requireRole } from "../_shared/auth.ts";

interface ValidateRequest {
  quiz_id: string;
  answers: Record<string, string>;
  time_taken: number;
}

serve(async (req) => {
  const corsHeaders = corsFor(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Any signed-in user may submit their own quiz answers.
    const guard = await requireRole(req, null, corsHeaders);
    if (!guard.ok) return guard.response;
    const userId = guard.userId;

    const { quiz_id, answers, time_taken }: ValidateRequest = await req.json();
    console.log(`Validating quiz ${quiz_id} for user ${userId}`);

    if (!quiz_id || !answers) {
      return new Response(
        JSON.stringify({ error: 'quiz_id and answers are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch quiz details
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, modules!inner(is_published)')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) {
      console.error('Quiz fetch error:', quizError);
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch questions with correct answers (server-side only)
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, correct_answer, explanation, points')
      .eq('quiz_id', quiz_id);

    if (questionsError || !questions) {
      console.error('Questions fetch error:', questionsError);
      return new Response(
        JSON.stringify({ error: 'Questions not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anti-cheat: Check time taken
    // Must spend at least 2 seconds per question
    const MIN_SECONDS_PER_QUESTION = 2;
    const minRequiredTime = questions.length * MIN_SECONDS_PER_QUESTION;

    // Check if time_taken is provided and valid (allow 0 for very short quizzes if strictly logic, but realistically > 0)
    // We treat missing time_taken (undefined) as failure if we want to enforce it.
    if (typeof time_taken !== 'number' || time_taken < minRequiredTime) {
      console.warn(`Suspicious activity: User ${userId} completed quiz ${quiz_id} in ${time_taken}s (min required: ${minRequiredTime}s)`);
      return new Response(
        JSON.stringify({ error: 'Suspicious activity: Quiz completed too quickly. Please take your time to read the questions.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;
    const correctAnswers: Record<string, boolean> = {};
    const explanations: Record<string, string | null> = {};
    const correctAnswerValues: Record<string, string> = {};

    for (const question of questions) {
      totalPoints += question.points || 10;
      const userAnswer = (answers[question.id] || '').toLowerCase().trim();
      const correctAnswer = (question.correct_answer || '').toLowerCase().trim();

      const isCorrect = userAnswer === correctAnswer;
      correctAnswers[question.id] = isCorrect;
      explanations[question.id] = question.explanation;
      correctAnswerValues[question.id] = question.correct_answer;

      if (isCorrect) {
        score += question.points || 10;
      }
    }

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= (quiz.passing_score || 70);

    console.log(`Quiz results: ${score}/${totalPoints} (${percentage}%) - ${passed ? 'PASSED' : 'FAILED'}`);

    // Save attempt to database
    const { data: attempt, error: attemptError } = await supabase
      .from('user_quiz_attempts')
      .insert({
        user_id: userId,
        quiz_id,
        score,
        total_points: totalPoints,
        percentage,
        passed,
        answers,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error saving attempt:', attemptError);
      return new Response(
        JSON.stringify({ error: 'Failed to save quiz attempt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        attempt,
        results: {
          score,
          totalPoints,
          percentage,
          passed,
          correctAnswers,
          // SECURITY: Only show correct answers and explanations if passed
          // This prevents users from farming answers by failing repeatedly
          explanations: passed ? explanations : {},
          correctAnswerValues: passed ? correctAnswerValues : {},
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
