import { auth } from "@/lib/auth";
import { getUserPortfoliosById } from "@/lib/db/data/portfolio";
import { headers } from "next/headers";
// eslint-disable-next-line
import { redirect } from "next/navigation";

type Props = {};

const AppPage = async (props: Props) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // We must have a session since middleware will redirect if there isn't one
  const userPortfolios = await getUserPortfoliosById(session?.user.id!);

  if (!userPortfolios || userPortfolios.length === 0) {
    // No portfolios, redirect to the create page
    redirect("/app/create");
  }

  const firstPortfolioId = userPortfolios[0].id;

  redirect(`/app/${firstPortfolioId}`);
};

export default AppPage;
