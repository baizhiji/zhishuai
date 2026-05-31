import Navbar from '@/components/layout/Navbar'

export default function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
