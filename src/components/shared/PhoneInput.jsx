import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', format: '(XXX) XXX-XXXX' },
  { code: '+44', country: 'UK', format: 'XXXX XXX XXXX' },
  { code: '+33', country: 'France', format: 'X XX XX XX XX' },
  { code: '+49', country: 'Germany', format: 'XXX XXXXXXXX' },
  { code: '+61', country: 'Australia', format: 'XXX XXX XXX' },
  { code: '+81', country: 'Japan', format: 'XX XXXX XXXX' },
  { code: '+86', country: 'China', format: 'XXX XXXX XXXX' },
  { code: '+91', country: 'India', format: 'XXXXX XXXXX' },
];

const formatPhoneNumber = (value, countryCode) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (countryCode === '+1') {
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  if (countryCode === '+44') {
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  }
  
  if (countryCode === '+33') {
    if (cleaned.length <= 1) return cleaned;
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      parts.push(cleaned.slice(i, i + 2));
    }
    return parts.join(' ');
  }
  
  return cleaned;
};

export default function PhoneInput({ label, phone, phoneCountryCode, onPhoneChange, onCountryCodeChange }) {
  const handlePhoneInput = (e) => {
    const formatted = formatPhoneNumber(e.target.value, phoneCountryCode || '+1');
    onPhoneChange(formatted);
  };

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 mt-2">
        <Select value={phoneCountryCode || '+1'} onValueChange={onCountryCodeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_CODES.map(({ code, country }) => (
              <SelectItem key={code} value={code}>
                {code} {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={phone || ''}
          onChange={handlePhoneInput}
          placeholder={COUNTRY_CODES.find(c => c.code === (phoneCountryCode || '+1'))?.format || 'Phone number'}
          className="flex-1"
        />
      </div>
    </div>
  );
}