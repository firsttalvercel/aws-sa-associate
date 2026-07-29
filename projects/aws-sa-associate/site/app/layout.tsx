import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard, Zap, Monitor, BookOpen, List, AlertTriangle, FileText, Headphones } from "lucide-react";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AWS SAA-C03 Practice",
  description: "AWS Solutions Architect Associate exam practice",
};

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quiz", label: "Quick Test", icon: Zap },
  { href: "/sim", label: "Sim Exam", icon: Monitor },
  { href: "/topics", label: "Topics", icon: BookOpen },
  { href: "/scenarios", label: "Scenarios", icon: List },
  { href: "/mistakes", label: "Mistakes", icon: AlertTriangle },
  { href: "/cheatsheet", label: "Cheat Sheet", icon: FileText },
  { href: "/podcast", label: "Podcast", icon: Headphones },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} bg-gray-50 min-h-screen`} suppressHydrationWarning>
        <div className="flex min-h-screen">
          <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
            <div className="px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AWS</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">SAA-C03</div>
                  <div className="text-xs text-gray-500">Practice</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="text-xs text-gray-400">SAA-C03 · 720/1000 to pass</div>
            </div>
          </aside>
          <main className="flex-1 ml-56 p-8">
            <div className="max-w-3xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
