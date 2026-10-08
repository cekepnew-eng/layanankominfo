import React, { useState } from 'react';

export const TruncatedText = ({ text, className }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const words = text.split(' ');
  const isLong = words.length > 20;
  
  const displayText = isLong && !expanded ? words.slice(0, 20).join(' ') + '...' : text;

  return (
    <div className={className}>
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
