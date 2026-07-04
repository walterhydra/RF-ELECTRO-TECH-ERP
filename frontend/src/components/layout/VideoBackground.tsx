"use client";
import React, { useState, useEffect, useRef } from 'react';

const videos = [
  "/Video/Ab_suno_ye_kuch_image_hai_in_s.mp4",
  "/Video/Generated Video July 04, 2026 - 3_43PM.mp4",
  "/Video/Generated Video July 04, 2026 - 3_51PM.mp4",
  "/Video/inko_add_karke_banavo_kuch_ach.mp4"
];

export default function VideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
    }
  }, [currentIndex]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-slate-900/60 z-10" /> 
      
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        muted
        playsInline
        autoPlay
        onEnded={handleEnded}
      >
        <source src={videos[currentIndex]} type="video/mp4" />
      </video>
    </div>
  );
}
