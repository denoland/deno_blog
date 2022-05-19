/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { serveDir } from "https://deno.land/std@0.137.0/http/file_server.ts";
import { walk } from "https://deno.land/std@0.137.0/fs/walk.ts";
import {
  dirname,
  fromFileUrl,
  join,
  relative,
} from "https://deno.land/std@0.137.0/path/mod.ts";
import { serve } from "https://deno.land/std@0.137.0/http/mod.ts";

import { h, Helmet, ssr } from "https://crux.land/nanossr@0.0.4";
import * as gfm from "https://deno.land/x/gfm@0.1.20/mod.ts";
import "https://esm.sh/prismjs@1.27.0/components/prism-c?no-check";
import { parse as frontMatter } from "https://deno.land/x/frontmatter@v0.1.4/mod.ts";
import { createReporter } from "https://deno.land/x/g_a@0.1.2/mod.ts";
import type { Reporter as GaReporter } from "https://deno.land/x/g_a@0.1.2/mod.ts";
import { Feed } from "https://esm.sh/feed@4.2.2?pin=v57";
import type { Item as FeedItem } from "https://esm.sh/feed@4.2.2?pin=v57";
import removeMarkdown from "https://esm.sh/remove-markdown?pin=v57";
export interface BlogSettings {
  title?: string;
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

const IS_DEV = Deno.args.includes("--dev") && "watchFs" in Deno;
const HMR_SOCKETS: Set<WebSocket> = new Set();
const POSTS = new Map<string, Post>();

/** The main function of the library.
 *
 * ```js
 * import blog from "https://deno.land/x/blog/blog.tsx";
 * blog(import.meta.url);
 * ```
 *
 * Configure it:
 *
 * ```js
 * import blog from "https://deno.land/x/blog/blog.tsx";
 * blog(import.meta.url, {
 *   title: "My blog title",
 *   subtitle: "Subtitle",
 *   header:
 *     `A header that will be visible on the index page. You can use *Markdown* here.`,
 *   gaKey: "GA-ANALYTICS-KEY",
 * });
 * ```
 */
export default async function blog(url: string, settings?: BlogSettings) {
  const blogSettings = await configureBlog(IS_DEV, url, settings);

  let gaReporter: undefined | GaReporter;
  if (blogSettings.gaKey) {
    gaReporter = createReporter({ id: blogSettings.gaKey });
  }

  serve(async (req: Request, connInfo) => {
    let err: undefined | Error;
    let res: undefined | Response;

    const start = performance.now();
    try {
      res = await handler(req, blogSettings) as Response;
    } catch (e) {
      err = e;
      res = new Response("Internal server error", {
        status: 500,
      });
    } finally {
      if (gaReporter) {
        gaReporter(req, connInfo, res!, start, err);
      }
    }
    return res;
  });
}

export async function configureBlog(
  isDev: boolean,
  url: string,
  maybeSetting?: BlogSettings,
): Promise<BlogSettings & { blogDirectory: string }> {
  let blogDirectory;

  try {
    const blogPath = fromFileUrl(url);
    blogDirectory = dirname(blogPath);
  } catch (e) {
    console.log(e);
    throw new Error("Cannot run blog from a remote URL.");
  }

  let blogSettings: BlogSettings & { blogDirectory: string } = {
    title: "Blog",
    blogDirectory,
  };

  if (maybeSetting) {
    blogSettings = {
      ...blogSettings,
      ...maybeSetting,
    };

    if (maybeSetting.header) {
      const { content } = frontMatter(maybeSetting.header) as {
        content: string;
      };

      blogSettings.header = content;
    }
  }

  await loadContent(blogDirectory, isDev);

  return blogSettings;
}

async function loadContent(blogDirectory: string, isDev: boolean) {
  // Read posts from the current directory and store them in memory.
  const postsDirectory = join(blogDirectory, "posts");

  // TODO(@satyarohith): not efficient for large number of posts.
  for await (
    const entry of walk(postsDirectory)
  ) {
    if (entry.isFile && entry.path.endsWith(".md")) {
      await loadPost(postsDirectory, entry.path);
    }
  }

  if (isDev) {
    watchForChanges(postsDirectory).catch(() => {});
  }
}

// Watcher watches for .md file changes and updates the posts.
async function watchForChanges(postsDirectory: string) {
  const watcher = Deno.watchFs(postsDirectory);
  for await (const event of watcher) {
    if (event.kind === "modify" || event.kind === "create") {
      for (const path of event.paths) {
        if (path.endsWith(".md")) {
          await loadPost(postsDirectory, path);
          HMR_SOCKETS.forEach((socket) => {
            socket.send("refresh");
          });
        }
      }
    }
  }
}

async function loadPost(postsDirectory: string, path: string) {
  const contents = await Deno.readTextFile(path);
  let pathname = "/" + relative(postsDirectory, path);
  // Remove .md extension.
  pathname = pathname.slice(0, -3);

  const { content, data } = frontMatter(contents) as {
    data: Record<string, string>;
    content: string;
  };

  let snippet = data.snippet;
  if (!snippet) {
    const maybeSnippet = content.split("\n\n")[0];
    if (maybeSnippet) {
      snippet = removeMarkdown(maybeSnippet.replace("\n", " "));
    } else {
      snippet = "";
    }
  }

  const post: Post = {
    title: data.title,
    author: data.author,
    // Note: users can override path of a blog post using
    // pathname in front matter.
    pathname: data.pathname ?? pathname,
    publishDate: new Date(data.publish_date),
    snippet,
    markdown: content,
    coverHtml: data.cover_html,
    background: data.background,
    ogImage: data["og:image"],
  };
  POSTS.set(pathname, post);
  console.log("Load: ", post.pathname);
}

export async function handler(
  req: Request,
  blogSettings: BlogSettings & { blogDirectory: string },
) {
  const { pathname } = new URL(req.url);

  if (blogSettings.redirectMap) {
    let maybeRedirect = blogSettings.redirectMap[pathname];

    if (!maybeRedirect) {
      // trim leading slash
      maybeRedirect = blogSettings.redirectMap[pathname.slice(1)];
    }

    if (maybeRedirect) {
      if (!maybeRedirect.startsWith("/")) {
        maybeRedirect = "/" + maybeRedirect;
      }

      return new Response(null, {
        status: 301,
        headers: {
          "location": maybeRedirect,
        },
      });
    }
  }

  if (pathname == "/static/gfm.css") {
    return new Response(gfm.CSS, {
      headers: {
        "content-type": "text/css",
      },
    });
  }
  if (pathname == "/hmr.js") {
    const HMR_CLIENT_PATH = join(
      fromFileUrl(dirname(import.meta.url)),
      "./hmr.js",
    );
    const hmrClient = await Deno.readTextFile(HMR_CLIENT_PATH);
    return new Response(hmrClient, {
      headers: {
        "content-type": "application/javascript",
      },
    });
  }

  if (pathname.endsWith("/hmr")) {
    const { response, socket } = Deno.upgradeWebSocket(req);
    HMR_SOCKETS.add(socket);
    socket.onclose = () => {
      HMR_SOCKETS.delete(socket);
    };

    return response;
  }

  if (pathname == "/") {
    return ssr(() => (
      <Index
        posts={POSTS}
        settings={blogSettings}
        hmr={IS_DEV}
      />
    ));
  }
  if (pathname == "/feed") {
    return serveRSS(req, blogSettings, POSTS);
  }

  const post = POSTS.get(pathname);
  if (post) {
    return ssr(() => <Post post={post} hmr={IS_DEV} settings={blogSettings} />);
  }

  if (pathname.endsWith("/")) {
    const newPathname = pathname.slice(0, pathname.length - 1);
    const post = POSTS.get(newPathname);
    if (post) {
      return new Response(null, {
        status: 301,
        headers: {
          "location": newPathname,
        },
      });
    }
  }

  // Try to serve static files from the posts/ directory first.
  const response = await serveDir(req, {
    fsRoot: join(blogSettings.blogDirectory, "./posts"),
  });

  // Fallback to serving static files from the root, this will handle 404s
  // as well.
  if (response.status == 404) {
    return serveDir(req, { fsRoot: blogSettings.blogDirectory });
  }

  return response;
}

export function Index(
  { posts, settings, hmr }: {
    posts: Map<string, Post>;
    settings: BlogSettings;
    hmr: boolean;
  },
) {
  const postIndex = [];
  for (const [_key, post] of posts.entries()) {
    postIndex.push(post);
  }
  postIndex.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());

