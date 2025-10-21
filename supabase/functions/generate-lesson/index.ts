import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  lessonId: string;
  outline: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!openaiApiKey) {
      throw new Error("Missing OpenAI API key");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { lessonId, outline }: RequestBody = await req.json();

    if (!lessonId || !outline) {
      throw new Error("Missing required fields");
    }

    const systemPrompt = `You are an expert educational content creator specializing in creating interactive, engaging lessons for students. Your task is to generate a React component in TypeScript that renders an educational lesson based on the provided outline.

IMPORTANT REQUIREMENTS:
1. Generate ONLY valid TypeScript/React code
2. The code must export a default function component
3. Use inline styles or Tailwind CSS classes for styling
4. Make the lesson visually appealing and engaging for students
5. Include interactive elements when appropriate (buttons, inputs, etc.)
6. Use appropriate educational formatting (headings, lists, examples, etc.)
7. For quizzes, include answer checking functionality with feedback
8. Make sure all code is production-ready and will compile without errors
9. Do not use external imports except React hooks (useState, useEffect, etc.)
10. The component should be self-contained and render immediately

Example structure:
export default function Lesson() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">Lesson Title</h1>
      {/* Lesson content here */}
    </div>
  );
}`;

    const userPrompt = `Create an interactive educational lesson based on this outline:\n\n${outline}\n\nGenerate complete, production-ready TypeScript/React code that will render beautifully in the browser. Make it engaging and educational for students.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    let generatedContent = openaiData.choices[0].message.content;

    generatedContent = generatedContent.replace(/```typescript\n?/g, "").replace(/```tsx\n?/g, "").replace(/```javascript\n?/g, "").replace(/```jsx\n?/g, "").replace(/```\n?/g, "");
    generatedContent = generatedContent.trim();

    if (!generatedContent.includes("export default")) {
      throw new Error("Generated content does not include a default export");
    }

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        content: generatedContent,
        status: "generated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        lessonId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating lesson:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});