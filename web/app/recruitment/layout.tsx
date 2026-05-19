import Navbar from '../customer/layout/Navbar'

export default function RecruitmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Navbar>{children}</Navbar>
}
