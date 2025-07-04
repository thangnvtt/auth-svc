const allRoles = {
  user: ['getProfiles', 'manageProfiles'],
  admin: ['getUsers', 'manageUsers', 'getProfiles', 'manageProfiles'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
