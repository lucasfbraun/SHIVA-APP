import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  BarChart3, 
  Camera,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Comandas', href: '/comandas', icon: FileText },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'OCR Cupom', href: '/ocr', icon: Camera },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-primary/95 backdrop-blur-sm border-b border-purple-primary/30">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.jpeg" 
                alt="SHIVA" 
                className="w-16 h-16 rounded-lg object-cover shadow-glow-purple-sm"
              />
              <h1 className="font-title text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-highlight to-purple-primary bg-clip-text text-transparent">
                SHIVA
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-purple-primary text-white shadow-glow-purple-sm' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-text-primary hover:bg-background-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-purple-primary/30 bg-background-primary">
            <nav className="container-main py-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-purple-primary text-white shadow-glow-purple-sm' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container-main py-6 md:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-primary/30 mt-auto">
        <div className="container-main py-6">
          <p className="text-center text-text-secondary text-sm">
            © 2026 SHIVA - Sistema de Gestão para Conveniências
          </p>
        </div>
      </footer>
    </div>
  );
}
