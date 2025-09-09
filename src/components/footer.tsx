import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='py-4'>
      <div className='container max-w-7xl mx-auto px-5 md:px-10 xl:px-20 flex flex-col items-center justify-center gap-y-2 text-center text-sm text-muted-foreground'>
        <p>DOIT &copy;{new Date().getFullYear()}. All rights reserved.</p>
        <p className='text-xs'>
          Developed by{' '}
          <Link
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary transition-colors hover:text-accent-foreground'
            href='https://www.doit.com.eg/'
          >
            DOIT
          </Link>
        </p>
      </div>
    </footer>
  )
}
