const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

const rules = `
Set stories in Assam unless explicitly requested otherwise.
Prefer authentic Assamese people, Mekhela Sador, dhoti/kurta,
Assam villages, tea gardens, paddy fields, bamboo houses,
forests and the Brahmaputra.
Keep Assamese culture respectful and avoid stereotypes.
`;

function response(statusCode, data) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

function demo(story, o) {
  const count =
    o.length <= 30 ? 4 :
    o.length <= 60 ? 6 : 8;

  const names = [
    "Opening",
    "The journey",
    "A discovery",
    "Turning point",
    "Emotional moment",
    "Resolution",
    "Celebration",
    "Final shot"
  ];

  return {
    demo: true,
    summary: `${o.style} Assam-first animation: ${story}`,
    scenes: Array.from({ length: count }, (_, i) => ({
      title: names[i] || `Scene ${i + 1}`,
      description:
        `Scene ${i + 1}, maintaining the same character and Assam setting.`,
      tags: [
        "Assam",
        "Assamese culture",
        "consistent character",
        o.style,
        o.format
      ],
      video_prompt:
        `${o.style} animation, authentic Assamese environment, ` +
        `consistent character, cinematic movement. ` +
        `Story beat ${i + 1}: ${story}. ${rules}`,
      voice_line:
        o.voice === "No voice"
          ? ""
          : `Narration in ${o.voice}.`
    }))
  };
}

async function generateAI(story, o) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return null;
  }

  const prompt = `
Create a production-ready animation storyboard.

Story:
${story}

Style: ${o.style}
Format: ${o.format}
Length: ${o.length} seconds
Voice: ${o.voice}

${rules}

Return ONLY valid JSON.

Required structure:
{
  "summary": "short summary",
  "scenes": [
    {
      "title": "scene title",
      "description": "visual description",
      "tags": ["Assam"],
      "video_prompt": "detailed animation prompt",
      "voice_line": "Assamese narration"
    }
  ]
}
`;

  const apiResponse = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          {
            role: "system",
            content:
              "You are Axomi-AI, an expert animation director specializing in authentic Assamese stories."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    }
  );

  const raw = await apiResponse.text();

  if (!raw) {
    throw new Error("AI provider returned an empty response.");
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }

  if (!apiResponse.ok) {
    throw new Error(
      data?.error?.message ||
      "AI provider request failed."
    );
  }

  let text = data.output_text || "";

  if (!text && data.output) {
    text = data.output
      .flatMap(x => x.content || [])
      .filter(x => x.type === "output_text")
      .map(x => x.text)
      .join("");
  }

  text = text
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (!text) {
    throw new Error("AI returned no storyboard.");
  }

  let storyboard;

  try {
    storyboard = JSON.parse(text);
  } catch {
    throw new Error("AI storyboard was not valid JSON.");
  }

  return {
    ...storyboard,
    demo: false
  };
}

exports.handler = async (event) => {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return response(405, {
      error: "POST request required."
    });
  }

  try {

    let body = {};

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return response(400, {
        error: "Invalid request JSON."
      });
    }

    const story = String(body.story || "").trim();

    if (!story) {
      return response(400, {
        error: "Story is required."
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
      result = await generateAI(story, options);
    } catch (aiError) {
      console.error("AI ERROR:", aiError);

      result = null;
    }

    if (!result) {
      result = demo(story, options);
    }

    return response(200, result);

  } catch (error) {

    console.error("AXOMI ERROR:", error);

    return response(500, {
      error: error.message || "Something went wrong."
    });
  }
};
