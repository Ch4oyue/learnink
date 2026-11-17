import { test, expect } from "@playwright/test";
import { installApp } from "./support/app";
for (const theme of ["light", "dark"])
  test.describe(`mobile-${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test(`sheet navigation contains pixels, Escape and outside dismiss`, async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await installApp(page);
      await page.goto("/dashboard");
      const trigger = page.getByRole("button", { name: "Menu", exact: true });
      await expect(trigger).toBeVisible();
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(350);
      const box = await dialog.boundingBox();
      expect(
        box &&
          box.x >= 0 &&
          box.x + box.width <= 390 &&
          box.y >= 0 &&
          box.y + box.height <= 844,
      ).toBe(true);
      await page.screenshot({ path: `/downloads/sheet-mobile-${theme}.png` });
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.mouse.click(4, 4);
      await expect(dialog).toHaveCount(0);
    });
  });
for (const theme of ["light", "dark"])
  test.describe(`side-${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("learning contents and notes use contained side drawers", async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await installApp(page, {
        db: {
          modules: [
            {
              id: "m1",
              title: "CSS Layout",
              summary: "Layouts",
              content: "# CSS Layout\n\nLayouts",
              is_published: true,
              category: "general",
              level: "beginner",
            },
          ],
        },
      });
      await page.goto("/learn/m1");
      for (const [triggerName, title] of [
        ["Open Table of Contents", "Table of Contents"],
        ["Open Notes", "Guided Notes"],
      ]) {
        const trigger = page.getByRole("button", {
          name: triggerName,
          exact: true,
        });
        await trigger.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("heading", { name: title })).toHaveCount(
          1,
        );
        await page.waitForTimeout(350);
        const box = await dialog.boundingBox();
        expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
        await page.screenshot({
          path: `/downloads/sheet-${triggerName.replaceAll(" ", "-")}-${theme}.png`,
        });
        await dialog
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
    });
  });
test.describe("PWA drawer", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  });
  test("iOS prompt preserves dismissal state", async ({ page }) => {
    await installApp(page);
    await page.goto("/dashboard");
    const drawer = page.getByRole("dialog", {
      name: "Install the LearnInk App",
    });
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByText("Add to Home Screen", { exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: "/downloads/drawer-pwa-ios.png" });
    await drawer.getByRole("button", { name: "Later" }).click();
    await expect(drawer).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("pwa_prompt_dismissed")),
    ).toBe("true");
  });
});
