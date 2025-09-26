"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        AI Chat Example with Anthropic
      </h1>

      <div className="flex flex-col space-y-4 mb-8 min-h-[400px] border border-gray-200 rounded-lg p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">
            No messages yet. Start a conversation!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-100 ml-auto max-w-[70%]"
                  : "bg-gray-100 mr-auto max-w-[70%]"
              }`}
            >
              <div className="font-semibold mb-1">
                {m.role === "user" ? "You" : "AI"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-4">
        <input
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Note: You need to set the ANTHROPIC_API_KEY environment variable for
        this to work.
      </p>
    </div>
  );
}
