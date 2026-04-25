import Navbar from '@/components/layout/Navbar'

export default function ECommerceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
