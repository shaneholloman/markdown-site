const fs = require("fs");
const path = require("path");

/**
 * Netlify Function: /api/raw/:slug
 *
 * Serves raw markdown files for AI tools (ChatGPT, Claude, Perplexity).
 * Returns text/plain with minimal headers for reliable AI ingestion.
 */

function normalizeSlug(input) {
  return (input || "").trim().replace(/^\/+|\/+$/g, "");
}

function tryRead(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const body = fs.readFileSync(p, "utf8");
    if (!body || body.trim().length === 0) return null;
    return body;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  const slugRaw =
    event.queryStringParameters && event.queryStringParameters.slug;
  const slug = normalizeSlug(slugRaw);

  if (!slug) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: "missing slug",
    };
  }

  const filename = slug.endsWith(".md") ? slug : `${slug}.md`;
  const root = process.cwd();

  const candidates = [
    path.join(root, "public", "raw", filename),
    path.join(root, "dist", "raw", filename),
  ];

  let body = null;
  for (const p of candidates) {
    body = tryRead(p);
    if (body) break;
  }

  if (!body) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
      body: `not found: ${filename}`,
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
    body,
  };
};

