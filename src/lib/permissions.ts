export const STAFF_ROLES = ['admin', 'operator_sekolah', 'guru', 'osis', 'bkk'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface PermissionDef {
  slug: string;
  name: string;
  module: string;
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  { slug: 'dashboard.view', name: 'View', module: 'dashboard' },

  { slug: 'osis.view', name: 'View', module: 'osis' },
  { slug: 'osis.create', name: 'Create', module: 'osis' },
  { slug: 'osis.edit', name: 'Edit', module: 'osis' },
  { slug: 'osis.delete', name: 'Delete', module: 'osis' },
  { slug: 'osis.publish', name: 'Publish', module: 'osis' },

  { slug: 'osis.activities.view', name: 'View', module: 'osis.activities' },
  { slug: 'osis.activities.create', name: 'Create', module: 'osis.activities' },
  { slug: 'osis.activities.edit', name: 'Edit', module: 'osis.activities' },
  { slug: 'osis.activities.delete', name: 'Delete', module: 'osis.activities' },

  { slug: 'extracurricular.view', name: 'View', module: 'extracurricular' },
  { slug: 'extracurricular.create', name: 'Create', module: 'extracurricular' },
  { slug: 'extracurricular.edit', name: 'Edit', module: 'extracurricular' },
  { slug: 'extracurricular.delete', name: 'Delete', module: 'extracurricular' },
  { slug: 'extracurricular.publish', name: 'Publish', module: 'extracurricular' },

  { slug: 'kesemaptaan.view', name: 'View', module: 'kesemaptaan' },
  { slug: 'kesemaptaan.create', name: 'Create', module: 'kesemaptaan' },
  { slug: 'kesemaptaan.edit', name: 'Edit', module: 'kesemaptaan' },
  { slug: 'kesemaptaan.delete', name: 'Delete', module: 'kesemaptaan' },
  { slug: 'kesemaptaan.publish', name: 'Publish', module: 'kesemaptaan' },

  { slug: 'mading.view', name: 'View', module: 'mading' },
  { slug: 'mading.create', name: 'Create', module: 'mading' },
  { slug: 'mading.edit_own', name: 'Edit Own', module: 'mading' },
  { slug: 'mading.edit_all', name: 'Edit All', module: 'mading' },
  { slug: 'mading.delete', name: 'Delete', module: 'mading' },
  { slug: 'mading.submit_review', name: 'Submit Review', module: 'mading' },
  { slug: 'mading.review', name: 'Review', module: 'mading' },
  { slug: 'mading.publish', name: 'Publish', module: 'mading' },
  { slug: 'mading.ai_generate', name: 'AI Content Assistant', module: 'mading' },

  { slug: 'spmb.view', name: 'View', module: 'spmb' },
  { slug: 'spmb.create', name: 'Create', module: 'spmb' },
  { slug: 'spmb.edit', name: 'Edit', module: 'spmb' },
  { slug: 'spmb.delete', name: 'Delete', module: 'spmb' },
  { slug: 'spmb.verify', name: 'Verify', module: 'spmb' },

  { slug: 'gallery.view', name: 'View', module: 'gallery' },
  { slug: 'gallery.create', name: 'Create', module: 'gallery' },
  { slug: 'gallery.edit', name: 'Edit', module: 'gallery' },
  { slug: 'gallery.delete', name: 'Delete', module: 'gallery' },
  { slug: 'gallery.publish', name: 'Publish', module: 'gallery' },

  { slug: 'management.view', name: 'View', module: 'management' },

  { slug: 'job.view', name: 'View', module: 'bkk' },
  { slug: 'job.create', name: 'Create', module: 'bkk' },
  { slug: 'job.edit', name: 'Edit', module: 'bkk' },
  { slug: 'job.delete', name: 'Delete', module: 'bkk' },
  { slug: 'job.publish', name: 'Publish', module: 'bkk' },

  { slug: 'kelulusan.view', name: 'View', module: 'kelulusan' },
  { slug: 'kelulusan.create', name: 'Create', module: 'kelulusan' },
  { slug: 'kelulusan.edit', name: 'Edit', module: 'kelulusan' },
  { slug: 'kelulusan.delete', name: 'Delete', module: 'kelulusan' },
  { slug: 'kelulusan.verify', name: 'Verify', module: 'kelulusan' },

  { slug: 'sdm.view', name: 'View', module: 'sdm' },
  { slug: 'sdm.create', name: 'Create', module: 'sdm' },
  { slug: 'sdm.edit', name: 'Edit', module: 'sdm' },
  { slug: 'sdm.delete', name: 'Delete', module: 'sdm' },
  { slug: 'sdm.import', name: 'Import Data', module: 'sdm' },
  { slug: 'sdm.export', name: 'Export Data', module: 'sdm' },
];

export const PERMISSION_MODULES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'osis', label: 'OSIS' },
  { key: 'osis.activities', label: 'Kegiatan OSIS' },
  { key: 'extracurricular', label: 'Ekstrakurikuler' },
  { key: 'kesemaptaan', label: 'Kesemaptaan' },
  { key: 'mading', label: 'Mading' },
  { key: 'spmb', label: 'SPMB' },
  { key: 'gallery', label: 'Galeri' },
  { key: 'bkk', label: 'BKK' },
  { key: 'kelulusan', label: 'Kelulusan Siswa' },
  { key: 'sdm', label: 'SDM (Guru & Tenaga Kependidikan)' },
  { key: 'management', label: 'Manajemen' },
];

export function can(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canAny(permissions: string[], list: string[]): boolean {
  return list.some((p) => permissions.includes(p));
}
