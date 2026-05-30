"use client"

import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"

export default function Security() {
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
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.5) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          flex: "none",
          height: "562px",
          left: "calc(50% - 559.5px)",
          overflow: "visible",
          position: "absolute",
          top: 0,
          width: "1119px",
          zIndex: 0,
          border: "1px dashed rgba(33, 33, 33, 0.12)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          position: "relative",
          display: "grid",
          gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
          gap: isDesktop ? "48px" : "32px",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 5vw, 48px)",
              letterSpacing: "-1.2px",
              lineHeight: 1.1,
              color: "rgba(18, 17, 17, 0.75)",
              margin: 0,
            }}
          >
            Security that lets you{" "}
            <span style={{ color: "rgb(18, 17, 17)" }}>sleep easy</span>
          </h2>
          <p
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 500,
              fontSize: isDesktop ? "18px" : "16px",
              letterSpacing: "-0.3px",
              lineHeight: 1.4,
              color: "rgba(18, 17, 17, 0.75)",
              margin: "16px 0 0",
            }}
          >
            Enable multi-signature functionality for high-value transactions to
            enhance protection against unauthorized access.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "rgb(242, 239, 235)",
                borderRadius: "12px",
                padding: "14px 18px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "none", height: "20px", position: "relative", width: "20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(18,17,17,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div style={{ flex: "1 0 0px" }}>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgb(18, 17, 17)",
                    margin: 0,
                  }}
                >
                  Multi-sig Support
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "rgb(242, 239, 235)",
                borderRadius: "12px",
                padding: "14px 18px",
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "none", height: "20px", position: "relative", width: "20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(18,17,17,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div style={{ flex: "1 0 0px" }}>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgba(18, 17, 17, 0.8)",
                    margin: 0,
                  }}
                >
                  Threat Monitoring
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "rgb(242, 239, 235)",
                borderRadius: "12px",
                padding: "14px 18px",
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div style={{ flex: "none", height: "20px", position: "relative", width: "20px" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(18,17,17,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
                  <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10"/>
                  <path d="M6 12a6 6 0 0 1 12 0"/>
                  <path d="M8 12a4 4 0 0 1 8 0"/>
                  <path d="M10 12a2 2 0 0 1 4 0"/>
                  <path d="M12 22v-6"/>
                </svg>
              </div>
              <div style={{ flex: "1 0 0px" }}>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgba(18, 17, 17, 0.8)",
                    margin: 0,
                  }}
                >
                  Biometric Authentication
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "0px solid rgb(18, 18, 18)",
            borderRightWidth: "1px",
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              filter: "brightness(0.3) contrast(1.5)",
              WebkitFilter: "brightness(0.3) contrast(1.5)",
              position: "absolute",
              inset: 0,
            }}
          >
            <img
              decoding="async"
              width="512"
              height="300"
              src="https://framerusercontent.com/images/0zpNQr9uXE3ZfYqMAPqXWVktQ.png"
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
            />
          </div>
          <div
            style={{
              filter: "saturate(0) blur(0px)",
              WebkitFilter: "saturate(0) blur(0px)",
              mask: "linear-gradient(180deg, rgba(0,0,0,1) 17%, rgba(0,0,0,0) 100%)",
              WebkitMask:
                "linear-gradient(180deg, rgba(0,0,0,1) 17%, rgba(0,0,0,0) 100%)",
              opacity: 0.2,
              position: "absolute",
              inset: 0,
            }}
          >
            <img
              decoding="async"
              width="1200"
              height="675"
              src="https://framerusercontent.com/images/dQg9YfLvxNYTLvyRoj1NXdMRGw.jpg"
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: isDesktop ? "400px" : "300px",
              padding: isDesktop ? "40px" : "24px",
            }}
          >
            <div
              style={{
                borderRadius: "12px",
                boxShadow:
                  "-1.34px 0px 1.34px -0.46px rgba(255,255,255,0.111), -3.18px 0px 3.18px -0.93px rgba(255,255,255,0.109), -5.8px 0px 5.8px -1.4px rgba(255,255,255,0.107), -9.65px 0px 9.65px -1.87px rgba(255,255,255,0.103), -15.59px 0px 15.59px -2.34px rgba(255,255,255,0.097), -25.53px 0px 25.53px -2.81px rgba(255,255,255,0.088), -43.96px 0px 43.96px -3.28px rgba(255,255,255,0.071), -80px 0px 80px -3.75px rgba(255,255,255,0.037)",
                width: isDesktop ? "205px" : "160px",
                height: "auto",
                overflow: "hidden",
              }}
            >
              <img
                decoding="async"
                width="205"
                height="208"
                src="https://framerusercontent.com/images/CEwJTdgwiTStUCpa9ZJrXv0eelY.png?scale-down-to=1024"
                alt=""
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
