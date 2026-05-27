import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/lib/cms'

const BASE_URL = 'https://camillebarbosa.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs()

  const postEntries: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${BASE_URL}/blog/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...postEntries,
  ]
}
