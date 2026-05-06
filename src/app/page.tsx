import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allProfiles, allProjects, allWorklogs } from 'contentlayer/generated'
import Main from './Main'
import { getPublishedBlogs } from '../lib/published-content'

export default async function Page() {
  const sortedPosts = sortPosts(getPublishedBlogs(allBlogs))
  const posts = allCoreContent(sortedPosts)
  const profile = allProfiles.find((item) => item.privacy === 'public') ?? allProfiles[0] ?? null
  const projects = [...allProjects]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const worklogs = [...allWorklogs]
    .filter((item) => item.privacy === 'public')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return <Main posts={posts} profile={profile} projects={projects} worklogs={worklogs} />
}
