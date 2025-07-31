// FILE: src/components/AnalysisForm.jsx
import React from 'react';
import { Upload, Sparkles } from 'lucide-react';

const AnalysisForm = ({ apiUrl, onAnalysisComplete }) => (
  <div className="text-center p-8">
    <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
    <h3 className="text-3xl font-bold text-white mb-4">Analysis Form</h3>
    <p className="text-gray-300 mb-6">
      Components will be migrated in Phase 2!
    </p>
    <div className="glass-effect p-6 rounded-xl">
      <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
      <p className="text-white">
        Ready for image upload and AI analysis functionality.
      </p>
    </div>
  </div>
);

export default AnalysisForm;
