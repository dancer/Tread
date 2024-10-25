import "./globals.css";
import { IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata = {
  title: "Tread - JavaScript Typing Test",
  description: "Test your JavaScript typing speed with Tread",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ThemeProvider>
        <body className={`${ibmPlexMono.variable} font-mono min-h-screen`}>
          {children}
        </body>
      </ThemeProvider>
    </html>
  );
}
