import { allProfiles } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Profile' })

export default function ProfilePage() {
  const profile = allProfiles.find((item) => item.privacy === 'public') ?? allProfiles[0]

  if (!profile) {
    return (
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            Profile
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">暂无可展示资料。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-3 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          {profile.name}
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">{profile.headline}</p>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          最近更新：{formatDate(profile.updatedAt, siteMetadata.locale)}
        </p>
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        {profile.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-300">
            {profile.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        )}
      </div>
      <article className="prose dark:prose-invert max-w-none py-10">
        <MDXLayoutRenderer code={profile.body.code} />
      </article>
    </div>
  )
}
