// Role constants - must match database roles
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user',
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.STAFF, UserRole.USER],
  [UserRole.STAFF]: [UserRole.STAFF, UserRole.USER],
  [UserRole.USER]: [UserRole.USER],
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: 'Administrator with full system access',
  [UserRole.STAFF]: 'Staff member with event management access',
  [UserRole.USER]: 'Regular user with basic access',
};
