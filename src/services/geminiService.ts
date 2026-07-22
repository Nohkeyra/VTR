import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

export const PROXY_URL = "http://127.0.0.1:3001/api/generate";

/**
 * IDEOGRAM 3.0 / VORTEX RENDERING ENGINE
 */
const VORTEX_SYSTEM_INSTRUCTION = `[IDEOGRAM 3.0 / VORTEX RENDERING ENGINE]
[ROLE: ELITE GRAPHIC DESIGNER & ARCHITECTURAL RENDERER]

You are a high-performance visual synthesis engine specialized in extreme-fidelity graphic identity and 3D typography.
Your primary mandate is LITERAL TRANSLATION of the provided concept into a professional visual asset.

OPERATIONAL PARAMETERS:
1. IMAGE-STYLE COUPLING: If a reference image is provided, your MISSION-CRITICAL task is to synthesize the final output by grafting the new content onto the visual DNA of the reference. Maintain lighting, material, and compositional properties of the reference.
2. LITERAL FIDELITY: Follow every keyword in the prompt with 100% precision. Zero creative drift unless requested.
3. CINEMATIC AUTHORITY: Use professional studio lighting (softbox, rim, backlighting) and intentional focal depth.
4. MATERIAL INTEGRITY: Physics-accurate material representation (Glass, Chrome, Matte, Liquid, Iridescent).
5. COMPOSITIONAL INTENT: Subject-first hierarchy. Rule of thirds or centered symmletry based on type.

[TYPOGRAPHY_LOGIC]: When generating text, maintain razor-sharp font edges. Verify character count with extreme precision. 
If 3D is requested, use high IOR (Index of Refraction) and caustic reflections. 
If 2D is requested, use vector-smooth curves and clean silhouettes.`;

