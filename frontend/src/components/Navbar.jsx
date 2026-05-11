import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/analyzer', label: 'Analyzer' },
  { path: '/reports', label: 'Reports' },
  { path: '/about', label: 'About' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(var(--color-primary), 0.15)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="font-bold text-xl gradient-text">SafeIntern AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  location.pathname === link.path
                    ? {
                        background: isDark ? 'rgba(142,36,170,0.2)' : 'rgba(102,85,118,0.12)',
                        color: 'var(--color-primary)',
                        boxShadow: '0 0 16px rgba(var(--glow-primary), 0.3)',
                      }
                    : { color: 'var(--text-muted)' }
                }
                onMouseEnter={(e) => {
                  if (location.pathname !== link.path) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(102,85,118,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== link.path) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl transition-all duration-300 hover:scale-110 hover-lift"
              style={{
                background: isDark ? 'rgba(232,101,183,0.12)' : 'rgba(235,205,165,0.35)',
                border: '1px solid var(--border-color)',
                color: isDark ? '#E865B7' : '#665576',
              }}
            >
              {isDark ? (
                <Sun className="w-5 h-5 animate-theme-toggle" />
              ) : (
                <Moon className="w-5 h-5 animate-theme-toggle" />
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium transition-all"
              style={
                location.pathname === link.path
                  ? {
                      background: isDark ? 'rgba(142,36,170,0.2)' : 'rgba(102,85,118,0.12)',
                      color: 'var(--color-primary)',
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

