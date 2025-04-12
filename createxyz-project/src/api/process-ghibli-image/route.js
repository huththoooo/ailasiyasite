async function handler({ imageUrl }) {
  if (!imageUrl) {
    return { error: "Image URL is required" };
  }

  try {
    const prompt =
      "Transform this image into Studio Ghibli animation style, maintaining the same composition but with Ghibli's signature soft colors, hand-drawn aesthetic, and magical atmosphere";

    // Call Stable Diffusion
    const response = await fetch(
      `/integrations/stable-diffusion-v-3/?prompt=${encodeURIComponent(
        prompt
      )}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to process image with Stable Diffusion");
    }

    const data = await response.json();

    if (!data || !data.data || !data.data[0]) {
      throw new Error("No processed image received from Stable Diffusion");
    }

    const processedUrl = data.data[0];

    // Save to database
    const savedImage = await sql`
      INSERT INTO processed_images 
        (original_url, processed_url, filter_type, filter_settings)
      VALUES 
        (${imageUrl}, ${processedUrl}, 'ghibli', ${JSON.stringify({
      prompt,
    })})
      RETURNING *
    `;

    return {
      originalUrl: imageUrl,
      processedUrl,
      id: savedImage[0].id,
    };
  } catch (error) {
    console.error("Processing error:", error);
    return {
      error:
        error.message ||
        "An unexpected error occurred while processing the image",
    };
  }
}