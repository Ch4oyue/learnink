# LearnInk (v1.7.3)

LearnInk is a modern, high-performance Learning Management System (LMS) designed to deliver an interactive and seamless educational experience. It combines a premium "Glass Liquid" aesthetic with robust technical architecture, featuring in-browser code execution, real-time analytics, and mobile-first responsiveness.

## ✨ Key Features

### 🎓 Interactive Learning Experience
- **In-Browser Coding:** Integrated Python environment using **Pyodide** running in a dedicated Web Worker for non-blocking execution.
- **Rich Media Support:** Structured modules with video, text, and interactive quizzes.
- **Dynamic Progress Tracking:** Real-time updates with optimistic UI patterns.

### 🎨 "Glass Liquid" Design System
- **VisionOS/iOS Aesthetic:** A custom design language featuring translucent glass effects, consistent rounded corners (`rounded-[24px/32px]`), and light borders.
- **Fluid Motion:** Powered by **GSAP** and **Framer Motion** for smooth transitions and scroll effects.
- **Theme Support:** Native Light, Dark, and System modes.

### 📊 Comprehensive Dashboard
- **Analytics & Stats:** Visual breakdown of learning progress, streaks, and quiz performance.
- **Achievements:** Gamified milestone tracking system.
- **Requests:** Management interface for user requests and administrative actions.
- **Mobile Optimized:** Dedicated `MobileBottomNav`, responsive table layouts, and official **PWA Support**.

### 🛡️ Security & Performance
- **Supabase Authentication:** Secure, role-based access control (RBAC).
- **Row Level Security (RLS):** Granular data protection at the database level.
- **Edge Functions:** Optimized content ingestion and API key management.
- **Server-Side Aggregation:** Heavy statistics calculations offloaded to RPC functions (e.g., `get_user_learning_stats`).

## 🛠️ Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions)
- **Code Execution:** [Pyodide](https://pyodide.org/) (Web Worker implementation)
- **Animation:** [GSAP](https://greensock.com/gsap/), [Framer Motion](https://www.framer.com/motion/)

## 🚀 Getting Started

### Prerequisites
- **Bun** (v1.0.0+)
- **Supabase Account** (for backend setup)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_GIT_URL>
    cd learnink
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

4.  **Start Development Server:**
    ```bash
    bun run dev
    ```
    Access the app at `http://localhost:8080`.

## 🧪 Testing & Quality

- **Linting:**
    ```bash
    bun run lint
    ```
- **Benchmarks & Tests:**
    Run performance benchmarks (including Pyodide optimizations):
    ```bash
    bun test
    ```

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components (Glass Liquid style)
├── contexts/       # React Contexts (Auth, Theme)
├── hooks/          # Custom hooks (useLearningStats, useDebounce)
├── integrations/   # Supabase client and types
├── lib/            # Utilities & Workers
│   ├── pyodide.worker.ts  # Python execution worker
│   └── ...
├── pages/          # Application routes (Dashboard, Modules)
├── types/          # Global TypeScript definitions
└── App.tsx         # Main entry with routing
supabase/
├── migrations/     # Database schema & RPC functions
└── functions/      # Edge Functions (ingest-content, etc.)
tests/              # Benchmarks and integration tests
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch and open a Pull Request.

---
*Built with ❤️ using Bun & React.*
