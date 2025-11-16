import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, rows = 5, id }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = 
      value.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      value.substring(end);
    
    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length, 
        end + before.length
      );
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-muted rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('**', '**')}
          title="Bold"
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('*', '*')}
          title="Italic"
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('\n- ', '')}
          title="Lista"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertFormatting('\n1. ', '')}
          title="Numerisana lista"
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          Markdown format
        </div>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Koristite ** za <strong>bold</strong>, * za <em>italic</em>, - za liste
      </p>
    </div>
  );
};
