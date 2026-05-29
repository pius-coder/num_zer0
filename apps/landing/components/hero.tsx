"use client"

import { useMediaQuery } from "../hooks/useMediaQuery"

const BREAKPOINT = "(min-width: 768px)"
const WIDE_BREAKPOINT = "(min-width: 1200px)"

function FloatingImages() {
  const isWide = useMediaQuery(WIDE_BREAKPOINT)
  const isDesktop = useMediaQuery(BREAKPOINT)

  const images = [
    { src: "b5NVDoS0N14mdeqZXlwlNtq66Tg", bottom: "302px", right: isWide ? "-123px" : "-3px" },
    { src: "aH1bBLy4Drsovp6eIcG1ZlaG2Fw", bottom: "429px", right: isWide ? "-153px" : "-33px" },
    { src: "DQgZgOJ2wtctgNhcuqR8g67L8s", bottom: "567px", right: isWide ? "-123px" : "-3px" },
    { src: "Wl5vnM6B2urkYZ4guqafBpAxKU", bottom: "579px", left: isWide ? "-124px" : "5px" },
    { src: "QFeUkbO8JHY5ZGgY0KZNgCl4", bottom: isWide ? "452px" : "unset", left: isWide ? "-154px" : "-25px", top: isWide ? undefined : "53%" },
    { src: "WZ2e1rIRxTMlG29BZ6I4I37468", bottom: "325px", left: isWide ? "-124px" : "5px" },
  ]

  return (
    <>
      {images.map((img, i) => {
        const { src, ...pos } = img
        const imgStyle: React.CSSProperties = {
          border: "1px dashed rgba(33, 33, 33, 0.12)",
          WebkitMask: i < 3
            ? "radial-gradient(100% 441% at -11.1% 60%, rgba(0,0,0,0) 19.545%, rgba(0,0,0,1) 100%)"
            : i === 3
            ? "radial-gradient(95% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)"
            : i === 4
            ? "radial-gradient(100% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)"
            : "radial-gradient(92% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)",
          mask: i < 3
            ? "radial-gradient(100% 441% at -11.1% 60%, rgba(0,0,0,0) 19.545%, rgba(0,0,0,1) 100%)"
            : i === 3
            ? "radial-gradient(95% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)"
            : i === 4
            ? "radial-gradient(100% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)"
            : "radial-gradient(92% 301% at 2.7% 57.7%, #000 0%, rgba(0,0,0,0) 100%)",
          aspectRatio: "4.705882352941177 / 1",
          borderRadius: "12px",
          flex: "none",
          height: "68px",
          overflow: "visible",
          position: "absolute",
          width: "320px",
          zIndex: 1,
          ...pos,
        } as React.CSSProperties

        return (
          <div key={i} style={imgStyle}>
            <div
              style={{
                position: "absolute",
                borderRadius: "inherit",
                top: 0, right: 0, bottom: 0, left: 0,
              }}
            >
              <img
                decoding="async"
                width="960" height="219"
                sizes="320px"
                srcSet={`https://framerusercontent.com/images/${src}.png?scale-down-to=512 512w, https://framerusercontent.com/images/${src}.png 960w`}
                src={`https://framerusercontent.com/images/${src}.png?scale-down-to=512`}
                alt=""
                style={{
                  display: "block",
                  width: "100%", height: "100%",
                  borderRadius: "inherit",
                  objectPosition: "center",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}

export default function Hero() {
  const isWide = useMediaQuery(WIDE_BREAKPOINT)
  const isDesktop = useMediaQuery(BREAKPOINT)

  const sectionPadding = isWide
    ? "160px 44px 100px"
    : isDesktop
    ? "120px 44px 80px"
    : "80px 20px 60px"

  return (
    <section
      id="hero"
      style={{
        alignContent: "center",
        alignItems: "center",
        display: "flex",
        flex: "none",
        flexDirection: "column",
        flexWrap: "nowrap",
        height: "min-content",
        justifyContent: "center",
        minHeight: "800px",
        overflow: "visible",
        padding: sectionPadding,
        position: "relative",
        width: "100%",
        backgroundColor: "rgb(255, 250, 245)",
      }}
    >
      <div
        style={{
          alignContent: "flex-start",
          alignItems: "flex-start",
          display: "flex",
          flex: "none",
          flexDirection: "column",
          flexWrap: "nowrap",
          height: "min-content",
          justifyContent: "flex-start",
          maxWidth: "800px",
          overflow: "visible",
          padding: 0,
          position: "relative",
          width: "100%",
          zIndex: 2,
        }}
      >
        <div
          style={{
            alignContent: "center",
            alignItems: "center",
            display: "flex",
            flex: "none",
            flexDirection: "column",
            flexWrap: "nowrap",
            height: "min-content",
            justifyContent: "center",
            overflow: "visible",
            padding: 0,
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              margin: `${isDesktop ? "0" : "0"} 0 ${isDesktop ? "18px" : "10px"}`,
              maxWidth: isDesktop ? "640px" : "100%",
              width: "100%",
              position: "relative",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              wordWrap: "break-word",
              zIndex: 1,
              flex: "none",
              height: "auto",
              outline: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              flexShrink: 0,
              opacity: 1,
              transform: "none",
            }}
            data-framer-component-type="RichTextContainer"
          >
            <h1
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400,
                fontSize: isDesktop ? "88px" : "56px",
                letterSpacing: isDesktop ? "-4.08px" : "-0.04em",
                lineHeight: 0.95,
                textAlign: "center",
                color: "rgb(18, 17, 17)",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              Reimagine How You Interact With Bitcoin
            </h1>
          </div>

          <div
            style={{
              margin: `0 0 ${isDesktop ? "18px" : "10px"}`,
              flex: "none",
              height: "772px",
              position: "relative",
              width: "400px",
              zIndex: 2,
              opacity: 1,
              transform: isDesktop ? "none" : "scale(0.95)",
            }}
          >
            <div
              style={{
                alignContent: "center",
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                height: "100%",
                justifyContent: "center",
                overflow: "hidden",
                padding: 0,
                position: "relative",
                width: "100%",
                opacity: 1,
              }}
            >
              <div
                style={{
                  flex: "1 0 0px",
                  height: "100%",
                  overflow: "visible",
                  position: "relative",
                  width: "1px",
                  zIndex: 4,
                  opacity: 1,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "inherit",
                    top: 0, right: 0, bottom: 0, left: 0,
                  }}
                >
                  <img
                    decoding="async"
                    width="1072" height="2163"
                    sizes="max(400px, 1px)"
                    srcSet="https://framerusercontent.com/images/M5BYpFV5ukCc6wJlq4Wqvkzw.png?scale-down-to=2048 1015w, https://framerusercontent.com/images/M5BYpFV5ukCc6wJlq4Wqvkzw.png 1072w"
                    src="https://framerusercontent.com/images/M5BYpFV5ukCc6wJlq4Wqvkzw.png"
                    alt=""
                    style={{
                      display: "block",
                      width: "100%", height: "100%",
                      borderRadius: "inherit",
                      objectPosition: "center",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  flex: "none",
                  height: "724px",
                  left: "calc(50.25% - 334px / 2)",
                  overflow: "hidden",
                  position: "absolute",
                  top: "calc(50% - 724px / 2)",
                  width: "334px",
                  zIndex: 1,
                  borderRadius: "36px",
                  opacity: 1,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    borderRadius: "inherit",
                    top: 0, right: 0, bottom: 0, left: 0,
                  }}
                >
                  <img
                    decoding="async"
                    width="1179" height="2556"
                    sizes="334px"
                    srcSet="https://framerusercontent.com/images/wii2kgLZGjyANjDVVTkjNVF2cRs.png?scale-down-to=2048 944w, https://framerusercontent.com/images/wii2kgLZGjyANjDVVTkjNVF2cRs.png 1179w"
                    src="https://framerusercontent.com/images/wii2kgLZGjyANjDVVTkjNVF2cRs.png"
                    alt=""
                    style={{
                      display: "block",
                      width: "100%", height: "100%",
                      borderRadius: "inherit",
                      objectPosition: "center",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              margin: `0 0 ${isDesktop ? "18px" : "10px"}`,
              maxWidth: isDesktop ? "440px" : "100%",
              width: "100%",
              position: "relative",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              wordWrap: "break-word",
              flex: "none",
              height: "auto",
              outline: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              flexShrink: 0,
              opacity: 1,
              transform: "none",
            }}
            data-framer-component-type="RichTextContainer"
          >
            <p
              style={{
                fontFamily: "Figtree, sans-serif",
                fontWeight: 500,
                fontSize: "20px",
                letterSpacing: "-0.02em",
                lineHeight: 1.4,
                textAlign: "center",
                color: "rgba(18, 17, 17, 0.75)",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              From transactions to dapps — explore every corner of the Bitcoin universe with ease.
            </p>
          </div>

          {isDesktop && <FloatingImages />}

          <div
            data-framer-name="Glow"
            style={{
              WebkitFilter: "blur(48px)",
              borderRadius: "888px",
              filter: "blur(48px)",
              flex: "none",
              height: isWide ? "597px" : isDesktop ? "437px" : "300px",
              left: isWide ? "calc(50% - 470px / 2)" : isDesktop ? "-30px" : "-20px",
              right: isWide ? "unset" : isDesktop ? "-12px" : "-8px",
              top: isWide ? "211px" : isDesktop ? "calc(45.189% - 437px / 2)" : "calc(45.19% - 300px / 2)",
              width: isWide ? "470px" : "unset",
              mixBlendMode: "hard-light",
              overflow: "hidden",
              position: "absolute",
              zIndex: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                borderRadius: "inherit",
                top: 0, right: 0, bottom: 0, left: 0,
                opacity: 0.3,
              }}
            >
              <img
                decoding="async"
                width="4500" height="3000"
                src="https://framerusercontent.com/images/VkmUcVisuWxL6xmS3bXenYoZ7hQ.jpg?scale-down-to=512"
                alt=""
                style={{
                  display: "block",
                  width: "100%", height: "100%",
                  borderRadius: "inherit",
                  objectPosition: "center",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            margin: `${isDesktop ? "11px" : "8px"} 0 0`,
            alignContent: "center",
            alignItems: "center",
            display: "flex",
            flex: "none",
            flexDirection: "column",
            flexWrap: "nowrap",
            gap: isDesktop ? "13px" : "10px",
            height: "min-content",
            justifyContent: "flex-start",
            overflow: "visible",
            padding: 0,
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              flex: "none",
              height: "auto",
              position: "relative",
              width: "auto",
              opacity: 1,
              transform: "none",
            }}
          >
            <a
              href="https://www.apple.com/app-store/"
              target="_blank"
              rel="noopener"
              style={{
                alignContent: "center",
                alignItems: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: "8px",
                height: "min-content",
                justifyContent: "center",
                overflow: "hidden",
                padding: isDesktop ? "12px 20px" : "8px 16px",
                position: "relative",
                textDecoration: "none",
                width: "min-content",
                border: "1px solid rgb(255, 47, 1)",
                backgroundColor: "rgb(255, 47, 0)",
                borderRadius: "14px",
                boxShadow:
                  "inset 0px 2px 1px 0px rgba(255, 255, 255, 0.5), inset 0px 0.6021873017743928px 0.6021873017743928px -1.25px rgba(255, 255, 255, 0.71989), inset 0px 2.288533303243457px 2.288533303243457px -2.5px rgba(255, 255, 255, 0.63557), inset 0px 10px 10px -3.75px rgba(255, 255, 255, 0.25), 0px 14px 6px -8px rgba(255, 47, 0, 0.2)",
                opacity: 1,
                transform: "none",
              }}
            >
              <div
                style={{
                  flex: "none",
                  height: "20px",
                  position: "relative",
                  width: "20px",
                  zIndex: 1,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" focusable="false" color="rgb(255, 255, 255)" style={{ userSelect: "none", width: "100%", height: "100%", display: "inline-block", fill: "rgb(255, 255, 255)", color: "rgb(255, 255, 255)", flexShrink: 0 }}>
                  <g color="rgb(255, 255, 255)">
                    <path d="M64.34,196.07l-9.45,16a8,8,0,1,1-13.78-8.14l9.46-16a8,8,0,1,1,13.77,8.14ZM232,152H184.2l-30.73-52a8,8,0,1,0-13.77,8.14l61.41,103.93a8,8,0,0,0,13.78-8.14L193.66,168H232a8,8,0,0,0,0-16Zm-89.53,0H90.38L158.89,36.07a8,8,0,0,0-13.78-8.14L128,56.89l-17.11-29a8,8,0,1,0-13.78,8.14l21.6,36.55L71.8,152H24a8,8,0,0,0,0,16H142.47a8,8,0,1,0,0-16Z" />
                  </g>
                </svg>
              </div>
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
                  transform: "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: isDesktop ? "18px" : "16px",
                    letterSpacing: "-0.16px",
                    lineHeight: 1.4,
                    color: "rgb(255, 255, 255)",
                    margin: 0,
                    whiteSpace: "pre",
                  }}
                >
                  Download for free
                </p>
              </div>
            </a>
          </div>

          <div
            style={{
              flex: "none",
              height: "auto",
              position: "relative",
              width: "100%",
              opacity: 1,
              transform: "none",
            }}
          >
            <div
              style={{
                alignContent: "center",
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                flexWrap: "nowrap",
                gap: "8px",
                height: "min-content",
                justifyContent: "center",
                overflow: "visible",
                padding: isDesktop ? "16px" : "12px",
                position: "relative",
                width: "100%",
                backgroundColor: "rgb(242, 239, 235)",
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  flex: "none",
                  height: isDesktop ? "45px" : "40px",
                  overflow: "visible",
                  position: "relative",
                  width: isDesktop ? "155px" : "135px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: isDesktop ? "12px" : "8px",
                    top: 0,
                    width: isDesktop ? "45px" : "40px",
                    transform: "rotate(2deg)",
                  }}
                >
                  <a
                    href="https://arc.net/"
                    target="_blank" rel="noopener"
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      backgroundColor: "rgb(255, 250, 245)",
                      borderRadius: "12px",
                      boxShadow: "-0.3613123810646357px 0.6021873017743928px 0.702265037666635px -1.25px rgba(0, 0, 0, 0.21597), -1.3731199819460742px 2.288533303243457px 2.6688655201928024px -2.5px rgba(0, 0, 0, 0.19067), -6px 10px 11.661903789690601px -3.75px rgba(0, 0, 0, 0.075)",
                      height: "100%", width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ transform: "translate(-50%, -50%)", position: "absolute", left: "50%", top: "50%" }}>
                      <img decoding="async" loading="lazy" width="2467" height="2046" sizes={isDesktop ? "34px" : "30px"} srcSet="https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png?scale-down-to=512 512w, https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png?scale-down-to=1024 1024w, https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png?scale-down-to=2048 2048w, https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png 2467w" src="https://framerusercontent.com/images/mTHPSeB0Je3f3BGonkQ3KKXNya8.png" alt="" style={{ display: "block", width: isDesktop ? "34px" : "30px", height: "auto", borderRadius: "inherit", objectPosition: "center", objectFit: "contain" }} />
                    </div>
                  </a>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: isDesktop ? "calc(49.68% - 45px / 2)" : "calc(49.68% - 40px / 2)",
                    top: 0,
                    width: isDesktop ? "45px" : "40px",
                    transform: "rotate(-2deg)",
                  }}
                >
                  <a
                    href="https://www.google.com/chrome/"
                    target="_blank" rel="noopener"
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      backgroundColor: "rgb(255, 250, 245)",
                      borderRadius: "12px",
                      boxShadow: "-0.3613123810646357px 0.6021873017743928px 0.702265037666635px -1.25px rgba(0, 0, 0, 0.21597), -1.3731199819460742px 2.288533303243457px 2.6688655201928024px -2.5px rgba(0, 0, 0, 0.19067), -6px 10px 11.661903789690601px -3.75px rgba(0, 0, 0, 0.075)",
                      height: "100%", width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ transform: "translate(-50%, -50%)", position: "absolute", left: "50%", top: "50%" }}>
                      <img decoding="async" loading="lazy" width="3000" height="2000" sizes={isDesktop ? "38px" : "34px"} srcSet="https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png?scale-down-to=512 512w, https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png?scale-down-to=1024 1024w, https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png?scale-down-to=2048 2048w, https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png 3000w" src="https://framerusercontent.com/images/UGOf15HarMoiVLKyFn2iNYEjkb4.png" alt="" style={{ display: "block", width: isDesktop ? "38px" : "34px", height: "auto", borderRadius: "inherit", objectPosition: "center", objectFit: "cover" }} />
                    </div>
                  </a>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: isDesktop ? "97px" : "86px",
                    top: 0,
                    width: isDesktop ? "45px" : "40px",
                    transform: "rotate(2deg)",
                  }}
                >
                  <a
                    href="https://www.mozilla.org/ru/firefox/windows/"
                    target="_blank" rel="noopener"
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      backgroundColor: "rgb(255, 250, 245)",
                      borderRadius: "12px",
                      boxShadow: "-0.3613123810646357px 0.6021873017743928px 0.702265037666635px -1.25px rgba(0, 0, 0, 0.21597), -1.3731199819460742px 2.288533303243457px 2.6688655201928024px -2.5px rgba(0, 0, 0, 0.19067), -6px 10px 11.661903789690601px -3.75px rgba(0, 0, 0, 0.075)",
                      height: "100%", width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ transform: "translate(-50%, -50%)", position: "absolute", left: "50%", top: "50%" }}>
                      <img decoding="async" loading="lazy" width="1200" height="1131" sizes={isDesktop ? "31px" : "27px"} srcSet="https://framerusercontent.com/images/ayKZRQX9AdZvVllYXU0oo3hEEA.png?scale-down-to=512 512w, https://framerusercontent.com/images/ayKZRQX9AdZvVllYXU0oo3hEEA.png?scale-down-to=1024 1024w, https://framerusercontent.com/images/ayKZRQX9AdZvVllYXU0oo3hEEA.png 1200w" src="https://framerusercontent.com/images/ayKZRQX9AdZvVllYXU0oo3hEEA.png?scale-down-to=1024" alt="" style={{ display: "block", width: isDesktop ? "31px" : "27px", height: "auto", borderRadius: "inherit", objectPosition: "center", objectFit: "cover" }} />
                    </div>
                  </a>
                </div>
              </div>
              <div
                style={{
                  maxWidth: "440px",
                  width: "100%",
                  position: "relative",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  wordWrap: "break-word",
                  flex: "none",
                  height: "auto",
                  outline: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  flexShrink: 0,
                  transform: "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "Figtree, sans-serif",
                    fontWeight: 500,
                    fontSize: "16px",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.6,
                    color: "rgba(18, 17, 17, 0.75)",
                    textAlign: "center",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  Also available in browsers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: "none",
          height: "100%",
          left: 0,
          overflow: "hidden",
          position: "absolute",
          top: 0,
          width: "100%",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            borderRadius: "inherit",
            top: 0, right: 0, bottom: 0, left: 0,
          }}
        >
          <img
            decoding="async"
            width="4500" height="3000"
            src="https://framerusercontent.com/images/rioDBjHp4Ker1doqwtmPpPW9o.jpg?scale-down-to=2048"
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
              objectPosition: "center",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: "none",
          inset: "0 0 -1px",
          mixBlendMode: "screen",
          position: "absolute",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            borderRadius: "inherit",
            top: 0, right: 0, bottom: 0, left: 0,
            backgroundRepeat: "repeat",
            backgroundPosition: "left top",
            backgroundSize: "128px auto",
            backgroundImage: "url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png)",
            border: 0,
          }}
        />
      </div>
    </section>
  )
}
