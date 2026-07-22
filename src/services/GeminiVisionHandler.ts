import { callGemini } from "./geminiService";

export interface GeminiAnalysisResult {
  global_context: {
    scene_description: string;
    color_palette: { dominant_hex_estimates: string[] };
  };
  objects: Array<{ id: string; label: string; pose_orientation: string; box_2d: [number, number, number, number] }>;
}

export async function analyzeImage(base64Image: string, mimeType: string, apiKeyOverride?: string, retries = 3, delay = 1000): Promise<GeminiAnalysisResult> {
  try {
    const result = await callGemini({
      model: "gemini-3.6-flash",
      prompt: `Analyze this image and return a JSON object with the following structure:
      {
        "global_context": {
          "scene_description": "string",
          "color_palette": { "dominant_hex_estimates": ["#HEX1", "#HEX2"] }
        },
        "objects": [
          { "id": "obj_001", "label": "string", "pose_orientation": "string", "box_2d": [0, 0, 1000, 1000] }
        ]
      }`,
      base64Image,
      mimeType,
      apiKeyOverride,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          global_context: {
            type: "OBJECT",
            properties: {
              scene_description: { type: "STRING" },
              color_palette: {
                type: "OBJECT",
                properties: {
                  dominant_hex_estimates: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                  },
                },
              },
            },
          },
          objects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                label: { type: "STRING" },
                pose_orientation: { type: "STRING" },
                box_2d: {
                  type: "ARRAY",
                  items: { type: "NUMBER" },
                },
              },
            },
          },
        },
      }
    });

    if (!result.text) {
      throw new Error("No analysis result returned.");
    }

    return JSON.parse(result.text) as GeminiAnalysisResult;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if ((errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) && retries > 0) {
      console.warn(`[GeminiVision] Analysis error. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeImage(base64Image, mimeType, apiKeyOverride, retries - 1, delay * 2);
    }
    throw err;
  }
}
