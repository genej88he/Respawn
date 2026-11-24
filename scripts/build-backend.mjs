// Bundles backend/src/main.ts and preload.ts into dist/backend/*.js.
// Bundling matters for the preload: a sandboxed preload can't load other
// files, so shared/ipc.ts has to be copied into it.
import { build, context } from 'esbuild'

export const backendBuildOptions = {
  entryPoints: ['backend/src/main.ts', 'backend/src/preload.ts'],
  outdir: 'dist/backend',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  sourcemap: true,
  logLevel: 'info',
}

export function watchBackend(onRebuild) {
  return context({
    ...backendBuildOptions,
    plugins: [{ name: 'on-rebuild', setup(b) { b.onEnd(r => { if (r.errors.length === 0) onRebuild() }) } }],
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await build(backendBuildOptions)
}
