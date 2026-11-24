import { Link } from "wouter";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-background px-5 py-12 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center" data-testid="page-not-found">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-border text-muted-foreground"><CircleHelp aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">This page is not here.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your notes are safe. Let’s get you back to your space.</p>
        <Button asChild className="mt-6" data-testid="button-not-found-home">
          <Link href="/"><ArrowLeft aria-hidden="true" /> Back to Stillnote</Link>
        </Button>
      </section>
    </main>
  );
}
