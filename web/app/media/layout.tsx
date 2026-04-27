import Navbar from '@/components/layout/Navbar'

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
