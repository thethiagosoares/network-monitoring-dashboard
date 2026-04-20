const fs = require('fs/promises');
const path = require('path');

const dataDirectory = path.join(__dirname, '..', '..', 'data');

async function ensureFile(fileName, defaultValue) {
  const filePath = path.join(dataDirectory, fileName);

  try {
    await fs.access(filePath);
  } catch (_error) {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }

  return filePath;
}

async function readJson(fileName, defaultValue = []) {
  const filePath = await ensureFile(fileName, defaultValue);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent || JSON.stringify(defaultValue));
}

async function writeJson(fileName, data) {
  const filePath = await ensureFile(fileName, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  readJson,
  writeJson
};