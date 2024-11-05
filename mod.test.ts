import { assert } from "@std/assert/assert";
import * as module from "./mod.ts";

Deno.test("module exports expected dependencies", () => {
  assert(module, "module is not defined");
  assert(module.types, "module.types is not defined");
  assert(module.blog, "module.blog is not defined");
  assert(module.blog.configureBlog, "module.blog.configureBlog is not defined");
  assert(
    module.blog.createBlogHandler,
    "module.blog.createBlogHandler is not defined",
  );
  assert(module.blog.default, "module.blog.default is not defined");
  assert(module.components, "module.components is not defined");
  assert(module.components.Index, "module.components.Index is not defined");
  assert(
    module.components.PostPage,
    "module.components.PostPage is not defined",
  );
});
