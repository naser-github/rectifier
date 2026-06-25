import {
  Provider,
  Root,
  Trigger,
  Portal,
  Content,
  Arrow,
} from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface TooltipProps {
  readonly children: ReactNode;
  readonly content: string;
  readonly side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, side = "top" }: TooltipProps): ReactNode {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <Root delayDuration={400}>
      <Trigger asChild>{children}</Trigger>
      <Portal>
        <Content
          side={side}
          sideOffset={4}
          className={cn(
            "z-50 max-w-60 rounded-sm bg-black px-2.5 py-1 text-xs text-white shadow-sm",
            "data-[state=delayed-open]:animate-in",
          )}
        >
          {content}
          <Arrow className="fill-black" width={8} height={4} />
        </Content>
      </Portal>
    </Root>
  );
}

export function TooltipProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactNode {
  return <Provider>{children}</Provider>;
}
