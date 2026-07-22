export async function callGemini(args: {
  model: string;
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: string;
  imageSize?: string;
  apiKeyOverride?: string;
  systemInstruction?: string;
  responseMimeType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema?: any;
  signal?: AbortSignal;
}): Promise<{ image?: string; text?: string; modelUsed: string }> {
  const {
    model,
    prompt,
    base64Image,
    mimeType,
    aspectRatio,
    imageSize,
    apiKeyOverride,
    systemInstruction,
    responseMimeType,
    responseSchema,
    signal
  } = args;

  const resolvedModel = model === 'gemini-2.5-flash-image' ? 'gemini-3.1-flash-lite-image' : model;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: resolvedModel,
      prompt,
      base64Image,
      mimeType,
      aspectRatio,
      imageSize,
      apiKeyOverride,
      systemInstruction,
      responseMimeType,
      responseSchema
    }),
    signal
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Generation failed (${res.status})`);
  }

  return await res.json();
}

/**
 * Real Diagnostic Check: Verify API key and connectivity with a lightweight call
 */
export async function checkGeminiConnection(apiKeyOverride?: string): Promise<{ success: boolean; latency: number; details: string }> {
  const start = Date.now();
  try {
    const result = await callGemini({
      model: "gemini-3.6-flash",
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
      model: "gemini-3.6-flash",
      prompt: systemInstruction,
      base64Image,
      mimeType,
      apiKeyOverride,
      responseMimeType: "application/json",
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
      model: "gemini-3.6-flash",
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
