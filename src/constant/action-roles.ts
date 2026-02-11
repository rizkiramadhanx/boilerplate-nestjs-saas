const ACTION_ROLES = [
  {
    name: 'role',
    actions: ['role:create', 'role:read', 'role:update', 'role:delete'],
  },
  {
    name: 'user',
    actions: ['user:create', 'user:read', 'user:update', 'user:delete'],
  },
  {
    name: 'product',
    actions: [
      'product:create',
      'product:read',
      'product:update',
      'product:delete',
    ],
  },
  {
    name: 'category',
    actions: [
      'category:create',
      'category:read',
      'category:update',
      'category:delete',
    ],
  },
];

export default ACTION_ROLES;
