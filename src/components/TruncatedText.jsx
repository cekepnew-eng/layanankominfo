import React, { useState } from 'react';

export const TruncatedText = ({ text, className, maxWords = 15 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  const isLong = words.length >= maxWords;
  
  const displayText = isLong && !expanded ? words.slice(0, maxWords).join(' ') + '...' : text;

  return (
    <div className={`break-words break-all ${className || ''}`}>
      {displayText}
      {isLong && (
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }} 
          className="text-sky-600 hover:text-sky-800 text-xs font-bold ml-2 cursor-pointer inline-block bg-transparent border-none p-0 focus:outline-none"
        >
          {expanded ? 'Sembunyikan' : 'Baca Selengkapnya'}
        </button>
      )}
    </div>
  );
};
