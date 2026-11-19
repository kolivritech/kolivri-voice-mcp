#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createKolivriVoiceService } from './core.mjs';

export function startMcpStdioServer({
  input = process.stdin,
  output = process.stdout,
  serviceOptions = {},
} = {}) {
  const service = createKolivriVoiceService(serviceOptions);
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  const writeResponse = (payload) => {
    if (payload !== null && payload !== undefined) {
      output.write(`${JSON.stringify(payload)}\n`);
    }
  };

  let queue = Promise.resolve();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    queue = queue.then(async () => {
      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        writeResponse({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error: invalid JSON',
          },
        });
        return;
      }

      const response = await service.handleJsonRpcMessage(parsed);
      writeResponse(response);
    });
  });

  return {
    service,
    close: () => rl.close(),
  };
}

function resolveRealOrAbsPath(target) {
  try {
    return fs.realpathSync(target);
  } catch {
    return path.resolve(target);
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  resolveRealOrAbsPath(process.argv[1]) === resolveRealOrAbsPath(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  startMcpStdioServer();
}
