"use client"; // This makes it a Client Component since it uses hooks

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [typedText, setTypedText] = useState("");
  const [error, setError] = useState("");
  const fullText = "Trello, task management made simple.";
  const router = useRouter();

  // Environment variable for API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  // Typing effect
  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, []);

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      console.log("Attempting login with:", { email, password });
      const response = await axios.post(`${API_URL}/login`, { email, password });
      console.log("Login response:", response.data);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        router.push("/dashboard");
      } else {
        setError("No token received from server.");
      }
    } catch (error: any) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      setError(
        error.response?.data?.error ||
          "Login failed. Please check your connection or credentials."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">{typedText}</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full"
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/create-account">
            <Button variant="outline" className="w-full">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}