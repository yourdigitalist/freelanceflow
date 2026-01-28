import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COUNTRY_CODES } from './countryCodes';

export default function PhoneInput({ 
  value = '', 
  countryCode = '+1', 
  onChange, 
  label,
  required = false 
}) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find(c => c.dial_code === countryCode) || COUNTRY_CODES[0]
  );

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);
    onChange(value, country.dial_code);
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/[^\d\s()-]/g, '');
    onChange(input, selectedCountry.dial_code);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between"
            >
              <span className="flex items-center gap-2 overflow-hidden">
                <span className="text-lg">{selectedCountry.emoji}</span>
                <span className="text-sm">{selectedCountry.dial_code}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRY_CODES.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dial_code}`}
                      onSelect={() => handleCountrySelect(country)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{country.emoji}</span>
                        <span className="text-sm">{country.name}</span>
                      </div>
                      <span className="text-sm text-slate-500">{country.dial_code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder="(123) 456-7890"
          className="flex-1"
          required={required}
        />
      </div>
    </div>
  );
}