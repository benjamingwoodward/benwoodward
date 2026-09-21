import { createRoot } from 'react-dom/client';
import ShapeWaves from './ShapeWaves';

export function mountIntroWaves(host) {
  const root = createRoot(host);
  root.render(
    <ShapeWaves
      text=""
      shapes="mixed"
      backgroundColor="#ff4f1f"
      color="#77260f"
      cellSize={14}
      dotSize={0.55}
      speed={0.35}
      scale={1.4}
      fade={0.3}
      interactive={false}
      glow={0}
      introDuration={1.2}
      maxDpr={1}
      onError={() => { host.dataset.fallback = 'true'; }}
    />
  );
  return () => root.unmount();
}
