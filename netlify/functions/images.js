const headers = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function reply(status, data) {
  return {
    statusCode: status,
    headers,
    body: JSON.stringify(data)
  };
}

function imageSize(format) {
  if (String(format).includes("16:9")) {
    return { width: 1280, height: 720 };
  }

  if (String(format).includes("1:1")) {
    return { width: 1024, height: 1024 };
  }

  return { width: 768, height: 1365 };
}

function makePrompt(scene, options) {
  return [
    options.style || "2D cinematic animation",
    "high quality animated film frame",
    "authentic Assam, India",
    "authentic Assamese people",
    "respectful Assamese culture",
    "consistent character design",
    "consistent clothing and face",
    "Mekhela Sador or traditional Assamese clothing when appropriate",
    "natural Assamese environment",
    "cinematic lighting",
    "detailed background",
    "beautiful composition",
    "no text",
    "no watermark",
    "no logo",
    "",
    "STORY:",
    options.story || "",
    "",
    "SCENE:",
    scene.description || scene.video_prompt || scene.title || ""
  ].join("\n");
}

exports.handler = async function(event) {

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return reply(405, {
      success: false,
      error: "POST request required."
    });
  }

  try {

    let body;

    try {
      body = JSON.parse(event.body || "{}");
    } catch (error) {
      return reply(400, {
        success: false,
        error: "Invalid JSON request."
      });
    }

    const story = String(body.story || "").trim();
    const style = String(body.style || "2D cinematic");
    const format = String(body.format || "9:16");
    const scenes = Array.isArray(body.scenes) ? body.scenes : [];

    if (!scenes.length) {
      return reply(400, {
        success: false,
        error: "No scenes were provided."
      });
    }

    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
      return reply(500, {
        success: false,
        error:
          "POLLINATIONS_API_KEY is missing. Add it in Netlify Environment Variables."
      });
    }

    const size = imageSize(format);

    const images = [];

    for (let i = 0; i < scenes.length; i++) {

      const scene = scenes[i];

      const prompt = makePrompt(scene, {
        story,
        style,
        format
      });

      const encodedPrompt = encodeURIComponent(prompt);

      const url =
        "https://gen.pollinations.ai/image/" +
        encodedPrompt +
        "?model=flux" +
        "&width=" + size.width +
        "&height=" + size.height;

      images.push({
        scene: i + 1,
        title: scene.title || `Scene ${i + 1}`,
        prompt,
        url,
        provider: "Pollinations"
      });
    }

    return reply(200, {
      success: true,
      provider: "Pollinations",
      style,
      format,
      images
    });

  } catch (error) {

    console.error("IMAGE FUNCTION ERROR:", error);

    return reply(500, {
      success: false,
      error: error.message || "Image generation failed."
    });
  }
};
