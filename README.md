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
  author: "Denobot",
  title: "My blog title",
  subtitle: "Subtitle",
  header:
    `A header that will be visible on the index page. You can use *Markdown* here.`,
  style: `body { background-color: #f0f0f0; }`,
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

## Hosting with Deno Deploy

<TODO>

## Self hosting

You can also self-host the blog, in such case run:

```shellsession
$ deno task serve
```

TODO(bartlomieju): allow specyfing port and hostname?
