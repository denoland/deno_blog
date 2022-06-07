// Copyright 2022 the Deno authors. All rights reserved. MIT license.

/** @jsx h */
/** @jsxFrag Fragment */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { Fragment, gfm, h, type VNode } from "./deps.ts";
import type { BlogState, Post } from "./types.d.ts";

const socialAppIcons = new Map([
  ["github.com", IconGithub],
  ["twitter.com", IconTwitter],
  ["instagram.com", IconInstagram],
  ["linkedin.com", IconLinkedin],
]);

interface IndexProps {
  state: BlogState;
  posts: Map<string, Post>;
}

export function Index({ state, posts }: IndexProps) {
  const postIndex = [];
  for (const [_key, post] of posts.entries()) {
    postIndex.push(post);
  }
  postIndex.sort((a, b) =>
    (b.publishDate?.getTime() ?? 0) - (a.publishDate?.getTime() ?? 0)
  );

  return (
    <>
      {state.header || (
        <header
          class="w-full h-90 lt-sm:h-80 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: state.cover ? `url(${state.cover})` : undefined,
          }}
        >
          <div class="max-w-screen-sm h-full px-6 mx-auto flex flex-col items-center justify-center">
            {state.avatar && (
              <div
                class={[
                  "bg-cover bg-center bg-no-repeat w-25 h-25 border-4 border-white",
                  state.avatarClass ?? "rounded-full",
                ].filter(Boolean).join(" ")}
                style={{ backgroundImage: `url(${state.avatar})` }}
              />
            )}
            <h1
              class="mt-3 text-4xl text-gray-900 font-bold"
              style={{ color: state.coverTextColor }}
            >
              {state.title ?? "My Blog"}
            </h1>
            {state.description && (
              <p
                class="text-lg text-gray-600"
                style={{ color: state.coverTextColor }}
              >
                {state.description}
              </p>
            )}
            {state.links && (
              <nav class="mt-3 flex gap-2">
                {state.links.map((link) => {
                  const url = new URL(link.url);
                  let Icon = IconExternalLink;
                  if (url.protocol === "mailto:") {
                    Icon = IconEmail;
                  } else {
                    const icon = socialAppIcons.get(
                      url.hostname.replace(/^www\./, ""),
                    );
                    if (icon) {
                      Icon = icon;
                    }
                  }

                  return (
                    <a
                      class="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-600/10 text-gray-700 hover:bg-gray-600/15 hover:text-black transition-colors group"
                      href={link.url}
                    >
                      <Icon />
                      <Tooltip>{link.title}</Tooltip>
                    </a>
                  );
                })}
              </nav>
            )}
          </div>
        </header>
      )}

      <div class="max-w-screen-sm px-6 mx-auto">
        <div class="pt-16 lt-sm:pt-12 border-t-1 border-gray-300/80">
          {postIndex.map((post) => (
            <PostCard
              post={post}
              key={post.pathname}
            />
          ))}
        </div>

        {state.footer || <Footer author={state.author} />}
      </div>
    </>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div class="pt-12 first:pt-0">
      <h3 class="text-2xl font-bold">
        <a class="" href={post.pathname}>
          {post.title}
        </a>
      </h3>
      <p class="text-gray-500/80">
        <PrettyDate date={post.publishDate} />
      </p>
      <p class="mt-3 text-gray-600">
        {post.snippet}
      </p>
      <p class="mt-3">
        <a
          class="leading-tight text-gray-900 inline-block border-b-1 border-gray-600 hover:text-gray-500 hover:border-gray-500 transition-colors"
          href={post.pathname}
          title={`Read "${post.title}"`}
        >
          Read More
        </a>
      </p>
    </div>
  );
}

interface PostPageProps {
  state: BlogState;
  post: Post;
}

