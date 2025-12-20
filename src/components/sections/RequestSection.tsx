import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send, CheckCircle } from "lucide-react";

const requestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, { message: "Topik minimal 3 karakter" })
    .max(100, { message: "Topik maksimal 100 karakter" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Deskripsi minimal 10 karakter" })
    .max(500, { message: "Deskripsi maksimal 500 karakter" }),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const RequestSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = async (data: RequestFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitted(true);
    toast({
      title: "Request Terkirim!",
      description: "Kami akan segera meninjau permintaan materi Anda.",
    });

    // Reset form after showing success
    setTimeout(() => {
      reset();
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Request Materi
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
              Butuh Materi Khusus?
            </h2>
            <p className="text-muted-foreground text-lg">
              Kirim request Anda dan tim kami akan membuatkan materi sesuai kebutuhan.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl p-8 md:p-10 shadow-soft border border-border/50">
            {isSubmitted ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Terima Kasih!
                </h3>
                <p className="text-muted-foreground">
                  Request Anda telah kami terima. Kami akan menghubungi Anda segera.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Topic Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="topic"
                    className="block text-sm font-medium text-foreground"
                  >
                    Topik yang Ingin Dipelajari
                  </label>
                  <Input
                    id="topic"
                    placeholder="Contoh: Automasi Email dengan AI"
                    className="h-12 rounded-xl border-border/60 bg-background focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    {...register("topic")}
                  />
                  {errors.topic && (
                    <p className="text-sm text-destructive">{errors.topic.message}</p>
                  )}
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-foreground"
                  >
                    Deskripsi Tujuan Belajar
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan apa yang ingin Anda capai dengan mempelajari topik ini..."
                    rows={5}
                    className="rounded-xl border-border/60 bg-background focus:border-primary focus:ring-primary/20 transition-all duration-200 resize-none"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl text-base font-medium transition-all duration-300"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Mengirim...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Kirim Request
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Biasanya kami merespons dalam 1-2 hari kerja.
          </p>
        </div>
      </div>
    </section>
  );
};
