import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      // Fallback if no API key
      const lines = content.split('\n');
      const improved = lines.map((line: string) => {
        if (line.startsWith('- ') && !line.includes('**')) {
          return line.replace(/^- (.+)/, '- **$1**');
        }
        return line;
      }).join('\n');
      return NextResponse.json({ improvedContent: improved + '\n\n*Note: Add GROQ API key for AI improvements.*' });
    }

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `As an expert editor, please improve the following blog content. 
      
      Requirements:
      1. Humanize the tone: make it sound like it was written by a passionate person, not an AI.
      2. Clear structure: use #, ##, and ### headings to create a clear hierarchy.
      3. Engagement: improve clarity, flow, and hooks.
      4. Grammar: fix all errors while keeping the professional yet conversational style.
      5. DO NOT include any conversational filler (like "Here is the improved version").
      6. Return ONLY the improved markdown content.

      Content to improve:
      ${content}`,
      maxTokens: 2000,
    });

    return NextResponse.json({ improvedContent: text.trim() });
  } catch (error) {
    console.error('AI Improve error:', error);
    return NextResponse.json({ error: 'Failed to improve content' }, { status: 500 });
  }
}
