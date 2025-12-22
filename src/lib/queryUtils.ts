/**
 * Common utility functions for TanStack Query operations
 * Centralizes query invalidation patterns and success/error handling
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Common query key patterns used throughout the application
 */
export const QUERY_KEYS = {
    modules: (publishedOnly?: boolean) => ['modules', publishedOnly] as const,
    myModules: (userId?: string) => ['my-modules', userId] as const,
    userProgress: (userId?: string) => ['user-progress', userId] as const,
    allProgress: () => ['all-progress'] as const,
    quizzes: (moduleId?: string) => ['quizzes', moduleId] as const,
    quiz: (quizId?: string) => ['quiz', quizId] as const,
    quizQuestions: (quizId?: string) => ['quiz-questions', quizId] as const,
    quizQuestionsSafe: (quizId?: string) => ['quiz-questions-safe', quizId] as const,
    quizAttempts: (userId?: string, quizId?: string) => ['quiz-attempts', userId, quizId] as const,
    myRequests: (userId?: string) => ['my-requests', userId] as const,
    allRequests: (statusFilter?: string) => ['all-requests', statusFilter] as const,
    notifications: (userId?: string) => ['notifications', userId] as const,
    learningNotes: (userId?: string, moduleId?: string) => ['learning-notes', userId, moduleId] as const,
} as const;

/**
 * Invalidate multiple query groups at once
 */
export function invalidateQueries(
    queryClient: QueryClient,
    keys: Array<readonly unknown[]>
): void {
    keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
    });
}

/**
 * Invalidate all module-related queries
 */
export function invalidateModuleQueries(queryClient: QueryClient): void {
    invalidateQueries(queryClient, [
        ['modules'],
        ['my-modules'],
    ]);
}

/**
 * Invalidate all progress-related queries
 */
export function invalidateProgressQueries(
    queryClient: QueryClient,
    userId?: string
): void {
    const keys: Array<readonly unknown[]> = [['all-progress']];
    if (userId) {
        keys.push(['user-progress', userId]);
    }
    invalidateQueries(queryClient, keys);
}

/**
 * Invalidate all request-related queries
 */
export function invalidateRequestQueries(
    queryClient: QueryClient,
    userId?: string
): void {
    const keys: Array<readonly unknown[]> = [['all-requests']];
    if (userId) {
        keys.push(['my-requests', userId]);
    }
    invalidateQueries(queryClient, keys);
}
