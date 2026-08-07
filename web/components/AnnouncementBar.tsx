'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  target: string;
  publishedAt: string;
}

const ANIMATION_DURATION = 25; // 秒，走完一遍的时间

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dupText, setDupText] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    try {
      const request = (await import('@/lib/request')).default;
      const res = (await request.get<{ success: boolean; data: Announcement[] }>(
        '/api/announcements?audience=all&limit=5'
      )) as unknown as { success: boolean; data: Announcement[] };
      if (res.success && Array.isArray(res.data)) {
        setAnnouncements(res.data);
      } else {
        setAnnouncements([]);
      }
    } catch {
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (announcements.length === 0) {
      setDupText('');
      return;
    }
    const single = announcements
      .map((a) => {
        const prefix = a.type === 'important' ? '【重要】' : a.type === 'warning' ? '【警告】' : '';
        return `${prefix}${a.title}`;
      })
      .join('  ·  ');
    // 复制一份用于无缝滚动
    setDupText(`${single}  ·  ${single}`);
  }, [announcements]);

  if (announcements.length === 0) return null;

  const animStyle = `@keyframes scroll-announcements { from { transform: translateX(0); } to { transform: translateX(-50%); } }`;

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        marginRight: 24,
        maskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
      }}
    >
      <style>{animStyle}</style>
      <div
        style={{
          display: 'inline-block',
          animation: `scroll-announcements ${ANIMATION_DURATION * announcements.length}s linear infinite`,
          color: '#1677ff',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '56px',
          height: 56,
        }}
      >
        {dupText}
      </div>
    </div>
  );
}
