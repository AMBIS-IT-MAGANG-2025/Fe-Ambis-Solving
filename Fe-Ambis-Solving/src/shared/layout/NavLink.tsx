import { Link } from '@tanstack/react-router';
import type { LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

// Gabungkan LinkProps dengan props custom kita (children & icon)
type NavLinkProps = LinkProps & {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
};

export function NavLink({ children, icon, onClick, ...props }: NavLinkProps) {
  return (
    <Link
      {...props}
      onClick={onClick}
      // Styling untuk link yang sedang aktif
      activeProps={{
        className: 'bg-indigo-100 text-indigo-700',
      }}
      // Styling umum untuk semua link
      className="flex items-center gap-3 px-3 py-2 text-gray-700 transition-colors rounded-md hover:bg-gray-200"
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
}