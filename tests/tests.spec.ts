import { expect, test } from "@playwright/test";

test("landing page", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page).toHaveTitle(/Julian Jark/);
});

test("today i learned", async ({ page }) => {
  await page.goto("http://localhost:3000/today-i-learned");

  await expect(page).toHaveTitle(/I dag lærte jeg/);

  const articles = page.getByRole("article");
  await expect(articles).not.toHaveCount(0);
  await expect(
    articles.first().getByRole("heading", { level: 2 }),
  ).toBeVisible();
});
