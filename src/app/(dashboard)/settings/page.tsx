"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import {
  useGetClinicInfoQuery,
  useUpdateClinicMutation,
} from "@/store/api/clinicApi";

const settingsSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(10),
  logo: z.string().optional(),
  openingHours: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function SettingsFormSkeleton() {
  return (
    <div className="space-y-4 flex items-center justify-center py-10">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { data: clinic, isLoading, isError, refetch } = useGetClinicInfoQuery();
  const [updateClinic, { isLoading: saving }] = useUpdateClinicMutation();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      logo: "",
      openingHours: "",
    },
  });

  useEffect(() => {
    if (clinic) {
      form.reset({
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        logo: clinic.logo ?? "",
        openingHours: clinic.openingHours ?? "",
      });
    }
  }, [clinic, form]);

  const onSubmit = async (values: SettingsForm) => {
    const toastId = toast.loading("Saving settings...");
    try {
      await updateClinic({
        ...values,
        email: clinic?.email ?? "",
        city: clinic?.city ?? "Lahore",
        openTime: clinic?.openTime,
        closeTime: clinic?.closeTime,
      }).unwrap();
      toast.success("Clinic settings saved", { id: toastId });
    } catch {
      toast.error("Failed to save settings", { id: toastId });
    }
  };

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Settings"
        description="Manage clinic information and preferences"
      />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Clinic Information</CardTitle>
          <CardDescription>
            Update your clinic details shown across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SettingsFormSkeleton />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinic Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="logo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="openingHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Hours</FormLabel>
                    <FormControl><Input placeholder="11:00 - 22:00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
