import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const skill = body.skill?.trim();
    const level = body.level?.trim();

    if (!skill || !level) {
      return NextResponse.json(
        { error: "Skill and professional level are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const prompt = `
Create a professional skill assessment.

Skill: ${skill}
Professional Level: ${level}

Create exactly 10 questions:
- Questions 1-9: multiple choice
- Question 10: practical written question
- Each MCQ must have exactly 4 options
- Only one option is correct
- Questions must be original
- Questions must match the selected skill and level

Return ONLY valid JSON:

{
  "skill": "${skill}",
  "level": "${level}",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0
    }
  ],
  "writtenQuestion": {
    "id": 10,
    "type": "written",
    "question": "Practical question"
  }
}

correctAnswer:
0 = first option
1 = second option
2 = third option
3 = fourth option
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = response.output_text;

    if (!text) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 500 }
      );
    }

    let test;

    try {
      test = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: "OpenAI returned invalid JSON.",
          raw: text.slice(0, 500),
        },
        { status: 500 }
      );
    }

    if (
      !test.questions ||
      !Array.isArray(test.questions) ||
      test.questions.length !== 9 ||
      !test.writtenQuestion
    ) {
      return NextResponse.json(
        { error: "Invalid test structure returned by OpenAI." },
        { status: 500 }
      );
    }

    return NextResponse.json(test);
  } catch (error: unknown) {
    console.error("GENERATE TEST ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}