export function PostPage({ post, state }: PostPageProps) {
  const html = gfm.render(post.markdown);

  return (
    <div class="max-w-screen-sm px-6 pt-8 mx-auto">
      <div class="pb-16">
        <a
          href="/"
          class="inline-flex items-center gap-1 text-sm text-gray-500/80 hover:text-gray-700 transition-colors"
          title="Back to Index Page"
        >
          <svg
            className="inline-block w-5 h-5"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.91675 14.4167L3.08341 10.5833C3.00008 10.5 2.94119 10.4097 2.90675 10.3125C2.87175 10.2153 2.85425 10.1111 2.85425 10C2.85425 9.88889 2.87175 9.78472 2.90675 9.6875C2.94119 9.59028 3.00008 9.5 3.08341 9.41667L6.93758 5.5625C7.09036 5.40972 7.27786 5.33334 7.50008 5.33334C7.7223 5.33334 7.91675 5.41667 8.08341 5.58334C8.23619 5.73611 8.31258 5.93056 8.31258 6.16667C8.31258 6.40278 8.23619 6.59722 8.08341 6.75L5.66675 9.16667H16.6667C16.9029 9.16667 17.1006 9.24639 17.2601 9.40584C17.4201 9.56584 17.5001 9.76389 17.5001 10C17.5001 10.2361 17.4201 10.4339 17.2601 10.5933C17.1006 10.7533 16.9029 10.8333 16.6667 10.8333H5.66675L8.10425 13.2708C8.25703 13.4236 8.33341 13.6111 8.33341 13.8333C8.33341 14.0556 8.25008 14.25 8.08341 14.4167C7.93064 14.5694 7.73619 14.6458 7.50008 14.6458C7.26397 14.6458 7.06953 14.5694 6.91675 14.4167Z"
              fill="currentColor"
            />
          </svg>
          INDEX
        </a>
      </div>
      {post.coverHtml && (
        <div
          class="pb-12"
          dangerouslySetInnerHTML={{ __html: post.coverHtml }}
        />
      )}
      <article>
        <h1 class="text-4xl text-gray-900 font-bold">
          {post.title}
        </h1>
        <p class="mt-1 text-gray-500">
          {(state.author || post.author) && (
            <span>
              By {state.author || post.author} at {" "}
            </span>
          )}
          <PrettyDate date={post.publishDate} />
        </p>
        <div
          class="mt-8 markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {state.footer || <Footer author={state.author} />}
    </div>
  );
}

function Footer(props: { author?: string }) {
  return (
    <footer class="mt-20 pb-16 lt-sm:pb-8 lt-sm:mt-16">
      <p class="flex items-center gap-2.5 text-gray-400/800 text-sm">
        <span>
          &copy; {new Date().getFullYear()} {props.author}, Powered by{" "}
          <a
            class="inline-flex items-center gap-1 underline hover:text-gray-800 transition-colors"
            href="https://deno.land/x/blog"
          >
            Deno Blog
          </a>
        </span>
        <a
          href="/feed"
          class="inline-flex items-center gap-1 hover:text-gray-800 transition-colors"
          title="Atom Feed"
        >
          <IconRssFeed /> RSS
        </a>
      </p>
    </footer>
  );
}

function Tooltip(
  { children }: { children: string },
) {
  return (
    <div
      className={"absolute top-10 px-3 h-8 !leading-8 bg-black/80 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"}
    >
      <span
        className="block absolute text-black/80"
        style={{ top: -4, left: "50%", marginLeft: -4.5, width: 9, height: 4 }}
      >
        <svg
          className="absolute"
          width="9"
          height="4"
          viewBox="0 0 9 4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.83564 0.590546C4.21452 0.253758 4.78548 0.253758 5.16436 0.590546L9 4H0L3.83564 0.590546Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {children}
    </div>
  );
}

function PrettyDate({ date }: { date: Date }) {
  const formatted = date.toISOString().split("T")[0].replaceAll("-", "/");
  return <time dateTime={date.toISOString()}>{formatted}</time>;
}

function IconRssFeed() {
  return (
    <svg
      class="inline-block w-4 h-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z" />
      <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z" />
    </svg>
  );
}

