import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import * as fs from "fs";
import * as path from "path";

/**
 * Netlify Function: /api/raw/:slug
 *
 * Serves raw markdown files for AI tools (ChatGPT, Claude, Perplexity).
 * Returns text/plain with minimal headers for reliable AI ingestion.
 */

// Response headers optimized for AI crawlers
const AI_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600",
  // No Link, X-Robots-Tag, or SEO headers
};

// Extract slug from path like /api/raw/my-post or /.netlify/functions/raw/my-post
function extractSlug(rawPath: string): string | null {
  // Handle both /api/raw/:slug and /.netlify/functions/raw/:slug patterns
  const patterns = [
    /^\/api\/raw\/(.+)$/,
    /^\/.netlify\/functions\/raw\/(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = rawPath.match(pattern);
    if (match && match[1]) {
      // Remove .md extension if present
      return match[1].replace(/\.md$/, "");
    }
  }

  return null;
}

// Try to read markdown file from multiple locations
function readMarkdownFile(slug: string): string | null {
  // Possible file locations (in order of priority)
  const locations = [
    // Production: built output
    path.join(process.cwd(), "dist", "raw", `${slug}.md`),
    // Dev/Preview: source files
    path.join(process.cwd(), "public", "raw", `${slug}.md`),
  ];

  for (const filePath of locations) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
      }
    } catch {
      // Continue to next location
    }
  }

  return null;
}

const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: AI_HEADERS,
      body: "Method not allowed. Use GET.",
    };
  }

  // Extract slug from path
  const slug = extractSlug(event.path);

  if (!slug) {
    return {
      statusCode: 400,
      headers: AI_HEADERS,
      body: "Bad request. Usage: /api/raw/{slug}",
    };
  }

  // Try to read the markdown file
  const content = readMarkdownFile(slug);

  if (!content) {
    return {
      statusCode: 404,
      headers: AI_HEADERS,
      body: `Not found: ${slug}.md`,
    };
  }

  // Return the raw markdown content
  return {
    statusCode: 200,
    headers: AI_HEADERS,
    body: content,
  };
};

export { handler };

