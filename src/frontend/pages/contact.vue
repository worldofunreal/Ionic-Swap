<template>
  <div
    class="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center py-16 px-4 pt-32"
  >
    <div
      class="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-10 items-stretch justify-center min-h-[70vh]"
    >
      <!-- Info Section -->
      <div
        class="flex-1 flex flex-col justify-center mb-8 md:mb-0 md:pr-8 items-center md:items-start text-center md:text-left"
      >
        <div
          class="mb-6 flex flex-col items-center md:items-start gap-6 w-full"
        >
          <img
            src="/logo.svg"
            alt="Ionic Swap Logo"
            class="h-12 md:h-16 w-auto mx-auto md:mx-0"
          >
          <div class="w-full">
            <p
              class="uppercase tracking-widest text-xs text-zinc-500 dark:text-zinc-300 font-semibold mb-2"
            >
              We're here to help you
            </p>
            <h1
              class="text-3xl md:text-4xl font-black text-zinc-800 dark:text-white mb-4 leading-tight"
            >
              Say Hi!
              <span class="text-primary-600 dark:text-primary-400"
                >and tell us about your ideas.</span
              >
            </h1>
            <p class="text-zinc-600 dark:text-zinc-300 mb-6">
              Are you looking for top-quality development, AI agents, or Web3
              solutions tailored to your needs? Reach out to us.
            </p>
          </div>
        </div>
        <div class="flex flex-col gap-4 text-base items-center md:items-start">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-fa6-solid-envelope"
              class="text-primary-600 dark:text-primary-400 text-xl"
            />
            <span class="font-medium">contact@worldofunreal.com</span>
          </div>
          <div class="flex items-center gap-3 mt-2">
            <a
              href="https://x.com/worldofunreal"
              target="_blank"
              rel="noopener"
              class="text-zinc-300 hover:text-primary transition-colors text-xl"
              aria-label="Twitter"
            >
              <UIcon name="i-fa6-brands-twitter" />
            </a>
            <a
              href="https://github.com/worldofunreal"
              target="_blank"
              rel="noopener"
              class="text-zinc-300 hover:text-primary transition-colors text-xl"
              aria-label="GitHub"
            >
              <UIcon name="i-fa6-brands-github" />
            </a>
            <a
              href="https://www.linkedin.com/company/worldofunreal/"
              target="_blank"
              rel="noopener"
              class="text-zinc-300 hover:text-primary transition-colors text-xl"
              aria-label="LinkedIn"
            >
              <UIcon name="i-fa6-brands-linkedin" />
            </a>
          </div>
        </div>
      </div>
      <!-- Form Section -->
      <div class="flex-1 flex items-center justify-center">
        <div
          class="bg-zinc-50 dark:bg-neutral-800 rounded-2xl shadow-xl p-8 md:p-12 flex flex-col gap-8 border border-zinc-200 dark:border-zinc-700 w-full max-w-lg mx-auto"
        >
          <div class="text-center md:text-left">
            <h2
              class="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-white mb-2"
            >
              Get in touch
            </h2>
            <p class="text-zinc-600 dark:text-zinc-300">
              We'd love to hear from you!
            </p>
          </div>
          <UForm :state="state" class="space-y-6" @submit="onSubmit">
            <div class="grid grid-cols-1 gap-5">
              <UFormField label="Name" name="name">
                <UInput
                  v-model="state.name"
                  placeholder="Your name"
                  size="lg"
                  class="w-full dark:bg-neutral-700 dark:text-white dark:border-zinc-600 dark:focus:ring-primary"
                />
              </UFormField>
              <UFormField label="Email" name="email">
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="your@email.com"
                  size="lg"
                  class="w-full dark:bg-neutral-700 dark:text-white dark:border-zinc-600 dark:focus:ring-primary"
                />
              </UFormField>
              <UFormField label="Company" name="company">
                <UInput
                  v-model="state.company"
                  placeholder="Your company"
                  size="lg"
                  class="w-full dark:bg-neutral-700 dark:text-white dark:border-zinc-600 dark:focus:ring-primary"
                />
              </UFormField>
              <UFormField label="Message" name="message">
                <UTextarea
                  v-model="state.message"
                  placeholder="Tell us about your inquiry..."
                  :rows="4"
                  size="lg"
                  class="w-full dark:bg-neutral-700 dark:text-white dark:border-zinc-600 dark:focus:ring-primary"
                />
              </UFormField>
            </div>
            <UButton
              type="submit"
              color="primary"
              size="lg"
              class="w-full font-medium mt-4"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              <UIcon name="i-fa6-solid-paper-plane" class="mr-2" />
              Send Message
            </UButton>
          </UForm>
          <div
            class="text-center text-sm text-zinc-500 dark:text-zinc-300 mt-2"
          >
            We'll get back to you within 5-7 business days.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  const toast = useToast()
  const isSubmitting = ref(false)

  const state = reactive({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  async function onSubmit() {
    isSubmitting.value = true
    try {
      await $fetch('/api/contact', {
        method: 'POST',
        body: state,
      })

      toast.add({
        title: 'Message received!',
        description:
          "We've received your message and will get back to you soon.",
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })

      // Reset form
      state.name = ''
      state.email = ''
      state.company = ''
      state.message = ''
    } catch {
      toast.add({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
    } finally {
      isSubmitting.value = false
    }
  }
</script>
