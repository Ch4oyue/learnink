# LearnInk Changelog

All notable changes to the LearnInk platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.4] - February 01, 2026

### Context Synchronization & Feature Restoration

Stabilized the project state after merging performance updates. Restored lost gamification features and refactored core interaction modules for better maintainability.

#### Improvements (3)
- **Daily Streaks (Restored)**: Re-implemented streak tracking logic in `types.ts` and `useActiveTimeTracker`, including the `update_user_streak` database migration.
- **Improved Selection Hook**: Refactored `HybridContentRenderer` to use a new `useTextSelection` hook that incorporates debounced performance optimizations from v1.7.2.
- **Agent Context Sync**: Updated `Master Plan`, `README`, and `.jules` logs to ensure all AI agents are aligned on the current development roadmap.

#### Fixes (1)
- **Type Mismatches**: Resolved `AuthContext` and profile type errors by accurately mapping new streak columns in the Supabase schema.

## [1.7.3] - February 1, 2026

### Progress Persistence & Navigation Stabilization

Fixes critical bugs in the learning module where progress could reset on refresh and the last visited section was not remembered.

#### Fixes (2)
- **Progress Reset Bug**: Resolved a race condition in `useModuleNavigation.ts` where server progress could be overwritten by initial local state on refresh.
- **Section Persistence**: Implemented `localStorage` persistence for the current section index, ensuring users return to where they left off after a refresh.

## [1.7.2] - January 31, 2026

### Accessibility Compliance & Interaction Optimization

A performance and accessibility focused update that resolves critical UI bottlenecks and ensures WCAG 2.1 compliance. This release fixes a significant interaction delay in learning modules and enhances screen reader support across the entire platform.

#### Improvements (4)
- **A11y Overhaul**: Added `aria-label` to all icon-only buttons, implemented proper `main` landmarks for all pages, and restored user-scaling for better mobile readability.
- **TOC Optimization**: Memoized Table of Contents items in `ModuleLearn`, reducing re-render costs for large modules by ~80%.
- **Selection Performance**: Fixed a memory leak in text selection handling and implemented debouncing, reducing main-thread blocking during reading.
- **Slug Caching**: Implemented results caching for markdown heading IDs to avoid repeated regex operations.

#### Fixes (2)
- **Input Delay**: Resolved the ~600ms input delay when interacting with module headings by fixing redundant event listeners.
- **Branding Sync**: Updated all remaining "LearnAI" instances to "LearnInk" for brand consistency.

## [1.7.1] - January 31, 2026

### SEO, Navigation Feedback & Component Prefetching

An enhancement release focused on "Premium Feel" and perceived performance. This update adds SEO meta tags for all critical pages, visual navigation feedback via a top progress bar, and hardware-aware prefetching for faster route transitions.

#### Improvements (3)
- **SEO & Meta Tags**: Integrated `react-helmet-async` and created a reusable `SEO` component to manage meta tags, improving social sharing and search visibility.
- **Top Loading Bar**: Added a subtle `TopProgressBar` that appears during lazy route transitions, providing immediate visual feedback to the user.
- **Smart Prefetching**: Implemented hardware-aware prefetching that preloads lazy components on hover, but only for capable devices with fast connections.

#### Patches (1)
- **Index Cleanup**: Optimized `index.html` with better font preloads and corrected branding meta tags.

## [1.7.0] - January 31, 2026

### Mobile Performance & Low-End Optimization

A comprehensive performance overhaul designed to make LearnInk run smoothly on low-to-mid range mobile devices. This release introduces intelligent hardware detection, aggressive caching, and UI responsiveness improvements.

#### Improvements (6)
- **Performance Engine**: Introduced `usePerformance` hook to detect low-end devices (RAM/CPU/Connection) and automatically scale down UI complexity.
- **Lazy Execution**: Refactored `MarkdownRenderer` to lazy-load the heavy `PythonCodeEditor` only when needed.
- **Aggressive Caching**: Enhanced PWA configuration with Workbox runtime caching for Google Fonts and static assets.
- **Network Optimization**: Increased React Query `staleTime` to 10 minutes to significantly reduce redundant API calls and costs.
- **Conservative Preloading**: Updated `usePyodidePreload` to skip preloading on low-end devices, saving data and memory.
- **Parser Fast-Path**: Implemented an optimized heading check in `moduleParser.ts` to improve content ingestion speed.

