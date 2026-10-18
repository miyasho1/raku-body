import React, { useRef, useEffect } from 'react';

export default function WheelPicker({
  items,
  value,
  onChange,
  width = 'w-16',
  height = 'h-[190px]',
  itemHeight = 44,
  textAlign = 'center',
  fontSize = 'text-xl',
  subFontSize = 'text-sm'
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const idx = items.indexOf(value);
      if (idx !== -1) {
        containerRef.current.scrollTop = idx * itemHeight;
      }
    }
  }, [value, items, itemHeight]);

  const handleScroll = (e) => {
    const idx = Math.round(e.target.scrollTop / itemHeight);
    if (idx >= 0 && idx < items.length) {
      if (items[idx] !== value) {
        onChange(items[idx]);
      }
    }
  };

  const handleItemClick = (item, idx) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: idx * itemHeight,
        behavior: 'smooth'
      });
    }
    onChange(item);
  };

  const numericHeight = parseInt(height.replace(/\D/g, '') || '190', 10);
  const padY = Math.max(0, Math.round((numericHeight - itemHeight) / 2));

  return (
    <div className={`relative ${height} ${width} overflow-hidden select-none`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: `${padY}px`,
          paddingBottom: `${padY}px`
        }}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        {items.map((item, idx) => {
          const isSelected = item === value;
          return (
            <div
              key={idx}
              onClick={() => handleItemClick(item, idx)}
              style={{ height: `${itemHeight}px` }}
              className={`snap-center flex items-center ${textAlign === 'right' || textAlign === 'end' ? 'justify-end' : textAlign === 'left' || textAlign === 'start' ? 'justify-start' : 'justify-center'} px-1 cursor-pointer transition-colors tabular-nums ${
                isSelected
                  ? `text-[#1A1A1C] ${fontSize} font-bold tracking-tight`
                  : `text-[#98A2B3] hover:text-[#475467] ${subFontSize} font-medium`
              }`}
            >
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
