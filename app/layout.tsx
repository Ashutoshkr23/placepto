import type { Metadata } from "next";
import { Nunito, Space_Grotesk } from "next/font/google";
import "./globals.css";
const display=Space_Grotesk({variable:"--font-display",subsets:["latin"]}); const body=Nunito({variable:"--font-body",subsets:["latin"]});
export const metadata:Metadata={title:"Placepto — Learning, But Make It a Game",description:"Placepto makes strong learning foundations feel like fun, interactive challenges for school students.",openGraph:{title:"Placepto — Learning, But Make It a Game",description:"Fun, interactive learning challenges for school students.",type:"website"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>}
