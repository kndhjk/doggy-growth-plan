import React from 'react';

// Home scene decorations: window, picture frame, plant, couch, wood floor.
// Pure presentational — sits in the playground absolute layer behind the dog.
export default function SceneDecor() {
  return (
    <>
      <SceneStyles />
      <div className="v2-scene-window" />
      <div className="v2-scene-frame">🖼️</div>
      <div className="v2-scene-plant">🪴</div>
      <div className="v2-scene-couch">🛋️</div>
      <div className="v2-scene-floor" />
    </>
  );
}

function SceneStyles() {
  return (
    <style>{`
      .v2-scene-window {
        position: absolute; top: 28px; right: 36px;
        width: 140px; height: 100px;
        background: linear-gradient(180deg,#bfdbfe 0%,#dbeafe 50%,#fef9c3 100%);
        border: 6px solid #fff;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        pointer-events: none;
      }
      .v2-scene-window::before,
      .v2-scene-window::after {
        content: ''; position: absolute; background: #fff;
      }
      .v2-scene-window::before { left: 50%; top: 0; bottom: 0; width: 4px; transform: translateX(-50%); }
      .v2-scene-window::after  { top: 50%; left: 0; right: 0; height: 4px; transform: translateY(-50%); }

      .v2-scene-frame {
        position: absolute; top: 44px; left: 48px;
        font-size: 56px; opacity: 0.85; pointer-events: none;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
      }
      .v2-scene-plant {
        position: absolute; bottom: 24px; left: 28px;
        font-size: 68px; pointer-events: none;
        filter: drop-shadow(0 6px 10px rgba(0,0,0,0.12));
      }
      .v2-scene-couch {
        position: absolute; bottom: 18px; right: 28px;
        font-size: 64px; pointer-events: none;
        filter: drop-shadow(0 6px 10px rgba(0,0,0,0.12));
      }
      .v2-scene-floor {
        position: absolute; left: 0; right: 0; bottom: 0; height: 45%;
        background: repeating-linear-gradient(90deg,
          rgba(0,0,0,0) 0px, rgba(0,0,0,0) 60px,
          rgba(0,0,0,0.04) 60px, rgba(0,0,0,0.04) 62px);
        pointer-events: none;
      }
    `}</style>
  );
}
