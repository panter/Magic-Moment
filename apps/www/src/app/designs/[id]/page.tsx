import { getDesignById } from "@/app/actions/designs";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DesignLandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let design;
  try {
    design = await getDesignById(id);
    if (!design) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  // Get the image URL
  const imageUrl = design.frontImage?.url || null;

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
          {/* Postcard Image */}
          {imageUrl && (
            <div className="relative w-full aspect-[148/105] overflow-hidden">
              <img
                src={imageUrl}
                alt={design.name || "Postcard"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          )}

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