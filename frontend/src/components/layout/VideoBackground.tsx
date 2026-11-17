"use client";
import React, { useState, useEffect, useRef } from 'react';

const videos = [
  "/Video/Ab_suno_ye_kuch_image_hai_in_s.mp4",
  "/Video/Generated Video July 04, 2026 - 3_43PM.mp4",
  "/Video/Generated Video July 04, 2026 - 3_51PM.mp4",
  "/Video/inko_add_karke_banavo_kuch_ach.mp4"
];

export default function VideoBackground() {
  const [sources, setSources] = useState<{ slot0: number; slot1: number }>({
    slot0: 0,
    slot1: 1,
  });
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  const video0Ref = useRef<HTMLVideoElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const isTransitioning = useRef(false);
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const activeSlotRef = useRef(activeSlot);
  activeSlotRef.current = activeSlot;

  // Start initial playback on mount
  useEffect(() => {
    if (video0Ref.current) {
      video0Ref.current.play().catch((e) => console.log("Auto-play prevented on slot 0", e));
    }
  }, []);

  const triggerTransition = (fromSlot: 0 | 1) => {
    if (isTransitioning.current) return;
    if (activeSlotRef.current !== fromSlot) return;

    isTransitioning.current = true;
    const toSlot = fromSlot === 0 ? 1 : 0;
    const targetVideo = toSlot === 0 ? video0Ref.current : video1Ref.current;
    const currentVideo = fromSlot === 0 ? video0Ref.current : video1Ref.current;

    if (targetVideo) {
      targetVideo.currentTime = 0;
      targetVideo.play().catch((e) => console.log("Auto-play prevented on target slot", e));
    }

    // Switch active slot to trigger smooth CSS opacity crossfade
    setActiveSlot(toSlot);

    // After crossfade finishes (1000ms), pause old video and prepare the subsequent video in background
    setTimeout(() => {
      if (currentVideo) {
        currentVideo.pause();
      }

      // Calculate next video source index for the inactive slot
      const playingSourceIndex = toSlot === 0 ? sourcesRef.current.slot0 : sourcesRef.current.slot1;
      const nextSourceIndex = (playingSourceIndex + 1) % videos.length;

      setSources((prev) => ({
        ...prev,
        [fromSlot === 0 ? 'slot0' : 'slot1']: nextSourceIndex,
      }));

      isTransitioning.current = false;
    }, 1000);
  };

  const handleTimeUpdate = (slot: 0 | 1) => {
    if (activeSlotRef.current !== slot || isTransitioning.current) return;
    const video = slot === 0 ? video0Ref.current : video1Ref.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    // Crossfade 0.8s before video ends so the end black frame/freeze never appears
    if (video.duration > 1.2 && video.currentTime >= video.duration - 0.8) {
      triggerTransition(slot);
    }
  };

  const handleEnded = (slot: 0 | 1) => {
    if (activeSlotRef.current === slot && !isTransitioning.current) {
      triggerTransition(slot);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-slate-900/50 z-10" />

      {/* Slot 0 Video */}
      <video
        ref={video0Ref}
        src={videos[sources.slot0]}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 0 ? 'opacity-80 z-[2]' : 'opacity-0 z-[1]'
        }`}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={() => handleTimeUpdate(0)}
        onEnded={() => handleEnded(0)}
      />

      {/* Slot 1 Video */}
      <video
        ref={video1Ref}
        src={videos[sources.slot1]}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 1 ? 'opacity-80 z-[2]' : 'opacity-0 z-[1]'
        }`}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={() => handleTimeUpdate(1)}
        onEnded={() => handleEnded(1)}
      />
    </div>
  );
}