  const headerHtml = settings.header && gfm.render(settings.header);

  return (
    <div class="max-w-screen-sm px-4 pt-16 mx-auto">
      <Helmet>
        <title>{settings.title}</title>
        <link rel="stylesheet" href="/static/gfm.css" />
        <style type="text/css">
          {` .markdown-body { --color-canvas-default: transparent; } `}
        </style>
        {settings.style && <style>{settings.style}</style>}
        {hmr && <script src="/hmr.js"></script>}
      </Helmet>
      {headerHtml && (
        <div>
          <div class="markdown-body">
            <div innerHTML={{ __dangerousHtml: headerHtml }} />
          </div>
        </div>
      )}

      <div class="mt-8">
        {postIndex.map((post) => <PostCard post={post} />)}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div class="py-8">
      <PrettyDate date={post.publishDate} />
      <a class="" href={post.pathname}>
        <h3 class="text-2xl font-bold text-blue-500 hover:text-blue-600 hover:underline">
          {post.title}
        </h3>
        <div class="mt-4 text-gray-900">
          {post.snippet}
        </div>
      </a>
    </div>
  );
}

function Post(
  { post, hmr, settings }: { post: Post; hmr: boolean; settings: BlogSettings },
) {
  const html = gfm.render(post.markdown);

  return (
    <div class="min-h-screen">
      <Helmet>
        <style type="text/css">
          {` .markdown-body { --color-canvas-default: transparent; } `}
        </style>
        <title>{post.title}</title>
        <link rel="stylesheet" href="/static/gfm.css" />
        {settings.style && <style>{settings.style}</style>}
        <meta property="og:title" content={post.title} />
        {post.snippet && <meta name="description" content={post.snippet} />}
        {post.snippet && (
          <meta property="og:description" content={post.snippet} />
        )}
        {hmr && <script src="/hmr.js"></script>}
        {post.background && (
          <style type="text/css">
            {` body { background: ${post.background}; } `}
          </style>
        )}
      </Helmet>
      <article class="max-w-screen-sm px-4 mx-auto">
        <a href="/" class="hover:text-gray-700" title="Index">← Index</a>
      </article>
      {post.coverHtml && (
        <div dangerouslySetInnerHTML={{ __html: post.coverHtml }} />
      )}
      <article class="max-w-screen-sm px-4 pt-8 md:pt-16 mx-auto">
        <h1 class="text-5xl text-gray-900 font-bold">
          {post.title}
        </h1>
        <div class="mt-8 text-gray-500">
          <p class="flex gap-2 items-center">
            <PrettyDate date={post.publishDate} />
            <RssFeedIcon />
          </p>
          {settings.author && <p>{settings.author}</p>}
        </div>
        <hr class="my-8" />
        <div class="markdown-body">
          <div innerHTML={{ __dangerousHtml: html }} />
        </div>
      </article>
    </div>
  );
}

