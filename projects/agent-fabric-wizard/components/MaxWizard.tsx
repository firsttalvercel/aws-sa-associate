"use client";

import Image from "next/image";

// Crystal orb position as % of the image (666×375 PNG):
// x ≈ 490/666 = 73.6% from left → 26.4% from right
// y ≈ 60/375  = 16%   from top
// Using percentages means the sparks scale with the rendered image size automatically.

const SPARKS = [
  { angle: -80,  delay: 0,    duration: 950,  size: 4, color: "#00d4ff" },
  { angle: -50,  delay: 180,  duration: 1100, size: 3, color: "#ffffff" },
  { angle: -110, delay: 320,  duration: 800,  size: 5, color: "#00a0df" },
  { angle: -140, delay: 90,   duration: 1000, size: 3, color: "#ffd700" },
  { angle: -60,  delay: 430,  duration: 750,  size: 4, color: "#ffffff" },
  { angle: -25,  delay: 570,  duration: 1200, size: 3, color: "#00d4ff" },
  { angle: -95,  delay: 220,  duration: 950,  size: 5, color: "#ffd700" },
  { angle: -125, delay: 660,  duration: 850,  size: 3, color: "#00a0df" },
  { angle: -155, delay: 380,  duration: 1050, size: 4, color: "#ffffff" },
  { angle: -170, delay: 510,  duration: 700,  size: 3, color: "#ffd700" },
];

export default function MaxWizard() {
  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
      {/* Relative wrapper so sparks are positioned as % of actual rendered image */}
      <div className="relative" style={{ animation: "max-vanish 9s ease-in-out infinite" }}>
        <Image
          src="/max-wizard.png"
          alt="Max the MuleSoft Wizard"
          width={300}
          height={169}
          className="object-contain"
          priority
        />

        {/* Spark origin — % coordinates lock onto the crystal orb */}
        <div
          className="absolute"
          style={{ right: "34%", top: "30%", width: 0, height: 0 }}
        >
          {/* Glowing crystal pulse */}
          <span style={{
            position: "absolute",
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#00d4ff",
            boxShadow: "0 0 10px 4px #00d4ff, 0 0 22px 8px #00a0df55",
            top: -5, left: -5,
            animation: "crystal-pulse 2s ease-in-out infinite",
          }} />

          {/* Sparks */}
          {SPARKS.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * 45;
            const ty = Math.sin(rad) * 45;
            return (
              <span key={i} style={{
                position: "absolute",
                width: s.size, height: s.size,
                borderRadius: "50%",
                background: s.color,
                boxShadow: `0 0 ${s.size + 2}px 1px ${s.color}`,
                top: -s.size / 2, left: -s.size / 2,
                animation: `spark-fly ${s.duration}ms ${s.delay}ms ease-out infinite`,
                ["--tx" as string]: `${tx}px`,
                ["--ty" as string]: `${ty}px`,
              }} />
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spark-fly {
          0%   { transform: translate(0, 0) scale(1);    opacity: 1; }
          70%  { opacity: 0.7; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.1); opacity: 0; }
        }

        @keyframes crystal-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1);   }
          50%       { opacity: 1;   transform: scale(1.5); }
        }

        @keyframes max-vanish {
          0%,  60% { opacity: 1; transform: scale(1)    translateY(0);   filter: blur(0px);   }
          68%       { opacity: 0; transform: scale(0.85) translateY(10px); filter: blur(4px);  }
          76%       { opacity: 0; transform: scale(0.85) translateY(10px); filter: blur(4px);  }
          86%       { opacity: 1; transform: scale(1.03) translateY(-4px); filter: blur(0px);  }
          100%      { opacity: 1; transform: scale(1)    translateY(0);   filter: blur(0px);   }
        }
      `}</style>
    </div>
  );
}
