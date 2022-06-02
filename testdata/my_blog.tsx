/** @jsx h */

import blog from "../blog.tsx";

blog({
  author: "Denobot",
  title: "My Blog",
  description: "Description.",
  picture: "cat.png",
  links: [
    { title: "Email", url: "mailto:bot@deno.com" },
    { title: "GitHub", url: "https://github.com/denobot" },
    { title: "Twitter", url: "https://twitter.com/denobot" },
  ],
});
