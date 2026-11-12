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
  const lockedUntilRef = useRef(0);
  const unlockTimerRef = useRef(null);
  const latestRef = useRef({ items, value, onChange, itemHeight });
  latestRef.current = { items, value, onChange, itemHeight };

  const getItemValue = (item) => (item !== null && typeof item === 'object' && 'value' in item ? item.value : item);
  const getItemLabel = (item) => (item !== null && typeof item === 'object' && 'label' in item ? item.label : item);

  const syncValueFromScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { items: curItems, value: curValue, onChange: curOnChange, itemHeight: curHeight } = latestRef.current;
    const idx = Math.round(el.scrollTop / curHeight);
    if (idx >= 0 && idx < curItems.length) {
      const nextVal = getItemValue(curItems[idx]);
      if (nextVal !== curValue) {
        curOnChange(nextVal);
      }
    }
  };

  const lockScrollSync = (ms) => {
    lockedUntilRef.current = Date.now() + ms;
    clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(syncValueFromScroll, ms + 10);
  };

  useEffect(() => () => clearTimeout(unlockTimerRef.current), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = items.findIndex((it) => getItemValue(it) === value);
    if (idx !== -1 && Math.round(el.scrollTop / itemHeight) !== idx) {
      lockScrollSync(150);
      el.scrollTop = idx * itemHeight;
    }
  }, [value, items, itemHeight]);

  const handleScroll = () => {
    if (Date.now() < lockedUntilRef.current) return;
    syncValueFromScroll();
  };

  const handleItemClick = (item) => {
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
        className="h-full overflow-y-scroll snap-y snap-mandatory"
      >
        {items.map((item, idx) => {
          const itemVal = getItemValue(item);
          const itemLabel = getItemLabel(item);
          const isSelected = itemVal === value;
          return (
            <div
              key={idx}
              onClick={() => handleItemClick(item)}
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
