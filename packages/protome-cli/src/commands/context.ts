import { getContext } from '../client/profile-api.js'
import { printJson } from '../output/json.js'
import { formatKeyValue, formatList, formatSection, printText } from '../output/text.js'

export async function handleContextCommand(args: string[]) {
  const jsonMode = args.includes('--json')
  const context = await getContext()

  if (jsonMode) {
    printJson(context)
    return
  }

  printText([
    ...formatSection('Profile', [
      formatKeyValue('displayName', context.profile.displayName),
      formatKeyValue('headline', context.profile.headline),
    ]),
    '',
    ...formatSection('Projects', [
      formatKeyValue('count', context.projects.length),
      ...context.projects.slice(0, 5).map((project, index) => {
        return `${index + 1}. ${project.id} | ${project.name} | ${project.status}`
      }),
    ]),
    '',
    ...formatSection('BlogContext', [
      formatKeyValue('summary', context.blogContext.summary),
      formatKeyValue('tone', context.blogContext.tone),
      formatList('pendingPostAnalyses', context.blogContext.pendingPostAnalyses),
      formatKeyValue('lastAnalyzedAt', context.blogContext.lastAnalyzedAt),
    ]),
    '',
    ...formatSection('WorklogContext', [
      formatKeyValue('currentFocus', context.worklogContext.currentFocus),
      formatList('activeThemes', context.worklogContext.activeThemes),
      formatList('pendingWorklogAnalyses', context.worklogContext.pendingWorklogAnalyses),
      formatKeyValue('lastAnalyzedAt', context.worklogContext.lastAnalyzedAt),
    ]),
    '',
    ...formatSection('Meta', [
      formatKeyValue('schemaVersion', context.meta.schemaVersion),
      formatKeyValue('snapshotVersion', context.meta.snapshotVersion),
      formatKeyValue('generatedAt', context.meta.generatedAt),
    ]),
  ])
}
