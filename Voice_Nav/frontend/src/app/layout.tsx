import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { Navbar } from "../components/Navbar";
import { VoiceAssistant } from "../components/VoiceAssistant";
import { GoogleTranslate } from "../components/GoogleTranslate";

export const metadata: Metadata = {
  title: "VoiceNav AI - Multilingual AI Voice Navigation",
  description: "AI-driven virtual voice assistant for web navigation across multiple languages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GoogleTranslate />
        <LanguageProvider>
          <Navbar />
          <main>{children}</main>
          <VoiceAssistant />
        </LanguageProvider>
      </body>
    </html>
  );
}

