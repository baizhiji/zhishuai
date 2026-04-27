import Navbar from '@/components/layout/Navbar'

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
