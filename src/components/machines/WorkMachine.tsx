import { useEffect, useRef } from "react";
import { startFiniteMotion } from "./motion";
import { PurposefulMachine, type IllustrationId } from "./purposeful-machines";
import { animatePurposefulMachine } from "./purposeful-motion";

export default function WorkMachine({ illustration }: { illustration: IllustrationId }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const link = element.closest(".work-card")?.querySelector<HTMLAnchorElement>("a");
    const motion = startFiniteMotion(element, animate => animatePurposefulMachine(element, animate, illustration), link);
    return () => motion?.dispose();
  }, [illustration]);
  return <div className="work-machine" data-illustration={illustration} ref={root}><PurposefulMachine scene={illustration} /></div>;
}
