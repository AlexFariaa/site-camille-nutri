export interface Post {
  id: string
  title: string
  slug: string
  seo_title: string | null
  seo_description: string | null
  cover_image_url: string | null
  thumb_image_url: string | null
  content: string
  published_at: string
  created_at: string
}

export interface PostsResponse {
  data: Post[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface PostSlugInfo {
  slug: string
  published_at: string
  updated_at: string
}

const EMPTY_POSTS_RESPONSE: PostsResponse = {
  data: [],
  total: 0,
  page: 1,
  per_page: 9,
  has_more: false,
}

const CMS_REVALIDATE_SECONDS = 60

function getCmsConfig() {
  const apiUrl = process.env.CMS_API_URL
  const siteId = process.env.CMS_SITE_ID
  const apiKey = process.env.CMS_API_KEY

  if (!apiUrl || !siteId || !apiKey) {
    console.error("[cms] Variáveis CMS_API_URL, CMS_SITE_ID ou CMS_API_KEY não configuradas.")
    return null
  }

  return { apiUrl, siteId, apiKey }
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function getPostExcerpt(content: string, maxLength = 120): string {
  const text = stripHtml(content)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(date))
}

export async function getPostsPage(page: number, perPage = 9): Promise<PostsResponse> {
  const config = getCmsConfig()
  if (!config) return { ...EMPTY_POSTS_RESPONSE, page, per_page: perPage }

  const url = new URL("/api/posts", config.apiUrl)
  url.searchParams.set("site_id", config.siteId)
  url.searchParams.set("api_key", config.apiKey)
  url.searchParams.set("page", String(page))
  url.searchParams.set("per_page", String(perPage))

  try {
    const res = await fetch(url, {
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    })

    if (!res.ok) {
      console.error(`[cms] Erro ao buscar página ${page}: ${res.status} ${res.statusText}`)
      return { ...EMPTY_POSTS_RESPONSE, page, per_page: perPage }
    }

    const payload = (await res.json()) as Partial<PostsResponse>

    return {
      data: Array.isArray(payload.data) ? payload.data : [],
      total: typeof payload.total === "number" ? payload.total : 0,
      page: typeof payload.page === "number" ? payload.page : page,
      per_page: typeof payload.per_page === "number" ? payload.per_page : perPage,
      has_more: Boolean(payload.has_more),
    }
  } catch (error) {
    console.error(`[cms] Erro na página ${page}:`, error)
    return { ...EMPTY_POSTS_RESPONSE, page, per_page: perPage }
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const config = getCmsConfig()
  if (!config) return null

  const url = new URL(`/api/posts/${encodeURIComponent(slug)}`, config.apiUrl)
  url.searchParams.set("site_id", config.siteId)
  url.searchParams.set("api_key", config.apiKey)

  try {
    const res = await fetch(url, {
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    })

    if (res.status === 404) return null

    if (!res.ok) {
      console.error(`[cms] Erro ao buscar slug "${slug}": ${res.status} ${res.statusText}`)
      return null
    }

    return (await res.json()) as Post
  } catch (error) {
    console.error(`[cms] Erro ao buscar slug "${slug}":`, error)
    return null
  }
}

export async function getAllSlugs(): Promise<PostSlugInfo[]> {
  const config = getCmsConfig()
  if (!config) return []

  const url = new URL("/api/posts/slugs", config.apiUrl)
  url.searchParams.set("site_id", config.siteId)
  url.searchParams.set("api_key", config.apiKey)

  try {
    const res = await fetch(url, {
      next: { revalidate: CMS_REVALIDATE_SECONDS },
    })

    if (!res.ok) {
      console.error(`[cms] Erro ao buscar slugs: ${res.status} ${res.statusText}`)
      return []
    }

    const payload = (await res.json()) as { slugs?: PostSlugInfo[] }
    return Array.isArray(payload.slugs) ? payload.slugs : []
  } catch (error) {
    console.error("[cms] Erro ao buscar slugs:", error)
    return []
  }
}
