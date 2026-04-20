const { authenticateUser, createUser } = require('../services/authService');

async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required.' });
    }

    const user = await createUser({ username, password });
    return res.status(201).json(user);
  } catch (error) {
    if (error.message === 'USER_EXISTS') {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    return res.status(500).json({ message: 'Unable to register user.' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required.' });
    }

    const authResult = await authenticateUser({ username, password });

    if (!authResult) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json(authResult);
  } catch (_error) {
    return res.status(500).json({ message: 'Unable to login.' });
  }
}

module.exports = {
  login,
  register
};