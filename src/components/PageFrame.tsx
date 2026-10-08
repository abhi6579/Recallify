"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function PageFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex-1">
      {children}
    </div>
  );
}
