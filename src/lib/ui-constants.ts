import type { SpmbScheduleItem } from './content-types';

export const MADING_STATUSES = {
  draft: 'Draft', pending_review: 'Pending Review', approved: 'Approved', rejected: 'Rejected', published: 'Published',
} as const;

export const scheduleCategoryLabels: Record<SpmbScheduleItem['category'], string> = {
  pendaftaran: 'Jadwal Pendaftaran', seleksi: 'Jadwal Seleksi', pengumuman: 'Jadwal Pengumuman', daftar_ulang: 'Jadwal Daftar Ulang',
};
