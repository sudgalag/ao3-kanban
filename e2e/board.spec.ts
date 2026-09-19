import { expect, test, type Page } from "@playwright/test";

const STORE = "ficboard.v1";

const cardIn = (page: Page, col: string, title: RegExp) =>
  page.locator(`[data-col="${col}"]`).getByRole("button", { name: title });

test("shows the Reading board with sample cards and switches to Writing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("what you're reading")).toBeVisible();
  await expect(cardIn(page, "To Read", /salt on the windowsill/)).toBeVisible();
  await page.getByRole("tab", { name: "Writing" }).click();
  await expect(page.getByText("what you're writing")).toBeVisible();
  await expect(cardIn(page, "Drafting", /hedge maze/)).toBeVisible();
});

test("filters cards by fandom and clears the filter", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ITZY", exact: true }).click();
  await expect(cardIn(page, "To Read", /salt on the windowsill/)).toBeVisible();
  await expect(page.getByRole("button", { name: /a field guide to leaving/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByRole("button", { name: /a field guide to leaving/ })).toBeVisible();
});

test("opens the card sheet, moves the card with a chip and persists it", async ({ page }) => {
  await page.goto("/");
  await cardIn(page, "To Read", /salt on the windowsill/).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Finished" }).click();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(cardIn(page, "Finished", /salt on the windowsill/)).toBeVisible();
  await page.reload();
  await expect(cardIn(page, "Finished", /salt on the windowsill/)).toBeVisible();
});

test("rejects a non-AO3 link and adds a card by hand", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ Paste link" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("AO3 link").fill("https://example.com/works/1");
  await dialog.getByRole("button", { name: "Fetch details" }).click();
  await expect(dialog.getByText("That doesn't look like an AO3 work link.")).toBeVisible();

  await dialog.getByLabel("AO3 link").fill("https://archiveofourown.org/works/424242");
  await dialog.getByLabel("AO3 link").press("Enter");
  await expect(dialog.getByLabel("Title")).toBeVisible();
  await dialog.getByLabel("Title").fill("a test fic");
  await dialog.getByLabel("Author").fill("tester");
  await dialog.getByLabel("Fandom").fill("NMIXX");
  await dialog.getByLabel("Ship").fill("Haewon/Lily");
  await dialog.getByLabel("Words").fill("1500");
  await dialog.getByLabel("Column").selectOption("Reading");
  await dialog.getByRole("button", { name: "Add to board" }).click();
  await expect(cardIn(page, "Reading", /a test fic/)).toBeVisible();
  await expect(cardIn(page, "Reading", /a test fic/)).toContainText("1.5k words");
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "[]"), STORE);
  expect(stored.find((c: { title: string }) => c.title === "a test fic")?.url).toBe(
    "https://archiveofourown.org/works/424242",
  );
});

test("drags a card into another column with the mouse", async ({ page, isMobile }) => {
  test.skip(isMobile, "mouse drag only");
  await page.goto("/");
  const card = cardIn(page, "To Read", /salt on the windowsill/);
  const box = (await card.boundingBox())!;
  const target = (await page.locator('[data-col="Reading"]').boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 30, { steps: 4 });
  await page.mouse.move(target.x + target.width / 2, target.y + 120, { steps: 10 });
  await expect(page.locator('[data-col="Reading"]')).toHaveClass(/column--over/);
  await page.mouse.up();
  await expect(cardIn(page, "Reading", /salt on the windowsill/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("removes a card from the sheet", async ({ page }) => {
  await page.goto("/");
  await cardIn(page, "Rec'd", /a field guide to leaving/).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("button", { name: /a field guide to leaving/ })).toHaveCount(0);
  await expect(page.locator('[data-col="Rec\'d"]')).toContainText("Nothing waiting for review.");
});
