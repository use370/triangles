"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingLogo from "@/components/LoadingLogo";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type MCQQuestion = {
  type: "mcq";
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type PuzzleQuestion = {
  type: "puzzle";
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type CodingQuestion = {
  type: "coding";
  id: string;
  category: string;
  question: string;
  prompt: string;
  starterCode: string;
  requiredPatterns: string[];
  forbiddenPatterns?: string[];
  explanation: string;
};

type WrittenQuestion = {
  type: "written";
  id: string;
  category: string;
  question: string;
};

type TestQuestion =
  | MCQQuestion
  | PuzzleQuestion
  | CodingQuestion
  | WrittenQuestion;

type TestResult = {
  passed: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  level: string;
  skill: string;
  completedAt: string;
};

type GeneratedTest = {
  questions: TestQuestion[];
};

type ChallengeBank = {
  mcq: MCQQuestion[];
  puzzles: PuzzleQuestion[];
  coding: CodingQuestion[];
  written: WrittenQuestion[];
};

/* =========================================================
   CONSTANTS
========================================================= */

const CORRECT_MARKS = 1;
const WRONG_MARKS = -0.25;
const OBJECTIVE_TOTAL = 9;
const PASS_CORRECT = 7;
const TEST_DURATION = 15 * 60;

const GREEN = "#176B52";
const DARK_GREEN = "#123C32";
const SAND = "#D5B98A";
const BG = "#F9F7F2";
const BORDER = "#E4DED3";
const MUTED = "#77736A";
const SOFT = "#FCFBF8";
const RED = "#B54A4A";

/* =========================================================
   RANDOM HELPERS
========================================================= */

function shuffle<T>(items: T[]): T[] {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [
      array[j],
      array[i],
    ];
  }

  return array;
}

function pickRandom<T>(
  items: T[],
  count: number
): T[] {
  return shuffle(items).slice(0, count);
}

/* =========================================================
   WEB DEVELOPMENT BANK
========================================================= */

