const headers = {
  "Content-Type": "application/json",
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

exports.handler = async (event) => {
  // Allow browser preflight
  if (event.httpMethod === "OPTIONS") {
    return response(204, {});
  }

  // Only POST is allowed
  if (event.httpMethod !== "POST") {
    return response(405, {
      error: "POST request required."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const story = String(body.story || "").trim();

    if (!story) {
      return response(400, {
        error: "Please enter a story."
      });
    }

    const style = body.style || "2D cinematic";
    const format = body.format || "9:16";
    const length = Number(body.length) || 30;
    const voice = body.voice || "Assamese male";

    // DEMO MODE
    // This guarantees valid JSON even when no AI API key is connected.
    const sceneCount =
      length <= 30 ? 4 :
      length <= 60 ? 6 : 8;

    const sceneNames = [
      "Opening",
      "The journey",
      "A discovery",
      "Turning point",
      "Emotional moment",
      "Resolution",
      "Celebration",
      "Final shot"
    ];

    const scenes = [];

    for (let i = 0; i < sceneCount; i++) {
      scenes.push({
        title: sceneNames[i],
        description:
          `Scene ${i + 1} of an Assamese story. ` +
          `Keep the same characters, clothing and environment throughout.`,

        tags: [
          "Assam",
          "Assamese culture",
          "consistent character",
          style,
          format
        ],

        video_prompt:
          `${style} animation in authentic Assam. ` +
          `Assamese people, Assamese environment, respectful Assamese culture, ` +
          `Mekhela Sador or traditional Assamese clothing where appropriate. ` +
          `Tea gardens, paddy fields, bamboo houses, forests or Brahmaputra ` +
          `when suitable. Keep the character consistent. ` +
          `Story: ${story}. Scene ${i + 1}.`,

        voice_line:
          voice === "No voice"
            ? ""
            : `Narration in ${voice}: ${story}`
      });
    }

    return response(200, {
      success: true,
      demo: true,
      summary: `${style} Assamese animation`,
      story,
      style,
      format,
      length,
      voice,
      scenes
    });

  } catch (error) {
    return response(500, {
      success: false,
      error: error.message || "Generation failed."
    });
  }
};
