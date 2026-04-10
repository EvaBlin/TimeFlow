import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthHeader } from "@/components/auth/AuthHeader";

export const metadata: Metadata = {
  title: "TimeFlow",
  description: "Персонализированная платформа тайм-менеджмента"
};

export default function RootLayout(props: { children: ReactNode }): JSX.Element {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background text-textMain">
        <AuthHeader />
        {props.children}
      </body>
    </html>
  );
}

