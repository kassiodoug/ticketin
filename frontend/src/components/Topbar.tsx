"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export function Topbar() {
  const { user, logout, ready } = useAuth();
  const router = useRouter();

  return (
    <header className='topbar'>
      <Link href='/' className='brand'>
        ★ BILHETERIA
      </Link>
      <nav>
        {ready && !user && <Link href='/login'>Entrar</Link>}
        {user?.role === "CLIENT" && (
          <Link href='/meus-ingressos'>Meus ingressos</Link>
        )}
        {user?.role === "ORGANIZER" && <Link href='/organizador'>Painel</Link>}
        {user?.role === "GATE" && <Link href='/portaria'>Portaria</Link>}
        {user && (
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault();
              logout();
              router.push("/");
            }}
          >
            Sair ({user.name.split(" ")[0]})
          </a>
        )}
      </nav>
    </header>
  );
}
