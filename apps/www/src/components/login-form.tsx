"use client";

import { useState, useEffect } from "react";
import { login, register } from "@/app/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface OAuthProvider {
  name: string;
  icon: string;
  enabled: boolean;
}

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const router = useRouter();

  // Fetch available providers on mount
  useEffect(() => {
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(data => {
        const providerList: OAuthProvider[] = [
          { name: "google", icon: "🔍", enabled: data.google },
          { name: "github", icon: "🐙", enabled: data.github },
          { name: "apple", icon: "🍎", enabled: data.apple },
          { name: "linkedin", icon: "💼", enabled: data.linkedin },
        ];
        setProviders(providerList.filter(p => p.enabled));
      })
      .catch(err => console.error("Failed to fetch providers:", err));
  }, []);

  // Reset form when switching between login and signup
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = isLogin
        ? await login(email, password)
        : await register(email, password);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/designs" });
    } catch (error) {
      setError("Failed to sign in with provider");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with visual distinction */}
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${isLogin ? 'text-blue-600' : 'text-green-600'}`}>
          {isLogin ? 'Welcome Back!' : 'Create Your Account'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isLogin ? 'Sign in to continue to your account' : 'Sign up to get started'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 ${
              isLogin ? 'focus:ring-blue-500' : 'focus:ring-green-500'
            } focus:border-transparent placeholder-gray-400`}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 ${
              isLogin ? 'focus:ring-blue-500' : 'focus:ring-green-500'
            } focus:border-transparent placeholder-gray-400`}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white ${
            isLogin
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : isLogin ? (
            "Sign In to Your Account"
          ) : (
            "Create Account"
          )}
        </button>

        {/* OAuth Providers Section */}
        {providers.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  type="button"
                  onClick={() => handleOAuthSignIn(provider.name)}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <span className="text-xl mr-2">{provider.icon}</span>
                  <span className="capitalize">{provider.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className={`font-medium ${
              isLogin
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-green-600 hover:text-green-700'
            }`}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
