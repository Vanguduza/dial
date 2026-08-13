import Link from "next/link";
import { notFound } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { getChecklist, type ChecklistId } from "../../../../lib/tech/stubs";

export default async function TechChecklistPage({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;
  const list = getChecklist(checklistId as ChecklistId);
  if (!list) notFound();
  return (
    <main
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/tech">Back</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
          }}
        >
          {list.title}
        </h1>
        <ol style={{ lineHeight: 1.7 }}>
          {list.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </main>
  );
}
