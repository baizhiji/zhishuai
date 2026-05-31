import Navbar from '@/components/layout/Navbar'

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
