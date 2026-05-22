import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/ui/themes'
import type { Appearance } from "@clerk/ui";
import { Toaster } from "@/components/ui/sonner"


const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})


const clerkAppearanceObject = {
  cssLayerName: "clerk",
  variables: {colorBackground: "#343434", colorModalBackdrop: "#0e0e10" },

  elements: {
    socialButtonsBlockButton:
      "bg-white border-gray-200 hover:bg-transparent hover:border-black text-gray-600 hover:text-black",
    socialButtonsBlockButtonText: "font-semibold",
    formButtonReset:
      "bg-white border border-solid border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
    membersPageInviteButton:
      "bg-black border border-black border-solid hover:bg-white hover:text-black",
    card: "bg-[#36454F] border border-white/[0.08] shadow-2xl shadow-black/60",
  },
} satisfies Appearance;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body className="h-full">
        <ClerkProvider appearance={clerkAppearanceObject}>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors/>
        </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
