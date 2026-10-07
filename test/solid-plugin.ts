import { plugin } from "bun";
import { transform } from "@solidjs/compiler";

/** Bun's own JSX transform is React-shaped; compile .tsx with Solid 2's compiler for tests. */
plugin({
  name: "solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
      const source = await Bun.file(path).text();
      return { contents: transform(source, { filename: path, generate: "dom" }).code, loader: "ts" };
    });
  },
});
