import { expect, test } from "@playwright/test";

test("dranks", async ({ page }) => {
  await page.goto("http://localhost:3000/dranks");

  await expect(page).toHaveTitle(/Dranks/);

  const dranks = page.locator("section#drank-list").getByRole("listitem");
  await expect(dranks).not.toHaveCount(0);
  await expect(dranks.first().locator("img").first()).toBeVisible();

  // a single drank
  const drank = dranks.first().getByRole("link");
  const drankTitle = (await drank.innerText()).trim();

  await drank.click();
  await expect(page).toHaveTitle(new RegExp(drankTitle));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    new RegExp(drankTitle),
  );
});
