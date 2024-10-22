import { NextResponse } from 'next/server'
import axios from 'axios'

type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'rust';

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
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `${randomPrompt} in ${language}. The code must follow these rules exactly:
        1. Minimum 10 lines total including closing braces
        2. Maximum 20 lines total including closing braces
        3. Not exceed 50 characters per line
        4. Simple and concise implementation
        5. Only give raw code, no comments or explanations
        6. Leetcode medium and hard solutions
        7. Use language-specific syntax and best practices for ${language}
        8. Format like this example (but in ${language}):
        
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

  code = splitLongLines(code);

  const lines = code.split('\n');
  const additionalLines: Record<SupportedLanguage, string[]> = {
    javascript: [
      'console.log("Debug output");',
      'const result = someFunction();',
      'if (condition) { doSomething(); }',
      'for (let i = 0; i < array.length; i++) {}',
      'setTimeout(() => {}, 1000);'
    ],
    typescript: [
      'let variable: string = "value";',
      'interface SomeInterface {}',
      'class SomeClass implements SomeInterface {}',
      'function genericFunction<T>(arg: T): T { return arg; }',
      'type CustomType = string | number;'
    ],
    python: [
      'print("Debug output")',
      'result = some_function()',
      'if condition:',
      '    pass',
      'for item in iterable:',
      '    pass'
    ],
    rust: [
      'let mut variable = String::new();',
      'fn some_function() -> Result<(), Error> { Ok(()) }',
      'if let Some(value) = optional_value { }',
      'for item in iterator { }',
      'match expression { _ => () }'
    ]
  };

  while (lines.length < 10) {
    const randomLine = additionalLines[language][Math.floor(Math.random() * additionalLines[language].length)];
    lines.push(randomLine);
  }
  
  code = lines.join('\n');

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
