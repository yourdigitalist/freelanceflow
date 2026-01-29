import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { emojis } from './emojis';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function EmojiPicker({ value, onChange, color }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-16 h-16 p-0 text-2xl"
          style={{ backgroundColor: color }}
        >
          {value || '📁'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1 p-3 max-h-64 overflow-y-auto">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-2xl hover:bg-slate-100 rounded transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}