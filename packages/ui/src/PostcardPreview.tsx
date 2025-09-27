"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import type { Overlay } from "./OverlayEditor";

interface PostcardPreviewProps {
  frontImage: string | null;
  message?: string;
  recipientName?: string;
  recipientAddress?: string;
  designId?: string;
  className?: string;
  overlays?: Overlay[];
  onOverlayUpdate?: (
    overlayId: string,
    updates: { x: number; y: number },
  ) => void;
  selectedOverlayId?: string | null;
  onOverlaySelect?: (overlayId: string) => void;
  rootUrl: string;
}

export function PostcardPreview({
  frontImage,
  message = "Wishing you all the best from Switzerland!",
  recipientName = "John Doe",
  recipientAddress = "123 Main Street\n8001 Zurich\nSwitzerland",
  designId,
  className = "",
  overlays = [],
  onOverlayUpdate,
  selectedOverlayId,
  rootUrl,
  onOverlaySelect,
}: PostcardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [draggingOverlay, setDraggingOverlay] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Debounced update function
  const debouncedUpdate = (overlayId: string, x: number, y: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (onOverlayUpdate) {
        onOverlayUpdate(overlayId, { x, y });
      }
    }, 100); // Update after 100ms of no movement
  };

  const handleMouseDown = (e: React.MouseEvent, overlayId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Notify parent that this overlay was selected
    if (onOverlaySelect) {
      onOverlaySelect(overlayId);
    }

    if (!svgRef.current || !onOverlayUpdate) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDraggingOverlay(overlayId);
    setDragStart({ x, y });

    const overlay = overlays.find((o) => o.id === overlayId);
    if (overlay) {
      setTempPosition({ id: overlayId, x: overlay.x, y: overlay.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingOverlay || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const overlay = overlays.find((o) => o.id === draggingOverlay);
    if (overlay && tempPosition) {
      const newX = Math.max(0, Math.min(100, currentX));
      const newY = Math.max(0, Math.min(100, currentY));

      setTempPosition({ id: draggingOverlay, x: newX, y: newY });
      debouncedUpdate(draggingOverlay, newX, newY);
    }
  };

  const handleMouseUp = () => {
    if (draggingOverlay && tempPosition && onOverlayUpdate) {
      onOverlayUpdate(draggingOverlay, {
        x: tempPosition.x,
        y: tempPosition.y,
      });
    }
    setDraggingOverlay(null);
    setTempPosition(null);
  };

  useEffect(() => {
    if (draggingOverlay) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!svgRef.current) return;

        const rect = svgRef.current.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;

        const overlay = overlays.find((o) => o.id === draggingOverlay);
        if (overlay && tempPosition) {
          const newX = Math.max(0, Math.min(100, currentX));
          const newY = Math.max(0, Math.min(100, currentY));

          setTempPosition({ id: draggingOverlay, x: newX, y: newY });
          debouncedUpdate(draggingOverlay, newX, newY);
        }
      };

      const handleGlobalMouseUp = () => {
        if (draggingOverlay && tempPosition && onOverlayUpdate) {
          onOverlayUpdate(draggingOverlay, {
            x: tempPosition.x,
            y: tempPosition.y,
          });
        }
        setDraggingOverlay(null);
        setTempPosition(null);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [draggingOverlay, tempPosition, overlays, onOverlayUpdate]);

  return (
    <div className={`${className}`}>
      <div className="relative w-full max-w-[420px] flex items-start gap-2">
        {/* 3D Perspective Container */}
        <div className="flex-1" style={{ perspective: "1000px" }}>
          <div
            className="preserve-3d transition-transform duration-700"
            style={{
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
              position: "relative",
              width: "100%",
              height: "auto",
              aspectRatio: "148 / 105",
            }}
          >
            {/* Front Side */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white"
              style={{
                backfaceVisibility: "hidden",
              }}
            >
              {frontImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={frontImage}
                    alt="Postcard front"
                    className="w-full h-full object-cover"
                  />

                  {/* SVG Overlay */}
                  {overlays.length > 0 && (
                    <svg
                      ref={svgRef}
                      className={`absolute inset-0 w-full h-full ${
                        onOverlayUpdate ? "" : "pointer-events-none"
                      }`}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid slice"
                      style={{
                        cursor: draggingOverlay ? "grabbing" : "default",
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      {overlays.map((overlay) => {
                        const fontFamilyMap = {
                          "sans-serif": "Arial, sans-serif",
                          serif: "Georgia, serif",
                          cursive: "'Brush Script MT', cursive",
                          display: "'Impact', sans-serif",
                        };

                        // Use temp position if this overlay is being dragged
                        const displayX =
                          tempPosition?.id === overlay.id
                            ? tempPosition.x
                            : overlay.x;
                        const displayY =
                          tempPosition?.id === overlay.id
                            ? tempPosition.y
                            : overlay.y;

                        return (
                          <g
                            key={overlay.id}
                            opacity={overlay.opacity}
                            style={{
                              cursor: onOverlayUpdate ? "grab" : "default",
                            }}
                          >
                            <text
                              x={`${displayX}%`}
                              y={`${displayY}%`}
                              fontSize={overlay.fontSize / 5}
                              fontFamily={fontFamilyMap[overlay.fontFamily]}
                              fill={overlay.color}
                              stroke={overlay.strokeColor}
                              strokeWidth={overlay.strokeWidth / 20}
                              textAnchor={
                                overlay.textAlign === "left"
                                  ? "start"
                                  : overlay.textAlign === "right"
                                    ? "end"
                                    : "middle"
                              }
                              dominantBaseline="middle"
                              transform={`rotate(${overlay.rotation}, ${displayX}, ${displayY})`}
                              style={{
                                paintOrder: "stroke fill",
                                fontWeight: "bold",
                                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                                pointerEvents: onOverlayUpdate
                                  ? "auto"
                                  : "none",
                                cursor: onOverlayUpdate ? "grab" : "default",
                              }}
                              onMouseDown={
                                onOverlayUpdate
                                  ? (e) => handleMouseDown(e, overlay.id)
                                  : undefined
                              }
                            >
                              {/* Split text into multiple lines - handle manual line breaks and auto-wrap */}
                              {(() => {
                                // First split by manual line breaks
                                const manualLines = overlay.text.split("\n");
                                const allLines: string[] = [];

                                // Then apply word wrapping to each manual line
                                const maxCharsPerLine = Math.max(
                                  8,
                                  Math.floor(45 / (overlay.fontSize / 24)),
                                );

                                manualLines.forEach((line) => {
                                  if (line.length <= maxCharsPerLine) {
                                    allLines.push(line);
                                  } else {
                                    // Word wrap long lines
                                    const words = line.split(" ");
                                    let currentLine = "";

                                    words.forEach((word) => {
                                      if (
                                        currentLine.length + word.length + 1 <=
                                        maxCharsPerLine
                                      ) {
                                        currentLine +=
                                          (currentLine ? " " : "") + word;
                                      } else {
                                        if (currentLine)
                                          allLines.push(currentLine);
                                        currentLine = word;
                                      }
                                    });
                                    if (currentLine) allLines.push(currentLine);
                                  }
                                });

                                const lines = allLines;

                                // If single line, just return it
                                if (lines.length === 1) {
                                  return overlay.text;
                                }

                                // Multiple lines - use tspan elements
                                const lineHeight = overlay.fontSize / 35;
                                const startY =
                                  (-(lines.length - 1) * lineHeight) / 2;

                                return lines.map((line, i) => (
                                  <tspan
                                    key={i}
                                    x={`${displayX}%`}
                                    dy={i === 0 ? startY : lineHeight}
                                    textAnchor={
                                      overlay.textAlign === "left"
                                        ? "start"
                                        : overlay.textAlign === "right"
                                          ? "end"
                                          : "middle"
                                    }
                                  >
                                    {line}
                                  </tspan>
                                ));
                              })()}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <p className="text-gray-500 text-lg">No image selected</p>
                </div>
              )}

              {/* QR Code on Front */}
              {designId && (
                <div className="absolute bottom-2 left-2 bg-white p-1.5 rounded-sm shadow-lg">
                  <QRCodeSVG
                    value={`${rootUrl}/designs/${designId}`}
                    size={48}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              )}
            </div>

            {/* Back Side */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <svg
                className="w-full h-full"
                viewBox="0 0 148 105"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Left side - Message */}
                <text
                  x="5"
                  y="15"
                  fontSize="3.5"
                  fill="#374151"
                  fontFamily="cursive"
                  style={{ maxWidth: "68px" }}
                >
                  {message.split('\n').map((line, index) => (
                    <tspan key={index} x="5" dy={index === 0 ? 0 : 4}>
                      {line.length > 30 ? line.substring(0, 30) + '...' : line}
                    </tspan>
                  ))}
                </text>

                <text
                  x="5"
                  y="90"
                  fontSize="3"
                  fill="#6B7280"
                  fontFamily="sans-serif"
                >
                  Sent with ❤️ from Switzerland
                </text>

                {/* Divider line */}
                <line x1="74" y1="10" x2="74" y2="95" stroke="#D1D5DB" strokeWidth="0.5" />

                {/* Right side - Stamp */}
                <g transform="translate(120, 15) rotate(3)">
                  <rect
                    x="0"
                    y="0"
                    width="20"
                    height="20"
                    fill="url(#stamp-gradient)"
                    rx="1"
                  />
                  <text
                    x="10"
                    y="6"
                    fontSize="3"
                    fill="white"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    SWISS
                  </text>
                  <text
                    x="10"
                    y="12"
                    fontSize="5"
                    fill="white"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    POST
                  </text>
                  <text
                    x="10"
                    y="17"
                    fontSize="3"
                    fill="white"
                    textAnchor="middle"
                  >
                    CHF 1.20
                  </text>
                </g>

                {/* Gradient definition for stamp */}
                <defs>
                  <linearGradient id="stamp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                </defs>

                {/* Recipient Address */}
                <text
                  x="80"
                  y="55"
                  fontSize="4"
                  fill="#1F2937"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {recipientName}
                </text>

                {recipientAddress.split('\n').map((line, index) => (
                  <text
                    key={index}
                    x="80"
                    y={62 + index * 4}
                    fontSize="3.5"
                    fill="#374151"
                    fontFamily="sans-serif"
                  >
                    {line}
                  </text>
                ))}
              </svg>

              {/* QR Code on Back */}
              {designId && (
                <div className="absolute bottom-2 left-2 bg-white p-1.5 rounded-sm shadow-lg">
                  <QRCodeSVG
                    value={`${rootUrl}/designs/${designId}`}
                    size={48}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Flip Button - round button with icon */}
        <div
          className="flex-shrink-0"
          style={{ paddingTop: "calc(105 / 148 * 50% - 20px)" }}
        >
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center shadow-md"
            title={isFlipped ? "Show Front" : "Show Back"}
            type="button"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
