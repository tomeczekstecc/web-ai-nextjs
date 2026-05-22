"use client";

import { type ComponentProps } from "react";
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

type CopyStatus = "idle" | "copied" | "failed";

type ButtonProps = ComponentProps<typeof Button>;

export type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  resetAfter?: number;
  onCopy?: (value: string, status: Exclude<CopyStatus, "idle">) => void;
  children?: React.ReactNode;
  disabled?: boolean;
} & Omit<
  ButtonProps,
  "children" | "disabled" | "onClick" | "onCopy" | "aria-label"
>;

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Couldn't copy",
  resetAfter,
  onCopy,
  children,
  disabled,
  variant = "ghost",
  size,
  className,
  ...buttonProps
}: CopyButtonProps) {
  const { copy, status } = useCopyToClipboard({ resetAfter });

  const hasChildren = children !== undefined && children !== null;
  const resolvedSize = size ?? (hasChildren ? "sm" : "icon");
  const isDisabled = disabled || value === "";

  const StatusIcon =
    status === "copied" ? CheckIcon : status === "failed" ? XIcon : CopyIcon;

  const announcement =
    status === "copied"
      ? copiedLabel
      : status === "failed"
        ? failedLabel
        : "";

  const tooltipText =
    status === "copied"
      ? copiedLabel
      : status === "failed"
        ? failedLabel
        : label;

  const handleClick = async () => {
    if (isDisabled) return;
    const ok = await copy(value);
    onCopy?.(value, ok ? "copied" : "failed");
  };

  const buttonNode = (
    <Button
      data-slot="copy-button"
      data-state={status}
      variant={variant}
      size={resolvedSize}
      disabled={isDisabled}
      aria-label={label}
      onClick={handleClick}
      className={cn(className)}
      {...buttonProps}
    >
      {hasChildren ? (
        <>
          <span>{children}</span>
          <StatusIcon aria-hidden="true" />
        </>
      ) : (
        <StatusIcon aria-hidden="true" />
      )}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </Button>
  );

  if (hasChildren || isDisabled) {
    return buttonNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={buttonNode} />
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
