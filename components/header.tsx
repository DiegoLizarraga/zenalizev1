"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3 } from "lucide-react"
import { StatusIndicator } from "./status-indicator"
import { DbStatusIndicator } from "./db-status-indicator"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Sueño", href: "/sueno" },
  { name: "Historial", href: "/historial" },
]

interface HeaderProps {
  isOnline?: boolean
  lastUpdate?: string
}

export function Header({ isOnline = true, lastUpdate = "hace 30 seg" }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-bg-primary shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-text-light">Zenalyze</span>
          </Link>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-text-light hover:bg-slate-800"
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Estado de conexión */}
          <div className="flex items-center gap-4">
            <DbStatusIndicator className="text-text-light" />
            <StatusIndicator
              isOnline={isOnline}
              lastUpdate={lastUpdate}
              className="text-text-light"
            />
          </div>
        </div>

        {/* Navegación móvil */}
        <nav className="md:hidden mt-4 flex space-x-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-sm font-medium text-center transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-light hover:bg-slate-800"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
