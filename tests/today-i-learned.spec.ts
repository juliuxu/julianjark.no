import { expect, test } from "@playwright/test";

test("today i learned", async ({ page }) => {
  await page.goto("http://localhost:3000/today-i-learned");

  await expect(page).toHaveTitle(/I dag lærte jeg/);

  const articles = page.getByRole("article");
  await expect(articles).not.toHaveCount(0);

  // a single entry
  const article = articles.first();
  await expect(article.getByRole("heading", { level: 2 })).toBeVisible();

  const articleTitle = await article
    .getByRole("heading", { level: 2 })
    .innerText();

  await article.getByRole("link").filter({ hasText: articleTitle }).click();
  await new Promise((r) => setTimeout(r, 200));

  await expect(page).toHaveTitle(new RegExp(articleTitle));
});
