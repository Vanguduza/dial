/**
 * PD13 customer job detail — object AuthZ via session customerId (D-47).
 */
import Link from "next/link";
import { TechJobDetail } from "./TechJobDetail";

export default async function TechJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-10">
          <p className="text-sm text-muted-foreground">
            <Link href="/tech/jobs" className="hover:text-primary">
              Back to jobs
            </Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Job status</h1>
        </div>
      </section>
      <section className="container mx-auto max-w-2xl px-4 py-10">
        <TechJobDetail jobId={jobId} />
      </section>
    </main>
  );
}
