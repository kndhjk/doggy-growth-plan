// Breakpoint helpers
export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
export const isTablet = () => typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
export const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1024;

// Fluid typography — scales between min and max based on viewport
export const fluid = (minPx, maxPx, minVw = 375, maxVw = 1440) =>
  `clamp(${minPx}px, ${(minPx / minVw * 100).toFixed(2)}vw + ${(maxPx - minVw * maxPx / minVw).toFixed(2)}px, ${maxPx}px)`;

// Common responsive values
export const rp = {
  pagePadding: () => isMobile() ? '12px' : isTablet() ? '20px' : '24px',
  heroPadding: () => isMobile() ? '20px 16px 36px' : isTablet() ? '24px 20px 40px' : '28px 24px 48px',
  heroPaddingNegative: () => isMobile() ? '-20px -16px -36px' : isTablet() ? '-24px -20px -40px' : '-28px -24px -48px',
  cardGap: () => isMobile() ? 8 : 12,
  cardMinWidth: () => isMobile() ? '140px' : isTablet() ? '160px' : '150px',
  statCardGap: () => isMobile() ? 8 : 12,
  modalPadding: () => isMobile() ? '20px 16px' : '28px 24px',
  bannerRadius: () => isMobile() ? '0 0 20px 20px' : '0 0 28px 28px',
  sectionGap: () => isMobile() ? '16px' : '20px',
  gridCols: (min) => isMobile() ? `repeat(auto-fill, minmax(${Math.max(140, min)}px, 1fr))` : `repeat(auto-fill, minmax(${min}px, 1fr))`,
};