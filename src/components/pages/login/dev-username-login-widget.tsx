"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import {
  devUsernameLoginSchema,
  type DevUsernameLoginFormValues,
} from "~/schema/login/dev-username-login.schema";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

export function DevUsernameLoginWidget() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const form = useForm<DevUsernameLoginFormValues>({
    resolver: zodResolver(devUsernameLoginSchema),
    defaultValues: {
      username: "",
    },
  });

  async function handleSubmit(values: DevUsernameLoginFormValues) {
    const normalizedUsername = values.username.trim();

    try {
      const result = await signIn("dev-username", {
        username: normalizedUsername,
        redirect: false,
      });

      if (result?.error) {
        form.setError("username", {
          message: "Could not sign in with development username.",
        });
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      form.setError("username", {
        message: "Could not sign in with development username.",
      });
    }
  }

  return (
    <Card className="bg-card text-card-foreground ring-border w-full max-w-md border-0 shadow-none ring-1">
      <CardHeader>
        <CardTitle>Development Login</CardTitle>
        <CardDescription>
          Sign in with an existing username (no password).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Username"
                      autoComplete="username"
                      className="bg-background/60 focus-visible:ring-ring/40"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="h-11"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
