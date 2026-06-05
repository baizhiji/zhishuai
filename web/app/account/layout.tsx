import Navbar from '../customer/layout/Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Navbar>{children}</Navbar>;
}
