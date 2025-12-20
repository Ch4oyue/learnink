import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Send, CheckCircle, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRequest } from "@/hooks/useMaterialRequests";
import { useNavigate } from "react-router-dom";

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
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

// Categories focused on AI & Automation
const categories = [
  "AI Dasar",
  "Automation",
  "AI Tools",
  "Prompt Engineering",
  "No-Code AI",
  "Chatbot & Assistant",
  "Lainnya",
];

export const RequestSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const createRequest = useCreateRequest();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  const priority = watch("priority");
  const category = watch("category");

  const onSubmit = async (data: RequestFormData) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk mengirim request.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRequest.mutateAsync({
        userId: user.id,
        topic: data.topic,
        description: data.description,
        category: data.category,
        priority: data.priority,
      });

      setIsSubmitted(true);

      // Reset form after showing success
      setTimeout(() => {
        reset();
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  return (
    <section id="request" className="py-24 md:py-32 bg-background">
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
              Kirim request Anda dan tim kami akan membuatkan materi sesuai kebutuhan dengan bantuan AI.
            </p>
          </div>

          {/* Form Card */}
          <div className="card-apple p-8 md:p-10">
            {!user ? (
              // Login prompt
              <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <LogIn className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Login Diperlukan
                </h3>
                <p className="text-muted-foreground mb-6">
                  Silakan login terlebih dahulu untuk mengirim request materi.
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="rounded-xl press-effect"
                >
                  Login Sekarang
                </Button>
              </div>
            ) : isSubmitted ? (
              <div className="text-center py-8 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Terima Kasih!
                </h3>
                <p className="text-muted-foreground">
                  Request Anda telah dikirim. Kami akan memprosesnya dengan AI dan mengirim notifikasi saat selesai.
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
                    className="input-apple"
                    {...register("topic")}
                  />
                  {errors.topic && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.topic.message}
                    </p>
                  )}
                </div>

                {/* Category & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Kategori
                    </label>
                    <Select
                      value={category}
                      onValueChange={(value) => setValue("category", value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Prioritas
                    </label>
                    <Select
                      value={priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setValue("priority", value)
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            Rendah
                          </span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-warning" />
                            Sedang
                          </span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-destructive" />
                            Tinggi
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    className="rounded-xl border-border/60 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || createRequest.isPending}
                  className="w-full h-12 rounded-xl text-base font-medium transition-all duration-300 press-effect"
                >
                  {isSubmitting || createRequest.isPending ? (
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
            Request akan diproses dengan AI dan biasanya selesai dalam 1-2 hari kerja.
          </p>
        </div>
      </div>
    </section>
  );
};
