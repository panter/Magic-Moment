"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getDesignById } from "@/app/actions/designs";
import { notFound } from "next/navigation";

// Dynamic import for Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@repo/ui").then((mod) => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DesignLandingPage({ params }: PageProps) {
  const [design, setDesign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    async function loadDesign() {
      const resolvedParams = await params;
      const id = resolvedParams.id;

      try {
        const designData = await getDesignById(id);
        if (!designData) {
          setError(true);
          return;
        }
        setDesign(designData);
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadDesign();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    notFound();
  }

  // Get the image URL
  const imageUrl = design.frontImage?.url || null;
  const videoUrl = design.videoUrl || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✉️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Magic Moment</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Postcard Image or Video */}
          {videoUrl ? (
            <div className="relative w-full aspect-[148/105] overflow-hidden bg-black">
              <video
                src={videoUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>

              {/* Mute/Unmute button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full aspect-[148/105] overflow-hidden">
              <img
                src={imageUrl}
                alt={design.name || "Postcard"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          ) : null}

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {design.name || "Magic Postcard"}
              </h2>
            </div>

            {/* Message */}
            {design.defaultMessage && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-3">
                  Message
                </h3>
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-serif italic">
                  "{design.defaultMessage}"
                </p>
              </div>
            )}

            {/* Category Badge */}
            {design.category && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 capitalize">
                  {design.category}
                </span>
              </div>
            )}

            {/* Location Map */}
            {design.latitude && design.longitude && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {design.locationName || "Photo Location"}
                  </h3>
                </div>
                <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  <Map
                    latitude={design.latitude}
                    longitude={design.longitude}
                    locationName={design.locationName}
                    height="400px"
                  />
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold mb-2">
                  Send Your Own Magic Moment!
                </h3>
                <p className="text-yellow-100 mb-4">
                  Create beautiful postcards with AI-powered designs
                </p>
                <a
                  href="/"
                  className="inline-block bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
                >
                  Get Started
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-4">
              <p>Created with ❤️ by Swiss Post • Magic Moment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
