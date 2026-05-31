import Navbar from '@/components/layout/Navbar'

export default function MyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
