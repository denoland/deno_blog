/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { gfm, h, Helmet } from "./deps.ts";
import type { BlogState, Post } from "./types.d.ts";

export function Index(
  { posts, state, hmr }: {
    posts: Map<string, Post>;
    state: BlogState;
    hmr: boolean;
  },
) {
  const postIndex = [];
  for (const [_key, post] of posts.entries()) {
    postIndex.push(post);
  }
  postIndex.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());

  const headerHtml = state.header && gfm.render(state.header);

  return (
    <div class="max-w-screen-sm px-4 pt-16 mx-auto">
      <Helmet>
        <title>{state.title}</title>
        <link rel="stylesheet" href="/static/gfm.css" />
        <style type="text/css">
          {` .markdown-body { --color-canvas-default: transparent; } `}
        </style>
        {state.style && <style>{state.style}</style>}
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

export function PostPage(
  { post, hmr, state }: { post: Post; hmr: boolean; state: BlogState },
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
        {state.style && <style>{state.style}</style>}
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
          {state.author && <p>{state.author}</p>}
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
