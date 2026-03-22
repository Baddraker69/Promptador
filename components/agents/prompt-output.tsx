"use client";

import { useState } from "react";
import { Check, Copy, Download, BookmarkPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { copyToClipboard, downloadAsMarkdown, downloadAsJSON } from "@/lib/utils";
import type { PromptType, AgentType } from "@/types";

interface PromptOutputProps {
  title: string;
  content: string;
  type: PromptType;
  agentType: AgentType;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
  onSave?: () => void;
  isSaving?: boolean;
  savedId?: string;
}

export function PromptOutput({
  title,
  content,
  type,
  agentType,
  modelUsed,
  metadata,
  onSave,
  isSaving,
  savedId,
}: PromptOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMD = () => downloadAsMarkdown(title, content);
  const handleDownloadJSON = () =>
    downloadAsJSON(title, { title, content, type, agentType, modelUsed, metadata });

  const shareUrl = savedId
    ? `${window.location.origin}/p/${savedId}`
    : null;

  const handleShare = async () => {
    if (shareUrl) {
      await copyToClipboard(shareUrl);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-card/60">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <Badge variant="outline" className="capitalize text-xs">{type}</Badge>
          {modelUsed && (
            <Badge variant="secondary" className="text-xs">{modelUsed.split(":")[1] || modelUsed}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownloadMD}
            title="Download as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownloadJSON}
            title="Download as JSON"
          >
            <span className="text-xs font-mono font-bold">J</span>
          </Button>
          {savedId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleShare}
              title="Copy share link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs ml-1"
              onClick={onSave}
              disabled={isSaving}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              {isSaving ? "Saving…" : "Save"}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-h-[600px] overflow-y-auto">
        <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
          {content}
        </pre>
      </div>
    </div>
  );
}
