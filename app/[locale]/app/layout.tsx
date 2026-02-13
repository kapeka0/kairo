import { PortfolioSlugObserver } from "./_components/PortfolioSlugObserver";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortfolioSlugObserver />
      {children}
    </>
  );
}
