import React from 'react';
import StatusBar from './StatusBar';
import { STATUS_META } from '../../sandbox/statusDecayV2';

// 5-column grid of StatusBars. Sits ABOVE the dog inside the playground.
export default function StatusRow({ statuses }) {
  return (
    <>
      <StatusRowStyles />
      <div className="v2-status-row">
        {Object.keys(STATUS_META).map(k => (
          <StatusBar key={k} statusKey={k} value={statuses[k]} />
        ))}
      </div>
    </>
  );
}

function StatusRowStyles() {
  return (
    <style>{`
      .v2-status-row {
        position: relative;
        z-index: 3;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
        width: 100%;
        max-width: 560px;
        margin-bottom: 20px;
      }
      @media (min-width: 900px) {
        .v2-status-row { gap: 12px; }
      }
    `}</style>
  );
}
