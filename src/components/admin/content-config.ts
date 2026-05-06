import type { AdminContentItem, ContentTypeKey } from './types'

export type ContentFieldKind =
  | 'text'
  | 'textarea'
  | 'datetime-local'
  | 'checkbox'
  | 'select'
  | 'comma-list'
  | 'newline-list'

export type ContentFieldConfig = {
  key: string
  label: string
  kind: ContentFieldKind
  placeholder?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
}

export type ContentFormValue = string | boolean
export type ContentFormState = Record<string, ContentFormValue>

type ContentConfig = {
  key: ContentTypeKey
  label: string
  navLabel: string
  description: string
  mode: 'singleton' | 'collection'
  supportsAssets: boolean
  statusOptions: Array<{ value: string; label: string }>
  statusFilterLabel?: string
  groupFilterLabel?: string
  keywordPlaceholder: string
  newLabel: string
  titleField: string
  summaryField: string
  bodyField: string
  fields: ContentFieldConfig[]
  createInitialState: () => ContentFormState
  fromItem: (item: AdminContentItem) => ContentFormState
  toPayload: (state: ContentFormState) => Record<string, unknown>
  getPreviewTitle: (state: ContentFormState) => string
  getPreviewSummary: (state: ContentFormState) => string
  getDraftPath: (state: ContentFormState, resolvedPath?: string) => string
}

