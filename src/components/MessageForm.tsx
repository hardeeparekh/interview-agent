"use client";

import React, { useState } from "react";

export default function MessageForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.error || "Failed to send message");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mb-20">
      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-lg border border-white/10">
        <h3 className="text-white font-bold text-xl mb-6 tracking-tight">Send us a Message</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>

        <div className="mb-6">
          <textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:border-blue-500/50 transition-all resize-none"
          />
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
