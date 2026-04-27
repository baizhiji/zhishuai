import Navbar from '@/components/layout/Navbar'

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
