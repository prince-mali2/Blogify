import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, category, title, userId } = body;
    const promptTopic = topic || title || 'interesting topic';
    const promptCategory = category || 'general';

    console.log('Generating draft for:', promptTopic, promptCategory);

    // Check API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('No API key - returning fallback');
      return NextResponse.json(getFallback(promptTopic, promptCategory));
    }

    // Call Groq API directly with fetch
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an expert human-like blog writer. You write engaging, insightful, and well-structured articles that sound natural, not robotic. Avoid cliché AI transition words. Use a professional yet conversational tone.',
            },
            {
              role: 'user',
              content: `Write a high-quality, comprehensive blog post about "${promptTopic}" in the category "${promptCategory}".
              
              The article must have:
              1. A catchy human-written title.
              2. A clear hierarchy of headings (# for Main Title, ## for Sections, ### for Sub-sections).
              3. Engaging, detailed paragraphs (500-800 words).
              4. A compelling opening and a natural closing.
              
              Return the response ONLY as a JSON object with this exact structure:
              {
                "title": "The article title",
                "content": "The full article in markdown format",
                "excerpt": "A short, punchy 2-sentence summary"
              }`,
            },
          ],
          temperature: 0.8,
          max_tokens: 3000,
        }),
      }
    );

    console.log('Groq response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', errText);
      return NextResponse.json(getFallback(promptTopic, promptCategory));
    }

    const groqData = await groqResponse.json();
    const messageContent = groqData.choices?.[0]?.message?.content || '';

    console.log('Groq raw response length:', messageContent.length);

    // Robust JSON extraction
    let parsed: any = {};
    try {
      // Find the first '{' and last '}' to extract JSON even if AI adds extra text
      const startIdx = messageContent.indexOf('{');
      const endIdx = messageContent.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = messageContent.substring(startIdx, endIdx + 1);
        parsed = JSON.parse(jsonStr);
      } else {
        throw new Error('No JSON structure found');
      }
    } catch (parseErr) {
      console.log('JSON parse failed, attempting manual extraction');
      // If parsing fails, try to extract fields with regex
      const titleMatch = messageContent.match(/"title":\s*"([^"]+)"/);
      const excerptMatch = messageContent.match(/"excerpt":\s*"([^"]+)"/);
      
      // Attempt to extract content by stripping known JSON structure bits if it's leaked
      let cleanedContent = messageContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/\{[\s\S]*?"content":\s*"/i, '')
        .replace(/"\s*,\s*"excerpt"[\s\S]*?\}?$/i, '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .trim();

      parsed = {
        title: titleMatch ? titleMatch[1] : `The World of ${promptTopic}`,
        content: cleanedContent.length > 100 ? cleanedContent : messageContent,
        excerpt: excerptMatch ? excerptMatch[1] : `Exploring ${promptTopic}`,
      };
    }

    // Final sanitization of content - ensure no JSON keys remain in the text
    let finalContent = parsed.content || '';
    if (finalContent.startsWith('{') && finalContent.includes('"content":')) {
       try {
         const inner = JSON.parse(finalContent);
         finalContent = inner.content || finalContent;
       } catch(e) {}
    }

    return NextResponse.json({
      title: parsed.title || `The World of ${promptTopic}`,
      content: finalContent,
      excerpt: parsed.excerpt || `A deep dive into ${promptTopic}`,
      category: promptCategory,
      imageUrl: null,
    });

  } catch (error: any) {
    console.error('Generate draft error:', error?.message || error);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(
      getFallback(body.topic || body.title || 'topic', body.category)
    );
  }
}

function getFallback(topic: string, category: string = 'general') {
  return {
    title: `The Complete Guide to ${topic}`,
    content: `# The Complete Guide to ${topic}

## Introduction

${topic} is a fascinating subject that has gained significant attention in recent years. In this comprehensive guide, we will explore everything you need to know to get started and excel.

## Why ${topic} Matters

Understanding ${topic} can transform the way you approach problems and create solutions. Whether you are a beginner or an experienced professional, there is always something new to discover.

## Key Concepts

### Getting Started
The first step is to understand the fundamentals. Take your time to build a solid foundation before moving to advanced topics.

### Best Practices
- Always start with clear goals in mind
- Learn from real-world examples and case studies
- Practice consistently to build your skills
- Connect with a community of like-minded people

### Common Mistakes to Avoid
Many beginners make the same mistakes. Being aware of them early can save you significant time and effort.

## Practical Applications

The real value of ${topic} becomes clear when you start applying it to real-world situations. Start with small projects and gradually take on more complex challenges.

## Conclusion

${topic} offers incredible opportunities for those willing to invest time in learning it properly. Start your journey today and see where it takes you.`,
    excerpt: `A comprehensive guide covering everything you need to know about ${topic}.`,
    category,
    imageUrl: null,
  };
}