const webDevelopmentBank: ChallengeBank = {
  mcq: [
    {
      type: "mcq",
      id: "js-event-loop",
      category: "JavaScript / Runtime",
      question:
        "Consider: console.log('A'); Promise.resolve().then(() => console.log('B')); setTimeout(() => console.log('C'), 0); console.log('D'); What is the output order?",
      options: [
        "A → B → D → C",
        "A → D → B → C",
        "A → D → C → B",
        "B → A → D → C",
      ],
      correctAnswer: 1,
      explanation:
        "Synchronous code runs first. The Promise callback is a microtask and runs before the timer task.",
    },

    {
      type: "mcq",
      id: "react-state",
      category: "React",
      question:
        "A React component calls setCount(count + 1) three times in the same click handler. Why might the final value increase by only 1?",
      options: [
        "React ignores the first two calls permanently",
        "All three updates can use the same captured count value",
        "useState only allows one update per component",
        "React converts numbers into strings",
      ],
      correctAnswer: 1,
      explanation:
        "Each expression can use the same render's captured value. Functional updates are appropriate when updates depend on previous state.",
    },

    {
      type: "mcq",
      id: "react-effect",
      category: "React",
      question:
        "A component fetches data inside useEffect and uses a changing userId. Why does userId belong in the dependency array?",
      options: [
        "It makes the browser cache the response",
        "It tells React the effect depends on the current userId",
        "It prevents every network request forever",
        "It converts the request into a server action",
      ],
      correctAnswer: 1,
      explanation:
        "The dependency array describes reactive values used by the effect.",
    },

    {
      type: "mcq",
      id: "database-index",
      category: "Database",
      question:
        "A users table contains millions of rows and frequently queries WHERE email = ?. What is the most direct optimization?",
      options: [
        "Add an index on email",
        "Duplicate every row",
        "Store email as an image",
        "Remove the WHERE clause",
      ],
      correctAnswer: 0,
      explanation:
        "An appropriate index can substantially reduce the work required to locate matching rows.",
    },

    {
      type: "mcq",
      id: "api-security",
      category: "Security",
      question:
        "Your frontend sends userId=123 to /api/profile/123. What must the server still verify?",
      options: [
        "Only that the URL looks correct",
        "That the authenticated user is authorized to access that resource",
        "That the browser is Chrome",
        "That JavaScript is enabled",
      ],
      correctAnswer: 1,
      explanation:
        "Client-controlled identifiers cannot be treated as proof of authorization.",
    },

    {
      type: "mcq",
      id: "pagination",
      category: "Backend",
      question:
        "An API returns 100,000 records although the UI shows only 20. What is the appropriate architectural change?",
      options: [
        "Load all records and hide them with CSS",
        "Implement server-side pagination",
        "Increase the font size",
        "Convert JSON to HTML",
      ],
      correctAnswer: 1,
      explanation:
        "Server-side pagination limits transferred and processed data.",
    },

    {
      type: "mcq",
      id: "cache-invalidation",
      category: "Architecture",
      question:
        "A profile API uses a 10-minute cache. A user updates their profile but sees old data. What is the likely cause?",
      options: [
        "The CSS is too slow",
        "The cached response has not been invalidated or refreshed",
        "HTML cannot display profiles",
        "The database deleted the profile",
      ],
      correctAnswer: 1,
      explanation:
        "Caching improves performance but introduces freshness concerns.",
    },

    {
      type: "mcq",
      id: "race-condition",
      category: "Async JavaScript",
      question:
        "A search box sends requests for 'ca', 'car', and 'cars'. The 'ca' request finishes last and overwrites the newer result. What problem is this?",
      options: [
        "Race condition",
        "Syntax error",
        "CSS inheritance",
        "Database normalization",
      ],
      correctAnswer: 0,
      explanation:
        "Responses can complete in a different order from requests.",
    },

    {
      type: "mcq",
      id: "xss",
      category: "Security",
      question:
        "A user-submitted comment is rendered as raw HTML without sanitization. What security issue can this create?",
      options: [
        "XSS",
        "DNS caching",
        "Database indexing",
        "HTTP compression",
      ],
      correctAnswer: 0,
      explanation:
        "Unsanitized user-controlled HTML can allow malicious scripts to execute.",
    },

    {
      type: "mcq",
      id: "http-idempotency",
      category: "HTTP",
      question:
        "Why is idempotency important when an API request may be retried after a network timeout?",
      options: [
        "It guarantees the request is never sent",
        "Repeated equivalent requests should not unintentionally create repeated side effects",
        "It makes JSON smaller",
        "It disables authentication",
      ],
      correctAnswer: 1,
      explanation:
        "Retries happen in real systems. Idempotency helps prevent duplicate side effects.",
    },

    {
      type: "mcq",
      id: "n-plus-one",
      category: "Database",
      question:
        "An endpoint fetches 50 projects and then performs one database query for each project's owner. What problem is this?",
      options: [
        "N+1 query problem",
        "CSS specificity",
        "Browser memory leak",
        "TLS negotiation",
      ],
      correctAnswer: 0,
      explanation:
        "One query for the list plus one query per item creates an N+1 pattern.",
    },

    {
      type: "mcq",
      id: "server-validation",
      category: "Security",
      question:
        "A signup form validates password length in JavaScript. Why must the server validate it too?",
      options: [
        "JavaScript validation is always incorrect",
        "Clients can bypass or modify frontend validation",
        "Browsers cannot send passwords",
        "HTML automatically encrypts passwords",
      ],
      correctAnswer: 1,
      explanation:
        "Frontend validation improves UX, but the server is the security boundary.",
    },

    {
      type: "mcq",
      id: "scenario-deployment",
      category: "Production",
      question:
        "A feature works locally but causes errors immediately after deployment. What should you investigate first?",
      options: [
        "Only the logo",
        "Production logs, environment variables, deployment differences and the failing request",
        "Delete the feature immediately",
        "Change unrelated CSS",
      ],
      correctAnswer: 1,
      explanation:
        "Production failures should first be investigated using evidence from the production environment.",
    },

    {
      type: "mcq",
      id: "scenario-auth",
      category: "Authentication",
      question:
        "A logged-in user can manually change /users/42 to /users/43 and see another user's private profile. What class of issue should you investigate?",
      options: [
        "Authorization failure / IDOR",
        "Image compression",
        "Typography issue",
        "Browser caching",
      ],
      correctAnswer: 0,
      explanation:
        "Changing an object identifier to access another user's resource indicates an authorization/access-control problem.",
    },
  ],

  puzzles: [
    {
      type: "puzzle",
      id: "debug-stale-state",
      category: "Debugging",
      question:
        "A React counter should increase by 3, but this handler only increases it by 1. Which change correctly fixes the logic?",
      options: [
        "setCount(count + 3)",
        "setCount(count++)",
        "setCount(prev => prev + 1) three times",
        "setCount(String(count + 3))",
      ],
      correctAnswer: 2,
      explanation:
        "Functional state updates consume the latest queued state.",
    },

    {
      type: "puzzle",
      id: "promise-order",
      category: "Output Prediction",
      question:
        "What is printed? console.log(1); Promise.resolve().then(() => console.log(2)); console.log(3);",
      options: [
        "1, 2, 3",
        "2, 1, 3",
        "1, 3, 2",
        "3, 1, 2",
      ],
      correctAnswer: 2,
      explanation:
        "The Promise callback runs after synchronous statements complete.",
    },

    {
      type: "puzzle",
      id: "closure",
      category: "JavaScript",
      question:
        "A loop creates callbacks that should each print their own index. Which approach avoids the classic var-loop closure problem?",
      options: [
        "Use let for the loop variable",
        "Convert every number to a string",
        "Use document.write",
        "Remove the callback",
      ],
      correctAnswer: 0,
      explanation:
        "let creates block-scoped bindings.",
    },

    {
      type: "puzzle",
      id: "auth-bug",
      category: "Security Debugging",
      question:
        "An API checks if a request contains a userId, then returns that user's private data. What is the core flaw?",
      options: [
        "The server trusts a client-controlled identifier without authorization",
        "The API uses JSON",
        "The URL contains numbers",
        "The request uses HTTPS",
      ],
      correctAnswer: 0,
      explanation:
        "Authentication and authorization are different. The server must enforce access.",
    },

    {
      type: "puzzle",
      id: "search-race",
      category: "Async Debugging",
      question:
        "A search UI shows results for an older query after a newer query finishes. Which strategy directly addresses the problem?",
      options: [
        "Ignore response ordering",
        "Cancel previous requests or ignore stale responses",
        "Increase font size",
        "Disable the input permanently",
      ],
      correctAnswer: 1,
      explanation:
        "AbortController or request identity checks can prevent stale responses.",
    },

    {
      type: "puzzle",
      id: "performance",
      category: "Performance",
      question:
        "A dashboard renders a 10,000-row list and becomes sluggish. Which improvement is most directly related to rendering cost?",
      options: [
        "Virtualize the list",
        "Add more shadows",
        "Increase image dimensions",
        "Duplicate the list",
      ],
      correctAnswer: 0,
      explanation:
        "Virtualization renders only the visible portion of a large list.",
    },

    {
      type: "puzzle",
      id: "debug-production",
      category: "Production Debugging",
      question:
        "A bug occurs only for some users. Which debugging approach gives the strongest evidence?",
      options: [
        "Change several unrelated files",
        "Collect logs, affected environments, reproduction conditions and request details",
        "Assume all users have the same problem",
        "Ignore the issue until it disappears",
      ],
      correctAnswer: 1,
      explanation:
        "Intermittent production issues require evidence about affected users and conditions.",
    },

    {
      type: "puzzle",
      id: "database-debug",
      category: "Database",
      question:
        "A query is fast with 100 rows but very slow with millions of rows. Which investigation is most useful?",
      options: [
        "Inspect the query plan and relevant indexes",
        "Change the website logo",
        "Increase button size",
        "Remove authentication",
      ],
      correctAnswer: 0,
      explanation:
        "Query plans and indexes help identify database execution bottlenecks.",
    },
  ],

  coding: [
    {
      type: "coding",
      id: "coding-array-frequency",
      category: "Coding",
      question:
        "Implement a JavaScript function that returns the first character that appears only once.",
      prompt:
        "Example: firstUniqueChar('swiss') should return 'w'. If no unique character exists, return null.",
      starterCode:
`function firstUniqueChar(text) {
  // Write your solution here

}`,
      requiredPatterns: [
        "function",
        "return",
        "for",
        "null",
      ],
      forbiddenPatterns: [
        "alert(",
        "prompt(",
        "console.log",
      ],
      explanation:
        "A solid solution should count occurrences and then find the first character whose count is one.",
    },

    {
      type: "coding",
      id: "coding-debounce",
      category: "Coding",
      question:
        "Write a debounce function in JavaScript.",
      prompt:
        "The returned function should delay execution until calls stop for the specified delay and preserve the latest arguments.",
      starterCode:
`function debounce(callback, delay) {
  // Write your solution here

}`,
      requiredPatterns: [
        "function",
        "setTimeout",
        "clearTimeout",
        "return",
      ],
      forbiddenPatterns: [
        "eval(",
        "new Function(",
      ],
      explanation:
        "A debounce implementation normally stores a timer, clears the previous timer, and schedules the callback again.",
    },

    {
      type: "coding",
      id: "coding-array-transform",
      category: "Coding",
      question:
        "Write a function that returns the second-largest unique number from an array.",
      prompt:
        "Example: secondLargest([5, 1, 5, 4, 3]) should return 4. Return null when fewer than two unique values exist.",
      starterCode:
`function secondLargest(numbers) {
  // Write your solution here

}`,
      requiredPatterns: [
        "function",
        "return",
        "null",
      ],
      forbiddenPatterns: [
        "sort(",
      ],
      explanation:
        "The challenge intentionally forbids sort so the candidate has to reason about tracking unique maximum values.",
    },

    {
      type: "coding",
      id: "coding-safe-fetch",
      category: "Frontend Architecture",
      question:
        "Write the core of a request function that prevents an older request from updating state after a newer request starts.",
      prompt:
        "Use AbortController. A new request should cancel the previous request.",
      starterCode:
`let controller = null;

async function loadData(url) {
  // Write your solution here
}`,
      requiredPatterns: [
        "AbortController",
        "abort",
        "fetch",
        "signal",
      ],
      forbiddenPatterns: [
        "eval(",
        "new Function(",
      ],
      explanation:
        "AbortController provides a standard way to cancel a previous fetch when a newer request supersedes it.",
    },
  ],

  written: [
    {
      type: "written",
      id: "written-architecture",
      category: "Architecture",
      question:
        "You are building a professional networking platform. A profile page loads slowly because it requests profile data, projects, posts and notifications separately. Explain how you would diagnose and redesign the loading strategy without sacrificing correctness.",
    },

    {
      type: "written",
      id: "written-production-bug",
      category: "Production Debugging",
      question:
        "A feature works locally but fails for some production users. Explain your investigation process from reproducing the problem through identifying the root cause and deploying a safe fix.",
    },

    {
      type: "written",
      id: "written-security",
      category: "Security",
      question:
        "A client asks you to let users upload files to a public application. Explain the security and reliability checks you would consider before allowing those uploads.",
    },
  ],
};

