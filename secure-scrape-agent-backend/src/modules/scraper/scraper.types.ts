export interface ScrapedContent {
  url: string;
  canonical_url: string;
  title: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  published_at: string | null; // ISO 8601
  author: {
    name: string | null;
    profile_url: string | null;
    contacts: { email?: string; phone?: string; }[];
  };
  content_text: string;
  content_html: string;
  images: Array<{
    url: string;
    alt: string | null;
    caption: string | null;
    width: number | null;
    height: number | null;
  }>;
  og_meta: Record<string, string>;
  twitter_meta: Record<string, string>;
  json_ld: any[];
  language: string;
  tags: string[];
  raw_html: string;

  // Legacy compatibility fields (optional)
  content?: string;
  metadata?: {
    company?: string;
    publishedAt?: Date;
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
  contactInfo?: {
    emails: string[];
    phones: string[];
  };
}
