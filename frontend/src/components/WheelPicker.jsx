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

  const getItemValue = (item) => (item !== null && typeof item === 'object' && 'value' in item ? item.value : item);
  const getItemLabel = (item) => (item !== null && typeof item === 'object' && 'label' in item ? item.label : item);

  useEffect(() => {
    if (containerRef.current) {
      const idx = items.findIndex((it) => getItemValue(it) === value);
      if (idx !== -1) {
        containerRef.current.scrollTop = idx * itemHeight;
      }
    }
  }, [value, items, itemHeight]);

  const handleScroll = (e) => {
    const idx = Math.round(e.target.scrollTop / itemHeight);
    if (idx >= 0 && idx < items.length) {
      const nextVal = getItemValue(items[idx]);
      if (nextVal !== value) {
        onChange(nextVal);
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
    onChange(getItemValue(item));
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
          const itemVal = getItemValue(item);
          const itemLabel = getItemLabel(item);
          const isSelected = itemVal === value;
          return (
            <div
              key={idx}
              onClick={() => handleItemClick(item, idx)}
              style={{ height: `${itemHeight}px` }}
              className={`snap-center flex items-center ${
                textAlign === 'right' || textAlign === 'end'
                  ? 'justify-end'
                  : textAlign === 'left' || textAlign === 'start'
                  ? 'justify-start'
                  : 'justify-center'
              } px-1.5 cursor-pointer transition-colors tabular-nums ${
                isSelected
                  ? `text-slate-900 ${fontSize} font-bold tracking-tight`
                  : `text-slate-400 hover:text-slate-600 ${subFontSize} font-medium`
              }`}
            >
              <span>{itemLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
