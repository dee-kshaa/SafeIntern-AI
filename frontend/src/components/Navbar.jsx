import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Sun, Moon } from 'lucide-react';
import useTheme from '../contexts/useTheme';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/analyzer', label: 'Analyzer' },
  { path: '/market-intelligence', label: 'Market Intelligence' },
  { path: '/reports', label: 'Reports' },
  { path: '/about', label: 'About' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const getNavStyle = (active) => {
    if (active) {
      return {
        color: 'var(--color-primary)',
        background: 'color-mix(in srgb, var(--color-primary) 14%, transparent)',
        boxShadow: '0 0 16px color-mix(in srgb, var(--color-primary) 36%, transparent)',
      };
    }

    return { color: 'var(--text-muted)' };
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0 transition-theme">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="p-2 rounded-lg transition-theme"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="font-bold text-xl gradient-text">SafeIntern AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-theme hover-lift"
                  style={getNavStyle(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary)',
              }}
            >
              {isDark ? (
                <Sun className="w-5 h-5 animate-theme-toggle" />
              ) : (
                <Moon className="w-5 h-5 animate-theme-toggle" />
              )}
            </button>

            <button
              className="md:hidden p-2 rounded-lg transition-theme"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium transition-theme"
                style={getNavStyle(active)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
