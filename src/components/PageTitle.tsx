import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="ledger-heading text-3xl leading-tight font-extrabold sm:text-4xl md:text-5xl">
      {children}
    </h1>
  )
}
