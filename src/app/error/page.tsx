'use client'

import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Authentication Error</h1>
        <p className="text-lg mb-8">
          There was an error with your authentication process.
        </p>
        <p className="text-md mb-8">
          Please try again or contact support if the issue persists.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 border rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Back to Login
          </Link>
          <Link
            href="/"
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Home
          </Link>
        </div>
      </main>
    </div>
  )
} 