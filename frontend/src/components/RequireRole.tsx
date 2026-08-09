"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role, useAuth } from "../context/AuthContext";

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace("/");
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) return null;
  return <>{children}</>;
}
