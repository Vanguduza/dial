import { notFound } from "next/navigation";
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
  return <ChecklistRunner checklist={list} />;
}
