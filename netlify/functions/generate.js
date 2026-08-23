const headers = {
  "Content-Type": "application/json; charset=UTF-8",
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

function makeStoryboard(story, options) {
  const count =
    options.length <= 30 ? 4 :
    options.length <= 60 ? 6 : 8;

  const titles = [
    "Opening",
    "The Journey",
    "A Discovery",
    "Turning Point",
    "Emotional Moment",
    "Resolution",
    "Celebration",
    "Final Shot"
  ];

  const scenes = [];

  for (let i = 0; i < count; i++) {
    scenes.push({
      title: titles[i],
      description:
        `Scene ${i + 1} of the story. Keep the same characters, faces, clothing, environment and visual style throughout the animation.`,

      tags: [
        "Assam",
        "Assamese",
        "consistent character",
        options.style,
        options.format
      ],

      video_prompt:
        `${options.style} animation. ` +
        `Create content rooted in Assam, India. ` +
        `Use authentic Assamese people and respectful Assamese culture. ` +
        `Prefer Mekhela Sador or traditional Assamese dhoti/kurta where appropriate. ` +
        `Use realistic Assam environments such as villages, tea gardens, ` +
        `paddy fields, bamboo houses, forests and the Brahmaputra. ` +
        `Keep characters visually consistent between scenes. ` +
        `Cinematic camera movement and natural expressions. ` +
        `Scene ${i + 1}: ${story}`,

      voice_line:
        options.voice === "No voice"
          ? ""
          : `Narration in ${options.voice} for scene ${i + 1}.`
    });
  }

  return {
    success: true,
    demo: true,
    story: story,
    summary: `${options.style} Assam-first animation storyboard`,
    style: options.style,
    format: options.format,
    duration: options.length,
    voice: options.voice,
    scenes: scenes
  };
}

exports.handler = async function(event) {

  // Handle browser preflight
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

    // Safely read request body
    let body = {};

    try {
      body = JSON.parse(event.body || "{}");
    } catch (err) {
      return response(400, {
        success: false,
        error: "Request body is not valid JSON."
      });
    }

    const story = String(body.story || "").trim();

    if (!story) {
      return response(400, {
        success: false,
        error: "Story is required."
      });
    }

    const options = {
      style: body.style || "2D cinematic",
      format: body.format || "9:16",
      length: Number(body.length) || 30,
      voice: body.voice || "Assamese male"
    };

    /*
      FIRST TEST:
      We return a guaranteed valid storyboard.

      This proves that:
      Browser → Netlify → generate.js → Browser

      is working correctly.

      We will connect the real AI providers AFTER this test passes.
    */

    const result = makeStoryboard(story, options);

    return response(200, result);

  } catch (error) {

    console.error("GENERATE FUNCTION ERROR:", error);

    return response(500, {
      success: false,
      error: error && error.message
        ? error.message
        : "Unknown server error."
    });
  }
};
