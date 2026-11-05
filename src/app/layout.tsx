import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { PlayerProvider } from "@/components/PlayerProvider";
import PlayerBar from "@/components/PlayerBar";

export const metadata: Metadata = {
  title: "KAIRO'S HOUSEPARTY — The aux, handled.",
  description:
    "Tell KAIRO'S HOUSEPARTY the room and it plays the set: Hindi and Punjabi party songs that drop straight into the hook, mixed with a crossfade so there's never a dead moment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <Nav />
          <main>{children}</main>
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
