"use client"

import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"

export default function Features() {
  const isDesktop = useMediaQuery(BREAKPOINT)

  const cardRadius = isDesktop ? "40px" : "20px"

  return (
    <section
      style={{
        background: "rgb(15, 15, 15)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "rgb(15, 15, 15)",
          borderRadius: isDesktop ? "32px" : "24px",
          padding: isDesktop ? "120px 48px 0" : "80px 20px",
          maxWidth: "1200px",
          width: "100%",
          margin: `${isDesktop ? "96px" : "64px"} auto`,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: isDesktop ? "space-between" : "flex-start",
            alignItems: "flex-start",
            gap: isDesktop ? "0px" : "28px",
            maxWidth: "1200px",
            width: "100%",
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
              maxWidth: isDesktop ? "560px" : "100%",
              flex: isDesktop ? "1 0 0px" : "none",
              width: isDesktop ? "1px" : "100%",
            }}
          >
            Your ultimate Bitcoin wallet, packed with features to simplify your crypto journey
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: isDesktop ? "12px" : "10px",
              maxWidth: isDesktop ? "360px" : "100%",
              flex: isDesktop ? "1 0 0px" : "none",
              width: isDesktop ? "1px" : "100%",
              paddingLeft: isDesktop ? "56px" : "0",
            }}
          >
            <p
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: isDesktop ? "18px" : "16px",
                letterSpacing: "-0.3px",
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.65)",
                maxWidth: "360px",
                margin: 0,
              }}
            >
              From advanced tools to seamless navigation, we&apos;ve designed everything to elevate your Bitcoin experience.
            </p>
            <a
              href="https://www.apple.com/app-store/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgb(41, 41, 41)",
                backgroundColor: "rgb(23, 23, 23)",
                borderRadius: "14px",
                padding: isDesktop ? "12px 24px" : "10px 20px",
                textDecoration: "none",
                color: "rgb(255, 255, 255)",
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                letterSpacing: "-0.16px",
                boxShadow:
                  "inset 0px 2px 1px 0px rgba(255, 255, 255, 0.5), 0px 14px 6px -8px rgba(173, 173, 173, 0.03)",
              }}
            >
              Download now
            </a>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: isDesktop ? "18px" : "14px",
            marginTop: isDesktop ? "80px" : "48px",
          }}
        >
          <div
            style={{
              border: "1px solid rgb(41, 41, 41)",
              backgroundColor: "rgb(18, 17, 17)",
              borderRadius: cardRadius,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                mask: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 17.3%, rgb(0,0,0) 45%, rgb(0,0,0) 79.7%, rgba(0,0,0,0) 100%)",
                WebkitMask:
                  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 17.3%, rgb(0,0,0) 45%, rgb(0,0,0) 79.7%, rgba(0,0,0,0) 100%)",
                position: "relative",
                height: isDesktop ? "320px" : "220px",
                overflow: "hidden",
              }}
            >
              <div style={{ transform: "skewY(8deg)", width: "100%", height: "100%" }}>
                <img
                  decoding="async"
                  width="320"
                  height="654"
                  src="https://framerusercontent.com/images/aVkOVuDk5orllrm2GEOeCQomlU.png?scale-down-to=512"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              </div>
            </div>
            <div style={{ padding: isDesktop ? "24px" : "16px" }}>
              <h4
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontWeight: 600,
                  fontSize: "20px",
                  letterSpacing: "-0.3px",
                  color: "rgb(255, 255, 255)",
                  margin: 0,
                }}
              >
                Push Notifications
              </h4>
              <p
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontWeight: 500,
                  fontSize: "16px",
                  letterSpacing: "-0.16px",
                  lineHeight: 1.4,
                  color: "rgba(255, 255, 255, 0.65)",
                  margin: "8px 0 0",
                }}
              >
                Stay on top of your activity with instant alerts for all transactions.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isDesktop ? "18px" : "14px",
            }}
          >
            <div
              style={{
                border: "1px solid rgb(41, 41, 41)",
                backgroundColor: "rgb(18, 18, 18)",
                borderRadius: cardRadius,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: isDesktop ? "260px" : "200px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    filter: "blur(32px)",
                    WebkitFilter: "blur(32px)",
                    opacity: 0.4,
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <img
                    decoding="async"
                    width="200"
                    height="200"
                    src="https://framerusercontent.com/images/yyInpEPUSv3YwMHyKzPwuQSkwfE.png?scale-down-to=512"
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    decoding="async"
                    width="199"
                    height="199"
                    src="https://framerusercontent.com/images/yyInpEPUSv3YwMHyKzPwuQSkwfE.png?scale-down-to=512"
                    alt=""
                    style={{ maxWidth: "199px", transform: "translateX(-50%)" }}
                  />
                </div>
                <div
                  style={{
                    filter: "saturate(0) blur(0px)",
                    mask: "linear-gradient(180deg, rgba(0,0,0,1) 17%, rgba(0,0,0,0) 100%)",
                    WebkitMask:
                      "linear-gradient(180deg, rgba(0,0,0,1) 17%, rgba(0,0,0,0) 100%)",
                    opacity: 0.08,
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
              <div style={{ padding: isDesktop ? "24px" : "16px" }}>
                <h4
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 600,
                    fontSize: "20px",
                    letterSpacing: "-0.3px",
                    color: "rgb(255, 255, 255)",
                    margin: 0,
                  }}
                >
                  Effortless Transactions
                </h4>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgba(255, 255, 255, 0.65)",
                    margin: "8px 0 0",
                  }}
                >
                  Send and receive Bitcoin instantly with a user-friendly interface.
                </p>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgb(41, 41, 41)",
                backgroundColor: "rgb(18, 17, 17)",
                borderRadius: cardRadius,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  mask: "radial-gradient(129% 75% at 48% 23.2%, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
                  WebkitMask:
                    "radial-gradient(129% 75% at 48% 23.2%, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
                  position: "relative",
                  height: isDesktop ? "220px" : "170px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    backdropFilter: "blur(0px)",
                    borderRadius: "18px",
                    boxShadow:
                      "1.2px 0.3px 0.6px -0.09px rgba(255,255,255,0.032), 2.86px 0.71px 1.47px -0.18px rgba(255,255,255,0.035), 5.22px 1.3px 2.69px -0.28px rgba(255,255,255,0.04), 8.69px 2.17px 4.47px -0.37px rgba(255,255,255,0.046), 14.03px 3.5px 7.23px -0.46px rgba(255,255,255,0.057), 22.97px 5.74px 11.84px -0.56px rgba(255,255,255,0.074), 39.56px 9.89px 20.39px -0.65px rgba(255,255,255,0.106), 72px 18px 37.1px -0.75px rgba(255,255,255,0.17)",
                    transform: "skewX(6deg) skewY(10deg)",
                    width: "70%",
                    height: "80%",
                    overflow: "hidden",
                  }}
                >
                  <img
                    decoding="async"
                    width="309"
                    height="366"
                    src="https://framerusercontent.com/images/qNKUzanDB5DPFj4RnYeqoVb8p0.png?scale-down-to=512"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
              <div style={{ padding: isDesktop ? "24px" : "16px" }}>
                <h4
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 600,
                    fontSize: "20px",
                    letterSpacing: "-0.3px",
                    color: "rgb(255, 255, 255)",
                    margin: 0,
                  }}
                >
                  Real-Time Portfolio Insights
                </h4>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgba(255, 255, 255, 0.65)",
                    margin: "8px 0 0",
                  }}
                >
                  Track your Bitcoin balance and transaction history with live updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: isDesktop ? "80px" : "48px",
            border: "1px solid rgb(41, 41, 41)",
            borderRadius: cardRadius,
            overflow: "hidden",
            position: "relative",
            background: "rgb(18, 18, 18)",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <img
              decoding="async"
              width="1200"
              height="580"
              src="https://framerusercontent.com/images/EmtrS6jwtHfiUvXubu21rYWcs0.jpeg?scale-down-to=1024"
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
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(18,17,17,0) 0%, rgb(18,17,17) 100%)",
            }}
          />
          <div
            style={{
              position: "relative",
              padding: isDesktop ? "80px 40px" : "40px 20px",
              maxWidth: "600px",
            }}
          >
            <p
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: isDesktop ? "20px" : "18px",
                letterSpacing: "-0.3px",
                lineHeight: 1.4,
                color: "rgb(255, 255, 255)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              &ldquo;I&apos;ve been working on a new electronic cash system that&apos;s fully peer-to-peer, with no trusted third party.&rdquo;
            </p>
            <p
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                letterSpacing: "-0.16px",
                lineHeight: 1.4,
                color: "rgba(255, 255, 255, 0.65)",
                margin: "16px 0 0",
              }}
            >
              — Satoshi Nakamoto
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: isDesktop ? "96px" : "64px",
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
            }}
          >
            Explore, create, and trade seamlessly{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.65)" }}>in the Bitcoin ecosystem.</span>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
            gap: isDesktop ? "18px" : "14px",
            marginTop: isDesktop ? "64px" : "40px",
          }}
        >
          {[
            {
              title: "Mint and Secure SRC-20 Tokens",
              imgs: [
                "https://framerusercontent.com/images/gL6iNFaADHdhEzCEUUrTrfZSRV0.jpg",
                "https://framerusercontent.com/images/nyD7DmMc2YU0wULRCFrlT021UU.jpg",
              ],
            },
            {
              title: "Trade, Collect, and Inscribe Ordinals",
              imgs: [
                "https://framerusercontent.com/images/GNG8NXU3MHt8g0RdI36WFOTYY.webp",
                "https://framerusercontent.com/images/uvkIDi6jbrKoxy0xu1Ptowmew.png",
                "https://framerusercontent.com/images/CdA8r9XDAjTgGvfJl59P47AZHE.webp",
              ],
            },
            {
              title: "Purchase STX tokens to power L2 apps on Stacks.",
              imgs: [
                "https://framerusercontent.com/images/9m70bf3Mli1OQKyUlcSXLqNTQ.jpg",
                "https://framerusercontent.com/images/gL6iNFaADHdhEzCEUUrTrfZSRV0.jpg",
              ],
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgb(41, 41, 41)",
                backgroundColor: "rgb(23, 23, 23)",
                borderRadius: isDesktop ? "24px" : "18px",
                overflow: "hidden",
                boxShadow: "-100px 1px 72px 0px rgba(0, 0, 0, 0.35)",
                transform: isDesktop ? (i === 0 ? "rotate(1deg)" : i === 1 ? "rotate(-1deg)" : "rotate(1deg)") : "none",
              }}
            >
              <div
                style={{
                  mask: "linear-gradient(180deg, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
                  WebkitMask:
                    "linear-gradient(180deg, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
                  position: "relative",
                  height: isDesktop ? "160px" : "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "24px",
                }}
              >
                {item.imgs.map((src, j) => (
                  <div
                    key={j}
                    style={{
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderRadius: "16px",
                      width: isDesktop ? "80px" : "64px",
                      height: isDesktop ? "80px" : "64px",
                      overflow: "hidden",
                      flexShrink: 0,
                      transform:
                        j === 0 ? "rotate(1deg)" : j === 1 ? "rotate(-2deg)" : "rotate(2deg)",
                      boxShadow:
                        j === 0
                          ? "none"
                          : "-0.78px 0px 0.78px -0.53px rgba(0,0,0,0.333), -1.91px 0px 1.91px -1.07px rgba(0,0,0,0.326), -3.63px 0px 3.63px -1.6px rgba(0,0,0,0.317), -6.35px 0px 6.35px -2.14px rgba(0,0,0,0.301), -11.05px 0px 11.05px -2.67px rgba(0,0,0,0.275), -20.24px 0px 20.24px -3.21px rgba(0,0,0,0.223), -40px 0px 40px -3.75px rgba(0,0,0,0.112)",
                    }}
                  >
                    <img
                      decoding="async"
                      width="80"
                      height="80"
                      src={src}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ padding: "16px 24px 24px" }}>
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: isDesktop ? "18px" : "16px",
                    letterSpacing: "-0.3px",
                    lineHeight: 1.4,
                    color: "rgb(255, 255, 255)",
                    margin: 0,
                  }}
                >
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
