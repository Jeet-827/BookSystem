import React from 'react';

/**
 * MoonLoader - Smooth orbiting moon crescent spinner
 * @param {number} size - Outer diameter in px (default: 48)
 * @param {string} color - Primary ring and moon color (default: '#000000')
 * @param {string} text - Optional label below spinner
 */
const MoonLoader = ({ size = 48, color = '#000000', text = '' }) => {
  const moonSize = size / 7;
  const ringWidth = Math.max(2, size / 16);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 animate-fadeIn">
      <div
        className="relative flex items-center justify-center animate-spin"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: '0.85s',
          animationTimingFunction: 'cubic-bezier(0.6, 0, 0.4, 1)',
        }}
      >
        {/* Outer Ring with subtle opacity */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `${ringWidth}px solid ${color}`,
            opacity: 0.15,
          }}
        />

        {/* Orbiting Moon Satellite */}
        <div
          className="absolute rounded-full shadow-sm"
          style={{
            width: `${moonSize}px`,
            height: `${moonSize}px`,
            backgroundColor: color,
            top: `-${moonSize / 2}px`,
            left: `calc(50% - ${moonSize / 2}px)`,
          }}
        />

        {/* Crescent Track Arc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `${ringWidth}px solid transparent`,
            borderTopColor: color,
          }}
        />
      </div>

      {text && (
        <p className="text-xs font-bold text-gray-500 tracking-wide font-sans">
          {text}
        </p>
      )}
    </div>
  );
};

export default MoonLoader;