#### Fixes (3)
- **Navigation Responsiveness**: Disabled `v7_startTransition` in React Router to fix the "stalled view" issue where the URL changed but the UI didn't update.
- **Mobile Scroll**: Optimized section transitions in `ModuleLearn` to use `auto` scroll instead of `smooth` on low-end devices to prevent main-thread blocking.
- **Environment Stability**: Resolved `bun test` environment failures by fixing dependency resolution and test mocks.

#### Patches (1)
- **Unified Design**: Integrated performance detection into `CustomCursor` and `useSmoothScroll` for a consistent lightweight experience.

## [1.6.0] - January 30, 2026

### Gacha Rewards, Security Hardening & Apple UI

A massive consolidated update merging gamification features with critical security patches. This release introduces the Gacha reward system, enforces strict XSS protection, and refines the mobile experience with "Glass Liquid" aesthetics.

#### Improvements (14)
- **Gacha Rewards**: Implemented a secure reward system where users earn randomized XP (50-150) upon completing a module.
- **Secure Validation**: Created `award-xp` Edge Function to securely calculate and award XP, preventing client-side manipulation.
- **Claim Persistence**: Added `reward_claimed` tracking to `user_progress` to ensure users can only claim rewards once per module.
- **Apple UI Polish**: Updated global border radius to `1rem` (16px) and added `active:scale-95` micro-interactions to all buttons.
- **Floating Notes Menu**: Replaced the basic "Highlight" button with a context-aware Floating Menu (Add Note/Copy).
- **Progress Persistence**: Implemented "Reset Progress" functionality and fixed disappearing ticks bug.
- **Navigation UI**: Simplified "Previous" and "Next" buttons to be icon-only for a cleaner mobile interface.
- **Analytics Foundation**: Implemented active learning time tracking using intelligent activity detection.
- **Mobile Experience**: Major UI/UX overhaul for mobile devices, including Safe Area (Notch) support.
- **Landing Page Navigation**: Added a responsive Hamburger menu (Sheet) for better mobile accessibility.
- **Pyodide Preloading**: Implemented smart preloading for the Python runtime in `ModuleLearn`.
- **Mobile Progress Visibility**: Enhanced Table of Contents sheet visibility on mobile.
- **XSS Protection**: Implemented strict sanitization for Markdown links in `MarkdownRenderer` using `DOMPurify` (Merged from Sentinel).
- **Production Logging**: Replaced remaining `console.error` calls with the secure `logger` utility (Merged from Sentinel).

#### Fixes (7)
- **Modal Design**: Refactored `GachaCompletionModal` to align with the "Premium Dark Mode" aesthetic.
- **Accessibility**: Resolved `DialogContent` accessibility warning by adding `SheetTitle`.
- **Markdown Rendering**: Replaced custom regex parser with `react-markdown` to fix nested list numbering.
- **Content Approval UI**: Fixed mobile layout overflow in the "Review & Publish" dialog.
- **Landing Page UX**: Fixed mobile sidebar behavior to auto-close when clicking links.
- **Security**: Blocked dangerous protocols (`javascript:`) in markdown links to prevent Stored XSS.
- **Memory**: Fixed potential memory leaks in `useActiveTimeTracker` by cleaning up event listeners properly.

#### Patches (2)
- **Module Architecture**: Extracted complex navigation logic into `useModuleNavigation` hook.
- **Unit Testing**: Added robust unit tests for module parsing logic.

## [1.4.11] - January 29, 2026

### Notifications, Testing & Security

Implemented real-time notification system, enhanced unit testing infrastructure, quiz anti-cheat security, critical memory leak fixes, and comprehensive type-safety improvements.

<!-- -->

#### Improvements (3)
- **Time-Based Anti-Cheat**: Implemented validation in `validate-quiz-answers` Edge Function to reject submissions that are completed faster than humanly possible (min 2 seconds per question), preventing script attacks.
- **Real-time Notifications**: Integrated Supabase Realtime for instant notification toasts and added a dedicated notification center page.
- **Testing Infrastructure**: Configured `bun test` with preload scripts to support robust unit testing of static assets.
- **Type Safety**: Refactored `useDebounce` and `pyodide.worker` to remove `any` types, preventing potential runtime type errors.
- **Error Resilience**: Implemented granular `ErrorBoundary` wrapping in Dashboard and Learning modules to prevent full application crashes during isolated component failures.

#### Fixes (2)
- **Pyodide Management**: Resolved memory leak in `PyodideManager` by implementing a proper subscription pattern and cleanup strategy.
- **Notification Routing**: Connected isolated notification components to the main dashboard router and layout.
- **Logging Consistency**: Replaced direct `console.log` usage in `PWAContext` with the centralized `logger` utility to ensure production cleanliness.

