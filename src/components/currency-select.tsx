'use client';

import * as React from 'react';
import { useCurrency, SUPPORTED_CURRENCIES, type CurrencyCode } from '@/context/currency-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Coins } from 'lucide-react';

export function CurrencySelect() {
  const { currency, currencyCode, setCurrencyCode } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8.5 px-2.5 rounded-xl border-border/40 bg-card/40 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-smooth hover:bg-muted/50 hover:scale-105"
        >
          <span className="text-sm">{currency.flag}</span>
          <span className="font-mono text-foreground font-bold">{currency.symbol} {currency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border/40 w-44">
        {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => {
          const item = SUPPORTED_CURRENCIES[code];
          const isSelected = currencyCode === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setCurrencyCode(code)}
              className="flex items-center justify-between cursor-pointer text-xs py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.flag}</span>
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">({item.symbol})</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