function IconEmail() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.99963 18C8.9063 18 7.87297 17.7899 6.89963 17.3696C5.9263 16.9499 5.07643 16.3765 4.35003 15.6496C3.6231 14.9232 3.04977 14.0733 2.63003 13.1C2.20977 12.1267 1.99963 11.0933 1.99963 10C1.99963 8.89333 2.20977 7.8568 2.63003 6.8904C3.04977 5.92347 3.6231 5.0768 4.35003 4.3504C5.07643 3.62347 5.9263 3.04987 6.89963 2.6296C7.87297 2.20987 8.9063 2 9.99963 2C11.1063 2 12.1428 2.20987 13.1092 2.6296C14.0762 3.04987 14.9228 3.62347 15.6492 4.3504C16.3762 5.0768 16.9495 5.92347 17.3692 6.8904C17.7895 7.8568 17.9996 8.89333 17.9996 10V11.16C17.9996 11.9467 17.7298 12.6165 17.19 13.1696C16.6498 13.7232 15.9863 14 15.1996 14C14.7196 14 14.273 13.8933 13.8596 13.68C13.4463 13.4667 13.1063 13.1867 12.8396 12.84C12.4796 13.2 12.0564 13.4835 11.57 13.6904C11.0831 13.8968 10.5596 14 9.99963 14C8.89297 14 7.94977 13.6099 7.17003 12.8296C6.38977 12.0499 5.99963 11.1067 5.99963 10C5.99963 8.89333 6.38977 7.94987 7.17003 7.1696C7.94977 6.38987 8.89297 6 9.99963 6C11.1063 6 12.0498 6.38987 12.83 7.1696C13.6098 7.94987 13.9996 8.89333 13.9996 10V11.16C13.9996 11.5467 14.1196 11.8499 14.3596 12.0696C14.5996 12.2899 14.8796 12.4 15.1996 12.4C15.5196 12.4 15.7996 12.2899 16.0396 12.0696C16.2796 11.8499 16.3996 11.5467 16.3996 11.16V10C16.3996 8.25333 15.7695 6.74987 14.5092 5.4896C13.2495 4.22987 11.7463 3.6 9.99963 3.6C8.25297 3.6 6.7495 4.22987 5.48923 5.4896C4.2295 6.74987 3.59963 8.25333 3.59963 10C3.59963 11.7467 4.2295 13.2499 5.48923 14.5096C6.7495 15.7699 8.25297 16.4 9.99963 16.4H13.9996V18H9.99963ZM9.99963 12.4C10.6663 12.4 11.233 12.1667 11.6996 11.7C12.1663 11.2333 12.3996 10.6667 12.3996 10C12.3996 9.33333 12.1663 8.76667 11.6996 8.3C11.233 7.83333 10.6663 7.6 9.99963 7.6C9.33297 7.6 8.7663 7.83333 8.29963 8.3C7.83297 8.76667 7.59963 9.33333 7.59963 10C7.59963 10.6667 7.83297 11.2333 8.29963 11.7C8.7663 12.1667 9.33297 12.4 9.99963 12.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.66715 5.83333C6.66715 5.3731 7.04025 5 7.50049 5L14.1672 5C14.6274 5 15.0005 5.3731 15.0005 5.83333V12.5C15.0005 12.9602 14.6274 13.3333 14.1672 13.3333C13.7069 13.3333 13.3338 12.9602 13.3338 12.5V7.84518L6.42308 14.7559C6.09764 15.0814 5.57 15.0814 5.24457 14.7559C4.91913 14.4305 4.91913 13.9028 5.24457 13.5774L12.1553 6.66667L7.50049 6.66667C7.04025 6.66667 6.66715 6.29357 6.66715 5.83333Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2C5.58161 2 2 5.67194 2 10.2029C2 13.8265 4.292 16.9015 7.4712 17.9857C7.8712 18.0611 8.01681 17.808 8.01681 17.5902C8.01681 17.3961 8.01042 16.8794 8.00641 16.1956C5.7808 16.6911 5.3112 15.0959 5.3112 15.0959C4.948 14.1476 4.4232 13.8954 4.4232 13.8954C3.69681 13.3876 4.47841 13.3975 4.47841 13.3975C5.28081 13.4548 5.70322 14.2426 5.70322 14.2426C6.41683 15.4955 7.57603 15.1335 8.03122 14.9239C8.10481 14.3941 8.31122 14.033 8.54002 13.8282C6.76402 13.621 4.896 12.9168 4.896 9.77384C4.896 8.87877 5.208 8.14588 5.7192 7.57263C5.6368 7.36544 5.36241 6.531 5.79759 5.40254C5.79759 5.40254 6.46959 5.18143 7.99759 6.24272C8.59777 6.06848 9.28719 5.96782 9.99941 5.96674C10.6794 5.97002 11.364 6.06092 12.0032 6.24272C13.5304 5.18143 14.2008 5.40171 14.2008 5.40171C14.6376 6.53097 14.3624 7.36543 14.2808 7.5726C14.7928 8.14583 15.1032 8.87874 15.1032 9.7738C15.1032 12.9249 13.232 13.6185 11.4504 13.8216C11.7376 14.0747 11.9928 14.575 11.9928 15.3407C11.9928 16.4364 11.9832 17.3216 11.9832 17.5902C11.9832 17.8097 12.1272 18.0652 12.5336 17.9849C15.7378 16.8608 18 13.8039 18 10.2062C18 10.2051 18 10.2039 18 10.2027C18 5.67175 14.4176 2 10 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTwitter() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.0005 5.02869C17.4116 5.29638 16.7768 5.47229 16.119 5.55642C16.7921 5.15106 17.3122 4.50861 17.5569 3.73615C16.9221 4.11856 16.2185 4.38624 15.4766 4.53921C14.8724 3.88146 14.0234 3.49905 13.0598 3.49905C11.2624 3.49905 9.79399 4.96751 9.79399 6.78013C9.79399 7.04016 9.82458 7.29255 9.87812 7.52965C7.15536 7.39198 4.73089 6.08414 3.11712 4.10326C2.83414 4.5851 2.67353 5.15106 2.67353 5.74762C2.67353 6.8872 3.24714 7.89676 4.13433 8.47037C3.59131 8.47037 3.08653 8.31741 2.64294 8.08797V8.11091C2.64294 9.70173 3.77487 11.0325 5.27391 11.3308C4.79263 11.4625 4.28737 11.4808 3.79781 11.3843C4.00554 12.0363 4.41237 12.6068 4.96111 13.0156C5.50985 13.4244 6.17291 13.651 6.85709 13.6635C5.69734 14.5816 4.25976 15.0779 2.7806 15.0708C2.52056 15.0708 2.26053 15.0555 2.00049 15.0249C3.45364 15.9579 5.18213 16.501 7.03299 16.501C13.0598 16.501 16.3714 11.4991 16.3714 7.16253C16.3714 7.01722 16.3714 6.87955 16.3638 6.73424C17.0062 6.27534 17.5569 5.69408 18.0005 5.02869Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.0005 6.80556C9.36869 6.80556 8.75107 6.99291 8.22575 7.34392C7.70043 7.69493 7.29099 8.19383 7.04921 8.77754C6.80743 9.36125 6.74417 10.0035 6.86742 10.6232C6.99068 11.2429 7.29492 11.8121 7.74168 12.2588C8.18843 12.7056 8.75762 13.0098 9.37728 13.1331C9.99695 13.2563 10.6392 13.1931 11.2229 12.9513C11.8067 12.7095 12.3056 12.3001 12.6566 11.7747C13.0076 11.2494 13.1949 10.6318 13.1949 10C13.1949 9.15278 12.8584 8.34026 12.2593 7.74119C11.6602 7.14211 10.8477 6.80556 10.0005 6.80556V6.80556ZM10.0005 11.5278C9.69832 11.5278 9.40294 11.4382 9.1517 11.2703C8.90046 11.1024 8.70464 10.8638 8.58901 10.5847C8.47337 10.3055 8.44312 9.99831 8.50207 9.70195C8.56102 9.40559 8.70652 9.13336 8.92019 8.9197C9.13385 8.70603 9.40607 8.56053 9.70243 8.50158C9.99879 8.44263 10.306 8.47288 10.5851 8.58852C10.8643 8.70415 11.1029 8.89997 11.2708 9.15121C11.4387 9.40245 11.5283 9.69783 11.5283 10C11.5264 10.4046 11.3649 10.7922 11.0788 11.0783C10.7927 11.3644 10.4051 11.526 10.0005 11.5278ZM13.3338 2.5H6.66716C5.56209 2.5 4.50228 2.93899 3.72088 3.72039C2.93948 4.50179 2.50049 5.5616 2.50049 6.66667V13.3333C2.50049 14.4384 2.93948 15.4982 3.72088 16.2796C4.50228 17.061 5.56209 17.5 6.66716 17.5H13.3338C14.4389 17.5 15.4987 17.061 16.2801 16.2796C17.0615 15.4982 17.5005 14.4384 17.5005 13.3333V6.66667C17.5005 5.5616 17.0615 4.50179 16.2801 3.72039C15.4987 2.93899 14.4389 2.5 13.3338 2.5V2.5ZM15.8338 13.3333C15.8338 13.9964 15.5704 14.6323 15.1016 15.1011C14.6327 15.5699 13.9969 15.8333 13.3338 15.8333H6.66716C6.00411 15.8333 5.36823 15.5699 4.89939 15.1011C4.43055 14.6323 4.16716 13.9964 4.16716 13.3333V6.66667C4.16716 6.00363 4.43055 5.36774 4.89939 4.8989C5.36823 4.43006 6.00411 4.16667 6.66716 4.16667H13.3338C13.9969 4.16667 14.6327 4.43006 15.1016 4.8989C15.5704 5.36774 15.8338 6.00363 15.8338 6.66667V13.3333ZM14.7227 6.38889C14.7227 6.60865 14.6575 6.82347 14.5355 7.00619C14.4134 7.18891 14.2398 7.33132 14.0368 7.41542C13.8338 7.49952 13.6104 7.52152 13.3948 7.47865C13.1793 7.43578 12.9813 7.32995 12.8259 7.17456C12.6705 7.01917 12.5647 6.82119 12.5218 6.60566C12.479 6.39012 12.501 6.16671 12.5851 5.96369C12.6692 5.76066 12.8116 5.58712 12.9943 5.46503C13.177 5.34294 13.3918 5.27778 13.6116 5.27778C13.9063 5.27778 14.1889 5.39484 14.3973 5.60322C14.6056 5.81159 14.7227 6.0942 14.7227 6.38889Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg
      className="inline-block w-5 h-5"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.8338 2.5C16.2758 2.5 16.6998 2.67559 17.0123 2.98816C17.3249 3.30072 17.5005 3.72464 17.5005 4.16667V15.8333C17.5005 16.2754 17.3249 16.6993 17.0123 17.0118C16.6998 17.3244 16.2758 17.5 15.8338 17.5H4.16715C3.72513 17.5 3.3012 17.3244 2.98864 17.0118C2.67608 16.6993 2.50049 16.2754 2.50049 15.8333V4.16667C2.50049 3.72464 2.67608 3.30072 2.98864 2.98816C3.3012 2.67559 3.72513 2.5 4.16715 2.5H15.8338ZM15.4172 15.4167V11C15.4172 10.2795 15.1309 9.5885 14.6215 9.07903C14.112 8.56955 13.421 8.28333 12.7005 8.28333C11.9922 8.28333 11.1672 8.71667 10.7672 9.36667V8.44167H8.44215V15.4167H10.7672V11.3083C10.7672 10.6667 11.2838 10.1417 11.9255 10.1417C12.2349 10.1417 12.5317 10.2646 12.7504 10.4834C12.9692 10.7022 13.0922 10.9989 13.0922 11.3083V15.4167H15.4172ZM5.73382 7.13333C6.10512 7.13333 6.46122 6.98583 6.72377 6.72328C6.98632 6.46073 7.13382 6.10464 7.13382 5.73333C7.13382 4.95833 6.50882 4.325 5.73382 4.325C5.36031 4.325 5.00209 4.47338 4.73798 4.73749C4.47387 5.0016 4.32549 5.35982 4.32549 5.73333C4.32549 6.50833 4.95882 7.13333 5.73382 7.13333ZM6.89216 15.4167V8.44167H4.58382V15.4167H6.89216Z"
        fill="currentColor"
      />
    </svg>
  );
}
