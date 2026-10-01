import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot spam trap: bots usually fill hidden inputs
    if (body.website_url_hp || body.company_fax_hp) {
      // Fake success to mislead automated spambots
      return NextResponse.json({ success: true });
    }

    const name = String(body.name || "").trim().slice(0, 100);
    const businessName = String(body.businessName || body.company || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const requestedServices = Array.isArray(body.requestedServices)
      ? body.requestedServices.map((s: unknown) => String(s).trim().slice(0, 50)).filter(Boolean)
      : [];
    const budget = String(body.budget || "").trim().slice(0, 50);
    const description = String(body.description || "").trim().slice(0, 2000);

    if (!name) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("project_enquiries").insert({
      name,
      business_name: businessName,
      email,
      phone,
      requested_services: requestedServices,
      budget,
      description,
      status: "new",
    });

    if (error) {
      console.error("Enquiry submission error:", error);
      return NextResponse.json({ error: "Could not submit your enquiry. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Thank you. We have received your inquiry and will be in touch soon." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
