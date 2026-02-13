"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import * as React from "react";

import { cn } from "@/lib/utils";

interface IconSwitchProps extends SwitchPrimitive.Root.Props {
  /**
   * Icon rendered on the left side of the track (visible when unchecked).
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon rendered on the right side of the track (visible when checked).
   */
  rightIcon?: React.ReactNode;
  /**
   * Icon rendered inside the thumb circle itself.
   * Receives `checked` state for conditional styling.
   */
  thumbIcon?: React.ReactNode | ((checked: boolean) => React.ReactNode);
  /**
   * Size variant of the switch.
   * - `sm`: 36 x 20 with a 16px thumb
   * - `default`: 44 x 24 with a 20px thumb
   * - `lg`: 56 x 30 with a 26px thumb
   */
  size?: "sm" | "default" | "lg";
}

const sizeConfig = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "data-[checked]:translate-x-4",
    iconSize: "h-3 w-3",
    trackIconSize: "h-2.5 w-2.5",
    leftIconOffset: "right-1",
    rightIconOffset: "left-1",
  },
  default: {
    track: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "data-[checked]:translate-x-5",
    iconSize: "h-3.5 w-3.5",
    trackIconSize: "h-3 w-3",
    leftIconOffset: "right-1.5",
    rightIconOffset: "left-1.5",
  },
  lg: {
    track: "h-[30px] w-14",
    thumb: "h-[26px] w-[26px]",
    translate: "data-[checked]:translate-x-6",
    iconSize: "h-4 w-4",
    trackIconSize: "h-3.5 w-3.5",
    leftIconOffset: "right-1.5",
    rightIconOffset: "left-1.5",
  },
};

function IconSwitch({
  className,
  leftIcon,
  rightIcon,
  thumbIcon,
  size = "default",
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: IconSwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? false,
  );

  // Support both controlled and uncontrolled usage
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleCheckedChange = React.useCallback(
    (value: boolean, eventDetails: SwitchPrimitive.Root.ChangeEventDetails) => {
      if (!isControlled) {
        setInternalChecked(value);
      }
      onCheckedChange?.(value, eventDetails);
    },
    [isControlled, onCheckedChange],
  );

  const config = sizeConfig[size];

  const resolvedThumbIcon =
    typeof thumbIcon === "function" ? thumbIcon(isChecked) : thumbIcon;

  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer group relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-unchecked:bg-input",
        config.track,
        className,
      )}
      checked={isChecked}
      onCheckedChange={handleCheckedChange}
      {...props}
    >
      {/* Left icon — visible when switch is OFF (unchecked), sits on the right side of the track */}
      {leftIcon && (
        <span
          className={cn(
            "pointer-events-none absolute flex items-center justify-center text-muted-foreground transition-opacity duration-200",
            config.trackIconSize,
            config.leftIconOffset,
            isChecked ? "opacity-0" : "opacity-70",
          )}
          aria-hidden="true"
        >
          {leftIcon}
        </span>
      )}

      {/* Right icon — visible when switch is ON (checked), sits on the left side of the track */}
      {rightIcon && (
        <span
          className={cn(
            "pointer-events-none absolute flex items-center justify-center text-primary-foreground transition-opacity duration-200",
            config.trackIconSize,
            config.rightIconOffset,
            isChecked ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        >
          {rightIcon}
        </span>
      )}

      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none flex items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform data-unchecked:translate-x-0",
          config.thumb,
          config.translate,
        )}
      >
        {/* Thumb icon — rendered centered inside the sliding circle */}
        {resolvedThumbIcon && (
          <span
            className={cn(
              "flex items-center justify-center text-muted-foreground",
              config.iconSize,
            )}
            aria-hidden="true"
          >
            {resolvedThumbIcon}
          </span>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { IconSwitch };
export type { IconSwitchProps };
