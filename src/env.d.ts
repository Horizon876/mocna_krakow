/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly SESSION_SECRET: string;
  readonly ADMIN_PASSWORD_HASH_B64: string;
  readonly PRACOWNIK_PASSWORD_HASH_B64?: string;
  readonly BLOB_READ_WRITE_TOKEN?: string;
  readonly RESEND_API_KEY?: string;
  readonly RESEND_FROM_EMAIL?: string;
  readonly RESEND_TEST_TO?: string;
  readonly STRIPE_SECRET_KEY?: string;
  readonly INPOST_GEOWIDGET_TOKEN?: string;
  readonly INPOST_GEOWIDGET_SANDBOX?: string;
  readonly SITE?: string;
  readonly MAINTENANCE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    adminRole?: "admin" | "pracownik";
  }
}
