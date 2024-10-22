import { NextResponse } from 'next/server'
import axios from 'axios'

const snippetCache: { [key: string]: string[] } = {
  javascript: [],
  typescript: [],
  python: []
};
const MAX_CACHE_SIZE = 10

const codePrompts: string[] = [
  'Generate a simple data structure implementation',
  'Generate a short utility function',
  'Generate a concise array manipulation function',
  'Generate a brief string manipulation function',
  'Generate a small mathematical function'
]

async function generateAndFormatCode(language: string = 'javascript'): Promise<string> {
  const randomPrompt = codePrompts[Math.floor(Math.random() * codePrompts.length)]
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `${randomPrompt} in ${language}. The code must follow these rules exactly:
        1. Maximum 20 lines total including closing braces
        2. Not exceed 50 characters per line
        3. Simple and concise implementation
        4. Only give raw code, no comments or explanations
        5. Use language-specific syntax and best practices for ${language}
        6. Format like this example (but in ${language}):
        
        function reverseString(str) {
          return str
            .split('')
            .reverse()
            .join('');
        }`
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    }
  )

  let code = response.data.content[0].text
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

  const lines = code.split('\n');
  if (lines.length > 20) {
    code = lines.slice(0, 20).join('\n');
  }

  return code;
}

async function fillCache(language: string): Promise<void> {
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

export async function POST(req: Request) {
  try {
    const { language = 'javascript' } = await req.json()

    if (!snippetCache[language] || snippetCache[language].length < MAX_CACHE_SIZE / 2) {
      fillCache(language)
    }

    if (snippetCache[language] && snippetCache[language].length > 0) {
      const randomIndex = Math.floor(Math.random() * snippetCache[language].length)
      const snippet = snippetCache[language][randomIndex]
      snippetCache[language] = snippetCache[language].filter((_, index) => index !== randomIndex)
      return NextResponse.json({ content: [{ text: snippet }] })
    }

    const code = await generateAndFormatCode(language)
    return NextResponse.json({ content: [{ text: code }] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { message: 'Error generating snippet' },
      { status: 500 }
    )
  }
}
