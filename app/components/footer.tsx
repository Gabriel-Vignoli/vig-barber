import { MailIcon } from "lucide-react"
import Link from "next/link"

const InstagramIcon = ({
  size = 20,
  className,
}: {
  size?: number
  className?: string
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedinIcon = ({
  size = 20,
  className,
}: {
  size?: number
  className?: string
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const GithubIcon = ({
  size = 20,
  className,
}: {
  size?: number
  className?: string
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const socialLinks = [
  {
    href: "https://www.instagram.com/gabriel_vignolii/",
    label: "Instagram",
    icon: InstagramIcon,
  },
  {
    href: "https://www.linkedin.com/in/gabriel-vignoli/",
    label: "LinkedIn",
    icon: LinkedinIcon,
  },
  {
    href: "https://github.com/Gabriel-Vignoli",
    label: "GitHub",
    icon: GithubIcon,
  },
  {
    href: "mailto:vignoligabriel052@gmail.com",
    label: "Gmail",
    icon: MailIcon,
  },
]

const Footer = () => {
  return (
    <footer className="border-t px-6 py-5 md:px-16 md:py-8 lg:px-32">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <p className="text-sm text-gray-400 md:text-base">
          © {new Date().getFullYear()}{" "}
          <span className="font-bold">Vig Barber</span>. Todos os direitos
          reservados.
        </p>

        <div className="flex items-center gap-4 md:gap-5">
          <p className="text-sm text-gray-400 md:text-base">
            Feito por <span className="font-bold">Gabriel Vignoli</span>
          </p>

          {socialLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="hover:text-foreground text-gray-400 transition-colors"
            >
              <Icon size={20} className="md:size-6" />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
