/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { pickBook, scaleBookForBet, type Book } from '../src/rgs/books';
import type { BookEvent } from '../src/rgs/types';

const BET_LEVELS = [
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
];
const STARTING_BALANCE = 1_000_000_000;
const MIN_BET = 100_000;
const MAX_BET = 10_000_000;
const STEP_BET = 100_000;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_FIXTURE = join(REPO_ROOT, 'math/fixtures/books_base.min.json');

type ActivePlay = {
  bet: number;
  payoutMultiplier: number;
  state: BookEvent[];
};

type StoredBook = {
  id: string;
  state: BookEvent[];
};

export function parseLookupWeights(csv: string): number[] {
  const lines = csv.trim().split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }
  const header = lines[0].split(',');
  const namedWeight = header.indexOf('probabilityWeight');
  if (namedWeight >= 0) {
    return lines.slice(1).map((line) => Number(line.split(',')[namedWeight]));
  }
  // Official Engine LUT: id,weight,payoutMultiplier with no header.
  return lines.map((line) => Number(line.split(',')[1]));
}

export function computeEndRoundCredit(
  bet: number,
  payoutMultiplier: number,
): number {
  return Math.floor((bet * payoutMultiplier) / 100);
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(
  res: import('node:http').ServerResponse,
  status: number,
  body: unknown,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function loadBooks(mathDir: string, fixturePath: string): {
  books: Book[];
  weights: number[];
} {
  const libraryBooks = join(mathDir, 'books', 'books_base.json');
  const lookupCsv = join(mathDir, 'publish_files', 'lookUpTable_base_0.csv');

  if (existsSync(libraryBooks)) {
    const books = JSON.parse(readFileSync(libraryBooks, 'utf8')) as Book[];
    const weights = existsSync(lookupCsv)
      ? parseLookupWeights(readFileSync(lookupCsv, 'utf8'))
      : books.map(() => 1);
    return { books, weights };
  }

  const books = JSON.parse(readFileSync(fixturePath, 'utf8')) as Book[];
  return { books, weights: books.map(() => 1) };
}

export function devRgs(options: {
  mathDir: string;
  fixturePath?: string;
}): Plugin {
  const fixturePath = options.fixturePath ?? DEFAULT_FIXTURE;
  let balance = STARTING_BALANCE;
  let activePlay: ActivePlay | null = null;
  let lastCompletedBook: StoredBook | null = null;
  let bookIdCounter = 0;
  let books: Book[] = [];
  let weights: number[] = [];

  const config = {
    betLevels: BET_LEVELS,
    minBet: MIN_BET,
    maxBet: MAX_BET,
    stepBet: STEP_BET,
    defaultBetLevel: 1_000_000,
    jurisdiction: {
      socialCasino: false,
      disabledFullscreen: false,
      disabledTurbo: false,
      disabledSuperTurbo: false,
      disabledAutoplay: false,
      disabledSlamstop: false,
      disabledSpacebar: false,
      disabledBuyFeature: false,
      displayNetPosition: false,
      displayRTP: false,
      displaySessionTimer: false,
      minimumRoundDuration: 0,
    },
  };

  type Middleware = (req: any, res: any, next: () => void) => void;
  type DevServer = {
    middlewares: { use: (handler: Middleware) => void };
  };

  const attachMiddleware = (server: DevServer) => {
    ({ books, weights } = loadBooks(options.mathDir, fixturePath));

    server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const path = url.split('?')[0] ?? '';
        const query = new URLSearchParams(url.split('?')[1] ?? '');

        if (req.method === 'GET' && path === '/wallet/balance') {
          sendJson(res, 200, {
            balance: { amount: balance, currency: 'USD' },
          });
          return;
        }

        if (req.method === 'GET' && path.startsWith('/bet/replay/')) {
          const id = path.slice('/bet/replay/'.length);
          if (lastCompletedBook && lastCompletedBook.id === id) {
            sendJson(res, 200, { state: lastCompletedBook.state });
            return;
          }
          sendJson(res, 404, { error: 'not found' });
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        try {
          const raw = await readBody(req);
          const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

          if (path === '/wallet/authenticate') {
            sendJson(res, 200, {
              balance: { amount: balance, currency: 'USD' },
              config,
              round: activePlay
                ? { active: true, state: activePlay.state }
                : null,
            });
            return;
          }

          if (path === '/wallet/balance') {
            sendJson(res, 200, {
              balance: { amount: balance, currency: 'USD' },
            });
            return;
          }

          if (path === '/wallet/play') {
            const amount = Number(body.amount);
            const mode = String(body.mode ?? 'base');
            if (mode !== 'base') {
              sendJson(res, 400, { error: 'unsupported mode' });
              return;
            }
            if (!Number.isFinite(amount) || amount <= 0) {
              sendJson(res, 400, { error: 'invalid amount' });
              return;
            }

            if (query.get('replayBook') === '1') {
              const book =
                books.find((entry) => entry.payoutMultiplier > 0) ?? books[0];
              if (!book) {
                sendJson(res, 500, { error: 'no books loaded' });
                return;
              }
              const state = scaleBookForBet(book.events, amount);
              sendJson(res, 200, {
                balance: { amount: balance },
                round: {
                  active: true,
                  state,
                  payoutMultiplier: book.payoutMultiplier,
                },
              });
              return;
            }

            if (activePlay) {
              sendJson(res, 400, { error: 'round already active' });
              return;
            }

            balance -= amount;
            const book = pickBook(books, weights);
            const state = scaleBookForBet(book.events, amount);
            activePlay = {
              bet: amount,
              payoutMultiplier: book.payoutMultiplier,
              state,
            };
            sendJson(res, 200, {
              balance: { amount: balance },
              round: {
                active: true,
                state,
                payoutMultiplier: book.payoutMultiplier,
              },
            });
            return;
          }

          if (path === '/wallet/end-round') {
            if (!activePlay) {
              sendJson(res, 400, { error: 'no active round' });
              return;
            }
            const credit = computeEndRoundCredit(
              activePlay.bet,
              activePlay.payoutMultiplier,
            );
            if (credit > 0) {
              balance += credit;
            }
            lastCompletedBook = {
              id: String(++bookIdCounter),
              state: activePlay.state,
            };
            activePlay = null;
            sendJson(res, 200, {
              balance: { amount: balance },
            });
            return;
          }

          next();
        } catch (error) {
          sendJson(res, 500, {
            error: error instanceof Error ? error.message : 'server error',
          });
        }
      });
  };

  return {
    name: 'dev-rgs',
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  };
}
