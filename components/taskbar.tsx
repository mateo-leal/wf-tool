import Image from 'next/image'
import Link from 'next/link'
import { GithubLogoIcon } from '@phosphor-icons/react/ssr'

export function Taskbar() {
  return (
    <footer className="taskbar mt-2 flex flex-wrap items-center gap-2 border border-[#55704e] px-2 py-1 text-[#111a0f] sm:flex-nowrap">
      <div className="flex items-center gap-3">
        <Link href="/kim">
          <Image
            src="https://wiki.warframe.com/images/KIMChat.png"
            alt="KIM"
            width={45}
            height={45}
          />
        </Link>
        {/* <Link href="/test">Test</Link> */}
        <Link
          href="https://github.com/mateo-leal/wf-tool"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
        >
          <GithubLogoIcon
            size={24}
            weight="fill"
            className="hover:opacity-75"
          />
        </Link>
      </div>

      <div className="ml-auto text-sm tracking-wider">
        {new Date().toLocaleString('en-US', {
          dateStyle: 'long',
        })}
      </div>
    </footer>
  )
}
