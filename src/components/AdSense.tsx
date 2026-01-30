'use client'; // Required if using App Router

import { useEffect } from 'react';

type AdSenseProps = {
  slot: string; // You get this ID from your AdSense dashboard when creating a new ad unit
  style?: React.CSSProperties;
  format?: string;
};

const AdSense = ({ slot, style, format = 'auto' }: AdSenseProps) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div style={{ minHeight: '100px', width: '100%', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6675484914269982"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSense;

