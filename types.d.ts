// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import type { ConnInfo, UnoConfig, VNode } from "./deps.ts";

export interface BlogContext {
  state: BlogState;
  connInfo: ConnInfo;
  next: () => Promise<Response>;
}

export interface BlogMiddleware {
  (req: Request, ctx: BlogContext): Promise<Response>;
}

export type DateStyle = "full" | "long" | "medium" | "short";

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
  /** The element to use as section */
  section?: VNode;
  /** The element to use as footer */
  footer?: VNode;
  /** Custom CSS */
  style?: string;
  /** URL to open graph image. Can be relative. */
  ogImage?: string;
  /** Functions that are called before rendering and can modify the content or make other changes. */
  middlewares?: BlogMiddleware[];
  /** The ISO code of the language the blog is in */
  lang?: string;
  /** Date appearance */
  dateStyle?: DateStyle;
  /** The canonical URL of the blog */
  canonicalUrl?: string;
  /** UnoCSS configuration */
  unocss?: UnoConfig;
  /** Color scheme */
  theme?: "dark" | "light" | "auto";
  /** URL to favicon. Can be relative. */
  favicon?: string;
  /** The port to serve the blog on */
  port?: number;
  /** The hostname to serve the blog on */
  hostname?: string;
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
}
