import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageUploader from './components/ImageUploader';
import AnalysisForm from './components/AnalysisForm';

function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [useAdvancedForm, setUseAdvancedForm] = useState(false);

  const handleImagesChange = (images) => {
    setSelectedImages(images);
    console.log('Images updated:', images);
  };

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // TODO: Implement API call to analyze images
      console.log('Analyzing images:', selectedImages);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Analysis complete! (This is a demo)');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = (results) => {
    console.log('Analysis completed:', results);
    // You can add additional logic here if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.h1 
            className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            AI Image Analyzer
          </motion.h1>
          
          <motion.p 
            className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          >
            Upload and analyze your images with AI-powered insights
          </motion.p>

          {/* Mode Toggle */}
          <motion.div 
            className="flex justify-center space-x-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button
              onClick={() => setUseAdvancedForm(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                !useAdvancedForm 
                  ? 'bg-blue-500 text-white shadow-glow' 
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Simple Mode
            </button>
            <button
              onClick={() => setUseAdvancedForm(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                useAdvancedForm 
                  ? 'bg-blue-500 text-white shadow-glow' 
                  : 'text-blue-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Advanced Form
            </button>
          </motion.div>
        </motion.header>
        
        {/* Main Content */}
        <motion.main 
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        >
          {useAdvancedForm ? (
            /* Advanced Form Mode - Full AnalysisForm Component */
            <AnalysisForm
              onAnalysisComplete={handleAnalysisComplete}
              apiUrl={import.meta.env.VITE_API_URL}
              initialState={{
                images: selectedImages,
                prompt: ''
              }}
            />
          ) : (
            /* Simple Mode - Your Original Implementation */
            <div className="space-y-8">
              {/* Image Uploader */}
              <div className="animate-slide-up animate-delay-300">
                <ImageUploader
                  onImagesChange={handleImagesChange}
                  initialImages={selectedImages}
                  maxFiles={10}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                  loading={isAnalyzing}
                  className="max-w-4xl mx-auto"
                />
              </div>

              {/* Action Buttons */}
              {selectedImages.length > 0 && (
                <motion.div 
                  className="flex justify-center space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="glow-button flex items-center space-x-2 px-8 py-4 text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="spinner w-5 h-5"></div>
                        <span>Analyzing Images...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedImages([])}
                    disabled={isAnalyzing}
                    className="btn-outline px-6 py-4 text-lg"
                  >
                    Clear All
                  </button>
                </motion.div>
              )}

              {/* Status Display */}
              <motion.div 
                className="text-center text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {selectedImages.length === 0 ? (
                  <p>No images selected. Upload images to get started.</p>
                ) : (
                  <p>
                    {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} ready for analysis
                  </p>
                )}
              </motion.div>

              {/* Upgrade Prompt */}
              {selectedImages.length > 0 && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p className="text-gray-400 text-sm mb-2">
                    Want to add custom prompts and see detailed results?
                  </p>
                  <button
                    onClick={() => setUseAdvancedForm(true)}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Try Advanced Form →
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.main>

        {/* Footer */}
        <motion.footer 
          className="text-center mt-16 pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <p className="text-gray-400 text-sm">
            Powered by Google Gemini AI • Built with React and Tailwind CSS
          </p>
        </motion.footer>
      </div>
    </div>
  );
}

export default App;