## [1.4.9] - January 28, 2026

### Audit & Stability

Comprehensive security audit, performance verification, and environment stabilization.

<!-- -->

#### Patches (2)
- **Environment Fix**: Resolved missing dependency issues by strictly enforcing `bun install` for Windows stability.
- **Audit Verification**: Verified all 22 system tests and performance benchmarks (up to ~21000x faster lookups) passed successfully.

## [1.4.8] - January 27, 2026

### Security Hardening & Mobile Fixes

Critical security patches for Edge Functions and mobile interface corrections.

<!-- -->

#### Fixes (4)
- **Broken Access Control**: Fixed a critical vulnerability in `get-users` Edge Function where the Service Role key was used without proper role validation.
- **User List Visibility**: Implemented `get-users` Edge Function fallback to bypass RLS limitations, ensuring Admins can see all users.
- **Mobile Menu**: Filtered out redundant items from the mobile "Menu" sheet that are already present in the floating mobile dock.
- **PWA Prompt**: Fixed `useEffect` dependency error in `DashboardProfile` and optimized PWA prompt logic.

#### Patches (2)
- **Contributor Updates**: Expanded the contributor list in the Profile page to include **Manus** and updated **Abelion**'s social profile links.
- **Icon Refinement**: Upgraded high-resolution logos for Antigravity, Claude, Gemini, Jules, and Stitch in the contributor section.

## [1.4.7] - January 26, 2026

### Admin UX & Notion Sync Upgrade

Major improvements to the admin interface and Notion synchronization capabilities.

<!-- -->

#### Improvements (3)
- **Review Split View**: Implemented a responsive Split-View (Editor + Live Preview) for content approval, using `ResizablePanel` on desktop.
- **Notion Sync Upgrade**: Upgraded `sync-notion-page` Edge Function to recursively fetch nested blocks (toggles, lists) and support `Category` (case-sensitive), `Slug`, and `Cover` fields.
- **Mobile Inbox Badge**: Added real-time badge count to the floating mobile dock for Admin Inbox.

## [1.4.6] - January 25, 2026

### PWA & Security Hardening

Official introduction of PWA support and critical security hardening for administrative roles.

<!-- -->

#### Improvements (2)
- Added Progressive Web App (PWA) support with standalone mode and custom installation prompt.
- Enhanced `material_requests` table with support for different request types (Module, Feature, Bug) and image uploads.

#### Fixes (3)
- Fixed Superadmin RLS permissions using `SECURITY DEFINER` to prevent recursion and ensure consistent access.
- Added database trigger to prevent unauthorized privilege escalation to the superadmin role.
- Fixed mobile layout scrolling issues and sidebar badge visibility for pending requests.

#### Patches (1)
- Switched to Bun as the primary runner for build and installation to resolve permission errors on Windows.

## [1.4.5] - January 24, 2026

### Admin Dashboard Stability

Fixed a critical crash in the Admin Dashboard for Super Admin users and resolved missing backend function errors.

<!-- -->

#### Fixes (3)
- Fixed React crash in Admin Dashboard by adding missing `superadmin` role mapping for icons and labels.
- Restored missing `get_popular_modules` database function to resolve 404 errors.
- Added error handling to `usePopularModules` hook to prevent dashboard crashes when analytics data is unavailable.
- Implemented real-time n8n API key generation and secure storage.
- Optimized Vite chunking strategy to reduce initial bundle size.
- Refactored Auth initialization to improve performance.

#### Improvements (1)
- Optimized learning stats with server-side aggregation for faster dashboard loading.

## [1.4.4] - January 23, 2026

### Premium Design & Performance

Major overhaul of the visual system and critical performance optimizations for the learning environment.

<!-- -->

#### Improvements (3)
- **Dark Mode Premium**: Implemented Glassmorphism, improved typography, and added mobile-friendly navigation tabs.
- Optimized `ModuleLearn` rendering by offloading Pyodide (Python execution) to a dedicated Web Worker.
- Updated Changelog UI with a modern 'Glass Liquid' aesthetic and version summary table.

#### Fixes (3)
- Fixed runtime crash `j.map is not a function` in `ModuleLearn` when handling empty content.
- Fixed sidebar persistence issue where the collapsed state was lost on page refresh.
- Resolved RLS and API validation security vulnerabilities.

#### Patches (1)
- Added RLS policies for the `rate_limits` table to prevent unauthorized access.

## [1.4.3] - January 22, 2026

