
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const ASSAM_RULES = `
Create content rooted in Assam, India.
Use authentic Assamese people and respectful Assamese culture.
Prefer Mekhela Sador for women and traditional Assamese dhoti/kurta where appropriate.
Use realistic Assam environments such as villages, tea gardens, paddy fields,
bamboo houses, forests and the Brahmaputra.
Keep character faces, clothing and locations consistent between scenes.
Do not use stereotypical or disrespectful representations.
`;

function response(statusCode, data) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

function makeDemo(story, options) {
  const sceneCount =
    options.length <= 30 ? 4 :
    options.length <= 60 ? 6 : 8;

  const titles = [
    "Opening",
    "The Journey",
    "A Discovery",
    "The Turning Point",
    "Emotional Moment",
    "Resolution",
    "Celebration",
    "Final Shot"
  ];

  const scenes = [];

  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      scene: i + 1,
      title: titles[i] || `Scene ${i + 1}`,

      description:
        `Scene ${i + 1} of the story. Keep the same characters, ` +
        `faces, clothing, environment and visual style.`,

      tags: [
        "Assam",
        "Assamese",
        "consistent character",
        options.style,
        options.format
      ],

      video_prompt:
        `${options.style} animation. ${ASSAM_RULES}
        Story: ${story}
        Scene ${i + 1}.
        Maintain identical character appearance and clothing.
        Cinematic camera movement and natural expressions.`,

      voice_line:
        options.voice === "No voice"
          ? ""
          : `Narration in ${options.voice} for scene ${i + 1}.`
    });
  }

  return {
    success: true,
    demo: true,
    summary: `Assam-first ${options.style} animation`,
    story,
    style: options.style,
    format: options.format,
    duration: options.length,
    voice: options.voice,
    scenes
  };
}

async function generateWithAI(story, options) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const prompt = `
Create a professional animation storyboard.

STORY:
${story}

STYLE:
${options.style}

VIDEO FORMAT:
${options.format}

DURATION:
${options.length} seconds

VOICE:
${options.voice}

${ASSAM_RULES}

Return ONLY valid JSON.

Required structure:

{
  "summary": "string",
  "scenes": [
    {
      "scene": 1,
      "title": "string",
      "description": "string",
      "tags": ["string"],
      "video_prompt": "string",
      "voice_line": "string"
    }
  ]
}

Create enough scenes to cover the complete story.
`;

  const apiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,

        messages: [
          {
            role: "system",
            content:
              "You are Axomi-AI, a professional animation director specializing in Assamese stories."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    }
  );

  const text = await apiResponse.text();

  if (!apiResponse.ok) {
    throw new Error(
      `AI provider returned ${apiResponse.status}: ${text.slice(0, 300)}`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }

  let content =
    data?.choices?.[0]?.message?.content || "";

  content = content
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  let result;

  try {
    result = JSON.parse(content);
  } catch {
    throw new Error("AI storyboard was not valid JSON.");
  }

  return {
    success: true,
    demo: false,
    story,
    style: options.style,
    format: options.format,
    duration: options.length,
    voice: options.voice,
    summary: result.summary || "Animation storyboard created.",
    scenes: Array.isArray(result.scenes) ? result.scenes : []
  };
}

exports.handler = async function (event) {
  // CORS
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
    if (!event.body) {
      return response(400, {
        success: false,
        error: "Request body is empty."
      });
    }

    let body;

    try {
      body = JSON.parse(event.body);
    } catch {
      return response(400, {
        success: false,
        error: "Request body must be valid JSON."
      });
    }

    const story = String(body.story || "").trim();

    if (!story) {
      return response(400, {
        success: false,
        error: "Please enter a story."
      });
    }

    const options = {
      style: body.style || "2D cinematic",
      format: body.format || "9:16",
      length: Number(body.length) || 30,
      voice: body.voice || "Assamese male"
    };

    let result;

    try {
      result = await generateWithAI(story, options);
    } catch (aiError) {
      console.error("AI ERROR:", aiError);

      // Do not break the app if the AI provider fails.
      result = null;
    }

    if (!result) {
      result = makeDemo(story, options);
    }

    return response(200, result);

  } catch (error) {
    console.error("FUNCTION ERROR:", error);

    return response(500, {
      success: false,
      error: error.message || "Unknown server error."
    });
  }
};
