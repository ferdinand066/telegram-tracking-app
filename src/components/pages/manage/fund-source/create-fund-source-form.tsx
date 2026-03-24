"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createFundSourceAction } from "~/app/manage/fund-source/actions";
import ActionConfirmButton from "~/components/pages/manage/shared/action-confirm-button";
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
import { Textarea } from "~/components/ui/textarea";
import {
  createFundSourceSchema,
  type CreateFundSourceFormValues,
} from "~/schema/manage/fund-source.schema";

const CreateFundSourceForm = ({ userId }: Readonly<{ userId: number }>) => {
  const router = useRouter();
  const form = useForm<CreateFundSourceFormValues>({
    resolver: zodResolver(createFundSourceSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: CreateFundSourceFormValues) {
    try {
      await createFundSourceAction(userId, values);
      form.reset();
      router.refresh();
    } catch {
      form.setError("name", { message: "Failed to create fund source." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Fund Source</CardTitle>
        <CardDescription>
          Add a new fund source. Delete is disabled by design.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="e.g. BCA Savings"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Main emergency cash"
                      disabled={form.formState.isSubmitting}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ActionConfirmButton
              type="button"
              className="w-full"
              disabled={form.formState.isSubmitting}
              confirmationTitle="Create fund source?"
              confirmationDescription="You are about to create a new fund source."
              onConfirmAction={() => void form.handleSubmit(onSubmit)()}
            >
              {form.formState.isSubmitting
                ? "Creating..."
                : "Create fund source"}
            </ActionConfirmButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateFundSourceForm;
