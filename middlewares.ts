import { createReporter } from "./deps.ts";
import type { BlogContext, BlogMiddleware } from "./types.d.ts";

export function ga(gaKey: string): BlogMiddleware {
  if (gaKey.length === 0) {
    throw new Error("GA key cannot be empty.");
  }

  const gaReporter = createReporter({ id: gaKey });

  return async function (
    request: Request,
    ctx: BlogContext,
  ): Promise<Response> {
    let err: undefined | Error;
    let res: undefined | Response;

    const start = performance.now();
    try {
      res = await ctx.next() as Response;
    } catch (e) {
      err = e;
      res = new Response("Internal server error", {
        status: 500,
      });
    } finally {
      if (gaReporter) {
        gaReporter(request, ctx.connInfo, res!, start, err);
      }
    }
    return res;
  };
}

export function redirects(redirectMap: Record<string, string>): BlogMiddleware {
  return async function (req: Request, ctx: BlogContext): Promise<Response> {
    const { pathname } = new URL(req.url);

    let maybeRedirect = redirectMap[pathname];

    if (!maybeRedirect) {
      // trim leading slash
      maybeRedirect = redirectMap[pathname.slice(1)];
    }

    if (maybeRedirect) {
      if (!maybeRedirect.startsWith("/")) {
        maybeRedirect = "/" + maybeRedirect;
      }

      return new Response(null, {
        status: 307,
        headers: {
          "location": maybeRedirect,
        },
      });
    }

    return await ctx.next();
  };
}
