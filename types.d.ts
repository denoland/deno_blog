import type { ConnInfo } from "./deps.ts";

export interface BlogContext {
  state: BlogState;
  connInfo: ConnInfo;
  next: () => Promise<Response>;
}

export type BlogMiddleware = (
  req: Request,
  ctx: BlogContext,
) => Promise<Response>;

export interface BlogSettings {
  title?: string;
  author?: string;
  subtitle?: string;
  header?: string;
  style?: string;
  middlewares?: BlogMiddleware[];
}

export interface BlogState {
  title: string;
  directory: string;
  author?: string;
  subtitle?: string;
  header?: string;
  style?: string;
  middlewares: BlogMiddleware[];
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