function PrettyDate({ date }: { date: Date }) {
  const formatted = date.toISOString().split("T")[0];
  return <time datetime={date.toISOString()}>{formatted}</time>;
}

function RssFeedIcon() {
  return (
    <a href="/feed" class="hover:text-gray-700" title="Atom Feed">
      <svg
        class="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z">
        </path>
        <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z">
        </path>
      </svg>
    </a>
  );
}

/** Serves the rss/atom feed of the blog. */
function serveRSS(
  req: Request,
  settings: BlogSettings,
  posts: Map<string, Post>,
) {
  const url = new URL(req.url);
  const origin = url.origin;
  const copyright = `Copyright ${new Date().getFullYear()} ${origin}`;
  const feed = new Feed({
    title: settings.title ?? "Blog",
    description: settings.subtitle,
    id: `${origin}/blog`,
    link: `${origin}/blog`,
    language: "en",
    favicon: `${origin}/favicon.ico`,
    copyright: copyright,
    generator: "Feed (https://github.com/jpmonette/feed) for Deno",
    feedLinks: {
      atom: `${origin}/feed`,
    },
  });

  for (const [_key, post] of posts.entries()) {
    const item: FeedItem = {
      id: `${origin}/${post.title}`,
      title: post.title,
      description: post.snippet,
      date: post.publishDate,
      link: `${origin}${post.pathname}`,
      author: post.author?.split(",").map((author: string) => ({
        name: author.trim(),
      })),
      image: post.ogImage,
      copyright,
      published: post.publishDate,
    };
    feed.addItem(item);
  }

  const atomFeed = feed.atom1();
  return new Response(atomFeed, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
    },
  });
}
