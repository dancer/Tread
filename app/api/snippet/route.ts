import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'rust';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const snippetCache: { [key in SupportedLanguage]: string[] } = {
  javascript: [],
  typescript: [],
  python: [],
  rust: []
};
const MAX_CACHE_SIZE = 10

const codePrompts: string[] = [
  'Generate a simple data structure implementation',
  'Generate a short utility function',
  'Generate a concise array manipulation function',
  'Generate a brief string manipulation function',
  'Generate a small mathematical function'
]

function splitLongLines(code: string, maxLength: number = 50): string {
  return code.split('\n').map(line => {
    if (line.length <= maxLength) return line;
    return line.match(new RegExp(`.{1,${maxLength}}`, 'g'))?.join('\n  ') || line;
  }).join('\n');
}

async function generateAndFormatCode(language: SupportedLanguage = 'javascript'): Promise<string> {
  const randomPrompt = codePrompts[Math.floor(Math.random() * codePrompts.length)]
  
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `You are an extremely technical backend systems engineer working for Google. You are interviewing a potential candidate for hire.
        You are offering a leetcode ${randomPrompt} challenge as part of the interview.
        Come up with a code function that is a solution for the challenge you are offering.
        The code must follow these rules exactly:
        1. Minimum 10 lines total including closing braces
        2. Maximum 20 lines total including closing braces
        3. Not exceed 50 characters per line
        4. Simple and concise implementation
        5. Only give raw code, no comments or explanations
        6. Only generate code from solutions of leetcode medium and hard problems
        7. Use language-specific syntax and best practices for ${language}
        8. Follow all Open Source best practices for this piece of code
        9. Give me a complete working function that compiles in ${language} on macOS
        9. Format like this example (but in ${language}):
        
        function reverseString(str) {
          return str
            .split('')
            .reverse()
            .join('');
        }`
    }]
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''
  let code = content
    .replace(/```javascript\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^\/\/.*$/gm, '')
    .split('\n')
    .map((line: string): string => {
      if (line.length > 50) {
        if (line.includes('.')) {
          return line.split('.')
            .join('\n  .')
            .trim();
        }
        if (line.includes('&&') || line.includes('||')) {
          return line.replace(/(\|\||\&\&)/g, '\n  $1')
            .trim();
        }
      }
      return line;
    })
    .join('\n')
    .trim();

  code = splitLongLines(code);
  return code;
}

async function fillCache(language: SupportedLanguage): Promise<void> {
  try {
    while (snippetCache[language].length < MAX_CACHE_SIZE) {
      const code = await generateAndFormatCode(language)
      if (!snippetCache[language].includes(code)) {
        snippetCache[language].push(code)
      }
    }
  } catch (error) {
    console.error('Error filling cache:', error)
  }
}

fillCache('javascript')
fillCache('typescript')
fillCache('python')
fillCache('rust')

export async function POST(req: Request) {
  try {
    const { language = 'javascript' } = await req.json()

    if (!snippetCache[language as SupportedLanguage] || snippetCache[language as SupportedLanguage].length < MAX_CACHE_SIZE / 2) {
      fillCache(language as SupportedLanguage)
    }

    if (snippetCache[language as SupportedLanguage] && snippetCache[language as SupportedLanguage].length > 0) {
      const randomIndex = Math.floor(Math.random() * snippetCache[language as SupportedLanguage].length)
      const snippet = snippetCache[language as SupportedLanguage][randomIndex]
      snippetCache[language as SupportedLanguage] = snippetCache[language as SupportedLanguage].filter((_, index) => index !== randomIndex)
      return NextResponse.json({ content: [{ text: snippet }] })
    }

    const code = await generateAndFormatCode(language as SupportedLanguage)
    return NextResponse.json({ content: [{ text: code }] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Error generating snippet' },
      { status: 500 }
    )
  }
}
