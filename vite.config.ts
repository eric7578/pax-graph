import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

export default defineConfig(async () => {
  const logsDir = path.join(__dirname, './src/logs');
  const logPaths = await glob('**/*.json', {
    cwd: logsDir,
  });
  const logContent = await Promise.all(
    logPaths
      .map((logPath) => path.join(logsDir, logPath))
      .map((logPath) => fs.readFile(logPath, 'utf-8'))
  );
  const logs = [].concat(...logContent.map((log) => JSON.parse(log)));
  process.env.VITE_PAX_LOGS = JSON.stringify(logs);
  return {
    plugins: [react()],
  };
});
