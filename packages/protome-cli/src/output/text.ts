export function printText(lines: string[]) {
  process.stdout.write(`${lines.join('\n')}\n`)
}

export function formatSection(title: string, lines: string[]) {
  return [`${title}:`, ...lines.map((line) => `  ${line}`)]
}

export function formatKeyValue(label: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return `${label}: -`
  }

  return `${label}: ${String(value)}`
}

export function formatList(label: string, values: string[]) {
  return `${label}: ${values.length > 0 ? values.join(', ') : '-'}`
}

export function maskSecret(value: string) {
  if (!value) {
    return '(未设置)'
  }

  if (value.length <= 8) {
    return '****'
  }

  return `${value.slice(0, 4)}****${value.slice(-4)}`
}
