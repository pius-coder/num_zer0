"use client"

import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"

const dapps = [
  { name: "Coolchange", img: "https://framerusercontent.com/images/x495MOiNiq8DQdQNrGMqiW5CA.png", w: 140, h: 140 },
  { name: "ARamp", img: "https://framerusercontent.com/images/hCe7HGWiqcHS3sPuOLRNGssPAko.png", w: 140, h: 140 },
  { name: "SwanSwap", img: "https://framerusercontent.com/images/1kev4DX36PMe8zIqywvGjq71Q.png", w: 200, h: 200 },
  { name: "Ora", img: "https://framerusercontent.com/images/EyzxYk3EBcCZJMCTpBqCKG0Y0.png", w: 130, h: 130 },
  { name: "Magic Eden", img: "https://framerusercontent.com/images/o6mxvY2znA7DN3BEmycY0aF9hg.jpeg", w: 240, h: 168 },
  { name: "Gamma", img: "https://framerusercontent.com/images/L9w2L7amQCda2B2SYw2B123RixU.jpg", w: 280, h: 133 },
]

const rotations = [
  { rotate: "19deg", rotateX: "10deg", rotateY: "-50deg" },
  { rotate: "0deg", rotateX: "50deg", rotateY: "0deg" },
  { rotate: "-19deg", rotateX: "10deg", rotateY: "40deg" },
  { rotate: "0deg", rotateX: "-47deg", rotateY: "0deg" },
  { rotate: "19deg", rotateX: "-20deg", rotateY: "60deg" },
  { rotate: "-18deg", rotateX: "-20deg", rotateY: "-60deg" },
]

export default function Integrations() {
  const isDesktop = useMediaQuery(BREAKPOINT)

  return (
    <section
      style={{
        backgroundColor: "rgb(242, 239, 235)",
        padding: isDesktop ? "96px 24px" : "64px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          position: "relative",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Figtree, sans-serif",
            fontWeight: 600,
            fontSize: "clamp(28px, 5vw, 48px)",
            letterSpacing: "-1.2px",
            lineHeight: 1.1,
            color: "rgb(18, 17, 17)",
            margin: 0,
            maxWidth: "640px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Your comprehensive gateway to Bitcoin dapps and tools
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: isDesktop ? "12px" : "8px",
            marginTop: isDesktop ? "64px" : "40px",
            perspective: "500px",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: isDesktop ? "12px" : "8px",
              transform: isDesktop ? "scale(0.9)" : "scale(0.45)",
              transformStyle: "preserve-3d",
            }}
          >
            {dapps.map((dapp, i) => {
              const r = rotations[i]!
              return (
                <div
                  key={i}
                  style={{
                    transform: `rotate(${r.rotate}) rotateX(${r.rotateX}) rotateY(${r.rotateY})`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      width: dapp.w + "px",
                      height: dapp.h + "px",
                    }}
                  >
                    <img
                      decoding="async"
                      width={dapp.w}
                      height={dapp.h}
                      src={dapp.img}
                      alt={dapp.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  {isDesktop && (
                    <p
                      style={{
                        fontFamily: "Figtree, sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        letterSpacing: "-0.14px",
                        lineHeight: 1.4,
                        color: "rgb(18, 17, 17)",
                        margin: "8px 0 0",
                        textAlign: "center",
                      }}
                    >
                      {dapp.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p
          style={{
            fontFamily: "Figtree, sans-serif",
            fontWeight: 500,
            fontSize: isDesktop ? "18px" : "16px",
            letterSpacing: "-0.3px",
            lineHeight: 1.4,
            color: "rgba(18, 17, 17, 0.75)",
            margin: isDesktop ? "64px auto 0" : "40px auto 0",
            maxWidth: "500px",
          }}
        >
          From trading to gaming, unlock the full potential of over 20
          integrated dapps,{" "}
          <span style={{ color: "rgba(18, 17, 17, 0.75)" }}>
            all in one secure place.
          </span>
        </p>

        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            borderRadius: "888px",
            filter: "blur(24px)",
            WebkitFilter: "blur(24px)",
            width: isDesktop ? "400px" : "280px",
            height: "60px",
            margin: "40px auto 0",
            maxWidth: "100%",
          }}
        />
      </div>
    </section>
  )
}
