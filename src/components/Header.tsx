import { Link } from 'react-router-dom';
import { Trophy, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useSupabaseAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold vip-gradient bg-clip-text text-transparent">
              FixedPronos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/pronos/today" className="text-foreground hover:text-primary transition-colors">
                  Pronos
                </Link>
                <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
                  Tarifs
                </Link>
                <Link to="/account" className="text-foreground hover:text-primary transition-colors">
                  Mon Compte
                </Link>
                <Link to="/referral" className="text-foreground hover:text-primary transition-colors">
                  Parrainage
                </Link>
                <Button variant="outline" onClick={logout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
                  Tarifs
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline">Connexion</Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="btn-vip">S'inscrire</Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-4 border-t border-border">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/pronos/today" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pronos
                </Link>
                <Link 
                  to="/pricing" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tarifs
                </Link>
                <Link 
                  to="/account" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon Compte
                </Link>
                <Link 
                  to="/referral" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Parrainage
                </Link>
                <Button variant="outline" onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/pricing" 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tarifs
                </Link>
                <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Connexion</Button>
                </Link>
                <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="btn-vip w-full">S'inscrire</Button>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
