"use client";

import Chatbox from "./components/Chatbox";
import ParticlesBackground from "./components/ParticlesBackground";

export default function Home() {
  return (
    <main className="relative flex h-screen items-center justify-center bg-[#000000]">
      <ParticlesBackground />
      <div className="relative z-10">
        <Chatbox />
      </div>
    </main>
  );
}
