# Blog

Minimal boilerplate blogging. All you need is one boilerplate JavaScript file
that has 2 lines of code:

```js
import blog from "https://deno.land/x/blog/blog.tsx";

blog();
```

## Getting started

To initialize your own blog you can run following script:

```shellsession
$ deno run https://deno.land/x/blog/init.ts ./directory/for/blog/
```

_This command will setup a blog with a "Hello world" post so you can start
writing right away._

Start local server with live reload:

```shellsession
$ deno task dev
```

To ensure the best development experience, make sure to follow
[Set up your environment](https://deno.land/manual/getting_started/setup_your_environment)
from the Deno Manual.

## Configuration

You can customize your blog as follows:

```js
import blog, { ga, redirects } from "https://deno.land/x/blog/blog.tsx";

blog({
  author: "Dino",
  title: "My Blog",
  description: "The blog description.",
  avatar: "avatar.png",
  avatarClass: "rounded-full",
  links: [
    { title: "Email", url: "mailto:bot@deno.com" },
    { title: "GitHub", url: "https://github.com/denobot" },
    { title: "Twitter", url: "https://twitter.com/denobot" },
  ],
  lang: "en",
  timezone: "en-US",
  middlewares: [
    ga("UA-XXXXXXXX-X"),
    redirects({
      "/foo": "/my_post",
      // you can skip leading slashes too
      "bar": "my_post2",
    }),
  ],
});
```

![Preview](./.github/preview.png)

## Customize the header and footer

By default, we render the header and footer with builtin template using the blog
settings. You can customize them as follows:

```jsx
/** @jsx h */

import blog, { h } from "https://deno.land/x/blog/blog.tsx";

blog({
  title: "My Blog",
  header: <header>Your custom header</header>,
  footer: <footer>Your custom footer</footer>,
});
```

## Hosting with Deno Deploy

<TODO>

## Self hosting

You can also self-host the blog, in such case run:

```shellsession
$ deno task serve
```

TODO(bartlomieju): allow specyfing port and hostname?