### Critical Security Hardening

Comprehensive security audit and resolution of data leakage vulnerabilities.

<!-- -->

#### Fixes (3)
- **PII Leakage Fix**: Resolved Personally Identifiable Information (PII) exposure in profile RLS policies.
- **Console Audit**: Removed debug logs in production that leaked sensitive system information.
- Hardened RLS rules for `profiles` table to prevent unauthorized data access.

## [1.4.2] - January 21, 2026

### Performance & Code Quality

Optimization of module fetching and resolution of type safety issues.

<!-- -->

#### Improvements (2)
- Optimized module fetching logic by request ID for faster navigation.
- Optimized module progress lookup to O(1) for improved dashboard performance.

#### Fixes (5)
- Replaced `any` types with proper TypeScript types in `DashboardProfile.tsx` and `generate-quiz` Supabase function.
- Fixed regex-related ESLint errors (`no-control-regex`, `no-useless-escape`) in Supabase Edge Functions.
- Converted `require()` statements to ES module imports in `tailwind.config.ts`.
- Resolved missing dependency warnings in `QuizPlayer.tsx` and `CustomCursor.tsx`.
- Added index on `user_progress.module_id` for faster filtering.

## [1.4.1] - January 20, 2026

### Code Quality & Security Audit

Comprehensive codebase audit to resolve all ESLint errors and improve type safety.

#### Fixes (3)
- Replaced all `any` types with proper TypeScript interfaces in Pyodide, Notification, and Profile modules.
- Converted empty interfaces to type aliases (`TextareaProps`, `LearningSource`).
- Used `unknown` type with proper type guards in all catch blocks.

#### Patches (4)
- Removed Super Admin debug console.log from `DashboardUsers.tsx` and `useUsers.ts` per security checklist.
- Added `PyodideInstance` interface export for proper type sharing between modules.
- Added `PyodideInstance` interface in `pyodide-manager.ts`.
- Added proper `Notification` type import in badge and notifications pages.

---



## [1.4.0] - January 19, 2026

### Major Frontend Upgrade & Premium UX

A comprehensive upgrade to the user interface, introducing dynamic theming, premium interactions, and performance optimizations.

#### Improvements (4)
- Dynamic Theme System: Auth page and components now fully support System/Light/Dark mode switching.
- Premium UX: Integrated animated Custom Cursor and GSAP-powered Smooth Scrolling for a high-end feel.
- Theme Transition: Implemented smooth visual transitions between theme changes across the platform.
- Security Visibility: Added show/hide password toggles to all authentication forms.

#### Fixes (8)
- Fixed Autofill Contrast: Fixed "white-on-white" input issue in dark mode when using browser autofill.
- Fixed SPA Routing: Added `vercel.json` with SPA rewrites to fix 404 errors on production page reloads.
- Fixed Smart Navigation: Fixed "Coming Soon" pages to use historical back navigation instead of hardcoded redirects.
- Fixed Landing Access: Enabled landing page access for authenticated users with dynamic "Dashboard" navigation.
- Fixed Module Not Found: Fixed query error in `useModule` hook (profiles.full_name -> display_name).
- Fixed Changelog Display: Fixed markdown bold rendering by stripping markers in changelog parser.
- Fixed Profile Edit Screen: Fixed blank screen issue when clicking Edit Profile by adding dedicated edit card.
- Fixed Super Admin Protection: Added protection for primary admin email from role downgrades.

#### Patches (5)
- Enhanced Profile Edit UX by conditionally hiding non-essential dashboard cards.
- Added direct link to changelog from Profile Settings page.
- Sidebar collapsed state now persists across sessions using localStorage.
- Added comprehensive Aria labels and semantic roles to the core learning interface.
- Audited and removed 13 unused Shadcn components, reducing source code footprint.

---

## [1.3.1] - January 18, 2026

### Bug Fixes & Database Improvements

Critical bug fixes and database schema improvements for production stability.

