import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderInlineText } from "./inline-text";

describe("server-safe inline formatting", () => {
  it("renders formatting and secure links during server rendering", () => {
    const html = renderToStaticMarkup(<p>{renderInlineText("Use **clear copy** and [read more](https://example.com).")}</p>);
    expect(html).toContain("<strong>clear copy</strong>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("leaves non-https link syntax as text", () => {
    const html = renderToStaticMarkup(<p>{renderInlineText("[unsafe](javascript:alert(1))")}</p>);
    expect(html).not.toContain("href=");
  });
});
