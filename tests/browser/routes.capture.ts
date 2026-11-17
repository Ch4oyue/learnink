import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { installApp, USER_ID } from "./support/app";
const routes: [string, "user" | "tutor" | "admin" | "superadmin"][] = [
  ["/", "user"],
  ["/auth", "user"],
  ["/login", "user"],
  ["/syllabus", "user"],
  ["/changelog", "user"],
  ["/dashboard", "user"],
  ["/dashboard/profile", "user"],
  ["/dashboard/settings", "user"],
  ["/dashboard/second-brain", "user"],
  ["/dashboard/analytics", "user"],
  ["/dashboard/achievements", "user"],
  ["/dashboard/courses", "user"],
  ["/dashboard/course/t1", "user"],
  ["/dashboard/modules", "tutor"],
  ["/dashboard/modules/create", "tutor"],
  ["/dashboard/modules/edit/m1", "tutor"],
  ["/dashboard/users", "admin"],
  ["/dashboard/requests", "admin"],
  ["/dashboard/request", "admin"],
  ["/dashboard/notifications", "user"],
  ["/dashboard/share-target", "user"],
  ["/dashboard/admin/approval", "admin"],
  ["/dashboard/admin/sources", "admin"],
  ["/dashboard/admin/integrations", "admin"],
  ["/dashboard/admin/system", "superadmin"],
  ["/learn/m1", "user"],
  ["/module/m1", "user"],
  ["/modules", "user"],
  ["/not-a-registered-page", "user"],
];
const expected: Record<string, string> = {
  "/dashboard/admin/approval": "Unified Inbox",
  "/dashboard/admin/sources": "Learning Sources Manager",
  "/dashboard/admin/integrations": "Integration",
  "/dashboard/admin/system": "System Control",
  "/dashboard": "Web Foundations",
  "/dashboard/analytics": "Points",
  "/dashboard/achievements": "unlocked",
  "/dashboard/modules": "CSS Layout",
  "/dashboard/modules/create": "Create New Module",
  "/dashboard/modules/edit/m1": "Edit Module",
  "/dashboard/course/t1": "Web Foundations",
  "/dashboard/courses": "Web Foundations",
  "/modules": "Web Foundations",
  "/learn/m1": "Learn to arrange content.",
  "/module/m1": "Learn to arrange content.",
  "/dashboard/profile": "Test Learner",
  "/dashboard/settings": "Appearance",
  "/dashboard/second-brain": "Flexbox uses a main axis.",
  "/dashboard/users": "Test Admin",
  "/changelog": "Changelog",
  "/dashboard/requests": "Requests & Feedback",
  "/dashboard/request": "Requests & Feedback",
  "/dashboard/share-target": "Requests & Feedback",
  "/dashboard/notifications": "Notifications",
  "/not-a-registered-page": "404",
  "/auth": "Welcome back.",
  "/login": "Welcome back.",
  "/syllabus": "Syllabus AI & Automation",
  "/": "Master technical skills",
};
const module = {
  id: "m1",
  track_id: "t1",
  title: "CSS Layout",
  summary: "Grid and flexbox fundamentals",
  content:
    "# CSS Layout\n\nLearn to arrange content.\n\n## Flexbox\n\nAlign items along a main axis.\n\n## Grid\n\nBuild two-dimensional layouts.",
  level: "beginner",
  category: "general",
  is_published: true,
  created_by: USER_ID,
  created_at: "2026-11-01T00:00:00Z",
  icon_name: "BookOpen",
};
for (const [size, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  for (const theme of ["light", "dark"]) {
    test.describe(`${size}-${theme}`, () => {
      test.use({ viewport });
      for (const [path, role] of routes) {
        test(`route ${path}`, async ({ page }) => {
          const dir = `/downloads/route-qa-${process.env.CAPTURE_SHA ?? "current"}/${size}-${theme}`;
          mkdirSync(dir, { recursive: true });
          const errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          await installApp(page, {
            role,
            functions: {
              "get-users": () => ({
                users: [
                  {
                    id: USER_ID,
                    email: "admin@example.test",
                    display_name: "Test Admin",
                    role: "admin",
                    created_at: "2026-01-01T00:00:00Z",
                    labels: [],
                    points: 120,
                  },
                ],
                meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
              }),
            },
            db: {
              modules: [module],
              tracks: [
                {
                  id: "t1",
                  name: "Web Foundations",
                  slug: "web",
                  description: "Build accessible web interfaces.",
                  is_active: true,
                  icon: "BookOpen",
                },
              ],
              user_tracks: [
                {
                  id: "ut1",
                  user_id: USER_ID,
                  track_id: "t1",
                  track: {
                    id: "t1",
                    name: "Web Foundations",
                    description: "Build accessible web interfaces.",
                    icon: "BookOpen",
                    is_active: true,
                  },
                },
              ],
              user_progress: [
                {
                  id: "p1",
                  user_id: USER_ID,
                  module_id: "m1",
                  progress_percent: 50,
                  is_completed: false,
                },
              ],
              learning_notes: [
                {
                  id: "n1",
                  user_id: USER_ID,
                  module_id: "m1",
                  content: "Flexbox uses a main axis.",
                  highlighted_text: "main axis",
                  created_at: "2026-11-01T00:00:00Z",
                  updated_at: "2026-11-01T00:00:00Z",
                },
              ],
              label_configs: [],
              system_settings: [],
            },
          });
          await page.addInitScript(
            ({ t, guest }) => {
              localStorage.setItem("theme", t);
              if (guest) localStorage.removeItem("sb-placeholder-auth-token");
            },
            {
              t: theme,
              guest: [
                "/",
                "/auth",
                "/login",
                "/syllabus",
                "/changelog",
              ].includes(path),
            },
          );
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          await expect(
            page.getByText(/^Loading(?: module)?(?:\.\.\.|…)$/),
          ).toHaveCount(0, { timeout: 20000 });
          if (expected[path])
            await expect(
              page.getByText(expected[path], { exact: false }).first(),
            ).toBeVisible({ timeout: 20000 });
          await expect(page.locator(".skeleton")).toHaveCount(0, {
            timeout: 20000,
          });
          await page.waitForTimeout(850);
          await expect(page.locator("body")).not.toBeEmpty();
          const slug = path.replaceAll("/", "_");
          const before = await page.evaluate(() => ({
            width: innerWidth,
            height: innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            url: location.pathname,
            title: document.title,
            headings: [...document.querySelectorAll("h1,h2")].map(
              (e) => e.textContent,
            ),
            innerScroll: [...document.querySelectorAll("*")]
              .filter((e) => {
                const s = getComputedStyle(e);
                return (
                  /auto|scroll/.test(s.overflowY) &&
                  e.scrollHeight > e.clientHeight + 5
                );
              })
              .map((e) => ({
                tag: e.tagName,
                className: e.className,
                height: e.clientHeight,
                scrollHeight: e.scrollHeight,
              })),
          }));
          await page.screenshot({
            path: `${dir}/${slug}-viewport.png`,
            animations: path === "/" ? "allow" : "disabled",
            timeout: 12000,
          });
          // Reveal in-view sections by scrolling before evidence-only expansion.
          for (const heading of await page.locator("h2").all()) {
            if (!await heading.isVisible()) continue;
            await heading.evaluate(e => e.scrollIntoView({block:"center"}));
            await page.waitForTimeout(40);
          }
          await page.waitForTimeout(400);
          // Evidence-only expansion: let Playwright capture the content of nested app scroll panes.
          await page.evaluate(() => {
            document.documentElement.style.height = "auto";
            document.body.style.height = "auto";
            document.body.style.overflow = "visible";
            for (const e of document.querySelectorAll<HTMLElement>("*")) {
              const s = getComputedStyle(e);
              const r = e.getBoundingClientRect();
              if (
                s.position === "fixed" &&
                r.top > innerHeight / 2 &&
                r.height < 160
              )
                e.style.visibility = "hidden";
              if (
                /auto|scroll|hidden/.test(s.overflowY) &&
                e.scrollHeight > e.clientHeight + 5
              ) {
                e.style.height = "auto";
                e.style.maxHeight = "none";
                e.style.overflowY = "visible";
                e.style.flexShrink = "0";
              }
            }
          });
          await page.screenshot({
            path: `${dir}/${slug}-full.png`,
            fullPage: true,
            animations: path === "/" ? "allow" : "disabled",
            timeout: 12000,
          });
          writeFileSync(
            `${dir}/${slug}.json`,
            JSON.stringify(
              {
                ...before,
                sourceCommit:process.env.CAPTURE_SHA ?? "current",
                errors,
                capture:
                  "Fixture data; full capture expands nested scroll panes and hides fixed bottom overlays. Viewport capture preserves normal layout.",
              },
              null,
              2,
            ),
          );
          expect(errors).toEqual([]);
        });
      }
    });
  }
}
