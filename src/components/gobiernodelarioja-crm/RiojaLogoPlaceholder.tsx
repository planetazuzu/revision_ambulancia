"use client";

import React from 'react';

// Un placeholder muy simple para el logo del Gobierno de La Rioja
// Tres picos, arco y corriente de río.
const RiojaLogoPlaceholder = ({ className, width = 24, height = 24 }: { className?: string, width?: number, height?: number }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logotipo Gobierno de La Rioja"
    >
      {/* Tres picos */}
      <path d="M10 70 L30 40 L50 70 L70 40 L90 70 H10 Z" fill="hsl(var(--primary-rioja))" />
      {/* Arco (puente) */}
      <path d="M20 70 Q 50 50 80 70" stroke="hsl(var(--primary-rioja))" strokeWidth="5" fill="none" />
      {/* Corriente de río */}
      <path d="M10 85 Q 30 80 50 85 T 90 85" stroke="hsl(var(--primary-rioja))" strokeWidth="4" fill="none" />
      <path d="M15 95 Q 35 90 55 95 T 95 95" stroke="hsl(var(--primary-rioja))" strokeWidth="3" fill="none" />
    </svg>
  );
};

export default RiojaLogoPlaceholder;
