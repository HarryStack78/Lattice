import type { SocialLink } from "@/lib/team";

type IconProps = { className?: string };

// Minimal inline icon set, matched by keyword against whatever platform name was typed in the
// CMS. Anything unrecognised still renders a link so a freeform platform never disappears.
const ICONS: { test: RegExp; icon: (props: IconProps) => JSX.Element }[] = [
  {
    test: /linkedin/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 20h-3.37v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96V20H9.68V8.5h3.24v1.57h.05c.45-.86 1.56-1.77 3.21-1.77 3.44 0 4.26 2.26 4.26 5.2V20Z" />
      </svg>
    ),
  },
  {
    test: /instagram/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    test: /twitter|^x$|\bx\.com/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M18.24 3H21l-6.5 7.43L22.2 21h-6.14l-4.8-6.27L5.7 21H2.92l6.96-7.95L2 3h6.29l4.34 5.73L18.24 3Zm-1.08 16.17h1.7L7.9 4.74H6.08l11.08 14.43Z" />
      </svg>
    ),
  },
  {
    test: /github/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    ),
  },
  {
    test: /dribbble/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M4 9.5c4.5 1.4 10 1.4 15.5-1M4.7 17c3-4.5 7-7 13.8-8.3M8.5 20.5C10 15 12.8 9 20 6.5" />
      </svg>
    ),
  },
  {
    test: /behance/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M4 6h5.3c2.9 0 4.4 1.2 4.4 3.2 0 1.3-.7 2.1-1.7 2.6 1.4.4 2.3 1.5 2.3 3 0 2.3-1.8 3.7-4.8 3.7H4V6Zm2.7 5h2.2c1.2 0 1.9-.5 1.9-1.5s-.7-1.5-1.9-1.5H6.7V11Zm0 5.4h2.5c1.4 0 2.1-.6 2.1-1.6 0-1-.7-1.6-2.2-1.6H6.7v3.2ZM14.6 8.7h4.9v1.3h-4.9V8.7ZM17 12.2c1.9 0 3.2 1.1 3.4 3H15c.1 1.1.8 1.8 2 1.8.8 0 1.4-.3 1.8-.9l1.5.9c-.7 1.1-1.9 1.7-3.4 1.7-2.4 0-4-1.6-4-4 0-2.3 1.6-4 4.1-4Zm-2 2.6h3.6c-.1-1-.8-1.6-1.7-1.6-.9 0-1.7.6-1.9 1.6Z" />
      </svg>
    ),
  },
  {
    test: /youtube/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.7a2.7 2.7 0 0 0-1.9-1.9C18 5.3 12 5.3 12 5.3s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.7 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.3 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.3ZM10 14.7V9.3L14.8 12 10 14.7Z" />
      </svg>
    ),
  },
  {
    test: /facebook/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.85.24-1.43 1.46-1.43h1.56V4.86c-.27-.04-1.2-.11-2.28-.11-2.25 0-3.79 1.37-3.79 3.9v2.18H8v2.9h2.45V21h3.05Z" />
      </svg>
    ),
  },
  {
    test: /tiktok/i,
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M14.5 3h2.2c.2 1.6 1.3 2.9 3.3 3.1v2.2c-1.2 0-2.3-.4-3.3-1.1v6.4c0 3-2.2 5.2-5 5.2s-5-2.2-5-5.2 2.2-5.2 5-5.2c.3 0 .6 0 .9.1v2.3a2.7 2.7 0 0 0-.9-.1c-1.5 0-2.7 1.3-2.7 2.9s1.2 2.9 2.7 2.9 2.8-1.2 2.8-2.9V3Z" />
      </svg>
    ),
  },
];

const FALLBACK = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l2-2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-2 2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
  </svg>
);

function iconFor(platform: string) {
  return ICONS.find((entry) => entry.test.test(platform))?.icon ?? FALLBACK;
}

type SocialLinksProps = {
  links: SocialLink[];
  size?: "sm" | "md";
};

export default function SocialLinks({ links, size = "md" }: SocialLinksProps) {
  if (!links.length) return null;
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link, i) => {
        const Icon = iconFor(link.platform);
        return (
          <a
            key={`${link.platform}-${i}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            aria-label={link.platform || "Social link"}
            title={link.platform}
            className={`flex ${dim} items-center justify-center rounded-full border border-hairline-subtle text-ink-secondary transition-colors duration-300 hover:border-hairline-strong hover:text-ink-primary`}
          >
            <Icon className={iconDim} />
          </a>
        );
      })}
    </div>
  );
}
