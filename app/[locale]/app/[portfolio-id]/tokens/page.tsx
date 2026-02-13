export default function TokensPage({
  params,
}: {
  params: Promise<{ "portfolio-id": string; locale: string }>;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl" />
    </div>
  );
}
