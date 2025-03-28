"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { getRandomSnippet, defaultSnippets } from "../utils/codeSnippets";
import { Line } from "react-chartjs-2";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ThemeClasses = {
  bg: string;
  text: string;
  correct: string;
  incorrect: string;
  button: string;
  cursor: string;
};

type Language = "javascript" | "typescript" | "python" | "rust";

export default function TypingTest() {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>("javascript");
  const [snippet, setSnippet] = useState(defaultSnippets[selectedLanguage]);
  const [typed, setTyped] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [_wordCount, setWordCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showRepeatMessage, setShowRepeatMessage] = useState(false);
  const [showNextMessage, setShowNextMessage] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [errorHistory, setErrorHistory] = useState<number[]>([]);
  const testRef = useRef<HTMLPreElement>(null);
  const repeatButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const repeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userName, setUserName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFirstStart, setIsFirstStart] = useState(true);
  const [showSnippet, setShowSnippet] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const calculateRawWPM = () => {
    if (!startTime || !endTime) return 0;
    const timeInMinutes = (endTime - startTime) / 60000;
    const totalCharacters = typed.length;
    const rawWPM = Math.round(totalCharacters / 5 / timeInMinutes);
    return rawWPM;
  };

  const fetchNewSnippet = useCallback(async (lang: Language) => {
    try {
      const snippetText = await getRandomSnippet(lang);
      setSnippet(snippetText);
    } catch (error) {
      console.error("Error fetching new snippet:", error);
      setSnippet(defaultSnippets[lang]);
    }
  }, []);

  const resetTest = useCallback(() => {
    setIsStarted(false);
    setIsFinished(false);
    setTyped("");
    setCursorPosition(0);
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    setWordCount(0);
    setWpmHistory([]);
    setErrorHistory([0]);
  }, []);

  const handleLanguageChange = useCallback(
    (newLanguage: Language) => {
      setSelectedLanguage(newLanguage);
      resetTest();
      setSnippet(defaultSnippets[newLanguage]);
    },
    [resetTest]
  );
  useEffect(() => {
    setSnippet(defaultSnippets[selectedLanguage]);
  }, [selectedLanguage]);

  const getCurrentLineIndex = (position: number) => {
    return snippet.slice(0, position).split("\n").length - 1;
  };

  const getLineStartPosition = (lineIndex: number) => {
    const lines = snippet.split("\n");
    return (
      lines.slice(0, lineIndex).join("\n").length + (lineIndex > 0 ? 1 : 0)
    );
  };

  const isEndOfLine = (position: number) => {
    const currentLineIndex = getCurrentLineIndex(position);
    const lineStart = getLineStartPosition(currentLineIndex);
    const lineLength = snippet.split("\n")[currentLineIndex].length;
    return position - lineStart >= lineLength;
  };

  const isStartOfLine = (position: number) => {
    const currentLineIndex = getCurrentLineIndex(position);
    const lineStart = getLineStartPosition(currentLineIndex);
    const line = snippet.split("\n")[currentLineIndex];
    const firstNonSpaceOffset = line.search(/\S|$/);
    const firstCharPosition = lineStart + firstNonSpaceOffset;
    return position === firstCharPosition;
  };

  const findNextNonEmptyLineStart = (position: number) => {
    const lines = snippet.split("\n");
    let currentLineIndex = getCurrentLineIndex(position);

    while (currentLineIndex < lines.length - 1) {
      currentLineIndex++;
      const nextLine = lines[currentLineIndex].trim();
      if (nextLine.length > 0) {
        const lineStart = getLineStartPosition(currentLineIndex);
        const firstNonSpaceChar = lines[currentLineIndex].search(/\S/);
        return lineStart + firstNonSpaceChar;
      }
    }

    return snippet.length;
  };

  const updateWPM = useCallback(() => {
    if (startTime && typed.length > 0) {
      const timeElapsed = Math.max((Date.now() - startTime) / 60000, 1 / 60);
      const wordsTyped = typed.trim().split(/\s+/).length;
      const calculatedWPM = Math.round(wordsTyped / timeElapsed);

      setWpmHistory((prev) => [...prev, calculatedWPM]);
      setWpm(calculatedWPM);
    }
  }, [startTime, typed]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isFinished) {
      interval = setInterval(() => {
        updateWPM();
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, isFinished, updateWPM]);

  const repeatTest = () => {
    resetTest();
    setIsStarted(true);
  };

  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowNamePrompt(false);

    const statsDiv = document.createElement("div");
    statsDiv.className = `${bg} p-8 rounded-lg`;
    statsDiv.style.width = "800px";
    statsDiv.style.height = "450px";

    statsDiv.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-4">
          <h2 class="${text} text-3xl font-bold">${userName}'s Results</h2>
        </div>
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 class="${text} text-lg font-bold mb-1">WPM</h2>
            <p class="${text} text-4xl font-bold">${wpm}</p>
          </div>
          <div>
            <h2 class="${text} text-lg font-bold mb-1">Accuracy</h2>
            <p class="${text} text-4xl font-bold">${accuracy}%</p>
          </div>
          <div>
            <h2 class="${text} text-lg font-bold mb-1">Time</h2>
            <p class="${text} text-4xl font-bold">${
      ((endTime || 0) - (startTime || 0)) / 1000
    }s</p>
          </div>
          <div>
            <h2 class="${text} text-lg font-bold mb-1">Characters</h2>
            <p class="${text} text-4xl font-bold">${snippet.length}</p>
          </div>
        </div>
        <div id="chart-container" class="h-48 mb-6"></div>
      </div>
      <div class="flex justify-end items-center gap-4 mt-auto">
        <img src="/warp-logo-dark.png" alt="JoinWarp Logo" class="h-6 -mb-[4px]" />
      </div>
    </div>
    `;

    document.body.appendChild(statsDiv);

    const chartContainer = document.createElement("canvas");
    const ctx = chartContainer.getContext("2d");

    if (ctx) {
      new ChartJS(ctx, {
        type: "line",
        data: chartData,
        options: {
          ...chartOptions,
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              max: Math.max(Math.ceil(Math.max(...wpmHistory) / 10) * 10, 100),
              ticks: {
                stepSize: 10,
              },
            },
            x: {
              beginAtZero: true,
            },
          },
          elements: {
            line: {
              tension: 0.1,
            },
          },
        },
      });
    }

    statsDiv.querySelector("#chart-container")?.appendChild(chartContainer);

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(statsDiv, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${userName}-typing-stats.png`;
    link.href = image;
    link.click();

    document.body.removeChild(statsDiv);
  };

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        repeatTest();
        return;
      }

      if (!isStarted || isFinished) return;

      if (!startTime) {
        setStartTime(Date.now());
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (cursorPosition > 0) {
          let newPosition = cursorPosition - 1;

          if (isStartOfLine(cursorPosition)) {
            while (
              newPosition > 0 &&
              (snippet[newPosition] === "\n" || snippet[newPosition] === " ")
            ) {
              newPosition--;
            }
          }

          const newTyped = typed.slice(0, newPosition);
          setTyped(newTyped);
          setCursorPosition(newPosition);
        }
      } else if (e.key === "Enter" && isEndOfLine(cursorPosition)) {
        e.preventDefault();
        const nextPosition = findNextNonEmptyLineStart(cursorPosition);
        const newTyped = typed + snippet.slice(cursorPosition, nextPosition);
        setTyped(newTyped);
        setCursorPosition(nextPosition);
      } else if (e.key === " ") {
        e.preventDefault();
        if (isEndOfLine(cursorPosition)) {
          const nextPosition = findNextNonEmptyLineStart(cursorPosition);
          const newTyped = typed + snippet.slice(cursorPosition, nextPosition);
          setTyped(newTyped);
          setCursorPosition(nextPosition);
          setWordCount((prev) => prev + 1);
          updateWPM();
        } else if (snippet[cursorPosition] === " ") {
          const newTyped = typed + " ";
          setTyped(newTyped);
          setCursorPosition(cursorPosition + 1);
          setWordCount((prev) => prev + 1);
          updateWPM();
        } else {
          setErrors((prev) => prev + 1);
          setErrorHistory((prev) => [...prev, prev[prev.length - 1] + 1]);
        }
      } else if (e.key.length === 1) {
        e.preventDefault();
        let newPosition = cursorPosition;
        let newTyped = typed;

        if (isEndOfLine(cursorPosition)) {
          const nextPosition = findNextNonEmptyLineStart(cursorPosition);
          newTyped += snippet.slice(cursorPosition, nextPosition) + e.key;
          newPosition = nextPosition + 1;
        } else {
          newTyped += e.key;
          newPosition += 1;
        }

        setTyped(newTyped);
        setCursorPosition(newPosition);

        if (e.key !== snippet[cursorPosition]) {
          setErrors((prev) => prev + 1);
          setErrorHistory((prev) => [...prev, prev[prev.length - 1] + 1]);
        } else {
          setErrorHistory((prev) => [...prev, prev[prev.length - 1]]);
        }

        if (newPosition === snippet.length) {
          finishTest();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        repeatTest();
      }
    },
    [
      snippet,
      typed,
      cursorPosition,
      startTime,
      updateWPM,
      isStarted,
      isFinished,
      repeatTest,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    const handleTabFocus = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleTabFocus);
    return () => {
      window.removeEventListener("keydown", handleTabFocus);
    };
  }, []);

  const startTest = () => {
    if (isFirstStart) {
      setCountdown(3);
      const snippetPromise = fetchNewSnippet(selectedLanguage);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            setShowSnippet(false);
            snippetPromise.then(() => {
              resetTest();
              setIsStarted(true);
              setIsFirstStart(false);
              setShowSnippet(true);
            });
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    } else {
      nextTest();
    }
  };

  const nextTest = () => {
    setIsLoading(true);
    setShowSnippet(false);
    fetchNewSnippet(selectedLanguage).then(() => {
      resetTest();
      setIsStarted(true);
      setShowSnippet(true);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        nextTest();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const finishTest = () => {
    setIsFinished(true);
    setEndTime(Date.now());
    const totalChars = snippet.length;
    const accuracyValue = ((totalChars - errors) / totalChars) * 100;
    setAccuracy(Math.round(accuracyValue * 100) / 100);
  };

  const handleRepeatHover = () => {
    repeatTimeoutRef.current = setTimeout(() => {
      setShowRepeatMessage(true);
    }, 2000);
  };

  const handleRepeatLeave = () => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
    }
    setShowRepeatMessage(false);
  };

  const handleNextHover = () => {
    nextTimeoutRef.current = setTimeout(() => {
      setShowNextMessage(true);
    }, 2000);
  };

  const handleNextLeave = () => {
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
    }
    setShowNextMessage(false);
  };

  const handleGenerate = () => {
    setShowNamePrompt(true);
  };

  const getThemeClasses = (themeName: string): ThemeClasses => {
    switch (themeName) {
      case "catppuccin":
        return {
          bg: "bg-catppuccin-base",
          text: "text-catppuccin-text",
          correct: "text-catppuccin-green",
          incorrect: "text-catppuccin-red",
          button:
            "bg-catppuccin-lavender text-catppuccin-base hover:bg-catppuccin-mauve",
          cursor: "bg-catppuccin-rosewater",
        };
      case "dracula":
        return {
          bg: "bg-dracula-background",
          text: "text-dracula-foreground",
          correct: "text-dracula-green",
          incorrect: "text-dracula-red",
          button:
            "bg-dracula-purple text-dracula-background hover:bg-dracula-pink",
          cursor: "bg-dracula-cyan",
        };
      case "everforest":
        return {
          bg: "bg-everforest-background",
          text: "text-everforest-foreground",
          correct: "text-everforest-green",
          incorrect: "text-everforest-red",
          button:
            "bg-everforest-blue text-everforest-background hover:bg-everforest-aqua",
          cursor: "bg-everforest-aqua",
        };
      case "dark":
        return {
          bg: "bg-gray-900",
          text: "text-gray-100",
          correct: "text-green-400",
          incorrect: "text-red-400",
          button: "bg-blue-500 text-white hover:bg-blue-600",
          cursor: "bg-white",
        };
      case "nord":
        return {
          bg: "bg-nord-background",
          text: "text-nord-foreground",
          correct: "text-nord-green",
          incorrect: "text-nord-red",
          button: "bg-nord-blue text-nord-background hover:bg-nord-cyan",
          cursor: "bg-nord-cyan",
        };
      case "gruvbox":
        return {
          bg: "bg-gruvbox-background",
          text: "text-gruvbox-foreground",
          correct: "text-gruvbox-green",
          incorrect: "text-gruvbox-red",
          button:
            "bg-gruvbox-blue text-gruvbox-background hover:bg-gruvbox-aqua",
          cursor: "bg-gruvbox-aqua",
        };
      case "solarized":
        return {
          bg: "bg-solarized-background",
          text: "text-solarized-foreground",
          correct: "text-solarized-green",
          incorrect: "text-solarized-red",
          button:
            "bg-solarized-blue text-solarized-background hover:bg-solarized-cyan",
          cursor: "bg-solarized-cyan",
        };
      case "tokyo":
        return {
          bg: "bg-tokyo-background",
          text: "text-tokyo-foreground",
          correct: "text-tokyo-green",
          incorrect: "text-tokyo-red",
          button: "bg-tokyo-blue text-tokyo-background hover:bg-tokyo-cyan",
          cursor: "bg-tokyo-cyan",
        };
      default:
        return {
          bg: "bg-gray-900",
          text: "text-gray-100",
          correct: "text-green-400",
          incorrect: "text-red-400",
          button: "bg-blue-500 text-white hover:bg-blue-600",
          cursor: "bg-white",
        };
    }
  };

  const { bg, text, correct, incorrect, button, cursor } =
    getThemeClasses(theme);

  const chartData = {
    labels: wpmHistory.map((_, index) => index + 1),
    datasets: [
      {
        label: "WPM",
        data: wpmHistory,
        borderColor: "rgba(147, 112, 219, 1)",
        backgroundColor: "rgba(147, 112, 219, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Errors",
        data: errorHistory,
        borderColor: "rgba(169, 169, 169, 1)",
        backgroundColor: "rgba(169, 169, 169, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(Math.ceil(Math.max(...wpmHistory) / 10) * 10, 100),
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="absolute top-4 right-4 z-10">
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className={`${bg} ${text} border border-gray-300 rounded-md px-2 py-1`}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
        </select>
      </div>
      {!isFinished ? (
        <>
          <div className="mb-8 text-center">
            <span className={`text-6xl font-bold ${text}`}>{wpm || 0}</span>
            <span className={`text-2xl ml-2 ${text} opacity-70`}>wpm</span>
          </div>
          <div
            className={`${bg} p-8 rounded-lg mb-8 relative overflow-hidden ${
              !showSnippet ? "hidden" : ""
            }`}
            tabIndex={0}
          >
            <pre
              ref={testRef}
              className={`${text} font-mono text-xl leading-relaxed whitespace-pre overflow-x-auto`}
            >
              {snippet.split("\n").map((line, lineIndex) => {
                const lineStart = getLineStartPosition(lineIndex);
                const lineEnd = lineStart + line.length;
                return (
                  <div key={lineIndex} className="relative">
                    {line.split("").map((char, charIndex) => {
                      const index = lineStart + charIndex;
                      let charClass = "opacity-50";
                      if (index < typed.length) {
                        charClass = typed[index] === char ? correct : incorrect;
                      }
                      const showCursor = index === cursorPosition;
                      return (
                        <span
                          key={charIndex}
                          className={`relative inline-block ${charClass}`}
                        >
                          {char === " " ? "\u00A0" : char}
                          {showCursor && (
                            <span
                              className={`absolute top-1/2 transform -translate-y-1/2 ${cursor}`}
                              style={{
                                left: "-1px",
                                width: "2px",
                                height: "1.2em",
                              }}
                            ></span>
                          )}
                        </span>
                      );
                    })}
                    {cursorPosition === lineEnd && (
                      <span className="relative inline-block">
                        <span>{"\u00A0"}</span>
                        <span
                          className={`absolute top-1/2 transform -translate-y-1/2 ${cursor}`}
                          style={{
                            opacity: 0.5,
                            left: "-1px",
                            width: "2px",
                            height: "1.2em",
                          }}
                        ></span>
                      </span>
                    )}
                    {lineIndex < snippet.split("\n").length - 1 && <br />}
                  </div>
                );
              })}
            </pre>
          </div>
          {isLoading && (
            <div className="w-full h-2 bg-opacity-20 rounded mb-8">
              <div className={`h-full ${button} rounded animate-pulse`}></div>
            </div>
          )}
        </>
      ) : (
        <div className={`${bg} p-8 rounded-lg mb-8`}>
          {userName && (
            <h2 className={`${text} text-2xl font-bold mb-4 text-left`}>
              {userName}'s Results
            </h2>
          )}
          <div className={`flex justify-between mb-4 ${text} opacity-70`}>
            <span>raw {calculateRawWPM()} wpm</span>
            <span>{selectedLanguage}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <h2 className={`${text} text-2xl font-bold mb-2`}>WPM</h2>
              <p className={`${text} text-4xl font-bold`}>{wpm}</p>
            </div>
            <div>
              <h2 className={`${text} text-2xl font-bold mb-2`}>Accuracy</h2>
              <p className={`${text} text-4xl font-bold`}>{accuracy}%</p>
            </div>
            <div>
              <h2 className={`${text} text-2xl font-bold mb-2`}>Time</h2>
              <p className={`${text} text-4xl font-bold`}>
                {((endTime || 0) - (startTime || 0)) / 1000}s
              </p>
            </div>
            <div>
              <h2 className={`${text} text-2xl font-bold mb-2`}>Characters</h2>
              <p className={`${text} text-4xl font-bold`}>{snippet.length}</p>
            </div>
          </div>
          <div className="h-64 mb-8">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex justify-center space-x-4">
          {!isStarted ? (
            <button
              className={`${button} px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200`}
              onClick={startTest}
              tabIndex={-1}
            >
              Start
            </button>
          ) : (
            <>
              <div className="relative">
                <button
                  ref={repeatButtonRef}
                  className={`${button} px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200`}
                  onClick={repeatTest}
                  onMouseEnter={handleRepeatHover}
                  onMouseLeave={handleRepeatLeave}
                  tabIndex={-1}
                >
                  ↻
                </button>
                {showRepeatMessage && (
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 -top-10 ${text} opacity-70 text-center bg-gray-800 px-2 py-1 rounded whitespace-nowrap`}
                  >
                    Press Tab to repeat
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  ref={nextButtonRef}
                  className={`${button} px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200`}
                  onClick={nextTest}
                  onMouseEnter={handleNextHover}
                  onMouseLeave={handleNextLeave}
                  tabIndex={-1}
                >
                  &gt;
                </button>
                {showNextMessage && (
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 -top-10 ${text} opacity-70 text-center bg-gray-800 px-2 py-1 rounded whitespace-nowrap`}
                  >
                    Press Ctrl+Shift for next
                  </div>
                )}
              </div>
              {isFinished && (
                <button
                  className={`${button} px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200`}
                  onClick={handleGenerate}
                  tabIndex={-1}
                >
                  Share
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {showNamePrompt && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center`}
        >
          <div className={`${bg} p-8 rounded-lg`}>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className={`${text} ${bg} border border-gray-300 rounded-md px-4 py-2 mb-4 w-full`}
              />
              <button
                type="submit"
                className={`${button} px-6 py-2 rounded-full text-lg font-medium transition-colors duration-200 w-full`}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
      {countdown !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`${text} text-9xl font-bold animate-pulse`}>
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}
