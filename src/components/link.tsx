/**
 * TODO: Update this component to use your client-side framework's link
 * component. We've provided examples of how to do this for Next.js, Remix, and
 * Inertia.js in the Catalyst documentation:
 *
 * https://catalyst.tailwindui.com/docs#client-side-router-integration
 */

import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import NextLink from 'next/link'

type LinkProps = React.ComponentPropsWithoutRef<typeof NextLink> & {
  [key: string]: any;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  return (
    <Headless.DataInteractive>
      <NextLink {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
