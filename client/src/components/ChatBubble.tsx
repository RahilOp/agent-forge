import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  sender: "ai" | "human";
  text: string;
  documents?: any[];
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ sender, text, documents }) => {
  const markdownComponents = {
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    ),
    p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc ml-5 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal ml-5 mb-2 space-y-1">{children}</ol>,
    code: ({ children, className }: any) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <pre className="bg-neutral text-neutral-content rounded-lg p-3 my-2 overflow-x-auto text-sm">
            <code>{children}</code>
          </pre>
        );
      }
      return (
        <code className="bg-base-300 text-sm px-1.5 py-0.5 rounded font-mono">{children}</code>
      );
    },
  };

  if (sender === "human") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-primary text-primary-content px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {Array.isArray(documents) && documents.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {documents.slice(0, 3).map((doc: any, i: number) => (
              <a
                key={i}
                href={doc.url || doc.href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[180px] max-w-[220px] border border-base-300 rounded-xl p-3 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                  {doc.name || doc.title || "Source"}
                </p>
                {doc.snippet && (
                  <p className="text-xs text-base-content/50 mt-1 line-clamp-2">{doc.snippet}</p>
                )}
              </a>
            ))}
          </div>
        )}
        <div className="text-sm text-base-content/90 prose-sm">
          <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator: React.FC = () => (
  <div className="flex gap-3 max-w-[85%]">
    <div className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="typing-dot w-2 h-2 rounded-full bg-base-content/30" />
      <span className="typing-dot w-2 h-2 rounded-full bg-base-content/30" />
      <span className="typing-dot w-2 h-2 rounded-full bg-base-content/30" />
    </div>
  </div>
);

export default ChatBubble;
