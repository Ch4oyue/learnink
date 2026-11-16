import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Quiz, QuizQuestionSafe, QuizAttempt, QuizValidationResult, useValidateQuizAnswers } from "@/hooks/useQuiz";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface QuizPlayerProps {
  quiz: Quiz;
  questions: QuizQuestionSafe[];
  onComplete: (attempt: QuizAttempt) => void;
  onCancel: () => void;
}

export function QuizPlayer({ quiz, questions, onComplete, onCancel }: QuizPlayerProps) {
  const { user } = useAuth();
  const validateQuiz = useValidateQuizAnswers();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_minutes * 60);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizValidationResult["results"] | null>(null);

  // Track start time for anti-cheat
  const startTimeRef = useRef(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSubmit = useCallback(async () => {
    if (validateQuiz.isPending || !user) return;

    try {
      // Calculate time taken in seconds
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

      const result = await validateQuiz.mutateAsync({
        quiz_id: quiz.id,
        answers,
        time_taken: timeTaken,
      });

      setResults(result.results);
      setShowResults(true);
      onComplete(result.attempt);
    } catch (error) {
      logger.error("Error submitting quiz:", error);
    }
  }, [validateQuiz, user, quiz.id, answers, onComplete]);

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Timer
  useEffect(() => {
    if (showResults) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };


  if (showResults && results) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div
            className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
              results.passed ? "bg-green-500/10" : "bg-destructive/10"
            }`}
          >
            {results.passed ? (
              <Check className="h-8 w-8 text-green-500" />
            ) : (
              <X className="h-8 w-8 text-destructive-text" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.passed ? "Congratulations! You Passed!" : "Not Passed Yet"}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {results.passed
              ? "You have completed this quiz well"
              : `The minimum passing score is ${quiz.passing_score}%`}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="text-center p-6 rounded-xl bg-muted/50">
            <div className="text-5xl font-bold mb-2">{results.percentage}%</div>
            <p className="text-muted-foreground">
              {results.score} / {results.totalPoints} points
            </p>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Answers</h3>
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`p-4 rounded-lg border ${
                  results.correctAnswers[q.id]
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      results.correctAnswers[q.id] ? "bg-green-500" : "bg-destructive"
                    }`}
                  >
                    {results.correctAnswers[q.id] ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : (
                      <X className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {i + 1}. {q.question_text}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your answer: {answers[q.id] || "(not answered)"}
                    </p>
                    {!results.correctAnswers[q.id] && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: {results.correctAnswerValues[q.id]}
                      </p>
                    )}
                    {results.explanations[q.id] && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {results.explanations[q.id]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={onCancel} className="w-full">
            Back to Modules
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">{quiz.title}</Badge>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              timeLeft < 60 ? "bg-destructive/10 text-destructive-text" : "bg-muted"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
        <p className="text-sm text-muted-foreground mt-2">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {currentQuestion.question_type === "multiple_choice"
                ? "Multiple Choice"
                : currentQuestion.question_type === "true_false"
                ? "True/False"
                : "Short Answer"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {currentQuestion.points} points
            </Badge>
          </div>
          <h2 className="text-lg font-medium">{currentQuestion.question_text}</h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.question_type === "multiple_choice" &&
            currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

          {currentQuestion.question_type === "true_false" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {["Benar", "Salah"].map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option.toLowerCase()} id={`option-${option}`} />
                  <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                    {option === "Benar" ? "True" : "False"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.question_type === "fill_blank" && (
            <Input
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer..."
            />
          )}
        </div>

        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground"
                  : answers[q.id]
                  ? "bg-green-500/20 text-green-600"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={validateQuiz.isPending}
              className="gap-2"
            >
              {validateQuiz.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Finish
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Unanswered Warning */}
        {Object.keys(answers).length < questions.length && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              {questions.length - Object.keys(answers).length} questions unanswered
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
