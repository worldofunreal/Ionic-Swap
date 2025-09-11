<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Header -->
    <section class="py-20 bg-white dark:bg-neutral-950 pt-32">
      <UContainer>
        <div class="text-center">
          <h1
            class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            AI Workflows, Open Source & Web3: The World of Unreal Blog
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore insights on AI agentic workflows, open source tools, Web3,
            blockchain, NFTs, CGI, AI art, and developer culture. Stay ahead in
            creative coding and decentralized development.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- Blog Posts -->
    <section class="py-20">
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <UCard
            v-for="post in blogPosts"
            :key="post._path"
            class="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-neutral-950"
            @click="navigateTo(post._path)"
          >
            <!-- Post Image -->
            <div class="relative h-48 overflow-hidden">
              <img
                :src="post.image"
                :alt="`${post.title} – ${post.category} | AI, Web3, Open Source, Blockchain, NFTs, CGI, AI Art`"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              >
              <div class="absolute top-4 left-4">
                <span
                  class="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                >
                  {{ post.category }}
                </span>
              </div>
            </div>

            <!-- Post Content -->
            <div class="p-6">
              <div
                class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3"
              >
                <UIcon name="i-fa6-solid-calendar" />
                {{ formatDate(post.date) }}
              </div>
              <h3
                class="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2"
              >
                {{ post.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                {{ post.description }}
              </p>

              <!-- Tags -->
              <div class="flex flex-wrap gap-2 mb-4">
                <UBadge
                  v-for="tag in post.tags?.slice(0, 3)"
                  :key="tag"
                  color="neutral"
                  variant="soft"
                  size="sm"
                >
                  {{ tag }}
                </UBadge>
              </div>

              <!-- Read More -->
              <UButton
                :to="post._path"
                color="primary"
                variant="ghost"
                class="w-full group-hover:bg-primary-50 dark:group-hover:bg-primary-950"
              >
                Read More
                <UIcon
                  name="i-fa6-solid-arrow-right"
                  class="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </UButton>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
  interface BlogPost {
    _path: string
    title: string
    description: string
    date: string
    image: string
    category: string
    tags: string[]
  }

  const { data: blogPosts } = await useAsyncData<BlogPost[]>('blog-posts', () =>
    $fetch('/api/blog-posts')
  )

  // Utility function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  useHead({
    title: 'Blog – AI Workflows, Open Source, Web3 | World of Unreal',
    meta: [
      {
        name: 'description',
        content:
          'Insights on AI agentic workflows, open source tools, Web3, blockchain, NFTs, CGI, AI art, and developer culture. Explore the future of creative coding and decentralized development.',
      },
      {
        name: 'keywords',
        content:
          'AI workflows, open source, Web3, blockchain, NFTs, CGI, AI art, developer culture, vibe coding, decentralized apps',
      },
      {
        property: 'og:title',
        content: 'Blog – AI Workflows, Open Source, Web3 | World of Unreal',
      },
      {
        property: 'og:description',
        content:
          'Insights on AI agentic workflows, open source tools, Web3, blockchain, NFTs, CGI, AI art, and developer culture. Explore the future of creative coding and decentralized development.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://worldofunreal.com/blog' },
      { property: 'og:image', content: '/logo_full.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'Blog – AI Workflows, Open Source, Web3 | World of Unreal',
      },
      {
        name: 'twitter:description',
        content:
          'Insights on AI agentic workflows, open source tools, Web3, blockchain, NFTs, CGI, AI art, and developer culture. Explore the future of creative coding and decentralized development.',
      },
      { name: 'twitter:image', content: '/logo_full.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://worldofunreal.com/blog' }],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://worldofunreal.com/',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: 'https://worldofunreal.com/blog',
            },
          ],
        }),
      },
    ],
  })
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
