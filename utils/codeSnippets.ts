import axios from "axios";

export const defaultSnippets = {
  javascript: `console.log("Hello, World!");
console.log("Welcome to Tread!");`,
  typescript: `const greeting: string = "Hello, World!";
console.log(greeting);
console.log("Welcome to Tread!");`,
  python: `print("Hello, World!")
print("Welcome to Tread!")`,
  rust: `fn main() {
    println!("Hello, World!");
    println!("Welcome to Tread!");
}`,
};

export const getRandomSnippet = async (
  language: "javascript" | "typescript" | "python" | "rust" = "javascript"
): Promise<string> => {
  try {
    const response = await axios.post(
      "/api/snippet",
      { language },
      {
        timeout: 10000,
      }
    );
    return response.data.content[0].text;
  } catch (error) {
    console.error("Error fetching snippet:", error);

    if (language === "rust") {
      return 'println!("Hello, World!");\nprintln!("Welcome to Tread!");';
    }
    return defaultSnippets[language as keyof typeof defaultSnippets];
  }
};
