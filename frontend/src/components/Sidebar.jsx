import React from 'react';
import { Home, Search, Globe, Key, Shield, Database, Settings, FileText, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = ({ activeModule, setActiveModule }) => {
  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'dork-generator', name: 'Dork Generator', icon: Search },
    { id: 'crawler', name: 'Web Crawler', icon: Globe },
    { id: 'keyword-generator', name: 'Keyword Generator', icon: Key },
    { id: 'sqli-scanner', name: 'SQLi Scanner', icon: Shield },
    { id: 'dumper', name: 'Dumper', icon: Database },
    { id: 'tasks', name: 'Tasks', icon: FileText },
    { id: 'utilities', name: 'Utilities', icon: Zap },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#0a0a0b] border-r border-gray-800 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">DorkPlus</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">Security Testing Suite</p>
      </div>

      <div className="px-3 mb-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Zap className="w-4 h-4" />
            <span className="font-medium">2000+ Satisfied Users</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
          Workspace
        </div>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeModule === module.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{module.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between mb-1">
            <span>Active Scans</span>
            <span className="text-blue-400 font-medium">3</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
