import { notFound } from "next/navigation";
import { dialTokens } from "@dial/design-tokens";
import { getChecklist, type ChecklistId } from "../../../../lib/tech/stubs";
import { ChecklistRunner } from "./ChecklistRunner";

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
      <ChecklistRunner checklist={list} />
    </main>
  );
}
