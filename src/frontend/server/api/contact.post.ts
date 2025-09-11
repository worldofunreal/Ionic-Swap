import { readBody } from 'h3'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { firstName, lastName, email, company, projectType, message } = body

  // Compose the Discord message
  const content = [
    `**New Contact Form Submission**`,
    `**Name:** ${firstName} ${lastName}`,
    `**Email:** ${email}`,
    company ? `**Company:** ${company}` : '',
    projectType ? `**Project Type:** ${projectType}` : '',
    `**Message:**\n${message}`,
  ]
    .filter(Boolean)
    .join('\n')

  // Send to Discord webhook
  const webhookUrl =
    'https://discord.com/api/webhooks/1396853496275537952/y5cmYXCQB4Naw5lnZtN7EArHDNXGj_QgMu_1NR-1r9Mc5pARD--zqLWnOTOVIZ-oPv10'
  await $fetch(webhookUrl, {
    method: 'POST',
    body: { content },
  })

  return { success: true }
})
