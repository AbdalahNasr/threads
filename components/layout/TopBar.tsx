"use client";

import Link from "next/link";
import Image from "next/image";

// Inline SearchBar component
const SearchBar = () => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search..."
        className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
  );
};

// Inline ThemeToggle component
const ThemeToggle = () => {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </button>
  );
};

interface TopBarProps {
  currentUser: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
}

export default function TopBar({ currentUser }: TopBarProps) {
  // Simple dark mode detection
  const isDarkMode = () => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-30 ${
        isDarkMode() ? "bg-gray-900 text-white" : "bg-white text-black"
      } border-b shadow-sm`}
    >
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          <h1 className="text-xl font-bold hidden sm:block">ConnectHub</h1>
        </Link>

        <div className="flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Link href={`/profile/${currentUser.id}`}>
            <div className="flex items-center gap-2 cursor-pointer">
              <Image
                src={currentUser.image}
                alt={currentUser.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-medium hidden md:block">
                {currentUser.name}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
