const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "POST request required"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Prompt is required"
        })
      };
    }

    /*
      STEP 1:
      Return a clean image-generation job.

      We will connect the actual free/low-cost
      image providers after this endpoint is confirmed.
    */

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        provider: "axomi-ai",
        prompt: prompt,
        message: "Image generation request accepted"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Server error"
      })
    };
  }
};
