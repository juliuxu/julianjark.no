import { expect, test } from "@playwright/test";

test("landing page", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page).toHaveTitle(/Julian Jark/);
});
