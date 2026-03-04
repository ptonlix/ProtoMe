import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
  basePath?: string
}

const Tag = ({ text, basePath = '/blog' }: Props) => {
  const href =
    basePath === '/blog'
      ? `/blog?tag=${encodeURIComponent(slug(text))}`
      : `${basePath}/${slug(text)}`

  return (
    <Link
      href={href}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
    >
      {text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
