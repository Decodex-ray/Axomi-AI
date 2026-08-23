const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};


function jsonResponse(statusCode, data) {

  return {
    statusCode: statusCode,
    headers: headers,
    body: JSON.stringify(data)
  };

}


exports.handler = async function(event) {

  /*
    OPTIONS request from browser
  */

  if (event.httpMethod === "OPTIONS") {

    return {
      statusCode: 204,
      headers: headers,
      body: ""
    };

  }


  /*
    Only POST is allowed
  */

  if (event.httpMethod !== "POST") {

    return jsonResponse(405, {
      success: false,
      error: "POST request required."
    });

  }


  try {

    /*
      Read request body
    */

    let body = {};

    try {

      body = JSON.parse(event.body || "{}");

    } catch (error) {

      return jsonResponse(400, {
        success: false,
        error: "Invalid JSON request."
      });

    }


    const story = String(body.story || "").trim();

    if (!story) {

      return jsonResponse(400, {
        success: false,
        error: "Please enter a story."
      });

    }


    const style =
      String(body.style || "2D cinematic");

    const format =
      String(body.format || "9:16");

    const length =
      Number(body.length || 30);

    const voice =
      String(body.voice || "Assamese male");


    /*
      Decide number of scenes
    */

    let sceneCount = 4;

    if (length > 30 && length <= 60) {
      sceneCount = 6;
    }

    if (length > 60) {
      sceneCount = 8;
    }


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

        title:
          sceneNames[i] || `Scene ${i + 1}`,

        description:
          `Scene ${i + 1} of the story. ` +
          `Keep the same characters, faces, clothing, ` +
          `location and visual style throughout the animation.`,

        tags: [
          "Assam",
          "Assamese",
          "Assamese culture",
          "consistent character",
          style,
          format
        ],

        video_prompt:
          `${style} animation. ` +
          `Authentic Assamese people and environment. ` +
          `Respectful Assamese culture. ` +
          `Use Mekhela Sador or traditional Assamese clothing ` +
          `where appropriate. ` +
          `Assam village, tea garden, paddy field, bamboo house, ` +
          `forest or Brahmaputra environment when appropriate. ` +
          `Natural Assamese appearance. ` +
          `Consistent character design and face. ` +
          `Cinematic movement. ` +
          `Scene ${i + 1}. ` +
          `Story: ${story}`,

        voice_line:
          voice === "No voice"
            ? ""
            : `Narration in ${voice} for scene ${i + 1}. Story: ${story}`

      });

    }


    /*
      DEMO MODE

      This is deliberately kept independent of an external AI API.
      Therefore the app can be tested immediately.
    */

    return jsonResponse(200, {

      success: true,

      demo: true,

      message:
        "Axomi-AI storyboard generated successfully.",

      story: story,

      style: style,

      format: format,

      length: length,

      voice: voice,

      summary:
        `${style} Assamese animation storyboard`,

      scenes: scenes

    });


  } catch (error) {

    console.error("GENERATE ERROR:", error);

    return jsonResponse(500, {

      success: false,

      error:
        error.message || "Internal server error."

    });

  }

};
