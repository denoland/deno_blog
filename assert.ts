interface Assert<T> {
  (val: unknown, name?: string): T;
  type: string;
}

let assertTemplate = (name: string, type: string) => {
  return `${name} expects: ${type}`;
};

export function setAssertTemplate(
  template: (name: string, type: string) => string,
) {
  assertTemplate = template;
}

function assertBuilder<T>(
  type: string,
  predicate: (val: unknown) => boolean,
): Assert<T> {
  const fn = (val: unknown, name = "value") => {
    if (!predicate(val)) {
      throw new Error(assertTemplate(name, type));
    }
    return val as T;
  };
  Object.defineProperty(fn, "type", {
    value: type,
  });
  return fn as Assert<T>;
}

type AssertType<T extends Assert<unknown>> = T extends Assert<infer P> ? P
  : never;

type ComposeAssert<
  T1 extends Assert<unknown>,
  T2 extends Assert<unknown>,
> = Assert<AssertType<T1> | AssertType<T2>>;

type ComposeAsserts<
  T extends Assert<unknown>[],
> = T extends
  [infer P extends Assert<unknown>, ...infer Rest extends Assert<unknown>[]]
  ? ComposeAssert<P, ComposeAsserts<Rest>>
  : never;

export function composeAssert<T extends Assert<unknown>[]>(
  ...asserts: T
): ComposeAsserts<T> {
  return assertBuilder(asserts.map((a) => a.type).join("|"), (val) => {
    return asserts.some((fn) => {
      try {
        fn(val);
        return true;
      } catch {
        return false;
      }
    });
  }) as ComposeAsserts<T>;
}

export const assertString = assertBuilder<string>(
  "string",
  (val) => typeof val === "string",
);

export const assertDate = assertBuilder<Date>(
  "Date",
  (val) => val instanceof Date,
);

export const assertUndefined = assertBuilder<undefined>(
  "undefined",
  (val) => val === undefined,
);

export function assertArray<T = unknown>(
  val: unknown,
  name = "value",
  assertChild?: Assert<T>,
): T[] {
  if (val instanceof Array) {
    return assertChild
      ? val.map<T>((item) => assertChild(item, `child of ${name}`))
      : val;
  }
  throw new Error(assertTemplate(name, "array"));
}

export function assertArrayOf<T = unknown>(
  assertChild: Assert<T>,
): Assert<T[]> {
  const fn = (val: unknown, name = "value") => {
    return assertArray(val, name, assertChild);
  };

  Object.defineProperty(fn, "type", {
    value: `${
      assertChild.type.includes("|")
        ? `(${assertChild.type})`
        : assertChild.type
    }[]`,
  });
  return fn as Assert<T[]>;
}

export function optional<T>(fn: Assert<T>, val: unknown, name?: string) {
  return composeAssert(
    fn,
    assertUndefined,
  )(val, name);
}
