const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function reply(statusCode, data) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data)
  };
}

const ASSAM_STYLE = `
Authentic Assam, India.
Authentic Assamese people.
Respectful Assamese culture.
Traditional Assamese clothing where appropriate,
including Mekhela Sador and traditional dhoti/kurta.
Natural Assam environments such as tea gardens,
paddy fields, bamboo houses, villages, forests and the Brahmaputra.
Keep faces, clothing and character appearance consistent.
No stereotypes.
Cinematic composition.
`;

exports.handler = async function (event) {

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

    if (!event.body) {
      return reply(400, {
        success: false,
        error: "Request body is empty."
      });
    }

    let body;

    try {
      body = JSON.parse(event.body);
    } catch {
      return reply(400, {
        success: false,
        error: "Invalid JSON request."
      });
    }

    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return reply(400, {
        success: false,
        error: "Image prompt is required."
      });
    }

    /*
      Keep the secret API key on Netlify.
      Never put the secret key inside index.html.
    */

    const apiKey = process.env.POLLINATIONS_API_KEY || "";

    const finalPrompt = `
${ASSAM_STYLE}

Create one high-quality animation frame.

${prompt}

The image should look like a frame from a professional animated film.
Use strong visual storytelling, natural lighting and clear characters.
`;

    /*
      If a Pollinations key is configured, use the current API.
    */

    if (apiKey) {

      const url =
        "https://gen.pollinations.ai/image/" +
        encodeURIComponent(finalPrompt) +
        "?model=flux&width=768&height=1344";

      const r = await fetch(url, {
        headers: {
          "Authorization": "Bearer " + apiKey
        }
      });

      if (!r.ok) {
        const errorText = await r.text();

        throw new Error(
          "Image provider error " +
          r.status +
          ": " +
          errorText.slice(0, 200)
        );
      }

      /*
        Convert the generated image to a data URL.
        This makes the browser display it directly.
      */

      const buffer = Buffer.from(
        await r.arrayBuffer()
      );

      const base64 = buffer.toString("base64");

      return reply(200, {
        success: true,
        provider: "pollinations",
        image:
          "data:image/jpeg;base64," +
          base64
      });
    }

    /*
      No API key yet.
      Return a browser-safe generation URL so we can test
      the complete UI without breaking the app.
    */

    const demoUrl =
      "https://gen.pollinations.ai/image/" +
      encodeURIComponent(finalPrompt) +
      "?model=flux&width=768&height=1344";

    return reply(200, {
      success: true,
      provider: "pollinations-demo",
      image: demoUrl
    });

  } catch (error) {

    console.error("IMAGE ERROR:", error);

    return reply(500, {
      success: false,
      error: error.message || "Image generation failed."
    });
  }
};
