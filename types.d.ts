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
  title?: string;
  description?: string;
  avatar?: string;
  avatarClass?: string;
  cover?: string;
  coverTextColor?: string;
  author?: string;
  links?: { title: string; url: string; icon?: VNode }[];
  header?: VNode;
  showHeaderOnPostPage?: boolean;
  section?: VNode;
  footer?: VNode;
  style?: string;
  ogImage?: string;
  middlewares?: BlogMiddleware[];
  lang?: string;
  dateStyle?: DateStyle;
  canonicalUrl?: string;
  unocss?: UnoConfig;
  theme?: "dark" | "light" | "auto";
  favicon?: string;
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
