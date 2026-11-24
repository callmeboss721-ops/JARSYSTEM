import { Link } from "wouter";
import { ArrowRight, BookOpenText, Check, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const examples = [
  { icon: MessageCircle, title: "Talk it through", body: "Untangle a thought in a private, ongoing conversation." },
  { icon: BookOpenText, title: "Find the signal", body: "Turn a long note into a clear, human summary." },
  { icon: Check, title: "Leave with a next step", body: "Shape a list of small actions you can actually take." },
];

export default function Welcome() {
  const { theme, toggleTheme } = useTheme();
  return (
    <main className="welcome-page min-h-screen bg-background text-foreground">
      <header className="welcome-nav mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="brand-lockup" aria-label="Stillnote home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>stillnote</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} data-testid="button-theme-toggle">
            <span className="theme-glyph" aria-hidden="true">{theme === "light" ? "◐" : "◑"}</span>
          </Button>
          <Link href="/sign-in" className="welcome-signin" data-testid="link-sign-in">Sign in</Link>
          <Button asChild size="sm" data-testid="button-get-started">
            <Link href="/sign-up">Get started <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </nav>
      </header>

      <section className="welcome-hero mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 md:grid-cols-[1fr_0.9fr] md:pb-28 md:pt-20">
        <div className="max-w-2xl">
          <p className="eyebrow"><span className="eyebrow-dot" /> YOUR THOUGHTS, IN GOOD COMPANY</p>
          <h1 className="welcome-title">A little more room to <em>think.</em></h1>
          <p className="welcome-intro">
            A quiet notebook for the things on your mind. Talk them through, find the meaning, and carry the next step with you.
          </p>
          <p className="welcome-thai" lang="th">พื้นที่เล็ก ๆ สำหรับความคิดของคุณ</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="welcome-cta" data-testid="button-create-account">
              <Link href="/sign-up">Make space for your thoughts <ArrowRight aria-hidden="true" /></Link>
            </Button>
            <Link href="/sign-in" className="text-sm text-muted-foreground underline-offset-4 hover:underline" data-testid="link-returning-user">I already have an account</Link>
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <span className="privacy-dot mt-2 shrink-0" aria-hidden="true" />
            <span>Saved history is separated by account. Prompts are sent to Google Gemini to generate replies.</span>
          </p>
        </div>

        <div className="note-preview" aria-label="Example of a note becoming a helpful response">
          <div className="note-preview__header">
            <div className="note-avatar">S</div>
            <div><p className="text-sm font-medium">A thought, held gently</p><p className="text-xs text-muted-foreground">Today, just now</p></div>
            <span className="note-preview__private">PRIVATE</span>
          </div>
          <div className="note-preview__user" lang="th">
            ช่วงนี้มีหลายอย่างที่อยากทำ แต่ไม่รู้จะเริ่มตรงไหนก่อน
          </div>
          <div className="note-preview__response">
            <div className="response-heading"><span className="response-spark"><Sparkles aria-hidden="true" /></span><span>A gentle place to begin</span></div>
            <p>You don’t have to solve everything today. Let’s make it smaller.</p>
            <ul>
              <li><span>01</span> Write down what feels most important</li>
              <li><span>02</span> Choose one thing for this week</li>
              <li><span>03</span> Give yourself permission to pause</li>
            </ul>
            <div className="preview-footnote">Chat · Thoughtful next steps</div>
          </div>
          <div className="preview-orbit preview-orbit--one" />
          <div className="preview-orbit preview-orbit--two" />
        </div>
      </section>

      <section className="welcome-features mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="feature-intro">
          <p className="eyebrow">A NOTEBOOK THAT MEETS YOU WHERE YOU ARE</p>
          <h2>From a passing thought<br className="hidden sm:block" /> to a clearer next step.</h2>
        </div>
        <div className="feature-grid">
          {examples.map(({ icon: Icon, title, body }, index) => (
            <article className="feature-item" key={title} data-testid={`card-feature-${index}`}>
              <span className="feature-icon"><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="welcome-bottom">
          <div><p className="eyebrow">THAI & ENGLISH, BOTH AT HOME</p><p>Think, write, and ask in whichever language feels like yours.</p><p className="mt-2 text-xs text-muted-foreground" lang="th">ประวัติแยกตามบัญชี และส่งข้อความให้ Google Gemini เพื่อสร้างคำตอบ</p></div>
          <Button asChild variant="outline" data-testid="button-start-writing">
            <Link href="/sign-up">Start with a thought <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>
      <footer className="welcome-footer mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-xs text-muted-foreground sm:px-8">
        <span>stillnote <span className="footer-divider">/</span> A little room to think.</span>
        <Link href="/sign-in" className="hover:text-foreground" data-testid="link-footer-sign-in">Your private notebook</Link>
      </footer>
    </main>
  );
}
