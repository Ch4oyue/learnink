# LearnInk

LearnInk is a modern learning management system (LMS) and educational platform designed to provide an interactive and engaging learning experience. Built with performance and developer experience in mind, it utilizes the latest web technologies.

## Features

- **Interactive Learning Modules:** Structured learning content with support for rich media.
- **Dynamic Theme System:** Native support for Light, Dark, and System themes across all pages (including Auth).
- **Premium UX & Motion:** GSAP-powered smooth scrolling and animated custom cursor for a high-end feel.
- **In-Browser Coding:** Integrated Python code execution environment using Pyodide.
- **Student Dashboard:** Track progress, manage enrolled courses, and view notifications.
- **Authentication:** Secure user authentication with Supabase, featuring show/hide password states.

## Tech Stack

This project is built with:

- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Frontend Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) and [shadcn-ui](https://ui.shadcn.com/)
- **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Backend & Database:** [Supabase](https://supabase.com/)
- **Code Execution:** [Pyodide](https://pyodide.org/) (Python in the browser)
- **Animations:** Framer Motion, GSAP
- **Charts:** Recharts

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- Node.js (optional, Bun is preferred)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Install dependencies:**

    ```sh
    bun install
    ```

3.  **Environment Setup:**

    Create a `.env` file in the root directory and add your Supabase configuration:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
    ```

4.  **Start the development server:**

    ```sh
    bun run dev
    ```

    The application will be available at `http://localhost:8080`.

## Scripts

- `bun run dev`: Start the development server.
- `bun run build`: Build the application for production.
- `bun run lint`: Run ESLint to check for code quality issues.
- `bun run preview`: Preview the production build locally.

## Project Structure

- `src/components`: Reusable UI components.
- `src/pages`: Application views and routes (Dashboard, Modules, Admin, etc.).
- `src/hooks`: Custom React hooks (including data fetching).
- `src/integrations`: External service integrations (Supabase).
- `src/lib`: Utility functions and helpers.
- `supabase`: Supabase configuration and migrations.

## Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
