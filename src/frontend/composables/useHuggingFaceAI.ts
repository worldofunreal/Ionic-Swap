import { useRuntimeConfig } from '#imports'

const INITIAL_PROMPT_TEMPLATE = `You are an expert productivity assistant. Your job is to help me break down ideas into clear, actionable tasks.

Here is a raw idea from my brainstorm:
"{{idea}}"

First, analyze if this idea is clear and actionable enough to break down into tasks. If it's vague or unclear, ask ONE specific clarifying question to help me provide more context.

If the idea is clear and actionable, break it down into 2-5 specific, actionable tasks.

Format your response as either:
1. A numbered list of tasks (if the idea is clear)
2. A single clarifying question (if the idea needs more context)

Keep it concise and focused.`

const BREAKDOWN_PROMPT_TEMPLATE = `You are an expert productivity assistant. Based on the following idea and my answer, break down the idea into a list of clear, actionable steps. Format your response as a numbered list, and keep it extremely short and focused.

Idea: "{{idea}}"
User answer: "{{answer}}"

Output only the breakdown as a numbered list. Do not add any extra explanation or questions.`

const FILTERING_PROMPT_TEMPLATE = `You are an expert productivity assistant inspired by the "signal-to-noise" philosophy of Steve Jobs and Elon Musk. Your job is to help me prioritize my actionable tasks.

Here are my candidate tasks (with subtasks):
{{tasks}}

- Based on the signal-to-noise philosophy, suggest which 3–5 tasks are the most impactful and actionable to focus on.
- Briefly explain your reasoning for each suggestion (1–2 sentences max per task).
- Only output a numbered list of the top 3–5 tasks, each with a short reason. Do not add extra explanation or questions.
- Be concise and direct. Do not repeat the input.
`

const TASK_BREAKDOWN_PROMPT_TEMPLATE = `You are an expert productivity assistant. Break down this task into specific, actionable steps.

Task: "{{task}}"

Provide a numbered list of 2-5 specific action steps. Each step should be clear and actionable.

Format your response as a simple numbered list. Do not include tool suggestions or extra explanations.

Example format:
1. Research current project management methodologies
2. Create a project timeline template
3. Set up milestone tracking system

Be specific and actionable. Keep it simple.`

const TASK_TOOLS_PROMPT_TEMPLATE = `You are an expert productivity assistant. The user is working on this task and needs specific tools or approaches to help them move forward.

Task: "{{task}}"
User question: "{{question}}"

Provide 2-3 specific, actionable tools, apps, or approaches that would help them complete this task. Be concrete and practical. Don't ask follow-up questions - give them actionable recommendations.

Format as a simple list with brief explanations.`

export async function useHuggingFaceAI(idea: string): Promise<string> {
  const config = useRuntimeConfig()
  const HF_TOKEN = config.public.HF_TOKEN

  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured')
  }

  const prompt = INITIAL_PROMPT_TEMPLATE.replace('{{idea}}', idea)

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.generated_text || ''
}

export async function useHuggingFaceAIBreakdown(
  idea: string,
  answer: string
): Promise<string> {
  const config = useRuntimeConfig()
  const HF_TOKEN = config.public.HF_TOKEN

  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured')
  }

  const prompt = BREAKDOWN_PROMPT_TEMPLATE.replace('{{idea}}', idea).replace(
    '{{answer}}',
    answer
  )

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.generated_text || ''
}

export async function useHuggingFaceAIFiltering(
  tasks: { title: string; subtasks?: string[] }[],
  jsonOrder?: boolean
): Promise<string> {
  const config = useRuntimeConfig()
  const HF_TOKEN = config.public.HF_TOKEN

  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured')
  }

  const formattedTasks = tasks
    .map((t, i) => {
      let s = `${i + 1}. ${t.title}`
      if (t.subtasks && t.subtasks.length) {
        s += `\n   - Subtasks: ${t.subtasks.join('; ')}`
      }
      return s
    })
    .join('\n')

  let prompt = FILTERING_PROMPT_TEMPLATE.replace('{{tasks}}', formattedTasks)
  if (jsonOrder) {
    prompt +=
      '\nAfter your explanation, output a JSON array of the subtask texts in the suggested order, e.g. ["subtask1", "subtask2", ...]'
  }

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.generated_text || ''
}

export async function useHuggingFaceTaskBreakdown(
  task: string
): Promise<string> {
  const config = useRuntimeConfig()
  const HF_TOKEN = config.public.HF_TOKEN

  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured')
  }

  const prompt = TASK_BREAKDOWN_PROMPT_TEMPLATE.replace('{{task}}', task)

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.generated_text || ''
}

export async function useHuggingFaceTaskTools(
  task: string,
  question: string
): Promise<string> {
  const config = useRuntimeConfig()
  const HF_TOKEN = config.public.HF_TOKEN

  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured')
  }

  const prompt = TASK_TOOLS_PROMPT_TEMPLATE.replace('{{task}}', task).replace(
    '{{question}}',
    question
  )

  const response = await fetch(
    'https://router.huggingface.co/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.generated_text || ''
}
