import { ArrowLeft, Server, Zap } from 'lucide-react';

/**
 * Header — Top navigation bar with back-to-dashboard link and tabs
 */
export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="bg-surface-secondary/80 backdrop-blur-xl border-b border-border-default sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </a>
            <div className="w-px h-6 bg-border-default" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Server size={16} className="text-accent" />
              </div>
              <div>
                <h1 className="text-base font-bold text-text-primary leading-tight">Mock Server</h1>
                <p className="text-[10px] text-text-muted leading-none">API Mocking Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Zap size={12} className="text-emerald-400 animate-pulse" />
              <span>Engine Active</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 -mb-px">
          {[
            { id: 'endpoints', label: 'Endpoint Manager' },
            { id: 'inspector', label: 'Traffic Inspector' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
