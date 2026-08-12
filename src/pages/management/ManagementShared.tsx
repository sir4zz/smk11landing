import { User } from 'lucide-react';
import { resolveImageUrl } from '../../lib/api';

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function formatDate(value?: string): string {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, year, month, day] = match;
  const m = parseInt(month, 10) - 1;
  if (m < 0 || m > 11) return String(value);
  return `${parseInt(day, 10)} ${monthNames[m]} ${year}`;
}

interface PersonAvatarProps {
  photo?: string;
  name?: string;
  className?: string;
  iconClassName?: string;
}

export function PersonAvatar({ photo, name, className = '', iconClassName = 'h-12 w-12' }: PersonAvatarProps) {
  if (photo) {
    return <img src={resolveImageUrl(photo)} alt={name ?? ''} loading="lazy" className={className} />;
  }
  return (
    <div className={`flex items-center justify-center bg-[#1B2A4A] text-[#C8A951] ${className}`}>
      <User className={iconClassName} />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <User className="mx-auto h-12 w-12 text-[#C8A951]/40" />
      <p className="mt-4 text-lg font-medium text-[#23314D]">{message}</p>
    </div>
  );
}