/* =========================================================
   GENERIC PROFESSIONAL BANK
========================================================= */

const genericBank: ChallengeBank = {
  mcq: [
    {
      type: "mcq",
      id: "generic-requirements",
      category: "Professional Reasoning",
      question:
        "A client gives a vague requirement: 'Make it premium.' What should you do first?",
      options: [
        "Start coding immediately",
        "Ask targeted questions and define measurable requirements",
        "Copy a competitor",
        "Choose everything yourself without confirmation",
      ],
      correctAnswer: 1,
      explanation:
        "Ambiguous requirements need clarification before implementation.",
    },

    {
      type: "mcq",
      id: "generic-tradeoff",
      category: "Decision Making",
      question:
        "A project has a one-day deadline and ten requested features. What is the strongest professional response?",
      options: [
        "Promise all ten regardless of feasibility",
        "Prioritize the highest-value requirements and discuss trade-offs",
        "Ignore the deadline",
        "Deliver random features",
      ],
      correctAnswer: 1,
      explanation:
        "Professional delivery requires scope, priority and trade-off management.",
    },

    {
      type: "mcq",
      id: "generic-debug",
      category: "Problem Solving",
      question:
        "A bug cannot be reproduced consistently. What is a useful first step?",
      options: [
        "Change unrelated code",
        "Collect reproduction conditions, logs and affected environments",
        "Delete the feature",
        "Assume the client is wrong",
      ],
      correctAnswer: 1,
      explanation:
        "Intermittent problems require evidence about when and where they occur.",
    },

    {
      type: "mcq",
      id: "generic-quality",
      category: "Quality",
      question:
        "A solution works for the happy path but fails for unusual input. What does this indicate?",
      options: [
        "Edge cases were not adequately considered",
        "The project is automatically complete",
        "Testing is unnecessary",
        "The requirement must always be wrong",
      ],
      correctAnswer: 0,
      explanation:
        "Professional solutions should consider relevant edge cases and failure modes.",
    },

    {
      type: "mcq",
      id: "generic-feedback",
      category: "Professional Practice",
      question:
        "A reviewer identifies a flaw in your approach. What is the most useful response?",
      options: [
        "Defend the original approach regardless of evidence",
        "Understand the reasoning and evaluate whether the approach should change",
        "Delete the project",
        "Ignore the review",
      ],
      correctAnswer: 1,
      explanation:
        "Good professional work uses feedback and evidence to improve decisions.",
    },

    {
      type: "mcq",
      id: "generic-scope",
      category: "Project Management",
      question:
        "A client adds several new requirements halfway through a project. What should happen before accepting them?",
      options: [
        "Accept everything silently",
        "Assess scope, time, cost and impact before agreeing",
        "Ignore the client",
        "Delete completed work",
      ],
      correctAnswer: 1,
      explanation:
        "Changes should be evaluated against the agreed scope and delivery constraints.",
    },

    {
      type: "mcq",
      id: "generic-deadline",
      category: "Delivery",
      question:
        "You realize a deadline is at risk. What is the professional response?",
      options: [
        "Hide the problem until the deadline",
        "Communicate early with evidence, options and a revised plan",
        "Stop responding",
        "Promise an impossible date",
      ],
      correctAnswer: 1,
      explanation:
        "Early communication gives stakeholders a chance to adjust scope or timing.",
    },

    {
      type: "mcq",
      id: "generic-quality-control",
      category: "Quality Control",
      question:
        "A deliverable technically works but contains several small defects. What should you do before delivery?",
      options: [
        "Deliver without checking",
        "Perform a structured quality review and fix relevant defects",
        "Blame the client",
        "Remove documentation",
      ],
      correctAnswer: 1,
      explanation:
        "Professional delivery includes quality checks before handing work to the client.",
    },

    {
      type: "mcq",
      id: "generic-client-trust",
      category: "Client Management",
      question:
        "A client asks whether a feature can be delivered tomorrow, but you are unsure. What is the strongest response?",
      options: [
        "Guarantee it without checking",
        "Assess the work and communicate a realistic estimate",
        "Ignore the question",
        "Say yes and decide later",
      ],
      correctAnswer: 1,
      explanation:
        "Reliable estimates require understanding the work before making a commitment.",
    },
  ],

  puzzles: [
    {
      type: "puzzle",
      id: "generic-priority",
      category: "Prioritization",
      question:
        "Three tasks exist: fix a security vulnerability, redesign a button, and rename a variable. Which normally deserves immediate attention?",
      options: [
        "Security vulnerability",
        "Button redesign",
        "Variable rename",
        "Whichever takes the longest",
      ],
      correctAnswer: 0,
      explanation:
        "Security vulnerabilities can create serious risk and normally require priority attention.",
    },

    {
      type: "puzzle",
      id: "generic-root-cause",
      category: "Debugging",
      question:
        "Changing five things at once makes a bug disappear. Why is this a weak debugging outcome?",
      options: [
        "You may not know which change actually fixed the problem",
        "Five changes are always illegal",
        "Bugs can never have multiple causes",
        "Testing is unnecessary afterward",
      ],
      correctAnswer: 0,
      explanation:
        "Controlled changes make it easier to identify the actual cause.",
    },

    {
      type: "puzzle",
      id: "generic-data",
      category: "Reasoning",
      question:
        "A metric improves after a product change. What should you avoid concluding immediately?",
      options: [
        "That the change definitely caused the improvement",
        "That the metric should be inspected",
        "That other variables may matter",
        "That more evidence may be useful",
      ],
      correctAnswer: 0,
      explanation:
        "Correlation alone does not prove causation.",
    },

    {
      type: "puzzle",
      id: "generic-client",
      category: "Client Reasoning",
      question:
        "A client says a project is 'not what I imagined' but gives no specific feedback. What should you do?",
      options: [
        "Ask focused questions and convert the feedback into specific requirements",
        "Argue with the client",
        "Delete the project",
        "Change everything randomly",
      ],
      correctAnswer: 0,
      explanation:
        "Vague feedback needs to be converted into concrete, testable expectations.",
    },

    {
      type: "puzzle",
      id: "generic-risk",
      category: "Risk Management",
      question:
        "A project depends on a third-party service that has frequent outages. What should you consider?",
      options: [
        "Fallbacks, monitoring and the impact of service failure",
        "Ignoring the dependency",
        "Removing all testing",
        "Increasing the logo size",
      ],
      correctAnswer: 0,
      explanation:
        "External dependencies create risks that should be identified and planned for.",
    },
  ],

  coding: [
    {
      type: "coding",
      id: "generic-pseudocode",
      category: "Structured Thinking",
      question:
        "Write a small function that validates a professional profile object.",
      prompt:
        "Require a non-empty name, a non-empty skill and a valid email-like string containing '@'. Return true only when all conditions pass.",
      starterCode:
`function isValidProfile(profile) {
  // Write your solution here

}`,
      requiredPatterns: [
        "function",
        "return",
        "profile",
      ],
      forbiddenPatterns: [
        "eval(",
        "new Function(",
      ],
      explanation:
        "The important part is translating requirements into explicit validation conditions.",
    },
  ],

  written: [
    {
      type: "written",
      id: "generic-client",
      category: "Client Reasoning",
      question:
        "A client cannot clearly explain what they want but expects a professional result. Explain how you would turn the vague request into a clear, testable project requirement.",
    },

    {
      type: "written",
      id: "generic-conflict",
      category: "Professional Communication",
      question:
        "Two collaborators disagree strongly about how a project should be completed. Explain how you would handle the disagreement and reach a practical decision.",
    },
  ],
};

