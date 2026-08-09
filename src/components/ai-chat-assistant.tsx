'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User as UserIcon, Loader2, Lightbulb, MessageSquare } from 'lucide-react';
import { runFinancialAdvisorChat } from '@/app/actions';
import type { Expense } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type AiChatAssistantProps = {
  expenses: Expense[];
  monthlyBudget: number;
};

type ChatMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedAction?: string;
  time: string;
};

const defaultPrompts = [
  'How much did I spend this month vs my budget?',
  'What is my single highest spending category?',
  'Can I afford a $100 discretionary purchase today?',
  'Give me 3 practical tips to optimize my expenses.',
];

export default function AiChatAssistant({ expenses, monthlyBudget }: AiChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Hello! I am your Expensio AI Financial Coach. Ask me anything about your spending ledger, budget forecasts, or savings targets!",
      time: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsTyping(true);

    try {
      const res = await runFinancialAdvisorChat(textToSend, expenses, monthlyBudget);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        suggestedAction: res.suggestedAction,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast({
        title: 'AI Response Error',
        description: err.message || 'Could not connect to AI advisor core.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="glass-card border-border/40 flex flex-col h-[560px] overflow-hidden">
      <CardHeader className="border-b border-border/20 py-3.5 px-6 bg-card/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold font-headline flex items-center gap-2">
                <span>Expensio AI Assistant</span>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                  GenKit 1.5
                </span>
              </CardTitle>
              <CardDescription className="text-[11px] text-muted-foreground">
                Real-time conversational financial coach powered by Google AI
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Chat Messages Feed */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              {msg.sender === 'user' ? (
                <UserIcon className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
            </div>

            <div className="space-y-1.5">
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'glass-card border-border/40 text-foreground rounded-tl-none'
                }`}
              >
                <p>{msg.text}</p>
                {msg.suggestedAction && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-accent">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                    <span>Action: {msg.suggestedAction}</span>
                  </div>
                )}
              </div>
              <p className={`text-[9px] text-muted-foreground ${msg.sender === 'user' ? 'text-right' : ''}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl glass-card text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analyzing financial ledger...</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-muted/10 border-t border-border/20 overflow-x-auto flex gap-1.5 scrollbar-none">
        {defaultPrompts.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(promptText)}
            className="text-[10px] whitespace-nowrap bg-card/60 border border-border/40 hover:border-primary/40 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground transition-smooth"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 border-t border-border/20 bg-card/30 flex gap-2">
        <Input
          placeholder="Ask Expensio AI a question..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="text-xs bg-background/50 border-border/40 focus:border-primary/50"
        />
        <Button
          onClick={() => handleSendMessage()}
          disabled={isTyping || !inputQuery.trim()}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white h-9 px-3.5 shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
