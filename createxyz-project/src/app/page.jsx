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
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = useCallback(
    async (file) => {
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

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    },
    [handleImageUpload]
  );

  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    try {
      let response;
      if (filterType === "ghibli") {
        response = await fetch("/api/process-ghibli-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: selectedImage,
          }),
        });
      } else {
        response = await fetch("/api/process-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: selectedImage,
            filterType,
            settings,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to process image");
      }

      setProcessedImage(data.processedUrl);
    } catch (err) {
      console.error("Processing error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedImage, filterType, settings]);

  const getFilterStyle = (type, intensity) => {
    const value = intensity / 100;
    switch (type) {
      case "grayscale":
        return { filter: `grayscale(${value})` };
      case "sepia":
        return { filter: `sepia(${value})` };
      case "blur":
        return { filter: `blur(${value * 10}px)` };
      case "contrast":
        return { filter: `contrast(${100 + value * 100}%)` };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f4ff] via-[#f9f2ff] to-[#fff5e6] p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1a6ea7] mb-4">
          Ghibli Photo Enchanter
        </h1>
        <p className="text-[#5c7a8d]">
          Transform your photos with the magic of Studio Ghibli
        </p>
      </div>

      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-4 border-dashed transition-all duration-200 ${
                dragActive
                  ? "border-[#1a6ea7] bg-blue-50/50"
                  : "border-[#c8dae6]"
              }`}
            >
              <label className="block p-8 text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files[0])
                  }
                  className="hidden"
                />
                <div className="text-[#1a6ea7]">
                  {uploadLoading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1a6ea7] border-t-transparent mx-auto" />
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-4xl mb-4"></i>
                      <p>Drop your image here or click to upload</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="space-y-6 bg-white/50 p-6 rounded-2xl">
              <div>
                <label className="block text-[#5c7a8d] mb-2">
                  Filter Style
                </label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setProcessedImage(null);
                  }}
                  className="w-full p-3 rounded-lg border border-[#c8dae6] bg-white/70"
                >
                  <option value="grayscale">Monochrome Magic</option>
                  <option value="sepia">Nostalgic Warmth</option>
                  <option value="blur">Dreamy Haze</option>
                  <option value="contrast">Vibrant Spirit</option>
                  <option value="ghibli">Ghibli Dream AI</option>
                </select>
              </div>

              <div>
                <label className="block text-[#5c7a8d] mb-2">
                  Magic Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.intensity}
                  onChange={(e) => {
                    const newSettings = {
                      ...settings,
                      intensity: parseInt(e.target.value),
                    };
                    setSettings(newSettings);
                  }}
                  className="w-full accent-[#1a6ea7]"
                />
              </div>

              <button
                onClick={processImage}
                disabled={!selectedImage || loading}
                className="w-full bg-[#1a6ea7] text-white py-4 rounded-lg hover:bg-[#15597c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                    {filterType === "ghibli"
                      ? "Creating Ghibli Magic..."
                      : "Enchanting..."}
                  </div>
                ) : filterType === "ghibli" ? (
                  "Transform to Ghibli Style"
                ) : (
                  "Transform Image"
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-white/50 p-4 rounded-2xl">
              <h3 className="text-[#5c7a8d] mb-2">Original Image</h3>
              <div className="aspect-square rounded-xl border-2 border-[#c8dae6] overflow-hidden bg-white/30">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8fa3b4]">
                    Your image will appear here
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/50 p-4 rounded-2xl">
              <h3 className="text-[#5c7a8d] mb-2">Enchanted Image</h3>
              <div className="aspect-square rounded-xl border-2 border-[#c8dae6] overflow-hidden bg-white/30">
                {selectedImage ? (
                  filterType === "ghibli" ? (
                    processedImage ? (
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8fa3b4]">
                        Click "Transform to Ghibli Style" to process with AI
                      </div>
                    )
                  ) : (
                    <img
                      src={selectedImage}
                      alt="Processed"
                      className="w-full h-full object-cover"
                      style={getFilterStyle(filterType, settings.intensity)}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8fa3b4]">
                    Transformed image will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;