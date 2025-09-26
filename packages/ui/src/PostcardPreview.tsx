"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./button";
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
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

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
      <div className="relative w-full max-w-[420px] mx-auto">
        <div
          className="preserve-3d transition-transform duration-700"
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transformStyle: "preserve-3d",
            position: "relative",
            width: "100%",
            aspectRatio: "148 / 105",
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white"
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
                    className={`absolute inset-0 w-full h-full ${onOverlayUpdate ? "" : "pointer-events-none"}`}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                    style={{ cursor: draggingOverlay ? "grabbing" : "default" }}
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
                            fontSize={`${overlay.fontSize / 4}px`}
                            fontFamily={fontFamilyMap[overlay.fontFamily]}
                            fill={overlay.color}
                            stroke={overlay.strokeColor}
                            strokeWidth={overlay.strokeWidth}
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
                              pointerEvents: onOverlayUpdate ? "auto" : "none",
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
                              const lineHeight = overlay.fontSize / 3.5;
                              const startY =
                                (-(lines.length - 1) * lineHeight) / 2;

                              return lines.map((line, i) => (
                                <tspan
                                  key={i}
                                  x={`${displayX}%`}
                                  dy={
                                    i === 0 ? `${startY}px` : `${lineHeight}px`
                                  }
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
                  value={`${
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000"
                  }/designs/${designId}`}
                  size={48}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="w-full h-full p-4 flex">
              {/* Left side - Message */}
              <div className="w-1/2 pr-3 flex flex-col">
                <div className="flex-1">
                  <p className="text-xs text-gray-700 font-handwriting leading-relaxed">
                    {message}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Sent with ❤️ from Switzerland
                  </p>
                </div>
              </div>

              {/* Divider line */}
              <div className="w-px bg-gray-300"></div>

              {/* Right side - Address and Stamp */}
              <div className="w-1/2 pl-3 flex flex-col">
                {/* Stamp area */}
                <div className="self-end mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-sm shadow-md flex items-center justify-center transform rotate-3">
                    <div className="text-white text-center">
                      <div className="text-xs font-bold">SWISS</div>
                      <div className="text-lg font-bold">POST</div>
                      <div className="text-xs">CHF 1.20</div>
                    </div>
                  </div>
                </div>

                {/* Recipient Address */}
                <div className="flex-1 flex items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      {recipientName}
                    </p>
                    <p className="text-xs text-gray-700 whitespace-pre-line">
                      {recipientAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code on Back */}
            {designId && (
              <div className="absolute bottom-2 left-2 bg-white p-1.5 rounded-sm shadow-lg">
                <QRCodeSVG
                  value={`${
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3001"
                  }/designs/${designId}`}
                  size={48}
                  level="M"
                  includeMargin={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Flip Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={() => setIsFlipped(!isFlipped)}
            variant="secondary"
            size="sm"
          >
            {isFlipped ? "Show Front" : "Show Back"}
          </Button>
        </div>
      </div>
    </div>
  );
}
