/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KX_SERVICE_KEY?: string;
  readonly VITE_TENANT_ID?: string;
  readonly MODE: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}



