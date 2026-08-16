import Link from 'next/link'
import React from 'react'

export default function SiteLogo() {
  return (
    <div>
        {/* Logo */}
<Link href="/tech" className="flex items-center gap-2">
  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary sm:h-8 sm:w-8">
    <span className="text-sm font-bold text-primary-foreground sm:text-base">
      F
    </span>
  </div>

  <span className="hidden min-[350px]:inline text-base font-semibold tracking-tight sm:text-lg md:text-xl">
    Dial a Tech
  </span>
</Link>
    </div>
  )
}
