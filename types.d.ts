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
  timezone?: string;
  canonicalUrl?: string;
  unocss?: UnoConfig;
  theme?: "dark" | "light" | "auto";
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
  background?: string;
  /** An image URL which is used in the OpenGraph og:image tag. */
  ogImage?: string;
  tags?: string[];
}
