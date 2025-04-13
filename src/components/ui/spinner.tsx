'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-current border-solid border-r-transparent',
  {
    variants: {
      size: {
        default: 'h-5 w-5 border-2',
        sm: 'h-4 w-4 border-2',
        lg: 'h-6 w-6 border-3',
        xl: 'h-8 w-8 border-3',
      },
      variant: {
        default: 'text-slate-400',
        primary: 'text-indigo-600',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, variant, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, variant, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

export { Spinner, spinnerVariants } 