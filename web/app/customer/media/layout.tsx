'use client'

import { App } from 'antd'
import Navbar from '../../components/layout/Navbar'
import '../../styles/globals.css'

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
