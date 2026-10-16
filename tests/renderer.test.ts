import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
import type { CanvasKit, CanvasKitInitOptions } from 'canvaskit-wasm';
import { JsiSkApi } from '@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia';
import { BlurStyle, PaintStyle, TileMode } from '@shopify/react-native-skia/lib/commonjs/skia/types';
import * as engine from '../src/game/engine';

const requireFromRoot = createRequire(resolve('package.json'));

test('real CanvasKit rasterizes the cage, shatter, flight, and crash without a browser', async () => {
  const init = requireFromRoot('canvaskit-wasm/bin/full/canvaskit.js') as (options: CanvasKitInitOptions) => Promise<CanvasKit>;
  const canvasKit = await init({ locateFile: file => requireFromRoot.resolve(`canvaskit-wasm/bin/full/${file}`) });
  const Skia = JsiSkApi(canvasKit);
  const module = { exports: {} as typeof import('../src/game/draw') };
  // Load only the painter against Skia's real web backend, without React Native's entry point.
  const compiled = ts.transpileModule(readFileSync(resolve('src/game/draw.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const execute = runInThisContext(`(function(require, module, exports) { ${compiled}\n})`);
  execute((name: string) => {
      if (name === '@shopify/react-native-skia') return { Skia, BlurStyle, PaintStyle, TileMode };
      if (name === './engine') return engine;
      throw new Error(`Unexpected painter dependency: ${name}`);
    }, module, module.exports);
  const load = (file: string) => {
    const data = Skia.Data.fromBytes(readFileSync(resolve('assets', file)));
    const image = Skia.Image.MakeImageFromEncoded(data);
    data.dispose();
    assert.ok(image, `${file} must decode`);
    return image;
  };
  const images = { city: load('bio-city.jpg'), bird: load('bird.png'), pillar: load('pillar.jpg') };
  const painter = module.exports.makePainter(images);
  const surface = Skia.Surface.Make(engine.WIDTH, engine.HEIGHT);
  assert.ok(surface);
  const state = engine.createEngine();
  const hashes = new Set<string>();
  try {
    for (const phase of ['cage', 'shatter', 'flight', 'crash']) {
      if (phase === 'shatter') state.introTime = 2.2;
      if (phase === 'flight') {
        engine.skipIntro(state); engine.startFlight(state);
        state.gates[0]!.y = 150;
        engine.steer(state, 150, true, 600);
        engine.stepEngine(state, engine.FIXED_STEP);
      }
      if (phase === 'crash') state.phase = 'gameover';
      const picture = painter.draw(state);
      surface.getCanvas().drawPicture(picture);
      surface.flush();
      picture.dispose();
      const image = surface.makeImageSnapshot();
      const png = image.encodeToBytes();
      assert.ok(png.length > 10000, `${phase} must contain rendered artwork`);
      hashes.add(createHash('sha256').update(png).digest('hex'));
      image.dispose();
    }
    assert.equal(hashes.size, 4, 'all four scenes must render differently');
  } finally {
    painter.dispose(); surface.dispose();
    Object.values(images).forEach(image => image.dispose());
  }
});
