import { describe, expect, it } from "vitest";
import { parseWorkHtml, parseWorkId } from "./ao3";

describe("parseWorkId", () => {
  it("accepts work links in their common forms", () => {
    expect(parseWorkId("https://archiveofourown.org/works/50123001")).toBe("50123001");
    expect(parseWorkId("  https://archiveofourown.org/works/50123001/chapters/9 ")).toBe("50123001");
    expect(parseWorkId("archiveofourown.org/works/7?view_adult=true")).toBe("7");
  });
  it("rejects everything else", () => {
    expect(parseWorkId("https://archiveofourown.org/users/someone")).toBeNull();
    expect(parseWorkId("https://example.com/works/123")).toBeNull();
    expect(parseWorkId("")).toBeNull();
  });
});

const PAGE = `
<html><body>
<div id="workskin">
  <div class="preface group">
    <h2 class="title heading">
      the ninth hour, and the tenth
    </h2>
    <h3 class="byline heading"><a rel="author" href="/users/ohseolbae/pseuds/ohseolbae">ohseolbae</a></h3>
  </div>
</div>
<dl class="work meta group">
  <dd class="fandom tags"><ul class="commas"><li><a class="tag" href="#">NMIXX (Band)</a></li></ul></dd>
  <dd class="relationship tags"><ul class="commas"><li><a class="tag" href="#">Oh Haewon/Lily Morrow</a></li><li><a class="tag" href="#">Bae Jinsol/Sullyoon</a></li></ul></dd>
  <dd class="stats"><dl class="stats"><dt class="words">Words:</dt><dd class="words">48,200</dd></dl></dd>
</dl>
</body></html>`;

describe("parseWorkHtml", () => {
  it("reads title, author, first fandom, first ship and word count", () => {
    expect(parseWorkHtml(PAGE)).toEqual({
      title: "the ninth hour, and the tenth",
      author: "ohseolbae",
      fandom: "NMIXX (Band)",
      ship: "Oh Haewon/Lily Morrow",
      words: 48200,
    });
  });
  it("returns null for a page without a work title (login wall, error)", () => {
    expect(parseWorkHtml("<html><body><h2 class='heading'>Sorry</h2></body></html>")).toBeNull();
  });
});
