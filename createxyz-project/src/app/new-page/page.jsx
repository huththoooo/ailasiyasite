"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [filterType, setFilterType] = useState("grayscale");
  const [settings, setSettings] = useState({ intensity: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setError(null);
      try {
        const { url, error: uploadError } = await upload({ file });
        if (uploadError) throw new Error(uploadError);
        setSelectedImage(url);
        setProcessedImage(null);
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to upload image: " + err.message);
      }
    },
    [upload]
  );

  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedImage,
          filterType,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to process image");
      }

      if (!data.processedUrl) {
        throw new Error("No processed image URL received");
      }

      setProcessedImage(data.processedUrl);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, filterType, settings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-50 p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Studio Ghibli Dream Weaver
        </h1>
        <p className="text-gray-600">
          Transform your photos into magical Ghibli-inspired artworks
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side - Upload and Controls */}
          <div className="flex-1">
            <div className="mb-8">
              <label className="block w-full p-8 border-4 border-dashed border-blue-200 rounded-xl text-center cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-blue-500">
                  {uploadLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto" />
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Upload your photo
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Filter Controls */}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  Select Filter
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="grayscale">Classic B&W</option>
                  <option value="sepia">Vintage Warmth</option>
                  <option value="blur">Dreamy Soft Focus</option>
                  <option value="contrast">Dramatic Punch</option>
                  <option value="ghibli">Ghibli Dream AI</option>
                </select>
              </div>

              {/* Intensity Slider */}
              <div>
                <label className="block text-gray-700 mb-2">
                  Effect Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.intensity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      intensity: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <button
                onClick={processImage}
                disabled={!selectedImage || loading}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-4 border-white border-t-transparent" />
                    Processing...
                  </div>
                ) : (
                  "Transform Image"
                )}
              </button>

              {error && (
                <div className="text-red-500 text-center mt-4 p-3 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Image Preview */}
          <div className="flex-1">
            <div className="aspect-square rounded-xl border-2 border-gray-200 overflow-hidden">
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-full object-cover"
                />
              ) : selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Preview will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .cursor-sparkle {
          position: fixed;
          pointer-events: none;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: float 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;