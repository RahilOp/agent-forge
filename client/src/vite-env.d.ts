/// <reference types="vite/client" />


interface ImportMetaEnv {
    VITE_SSL_KEY_PATH: string;   // Declare as string type
    VITE_SSL_CERT_PATH: string;  // Declare as string type
    VITE_REDIRECT_URI: string;  // Declare as string type
    VITE_HOST: string;          // Declare as string type
}
  
interface ImportMeta {
  readonly env: ImportMetaEnv;
}