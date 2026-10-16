import { Skia, PaintStyle, TileMode, BlurStyle, type SkCanvas, type SkImage, type SkPaint, type SkPicture } from '@shopify/react-native-skia';
import { Engine, HEIGHT, WIDTH, gateBounds } from './engine';

type Images = { city: SkImage; bird: SkImage; pillar: SkImage };
const rect = (x: number, y: number, w: number, h: number) => Skia.XYWHRect(x, y, w, h);
const point = (x: number, y: number) => ({ x, y });
const fade = (n: number) => Math.max(0, Math.min(1, n));

export function makePainter(images: Images) {
  const fill = Skia.Paint(); fill.setAntiAlias(true);
  const stroke = Skia.Paint(); stroke.setAntiAlias(true); stroke.setStyle(PaintStyle.Stroke);
  const texture = Skia.Paint(); texture.setAntiAlias(true);
  const glow = Skia.Paint(); glow.setAntiAlias(true); glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 12, true));
  const metallic = Skia.Paint(); metallic.setShader(Skia.Shader.MakeLinearGradient(point(0, 0), point(390, 0), [Skia.Color('#293b30'), Skia.Color('#94a68a'), Skia.Color('#172a22'), Skia.Color('#d0d3aa'), Skia.Color('#263b2e')], [0, 0.23, 0.5, 0.76, 1], TileMode.Clamp));
  const fog = Skia.Paint(); fog.setShader(Skia.Shader.MakeLinearGradient(point(0, 0), point(0, HEIGHT), [Skia.Color('#03120caa'), Skia.Color('#05120b00'), Skia.Color('#06150dcc')], [0, 0.45, 1], TileMode.Clamp));
  const beam = Skia.Paint(); beam.setShader(Skia.Shader.MakeLinearGradient(point(0, 0), point(0, 700), [Skia.Color('#c3fce022'), Skia.Color('#a0e7c300')], [0, 1], TileMode.Clamp));
  const set = (paint: SkPaint, color: string, alpha = 1) => { paint.setColor(Skia.Color(color)); paint.setAlphaf(alpha); return paint; };
  const image = (canvas: SkCanvas, img: SkImage, x: number, y: number, w: number, h: number, alpha = 1) => { texture.setAlphaf(alpha); canvas.drawImageRect(img, rect(0, 0, img.width(), img.height()), rect(x, y, w, h), texture); };
  const line = (canvas: SkCanvas, x1: number, y1: number, x2: number, y2: number, color: string, width = 1, alpha = 1) => { set(stroke, color, alpha); stroke.setStrokeWidth(width); canvas.drawLine(x1, y1, x2, y2, stroke); };
  const diamond = (canvas: SkCanvas, x: number, y: number, size: number, color: string) => {
    const path = Skia.Path.Make(); path.moveTo(x, y - size); path.lineTo(x + size * 0.55, y); path.lineTo(x, y + size); path.lineTo(x - size * 0.55, y); path.close();
    canvas.drawPath(path, set(fill, color, 0.85)); line(canvas, x, y - size, x, y + size, '#e6ffe9', 1.2, 0.8); line(canvas, x - size * 0.55, y, x, y - size, '#f0ffef', 1, 0.9);
    path.dispose();
  };

  function background(canvas: SkCanvas, state: Engine) {
    const offset = (state.distance * 0.16) % HEIGHT;
    const srcWidth = images.city.height() * WIDTH / HEIGHT;
    const src = rect((images.city.width() - srcWidth) / 2, 0, srcWidth, images.city.height());
    texture.setAlphaf(1);
    canvas.drawImageRect(images.city, src, rect(0, offset, WIDTH, HEIGHT), texture);
    canvas.drawImageRect(images.city, src, rect(0, offset - HEIGHT, WIDTH, HEIGHT), texture);
    canvas.drawRect(rect(0, 0, WIDTH, HEIGHT), set(fill, '#04160e', 0.3));
    if (state.world !== 'gardens') canvas.drawRect(rect(0, 0, WIDTH, HEIGHT), set(fill, state.world === 'temple' ? '#8d5f15' : '#2a517f', 0.2));
    for (let i = 0; i < 3; i++) {
      const x = 65 + i * 140 + Math.sin(state.time * 0.1) * 12;
      const path = Skia.Path.Make(); path.moveTo(x, -20); path.lineTo(x - 180, HEIGHT); path.lineTo(x - 90, HEIGHT); path.close(); canvas.drawPath(path, beam); path.dispose();
    }
    for (let i = 0; i < (state.reducedMotion ? 12 : 36); i++) {
      const x = (i * 97 + Math.sin(state.time * 0.3 + i) * 10) % WIDTH;
      const y = ((i * 61 + state.distance * (0.2 + (i % 3) * 0.18) + state.time * 3) % (HEIGHT + 40)) - 20;
      canvas.drawCircle(x, y, i % 7 === 0 ? 1.8 : 0.8, set(fill, i % 3 ? '#b3ead5' : '#e5d5a0', 0.25 + Math.sin(state.time + i) * 0.16));
    }
    canvas.drawRect(rect(0, 0, WIDTH, HEIGHT), fog);
  }

  function pillars(canvas: SkCanvas, state: Engine) {
    for (const gate of state.gates) {
      const bounds = gateBounds(gate);
      for (let i = 0; i < 2; i++) {
        const b = bounds[i]!;
        image(canvas, images.pillar, b.x, b.y, b.width, b.height);
        canvas.drawRect(rect(b.x, b.y, b.width, b.height), set(fill, '#071b14', 0.15));
        canvas.drawRect(rect(b.x, b.y, b.width, 6), metallic);
        canvas.drawRect(rect(b.x, b.y + b.height - 8, b.width, 8), metallic);
        const edge = i === 0 ? b.width : b.x;
        line(canvas, edge, b.y + 2, edge, b.y + b.height - 2, '#9ae8c2', 2, 0.8);
        canvas.drawRect(rect(edge - 3, b.y + 15, 6, b.height - 30), set(glow, '#72edbc', 0.35));
        for (let j = 0; j < 3; j++) diamond(canvas, edge + (i === 0 ? -12 : 12), b.y + 28 + j * 47, 13, '#84d7b9');
        for (let rib = 1; rib < 4; rib++) line(canvas, b.x, b.y + rib * 40, b.x + b.width, b.y + rib * 40, '#acba96', 1, 0.24);
      }
      if (!gate.collected) {
        const y = gate.y + gate.height / 2;
        canvas.drawCircle(gate.gap, y, 19 + Math.sin(state.time * 4) * 3, set(glow, '#a6ffcc', 0.42));
        diamond(canvas, gate.gap, y, 14, '#b9ffd4');
      }
    }
  }

  function bird(canvas: SkCanvas, x: number, y: number, size: number, tilt: number, alpha = 1) {
    canvas.save(); canvas.translate(x, y); canvas.rotate(tilt * 180 / Math.PI, 0, 0);
    canvas.drawCircle(0, 0, size * 0.22, set(glow, '#73f2bb', 0.15 * alpha));
    image(canvas, images.bird, -size * 0.62, -size * 0.52, size, size, alpha); canvas.restore();
  }

  function intro(canvas: SkCanvas, state: Engine) {
    const t = state.introTime;
    const escape = fade((t - 2.7) / 1.5);
    const roomOpacity = 1 - escape;
    canvas.drawRect(rect(0, 0, 35, HEIGHT), set(fill, '#050b09', roomOpacity));
    canvas.drawRect(rect(355, 0, 35, HEIGHT), set(fill, '#050b09', roomOpacity));
    canvas.drawRect(rect(0, 540, WIDTH, 220), set(fill, '#09100d', roomOpacity));
    for (const x of [35, 355]) { line(canvas, x, 0, x, 540, '#697a67', 6, roomOpacity); line(canvas, x + 4, 0, x + 4, 540, '#c8e5cb', 1, roomOpacity * 0.5); }
    line(canvas, 35, 540, 355, 540, '#98bba1', 3, roomOpacity);
    for (let i = 0; i < 8; i++) line(canvas, 195, 540, -200 + i * 110, HEIGHT, '#6c8773', 0.5, roomOpacity * 0.35);
    for (let i = 1; i < 5; i++) line(canvas, 0, 540 + i * i * 10, WIDTH, 540 + i * i * 10, '#6c8773', 0.5, roomOpacity * 0.2);
    canvas.drawOval(rect(105, 521, 180, 38), set(glow, '#5acb9e', 0.2 * roomOpacity));
    canvas.drawOval(rect(106, 515, 178, 28), set(fill, '#1d3329', roomOpacity));
    if (t < 1.7) {
      canvas.drawRRect(Skia.RRectXY(rect(122, 340, 146, 185), 28, 20), set(fill, '#a9ffe0', 0.07));
      set(stroke, '#a8eacf', 0.65); stroke.setStrokeWidth(1); canvas.drawRRect(Skia.RRectXY(rect(122, 340, 146, 185), 28, 20), stroke);
      canvas.drawOval(rect(122, 336, 146, 28), stroke);
      line(canvas, 137, 364, 137, 497, '#e0fff1', 2, 0.3); line(canvas, 148, 358, 148, 505, '#e0fff1', 1, 0.1);
      if (t > 1.2) { line(canvas, 200, 350, 185, 410, '#f0fff3', 1, (t - 1.2) * 2); line(canvas, 185, 410, 218, 445, '#f0fff3', 1, (t - 1.2) * 2); line(canvas, 185, 410, 150, 430, '#f0fff3', 1, (t - 1.2) * 2); }
    } else {
      const explosion = t - 1.7;
      canvas.drawCircle(195, 430, 35 + explosion * 100, set(glow, '#afffe0', fade(1 - explosion * 2) * 0.8));
      const count = state.reducedMotion ? 10 : 38;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399; const speed = 35 + i % 7 * 15;
        const x = 195 + Math.cos(angle) * explosion * speed; const y = 430 + Math.sin(angle) * explosion * speed + explosion * explosion * 35;
        canvas.save(); canvas.translate(x, y); canvas.rotate(i * 19 + explosion * 50, 0, 0);
        const shard = Skia.Path.Make(); shard.moveTo(-5, -10); shard.lineTo(7, -4); shard.lineTo(1, 13); shard.close(); canvas.drawPath(shard, set(fill, '#b7ffe0', fade(1 - explosion / 3) * 0.6)); shard.dispose(); canvas.restore();
      }
    }
    const fly = fade((t - 1.9) / 2.4);
    const y = 435 - Math.sin(fly * Math.PI) * 220 + fly * 82;
    bird(canvas, 202 + Math.sin(fly * Math.PI) * 50, y, 110 - fly * 10, -fly * 0.2);
  }

  return {
    draw(state: Engine): SkPicture {
      const recorder = Skia.PictureRecorder(); const canvas = recorder.beginRecording(rect(0, 0, WIDTH, HEIGHT));
      background(canvas, state);
      if (state.phase === 'intro') intro(canvas, state);
      else {
        pillars(canvas, state);
        for (const p of state.particles) canvas.drawCircle(p.x, p.y, p.size, set(fill, p.kind === 'crystal' ? '#efffc2' : '#87edc4', fade(p.life / p.maxLife) * 0.8));
        bird(canvas, state.bird.x, state.bird.y, 100, state.bird.tilt, state.phase === 'gameover' ? 0.45 : 1);
        if (state.phase === 'gameover') canvas.drawRect(rect(0, 0, WIDTH, HEIGHT), set(fill, '#07120d', 0.45));
      }
      const picture = recorder.finishRecordingAsPicture(); recorder.dispose(); return picture;
    },
    dispose() { [fill, stroke, texture, glow, metallic, fog, beam].forEach(paint => paint.dispose()); },
  };
}
