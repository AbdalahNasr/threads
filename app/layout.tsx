import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThreadContextProvider } from "@/components/ThreadContextProvider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThreadContextProvider>
            {children}
            <Toaster />
          </ThreadContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
