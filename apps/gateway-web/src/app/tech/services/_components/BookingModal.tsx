"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    Clock,
    CheckCircle2,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    RecommendedSpecialists,
    type SpecialistCardView,
    type SpecialistHintView,
} from "../../_components/RecommendedSpecialists";

interface BookingSlot {
    id: string;
    date: string;
    startsAt: string;
    endsAt: string;
    note?: string;
    isAvailable: boolean;
}

interface BookingModalProps {
    serviceId: string;
    slots: BookingSlot[];
    jobClass: string;
    emergency?: boolean;
    draftAmountUsdMinor?: string;
}

function formatUsdMinor(minor: string | number) {
    return (Number(minor) / 100).toFixed(2);
}

export default function BookingModal({
    serviceId,
    slots,
    jobClass,
    emergency = false,
    draftAmountUsdMinor,
}: BookingModalProps) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [hint, setHint] = useState<SpecialistHintView | null>(null);
    const [recommended, setRecommended] = useState<SpecialistCardView[]>([]);
    const [fallback, setFallback] = useState<SpecialistCardView[]>([]);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
    const [quoteMinor, setQuoteMinor] = useState<string | null>(draftAmountUsdMinor ?? null);
    const [quoteSource, setQuoteSource] = useState<string>("rate_card");

    useEffect(() => {
        if (!open || !selectedSlot) return;
        let cancelled = false;
        void (async () => {
            try {
                const params = new URLSearchParams({
                    view: "quote",
                    jobClass,
                    emergency: emergency ? "true" : "false",
                });
                const res = await fetch(`/api/tech/services?${params.toString()}`);
                if (!res.ok) return;
                const json = (await res.json()) as {
                    quote?: {
                        draftAmountUsdMinor?: string;
                        source?: string;
                        payableFromAi?: boolean;
                    };
                };
                if (cancelled) return;
                if (json.quote?.payableFromAi) return;
                if (json.quote?.draftAmountUsdMinor) {
                    setQuoteMinor(json.quote.draftAmountUsdMinor);
                    setQuoteSource(json.quote.source ?? "rate_card");
                }
            } catch {
                /* catalogue prop remains the draft */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, selectedSlot, jobClass, emergency]);

    const handleContinue = async () => {
        if (!selectedSlot) return;
        setBusy(true);
        try {
            const res = await fetch("/api/tech/services", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    action: emergency ? "emergency_book" : "book",
                    jobClass,
                    slotId: selectedSlot,
                    emergency,
                    note,
                    serviceId,
                    ...(selectedTechnicianId
                        ? { technicianId: selectedTechnicianId }
                        : {}),
                }),
            });
            const json = (await res.json()) as {
                error?: string;
                job?: { id: string };
            };
            if (res.status === 401) {
                toast.error("Sign in to book");
                router.push(`/?next=/tech/services/${serviceId}`);
                return;
            }
            if (!res.ok) {
                toast.error(json.error ?? "Booking failed");
                return;
            }
            toast.success("Booking created");
            router.push(json.job?.id ? `/tech/jobs/${json.job.id}` : "/tech/jobs");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Booking failed");
        } finally {
            setBusy(false);
        }
    };

    const matchSpecialists = async (text: string) => {
        const trimmed = text.trim();
        if (trimmed.length < 8) {
            setHint(null);
            setRecommended([]);
            setFallback([]);
            setSelectedTechnicianId(null);
            return;
        }
        try {
            const res = await fetch("/api/tech/services", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    action: "diagnose",
                    note: trimmed,
                }),
            });
            if (res.status === 401 || !res.ok) return;
            const json = (await res.json()) as {
                assessment?: { specialistHint?: SpecialistHintView };
                recommendedSpecialists?: SpecialistCardView[];
                fallbackTechnicians?: SpecialistCardView[];
            };
            setHint(json.assessment?.specialistHint ?? null);
            setRecommended(json.recommendedSpecialists ?? []);
            setFallback(json.fallbackTechnicians ?? []);
        } catch {
            /* routing is optional on the modal */
        }
    };

    const draftLabel = quoteMinor
        ? `USD ${formatUsdMinor(quoteMinor)}`
        : "Rate-card draft";

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);

                if (!value) {
                    setSelectedSlot(null);
                    setNote("");
                    setHint(null);
                    setRecommended([]);
                    setFallback([]);
                    setSelectedTechnicianId(null);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                    Book This Service
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Select a Booking Slot</DialogTitle>

                    <DialogDescription>
                        Choose one available slot. The amount shown next is a rate-card draft — not an AI price.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
                    {slots.length > 0 ? (
                        slots.map((slot) => {
                            const isSelected = selectedSlot === slot.id;

                            return (
                                <button
                                    key={slot.id}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot.id)}
                                    className={`w-full rounded-xl border p-4 text-left transition-all duration-200
                    ${isSelected
                                            ? "border-green-600 bg-green-50 ring-2 ring-green-500 dark:border-green-500 dark:bg-green-950/30"
                                            : "border-border hover:border-green-500 hover:bg-muted/50"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(slot.date).toLocaleDateString()}
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />

                                                {new Date(slot.startsAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}

                                                -

                                                {new Date(slot.endsAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>

                                            {slot.note && (
                                                <p className="text-sm text-muted-foreground">
                                                    {slot.note}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {isSelected && (
                                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                            )}

                                            <Badge
                                                className={
                                                    isSelected
                                                        ? "bg-green-600 text-white hover:bg-green-600"
                                                        : "bg-green-100 text-green-700 hover:bg-green-100"
                                                }
                                            >
                                                Available
                                            </Badge>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="rounded-lg border border-dashed py-12 text-center">
                            <p className="text-muted-foreground">
                                No available slots found.
                            </p>
                        </div>
                    )}
                </div>

                <form className="mt-4">
                    <label
                        htmlFor="note"
                        className="mb-2 block text-sm font-medium"
                    >
                        Booking Note
                    </label>

                    <textarea
                        id="note"
                        name="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onBlur={() => void matchSpecialists(note)}
                        placeholder="Tell the technician about your challenge in detail..."
                        rows={4}
                        maxLength={500}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
                    />

                    <div className="mt-1 flex justify-end text-xs text-muted-foreground">
                        {note.length}/500
                    </div>
                </form>

                {hint ? (
                    <RecommendedSpecialists
                        hint={hint}
                        recommended={recommended}
                        fallback={fallback}
                        selectedTechnicianId={selectedTechnicianId}
                        onSelectTechnician={setSelectedTechnicianId}
                    />
                ) : null}

                {selectedSlot ? (
                    <div
                        className="rounded-xl border border-primary/30 bg-primary/5 p-4"
                        data-testid="booking-rate-card-draft"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium">Rate-card draft</p>
                                <p className="text-2xl font-bold text-primary">{draftLabel}</p>
                                <p className="text-xs text-muted-foreground">
                                    Draft — confirmed on site. Source {quoteSource}. Payable amounts never come from AI.
                                </p>
                            </div>
                            <Badge variant="secondary">draft</Badge>
                        </div>
                    </div>
                ) : null}

                <Button
                    className="w-full"
                    disabled={!selectedSlot || busy}
                    data-testid="booking-confirm-draft"
                    onClick={() => void handleContinue()}
                >
                    {busy
                        ? "Booking…"
                        : selectedSlot
                            ? "Confirm draft booking"
                            : "Select a Slot"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
