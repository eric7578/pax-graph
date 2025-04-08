/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAX_LOGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
