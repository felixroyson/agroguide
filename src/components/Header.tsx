import { useState } from "react";
import { Leaf, Wheat, Search, User, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  mode: 'home' | 'agriculture';
  onModeChange: (mode: 'home' | 'agriculture') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  isAdmin?: boolean;
}

export const Header = ({
  mode,
  onModeChange,
  searchQuery,
  onSearchChange,
  userName = "Guest",
  isAdmin = false
}: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-primary-foreground animate-float" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AgroGuide</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your smart plant companion
              </p>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${mode === 'home' ? 'house plants' : 'crops'}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 bg-muted/50 border-none focus:bg-background transition-smooth"
              />
            </div>
          </div>

          {/* Mode Toggle & User Menu */}
          <div className="flex items-center space-x-3">
            {/* Mode Toggle */}
            <div className="hidden sm:flex items-center space-x-1 bg-muted p-1 rounded-lg">
              <Button
                variant={mode === 'home' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('home')}
                className="transition-smooth text-sm"
              >
                <Leaf className="w-4 h-4 mr-1" />
                Home 🌿
              </Button>
              <Button
                variant={mode === 'agriculture' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('agriculture')}
                className="transition-smooth text-sm"
              >
                <Wheat className="w-4 h-4 mr-1" />
                Agriculture 🌾
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="hidden sm:block font-medium">{userName}</span>
                  {isAdmin && (
                    <Badge variant="secondary" className="hidden sm:block text-xs">
                      Admin
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Leaf className="w-4 h-4 mr-2" />
                  My Plants
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem>
                      <Menu className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search & Mode Toggle */}
        {isMenuOpen && (
          <div className="sm:hidden mt-4 space-y-3 pb-3 border-t pt-3 animate-fade-in">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${mode === 'home' ? 'house plants' : 'crops'}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>

            {/* Mobile Mode Toggle */}
            <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
              <Button
                variant={mode === 'home' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('home')}
                className="flex-1 transition-smooth"
              >
                <Leaf className="w-4 h-4 mr-1" />
                Home 🌿
              </Button>
              <Button
                variant={mode === 'agriculture' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange('agriculture')}
                className="flex-1 transition-smooth"
              >
                <Wheat className="w-4 h-4 mr-1" />
                Agriculture 🌾
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};