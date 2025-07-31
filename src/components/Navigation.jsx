import React from 'react';
import { Search } from 'lucide-react';

const Navigation = () => (
  <nav className="fixed top-0 w-full z-50 nav-glass p-4">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center">
        <Search className="w-8 h-8 text-blue-400 mr-3" />
        <span className="text-2xl font-bold text-white">PromptSherlock</span>
      </div>
      <div className="text-sm text-gray-300">WebApp</div>
    </div>
  </nav>
);

export default Navigation;