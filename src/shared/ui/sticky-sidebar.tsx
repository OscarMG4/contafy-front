import type { CSSProperties, ReactNode } from "react";

interface StickySidebarProps {
  children: ReactNode;
  top?: number | string;
  gap?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** Sidebar sticky al estilo document-entry de simple-frontend. */
export function StickySidebar({
  children,
  top = 96,
  gap = 24,
  className,
  style,
}: StickySidebarProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        position: "sticky",
        top,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
