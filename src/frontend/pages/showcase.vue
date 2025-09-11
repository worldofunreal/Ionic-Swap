<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <UContainer>
      <div class="py-8 pt-32">
        <h1
          class="text-4xl md:text-5xl font-extrabold mb-10 text-center text-gray-900 dark:text-white tracking-tight"
        >
          Into the Metaverse
        </h1>
        <p
          class="text-xl text-gray-600 text-center dark:text-gray-500 max-w-3xl mx-auto"
        >
          Discover our latest AI-powered projects made with CGI art.
        </p>
      </div>

      <!-- Top Filter Row (always at top, full width) -->
      <div class="w-full flex flex-col md:flex-row gap-4 mb-8">
        <select
          v-model="selectedTag"
          class="w-full md:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
        >
          <option value="All">All</option>
          <option v-for="tag in uniqueTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search projects..."
          class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
        >
      </div>
      <div class="py-8">
        <main>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            <UCard
              v-for="project in filteredProjects"
              :key="project.id"
              class="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-neutral-950"
            >
              <!-- Project Image -->
              <div class="relative h-48 overflow-hidden">
                <img
                  :src="project.image"
                  :alt="`${project.name} – ${project.category} | Web3, GameFi, AI, Blockchain, Metaverse, Open Source`"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                >
                <div class="absolute bottom-4 left-4">
                  <span
                    class="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                  >
                    {{ project.category }}
                  </span>
                </div>
              </div>

              <!-- Project Content -->
              <div class="p-6">
                <h3
                  class="text-xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {{ project.name }}
                </h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {{ project.description }}
                </p>
                <!-- Tech Stack -->
                <div class="flex flex-wrap gap-2 mb-4">
                  <UBadge
                    v-for="tech in project.tech"
                    :key="tech"
                    color="neutral"
                    variant="soft"
                    size="sm"
                  >
                    {{ tech }}
                  </UBadge>
                </div>
                <!-- Action Button -->
                <a
                  :href="project.link"
                  target="_blank"
                  rel="noopener"
                  class="block w-full"
                >
                  <UButton
                    color="primary"
                    variant="ghost"
                    class="w-full group-hover:bg-primary-50 dark:group-hover:bg-primary-950"
                  >
                    {{ project.action }}
                    <UIcon
                      name="i-fa6-solid-arrow-right"
                      class="ml-2 group-hover:translate-x-1 transition-transform"
                    />
                  </UButton>
                </a>
              </div>
            </UCard>
          </div>
        </main>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  const projects = [
    {
      id: 'cosmicrafts',
      name: 'Cosmicrafts',
      category: 'Metaverse Gaming Franchise',
      description:
        'A Metaverse gaming franchise with video games, NFTs, and a growing lore. Play, own, and explore.',
      image: '/assets/beta-2022.webp',
      tech: ['Metaverse', 'Gaming', 'NFTs', 'DAO', 'Unity'],
      link: 'https://cosmicrafts.com/',
      action: 'Visit Website',
    },
    {
      id: 'nftropoly',
      name: 'Nftropoly',
      category: 'Marketplace',
      description:
        'True decentralized marketplace under construction, multichain with AI tools for creators and analytics.',
      image: '/assets/nftropoly.webp',
      tech: ['ChainFusion', 'Metaverse', 'NFTs', 'Node.js'],
      link: 'https://nftropoly.com',
      action: 'Go to Market',
    },
    {
      id: 'ic-hub',
      name: 'IC Hub',
      category: 'Web3 App',
      description:
        'Decentralized social media platform, a gateway to the world of Web3 Apps.',
      image: '/assets/ichub.webp',
      tech: ['React', 'Unity', 'ICP'],
      link: 'https://md7ke-jyaaa-aaaak-qbrya-cai.ic0.app',
      action: 'Enter Hub',
    },
    {
      id: 'signal',
      name: 'Signal',
      category: 'Productivity',
      description:
        'AI-powered productivity app that helps you master the signal-to-noise ratio for peak performance.',
      image: '/assets/signal.webp',
      tech: ['AI', 'Nuxt/Vue'],
      link: 'https://github.com/worldofunreal/Signal',
      action: 'View on GitHub',
    },
    {
      id: 'chatsdk',
      name: 'ChatSDK',
      category: 'SDK / Web3',
      description: `Chat SDK for the Internet Computer.\n\nFor users: Public community chat, private groups, friend list, private chats, and activity.\nFor developers: Easily integrate chat into IC, web, or Unity projects.\n\nModules: Canister (backend), ReactJS (frontend), Unity3D (frontend).`,
      image: '/assets/chatsdk.webp',
      tech: ['ICP', 'React', 'Unity', 'SDK'],
      link: 'https://github.com/worldofunreal/chatsdk',
      action: 'View on GitHub',
    },
    {
      id: 'hyper',
      name: 'Hyper',
      category: 'Launcher',
      description:
        'Launcher for apps made with Electron. Features a self-updater and app launching.',
      image: '/assets/hyper.webp',
      tech: ['Electron', 'Node.js'],
      link: 'https://github.com/worldofunreal/Hyper',
      action: 'View on GitHub',
    },
    {
      id: 'metapixel',
      name: 'Metapixel',
      category: 'AI / Python',
      description: `Tools to identify metadata on images using AI.\n\nSetup:\n- Create a virtual environment:\n  python -m venv venv\n- Activate it:\n  source venv/bin/activate\n- Install OpenCV:\n  pip install opencv-python\n\nMetapixel helps you analyze and extract metadata from images with Python and OpenCV.`,
      image: '/assets/metapixel.webp',
      tech: ['Python', 'AI', 'OpenCV', 'Metadata'],
      link: 'https://github.com/worldofunreal/Metapixel',
      action: 'View on GitHub',
    },
    {
      id: 'proxy-icp',
      name: 'proxy-icp',
      category: 'Node.js / Express',
      description: `A Node.js/Express middleware server that acts as a proxy between Internet Computer (ICP) canisters (Candid) and any other API.\n\nFeatures endpoints for player management, friends, privacy, and notifications. Easily extendable for new canister or API integrations.`,
      image: '/assets/proxy-icp.webp',
      tech: ['Node.js', 'Express', 'ICP', 'API'],
      link: 'https://github.com/worldofunreal/proxy-icp',
      action: 'View on GitHub',
    },
  ]

  // Build unique tech tags for filtering
  const uniqueTags = [...new Set(projects.flatMap(p => p.tech))]
  const selectedTag = ref('All')
  const searchQuery = ref('')

  const filteredProjects = computed(() => {
    let filtered = projects
    if (selectedTag.value !== 'All') {
      filtered = filtered.filter(
        p => p.tech && p.tech.includes(selectedTag.value)
      )
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }
    return filtered
  })

  useHead({
    title: 'Showcase – Web3 Gaming, GameFi, Blockchain | World of Unreal',
    meta: [
      {
        name: 'description',
        content:
          'Explore our showcase of Web3 games, GameFi projects, blockchain apps, and AI-powered CGI art. Discover the future of game development, NFTs, and the Metaverse.',
      },
      {
        name: 'keywords',
        content:
          'Web3 gaming, GameFi, game development, Metaverse, NFTs, blockchain, AI, CGI, open source, vibe coding',
      },
      {
        property: 'og:title',
        content: 'Showcase – Web3 Gaming, GameFi, Blockchain | World of Unreal',
      },
      {
        property: 'og:description',
        content:
          'Explore our showcase of Web3 games, GameFi projects, blockchain apps, and AI-powered CGI art. Discover the future of game development, NFTs, and the Metaverse.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://worldofunreal.com/showcase' },
      { property: 'og:image', content: '/logo_full.svg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'Showcase – Web3 Gaming, GameFi, Blockchain | World of Unreal',
      },
      {
        name: 'twitter:description',
        content:
          'Explore our showcase of Web3 games, GameFi projects, blockchain apps, and AI-powered CGI art. Discover the future of game development, NFTs, and the Metaverse.',
      },
      { name: 'twitter:image', content: '/logo_full.svg' },
    ],
    link: [{ rel: 'canonical', href: 'https://worldofunreal.com/showcase' }],
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
              name: 'Showcase',
              item: 'https://worldofunreal.com/showcase',
            },
          ],
        }),
      },
    ],
  })
</script>

<style scoped>
  /**** Custom styles for the new showcase layout ****/
  /**** You can further tweak these for your brand ****/
</style>
