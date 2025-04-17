"use client";

import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import '../globals.css'; // <<--- CORRECTED: Use relative path

const ParticlesBackground = () => {
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // Load slim bundle for tsParticles
      await loadSlim(engine);
    }).then(() => {
      setInitDone(true);
    });
  }, []);

  const options = useMemo(() => ({
    fullScreen: { enable: false }, // Important: Set to false to contain within its parent
    background: {
      color: {
        value: "transparent" // Make background transparent
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
        repulse: { distance: 150, duration: 0.4 } // Adjusted distance
      }
    },
    particles: {
      color: { value: "#e2007e" }, // Magenta color
      links: {
        color: "#e2007e", // Magenta color
        distance: 150,
        enable: true,
        opacity: 0.4, // Slightly less opaque links
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5, // Slightly slower speed
        direction: "none",
        random: true, // Make movement random
        straight: false,
        outModes: { default: "out" } // Particles go out of bounds
      },
      number: {
        density: { enable: true, area: 800 },
        value: 40 // Slightly fewer particles
      },
      opacity: {
          value: { min: 0.1, max: 0.6 } // Random opacity
        },
      shape: { type: "circle" },
      size: {
          value: { min: 1, max: 4 } // Random size
        }
    },
    detectRetina: true
  }), []);

  if (!initDone) {
    return null; // Don't render until engine is initialized
  }

  return (
    // Ensure this container allows the particles to fill it
    // The className might need adjustment based on where you place it
    <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <Particles
          id="tsparticles"
          options={options}
          // className="w-full h-full" // Particles component might fill container by default
        />
    </div>
  );
};

export default ParticlesBackground;