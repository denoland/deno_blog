import { configureBlog, createBlogHandler, redirects } from "./blog.tsx";
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.137.0/testing/asserts.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.137.0/path/mod.ts";

const BLOG_URL = new URL("./testdata/main.js", import.meta.url).href;
const TESTDATA_PATH = fromFileUrl(new URL("./testdata/", import.meta.url));
const SETTINGS = {
  author: "The author",
  title: "Test blog",
  subtitle: "This is some subtitle",
  header: "This is some header",
  style: `body { background-color: #f0f0f0; }`,
};
const BLOG_SETTINGS = await configureBlog(false, BLOG_URL, SETTINGS);

const blogHandler = createBlogHandler(BLOG_SETTINGS, [
  redirects({
    "/to_second": "second",
    "/to_second_with_slash": "/second",
    "second.html": "second",
  }),
]);

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

Deno.test("index page", async () => {
  const resp = await blogHandler(
    new Request("https://blog.deno.dev"),
    CONN_INFO,
  );
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en">`);
  assertStringIncludes(body, `Test blog`);
  // FIXME(bartlomieju)
  // assertStringIncludes(body, `This is some subtitle`);
  // assertStringIncludes(body, `This is some header`);
  assertStringIncludes(body, `href="/first"`);
  assertStringIncludes(body, `href="/second"`);
});

Deno.test("posts/ first", async () => {
  const resp = await blogHandler(
    new Request("https://blog.deno.dev/first"),
    CONN_INFO,
  );
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en">`);
  assertStringIncludes(body, `First post`);
  assertStringIncludes(body, `The author`);
  assertStringIncludes(body, `2022-03-20`);
  assertStringIncludes(body, `<img src="first/hello.png" />`);
  assertStringIncludes(body, `<p>Lorem Ipsum is simply dummy text`);
});

Deno.test("posts/ second", async () => {
  const resp = await blogHandler(
    new Request("https://blog.deno.dev/second"),
    CONN_INFO,
  );
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en">`);
  assertStringIncludes(body, `Second post`);
  assertStringIncludes(body, `The author`);
  assertStringIncludes(body, `2022-05-02`);
  assertStringIncludes(body, `<img src="second/hello2.png" />`);
  assertStringIncludes(body, `<p>Lorem Ipsum is simply dummy text`);
});

Deno.test("posts/ trailing slash redirects", async () => {
  const resp = await blogHandler(
    new Request("https://blog.deno.dev/second/"),
    CONN_INFO,
  );
  assert(resp);
  assertEquals(resp.status, 307);
  assertEquals(resp.headers.get("location"), "https://blog.deno.dev/second");
  await resp.text();
});

Deno.test("redirect map", async () => {
  {
    const resp = await blogHandler(
      new Request("https://blog.deno.dev/second.html"),
      CONN_INFO,
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
  {
    const resp = await blogHandler(
      new Request("https://blog.deno.dev/to_second"),
      CONN_INFO,
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
  {
    const resp = await blogHandler(
      new Request("https://blog.deno.dev/to_second_with_slash"),
      CONN_INFO,
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/second");
    await resp.text();
  }
});

Deno.test("static files in posts/ directory", async () => {
  {
    const resp = await blogHandler(
      new Request("https://blog.deno.dev/first/hello.png"),
      CONN_INFO,
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
    const resp = await blogHandler(
      new Request("https://blog.deno.dev/second/hello2.png"),
      CONN_INFO,
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
  const resp = await blogHandler(
    new Request("https://blog.deno.dev/cat.png"),
    CONN_INFO,
  );
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
  const resp = await blogHandler(
    new Request("https://blog.deno.dev/feed"),
    CONN_INFO,
  );
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
