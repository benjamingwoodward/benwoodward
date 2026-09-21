import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import WorkMachine from "../../src/components/machines/WorkMachine";
import { work } from "../../src/data/profile";
import "../../src/styles/global.css";
import "./review.css";

function Review() {
  const [replay, setReplay] = useState(0);
  return <main className="container review"><header><h1>Purposeful machinery.</h1><p>Five distinct machines, one drawing language.</p><button className="button primary" onClick={() => setReplay(value => value + 1)}>Replay machinery ↻</button></header>
    <div className="machine-review-grid">{work.map(item=><article className="work-card" key={`${item.id}-${replay}`}><h2>{item.title}</h2><WorkMachine illustration={item.illustration} /></article>)}</div>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Review />);
