import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getQueryClient } from "@/lib/query/getQueryClient";
import { getPortfolioTransactions } from "@/lib/server/transactions";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { headers } from "next/headers";

const PAGE_SIZE = 1000;

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ "portfolio-id": string }>;
}) {
  const { "portfolio-id": portfolioId } = await params;
  const queryClient = getQueryClient();

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    const ownsPortfolio = await existsPortfolioByIdAndUserId(
      portfolioId,
      session.user.id,
    );
    if (ownsPortfolio) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: ["transactions", portfolioId, PAGE_SIZE],
        queryFn: () => getPortfolioTransactions(portfolioId, 1, PAGE_SIZE),
        initialPageParam: 1,
      });
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen overflow-x-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="px-10 py-4 flex flex-col space-y-4">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </HydrationBoundary>
  );
}
