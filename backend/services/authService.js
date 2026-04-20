const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { readJson, writeJson } = require('./fileStore');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const USERS_FILE = 'users.json';

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

async function listUsers() {
  return readJson(USERS_FILE, []);
}

async function createUser({ username, password }) {
  const users = await listUsers();
  const alreadyExists = users.some((user) => user.username === username);

  if (alreadyExists) {
    throw new Error('USER_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: `usr-${Date.now()}`,
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeJson(USERS_FILE, users);

  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: sanitizeUser(newUser)
  };
}

async function authenticateUser({ username, password }) {
  const users = await listUsers();
  const user = users.find((entry) => entry.username === username);

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: sanitizeUser(user)
  };
}

module.exports = {
  authenticateUser,
  createUser,
  listUsers
};