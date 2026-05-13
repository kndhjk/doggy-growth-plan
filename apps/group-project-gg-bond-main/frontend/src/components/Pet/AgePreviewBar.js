import React, { useCallback, useState, useEffect, useRef } from "react";
import { useI18n } from "../../i18n/I18nContext";

/**
 * AgePreviewBar — 可拖动的年龄预览条
 *
 * Renders a draggable slider representing the dog age in months (0-120).
 * Dragging updates the parent previewAge state in real time so the dog
 * visual updates continuously. Mouse-hover alone does NOT change value;
 * the user must press and drag (or tap and drag on touch).
 *
 * Props:
 *   previewAge — current preview age in years (float)
 *   onChange   — (yearsFloat) => void
 *   disabled   — hide when true
 */
export default function AgePreviewBar({ previewAge, onChange, disabled }) {
  const { t } = useI18n();
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const MIN_YEARS = 0;
  const MAX_YEARS = 12;
  const ticks = [0, 1, 2, 3, 5, 7, 10, 12];

  const pct = ((previewAge - MIN_YEARS) / (MAX_YEARS - MIN_YEARS)) * 100;

  const updateFromClientX = useCallback((clientX) => {
    if (disabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(MIN_YEARS + ratio * (MAX_YEARS - MIN_YEARS));
  }, [disabled, onChange]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    setDragging(true);
    updateFromClientX(e.clientX);
  }, [disabled, updateFromClientX]);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setDragging(true);
    updateFromClientX(e.touches[0].clientX);
  }, [disabled, updateFromClientX]);

  // Only listen to mousemove / touchmove while dragging
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => updateFromClientX(e.clientX);
    const onTouchMove = (e) => {
      e.preventDefault();
      updateFromClientX(e.touches[0].clientX);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, updateFromClientX]);

  if (disabled) return null;

  const getStageLabel = (age) => {
    if (age < 1) return t("pet.stage.puppy");
    if (age < 2) return t("pet.stage.teen");
    if (age < 7) return t("pet.stage.adult");
    return t("pet.stage.senior");
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        width: "100%",
        padding: "10px 20px 6px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        cursor: dragging ? "grabbing" : "pointer",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Labels row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#f472b6", fontWeight: 600 }}>
          {previewAge < 1
            ? `${Math.round(previewAge * 12)} ${t("pet.age.months")}`
            : `${previewAge.toFixed(1)} ${t("pet.age.years")}`}
        </span>
        <span style={{ fontSize: 11, color: "#be185d", fontWeight: 700 }}>
          {getStageLabel(previewAge)}
        </span>
      </div>

      {/* Track + thumb */}
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* Background track */}
        <div style={{
          position: "absolute",
          left: 0, right: 0,
          height: 6,
          borderRadius: 3,
          background: "linear-gradient(to right, #fce7f3 0%, #f472b6 100%)",
          opacity: 0.6,
        }} />

        {/* Active fill */}
        <div style={{
          position: "absolute",
          left: 0,
          width: `${pct}%`,
          height: 6,
          borderRadius: 3,
          background: "linear-gradient(to right, #f472b6, #fb7185)",
          boxShadow: "0 0 8px rgba(244,114,182,0.4)",
        }} />

        {/* Tick marks */}
        {ticks.map(tick => (
          <div
            key={tick}
            style={{
              position: "absolute",
              left: `${((tick - MIN_YEARS) / (MAX_YEARS - MIN_YEARS)) * 100}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: tick % 3 === 0 ? 2 : 1,
              height: tick % 3 === 0 ? 10 : 6,
              borderRadius: 1,
              background: tick % 3 === 0 ? "#be185d" : "#f9a8d4",
              opacity: tick % 3 === 0 ? 0.8 : 0.5,
            }}
          />
        ))}

        {/* Thumb */}
        <div style={{
          position: "absolute",
          left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          border: "3px solid #f472b6",
          boxShadow: "0 2px 8px rgba(244,114,182,0.5)",
          cursor: dragging ? "grabbing" : "grab",
          top: "50%",
          transition: "box-shadow 0.15s",
        }} />
      </div>

      {/* Year labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {ticks.map(tick => (
          <span key={tick} style={{ fontSize: 9, color: "#f9a8d4", fontWeight: tick % 3 === 0 ? 600 : 400 }}>
            {tick}y
          </span>
        ))}
      </div>
    </div>
  );
}
