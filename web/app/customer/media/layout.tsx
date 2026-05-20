'use client'

import { App } from 'antd'
import Navbar from '../../../components/layout/Navbar'

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <App>
      <div className="app-container">
        <Navbar />
        <main className="main-content">{children}</main>
      </div>
    </App>
  )
}
