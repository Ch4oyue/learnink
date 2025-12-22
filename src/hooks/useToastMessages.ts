/**
 * Centralized toast message utilities
 * Provides consistent toast messages across the application
 */

import { useToast } from "@/hooks/use-toast";
import { useCallback, useMemo } from "react";

export interface ToastMessages {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

/**
 * Common toast message presets for CRUD operations
 */
export const TOAST_PRESETS = {
    // Module operations
    moduleCreated: { title: "Berhasil", description: "Modul berhasil dibuat" },
    moduleUpdated: { title: "Berhasil", description: "Modul berhasil diperbarui" },
    moduleDeleted: { title: "Berhasil", description: "Modul berhasil dihapus" },
    moduleError: { title: "Error", description: "Gagal memproses modul" },

    // Progress operations
    progressSaved: { title: "Progress disimpan", description: "Kemajuan belajar Anda telah disimpan" },
    progressError: { title: "Error", description: "Gagal menyimpan progress" },

    // Request operations
    requestSent: { title: "Request terkirim", description: "Request materi Anda telah dikirim untuk ditinjau" },
    requestUpdated: { title: "Berhasil", description: "Request berhasil diperbarui" },
    requestError: { title: "Error", description: "Gagal memproses request" },

    // Quiz operations
    quizCreated: { title: "Sukses", description: "Kuis berhasil dibuat" },
    quizError: { title: "Error", description: "Gagal memproses kuis" },

    // Notes operations
    noteCopied: { title: "Disalin!", description: "Teks berhasil disalin ke clipboard." },
    noteCreated: { title: "Catatan Dibuat!", description: "Teks berhasil disimpan sebagai catatan." },

    // Generic
    genericError: { title: "Error", description: "Terjadi kesalahan. Silakan coba lagi." },
    genericSuccess: { title: "Berhasil", description: "Operasi berhasil dilakukan" },
} as const;

/**
 * Hook for centralized toast message handling
 */
export function useToastMessages(): ToastMessages {
    const { toast } = useToast();

    const success = useCallback(
        (title: string, description?: string) => {
            toast({ title, description });
        },
        [toast]
    );

    const error = useCallback(
        (title: string, description?: string) => {
            toast({ title, description, variant: "destructive" });
        },
        [toast]
    );

    const info = useCallback(
        (title: string, description?: string) => {
            toast({ title, description });
        },
        [toast]
    );

    return useMemo(() => ({ success, error, info }), [success, error, info]);
}

/**
 * Transform authentication error messages to user-friendly Indonesian messages
 */
export function getAuthErrorMessage(errorMessage: string): string {
    if (errorMessage.includes("Invalid login credentials")) {
        return "Email atau password salah";
    }
    if (errorMessage.includes("User already registered")) {
        return "Email sudah terdaftar. Silakan masuk.";
    }
    if (errorMessage.includes("Email not confirmed")) {
        return "Silakan konfirmasi email Anda terlebih dahulu";
    }
    if (errorMessage.includes("Too many requests")) {
        return "Terlalu banyak percobaan. Silakan coba lagi nanti.";
    }
    return "Terjadi kesalahan. Silakan coba lagi.";
}
