import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  packages: "external",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
});

