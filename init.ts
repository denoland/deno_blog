// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import { join, resolve } from "https://deno.land/std@0.140.0/path/mod.ts";

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
const MAIN_FILE_URL = new URL(
  "./blog.tsx",
  import.meta.url,
);

const FIRST_POST_CONTENTS = `---
title: Hello world!
publish_date: ${CURRENT_DATE_STRING}
---

This is my first blog post!
`;

const MAIN_CONTENTS = `import blog, { ga, redirects } from "${MAIN_FILE_URL}";

blog({
  title: "My Blog",
  description: "This is my new blog.",
  avatar: "https://deno-avatar.deno.dev/avatar/blog.svg",
  avatarClass: "rounded-full",
  author: "An author",
  background: "#f9f9f9",

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

const DENO_JSONC_CONTENTS = `{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --watch main.ts --dev",
    "serve": "deno run --allow-net --allow-read --no-check main.ts",
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
  await Deno.writeTextFile(join(directory, "main.ts"), MAIN_CONTENTS);
  await Deno.writeTextFile(join(directory, "deno.jsonc"), DENO_JSONC_CONTENTS);

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
