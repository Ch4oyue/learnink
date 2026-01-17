# LearnInk Changelog

All notable changes to the LearnInk platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| 1.3.0 | Jan 17, 2026 | Total System Repair - Stability & Dark Mode |
| 1.2.0 | Jan 15, 2026 | Learning Interface Redesign |
| 1.1.0 | Jan 10, 2026 | Dashboard & Auth Implementation |
| 1.0.0 | Dec 23, 2025 | Initial Release |
