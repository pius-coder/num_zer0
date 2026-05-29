"use client"

import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"

export default function FooterSection() {
  const isDesktop = useMediaQuery(BREAKPOINT)

  return (
    <section
      style={{
        backgroundColor: "rgb(242, 239, 235)",
        padding: isDesktop ? "24px" : "12px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgb(15, 15, 15)",
          borderRadius: isDesktop ? "32px" : "24px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            mask: "radial-gradient(60% 92% at 50% 105.3%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 95%)",
            WebkitMask:
              "radial-gradient(60% 92% at 50% 105.3%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 95%)",
          }}
        >
          <img
            decoding="async"
            width="1200"
            height="800"
            src="https://framerusercontent.com/images/3MMx8105CXwBQEqnGqdoqu6t24Q.jpg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div
          style={{
            position: "relative",
            padding: isDesktop ? "80px 40px 60px" : "48px 20px 40px",
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
              color: "rgb(255, 255, 255)",
              margin: 0,
              maxWidth: "700px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Experience Bitcoin like never before with Wallet
          </h2>

          <a
            href="https://www.apple.com/app-store/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgb(255, 47, 1)",
              backgroundColor: "rgb(255, 47, 0)",
              borderRadius: "14px",
              padding: isDesktop ? "12px 24px" : "10px 20px",
              marginTop: "32px",
              textDecoration: "none",
              color: "rgb(255, 255, 255)",
              fontFamily: "Figtree, sans-serif",
              fontWeight: 500,
              fontSize: "16px",
              letterSpacing: "-0.16px",
              boxShadow:
                "inset 0px 2px 1px 0px rgba(255, 255, 255, 0.5), inset 0px 0.6px 0.6px -1.25px rgba(255, 255, 255, 0.719), inset 0px 2.28px 2.28px -2.5px rgba(255, 255, 255, 0.635), inset 0px 10px 10px -3.75px rgba(255, 255, 255, 0.25), 0px 14px 6px -8px rgba(255, 47, 0, 0.2)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              focusable="false"
              color="rgb(255, 255, 255)"
              style={{
                userSelect: "none",
                width: "20px",
                height: "20px",
                display: "inline-block",
                fill: "rgb(255, 255, 255)",
                color: "rgb(255, 255, 255)",
                flexShrink: 0,
              }}
            >
              <g color="rgb(255, 255, 255)">
                <path d="M64.34,196.07l-9.45,16a8,8,0,1,1-13.78-8.14l9.46-16a8,8,0,1,1,13.77,8.14ZM232,152H184.2l-30.73-52a8,8,0,1,0-13.77,8.14l61.41,103.93a8,8,0,0,0,13.78-8.14L193.66,168H232a8,8,0,0,0,0-16Zm-89.53,0H90.38L158.89,36.07a8,8,0,0,0-13.78-8.14L128,56.89l-17.11-29a8,8,0,1,0-13.78,8.14l21.6,36.55L71.8,152H24a8,8,0,0,0,0,16H142.47a8,8,0,1,0,0-16Z" />
              </g>
            </svg>
            Get Wallet for free
          </a>

          <div
            style={{
              display: "flex",
              flexDirection: isDesktop ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: "14px",
                letterSpacing: "-0.14px",
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.65)",
                margin: 0,
              }}
            >
              Also available in browsers
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                {
                  href: "https://arc.net/",
                  img: "https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png",
                  w: "34px",
                },
                {
                  href: "https://www.google.com/chrome/",
                  img: "https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png",
                  w: "38px",
                },
                {
                  href: "https://www.mozilla.org/ru/firefox/windows/",
                  img: "https://framerusercontent.com/images/ayKZRQX9AdZvVllYXU0oo3hEEA.png?scale-down-to=1024",
                  w: "31px",
                },
              ].map((b, i) => (
                <a
                  key={i}
                  href={b.href}
                  target="_blank"
                  rel="noopener"
                  style={{
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    backgroundColor: "rgb(255, 250, 245)",
                    borderRadius: "12px",
                    width: isDesktop ? "45px" : "40px",
                    height: isDesktop ? "45px" : "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transform: i === 1 ? "rotate(-2deg)" : "rotate(2deg)",
                  }}
                >
                  <img
                    decoding="async"
                    width="34"
                    height="28"
                    src={b.img}
                    alt=""
                    style={{
                      width: isDesktop ? b.w : "28px",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            padding: isDesktop ? "24px 40px" : "20px",
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isDesktop ? "0" : "16px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              decoding="async"
              width="24"
              height="24"
              src="/logo.png"
              alt="Wallet"
              style={{ width: "24px", height: "24px", borderRadius: "6px" }}
            />
            <span
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 600,
                fontSize: "16px",
                color: "rgb(255, 255, 255)",
              }}
            >
              Wallet
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "24px",
            }}
          >
            {["Guides", "Support"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: "rgba(255, 255, 255, 0.7)",
                  textDecoration: "none",
                  padding: "6px 0",
                  borderBottom: link === "Guides" ? "1px solid rgb(255, 255, 255)" : "none",
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            padding: isDesktop ? "40px 40px 48px" : "32px 20px 40px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <h3
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 600,
              fontSize: "20px",
              letterSpacing: "-0.3px",
              lineHeight: 1.4,
              color: "rgb(255, 255, 255)",
              margin: 0,
            }}
          >
            Stay in touch
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {[
              { label: "X", href: "https://x.com" },
              { label: "LinkedIn", href: "https://linkedin.com" },
              { label: "Instagram", href: "https://instagram.com" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontWeight: 500,
                  fontSize: "14px",
                  letterSpacing: "-0.14px",
                  lineHeight: 1.4,
                  color: "rgba(255, 255, 255, 0.65)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "24px auto 0",
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          justifyContent: "space-between",
          alignItems: "center",
          gap: isDesktop ? "0" : "16px",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontFamily: "Figtree, sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            letterSpacing: "-0.14px",
            color: "rgba(18, 17, 17, 0.4)",
            margin: 0,
          }}
        >
          &copy; 2026 Wallet. All rights reserved.
        </p>
        <div
          style={{
            display: "flex",
            gap: "24px",
          }}
        >
          <a
            href="#"
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              letterSpacing: "-0.14px",
              color: "rgba(18, 17, 17, 0.4)",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </a>
          <a
            href="#"
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              letterSpacing: "-0.14px",
              color: "rgba(18, 17, 17, 0.4)",
              textDecoration: "none",
            }}
          >
            Terms of Service
          </a>
        </div>
      </div>
    </section>
  )
}
