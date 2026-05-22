const ACTION_ROLES = [
  {
    name: 'Role',
    actions: [
      { name: 'Lihat Role', value: 'role:read' },
      { name: 'Buat Role', value: 'role:create' },
      { name: 'Ubah Role', value: 'role:update' },
      { name: 'Hapus Role', value: 'role:delete' },
    ],
  },
  {
    name: 'User',
    actions: [
      { name: 'Lihat User', value: 'user:read' },
      { name: 'Buat User', value: 'user:create' },
      { name: 'Ubah User', value: 'user:update' },
      { name: 'Hapus User', value: 'user:delete' },
    ],
  },
  {
    name: 'Cabang',
    actions: [
      { name: 'Lihat Cabang', value: 'branch:read' },
      { name: 'Buat Cabang', value: 'branch:create' },
      { name: 'Ubah Cabang', value: 'branch:update' },
      { name: 'Hapus Cabang', value: 'branch:delete' },
    ],
  },
  {
    name: 'Pilihan Select (Nyalakan semua)',
    actions: [
      { name: 'Pilihan Cabang', value: 'option:branch' },
      { name: 'Pilihan Role', value: 'option:role' },
    ],
  },
];

export default ACTION_ROLES;
