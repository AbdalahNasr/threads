"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { SuggestedUsers } from "@/components/user/SuggestedUsers";
import { ToastProvider } from "../ui/toast";

// Simple theme toggle button
const ThemeToggle = () => {
  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
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

// Simple theme provider for dark/light toggle
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Check for theme preference on client-side
  if (typeof window !== 'undefined') {
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    if (localStorage.theme === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  return <>{children}</>;
};

// Define the Sidebar component inline
const Sidebar = ({ currentUser }: { 
  currentUser: {
    id: string;
    name: string;
    username: string;
    image: string;
  }
}) => {
  const pathname = usePathname();
  
  // Base navigation items
  const sidebarItems = [
    {
      text: "Home",
      href: "/home",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      text: "Communities",
      href: "/communities",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      text: "Profile",
      href: `/profile/${currentUser.id}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      text: "Create",
      href: "/create-post",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-16 hidden md:flex flex-col border-r p-4">
      <nav className="flex flex-col gap-2 mt-4">
        {sidebarItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              pathname === item.href ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
            }`}
          >
            {item.icon}
            <span>{item.text}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t">
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Settings</span>
        </Link>
        
        <button 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left mt-2"
          onClick={() => {
            // Add your logout logic here
            console.log("Logging out...");
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default function MainLayout({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
}) {
  const pathname = usePathname();

  // Pages where we don't want the sidebar or right content
  const isFullWidthPage = ["/sign-in", "/sign-up", "/onboarding"].includes(
    pathname
  );

  if (isFullWidthPage) {
    return (
      <ToastProvider>
        <div>{children}</div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          <TopBar currentUser={currentUser} />

          <div className="flex flex-1 pt-16">
            {/* Left Sidebar */}
            <Sidebar currentUser={currentUser} />

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto px-4 py-6">{children}</main>

            {/* Right Sidebar */}
            <div className="hidden lg:block w-80 border-l p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl">Suggestions</h2>
                <ThemeToggle />
              </div>
              <SuggestedUsers currentUserId={currentUser.id} />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </ToastProvider>
  );
}
