const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function response(statusCode, data) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

function getSize(format) {
  if (format === "16:9") {
    return { width: 1280, height: 720 };
  }

  if (format === "1:1") {
    return { width: 1024, height: 1024 };
  }

  return { width: 768, height: 1365 };
}

function buildPrompt(scene, story, style) {
  return `
Create a high-quality animation frame.

STYLE:
${style}

STORY:
${story}

SCENE:
${scene.title || ""}
${scene.description || ""}
${scene.video_prompt || ""}

IMPORTANT:
- Set the story in Assam, India.
- Use authentic Assamese people.
- Respect Assamese culture.
- Use Mekhela Sador or traditional Assamese clothing when appropriate.
- Use realistic Assam environments.
- Assam villages, tea gardens, paddy fields, bamboo houses,
  forests and the Brahmaputra may be used when appropriate.
- Keep the same characters, faces, clothing and appearance
  throughout all scenes.
- Cinematic composition.
- Natural expressions.
- Detailed environment.
- High-quality animation-film appearance.
- No text.
- No subtitles.
- No watermark.
- No logo.
`;
}

exports.handler = async function (event) {

  // OPTIONS / CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  // Only POST is allowed
  if (event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      error: "POST request required."
    });
  }

  try {

    // Read JSON safely
    let body = {};

    try {
      body = JSON.parse(event.body || "{}");
    } catch (error) {
      return response(400, {
        success: false,
        error: "Invalid JSON request."
      });
    }

    const story = String(body.story || "").trim();
    const style = String(body.style || "2D cinematic");
    const format = String(body.format || "9:16");
    const scenes = Array.isArray(body.scenes)
      ? body.scenes
      : [];

    if (!story) {
      return response(400, {
        success: false,
        error: "Story is required."
      });
    }

    if (!scenes.length) {
      return response(400, {
        success: false,
        error: "No scenes were supplied."
      });
    }

    /*
      IMPORTANT:
      The API key is NOT written here.

      Add this variable in:
      Netlify → Project configuration →
      Environment variables
    */

    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
      return response(500, {
        success: false,
        error:
          "POLLINATIONS_API_KEY is not configured in Netlify."
      });
    }

    const size = getSize(format);

    const images = [];

    for (let i = 0; i < scenes.length; i++) {

      const scene = scenes[i];

      const prompt = buildPrompt(
        scene,
        story,
        style
      );

      const encodedPrompt =
        encodeURIComponent(prompt);

      const imageUrl =
        "https://gen.pollinations.ai/image/" +
        encodedPrompt +
        "?model=flux" +
        "&width=" + size.width +
        "&height=" + size.height +
        "&nologo=true";

      images.push({
        scene: i + 1,
        title:
          scene.title ||
          "Scene " + (i + 1),

        prompt: prompt,

        imageUrl: imageUrl,

        provider: "Pollinations"
      });
    }

    return response(200, {
      success: true,
      provider: "Pollinations",
      story: story,
      style: style,
      format: format,
      images: images
    });

  } catch (error) {

    console.error(
      "Axomi-AI image error:",
      error
    );

    return response(500, {
      success: false,
      error:
        error.message ||
        "Image generation failed."
    });
  }
};
