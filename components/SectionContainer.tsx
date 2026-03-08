import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SectionContainer({ children }: Props) {
  return <section className="ledger-shell flex min-h-screen flex-col">{children}</section>
}
