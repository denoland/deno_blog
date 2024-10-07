// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import type { UnoConfig, VNode } from "./deps.ts";

export interface BlogContext {
  state: BlogState;
  connInfo: Deno.ServeHandlerInfo;
  next: () => Promise<Response>;
}

export interface BlogMiddleware {
  (req: Request, ctx: BlogContext): Promise<Response>;
}

type DateFormat = (date: Date) => string;

export interface BlogSettings {
  /** The blog title */
  title?: string;
  /** The blog description */
  description?: string;
  /** URL to avatar. Can be relative. */
  avatar?: string;
  /** CSS classes to use with the avatar. */
  avatarClass?: string;
  /** URL to background cover. Can be relative. */
  cover?: string;
  /** Color of the text that goes on the background cover. */
  coverTextColor?: string;
  /** The author of the blog. Can be overridden by respective post settings. */
  author?: string;
  /** Social links */
  links?: {
    /** The link title */
    title: string;
    /** The link */
    url: string;
    /** The element to use as the icon of the link */
    icon?: VNode;
    /** The link target */
    target?: "_self" | "_blank" | "_parent" | "_top";
  }[];
  /** The element ot use as header */
  header?: VNode;
  /** Whether to show the header on post pages */
  showHeaderOnPostPage?: boolean;
  /** The element to use as section. Access to Post props. */
  section?: (post: Post) => VNode;
  /** The element to use as footer */
  footer?: VNode;
  /** Custom CSS */
  style?: string;
  /** URL to open graph image. Can be relative. */
  ogImage?: string | {
    url: string;
    twitterCard: "summary" | "summary_large_image" | "app" | "player";
  };
  /** Functions that are called before rendering and can modify the content or make other changes. */
  middlewares?: BlogMiddleware[];
  /** The ISO code of the language the blog is in */
  lang?: string;
  /** Date appearance */
  dateFormat?: DateFormat;
  /** The canonical URL of the blog */
  canonicalUrl?: string;
  /** UnoCSS configuration */
  unocss?: UnoConfig;
  /** Color scheme */
  theme?: "dark" | "light" | "auto";
  /**
   * URL to favicon. Can be relative.
   * Supports dark and light mode variants through "prefers-color-scheme".
   */
  favicon?: string | { light?: string; dark?: string };
  /** The port to serve the blog on */
  port?: number;
  /** The hostname to serve the blog on */
  hostname?: string;
  /** Whether to display readtime or not */
  readtime?: boolean;
  /** The root directory of the blog contents */
  rootDirectory?: string;
}

export interface BlogState extends BlogSettings {
  directory: string;
}

/** Represents a Post in the Blog. */
export interface Post {
  pathname: string;
  markdown: string;
  title: string;
  publishDate: Date;
  author?: string;
  snippet?: string;
  coverHtml?: string;
  /** An image URL which is used in the OpenGraph og:image tag. */
  ogImage?: string;
  tags?: string[];
  allowIframes?: boolean;
  disableHtmlSanitization?: boolean;
  readTime: number;
  renderMath?: boolean;
}
