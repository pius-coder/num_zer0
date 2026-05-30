"use client"

import { useState } from "react"
import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"

const LOGO_URL = "https://framerusercontent.com/images/9BHvgeOXr5j7F1tFHZtf1aC99Y.png"

const NAV_BOX_SHADOW =
  "rgba(0,0,0,0.184) 0px 0.636953px 0.636953px -0.9375px, rgba(0,0,0,0.173) 0px 1.9316px 1.9316px -1.875px, rgba(0,0,0,0.15) 0px 5.10612px 5.10612px -2.8125px, rgba(0,0,0,0.063) 0px 16px 16px -3.75px"

const REMIX_SHADOW =
  "rgba(0,0,0,0.68) 0px -0.48175px 0.48175px -1.25px inset, rgba(0,0,0,0.596) 0px -1.83083px 1.83083px -2.5px inset, rgba(0,0,0,0.235) 0px -8px 8px -3.75px inset"

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" focusable={false} style={{ userSelect: "none", width: "100%", height: "100%", display: "inline-block", fill: "rgb(255, 255, 255)", color: "rgb(255, 255, 255)", flexShrink: 0 }}>
      <g color="rgb(255, 255, 255)">
        <path d="M222,128a6,6,0,0,1-6,6H40a6,6,0,0,1,0-12H216A6,6,0,0,1,222,128ZM40,70H216a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12ZM216,186H40a6,6,0,0,0,0,12H216a6,6,0,0,0,0-12Z" />
      </g>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" focusable={false} style={{ userSelect: "none", width: "100%", height: "100%", display: "inline-block", fill: "rgb(255, 255, 255)", color: "rgb(255, 255, 255)", flexShrink: 0 }}>
      <g color="rgb(255, 255, 255)">
        <path d="M204.24,195.76a6,6,0,1,1-8.48,8.48L128,136.49,60.24,204.24a6,6,0,0,1-8.48-8.48L119.51,128,51.76,60.24a6,6,0,0,1,8.48-8.48L128,119.51l67.76-67.75a6,6,0,0,1,8.48,8.48L136.49,128Z" />
      </g>
    </svg>
  )
}

