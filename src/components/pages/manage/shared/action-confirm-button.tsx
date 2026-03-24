"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

type ActionConfirmButtonProps = React.ComponentProps<typeof Button> & {
  confirmationTitle: string;
  confirmationDescription: string;
  onConfirmAction: () => void;
};

const ActionConfirmButton = ({
  confirmationTitle,
  confirmationDescription,
  onConfirmAction,
  children,
  ...props
}: Readonly<ActionConfirmButtonProps>) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...props}>{children}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmationDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmAction}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActionConfirmButton;
