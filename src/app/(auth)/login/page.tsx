"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLoginMutation } from "@/store/api/authApi";
import { setCredentials } from "@/store/authSlice";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRouteForRole } from "@/lib/navigation";
import {
  buildUserFromLogin,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isHydrated, role } = useAuth();
  const [login, { isLoading }] = useLoginMutation();
  const handleToggle = () => {
    setVisible(!visible);
  }
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !role) return;

    const destination = getDefaultRouteForRole(role);
    if (destination) {
      router.replace(destination);
    }
  }, [isHydrated, isAuthenticated, role, router]);

  const onSubmit = async (values: LoginForm) => {
    const toastId = toast.loading("Logging in...");
    try {
      const result = await login(values).unwrap();

      if (!result.token) {
        toast.error("Login response did not include a token", { id: toastId });
        return;
      }

      const user = buildUserFromLogin(result.token, result);
      if (!user) {
        localStorage.removeItem("token");
        toast.error(
          "Login succeeded but your role could not be read. Check API role field.",
          { id: toastId }
        );
        return;
      }

      localStorage.setItem("token", result.token);
      dispatch(setCredentials({ token: result.token, user }));
      toast.success("Welcome back!", { id: toastId });

      const destination = getDefaultRouteForRole(user.role);
      if (!destination) {
        toast.error("No page configured for your role", { id: toastId });
        return;
      }

      router.replace(destination);
    } catch {
      toast.error("Invalid email or password", { id: toastId });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Activity className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">ClinicOS</CardTitle>
            <CardDescription className="mt-1">
              Sign in to your clinic management portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@clinic.pk"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={visible ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleToggle}
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent transition-all duration-200"
                        >
                          <div className="transition-transform duration-200 hover:scale-110">
                            {visible ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
