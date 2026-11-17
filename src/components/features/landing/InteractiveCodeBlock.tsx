import { useState, useEffect, useCallback } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);

interface InteractiveCodeBlockProps {
    language?: "javascript" | "python" | "typescript";
    filename?: string;
    showTypingAnimation?: boolean;
    typingSpeed?: number;
}

const CODE_SNIPPETS = {
    javascript: `import React, { useState } from 'react';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);

  async function generateResponse() {
    const result = await fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    setResponse(await result.json());
  }

  return (
    <div className="ai-container">
      <input 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask anything..."
      />
      <button onClick={generateResponse}>
        Generate
      </button>
    </div>
  );
}`,
    python: `import openai
from typing import Optional

class AIAutomation:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
    
    async def generate_response(
        self, 
        prompt: str,
        model: str = "gpt-4"
    ) -> Optional[str]:
        """Generate AI response from prompt."""
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content

# Usage
assistant = AIAutomation(api_key="sk-...")
result = await assistant.generate_response("Hello!")`,
    typescript: `import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content }]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, content }),
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, isLoading };
}`,
};

const FILENAMES = {
    javascript: "ai-assistant.jsx",
    python: "automation.py",
    typescript: "use-ai-chat.ts",
};

export function InteractiveCodeBlock({
    language = "javascript",
    filename,
    showTypingAnimation = true,
    typingSpeed = 15,
}: InteractiveCodeBlockProps) {
    const fullCode = CODE_SNIPPETS[language];
    const displayFilename = filename || FILENAMES[language];

    // Respect the OS Reduce Motion setting: show the finished snippet instead of typing it out.
    const reduceMotion = typeof window !== "undefined"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const [displayedCode, setDisplayedCode] = useState(
        showTypingAnimation && !reduceMotion ? "" : fullCode
    );
    const [isTyping, setIsTyping] = useState(showTypingAnimation && !reduceMotion);
    const [currentLine, setCurrentLine] = useState(0);

    // Typing animation effect
    useEffect(() => {
        if (!showTypingAnimation || reduceMotion) return;

        let charIndex = 0;
        const lines = fullCode.split('\n');
        let currentLineIndex = 0;

        const timer = setInterval(() => {
            if (charIndex < fullCode.length) {
                setDisplayedCode(fullCode.slice(0, charIndex + 1));

                // Update current line for highlight effect
                const currentText = fullCode.slice(0, charIndex + 1);
                currentLineIndex = currentText.split('\n').length - 1;
                setCurrentLine(currentLineIndex);

                charIndex++;
            } else {
                setIsTyping(false);
                clearInterval(timer);
            }
        }, typingSpeed);

        return () => clearInterval(timer);
    }, [fullCode, showTypingAnimation, typingSpeed, reduceMotion]);

    // Custom line number renderer
    const lineNumbers = displayedCode.split('\n').length;

    return (
        <div className="relative group">
            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative bg-[#1e1e1e] rounded-xl border border-zinc-800/60 shadow-2xl overflow-hidden">
                {/* Mac-style Window Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-zinc-700/50">
                    <div className="flex items-center gap-2">
                        {/* Traffic lights */}
                        <div className="flex gap-2">
                            <motion.span
                                className="h-3 w-3 rounded-full bg-[#ff5f56] cursor-pointer"
                                whileHover={{ scale: 1.2 }}
                                transition={{ duration: 0.15 }}
                            />
                            <motion.span
                                className="h-3 w-3 rounded-full bg-[#ffbd2e] cursor-pointer"
                                whileHover={{ scale: 1.2 }}
                                transition={{ duration: 0.15 }}
                            />
                            <motion.span
                                className="h-3 w-3 rounded-full bg-[#27c93f] cursor-pointer"
                                whileHover={{ scale: 1.2 }}
                                transition={{ duration: 0.15 }}
                            />
                        </div>
                    </div>

                    {/* Filename tab */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-t-lg border-t border-x border-zinc-700/50 -mb-3">
                        <span className="text-xs font-mono text-zinc-400">
                            {displayFilename}
                        </span>
                        {isTyping && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </div>

                    {/* Fake toolbar icons */}
                    <div className="flex items-center gap-3 text-zinc-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                </div>

                {/* Code content area */}
                <div className="relative overflow-hidden">
                    {/* Line highlight effect */}
                    {isTyping && (
                        <motion.div
                            className="absolute left-0 right-0 h-6 bg-blue-500/5 pointer-events-none"
                            style={{ top: currentLine * 24 + 16 }}
                            layoutId="lineHighlight"
                            transition={{ duration: 0.1 }}
                        />
                    )}

                    <SyntaxHighlighter
                        language={language}
                        style={oneDark}
                        showLineNumbers
                        wrapLines
                        lineNumberStyle={{
                            minWidth: "3em",
                            paddingRight: "1em",
                            color: "#636e7b",
                            userSelect: "none",
                        }}
                        customStyle={{
                            margin: 0,
                            padding: "1rem",
                            background: "transparent",
                            fontSize: "13px",
                            lineHeight: "1.6",
                            maxHeight: "400px",
                            overflow: "auto",
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            },
                        }}
                    >
                        {displayedCode || " "}
                    </SyntaxHighlighter>

                    {/* Typing cursor */}
                    {isTyping && (
                        <motion.span
                            className="absolute w-0.5 h-4 bg-white"
                            style={{
                                bottom: 20,
                                right: 40,
                            }}
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                        />
                    )}
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-t border-zinc-700/50 text-xs text-zinc-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Ready
                        </span>
                        <span>Ln {lineNumbers}, Col {displayedCode.split('\n').pop()?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>{language === "python" ? "Python 3.11" : language === "typescript" ? "TypeScript" : "JavaScript"}</span>
                        <span>UTF-8</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InteractiveCodeBlock;
