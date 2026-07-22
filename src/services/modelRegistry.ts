export type ImageModel = 'gemini' | 'gemini-flash' | 'gemini-pro';

export type BillingStatus = 
  | 'Free / no billing' 
  | 'Free tier with quota' 
  | 'Requires billing' 
  | 'Unknown, blocked';

export interface ModelInfo {
  id: ImageModel;
  label: string;
  provider: 'google_gemini';
  modelId?: string;
  requiresApiKey: boolean;
  previewCompatible?: boolean;
  hidden?: boolean;
  billingStatus: BillingStatus;
}

export const modelRegistry: Record<ImageModel, ModelInfo> = {
  gemini: {
    id: 'gemini',
    label: 'Gemini 3.1 Flash Lite (Free Tier)',
    provider: 'google_gemini',
    modelId: 'gemini-3.1-flash-lite-image',
    requiresApiKey: false,
    previewCompatible: true,
    billingStatus: 'Free tier with quota'
  },
  'gemini-flash': {
    id: 'gemini-flash',
    label: 'Gemini 3.1 Flash Image',
    provider: 'google_gemini',
    modelId: 'gemini-3.1-flash-image',
    requiresApiKey: true,
    previewCompatible: true,
    billingStatus: 'Requires billing'
  },
  'gemini-pro': {
    id: 'gemini-pro',
    label: 'Gemini 3 Pro Image',
    provider: 'google_gemini',
    modelId: 'gemini-3-pro-image',
    requiresApiKey: true,
    previewCompatible: true,
    billingStatus: 'Requires billing'
  },
};

export function resolveModelRoute(modelId: ImageModel): ModelInfo {
  return modelRegistry[modelId] || modelRegistry['gemini'];
}

