import React from "react";
import ParticleSphereAnimation from "./orbiting-circles-02-utils/particalsphear";

// SVG Logos for Gemini, Supabase, Make, Figma, Slack, Claude, React, Python
const icons = {
  chatgpt: "https://images.shadcnspace.com/assets/svgs/gemini.svg",
  supabase: "https://images.shadcnspace.com/assets/svgs/supabase.svg",
  make: "https://images.shadcnspace.com/assets/svgs/make.svg",
  figma: "https://images.shadcnspace.com/assets/svgs/figma.svg",
  slack: "https://images.shadcnspace.com/assets/svgs/slack.svg",
  claude: "https://images.shadcnspace.com/assets/svgs/clude.svg",
  react: "https://images.shadcnspace.com/assets/svgs/react.svg",
  python: "https://images.shadcnspace.com/assets/svgs/python.svg",
};

const orbits = [
  {
    size: "w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[580px] md:h-[580px] lg:w-[720px] lg:h-[720px] xl:w-[820px] xl:h-[820px]",
    duration: 20,
    icons: [
      { src: icons.supabase, alt: "Supabase", angle: -60 },
      { src: icons.chatgpt, alt: "Gemini AI", angle: 0 },
      { src: icons.make, alt: "Make", angle: 60 },
    ],
  },
  {
    size: "w-[460px] h-[460px] sm:w-[620px] sm:h-[620px] md:w-[800px] md:h-[800px] lg:w-[980px] lg:h-[980px] xl:w-[1100px] xl:h-[1100px]",
    duration: 26,
    icons: [
      { src: icons.figma, alt: "Figma", angle: -30 },
      { src: icons.slack, alt: "Slack", angle: -90 },
    ],
  },
  {
    size: "w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] md:w-[1020px] md:h-[1020px] lg:w-[1240px] lg:h-[1240px] xl:w-[1380px] xl:h-[1380px]",
    duration: 34,
    icons: [
      { src: icons.claude, alt: "Claude AI", angle: -60 },
      { src: icons.react, alt: "React", angle: 0 },
      { src: icons.python, alt: "Python", angle: 60 },
    ],
  },
];

export default function OrbitingCirclesGlobeDemo() {
  return (
    <div className="relative w-full h-[280px] sm:h-[380px] md:h-[480px] lg:h-[580px] xl:h-[650px] overflow-hidden flex justify-center items-end pointer-events-none select-none">
      <style>{`
        @keyframes orbit-cw {
          from { transform: rotate(var(--start-angle)); }
          to   { transform: rotate(calc(var(--start-angle) + 360deg)); }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(var(--start-angle)); }
          to   { transform: rotate(calc(var(--start-angle) - 360deg)); }
        }
        @keyframes counter-cw {
          from { transform: rotate(var(--counter-offset, 0deg)); }
          to   { transform: rotate(calc(var(--counter-offset, 0deg) - 360deg)); }
        }
        @keyframes counter-ccw {
          from { transform: rotate(var(--counter-offset, 0deg)); }
          to   { transform: rotate(calc(var(--counter-offset, 0deg) + 360deg)); }
        }
      `}</style>

      {/* Particle sphere anchored directly on bottom line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 aspect-square pointer-events-none w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] xl:w-[680px] xl:h-[680px] z-10">
        <ParticleSphereAnimation />
      </div>

      {/* Orbiting concentric rings anchored directly on bottom line */}
      {orbits.map((orbit, index) => {
        const isCW = index % 2 === 0;
        const orbitAnim = isCW ? "orbit-cw" : "orbit-ccw";
        const counterAnim = isCW ? "counter-cw" : "counter-ccw";

        const allIcons = [
          ...orbit.icons,
          ...orbit.icons.map((ic) => ({
            ...ic,
            angle: ic.angle + 180,
            alt: `${ic.alt}-mirror`,
          })),
        ];

        return (
          <div
            key={index}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-slate-300/70 ${orbit.size}`}
          >
            {allIcons.map((iconData, iconIndex) => (
              <div
                key={iconIndex}
                className="absolute top-0 left-1/2 h-1/2 -ml-5 sm:-ml-6 origin-bottom flex flex-col justify-start items-center"
                style={
                  {
                    "--start-angle": `${iconData.angle}deg`,
                    animation: `${orbitAnim} ${orbit.duration}s linear infinite`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="p-2 sm:p-2.5 border border-slate-200/90 rounded-full bg-white shadow-md shadow-slate-200/70 -mt-5 sm:-mt-6 relative z-10 flex items-center justify-center"
                  style={
                    {
                      "--counter-offset": `${-iconData.angle}deg`,
                      animation: `${counterAnim} ${orbit.duration}s linear infinite`,
                    } as React.CSSProperties
                  }
                >
                  <img
                    src={iconData.src}
                    alt={iconData.alt}
                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
