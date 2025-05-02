import { Button } from "./ui/button";
import UserButton from "./UserButton";
import { MessageSquare, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/chat",
      emoji: "💬"
    },
    {
      label: "Annonces",
      icon: Bell,
      href: "/announcements",
      emoji: "📢"
    },
    {
      label: "Mon Profil",
      icon: User,
      href: "/profile",
      emoji: "👤"
    }
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <a href="" className="flex items-center space-x-2 mr-6">
          <span className="text-xl font-bold text-primary tracking-tight">
            FSTS Assistant
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="flex-1 flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                location.pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/60"
              )}
            >
              <span className="mr-2">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Button */}
        <div className="flex items-center space-x-2">
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