#### Fixes (5)
- Fixed `useTotalStudents` missing export in `useUserProgress.ts`
- Fixed profile fetch 400 errors by removing non-existent columns (`full_name`, `bio`, `location`)
- Fixed admin/tutor module access - added redirect from `/module/:id` to `/learn/:id`
- Fixed `DashboardProfile` to use `display_name` instead of non-existent profile fields
- Added React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`)

#### Improvements (5)
- Created `learning_sources` table with correct RLS policies
- Created `integrations` table for API key management
- Created `incoming_contents` table for n8n webhook integration
- Added Edge Function `generate-api-key` for integration API key generation
- Created standalone SQL migration for missing tables

---

## [1.3.0] - January 17, 2026

### Total System Repair

Major system-wide repair and redesign to stabilize the application after failed redesign attempt.

#### Improvements (8)
- Implemented dark-first design system with Indigo/Zinc color palette
- Added URL-based tab persistence across Profile and Admin Dashboard
- Created interactive sidebar account dropdown with hover effects
- Improved marquee animation with 3-track seamless infinite loop
- Added responsive 3-column layout for learning interface
- Implemented role-based navigation in dashboard sidebar
- Added collapsible sidebar feature for more workspace
- Improved mobile responsiveness with bottom navigation

#### Fixes (6)
- Fixed sidebar overlap issue with main content (250px fixed width)
- Fixed tab content isolation in Profile page
- Fixed profile header showing in all tabs (now only in Profile tab)
- Fixed Coming Soon pages having redundant buttons
- Fixed marquee loop jerk/gap when resetting
- Fixed missing routes returning 404

#### Patches (3)
- Added Coming Soon routes for unimplemented features
- Cleaned up unused imports in DashboardSettings
- Removed progress indicator from Coming Soon pages

---

## [1.2.0] - January 15, 2026

### Learning Interface Redesign

Comprehensive redesign of the learning interface with hybrid layout.

#### Improvements (5)
- New 3-column learning layout (Rail + Content + Notes)
- Resizable panels for content and notes sections
- Text selection to notes feature
- Quiz section integration at end of content
- Scroll-based progress tracking

#### Fixes (3)
- Fixed guided notes not persisting
- Fixed quiz completion not updating progress
- Fixed content rendering issues with markdown

#### Patches (2)
- Updated quiz player styling
- Improved notes panel scrolling

---

## [1.1.0] - January 10, 2026

### Dashboard and Authentication

Core dashboard implementation with role-based access.

#### Improvements (6)
- Role-based dashboard views (Student, Tutor, Admin)
- User management for admins
- Material request system
- AI-powered module generation
- Learning sources management
- Profile page with activity tracking

#### Fixes (2)
- Fixed Supabase authentication flow
- Fixed role detection on login

#### Patches (1)
- Added loading skeletons for better UX

---

## [1.0.0] - December 23, 2025

### Initial Release

First stable release of LearnInk learning platform.

#### Improvements
- User authentication with Supabase
- Module browsing and learning
- Guided notes system
- Quiz system with scoring
- Progress tracking
- Dark/Light theme support
- Mobile-responsive design

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.7.4 | Feb 1, 2026 | Context Sync & Feature Restoration |
| 1.7.3 | Feb 1, 2026 | Progress Persistence & Navigation Stabilization |
| 1.7.2 | Jan 31, 2026 | Accessibility Compliance & Interaction Optimization |
| 1.7.1 | Jan 31, 2026 | SEO, Navigation Feedback & Smart Prefetching |
| 1.7.0 | Jan 31, 2026 | Mobile Performance & Low-End Optimization |
| 1.6.0 | Jan 30, 2026 | Gacha Rewards, Apple UI Polish & Mobile Experience |
| 1.4.11 | Jan 29, 2026 | Notifications, Testing, Security & Type Safety |
| 1.4.9 | Jan 28, 2026 | Audit & Stability (Environment Fix) |
| 1.4.8 | Jan 27, 2026 | Security Hardening & Mobile Fixes |
| 1.4.7 | Jan 26, 2026 | Admin UX & Notion Sync Upgrade |
| 1.4.6 | Jan 25, 2026 | PWA Support & Security Hardening |
| 1.4.5 | Jan 24, 2026 | Admin Dashboard & Optimized Chunks |
| 1.4.4 | Jan 23, 2026 | Premium Design & Performance Overhaul |
| 1.4.3 | Jan 22, 2026 | Critical Security Hardening |
| 1.4.2 | Jan 21, 2026 | Performance & Code Quality |
| 1.4.1 | Jan 20, 2026 | Code Quality & Security Audit |
| 1.4.0 | Jan 19, 2026 | Major Frontend Upgrade & Premium UX |
| 1.3.1 | Jan 18, 2026 | Bug Fixes & Database Schema |
| 1.3.0 | Jan 17, 2026 | Total System Repair - Stability & Dark Mode |
| 1.2.0 | Jan 15, 2026 | Learning Interface Redesign |
| 1.1.0 | Jan 10, 2026 | Dashboard & Auth Implementation |
| 1.0.0 | Dec 23, 2025 | Initial Release |
