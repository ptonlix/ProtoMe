import { getProject, listProjects } from '../client/profile-api.js'
import { printJson } from '../output/json.js'
import { formatKeyValue, formatList, formatSection, printText } from '../output/text.js'

export async function handleProjectCommand(args: string[]) {
  const [subcommand, ...rest] = args
  const jsonMode = rest.includes('--json')

  if (subcommand === 'list') {
    const projects = await listProjects()

    if (jsonMode) {
      printJson(projects)
      return
    }

    const lines = projects.map((project, index) => {
      return `${index + 1}. ${project.id} | ${project.name} | ${project.status}`
    })
    printText(formatSection('Projects', lines.length > 0 ? lines : ['(无项目)']))
    return
  }

  if (subcommand === 'get') {
    const projectId = rest.find((item) => item !== '--json')
    if (!projectId) {
      throw new Error('请提供项目 ID，例如 `pm project get <id>`')
    }

    const project = await getProject(projectId)

    if (jsonMode) {
      printJson(project)
      return
    }

    printText(
      formatSection('Project', [
        formatKeyValue('id', project.id),
        formatKeyValue('name', project.name),
        formatKeyValue('slug', project.slug),
        formatKeyValue('summary', project.summary),
        formatKeyValue('role', project.role),
        formatKeyValue('status', project.status),
        formatKeyValue('repo', project.repo),
        formatKeyValue('demo', project.demo),
        formatList('stack', project.stack),
        formatKeyValue('updatedAt', project.updatedAt),
      ])
    )
    return
  }

  throw new Error('不支持的 project 子命令，可用：list/get')
}
