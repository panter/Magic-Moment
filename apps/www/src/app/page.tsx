import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#ffcc02]">
                PostcardMaker
              </h1>
            </div>
            <div className="flex gap-4">
              {user ? (
                <>
                  <Link
                    href="/designs"
                    className="text-gray-700 hover:text-[#ffcc02] px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    My Designs
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      const { logout } = await import("@/app/actions/auth");
                      await logout();
                    }}
                  >
                    <button
                      type="submit"
                      className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/designs"
                  className="bg-[#ffcc02] hover:bg-[#e6b800] text-black px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Beautiful
            <span className="block text-[#ffcc02]">Postcards</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Design stunning postcards and send them to your friends and family.
            Personalize your messages with our intuitive design tools.
          </p>
          <Link
            href="/designs"
            className="inline-block bg-[#ffcc02] hover:bg-[#e6b800] text-black px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Start Creating
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-[#ffcc02]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Custom Designs
            </h3>
            <p className="text-gray-600">
              Create unique postcard designs with our easy-to-use design tools
              and templates.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Send Anywhere
            </h3>
            <p className="text-gray-600">
              Send your postcards to friends and family anywhere in Switzerland
              and beyond.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Personal Touch
            </h3>
            <p className="text-gray-600">
              Add personal messages and memories to make your postcards truly
              special.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to create your first postcard?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already creating and sending
            beautiful postcards to their loved ones.
          </p>
          <Link
            href="/designs"
            className="inline-block bg-[#ffcc02] hover:bg-[#e6b800] text-black px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
}
