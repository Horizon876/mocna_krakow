/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly SESSION_SECRET: string;
  readonly ADMIN_PASSWORD_HASH_B64: string;
  readonly BLOB_READ_WRITE_TOKEN?: string;
  readonly RESEND_API_KEY?: string;
  readonly RESEND_FROM_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