/* =========================================================
   BANK FINDER
========================================================= */

function findChallengeBank(
  skill: string
): ChallengeBank {
  const normalized = skill.toLowerCase();

  if (
    normalized.includes("web development") ||
    normalized.includes("frontend") ||
    normalized.includes("front-end") ||
    normalized.includes("full stack") ||
    normalized.includes("javascript") ||
    normalized.includes("react") ||
    normalized.includes("next.js") ||
    normalized.includes("nextjs")
  ) {
    return webDevelopmentBank;
  }

  return genericBank;
}

/* =========================================================
   TEST GENERATOR
========================================================= */

function createTest(
  skill: string,
  level: string
): GeneratedTest {
  const bank = findChallengeBank(skill);

  /*
    Always:
      6 MCQ
      2 Puzzle
      1 Coding
      1 Written

    = 10 total
    = 9 scored objective questions
  */

  let mcqCount = 6;
  let puzzleCount = 2;

  /*
    Higher levels still receive the same
    assessment structure, but the random
    question pool contains advanced scenarios.
  */

  if (
    level === "Professional" ||
    level === "Senior Professional"
  ) {
    mcqCount = 6;
    puzzleCount = 2;
  }

  const mcqs = pickRandom(
    bank.mcq,
    Math.min(
      mcqCount,
      bank.mcq.length
    )
  );

  const puzzles = pickRandom(
    bank.puzzles,
    Math.min(
      puzzleCount,
      bank.puzzles.length
    )
  );

  const coding = pickRandom(
    bank.coding,
    1
  );

  const written = pickRandom(
    bank.written,
    1
  );

  return {
    questions: shuffle([
      ...mcqs,
      ...puzzles,
      ...coding,
      ...written,
    ]),
  };
}

/* =========================================================
   CODING CHECKER
========================================================= */

function checkCodingAnswer(
  question: CodingQuestion,
  answer: string
): boolean {
  const normalized = answer
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (
    answer.trim().length < 30
  ) {
    return false;
  }

  const requiredPassed =
    question.requiredPatterns.every(
      (pattern) =>
        normalized.includes(
          pattern.toLowerCase()
        )
    );

  if (!requiredPassed) {
    return false;
  }

  const forbiddenFailed =
    question.forbiddenPatterns?.some(
      (pattern) =>
        normalized.includes(
          pattern.toLowerCase()
        )
    ) ?? false;

  if (forbiddenFailed) {
    return false;
  }

  return true;
}

/* =========================================================
   LEVEL HELPER
========================================================= */

function getVerifiedLevel(
  requestedLevel: string,
  correct: number
): string {
  if (correct < PASS_CORRECT) {
    return "Emerging Talent";
  }

  /*
    Do not automatically promote someone beyond
    the level they selected.
  */

  if (
    requestedLevel ===
    "Senior Professional"
  ) {
    return "Senior Professional";
  }

  if (
    requestedLevel ===
    "Professional"
  ) {
    return "Professional";
  }

  if (
    requestedLevel ===
    "Mid-Level Professional"
  ) {
    return "Mid-Level Professional";
  }

  return "Emerging Professional";
}

/* =========================================================
   PAGE
========================================================= */

