// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <section className='min-h-screen flex items-center justify-center'>
      <div className='w-full max-w-md'>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    </section>
  )
}
