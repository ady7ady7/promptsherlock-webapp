import { useState } from 'react';
import ImageUploader from './components/ImageUploader';

function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="gradient-text text-6xl font-bold mb-4">
            AI Image Analyzer
          </h1>
          <p className="text-blue-200 text-xl animate-slide-up animate-delay-200">
            Upload and analyze your images with AI-powered insights
          </p>
        </header>
        
        {/* Main Content */}
        <main className="max-w-6xl mx-auto space-y-8">
          {/* Image Uploader */}
          <div className="animate-slide-up animate-delay-300">
            <ImageUploader
              onImagesChange={handleImagesChange}
              maxFiles={10}
              maxFileSize={10 * 1024 * 1024} // 10MB
              loading={isAnalyzing}
              className="max-w-4xl mx-auto"
            />
          </div>

          {/* Action Buttons */}
          {selectedImages.length > 0 && (
            <div className="flex justify-center space-x-4 animate-fade-in">
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
            </div>
          )}

          {/* Status Display */}
          <div className="text-center text-gray-300 animate-fade-in">
            {selectedImages.length === 0 ? (
              <p>No images selected. Upload images to get started.</p>
            ) : (
              <p>
                {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} ready for analysis
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;