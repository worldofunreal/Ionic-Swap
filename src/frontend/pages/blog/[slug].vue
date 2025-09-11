<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { useHead, useAsyncData } from '#imports'

  interface BlogPost {
    _path: string
    title: string
    description: string
    date: string
    image: string
    category: string
    tags: string[]
  }

  const route = useRoute()
  const slug = Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : route.params.slug

  // Get all blog posts and find the matching one
  const { data: blogPosts } = await useAsyncData<BlogPost[]>('blog-posts', () =>
    $fetch('/api/blog-posts')
  )

  const post = computed(() =>
    blogPosts.value?.find(p => p._path === `/blog/${slug}`)
  )

  const title = post.value?.title || 'Blog Post'
  const description = post.value?.description || ''
  const image = post.value?.image || '/logo_full.svg'
  const date = post.value?.date || ''
  const author = 'World of Unreal'
  const url = `https://worldofunreal.com/blog/${slug}`

  useHead({
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [{ rel: 'canonical', href: url }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: description,
          image: image,
          datePublished: date,
          author: {
            '@type': 'Organization',
            name: author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'World of Unreal',
            logo: {
              '@type': 'ImageObject',
              url: 'https://worldofunreal.com/logo_full.svg',
            },
          },
          mainEntityOfPage: url,
        }),
      },
    ],
  })
</script>

<template>
  <UContainer class="py-20 max-w-3xl mx-auto">
    <article v-if="post">
      <h1 class="text-4xl font-bold mb-4">{{ post.title }}</h1>
      <div class="text-gray-500 text-sm mb-6">
        <span v-if="post.date">{{
          new Date(post.date).toLocaleDateString()
        }}</span>
        <span v-if="post.category"> &middot; {{ post.category }}</span>
      </div>
      <img
        v-if="post.image"
        :src="post.image"
        :alt="`${post.title} – ${post.category} | AI, Web3, Open Source, Blockchain, NFTs, CGI, AI Art`"
        class="mb-8 rounded-lg w-full max-h-96 object-cover"
      >
      <div class="prose dark:prose-invert max-w-none">
        <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
          {{ post.description }}
        </p>
        <!-- Placeholder for blog content - you can expand this later -->
        <div class="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
          <p class="text-gray-600 dark:text-gray-400">
            This is a placeholder for the full blog post content. The actual
            content would be rendered here.
          </p>
        </div>
      </div>
      <div v-if="post.tags?.length" class="mt-8 flex flex-wrap gap-2">
        <UBadge
          v-for="tag in post.tags"
          :key="tag"
          color="primary"
          variant="soft"
          >{{ tag }}</UBadge
        >
      </div>
    </article>
    <div v-else class="text-center py-20 text-gray-400">Post not found.</div>
  </UContainer>
</template>
