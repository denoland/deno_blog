/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import {
  callsites,
  createReporter,
  dirname,
  Feed,
  fromFileUrl,
  frontMatter,
  gfm,
  h,
  join,
  relative,
  removeMarkdown,
  serve,
  serveDir,
  ssr,
  walk,
} from "./deps.ts";
import { Index, PostPage } from "./components.tsx";
import type { FeedItem, GaReporter } from "./deps.ts";
import type { BlogSettings, BlogState, Post } from "./types.d.ts";

const IS_DEV = Deno.args.includes("--dev") && "watchFs" in Deno;
const HMR_SOCKETS: Set<WebSocket> = new Set();
const POSTS = new Map<string, Post>();
const HMR_CLIENT = `let socket;
let reconnectTimer;

const wsOrigin = window.location.origin
  .replace("http", "ws")
  .replace("https", "wss");
const hmrUrl = wsOrigin + "/hmr";

hmrSocket();

function hmrSocket(callback) {
  if (socket) {
    socket.close();
  }

  socket = new WebSocket(hmrUrl);
  socket.addEventListener("open", callback);
  socket.addEventListener("message", (event) => {
    if (event.data === "refresh") {
      console.log("refreshings");
      window.location.reload();
    }
  });

  socket.addEventListener("close", () => {
    console.log("reconnecting...");
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      hmrSocket(() => {
        window.location.reload();
      });
    }, 1000);
  });
}
`;

/** The main function of the library.
 *
 * ```js
 * import blog from "https://deno.land/x/blog/blog.tsx";
 * blog();
 * ```
 *
 * Configure it:
 *
 * ```js
 * import blog from "https://deno.land/x/blog/blog.tsx";
 * blog({
 *   title: "My blog title",
 *   subtitle: "Subtitle",
 *   header:
 *     `A header that will be visible on the index page. You can use *Markdown* here.`,
 *   gaKey: "GA-ANALYTICS-KEY",
 * });
 * ```
 */
export default async function blog(settings?: BlogSettings) {
  const url = callsites()[1].getFileName()!;
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
): Promise<BlogState> {
  let directory;

  try {
    const blogPath = fromFileUrl(url);
    directory = dirname(blogPath);
  } catch (e) {
    console.log(e);
    throw new Error("Cannot run blog from a remote URL.");
  }

  let blogState: BlogState = {
    title: "Blog",
    directory,
  };

  if (maybeSetting) {
    blogState = {
      ...blogState,
      ...maybeSetting,
    };

    if (maybeSetting.header) {
      const { content } = frontMatter(maybeSetting.header) as {
        content: string;
      };

      blogState.header = content;
    }
  }

  await loadContent(directory, isDev);

  return blogState;
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
  blogState: BlogState,
) {
  const { pathname } = new URL(req.url);

  if (blogState.redirectMap) {
    let maybeRedirect = blogState.redirectMap[pathname];

    if (!maybeRedirect) {
      // trim leading slash
      maybeRedirect = blogState.redirectMap[pathname.slice(1)];
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
    return new Response(HMR_CLIENT, {
      headers: {
        "content-type": "application/javascript",
      },
    });
  }

  if (pathname == "/hmr") {
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
        state={blogState}
        hmr={IS_DEV}
      />
    ));
  }

  if (pathname == "/feed") {
    return serveRSS(req, blogState, POSTS);
  }

  const post = POSTS.get(pathname);
  if (post) {
    return ssr(() => <PostPage post={post} hmr={IS_DEV} state={blogState} />);
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
    fsRoot: join(blogState.directory, "./posts"),
  });
  if (response.status != 404) {
    return response;
  }

  // Fallback to serving static files from the root, this will handle 404s
  // as well.
  return serveDir(req, { fsRoot: blogState.directory });
}

/** Serves the rss/atom feed of the blog. */
function serveRSS(
  req: Request,
  state: BlogState,
  posts: Map<string, Post>,
): Response {
  const url = new URL(req.url);
  const origin = url.origin;
  const copyright = `Copyright ${new Date().getFullYear()} ${origin}`;
  const feed = new Feed({
    title: state.title ?? "Blog",
    description: state.subtitle,
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
