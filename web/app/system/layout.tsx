import Navbar from '@/components/layout/Navbar'

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
