import manifest from "../../public/scenes/hero/manifest.json";

const version = (manifest as { version?: string }).version;

/**
 * URL of a hero layer or sprite. /scenes is cached for a year, so the content
 * version written by build_layers.py / import_layers.py makes a re-import visible.
 */
export function heroAsset(file: string) {
  return `/scenes/hero/${file}${version ? `?v=${version}` : ""}`;
}
