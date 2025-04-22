"use client"; // Keep this if Chatbox or ParticlesBackground need client-side APIs

import Chatbox from "./components/Chatbox";
import ParticlesBackground from "./components/ParticlesBackground"; // <-- Verify this line

export default function Home() {
  return (
    <main className="relative flex h-screen items-center justify-center bg-[#000000] overflow-hidden">
      <ParticlesBackground /> {/* Component usage */}
      <div className="relative z-10">
        <Chatbox />
      </div>
    </main>
  );
}