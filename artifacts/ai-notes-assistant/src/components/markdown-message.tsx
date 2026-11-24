import { isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import { Button } from "@workspace/jaguar-spk-design-system/components/ui/button";
import { useToast } from "@workspace/jaguar-spk-design-system/hooks/use-toast";

function CodeBlock({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const codeText = plainText(children);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      toast({ title: "Copied", description: "Code copied to clipboard." });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Could not copy", description: "Please select and copy the code manually." });
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span>Code</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={copy}
          aria-label="Copy code"
          data-testid="button-copy-code"
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return plainText(node.props.children);
  }
  return "";
}

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-content" data-testid="content-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" data-testid="link-markdown-reference">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
