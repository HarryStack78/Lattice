import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Called by Lattice_CMS right after a successful save/restore, so edits show up immediately
// instead of waiting out the page's 60s ISR window (see `revalidate` in app/page.tsx). Requires
// a shared secret so this can't be triggered by anyone else.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret" }, { status: 401 });
  }

  revalidatePath("/");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
