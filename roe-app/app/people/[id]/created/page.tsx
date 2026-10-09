"use client";
// P05 Created — confirmation means saved, not relationship built.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell, Card, PrimaryButton, SecondaryButton } from "@/components/ui";

export default function Created({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    params.then((p) => setId(p.id));
    setNote(sessionStorage.getItem("roe.createdNote") ?? "");
  }, [params]);

  return (
    <Shell title="Person created">
      <Card>
        <p className="font-display text-[18px] font-semibold">
          ✓ Record saved
        </p>
        <p className="mt-1 text-[14px] text-[#667370]">
          Saving is not belonging. Assign a follow-up so they are not forgotten.
        </p>
        {note && (
          <p className="mt-2 rounded-lg bg-[#FEF3C7] p-2 text-[13px]">
            {note}
          </p>
        )}
      </Card>
      <div className="mt-3 flex flex-col gap-2">
        <PrimaryButton href={`/people/${id}/assign`}>
          Assign follow-up
        </PrimaryButton>
        <SecondaryButton href={`/people/${id}`}>
          View profile
        </SecondaryButton>
        <Link
          href="/people"
          className="text-center text-[13px] text-[#667370]"
        >
          Back to People
        </Link>
      </div>
    </Shell>
  );
}