const projectStatusOptions = [
  { value: 'idea', label: '想法' },
  { value: 'active', label: '进行中' },
  { value: 'paused', label: '暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'archived', label: '已归档' },
]

function toDateTimeLocal(value?: unknown) {
  if (!value || typeof value !== 'string') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function toTextArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function toCommaList(value: unknown) {
  return toTextArray(value).join(', ')
}

function toNewlineList(value: unknown) {
  return toTextArray(value).join('\n')
}

function splitCommaList(value: ContentFormValue) {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitNewlineList(value: ContentFormValue) {
  return String(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function stringValue(state: ContentFormState, key: string) {
  return String(state[key] ?? '')
}

function booleanValue(state: ContentFormState, key: string) {
  return Boolean(state[key])
}

export const privacyOptions = [
  { value: 'public', label: '公开' },
  { value: 'private', label: '私有' },
  { value: 'restricted', label: '受限' },
]

const contentConfigs: Record<ContentTypeKey, ContentConfig> = {
  blog: {
    key: 'blog',
    label: '文章管理',
    navLabel: 'Blog',
    description: '管理 Blog 文章、草稿与摘要。',
    mode: 'collection',
    supportsAssets: true,
    statusFilterLabel: '内容状态',
    statusOptions: [
      { value: '', label: '全部状态' },
      { value: 'draft', label: '仅草稿' },
      { value: 'published', label: '仅已发布' },
    ],
    groupFilterLabel: '分类目录',
    keywordPlaceholder: '搜索标题、摘要、标签、作者',
    newLabel: '新建文章',
    titleField: 'title',
    summaryField: 'summary',
    bodyField: 'body',
    fields: [
      { key: 'category', label: '文章目录', kind: 'text', placeholder: '例如：notes / tech' },
      {
        key: 'slug',
        label: '自定义 Slug',
        kind: 'text',
        placeholder: 'my-new-post',
        hint: '留空按标题生成',
      },
      {
        key: 'layout',
        label: '页面布局',
        kind: 'select',
        options: [
          { value: 'PostLayout', label: 'PostLayout（标准阅读页）' },
          { value: 'PostSimple', label: 'PostSimple（极简文章页）' },
          { value: 'PostBanner', label: 'PostBanner（顶部横幅图）' },
        ],
      },
      { key: 'date', label: '发布日期', kind: 'datetime-local' },
      { key: 'tags', label: '标签', kind: 'comma-list', placeholder: 'design, admin' },
      { key: 'authors', label: '作者', kind: 'comma-list', placeholder: 'default' },
      { key: 'summary', label: '摘要', kind: 'textarea', placeholder: '用于列表页与 SEO 摘要' },
      { key: 'draft', label: '保持草稿', kind: 'checkbox' },
      {
        key: 'canonicalUrl',
        label: 'Canonical URL',
        kind: 'text',
        placeholder: 'https://example.com/post',
      },
      { key: 'bibliography', label: '参考文献文件', kind: 'text', placeholder: 'references.bib' },
      {
        key: 'images',
        label: '封面 / 图片路径',
        kind: 'newline-list',
        placeholder: '/static/images/posts/2026/03/slug/cover.png',
      },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      title: '',
      category: '',
      date: new Date().toISOString().slice(0, 16),
      summary: '',
      tags: '',
      authors: 'default',
      slug: '',
      layout: 'PostLayout',
      bibliography: '',
      canonicalUrl: '',
      images: '',
      body: '',
      draft: true,
    }),
    fromItem: (item) => ({
      title: String(item.frontmatter.title || item.title || ''),
      category: String(item.frontmatter.category || ''),
      date: toDateTimeLocal(item.frontmatter.date),
      summary: String(item.frontmatter.summary || item.summary || ''),
      tags: toCommaList(item.frontmatter.tags),
      authors: toCommaList(item.frontmatter.authors),
      slug: String(item.frontmatter.slug || item.adminPath.split('/').at(-1) || ''),
      layout: String(item.frontmatter.layout || 'PostLayout'),
      bibliography: String(item.frontmatter.bibliography || ''),
      canonicalUrl: String(item.frontmatter.canonicalUrl || ''),
      images: toNewlineList(item.frontmatter.images),
      body: item.body || '',
      draft: Boolean(item.frontmatter.draft),
    }),
    toPayload: (state) => ({
      title: stringValue(state, 'title'),
      category: stringValue(state, 'category'),
      date: stringValue(state, 'date'),
      summary: stringValue(state, 'summary'),
      tags: splitCommaList(state.tags),
      authors: splitCommaList(state.authors),
      slug: stringValue(state, 'slug'),
      layout: stringValue(state, 'layout'),
      bibliography: stringValue(state, 'bibliography') || undefined,
      canonicalUrl: stringValue(state, 'canonicalUrl') || undefined,
      images: splitNewlineList(state.images),
      body: stringValue(state, 'body'),
      draft: booleanValue(state, 'draft'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'title') || '未命名文章',
    getPreviewSummary: (state) => stringValue(state, 'summary'),
    getDraftPath: (state, resolvedPath) => {
      if (resolvedPath) return `data/blog/${resolvedPath}.mdx`
      const category = stringValue(state, 'category') || '分类目录'
      const slug = stringValue(state, 'slug') || 'slug'
      return `data/blog/${category}/${slug}.mdx`
    },
  },
  profile: {
    key: 'profile',
    label: 'Profile 管理',
    navLabel: 'Profile',
    description: '维护个人档案、介绍、技能与公开资料。',
    mode: 'singleton',
    supportsAssets: true,
    statusFilterLabel: '可见性',
    statusOptions: [{ value: '', label: '全部状态' }, ...privacyOptions],
    keywordPlaceholder: '搜索姓名、简介、技能',
    newLabel: '编辑 Profile',
    titleField: 'name',
    summaryField: 'headline',
    bodyField: 'body',
    fields: [
      { key: 'name', label: '姓名', kind: 'text', placeholder: '示例用户' },
      {
        key: 'headline',
        label: '标题',
        kind: 'text',
        placeholder: '个人品牌系统设计者 ｜ 示例构建者',
      },
      { key: 'avatar', label: '头像', kind: 'text', placeholder: '/static/images/avatar.svg' },
      { key: 'updatedAt', label: '更新时间', kind: 'datetime-local' },
      { key: 'company', label: '公司', kind: 'text', placeholder: '示例工作室' },
      { key: 'email', label: '邮箱', kind: 'text', placeholder: 'hello@example.com' },
      { key: 'location', label: '所在地', kind: 'text', placeholder: 'Shanghai, China' },
      { key: 'website', label: '个人网站', kind: 'text', placeholder: 'https://example.com' },
      { key: 'twitter', label: 'Twitter / X', kind: 'text' },
      { key: 'linkedin', label: 'LinkedIn', kind: 'text' },
      { key: 'github', label: 'GitHub', kind: 'text' },
      {
        key: 'skills',
        label: '技能标签',
        kind: 'comma-list',
        placeholder: '品牌系统, 产品策略, Agent 工作流',
      },
      { key: 'highlights', label: '高亮信息', kind: 'newline-list', placeholder: '每行一条' },
      { key: 'privacy', label: '可见性', kind: 'select', options: privacyOptions },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      name: '',
      headline: '',
      avatar: '',
      updatedAt: new Date().toISOString().slice(0, 16),
      company: '',
      email: '',
      location: '',
      website: '',
      twitter: '',
      linkedin: '',
      github: '',
      skills: '',
      highlights: '',
      privacy: 'public',
      body: '',
    }),
    fromItem: (item) => ({
      name: String(item.frontmatter.name || item.title || ''),
      headline: String(item.frontmatter.headline || item.summary || ''),
      avatar: String(item.frontmatter.avatar || ''),
      updatedAt: toDateTimeLocal(item.frontmatter.updatedAt || item.updatedAt),
      company: String(item.frontmatter.company || ''),
      email: String(item.frontmatter.email || ''),
      location: String(item.frontmatter.location || ''),
      website: String(item.frontmatter.website || ''),
      twitter: String(item.frontmatter.twitter || ''),
      linkedin: String(item.frontmatter.linkedin || ''),
      github: String(item.frontmatter.github || ''),
      skills: toCommaList(item.frontmatter.skills),
      highlights: toNewlineList(item.frontmatter.highlights),
      privacy: String(item.frontmatter.privacy || 'public'),
      body: item.body || '',
    }),
    toPayload: (state) => ({
      name: stringValue(state, 'name'),
      headline: stringValue(state, 'headline'),
      avatar: stringValue(state, 'avatar') || undefined,
      updatedAt: stringValue(state, 'updatedAt'),
      company: stringValue(state, 'company') || undefined,
      email: stringValue(state, 'email') || undefined,
      location: stringValue(state, 'location') || undefined,
      website: stringValue(state, 'website') || undefined,
      twitter: stringValue(state, 'twitter') || undefined,
      linkedin: stringValue(state, 'linkedin') || undefined,
      github: stringValue(state, 'github') || undefined,
      skills: splitCommaList(state.skills),
      highlights: splitNewlineList(state.highlights),
      privacy: stringValue(state, 'privacy') || 'public',
      body: stringValue(state, 'body'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'name') || '未命名档案',
    getPreviewSummary: (state) => stringValue(state, 'headline'),
    getDraftPath: () => 'data/profile/default.mdx',
  },
  about: {
    key: 'about',
    label: 'About 管理',
    navLabel: 'About',
    description: '维护关于页面和项目说明。',
    mode: 'singleton',
    supportsAssets: true,
    statusFilterLabel: '可见性',
    statusOptions: [{ value: '', label: '全部状态' }, ...privacyOptions],
    keywordPlaceholder: '搜索标题、摘要、正文',
    newLabel: '编辑 About',
    titleField: 'title',
    summaryField: 'summary',
    bodyField: 'body',
    fields: [
      { key: 'title', label: '标题', kind: 'text', placeholder: 'ProtoMe 项目说明' },
      { key: 'summary', label: '摘要', kind: 'textarea', placeholder: '简要介绍页面内容' },
      { key: 'updatedAt', label: '更新时间', kind: 'datetime-local' },
      { key: 'privacy', label: '可见性', kind: 'select', options: privacyOptions },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      title: '',
      summary: '',
      updatedAt: new Date().toISOString().slice(0, 16),
      privacy: 'public',
      body: '',
    }),
    fromItem: (item) => ({
      title: String(item.frontmatter.title || item.title || ''),
      summary: String(item.frontmatter.summary || item.summary || ''),
      updatedAt: toDateTimeLocal(item.frontmatter.updatedAt || item.updatedAt),
      privacy: String(item.frontmatter.privacy || 'public'),
      body: item.body || '',
    }),
    toPayload: (state) => ({
      title: stringValue(state, 'title'),
      summary: stringValue(state, 'summary') || undefined,
      updatedAt: stringValue(state, 'updatedAt'),
      privacy: stringValue(state, 'privacy') || 'public',
      body: stringValue(state, 'body'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'title') || 'About',
    getPreviewSummary: (state) => stringValue(state, 'summary'),
    getDraftPath: () => 'data/about/default.mdx',
  },
  project: {
    key: 'project',
    label: '项目管理',
    navLabel: 'Projects',
    description: '管理项目档案、状态、技术栈与里程碑说明。',
    mode: 'collection',
    supportsAssets: true,
    statusFilterLabel: '项目状态',
    statusOptions: [
      { value: '', label: '全部状态' },
      { value: 'idea', label: '想法' },
      { value: 'active', label: '进行中' },
      { value: 'paused', label: '暂停' },
      { value: 'completed', label: '已完成' },
      { value: 'archived', label: '已归档' },
    ],
    groupFilterLabel: '可见性',
    keywordPlaceholder: '搜索标题、摘要、技术栈、标签',
    newLabel: '新建项目',
    titleField: 'title',
    summaryField: 'summary',
    bodyField: 'body',
    fields: [
      { key: 'pathSlug', label: '路径标识', kind: 'text', placeholder: 'ai-memory' },
      { key: 'id', label: '项目 ID', kind: 'text', placeholder: 'ai-memory' },
      { key: 'title', label: '标题', kind: 'text', placeholder: '个人 AI Memory 系统' },
      {
        key: 'status',
        label: '项目状态',
        kind: 'select',
        options: projectStatusOptions,
      },
      { key: 'startedAt', label: '开始时间', kind: 'datetime-local' },
      { key: 'updatedAt', label: '更新时间', kind: 'datetime-local' },
      { key: 'summary', label: '摘要', kind: 'textarea', placeholder: '概括项目目标与阶段成果' },
      {
        key: 'coverImage',
        label: '项目封面',
        kind: 'text',
        placeholder: '/static/images/projects/slug/cover.png',
      },
      {
        key: 'stack',
        label: '技术栈',
        kind: 'comma-list',
        placeholder: 'Next.js, TypeScript, Contentlayer',
      },
      { key: 'repo', label: '仓库地址', kind: 'text' },
      { key: 'demo', label: '演示地址', kind: 'text' },
      { key: 'role', label: '角色', kind: 'text', placeholder: 'Owner' },
      { key: 'highlights', label: '高亮信息', kind: 'newline-list', placeholder: '每行一条' },
      { key: 'tags', label: '标签', kind: 'comma-list', placeholder: 'knowledge-base, ai-agent' },
      { key: 'privacy', label: '可见性', kind: 'select', options: privacyOptions },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      pathSlug: '',
      id: '',
      title: '',
      status: 'idea',
      startedAt: new Date().toISOString().slice(0, 16),
      updatedAt: new Date().toISOString().slice(0, 16),
      summary: '',
      coverImage: '',
      stack: '',
      repo: '',
      demo: '',
      role: '',
      highlights: '',
      tags: '',
      privacy: 'public',
      body: '',
    }),
    fromItem: (item) => ({
      pathSlug: String(item.frontmatter.pathSlug || item.adminPath || ''),
      id: String(item.frontmatter.id || ''),
      title: String(item.frontmatter.title || item.title || ''),
      status: String(item.frontmatter.status || 'idea'),
      startedAt: toDateTimeLocal(item.frontmatter.startedAt),
      updatedAt: toDateTimeLocal(item.frontmatter.updatedAt || item.updatedAt),
      summary: String(item.frontmatter.summary || item.summary || ''),
      coverImage: String(item.frontmatter.coverImage || ''),
      stack: toCommaList(item.frontmatter.stack),
      repo: String(item.frontmatter.repo || ''),
      demo: String(item.frontmatter.demo || ''),
      role: String(item.frontmatter.role || ''),
      highlights: toNewlineList(item.frontmatter.highlights),
      tags: toCommaList(item.frontmatter.tags),
      privacy: String(item.frontmatter.privacy || 'public'),
      body: item.body || '',
    }),
    toPayload: (state) => ({
      pathSlug: stringValue(state, 'pathSlug') || undefined,
      id: stringValue(state, 'id'),
      title: stringValue(state, 'title'),
      status: stringValue(state, 'status') || 'idea',
      startedAt: stringValue(state, 'startedAt'),
      updatedAt: stringValue(state, 'updatedAt'),
      summary: stringValue(state, 'summary') || undefined,
      coverImage: stringValue(state, 'coverImage') || undefined,
      stack: splitCommaList(state.stack),
      repo: stringValue(state, 'repo') || undefined,
      demo: stringValue(state, 'demo') || undefined,
      role: stringValue(state, 'role') || undefined,
      highlights: splitNewlineList(state.highlights),
      tags: splitCommaList(state.tags),
      privacy: stringValue(state, 'privacy') || 'public',
      body: stringValue(state, 'body'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'title') || '未命名项目',
    getPreviewSummary: (state) => stringValue(state, 'summary'),
    getDraftPath: (state, resolvedPath) =>
      `data/projects/${resolvedPath || stringValue(state, 'pathSlug') || 'slug'}/index.mdx`,
  },
  authors: {
    key: 'authors',
    label: '作者管理',
    navLabel: 'Authors',
    description: '维护作者资料，供博客与作者页引用。',
    mode: 'collection',
    supportsAssets: true,
    statusOptions: [{ value: '', label: '全部状态' }],
    keywordPlaceholder: '搜索姓名、职业、公司、正文',
    newLabel: '新建作者',
    titleField: 'name',
    summaryField: 'occupation',
    bodyField: 'body',
    fields: [
      { key: 'pathSlug', label: '路径标识', kind: 'text', placeholder: 'default' },
      { key: 'name', label: '姓名', kind: 'text', placeholder: '示例用户' },
      { key: 'avatar', label: '头像', kind: 'text' },
      { key: 'occupation', label: '职位 / 角色', kind: 'text' },
      { key: 'company', label: '公司', kind: 'text' },
      { key: 'email', label: '邮箱', kind: 'text' },
      { key: 'twitter', label: 'Twitter / X', kind: 'text' },
      { key: 'bluesky', label: 'Bluesky', kind: 'text' },
      { key: 'linkedin', label: 'LinkedIn', kind: 'text' },
      { key: 'github', label: 'GitHub', kind: 'text' },
      { key: 'layout', label: '布局', kind: 'text', placeholder: 'AuthorLayout' },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      pathSlug: '',
      name: '',
      avatar: '',
      occupation: '',
      company: '',
      email: '',
      twitter: '',
      bluesky: '',
      linkedin: '',
      github: '',
      layout: '',
      body: '',
    }),
    fromItem: (item) => ({
      pathSlug: String(item.frontmatter.pathSlug || item.adminPath || ''),
      name: String(item.frontmatter.name || item.title || ''),
      avatar: String(item.frontmatter.avatar || ''),
      occupation: String(item.frontmatter.occupation || item.summary || ''),
      company: String(item.frontmatter.company || ''),
      email: String(item.frontmatter.email || ''),
      twitter: String(item.frontmatter.twitter || ''),
      bluesky: String(item.frontmatter.bluesky || ''),
      linkedin: String(item.frontmatter.linkedin || ''),
      github: String(item.frontmatter.github || ''),
      layout: String(item.frontmatter.layout || ''),
      body: item.body || '',
    }),
    toPayload: (state) => ({
      pathSlug: stringValue(state, 'pathSlug') || undefined,
      name: stringValue(state, 'name'),
      avatar: stringValue(state, 'avatar') || undefined,
      occupation: stringValue(state, 'occupation') || undefined,
      company: stringValue(state, 'company') || undefined,
      email: stringValue(state, 'email') || undefined,
      twitter: stringValue(state, 'twitter') || undefined,
      bluesky: stringValue(state, 'bluesky') || undefined,
      linkedin: stringValue(state, 'linkedin') || undefined,
      github: stringValue(state, 'github') || undefined,
      layout: stringValue(state, 'layout') || undefined,
      body: stringValue(state, 'body'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'name') || '未命名作者',
    getPreviewSummary: (state) => stringValue(state, 'occupation') || stringValue(state, 'company'),
    getDraftPath: (state, resolvedPath) =>
      `data/authors/${resolvedPath || stringValue(state, 'pathSlug') || 'slug'}.mdx`,
  },
  worklog: {
    key: 'worklog',
    label: '日志管理',
    navLabel: 'Worklogs',
    description: '管理工作日志、阶段重点和下一步行动。',
    mode: 'collection',
    supportsAssets: true,
    statusFilterLabel: '可见性',
    statusOptions: [{ value: '', label: '全部状态' }, ...privacyOptions],
    groupFilterLabel: '年月',
    keywordPlaceholder: '搜索标题、摘要、项目、标签',
    newLabel: '新建日志',
    titleField: 'title',
    summaryField: 'summary',
    bodyField: 'body',
    fields: [
      { key: 'slug', label: '路径标识', kind: 'text', placeholder: '2026-03-24' },
      { key: 'date', label: '日志日期', kind: 'datetime-local' },
      { key: 'title', label: '标题', kind: 'text', placeholder: '搭建统一内容后台' },
      { key: 'summary', label: '摘要', kind: 'textarea', placeholder: '概括本次工作进展' },
      { key: 'updatedAt', label: '更新时间', kind: 'datetime-local' },
      {
        key: 'coverImage',
        label: '日志配图',
        kind: 'text',
        placeholder: '/static/images/worklogs/2026/03/slug/cover.png',
      },
      { key: 'projects', label: '关联项目', kind: 'comma-list', placeholder: 'ai-memory' },
      { key: 'tags', label: '标签', kind: 'comma-list', placeholder: 'content-model, admin' },
      { key: 'focus', label: '关注重点', kind: 'newline-list', placeholder: '每行一条' },
      { key: 'nextActions', label: '下一步', kind: 'newline-list', placeholder: '每行一条' },
      { key: 'aiGenerated', label: 'AI 生成', kind: 'checkbox' },
      { key: 'privacy', label: '可见性', kind: 'select', options: privacyOptions },
      { key: 'body', label: '正文', kind: 'textarea' },
    ],
    createInitialState: () => ({
      slug: '',
      date: new Date().toISOString().slice(0, 16),
      title: '',
      summary: '',
      updatedAt: new Date().toISOString().slice(0, 16),
      coverImage: '',
      projects: '',
      tags: '',
      focus: '',
      nextActions: '',
      aiGenerated: false,
      privacy: 'public',
      body: '',
    }),
    fromItem: (item) => ({
      slug: String(item.frontmatter.slug || item.adminPath.split('/').at(-1) || ''),
      date: toDateTimeLocal(item.frontmatter.date),
      title: String(item.frontmatter.title || item.title || ''),
      summary: String(item.frontmatter.summary || item.summary || ''),
      updatedAt: toDateTimeLocal(item.frontmatter.updatedAt || item.updatedAt),
      coverImage: String(item.frontmatter.coverImage || ''),
      projects: toCommaList(item.frontmatter.projects),
      tags: toCommaList(item.frontmatter.tags),
      focus: toNewlineList(item.frontmatter.focus),
      nextActions: toNewlineList(item.frontmatter.nextActions),
      aiGenerated: Boolean(item.frontmatter.aiGenerated),
      privacy: String(item.frontmatter.privacy || 'public'),
      body: item.body || '',
    }),
    toPayload: (state) => ({
      slug: stringValue(state, 'slug') || undefined,
      date: stringValue(state, 'date'),
      title: stringValue(state, 'title'),
      summary: stringValue(state, 'summary'),
      updatedAt: stringValue(state, 'updatedAt'),
      coverImage: stringValue(state, 'coverImage') || undefined,
      projects: splitCommaList(state.projects),
      tags: splitCommaList(state.tags),
      focus: splitNewlineList(state.focus),
      nextActions: splitNewlineList(state.nextActions),
      aiGenerated: booleanValue(state, 'aiGenerated'),
      privacy: stringValue(state, 'privacy') || 'public',
      body: stringValue(state, 'body'),
    }),
    getPreviewTitle: (state) => stringValue(state, 'title') || '未命名日志',
    getPreviewSummary: (state) => stringValue(state, 'summary'),
    getDraftPath: (state, resolvedPath) => {
      if (resolvedPath) return `data/worklogs/${resolvedPath}.mdx`
      const date = stringValue(state, 'date')
      const normalized = date ? new Date(date) : null
      if (!normalized || Number.isNaN(normalized.getTime())) {
        return 'data/worklogs/YYYY/MM/slug.mdx'
      }
      const year = String(normalized.getFullYear())
      const month = String(normalized.getMonth() + 1).padStart(2, '0')
      return `data/worklogs/${year}/${month}/${stringValue(state, 'slug') || 'slug'}.mdx`
    },
  },
}

export const contentTypeOrder: ContentTypeKey[] = [
  'blog',
  'profile',
  'project',
  'authors',
  'worklog',
  'about',
]

export function getContentConfig(type: ContentTypeKey) {
  return contentConfigs[type]
}

export function isSingletonType(type: ContentTypeKey) {
  return contentConfigs[type].mode === 'singleton'
}
