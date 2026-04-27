import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

// Type for featured item from Convex (used for backwards compatibility)
export interface FeaturedItem {
  slug: string;
  type: "post" | "page";
}

// Type for featured data from Convex queries
interface FeaturedData {
  slug: string;
  title: string;
  excerpt: string;
  image?: string; // Thumbnail image for card view
  type: "post" | "page";
}

interface FeaturedCardsProps {
  items?: FeaturedItem[];
  useFrontmatter?: boolean;
  // Pre-fetched data from parent to avoid duplicate subscriptions
  featuredPosts?: Array<{
    slug: string;
    title: string;
    description: string;
    excerpt?: string;
    image?: string;
    featuredOrder?: number;
  }>;
  featuredPages?: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    image?: string;
    featuredOrder?: number;
  }>;
}

export default function FeaturedCards({
  items,
  useFrontmatter = true,
  featuredPosts: propFeaturedPosts,
  featuredPages: propFeaturedPages,
}: FeaturedCardsProps) {
  const useItemsMode = items && items.length > 0 && !useFrontmatter;

  // Skip queries when parent already provided data, or when not needed
  const fetchedFeaturedPosts = useQuery(
    api.posts.getFeaturedPosts,
    propFeaturedPosts !== undefined ? "skip" : {},
  );
  const fetchedFeaturedPages = useQuery(
    api.pages.getFeaturedPages,
    propFeaturedPages !== undefined ? "skip" : {},
  );

  const featuredPosts = propFeaturedPosts ?? fetchedFeaturedPosts;
  const featuredPages = propFeaturedPages ?? fetchedFeaturedPages;

  // Only fetch all posts/pages in legacy items mode
  const allPosts = useQuery(api.posts.getAllPosts, useItemsMode ? {} : "skip");
  const allPages = useQuery(api.pages.getAllPages, useItemsMode ? {} : "skip");

  // Build featured data from frontmatter (new mode)
  const getFeaturedFromFrontmatter = (): FeaturedData[] => {
    if (featuredPosts === undefined || featuredPages === undefined) {
      return [];
    }

    // Combine and sort by featuredOrder
    const combined: (FeaturedData & { featuredOrder?: number })[] = [
      ...featuredPosts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || p.description,
        image: p.image,
        type: "post" as const,
        featuredOrder: p.featuredOrder,
      })),
      ...featuredPages.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || "",
        image: p.image,
        type: "page" as const,
        featuredOrder: p.featuredOrder,
      })),
    ];

    // Sort: items with images first, then by featuredOrder within each group
    return combined.sort((a, b) => {
      // Primary sort: items with images come first
      const hasImageA = a.image ? 0 : 1;
      const hasImageB = b.image ? 0 : 1;
      if (hasImageA !== hasImageB) {
        return hasImageA - hasImageB;
      }
      // Secondary sort: by featuredOrder (lower first)
      const orderA = a.featuredOrder ?? 999;
      const orderB = b.featuredOrder ?? 999;
      return orderA - orderB;
    });
  };

  // Build featured data from items config (legacy mode)
  const getFeaturedFromItems = (): FeaturedData[] => {
    if (!items || allPosts === undefined || allPages === undefined) {
      return [];
    }

    const result: FeaturedData[] = [];

    for (const item of items) {
      if (item.type === "post") {
        const post = allPosts.find((p) => p.slug === item.slug);
        if (post) {
          result.push({
            title: post.title,
            excerpt: post.excerpt || post.description,
            image: post.image,
            slug: post.slug,
            type: "post",
          });
        }
      }
      if (item.type === "page") {
        const page = allPages.find((p) => p.slug === item.slug);
        if (page) {
          result.push({
            title: page.title,
            excerpt: page.excerpt || "",
            image: page.image,
            slug: page.slug,
            type: "page",
          });
        }
      }
    }

    return result;
  };

  const featuredData = useItemsMode
    ? getFeaturedFromItems()
    : getFeaturedFromFrontmatter();

  // Show nothing while loading
  const isLoading = useItemsMode
    ? allPosts === undefined || allPages === undefined
    : featuredPosts === undefined || featuredPages === undefined;

  if (isLoading) {
    return null;
  }

  if (featuredData.length === 0) {
    return null;
  }

  return (
    <div className="featured-cards">
      {featuredData.map((item) => (
        <Link key={item.slug} to={`/${item.slug}`} className="featured-card">
          {/* Thumbnail image displayed as square using object-fit: cover */}
          {item.image && (
            <div className="featured-card-image-wrapper">
              <img
                src={item.image}
                alt={item.title}
                className="featured-card-image"
                loading="lazy"
              />
            </div>
          )}
          <div className="featured-card-content">
            <h3 className="featured-card-title">{item.title}</h3>
            {item.excerpt && (
              <p className="featured-card-excerpt">{item.excerpt}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
