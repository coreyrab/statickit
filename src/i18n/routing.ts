import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // List of all supported locales
  locales: ['en', 'es', 'de', 'fr', 'ja', 'zh', 'ko', 'pt'],

  // Default locale when no locale is detected
  defaultLocale: 'en',

  // Use cookie to persist locale preference
  localePrefix: 'as-needed' // Only show prefix for non-default locales
});

export type Locale = (typeof routing.locales)[number];

// Create navigation utilities that are locale-aware
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