export async function callGemini(args: {
  model: string;
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: string;
  imageSize?: string;
  apiKeyOverride?: string;
  signal?: AbortSignal;
}): Promise<{ image?: string; text?: string; modelUsed: string }> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { model, prompt, base64Image, mimeType, aspectRatio, imageSize, apiKeyOverride, signal } = args;

  // Follow skill: API Key from process.env or override
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = apiKeyOverride || (process.env as any).GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("The Gemini API key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Dynamically select system instructions based on prompt intent
  let dynamicSystemInstruction = VORTEX_SYSTEM_INSTRUCTION;
  if (prompt.toLowerCase().includes("vector") || prompt.toLowerCase().includes("flat 2d") || prompt.toLowerCase().includes("svg style")) {
    dynamicSystemInstruction = `[VORTEX VECTOR ENGINE]
[ROLE: MASTER ILLUSTRATOR & VECTOR ARTIST]

You are a high-performance visual synthesis engine specialized in pure, flat 2D graphic design and vector illustration.
Your primary mandate is LITERAL TRANSLATION of the provided concept into a professional digital vector asset.

OPERATIONAL PARAMETERS:
1. VECTOR FIDELITY: Generate pristine, flat illustrations. ZERO 3D. ZERO photorealism.
2. LIGHTING & SHADING: Use solid color blocking or flat, intentional shading. No volumetric lighting, no depth of field, no shadows.
3. MATERIAL INTEGRITY: Render purely flat, opaque digital colors. No realistic glass, chrome, or caustic reflections.
4. CLEAN PATHS: Ensure crisp, geometric, razor-sharp edges and smooth curves typical of Adobe Illustrator or SVG graphics.
5. IMAGE-STYLE COUPLING: If a reference image is provided, extract its core content but forcibly convert its style to a pure 2D vector flat graphic aesthetic.`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (base64Image && mimeType) {
    const formattedBase64 = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
    parts.push({
      inlineData: {
        data: formattedBase64,
        mimeType: mimeType
      }
    });

    const isVector = prompt.toLowerCase().includes("vector") || prompt.toLowerCase().includes("flat 2d") || prompt.toLowerCase().includes("svg style");

    if (isVector) {
      parts.push({
        text: `[STRUCTURAL_REFERENCE_DETECTED] Use the attached image ONLY for composition, subject matter, and layout structure. 
DO NOT copy its photographic style, 3D shading, realistic textures, or lighting. 
ABSOLUTE REQUIREMENT: You MUST re-render the content purely as a flat, 2D vector graphic illustration.
[CONTENT_INSTRUCTION]: ${prompt}`
      });
    } else {
      // If we have an image, we should explicitly tell the model to use it as a style guide.
      parts.push({
        text: `[STYLE_REFERENCE_DETECTED] Follow the visual DNA of the attached image.
[CONTENT_INSTRUCTION]: ${prompt}`
      });
    }
  } else {
    parts.push({ text: prompt });
  }

  // Model-specific configs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    systemInstruction: dynamicSystemInstruction
  };

  const isImageModel = model.includes("image") || model.includes("imagen");
  if (isImageModel) {
    config.imageConfig = {
      aspectRatio: aspectRatio || "1:1"
    };

    if (model.includes("gemini-3")) {
      config.imageConfig.imageSize = imageSize || "1K";
    }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: { parts },
      config,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const candidate = response.candidates?.[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = candidate?.content?.parts?.find((part: any) => part?.inlineData?.data);

    if (imagePart?.inlineData?.data) {
      const b64 = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;
      return { image: b64, modelUsed: model };
    } else {
      const text = response.text || "Gemini returned no content";
      return { text, modelUsed: model };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const msg = error.message || String(error);
    if (msg.includes("401") || msg.includes("invalid") || msg.includes("key")) {
      throw new Error(`The Gemini API key is currently invalid or expired (Details: ${msg}).`, { cause: error });
    }
    if (msg.includes("429") || msg.includes("Quota")) {
      throw new Error(`Free-tier limit reached. Try again later (Details: ${msg}).`, { cause: error });
    }
    throw error;
  }
}

/**
 * Real Diagnostic Check: Verify API key and connectivity with a lightweight call
 */
export async function checkGeminiConnection(apiKeyOverride?: string): Promise<{ success: boolean; latency: number; details: string }> {
  const start = Date.now();
  try {
    const result = await callGemini({
      model: "gemini-3.5-flash",
      prompt: "ping",
      apiKeyOverride
    });
    
    const latency = Date.now() - start;
    if (result) {
      return { 
        success: true, 
        latency, 
        details: `Connected to Google Neural Network. Mode: ${apiKeyOverride ? 'Custom Node' : 'System Node'}` 
      };
    }
    return { success: false, latency, details: 'Empty Response' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    const latency = Date.now() - start;
    let details = err.message || String(err);
    if (details.includes('401') || details.includes('key not valid')) details = 'Invalid API Key';
    else if (details.includes('429')) details = 'Rate Limited (429)';
    
    return { success: false, latency, details };
  }
}

export async function analyzeImage(
  base64Image: string, 
  mimeType: string, 
  activeTab: string = 'vectorize',
  apiKeyOverride?: string,
  signal?: AbortSignal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const systemInstruction = `Role : You are a Structural Design Auditor. Define the artistic style as a JSON object. Focus on ${activeTab === "logo design" ? "LOGO DESIGN" : "VECTOR ILLUSTRATION"} elements.
Return a JSON object: { "name": string, "basePrompt": string, "negativePrompt": string, "aspectRatio": "1:1", "dnaWeight": number, "textureIntensity": number }`;

  try {
    const response = await callGemini({
      model: "gemini-3.5-flash", // Analysis can use flash
      prompt: systemInstruction,
      base64Image,
      mimeType,
      apiKeyOverride,
      signal
    });
    
    const text = response.text || "";
    if (!text) throw new Error("No analysis generated");

    const parseAIJSON = (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) return JSON.parse(match[1]);
        throw e;
      }
    };
    return parseAIJSON(text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw error;
  }
}

export async function refineTypographyPrompt(
  base64Image: string,
  mimeType: string,
  originalPrompt: string,
  targetText: string,
  targetPreset: string,
  apiKeyOverride?: string,
  signal?: AbortSignal
): Promise<string> {
  try {
    const response = await callGemini({
      model: "gemini-3.5-flash",
      prompt: `Role: Typographic Quality Auditor. Refine the prompt for better spelling of "${targetText}" and matching "${targetPreset}" style. Original: ${originalPrompt}`,
      base64Image,
      mimeType,
      apiKeyOverride,
      signal
    });

    return response.text || originalPrompt;
  } catch (error) {
    console.error("Refinement Loop Error:", error);
    return originalPrompt;
  }
}
