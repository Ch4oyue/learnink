import { test, expect } from "@playwright/test";
for (const theme of ["light", "dark"])
  test.describe(theme, () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("changelog disclosure responds to keyboard and maintains panel accessibility", async ({
      page,
    }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/changelog");
      const trigger = page
        .getByRole("button", { name: /Improvements/ })
        .first();
      await expect(trigger).toBeVisible();
      const wasExpanded = await trigger.getAttribute("aria-expanded");
      await trigger.focus();
      await trigger.press("Enter");
      await expect(trigger).toHaveAttribute(
        "aria-expanded",
        wasExpanded === "true" ? "false" : "true",
      );
      await trigger.press("Space");
      await expect(trigger).toHaveAttribute("aria-expanded", wasExpanded!);
      await page.screenshot({
        path: `/downloads/disclosure-${theme}.png`,
        fullPage: true,
      });
    });
  });
