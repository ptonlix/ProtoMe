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
    <Link href={href} className="ledger-chip mr-2 mb-2 text-[0.68rem]" data-active="false">
      #{text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
