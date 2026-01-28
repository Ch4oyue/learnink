# LearnInk Changelog

All notable changes to the LearnInk platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.9] - January 29, 2026

### Audit & Stability

Comprehensive security audit, performance verification, and environment stabilization.

<!-- -->

#### Patches (2)
- **Environment Fix**: Resolved missing dependency issues by strictly enforcing `bun install` for Windows stability.
- **Audit Verification**: Verified all 22 system tests and performance benchmarks (up to ~21000x faster lookups) passed successfully.

## [1.4.8] - January 28, 2026

### Admin UX, Sync & Security Hardening

Major improvements to the admin interface, Notion synchronization, and critical security patches for Edge Functions.

<!-- -->

#### Improvements (3)
- **Review Split View**: Implemented a responsive Split-View (Editor + Live Preview) for content approval, using `ResizablePanel` on desktop.
- **Notion Sync Upgrade**: Upgraded `sync-notion-page` Edge Function to recursively fetch nested blocks (toggles, lists) and support `Category` (case-sensitive), `Slug`, and `Cover` fields.
- **Mobile Inbox Badge**: Added real-time badge count to the floating mobile dock for Admin Inbox.

#### Fixes (4)
- **Broken Access Control**: Fixed a critical vulnerability in `get-users` Edge Function where the Service Role key was used without proper role validation.
- **User List Visibility**: Implemented `get-users` Edge Function fallback to bypass RLS limitations, ensuring Admins can see all users.
- **Mobile Menu**: Filtered out redundant items from the mobile "Menu" sheet that are already present in the floating dock.
- **PWA Prompt**: Fixed `useEffect` dependency error in `DashboardProfile` and optimized PWA prompt logic.

#### Patches (2)
- **Contributor Updates**: Expanded the contributor list in the Profile page to include **Manus** and updated **Abelion**'s social profile links.
- **Icon Refinement**: Upgraded high-resolution logos for Antigravity, Claude, Gemini, Jules, and Stitch in the contributor section.

## [1.4.6] - January 27, 2026

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

## [1.4.5] - January 26, 2026

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

## [1.4.4] - January 25, 2026

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

## [1.4.3] - January 24, 2026

### Security Hardening & Data Protection

Comprehensive security audit and resolution of data leakage vulnerabilities.

<!-- -->

#### Security (3)
- **PII Leakage Fix**: Resolved Personally Identifiable Information (PII) exposure in profile RLS policies.
- **Console Audit**: Removed debug logs in production that leaked sensitive system information.
- Hardened RLS rules for `profiles` table to prevent unauthorized data access.

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

#### Database (3)
- Created `learning_sources` table with correct RLS policies
- Created `integrations` table for API key management
- Created `incoming_contents` table for n8n webhook integration

#### Infrastructure (2)
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

#### Features
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
| 1.4.9 | Jan 29, 2026 | Audit & Stability (Environment Fix) |
| 1.4.8 | Jan 29, 2026 | Critical Security Patch (Edge Function RBAC) |
| 1.4.7 | Jan 28, 2026 | Admin UX & Notion Sync Upgrade |
| 1.4.6 | Jan 27, 2026 | PWA Support & Security Hardening |
| 1.4.5 | Jan 26, 2026 | Admin Dashboard & Optimized Chunks |
| 1.4.4 | Jan 25, 2026 | Premium Design & Performance Overhaul |
| 1.4.3 | Jan 24, 2026 | Security Hardening & PII Leakage Fix |
| 1.4.2 | Jan 24, 2026 | Bug Fixes & Code Quality |
| 1.4.1 | Jan 20, 2026 | Code Quality & Security Audit |
| 1.4.0 | Jan 19, 2026 | Major Frontend Upgrade & Premium UX |
| 1.3.1 | Jan 18, 2026 | Bug Fixes & Database Schema |
| 1.3.0 | Jan 17, 2026 | Total System Repair - Stability & Dark Mode |
| 1.2.0 | Jan 15, 2026 | Learning Interface Redesign |
| 1.1.0 | Jan 10, 2026 | Dashboard & Auth Implementation |
| 1.0.0 | Dec 23, 2025 | Initial Release |
