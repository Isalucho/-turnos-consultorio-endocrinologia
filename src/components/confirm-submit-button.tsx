"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button> & { confirmMessage: string };

export function ConfirmSubmitButton({ confirmMessage, onClick, ...props }: Props) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}