export default function Navbar() {
  const isDesktop = useMediaQuery(BREAKPOINT)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      style={{
        flex: "none",
        height: "auto",
        left: "50%",
        position: "fixed",
        top: isDesktop ? "24px" : "12px",
        transform: "translateX(-50%)",
        width: isDesktop ? "440px" : "calc(100vw - 24px)",
        zIndex: 10,
        opacity: 1,
      }}
    >
      <nav
        style={{
          alignContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "min-content",
          justifyContent: isDesktop ? "center" : "flex-start",
          overflow: "visible",
          padding: 0,
          position: "relative",
          width: "100%",
          borderRadius: isDesktop ? "72px" : "16px",
          boxShadow: isDesktop ? NAV_BOX_SHADOW : "none",
          opacity: 1,
        }}
      >
        <div
          data-border="true"
          data-framer-name="Navigation Bar"
          style={{
            alignContent: "center",
            alignItems: "center",
            display: "flex",
            flex: "none",
            flexDirection: isDesktop ? "row" : "column",
            flexWrap: "nowrap",
            gap: isDesktop ? "36px" : "10px",
            height: "min-content",
            justifyContent: isDesktop ? "center" : "flex-start",
            overflow: isDesktop ? "hidden" : "visible",
            padding: isDesktop ? "10px 10px 10px 20px" : "10px 20px",
            position: "relative",
            width: "100%",
            zIndex: 10,
            border: "1px solid rgb(64, 64, 64)",
            backgroundColor: "rgb(23, 23, 23)",
            backdropFilter: isDesktop ? "blur(12px)" : "none",
            borderRadius: isDesktop ? "72px" : "16px",
            boxShadow: isDesktop ? "none" : NAV_BOX_SHADOW,
            opacity: 1,
          }}
        >
          <div
            data-framer-name="Container"
            style={{
              alignContent: "center",
              alignItems: "center",
              display: "flex",
              flex: isDesktop ? "1 0 0px" : "none",
              flexDirection: "row",
              flexWrap: "nowrap",
              height: "min-content",
              justifyContent: "space-between",
              maxWidth: "1440px",
              overflow: "visible",
              padding: 0,
              position: "relative",
              width: isDesktop ? "1px" : "100%",
              opacity: 1,
            }}
          >
            <div
              data-framer-name="Left Container"
              style={{
                alignContent: "center",
                alignItems: "center",
                display: "flex",
                flex: "1 0 0px",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: isDesktop ? "36px" : "36px",
                height: "min-content",
                justifyContent: "flex-start",
                overflow: "visible",
                padding: isDesktop ? "0 20px 0 0" : "0 20px 0 0",
                position: "relative",
                width: "1px",
                opacity: 1,
              }}
            >
              <a
                href="./"
                style={{
                  alignContent: "center",
                  alignItems: "center",
                  alignSelf: "stretch",
                  display: "flex",
                  flex: "none",
                  flexDirection: "column",
                  flexWrap: "nowrap",
                  gap: "0px",
                  height: "auto",
                  justifyContent: "center",
                  overflow: "visible",
                  padding: 0,
                  position: "relative",
                  textDecoration: "none",
                  width: "min-content",
                  zIndex: 2,
                  opacity: 1,
                }}
              >
                <div
                  data-framer-name="logotemplate_4x"
                  style={{
                    flex: "none",
                    height: isDesktop ? "26px" : "28px",
                    overflow: "visible",
                    position: "relative",
                    width: isDesktop ? "26px" : "28px",
                    borderRadius: "6px",
                    opacity: 1,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0, right: 0, bottom: 0, left: 0,
                      borderRadius: "inherit",
                    }}
                  >
                    <img
                      src={LOGO_URL}
                      alt=""
                      decoding="async"
                      width="1000" height="1000"
                      sizes={isDesktop ? "26px" : "28px"}
                      style={{
                        display: "block",
                        width: "100%", height: "100%",
                        objectPosition: "left center",
                        objectFit: "contain",
                        borderRadius: "inherit",
                      }}
                    />
                  </div>
                </div>
              </a>

              {isDesktop && (
                <div
                  data-framer-name="Tabs"
                  style={{
                    alignContent: "center",
                    alignItems: "center",
                    display: "flex",
                    flex: "1 0 0px",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    gap: "20px",
                    height: "min-content",
                    justifyContent: "flex-end",
                    overflow: "visible",
                    padding: 0,
                    position: "relative",
                    width: "1px",
                    zIndex: 8,
                    opacity: 1,
                  }}
                >
                  <div style={{ flex: "none", height: "auto", position: "relative", width: "auto", opacity: 1 }}>
                    <a
                      href="./blog"
                      style={{
                        alignContent: "center",
                        alignItems: "center",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "nowrap",
                        gap: "6px",
                        height: "min-content",
                        justifyContent: "center",
                        overflow: "visible",
                        padding: 0,
                        position: "relative",
                        textDecoration: "none",
                        width: "min-content",
                        backgroundColor: "rgba(255,255,255,0)",
                        opacity: 1,
                      }}
                    >
                      <div style={{ flex: "none", height: "auto", position: "relative", whiteSpace: "pre", width: "auto", opacity: 1 }}>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2, textAlign: "center", margin: 0 }}>
                          Guides
                        </p>
                      </div>
                    </a>
                  </div>
                  <div style={{ flex: "none", height: "auto", position: "relative", width: "auto", opacity: 1 }}>
                    <a
                      href="./support"
                      style={{
                        alignContent: "center",
                        alignItems: "center",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "nowrap",
                        gap: "6px",
                        height: "min-content",
                        justifyContent: "center",
                        overflow: "visible",
                        padding: 0,
                        position: "relative",
                        textDecoration: "none",
                        width: "min-content",
                        backgroundColor: "rgba(255,255,255,0)",
                        opacity: 1,
                      }}
                    >
                      <div style={{ flex: "none", height: "auto", position: "relative", whiteSpace: "pre", width: "auto", opacity: 1 }}>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2, textAlign: "center", margin: 0 }}>
                          Support
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {isDesktop ? (
              <div style={{ flex: "none", height: "auto", position: "relative", width: "auto", opacity: 1 }}>
                <a
                  href="https://framer.com/projects/new?duplicate=nasE63fRTzwlXz8HQOQr&via=akims15"
                  target="_blank"
                  rel="noopener"
                  style={{
                    alignContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    gap: "6px",
                    height: "min-content",
                    justifyContent: "center",
                    overflow: "hidden",
                    padding: "6px 12px",
                    position: "relative",
                    textDecoration: "none",
                    width: "min-content",
                    border: "1px solid rgb(41, 43, 43)",
                    backgroundColor: "rgb(41, 41, 41)",
                    borderRadius: "120px",
                    boxShadow: REMIX_SHADOW,
                    opacity: 1,
                  }}
                >
                  <div style={{ flex: "none", height: "auto", position: "relative", whiteSpace: "pre", width: "auto", opacity: 1 }}>
                    <p style={{ color: "rgb(255,255,255)", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2, textAlign: "center", margin: 0 }}>
                      Remix for free
                    </p>
                  </div>
                </a>
              </div>
            ) : (
              <div
                style={{
                  flex: "none",
                  height: "30px",
                  position: "relative",
                  width: "30px",
                  zIndex: 2,
                }}
              >
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: 1,
                  }}
                  aria-label={isOpen ? "Close menu" : "Open menu"}
                >
                  {isOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            )}
          </div>

          {!isDesktop && isOpen && (
            <div
              data-border="true"
              data-framer-name="Dropdown"
              style={{
                alignContent: "flex-start",
                alignItems: "flex-start",
                display: "flex",
                flex: "none",
                flexDirection: "column",
                flexWrap: "nowrap",
                gap: "22px",
                height: "min-content",
                justifyContent: "flex-start",
                overflow: "visible",
                padding: "16px 0 12px",
                position: "relative",
                width: "100%",
                borderTop: "1px solid rgb(41, 41, 41)",
              }}
            >
              <div
                data-framer-name="Tabs"
                style={{
                  alignContent: "flex-start",
                  alignItems: "flex-start",
                  display: "flex",
                  flex: "none",
                  flexDirection: "column",
                  flexWrap: "nowrap",
                  gap: "12px",
                  height: "min-content",
                  justifyContent: "flex-start",
                  overflow: "visible",
                  padding: 0,
                  position: "relative",
                  width: "100%",
                  zIndex: 8,
                }}
              >
                {[
                  { href: "./", label: "Home" },
                  { href: "./blog", label: "Guides" },
                  { href: "./support", label: "Support" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      backgroundColor: "rgba(255,255,255,0)",
                      width: "100%",
                      opacity: 1,
                    }}
                  >
                    <div
                      style={{
                        flex: "none",
                        height: "auto",
                        position: "relative",
                        whiteSpace: "pre",
                        width: "auto",
                        outline: "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        flexShrink: 0,
                        opacity: 1,
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "Figtree, sans-serif",
                          fontWeight: 500,
                          fontSize: "32px",
                          letterSpacing: "-0.04em",
                          lineHeight: 1.4,
                          textAlign: "left",
                          color: "rgb(255, 255, 255)",
                          margin: 0,
                          whiteSpace: "pre",
                        }}
                      >
                        {link.label}
                      </h3>
                    </div>
                  </a>
                ))}
              </div>

              <div
                style={{
                  flex: "none",
                  height: "44px",
                  position: "relative",
                  width: "100%",
                }}
              >
                <a
                  href="https://framer.com/projects/new?duplicate=nasE63fRTzwlXz8HQOQr&via=akims15"
                  target="_blank"
                  rel="noopener"
                  style={{
                    alignContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    gap: "6px",
                    height: "100%",
                    justifyContent: "center",
                    overflow: "hidden",
                    padding: "12px 16px",
                    position: "relative",
                    textDecoration: "none",
                    width: "100%",
                    border: "1px solid rgb(41, 43, 43)",
                    backgroundColor: "rgb(41, 41, 41)",
                    borderRadius: "14px",
                    boxShadow: REMIX_SHADOW,
                    opacity: 1,
                  }}
                >
                  <div
                    style={{
                      flex: "none",
                      height: "auto",
                      position: "relative",
                      whiteSpace: "pre",
                      width: "auto",
                      outline: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      flexShrink: 0,
                      opacity: 1,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Figtree, sans-serif",
                        fontWeight: 500,
                        fontSize: "20px",
                        letterSpacing: "-0.04em",
                        lineHeight: 1.4,
                        textAlign: "center",
                        color: "rgb(255, 255, 255)",
                        margin: 0,
                        whiteSpace: "pre",
                      }}
                    >
                      Remix for free
                    </p>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
