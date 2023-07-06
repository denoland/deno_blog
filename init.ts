// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import { join, resolve } from "https://deno.land/std@0.193.0/path/mod.ts";

const HELP = `deno_blog

Initialize a new blog project. This will create all the necessary files for
a new blog.

To generate a blog in the './my_blog' subdirectory:
  deno run ${import.meta.url} ./my_blog

To generate a blog in the current directory:
  deno run ${import.meta.url} .

Print this message:
  deno run ${import.meta.url} --help
`;

const CURRENT_DATE = new Date();
const CURRENT_DATE_STRING = CURRENT_DATE.toISOString().slice(0, 10);

const FIRST_POST_CONTENTS = `---
title: Hello world!
publish_date: ${CURRENT_DATE_STRING}
---

This is my first blog post!
`;

const MAIN_NAME = "main.tsx";
const MAIN_CONTENTS = `/** @jsx h */

import blog, { ga, redirects, h } from "blog";

blog({
  title: "My Blog",
  description: "This is my new blog.",
  // header: <header>Your custom header</header>,
  // section: (post: Post) => <section>Your custom section with access to Post props.</section>,
  // footer: <footer>Your custom footer</footer>,
  avatar: "https://deno-avatar.deno.dev/avatar/blog.svg",
  avatarClass: "rounded-full",
  author: "An author",

  // middlewares: [

    // If you want to set up Google Analytics, paste your GA key here.
    // ga("UA-XXXXXXXX-X"),

    // If you want to provide some redirections, you can specify them here,
    // pathname specified in a key will redirect to pathname in the value.
    // redirects({
    //  "/hello_world.html": "/hello_world",
    // }),

  // ]
});
`;

const DENO_JSONC_NAME = "deno.jsonc";
const DENO_JSONC_CONTENTS = `{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env --watch main.tsx --dev",
    "serve": "deno run --allow-net --allow-read --allow-env --no-check main.tsx"
  },
  "imports": {
    "blog": "https://deno.land/x/blog@0.7.0/blog.tsx"
  }
}
`;

async function init(directory: string) {
  directory = resolve(directory);

  console.log(`Initializing blog in ${directory}...`);
  try {
    const dir = [...Deno.readDirSync(directory)];
    if (dir.length > 0) {
      const confirmed = confirm(
        "You are trying to initialize blog in an non-empty directory, do you want to continue?",
      );
      if (!confirmed) {
        throw new Error("Directory is not empty, aborting.");
      }
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  await Deno.mkdir(join(directory, "posts"), { recursive: true });
  await Deno.writeTextFile(
    join(directory, "posts/hello_world.md"),
    FIRST_POST_CONTENTS,
  );
  await Deno.writeTextFile(join(directory, MAIN_NAME), MAIN_CONTENTS);
  await Deno.writeTextFile(
    join(directory, DENO_JSONC_NAME),
    DENO_JSONC_CONTENTS,
  );

  console.log("Blog initialized, run `deno task dev` to get started.");
}

function printHelp() {
  console.log(HELP);
  Deno.exit(0);
}

if (import.meta.main) {
  if (Deno.args.includes("-h") || Deno.args.includes("--help")) {
    printHelp();
  }

  const directory = Deno.args[0];
  if (directory == null) {
    printHelp();
  }

  await init(directory);
} else {
  throw new Error("This module is meant to be executed as a CLI.");
}
