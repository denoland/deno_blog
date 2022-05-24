export interface BlogSettings {
  title?: string;
  author?: string;
  subtitle?: string;
  header?: string;
  style?: string;
  gaKey?: string;
  redirectMap?: Record<string, string>;
}

export interface BlogState {
  title: string;
  directory: string;
  author?: string;
  subtitle?: string;
  header?: string;
  style?: string;
  gaKey?: string;
  redirectMap?: Record<string, string>;
}

/** Represents a Post in the Blog. */
export interface Post {
  title: string;
  pathname: string;
  author: string;
  publishDate: Date;
  snippet: string;
  /** Raw markdown content. */
  markdown: string;
  coverHtml: string;
  background: string;
  /** An image URL which is used in the OpenGraph og:image tag. */
  ogImage: string;
}
