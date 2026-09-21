import { createRoot } from 'react-dom/client';
import ShapeWaves from './ShapeWaves';

export function mountHeroWaves(host) {
  const root = createRoot(host);
  root.render(
    <ShapeWaves
      text=""
      shapes="mixed"
      backgroundColor="#ffffff"
      color="#abb1a8"
      cellSize={16}
      dotSize={0.46}
      speed={0.55}
      scale={1.8}
      flow={0.08}
      direction={18}
      contrast={0.85}
      brightness={0.38}
      fade={0.55}
      interactive={false}
      glow={0}
      introDuration={1.8}
      maxDpr={2}
      onError={() => { host.dataset.fallback = 'true'; }}
    />
  );
  return () => root.unmount();
}
