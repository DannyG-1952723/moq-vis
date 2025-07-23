import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { FilesProvider } from "@/contexts/FilesContext";
import { ConnectionProvider } from "@/contexts/ConnectionsContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "moq-vis: Media over QUIC Visualizations",
    description: "Tools to visualize Media over QUIC (MoQ) qlog traces",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
                <Header />
                <FilesProvider>
                    <ConnectionProvider>
                        <div className="max-w-screen-xl mx-auto p-4">{children}</div>
                    </ConnectionProvider>
                </FilesProvider>
            </body>
        </html>
    );
}
