"use client";

import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import '../globals.css'; // Ensure relative path

const ParticlesBackground = () => {
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    console.log("Attempting to initialize particles engine..."); // Add log
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      console.log("Particles engine initialized successfully."); // Add log
      setInitDone(true);
    }).catch(err => {
      console.error("Failed to initialize particles engine:", err); // Add error log
    });
  }, []); // Run only once on mount

  // Using the original options variable name and values
  const options = useMemo(() => ({
    fullScreen: { enable: false }, // <-- Key Change: Back to false
    background: {
      color: {
        value: "transparent" // Keep transparent
      }
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" }
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 150, duration: 0.4 }
      }
    },
    particles: {
      color: { value: "#e2007e" },
      links: {
        color: "#e2007e",
        distance: 150,
        enable: true,
        opacity: 0.4,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "out" }
      },
      number: {
        density: { enable: true, area: 800 },
        value: 40
      },
      opacity: {
          value: { min: 0.1, max: 0.6 }
        },
      shape: { type: "circle" },
      size: {
          value: { min: 1, max: 4 }
        }
    },
    detectRetina: true
  }), []); // Calculate options once

  if (!initDone) {
    // Log removed here, useEffect logs are more useful now
    return null; // Don't render until engine is initialized
  }

  // Use the original wrapper div structure
  return (
    <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"> {/* <-- Key Change: Using the wrapper div */}
        <Particles
          id="tsparticles"
          options={options} // Use the original options object name
        />
    </div>
  );
};

export default ParticlesBackground;