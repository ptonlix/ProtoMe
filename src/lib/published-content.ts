import type { Blog } from 'contentlayer/generated'

const isProduction = process.env.NODE_ENV === 'production'

export function getPublishedBlogs(blogs: Blog[]): Blog[] {
  return isProduction ? blogs.filter((blog) => blog.draft !== true) : blogs
}
