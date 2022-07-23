// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import { configureBlog, createBlogHandler, redirects } from "./blog.tsx";
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.149.0/testing/asserts.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.149.0/path/mod.ts";

const BLOG_URL = new URL("./testdata/main.js", import.meta.url).href;
const TESTDATA_PATH = fromFileUrl(new URL("./testdata/", import.meta.url));
const BLOG_SETTINGS = await configureBlog(BLOG_URL, false, {
  author: "The author",
  title: "Test blog",
  description: "This is some description.",
  lang: "en-GB",
  dateStyle: "medium",
  middlewares: [
    redirects({
      "/to_second": "second",
      "/to_second_with_slash": "/second",
      "second.html": "second",
    }),
  ],
});
const CONN_INFO = {
  localAddr: {
    transport: "tcp" as const,
    hostname: "0.0.0.0",
    port: 8000,
  },
  remoteAddr: {
    transport: "tcp" as const,
    hostname: "0.0.0.0",
    port: 8001,
  },
};

const blogHandler = createBlogHandler(BLOG_SETTINGS);
const testHandler = (req: Request): Response | Promise<Response> => {
  return blogHandler(req, CONN_INFO);
};

Deno.test("index page", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en-GB">`);
  assertStringIncludes(body, `Test blog`);
  assertStringIncludes(body, `This is some description.`);
  assertStringIncludes(body, `href="/first"`);
  assertStringIncludes(body, `href="/second"`);
});

Deno.test("posts/ first", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/first"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en-GB">`);
  assertStringIncludes(body, `First post`);
  assertStringIncludes(body, `By The author`);
  assertStringIncludes(body, `© ${new Date().getFullYear()} The author`);
  assertStringIncludes(
    body,
    `<time dateTime="2022-03-20T00:00:00.000Z">20 Mar 2022</time>`,
  );
  assertStringIncludes(body, `<img src="first/hello.png" />`);
  assertStringIncludes(body, `<p>Lorem Ipsum is simply dummy text`);
  assertStringIncludes(body, `$100, $200, $300, $400, $500`);
});

Deno.test("posts/ second", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/second"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en-GB">`);
  assertStringIncludes(body, `Second post`);
  assertStringIncludes(body, `By CUSTOM AUTHOR NAME`);
  assertStringIncludes(body, `© ${new Date().getFullYear()} The author`);
  assertStringIncludes(
    body,
    `<time dateTime="2022-05-02T00:00:00.000Z">2 May 2022</time>`,
  );
  assertStringIncludes(body, `<img src="second/hello2.png" />`);
  assertStringIncludes(body, `<p>Lorem Ipsum is simply dummy text`);
});

Deno.test("posts/ trailing slash redirects", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/second/"));
  assert(resp);
  assertEquals(resp.status, 307);
  assertEquals(resp.headers.get("location"), "https://blog.deno.dev/second");
  await resp.text();
});

Deno.test("redirect map", async () => {
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/second.html"),
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/to_second"),
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/to_second_with_slash"),
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
});

Deno.test("static files in posts/ directory", async () => {
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/first/hello.png"),
    );
    assert(resp);
    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("content-type"), "image/png");
    const bytes = new Uint8Array(await resp.arrayBuffer());
    assertEquals(
      bytes,
      await Deno.readFile(
        join(TESTDATA_PATH, "./posts/first/hello.png"),
      ),
    );
  }
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/second/hello2.png"),
    );
    assert(resp);
    assertEquals(resp.status, 200);
    assertEquals(resp.headers.get("content-type"), "image/png");
    const bytes = new Uint8Array(await resp.arrayBuffer());
    assertEquals(
      bytes,
      await Deno.readFile(
        join(
          TESTDATA_PATH,
          "./posts/second/hello2.png",
        ),
      ),
    );
  }
});

Deno.test("static files in root directory", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/cat.png"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "image/png");
  const bytes = new Uint8Array(await resp.arrayBuffer());
  assertEquals(
    bytes,
    await Deno.readFile(
      join(TESTDATA_PATH, "./cat.png"),
    ),
  );
});

Deno.test("RSS feed", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/feed"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(
    resp.headers.get("content-type"),
    "application/atom+xml; charset=utf-8",
  );
  const body = await resp.text();
  assertStringIncludes(body, `<title>Test blog</title>`);
  assertStringIncludes(body, `First post`);
  assertStringIncludes(body, `https://blog.deno.dev/first`);
  assertStringIncludes(body, `Second post`);
  assertStringIncludes(body, `https://blog.deno.dev/second`);
});
