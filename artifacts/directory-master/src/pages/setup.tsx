import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCompleteSetup, useGetSetupStatus } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const setupSchema = z.object({
  setupToken: z.string().min(1, "Setup token is required"),
  adminName: z.string().min(2, "Name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  siteTitle: z.string().min(2, "Site title is required"),
  homepageHeadline: z.string().optional(),
  homepageDescription: z.string().optional(),
  themeColor: z.string().optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { data: setupStatus, isLoading: statusLoading } = useGetSetupStatus();
  const completeSetup = useCompleteSetup();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const { setToken } = useAuth();

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      setupToken: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      siteTitle: "My Directory",
      homepageHeadline: "Discover the best resources",
      homepageDescription: "A curated collection of resources.",
      themeColor: "#3b82f6",
    },
  });

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  useEffect(() => {
    if (setupStatus?.installed) {
      setLocation("/");
    }
  }, [setupStatus?.installed, setLocation]);

  if (setupStatus?.installed) {
    return null;
  }

  const onSubmit = async (data: SetupFormValues) => {
    try {
      await completeSetup.mutateAsync({ data });
      toast({
        title: "Setup complete",
        description: "Directory Master has been installed successfully.",
      });
      setStep(4); // Success step
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "An error occurred during setup.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Directory Master
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Install your self-hosted directory in minutes.
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                We'll guide you through setting up your admin account and basic site settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Find your <strong>setup token</strong> in the server logs — look for the line labelled{" "}
                  <code className="font-mono text-xs">SETUP TOKEN</code>. You'll need it below to verify you are the legitimate deployer.
                </p>
              </div>
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="setupToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setup Token</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Paste your setup token from the server logs"
                          autoComplete="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={async () => {
                    const valid = await form.trigger(["setupToken"]);
                    if (valid) setStep(2);
                  }}
                >
                  Start Setup <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Account</CardTitle>
                  <CardDescription>
                    Create the primary administrator account for managing the directory.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" onClick={async () => {
                      const valid = await form.trigger(["adminName", "adminEmail", "adminPassword"]);
                      if (valid) setStep(3);
                    }}>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Directory Customization</CardTitle>
                  <CardDescription>
                    Configure how your directory will look to visitors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Title</FormLabel>
                        <FormControl>
                          <Input placeholder="My Directory" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homepageHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Homepage Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="Discover the best resources..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="homepageDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Homepage Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A curated collection..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={completeSetup.isPending}>
                      {completeSetup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Install Directory
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>

        {step === 4 && (
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Installation Complete</CardTitle>
              <CardDescription className="text-base mt-2">
                Your directory is ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3 mt-6">
              <Button className="w-full" onClick={() => setLocation("/admin/login")}>
                Go to Admin Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
                View Public Directory
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
