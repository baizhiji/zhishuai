'use client';

import React from 'react';
import Navbar from './layout/Navbar';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Navbar>{children}</Navbar>;
}
