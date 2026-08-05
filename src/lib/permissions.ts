export const STAFF_ROLES = ['admin', 'guru', 'osis'] as const;
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

  { slug: 'spmb.view', name: 'View', module: 'spmb' },
  { slug: 'spmb.create', name: 'Create', module: 'spmb' },
  { slug: 'spmb.edit', name: 'Edit', module: 'spmb' },
  { slug: 'spmb.delete', name: 'Delete', module: 'spmb' },
  { slug: 'spmb.verify', name: 'Verify', module: 'spmb' },

  { slug: 'management.view', name: 'View', module: 'management' },
];

export const PERMISSION_MODULES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'osis', label: 'OSIS' },
  { key: 'osis.activities', label: 'Kegiatan OSIS' },
  { key: 'extracurricular', label: 'Ekstrakurikuler' },
  { key: 'kesemaptaan', label: 'Kesemaptaan' },
  { key: 'mading', label: 'Mading' },
  { key: 'spmb', label: 'SPMB' },
  { key: 'management', label: 'Manajemen' },
];

export function can(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canAny(permissions: string[], list: string[]): boolean {
  return list.some((p) => permissions.includes(p));
}
