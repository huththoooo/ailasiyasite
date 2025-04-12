async function handler({ imageUrl, filterType, settings = {} }) {
  if (!imageUrl || !filterType) {
    return { error: "Image URL and filter type are required" };
  }

  const validFilters = ["grayscale", "sepia", "blur", "contrast", "ghibli"];
  if (!validFilters.includes(filterType)) {
    return { error: "Invalid filter type" };
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b87b9689dbd866e9768969",
        input: {
          image: imageUrl,
          filter: filterType,
          ...settings,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();

    let processedUrl;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to check prediction status");
      }

      const status = await statusResponse.json();

      if (status.status === "succeeded" && status.output) {
        processedUrl = status.output;
        break;
      }

      if (status.status === "failed") {
        throw new Error("Image processing failed");
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!processedUrl) {
      throw new Error("Processing timeout");
    }

    const savedImage = await sql`
      INSERT INTO processed_images 
        (original_url, processed_url, filter_type, filter_settings)
      VALUES 
        (${imageUrl}, ${processedUrl}, ${filterType}, ${JSON.stringify(
      settings
    )})
      RETURNING *
    `;

    return {
      originalUrl: imageUrl,
      processedUrl,
      filterType,
      settings,
      id: savedImage[0].id,
    };
  } catch (error) {
    console.error("Processing error:", error);
    return {
      error: error.message || "An unexpected error occurred",
    };
  }
}