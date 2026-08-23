const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {

  // ================================
  // CORS
  // ================================

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }


  // ================================
  // ONLY POST
  // ================================

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

    // ================================
    // READ REQUEST
    // ================================

    const body =
      JSON.parse(event.body || "{}");


    const story =
      String(body.story || "").trim();


    const style =
      String(
        body.style ||
        "2D cinematic"
      ).trim();


    const format =
      String(
        body.format ||
        "9:16"
      ).trim();


    const scenes =
      Array.isArray(body.scenes)
        ? body.scenes
        : [];


    // ================================
    // VALIDATION
    // ================================

    if (!story) {

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Story is required"
        })
      };

    }


    if (!scenes.length) {

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "No scenes were provided by the storyboard."
        })
      };

    }


    // ================================
    // POLLINATIONS API KEY
    // ================================

    const apiKey =
      process.env.POLLINATIONS_API_KEY;


    if (!apiKey) {

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            "POLLINATIONS_API_KEY is not configured in Netlify."
        })
      };

    }


    // ================================
    // IMAGE SIZE
    // ================================

    let width = 1024;
    let height = 1024;


    if (format === "9:16") {

      width = 768;
      height = 1365;

    }


    if (format === "16:9") {

      width = 1365;
      height = 768;

    }


    if (format === "1:1") {

      width = 1024;
      height = 1024;

    }


    // ================================
    // GENERATE EACH SCENE
    // ================================

    const images = [];


    for (
      let index = 0;
      index < scenes.length;
      index++
    ) {

      const scene =
        scenes[index] || {};


      const title =
        String(
          scene.title || ""
        ).trim();


      const description =
        String(
          scene.description || ""
        ).trim();


      const videoPrompt =
        String(
          scene.video_prompt || ""
        ).trim();


      const tags =
        Array.isArray(scene.tags)
          ? scene.tags.join(", ")
          : "";


      // ================================
      // AXOMI MASTER PROMPT
      // ================================

      const prompt = [

        "Create a high-quality cinematic animation frame for an Assamese story.",

        "Authentic Assam, India.",

        "Respectful and realistic Assamese culture.",

        "Use authentic Assamese people and natural-looking faces.",

        "Use appropriate traditional Assamese clothing such as Mekhela Sador or Assamese dhoti-kurta when appropriate.",

        "Use realistic Assamese environments such as villages, tea gardens, paddy fields, bamboo houses, forests, rivers and the Brahmaputra when appropriate.",

        "Maintain consistent characters and visual identity across scenes.",

        "Natural expressions and cinematic composition.",

        `Animation style: ${style}.`,

        `Video format: ${format}.`,

        `Story: ${story}.`,

        `Scene ${index + 1}.`,

        `Scene title: ${title}.`,

        `Scene description: ${description}.`,

        `Visual tags: ${tags}.`,

        `Video direction: ${videoPrompt}.`,

        "No text, captions, subtitles, logos or watermarks inside the generated image.",

        "Create a visually rich production-quality frame suitable for an animated Assamese film."

      ].join(" ");


      // ================================
      // URL ENCODE PROMPT
      // ================================

      const encodedPrompt =
        encodeURIComponent(prompt);


      // ================================
      // POLLINATIONS IMAGE URL
      // ================================

      const imageUrl =
        `https://gen.pollinations.ai/image/${encodedPrompt}` +
        `?model=flux` +
        `&width=${width}` +
        `&height=${height}` +
        `&nologo=true`;


      // ================================
      // VERIFY IMAGE REQUEST
      // ================================

      const imageResponse =
        await fetch(
          imageUrl,
          {
            method: "GET",

            headers: {
              "Authorization":
                `Bearer ${apiKey}`
            }
          }
        );


      if (!imageResponse.ok) {

        const errorText =
          await imageResponse.text();


        throw new Error(
          `Image generation failed for scene ${index + 1}. ` +
          `HTTP ${imageResponse.status}. ` +
          errorText.substring(0, 300)
        );

      }


      // ================================
      // SAVE RESULT
      // ================================

      images.push({

        scene:
          index + 1,

        title:
          title ||
          `Scene ${index + 1}`,

        prompt:
          prompt,

        url:
          imageUrl

      });

    }


    // ================================
    // SUCCESS
    // ================================

    return {

      statusCode: 200,

      headers,

      body: JSON.stringify({

        success: true,

        provider:
          "Pollinations AI",

        model:
          "flux",

        story:
          story,

        style:
          style,

        format:
          format,

        images:
          images

      })

    };


  } catch (error) {

    console.error(
      "Axomi-AI image generation error:",
      error
    );


    return {

      statusCode: 500,

      headers,

      body: JSON.stringify({

        success: false,

        error:
          error.message ||
          "Image generation failed."

      })

    };

  }

};
