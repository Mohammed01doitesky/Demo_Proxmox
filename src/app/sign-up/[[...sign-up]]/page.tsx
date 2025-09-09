import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <section className='min-h-screen flex items-center justify-center'>
      <div className='w-full max-w-md'>
        <SignUp 
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
