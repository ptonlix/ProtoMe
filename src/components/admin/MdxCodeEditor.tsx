'use client'

import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { useMemo } from 'react'
import { useTheme } from 'next-themes'

type MdxCodeEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  immersive?: boolean
}

export default function MdxCodeEditor({
  value,
  onChange,
  placeholder,
  immersive = false,
}: MdxCodeEditorProps) {
  const { resolvedTheme } = useTheme()

  const extensions = useMemo(
    () => [
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      EditorView.lineWrapping,
    ],
    []
  )

  return (
    <div
      className={`h-full overflow-hidden rounded-b-[2rem] ${
        immersive ? 'min-h-0' : 'min-h-[42rem]'
      }`}
    >
      <CodeMirror
        value={value}
        height="100%"
        minHeight={immersive ? undefined : '42rem'}
        theme={resolvedTheme === 'dark' ? githubDark : githubLight}
        extensions={extensions}
        placeholder={placeholder}
        basicSetup={{
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          lineNumbers: true,
          bracketMatching: true,
          autocompletion: true,
          closeBrackets: true,
          indentOnInput: true,
        }}
        onChange={onChange}
        className="h-full min-h-0 text-sm"
      />
    </div>
  )
}