export default function TestPage() {
  const searchParams =
    useSearchParams();

  const skill =
    searchParams.get("skill") ||
    "General Professional Skills";

  const level =
    searchParams.get("level") ||
    "Emerging Professional";

  const [test, setTest] =
    useState<GeneratedTest | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  const [answers, setAnswers] =
    useState<Record<number, number>>(
      {}
    );

  const [
    codingAnswers,
    setCodingAnswers,
  ] = useState<
    Record<number, string>
  >({});

  const [
    writtenAnswers,
    setWrittenAnswers,
  ] = useState<
    Record<number, string>
  >({});

  const [skipped, setSkipped] =
    useState<Record<number, boolean>>(
      {}
    );

  const [finished, setFinished] =
    useState(false);

  const [result, setResult] =
    useState<TestResult | null>(null);

  const [timeLeft, setTimeLeft] =
    useState(TEST_DURATION);

  const [
    showExplanation,
    setShowExplanation,
  ] = useState(false);

  const [started, setStarted] =
    useState(false);

  const [savingResult, setSavingResult] =
    useState(false);

  /* =====================================================
     CREATE TEST
  ===================================================== */

  useEffect(() => {
    try {
      setLoading(true);
      setError("");

      const generated =
        createTest(
          skill,
          level
        );

      setTest(generated);
      setStarted(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [skill, level]);

  /* =====================================================
     TIMER
  ===================================================== */

  useEffect(() => {
    if (
      !started ||
      finished
    ) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setTimeLeft((previous) =>
          Math.max(
            0,
            previous - 1
          )
        );
      }, 1000);

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    started,
    finished,
    timeLeft,
  ]);

  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  const current =
    test?.questions[
      currentQuestion
    ] ?? null;

  const totalQuestions =
    test?.questions.length ?? 0;

  /* =====================================================
     OBJECTIVE QUESTIONS
  ===================================================== */

  const objectiveQuestions =
    useMemo(() => {
      if (!test) {
        return [];
      }

      return test.questions.filter(
        (question) =>
          question.type !==
          "written"
      );
    }, [test]);

  /* =====================================================
     TIME
  ===================================================== */

  function formatTime(
    seconds: number
  ) {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    return `${minutes
      .toString()
      .padStart(
        2,
        "0"
      )}:${remaining
      .toString()
      .padStart(
        2,
        "0"
      )}`;
  }

  /* =====================================================
     CHOICE ANSWER
  ===================================================== */

  function handleMCQAnswer(
    answerIndex: number
  ) {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]:
        answerIndex,
    }));

    setSkipped((previous) => {
      const copy = {
        ...previous,
      };

      delete copy[
        currentQuestion
      ];

      return copy;
    });

    setShowExplanation(false);
  }

  /* =====================================================
     SKIP
  ===================================================== */

  function skipQuestion() {
    if (
      !test ||
      !current
    ) {
      return;
    }

    setSkipped((previous) => ({
      ...previous,
      [currentQuestion]: true,
    }));

    setShowExplanation(false);

    if (
      currentQuestion <
      totalQuestions - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      return;
    }

    finishTest();
  }

  /* =====================================================
     NEXT
  ===================================================== */

  function nextQuestion() {
    if (
      !current ||
      !test
    ) {
      return;
    }

    if (
      current.type ===
      "written"
    ) {
      const answer =
        writtenAnswers[
          currentQuestion
        ] || "";

      if (
        answer.trim()
          .length < 40
      ) {
        alert(
          "Please write at least 40 characters."
        );

        return;
      }
    }

    if (
      current.type ===
        "coding" &&
      !skipped[
        currentQuestion
      ]
    ) {
      const answer =
        codingAnswers[
          currentQuestion
        ] || "";

      if (
        answer.trim()
          .length < 30
      ) {
        alert(
          "Complete the coding challenge or use Skip Question."
        );

        return;
      }
    }

    if (
      currentQuestion <
      totalQuestions - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      setShowExplanation(false);

      return;
    }

    finishTest();
  }

  /* =====================================================
     FINISH TEST
  ===================================================== */

  async function finishTest() {
    if (
      !test ||
      finished ||
      savingResult
    ) {
      return;
    }

    /*
      Written question is required.
      If timer expires, we allow automatic
      submission without blocking on written length.
    */

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let skippedCount = 0;

    objectiveQuestions.forEach(
      (question) => {
        const index =
          test.questions.indexOf(
            question
          );

        if (
          skipped[index]
        ) {
          skippedCount++;
          return;
        }

        if (
          question.type ===
            "mcq" ||
          question.type ===
            "puzzle"
        ) {
          const answer =
            answers[index];

          if (
            answer ===
            question.correctAnswer
          ) {
            score +=
              CORRECT_MARKS;

            correct++;
          } else {
            score +=
              WRONG_MARKS;

            wrong++;
          }

          return;
        }

        if (
          question.type ===
          "coding"
        ) {
          const answer =
            codingAnswers[
              index
            ] || "";

          const passed =
            checkCodingAnswer(
              question,
              answer
            );

          if (passed) {
            score +=
              CORRECT_MARKS;

            correct++;
          } else {
            score +=
              WRONG_MARKS;

            wrong++;
          }
        }
      }
    );

    score = Math.max(
      0,
      Number(
        score.toFixed(2)
      )
    );

    const percentage =
      Math.round(
        (correct /
          OBJECTIVE_TOTAL) *
          100
      );

    const passed =
      correct >=
      PASS_CORRECT;

    const verifiedLevel =
      getVerifiedLevel(
        level,
        correct
      );

    const testResult:
      TestResult = {
      passed,
      score,
      maxScore:
        OBJECTIVE_TOTAL,
      percentage,
      correct,
      wrong,
      skipped:
        skippedCount,
      total:
        OBJECTIVE_TOTAL,
      level:
        verifiedLevel,
      skill,
      completedAt:
        new Date().toISOString(),
    };

    setSavingResult(true);

    try {
      localStorage.setItem(
        "triangles_test_result",
        JSON.stringify(
          testResult
        )
      );

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (user) {
        const {
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .update({
              skill,
              test_score:
                percentage,
              verified:
                passed,
              professional_level:
                verifiedLevel,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              user.id
            );

        if (
          profileError
        ) {
          console.error(
            "Profile update failed:",
            profileError
          );
        }
      }
    } catch (error) {
      console.error(
        "Could not save test result:",
        error
      );
    } finally {
      setResult(
        testResult
      );

      setFinished(
        true
      );

      setSavingResult(
        false
      );
    }
  }

  /* =====================================================
     AUTO SUBMIT WHEN TIMER EXPIRES
  ===================================================== */

  useEffect(() => {
    if (
      !started ||
      finished ||
      !test ||
      timeLeft > 0
    ) {
      return;
    }

    finishTest();
  }, [
    timeLeft,
    started,
    finished,
    test,
  ]);

  /* =====================================================
     RETRY
  ===================================================== */

  function retryTest() {
    window.location.reload();
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundColor:
            BG,
          color:
            DARK_GREEN,
        }}
      >
        <LoadingLogo
          size={64}
          text="Building your assessment"
          fullScreen={false}
        />
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error ||
    !test
  ) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          backgroundColor:
            BG,
          color:
            DARK_GREEN,
        }}
      >
        <div
          className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm"
          style={{
            borderColor:
              BORDER,
          }}
        >
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{
              border:
                "1px solid #E5B8B8",
              color:
                RED,
              backgroundColor:
                "#FFF7F7",
            }}
          >
            !
          </div>

          <h1 className="text-2xl font-semibold">
            Test could not be created
          </h1>

          <p
            className="mt-3 text-sm leading-6"
            style={{
              color:
                MUTED,
            }}
          >
            {error ||
              "Something went wrong while creating your assessment."}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-7 w-full rounded-xl px-5 py-3 font-semibold text-white transition hover:opacity-90"
            style={{
              backgroundColor:
                GREEN,
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =====================================================
     RESULT
  ===================================================== */

  if (
    finished &&
    result
  ) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-5 py-12"
        style={{
          backgroundColor:
            BG,
          color:
            DARK_GREEN,
        }}
      >
        <div
          className="w-full max-w-xl rounded-3xl border bg-white p-7 shadow-sm sm:p-10"
          style={{
            borderColor:
              BORDER,
          }}
        >
          {/* BRAND */}

          <div className="text-center">
            <img
              src="/triangles-logo.png"
              alt="TRIANGLES"
              className="mx-auto h-16 w-16 object-contain"
            />

            <p
              className="mt-5 text-xs uppercase tracking-[0.25em]"
              style={{
                color:
                  GREEN,
              }}
            >
              TRIANGLES Verification
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              {result.passed
                ? "Verification Passed"
                : "Verification Not Passed"}
            </h1>

            <p
              className="mt-2 text-sm"
              style={{
                color:
                  MUTED,
              }}
            >
              {result.passed
                ? "Your assessment met the required verification threshold."
                : "Your assessment did not meet the required verification threshold."}
            </p>
          </div>

          {/* SCORE */}

          <div
            className="mt-8 rounded-3xl border p-7 text-center"
            style={{
              borderColor:
                BORDER,
              backgroundColor:
                SOFT,
            }}
          >
            <p
              className="text-xs uppercase tracking-[0.2em]"
              style={{
                color:
                  "#9A958A",
              }}
            >
              Verification Score
            </p>

            <p
              className="mt-2 text-5xl font-semibold"
              style={{
                color:
                  GREEN,
              }}
            >
              {result.correct}/9
            </p>

            <p
              className="mt-2 text-sm"
              style={{
                color:
                  MUTED,
              }}
            >
              {result.percentage}%
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl border bg-white p-4"
                style={{
                  borderColor:
                    BORDER,
                }}
              >
                <p
                  className="text-xl font-semibold"
                  style={{
                    color:
                      GREEN,
                  }}
                >
                  {result.correct}
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Correct
                </p>
              </div>

              <div
                className="rounded-2xl border bg-white p-4"
                style={{
                  borderColor:
                    BORDER,
                }}
              >
                <p
                  className="text-xl font-semibold"
                  style={{
                    color:
                      RED,
                  }}
                >
                  {result.wrong}
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Wrong
                </p>
              </div>

              <div
                className="rounded-2xl border bg-white p-4"
                style={{
                  borderColor:
                    BORDER,
                }}
              >
                <p
                  className="text-xl font-semibold"
                  style={{
                    color:
                      MUTED,
                  }}
                >
                  {result.skipped}
                </p>

                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Skipped
                </p>
              </div>
            </div>
          </div>

          {/* DETAILS */}

          <div
            className="mt-5 rounded-2xl border p-5"
            style={{
              borderColor:
                BORDER,
            }}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p
                  className="text-xs"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Skill
                </p>

                <p className="mt-1 font-medium">
                  {result.skill}
                </p>
              </div>

              <div className="text-right">
                <p
                  className="text-xs"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Professional Level
                </p>

                <p
                  className="mt-1 font-medium"
                  style={{
                    color:
                      result.passed
                        ? GREEN
                        : RED,
                  }}
                >
                  {result.level}
                </p>
              </div>
            </div>
          </div>

          {/* VERIFICATION STATUS */}

          <div
            className="mt-5 rounded-2xl border p-5"
            style={{
              borderColor:
                result.passed
                  ? "#CFE1D9"
                  : "#E5B8B8",
              backgroundColor:
                result.passed
                  ? "#F3F8F5"
                  : "#FFF7F7",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    result.passed
                      ? GREEN
                      : "#FFF",
                  color:
                    result.passed
                      ? "#FFF"
                      : RED,
                  border:
                    result.passed
                      ? "none"
                      : "1px solid #E5B8B8",
                }}
              >
                {result.passed
                  ? "✓"
                  : "!"}
              </div>

              <div>
                <p
                  className="font-semibold"
                  style={{
                    color:
                      result.passed
                        ? GREEN
                        : RED,
                  }}
                >
                  {result.passed
                    ? "Professional verification active"
                    : "Verification not completed"}
                </p>

                <p
                  className="mt-1 text-sm leading-6"
                  style={{
                    color:
                      MUTED,
                  }}
                >
                  {result.passed
                    ? "Your professional profile has been updated with the verified result."
                    : "Your professional level remains Emerging Talent until the required threshold is achieved."}
                </p>
              </div>
            </div>
          </div>

          {/* SCORING */}

          <div
            className="mt-5 rounded-2xl border p-5"
            style={{
              borderColor:
                BORDER,
              backgroundColor:
                SOFT,
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{
                color:
                  DARK_GREEN,
              }}
            >
              Assessment scoring
            </p>

            <div
              className="mt-3 space-y-2 text-sm"
              style={{
                color:
                  MUTED,
              }}
            >
              <p>
                Correct answer:{" "}
                <strong
                  style={{
                    color:
                      GREEN,
                  }}
                >
                  +1.00
                </strong>
              </p>

              <p>
                Wrong answer:{" "}
                <strong
                  style={{
                    color:
                      RED,
                  }}
                >
                  −0.25
                </strong>
              </p>

              <p>
                Skipped question:{" "}
                <strong>
                  0.00
                </strong>
              </p>

              <p>
                Verification threshold:{" "}
                <strong
                  style={{
                    color:
                      DARK_GREEN,
                  }}
                >
                  7 / 9 correct
                </strong>
              </p>
            </div>
          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col gap-3">
            <a
              href="/dashboard/profile"
              className="w-full rounded-xl px-5 py-3.5 text-center font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  GREEN,
              }}
            >
              Return to Professional Profile
            </a>

            <button
              onClick={
                retryTest
              }
              className="w-full rounded-xl border px-5 py-3.5 font-medium transition hover:bg-[#FCFBF8]"
              style={{
                borderColor:
                  "#D9D1C4",
                color:
                  DARK_GREEN,
              }}
            >
              Take Another Test
            </button>
          </div>

          {/* DECORATION */}

          <div className="mt-9 flex items-center justify-center gap-3">
            <span
              className="h-px w-16"
              style={{
                backgroundColor:
                  "#E2D6C5",
              }}
            />

            <span
              className="h-2 w-2 rotate-45"
              style={{
                backgroundColor:
                  SAND,
              }}
            />

            <span
              className="h-px w-16"
              style={{
                backgroundColor:
                  "#E2D6C5",
              }}
            />
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  if (!current) {
    return null;
  }

  const selected =
    answers[currentQuestion];

  const codingValue =
    codingAnswers[
      currentQuestion
    ] || "";

  const writtenValue =
    writtenAnswers[
      currentQuestion
    ] || "";

  const progress =
    ((currentQuestion + 1) /
      totalQuestions) *
    100;

  const isChoiceQuestion =
    current.type === "mcq" ||
    current.type === "puzzle";

  const choiceAnswered =
    isChoiceQuestion &&
    selected !== undefined;

  const isSkipped =
    skipped[
      currentQuestion
    ] === true;

  const codingPassed =
    current.type ===
      "coding" &&
    checkCodingAnswer(
      current,
      codingValue
    );

  /* =====================================================
     ANSWERED COUNT
  ===================================================== */

  const answeredCount =
    Object.keys(
      answers
    ).length +
    Object.keys(
      codingAnswers
    ).filter(
      (key) =>
        codingAnswers[
          Number(key)
        ]?.trim()
          .length > 0
    ).length +
    Object.keys(
      writtenAnswers
    ).filter(
      (key) =>
        writtenAnswers[
          Number(key)
        ]?.trim()
          .length >= 40
    ).length;

  const skippedCount =
    Object.keys(
      skipped
    ).length;

  /* =====================================================
     QUESTION PAGE
  ===================================================== */

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-10"
      style={{
        backgroundColor:
          BG,
        color:
          DARK_GREEN,
      }}
    >
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}

        <header
          className="rounded-3xl border bg-white px-5 py-5 shadow-sm sm:px-7"
          style={{
            borderColor:
              BORDER,
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  border:
                    `1px solid ${SAND}`,
                  backgroundColor:
                    SOFT,
                }}
              >
                <img
                  src="/triangles-logo.png"
                  alt="TRIANGLES"
                  className="h-9 w-9 object-contain"
                />
              </div>

              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.25em]"
                  style={{
                    color:
                      GREEN,
                  }}
                >
                  TRIANGLES Verification
                </p>

                <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
                  {skill}
                </h1>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color:
                      MUTED,
                  }}
                >
                  {level}
                </p>
              </div>
            </div>

            {/* TIMER */}

            <div
              className="rounded-2xl border px-5 py-3 text-center"
              style={{
                borderColor:
                  timeLeft <= 60
                    ? "#E5B8B8"
                    : BORDER,
                backgroundColor:
                  timeLeft <= 60
                    ? "#FFF7F7"
                    : SOFT,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                Time remaining
              </p>

              <p
                className="mt-1 text-xl font-semibold"
                style={{
                  color:
                    timeLeft <= 60
                      ? RED
                      : GREEN,
                }}
              >
                {formatTime(
                  timeLeft
                )}
              </p>
            </div>
          </div>

          {/* STATS */}

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div
              className="rounded-2xl border p-3 text-center"
              style={{
                borderColor:
                  BORDER,
                backgroundColor:
                  SOFT,
              }}
            >
              <p
                className="text-lg font-semibold"
                style={{
                  color:
                    DARK_GREEN,
                }}
              >
                {currentQuestion +
                  1}
              </p>

              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                Current
              </p>
            </div>

            <div
              className="rounded-2xl border p-3 text-center"
              style={{
                borderColor:
                  BORDER,
                backgroundColor:
                  SOFT,
              }}
            >
              <p
                className="text-lg font-semibold"
                style={{
                  color:
                    GREEN,
                }}
              >
                {answeredCount}
              </p>

              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                Answered
              </p>
            </div>

            <div
              className="rounded-2xl border p-3 text-center"
              style={{
                borderColor:
                  BORDER,
                backgroundColor:
                  SOFT,
              }}
            >
              <p
                className="text-lg font-semibold"
                style={{
                  color:
                    MUTED,
                }}
              >
                {skippedCount}
              </p>

              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                Skipped
              </p>
            </div>
          </div>
        </header>

        {/* PROGRESS */}

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs">
            <span
              style={{
                color:
                  MUTED,
              }}
            >
              Question{" "}
              {currentQuestion +
                1}{" "}
              of{" "}
              {totalQuestions}
            </span>

            <span
              style={{
                color:
                  GREEN,
              }}
            >
              {Math.round(
                progress
              )}
              %
            </span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{
              backgroundColor:
                "#E8E2D8",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  GREEN,
              }}
            />
          </div>
        </div>

        {/* QUESTION CARD */}

        <section
          className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-8"
          style={{
            borderColor:
              BORDER,
          }}
        >
          {/* SKIPPED */}

          {isSkipped && (
            <div
              className="mb-6 rounded-2xl border px-4 py-3 text-sm"
              style={{
                borderColor:
                  BORDER,
                backgroundColor:
                  SOFT,
                color:
                  MUTED,
              }}
            >
              This question was skipped.
              <span
                className="ml-1 font-medium"
                style={{
                  color:
                    DARK_GREEN,
                }}
              >
                No marks gained or lost.
              </span>
            </div>
          )}

          {/* MCQ / PUZZLE */}

          {isChoiceQuestion && (
            <>
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  {current.type ===
                  "puzzle"
                    ? "Logic / Debugging"
                    : "Advanced Multiple Choice"}
                </p>

                <span
                  className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor:
                      "#CFE1D9",
                    color:
                      GREEN,
                    backgroundColor:
                      "#F3F8F5",
                  }}
                >
                  +1 / −0.25
                </span>
              </div>

              <p
                className="mt-3 text-xs"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                {current.category}
              </p>

              <h2 className="mt-5 text-xl font-semibold leading-relaxed sm:text-2xl">
                {current.question}
              </h2>

              <div className="mt-8 space-y-3">
                {current.options.map(
                  (
                    option,
                    index
                  ) => {
                    const isSelected =
                      selected ===
                      index;

                    return (
                      <button
                        key={index}
                        disabled={
                          isSkipped
                        }
                        onClick={() =>
                          handleMCQAnswer(
                            index
                          )
                        }
                        className="w-full rounded-2xl border p-4 text-left transition hover:-translate-y-[1px]"
                        style={{
                          borderColor:
                            isSelected
                              ? GREEN
                              : BORDER,
                          backgroundColor:
                            isSelected
                              ? "#F1F7F4"
                              : "#FFFFFF",
                          opacity:
                            isSkipped
                              ? 0.55
                              : 1,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium"
                            style={{
                              borderColor:
                                isSelected
                                  ? GREEN
                                  : "#D9D1C4",
                              color:
                                isSelected
                                  ? GREEN
                                  : MUTED,
                              backgroundColor:
                                isSelected
                                  ? "#FFFFFF"
                                  : SOFT,
                            }}
                          >
                            {String.fromCharCode(
                              65 +
                                index
                            )}
                          </div>

                          <span
                            className="text-sm sm:text-base"
                            style={{
                              color:
                                DARK_GREEN,
                            }}
                          >
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {choiceAnswered &&
                !isSkipped && (
                  <button
                    onClick={() =>
                      setShowExplanation(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                    className="mt-5 text-xs font-medium"
                    style={{
                      color:
                        GREEN,
                    }}
                  >
                    {showExplanation
                      ? "Hide reasoning"
                      : "Show reasoning"}
                  </button>
                )}

              {showExplanation &&
                !isSkipped && (
                  <div
                    className="mt-4 rounded-2xl border p-4 text-sm leading-6"
                    style={{
                      borderColor:
                        BORDER,
                      backgroundColor:
                        SOFT,
                      color:
                        MUTED,
                    }}
                  >
                    {current.explanation}
                  </div>
                )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={
                    skipQuestion
                  }
                  className="w-full rounded-xl border px-5 py-3.5 font-medium transition hover:bg-[#FCFBF8]"
                  style={{
                    borderColor:
                      "#D9D1C4",
                    color:
                      MUTED,
                  }}
                >
                  Skip Question
                </button>

                <button
                  onClick={
                    nextQuestion
                  }
                  disabled={
                    !choiceAnswered &&
                    !isSkipped
                  }
                  className="w-full rounded-xl px-5 py-3.5 font-semibold text-white transition"
                  style={{
                    backgroundColor:
                      choiceAnswered ||
                      isSkipped
                        ? GREEN
                        : "#B9C8C2",
                  }}
                >
                  {currentQuestion ===
                  totalQuestions -
                    1
                    ? "Submit Assessment"
                    : "Next Challenge"}
                </button>
              </div>
            </>
          )}

          {/* CODING */}

          {current.type ===
            "coding" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Coding Challenge
                </p>

                <span
                  className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor:
                      "#CFE1D9",
                    color:
                      GREEN,
                    backgroundColor:
                      "#F3F8F5",
                  }}
                >
                  +1 / −0.25
                </span>
              </div>

              <p
                className="mt-3 text-xs"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                {current.category}
              </p>

              <h2 className="mt-5 text-xl font-semibold leading-relaxed sm:text-2xl">
                {current.question}
              </h2>

              <div
                className="mt-5 rounded-2xl border p-5"
                style={{
                  borderColor:
                    BORDER,
                  backgroundColor:
                    SOFT,
                }}
              >
                <p
                  className="text-sm leading-6"
                  style={{
                    color:
                      MUTED,
                  }}
                >
                  {current.prompt}
                </p>
              </div>

              <div
                className="mt-6 overflow-hidden rounded-2xl border"
                style={{
                  borderColor:
                    "#D9D1C4",
                }}
              >
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    borderColor:
                      BORDER,
                    backgroundColor:
                      "#F5F2EC",
                  }}
                >
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{
                      color:
                        MUTED,
                    }}
                  >
                    JavaScript
                  </span>

                  <span
                    className="text-xs"
                    style={{
                      color:
                        codingPassed
                          ? GREEN
                          : "#9A958A",
                    }}
                  >
                    {codingPassed
                      ? "Structure detected"
                      : "Incomplete"}
                  </span>
                </div>

                <textarea
                  value={
                    codingValue
                  }
                  onChange={(
                    event
                  ) => {
                    setCodingAnswers(
                      (
                        previous
                      ) => ({
                        ...previous,
                        [currentQuestion]:
                          event
                            .target
                            .value,
                      })
                    );

                    setSkipped(
                      (
                        previous
                      ) => {
                        const copy =
                          {
                            ...previous,
                          };

                        delete copy[
                          currentQuestion
                        ];

                        return copy;
                      }
                    );
                  }}
                  spellCheck={false}
                  rows={18}
                  className="w-full resize-none bg-[#17211E] p-5 font-mono text-sm leading-6 text-[#F4F1E9] outline-none placeholder:text-[#8E9A95]"
                  placeholder={
                    current.starterCode
                  }
                />
              </div>

              <p
                className="mt-3 text-xs leading-5"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                Correct structure =
                +1. Incorrect submitted
                solution = −0.25.
                Skipping = 0.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={
                    skipQuestion
                  }
                  className="w-full rounded-xl border px-5 py-3.5 font-medium transition hover:bg-[#FCFBF8]"
                  style={{
                    borderColor:
                      "#D9D1C4",
                    color:
                      MUTED,
                  }}
                >
                  Skip Question
                </button>

                <button
                  onClick={
                    nextQuestion
                  }
                  className="w-full rounded-xl px-5 py-3.5 font-semibold text-white transition hover:opacity-90"
                  style={{
                    backgroundColor:
                      GREEN,
                  }}
                >
                  {currentQuestion ===
                  totalQuestions -
                    1
                    ? "Submit Assessment"
                    : "Continue"}
                </button>
              </div>
            </>
          )}

          {/* WRITTEN */}

          {current.type ===
            "written" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <p
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  Professional Scenario
                </p>

                <span
                  className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor:
                      BORDER,
                    color:
                      MUTED,
                  }}
                >
                  Written
                </span>
              </div>

              <p
                className="mt-3 text-xs"
                style={{
                  color:
                    "#9A958A",
                }}
              >
                {current.category}
              </p>

              <h2 className="mt-5 text-xl font-semibold leading-relaxed sm:text-2xl">
                {current.question}
              </h2>

              <p
                className="mt-3 text-sm leading-6"
                style={{
                  color:
                    MUTED,
                }}
              >
                Explain your reasoning clearly.
                Focus on the decisions you would
                make and why.
              </p>

              <textarea
                value={
                  writtenValue
                }
                onChange={(
                  event
                ) =>
                  setWrittenAnswers(
                    (
                      previous
                    ) => ({
                      ...previous,
                      [currentQuestion]:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Write your professional response..."
                rows={10}
                className="mt-7 w-full resize-none rounded-2xl border bg-[#FCFBF8] p-5 text-sm outline-none transition focus:bg-white"
                style={{
                  borderColor:
                    "#D9D1C4",
                  color:
                    DARK_GREEN,
                }}
              />

              <div className="mt-3 flex justify-between text-xs">
                <span
                  style={{
                    color:
                      "#9A958A",
                  }}
                >
                  {writtenValue.length}{" "}
                  characters
                </span>

                <span
                  style={{
                    color:
                      writtenValue.length >=
                      40
                        ? GREEN
                        : "#9A958A",
                  }}
                >
                  Minimum: 40
                </span>
              </div>

              <button
                onClick={
                  nextQuestion
                }
                className="mt-8 w-full rounded-xl px-5 py-3.5 font-semibold text-white transition hover:opacity-90"
                style={{
                  backgroundColor:
                    GREEN,
                }}
              >
                {currentQuestion ===
                totalQuestions -
                  1
                  ? "Submit Assessment"
                  : "Continue"}
              </button>
            </>
          )}
        </section>

        {/* SCORING INFO */}

        <div
          className="mt-5 rounded-2xl border bg-white px-5 py-4"
          style={{
            borderColor:
              BORDER,
          }}
        >
          <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <span
                style={{
                  color:
                    GREEN,
                }}
              >
                ✓ Correct +1
              </span>

              <span
                style={{
                  color:
                    RED,
                }}
              >
                ✕ Wrong −0.25
              </span>

              <span
                style={{
                  color:
                    MUTED,
                }}
              >
                — Skip 0
              </span>
            </div>

            <span
              style={{
                color:
                  "#9A958A",
              }}
            >
              7 / 9 correct required for verification.
            </span>
          </div>
        </div>

        {/* FOOTER */}

        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            className="h-px w-16"
            style={{
              backgroundColor:
                "#E2D6C5",
            }}
          />

          <span
            className="h-2 w-2 rotate-45"
            style={{
              backgroundColor:
                SAND,
            }}
          />

          <span
            className="h-px w-16"
            style={{
              backgroundColor:
                "#E2D6C5",
            }}
          />
        </div>

        <p
          className="mt-4 text-center text-xs"
          style={{
            color:
              "#9A958A",
          }}
        >
          TRIANGLES · Real Skills. Real People.
        </p>
      </div>
    </main>
  );
}