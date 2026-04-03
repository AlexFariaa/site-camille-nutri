import type { MetadataRoute } from 'next'
import { blogPosts } from '@/data/blog-posts'

const BASE_URL = 'https://camillebarbosa.com.br'

const PT_MONTHS: Record<string, string> = {
  Jan: '01', Fev: '02', Mar: '03', Abr: '04', Mai: '05', Jun: '06',
  Jul: '07', Ago: '08', Set: '09', Out: '10', Nov: '11', Dez: '12',
}

function parsePostDate(date: string): Date {
  const match = date.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/)
  if (match) {
    const [, day, monthPt, year] = match
    const month = PT_MONTHS[monthPt]
    if (month) return new Date(`${year}-${month}-${day}`)
  }
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

export default function sitemap(): MetadataRoute.Sitemap {
  const postEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: parsePostDate(post.date),
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
