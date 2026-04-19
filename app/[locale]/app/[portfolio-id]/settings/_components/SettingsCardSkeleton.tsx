import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsCardSkeletonProps {
  variant?: "default" | "destructive";
}

export default function SettingsCardSkeleton({
  variant = "default",
}: SettingsCardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="mt-2 h-4 w-64" />
        </CardDescription>
      </CardHeader>
      <CardContent
        className={
          variant === "destructive"
            ? "flex justify-end"
            : "flex justify-start items-center gap-1"
        }
      >
        {variant === "destructive" ? (
          <Skeleton className="h-9 w-36" />
        ) : (
          <>
            <Skeleton className="h-9 w-full max-w-xs" />
            <Skeleton className="h-9 w-16" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
