import Navbar from '@/components/layout/Navbar'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
