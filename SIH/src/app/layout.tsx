import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import { GoogleTranslate } from "@/components/GoogleTranslate";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export const metadata: Metadata = {
  title: "KrishiLink - Strengthening Market Linkages and Price Discovery",
  description: "AI-powered transaction coordination, logistics aggregation, and live mandi intelligence for Indian farmers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <LanguageProvider>
          <UserProvider>
            <Header />
            <main className="flex-grow pb-24">
              {children}
            </main>
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-xs mt-auto">
              <div className="max-w-7xl mx-auto px-4">
                <p>© {new Date().getFullYear()} KrishiLink. Smart India Hackathon 2026 Submission.</p>
                <p className="mt-1 text-slate-400">Powered by Agmarknet Real-time Government Mandi API & Multilingual AI Voice Assistant</p>
              </div>
            </footer>
            <GoogleTranslate />
            <VoiceAssistant />
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
