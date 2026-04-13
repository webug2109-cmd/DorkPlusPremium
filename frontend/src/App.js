import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DorkGenerator from './components/DorkGenerator';
import WebCrawler from './components/WebCrawler';
import KeywordGenerator from './components/KeywordGenerator';
import SqliScanner from './components/SqliScanner';
import Dumper from './components/Dumper';
import TasksManager from './components/TasksManager';
import Utilities from './components/Utilities';
import Settings from './components/Settings';
import { Toaster } from './components/ui/toaster';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'dork-generator':
        return <DorkGenerator />;
      case 'crawler':
        return <WebCrawler />;
      case 'keyword-generator':
        return <KeywordGenerator />;
      case 'sqli-scanner':
        return <SqliScanner />;
      case 'dumper':
        return <Dumper />;
      case 'tasks':
        return <TasksManager />;
      case 'utilities':
        return <Utilities />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050506] overflow-hidden">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <div className="flex-1 overflow-y-auto">
        {renderModule()}
      </div>
      <Toaster />
    </div>
  );
}

export default App;
