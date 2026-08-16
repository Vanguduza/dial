/**
 * PD13 customer job status list (Pack §9.3).
 */
import Link from "next/link";
import { TechJobsList } from "./TechJobsList";

export default function TechJobsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-2xl px-4 py-10">
          <p className="text-sm text-muted-foreground">
            <Link href="/tech" className="hover:text-primary">
              Home
            </Link>
            <span aria-hidden="true"> · </span>
            <Link href="/tech/services" className="hover:text-primary">
              Services
            </Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">My service jobs</h1>
        </div>
      </section>
      <section className="container mx-auto max-w-2xl px-4 py-10">
        <TechJobsList />
      </section>
    </main>
  );
}
