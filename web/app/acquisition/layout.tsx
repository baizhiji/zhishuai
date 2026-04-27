import Navbar from '@/components/layout/Navbar'

export default function AcquisitionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
