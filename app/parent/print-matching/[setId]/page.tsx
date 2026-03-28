import { Suspense } from "react";
import { PrintMatchingContent } from "./PrintMatchingContent";
import { prisma } from "@/lib/prisma";

// Generate static params from all existing vocab sets at build time
export async function generateStaticParams() {
  try {
    const sets = await prisma.vocabSet.findMany({
      select: { id: true },
    });
    // Return at least one entry to satisfy Cache Components requirement
    if (sets.length === 0) {
      return [{ setId: "placeholder" }];
    }
    return sets.map((set) => ({ setId: set.id }));
  } catch {
    // If database is not available at build time, return placeholder
    // Cache Components requires at least one result
    return [{ setId: "placeholder" }];
  }
}

export default function PrintMatchingPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-slate-600">Loading...</div>
        </div>
      }
    >
      <PrintMatchingContent params={params} />
    </Suspense>
  );
}
