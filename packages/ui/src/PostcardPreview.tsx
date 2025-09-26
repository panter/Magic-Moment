"use client";

import { useState } from "react";
import { Button } from "./button";

interface PostcardPreviewProps {
  frontImage: string | null;
  message?: string;
  recipientName?: string;
  recipientAddress?: string;
  className?: string;
}

export function PostcardPreview({
  frontImage,
  message = "Wishing you all the best from Switzerland!",
  recipientName = "John Doe",
  recipientAddress = "123 Main Street\n8001 Zurich\nSwitzerland",
  className = "",
}: PostcardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className={`${className}`}>
      <div className="relative w-full max-w-[420px] mx-auto">
        <div className="preserve-3d transition-transform duration-700" style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          position: "relative",
          width: "100%",
          aspectRatio: "148 / 105",
        }}>
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white" style={{
            backfaceVisibility: "hidden",
          }}>
            {frontImage ? (
              <img
                src={frontImage}
                alt="Postcard front"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <p className="text-gray-500 text-lg">No image selected</p>
              </div>
            )}
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rounded-lg shadow-2xl overflow-hidden bg-white" style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}>
            <div className="w-full h-full p-4 flex">
              {/* Left side - Message */}
              <div className="w-1/2 pr-3 flex flex-col">
                <div className="flex-1">
                  <p className="text-xs text-gray-700 font-handwriting leading-relaxed">
                    {message}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Sent with ❤️ from Switzerland</p>
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
                    <p className="text-sm font-semibold text-gray-800 mb-1">{recipientName}</p>
                    <p className="text-xs text-gray-700 whitespace-pre-line">{recipientAddress}</p>
                  </div>
                </div>
              </div>
            </div>
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