import React from 'react';
import sceneBg from '../../assets/pet/scene_bg.png';

// Home scene background — single painted PNG covering the entire playground.
// Contains window / picture frame / plant / dog bed / wood floor / wall, all
// in one image (replaces the prior emoji-based decorations).
export default function SceneDecor() {
  return (
    <img
      src={sceneBg}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
      }}
    />
  );
}
