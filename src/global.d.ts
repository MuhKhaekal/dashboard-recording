// src/global.d.ts
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      marquee: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        scrollamount?: string;
        direction?: string;
      };
    }
  }
}