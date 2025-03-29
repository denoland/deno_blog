// Copyright 2022 the Deno authors. All rights reserved. MIT license.

export { serveDir } from "https://deno.land/std@0.193.0/http/file_server.ts";
export { walk } from "https://deno.land/std@0.193.0/fs/walk.ts";
export {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.193.0/path/mod.ts";
export {
  type ConnInfo,
  serve,
} from "https://deno.land/std@0.193.0/http/mod.ts";
export { extract as frontMatter } from "https://deno.land/std@0.193.0/front_matter/any.ts";

export * as gfm from "jsr:@deno/gfm@0.10.0";
export { Fragment, h } from "https://deno.land/x/htm@0.1.3/mod.ts";
export {
  default as html,
  type HtmlOptions,
  type VNode,
} from "https://deno.land/x/htm@0.1.3/html.tsx";
import UnoCSS from "https://deno.land/x/htm@0.1.3/plugins/unocss.ts";
import ColorScheme from "https://deno.land/x/htm@0.1.3/plugins/color-scheme.ts";

export {
  createReporter,
  type Reporter as GaReporter,
} from "https://deno.land/x/g_a@0.1.2/mod.ts";
export { default as callsites } from "https://raw.githubusercontent.com/kt3k/callsites/v1.0.0/mod.ts";
export { Feed, type Item as FeedItem } from "https://esm.sh/feed@4.2.2";
export { default as removeMarkdown } from "https://esm.sh/remove-markdown@0.5.0";

// Add syntax highlighting support for C by default
import "https://esm.sh/prismjs@1.29.0/components/prism-c?no-check";

export { ColorScheme, UnoCSS };
export type UnoConfig = typeof UnoCSS extends (
  arg: infer P | undefined,
) => unknown ? P
  : never;
