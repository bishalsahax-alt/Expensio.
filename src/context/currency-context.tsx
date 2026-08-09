'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'EUR' | 'USD' | 'GBP' | 'JPY';

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Conversion rate relative to USD (1.0)
  locale: string;
  flag: string;
};

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 83.5,
    locale: 'en-IN',
    flag: '🇮🇳',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.92,
    locale: 'de-DE',
    flag: '🇪🇺',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1.0,
    locale: 'en-US',
    flag: '🇺🇸',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.78,
    locale: 'en-GB',
    flag: '🇬🇧',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    rate: 155.0,
    locale: 'ja-JP',
    flag: '🇯🇵',
  },
};

type CurrencyContextType = {
  currency: CurrencyInfo;
  currencyCode: CurrencyCode;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  convertAmount: (amount: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: SUPPORTED_CURRENCIES.USD,
  currencyCode: 'USD',
  setCurrencyCode: () => {},
  formatCurrency: (val) => `$${val.toFixed(2)}`,
  convertAmount: (val) => val,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>('USD');

  useEffect(() => {
    const saved = localStorage.getItem('expensio_currency') as CurrencyCode;
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      setCurrencyCodeState(saved);
    }
  }, []);

  const setCurrencyCode = (code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyCodeState(code);
      localStorage.setItem('expensio_currency', code);
    }
  };

  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;

  const convertAmount = (amount: number) => {
    return amount * currency.rate;
  };

  const formatCurrency = (amount: number) => {
    const converted = convertAmount(amount);
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: currency.code === 'JPY' ? 0 : 2,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyCode,
        setCurrencyCode,
        formatCurrency,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
