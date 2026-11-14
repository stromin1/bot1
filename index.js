/**
 * Railway Minecraft Bot
 * ---------------------
 * Ek bot jo Minecraft server join karta hai, randomly ghoomta hai
 * aur chat me random words bolta hai. Auto-reconnect + health server included.
 *
 * Saari settings environment variables se aati hain (Railway friendly).
 */

require('dotenv').config();

const http = require('http');
const mineflayer = require('mineflayer');

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value, fallback) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() !== 'false';
};

const CONFIG = {
  host: process.env.MC_HOST || 'localhost',
  port: toInt(process.env.MC_PORT, 25565),
  username: process.env.MC_USERNAME || 'RailwayBot',
  auth: process.env.MC_AUTH || 'offline', // 'offline' | 'microsoft'
  version: process.env.MC_VERSION || undefined, // e.g. "1.20.4", khali chhodo = auto detect
  chatIntervalMs: toInt(process.env.CHAT_INTERVAL_MS, 60000),
  moveIntervalMs: toInt(process.env.MOVE_INTERVAL_MS, 9000),
  chatEnabled: toBool(process.env.CHAT_ENABLED, true),
  moveEnabled: toBool(process.env.MOVE_ENABLED, true),
  webPort: toInt(process.env.PORT, 3000),
};

const DEFAULT_WORDS = [
  'hello', 'hi', 'yo', 'sup', 'gg', 'nice', 'ok', 'hmm',
  'bhai', 'arre', 'kya', 'haan', 'chal', 'letsgo', 'lol',
  'good', 'crazy', 'wait', 'true', 'wow', 'ez',
];

const WORDS = (process.env.CHAT_WORDS
  ? process.env.CHAT_WORDS.split(',')
  : DEFAULT_WORDS
).map((w) => w.trim()).filter(Boolean);

/* ------------------------------------------------------------------ */
/*  Globals                                                            */
/* ------------------------------------------------------------------ */

let bot = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let loops = [];        // interval handles
let stopped = false;   // manual shutdown flag

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const log = (...args) => console.log('[bot]', ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

function randomWalk() {
  if (!bot || !bot.entity) return;

  // Random direction
  const yaw = Math.random() * Math.PI * 2;
  bot.look(yaw, 0, true).catch(() => {});

  bot.setControlState('forward', true);
  if (Math.random() < 0.3) bot.setControlState('jump', true);

  const duration = 900 + Math.random() * 1300;
  setTimeout(() => {
    if (!bot) return;
    bot.setControlState('forward', false);
    bot.setControlState('jump', false);
  }, duration);
}

function saySomething() {
  if (!bot || !bot.entity) return;

  const count = 1 + Math.floor(Math.random() * 2); // 1-2 words
  const msg = Array.from({ length: count }, () => pick(WORDS)).join(' ');
  bot.chat(msg);
  log('chat >', msg);
}

/* ------------------------------------------------------------------ */
/*  Loops                                                              */
/* ------------------------------------------------------------------ */

function stopLoops() {
  for (const t of loops) clearInterval(t);
  loops = [];
}

function startLoops() {
  stopLoops();

  if (CONFIG.moveEnabled) {
    loops.push(
      setInterval(() => {
        if (bot && bot.entity) randomWalk();
      }, CONFIG.moveIntervalMs)
    );
    // Pehla move turant
    setTimeout(randomWalk, 1500);
  }

  if (CONFIG.chatEnabled) {
    loops.push(
      setInterval(() => {
        if (bot && bot.entity) saySomething();
      }, CONFIG.chatIntervalMs)
    );
  }

  log(`loops started | chat=${CONFIG.chatEnabled} (${CONFIG.chatIntervalMs}ms) | move=${CONFIG.moveEnabled} (${CONFIG.moveIntervalMs}ms)`);
}

/* ------------------------------------------------------------------ */
/*  Bot lifecycle                                                      */
/* ------------------------------------------------------------------ */

function createBot() {
  if (stopped) return;

  log(`connecting to ${CONFIG.host}:${CONFIG.port} as "${CONFIG.username}" (auth=${CONFIG.auth})`);

  try {
    bot = mineflayer.createBot({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      auth: CONFIG.auth,
      version: CONFIG.version,
    });
  } catch (err) {
    console.error('[bot] createBot failed:', err.message);
    scheduleReconnect();
    return;
  }

  bot.once('spawn', () => {
    reconnectAttempts = 0;
    log(`spawned at ${bot.entity.position.toString()}`);
    startLoops();
  });

  bot.on('death', () => {
    log('died, waiting for respawn...');
  });

  bot.on('error', (err) => {
    console.error('[bot] error:', err.message);
  });

  bot.on('kicked', (reason) => {
    console.warn('[bot] kicked:', typeof reason === 'string' ? reason : JSON.stringify(reason));
  });

  bot.on('end', (reason) => {
    stopLoops();
    console.warn('[bot] disconnected:', reason);
    bot = null;
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (stopped || reconnectTimer) return;

  // Exponential backoff: 5s, 7.5s, 11s ... max 60s
  const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts), 60000);
  reconnectAttempts++;

  log(`reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay);
}

/* ------------------------------------------------------------------ */
/*  Health server (Railway ke liye)                                    */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const body = {
    status: 'ok',
    host: `${CONFIG.host}:${CONFIG.port}`,
    username: CONFIG.username,
    connected: !!(bot && bot.entity),
    position: bot && bot.entity ? bot.entity.position.toString() : null,
    uptime: Math.round(process.uptime()),
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
});

server.listen(CONFIG.webPort, () => {
  log(`health server listening on :${CONFIG.webPort}`);
});

/* ------------------------------------------------------------------ */
/*  Shutdown                                                           */
/* ------------------------------------------------------------------ */

function shutdown(signal) {
  log(`${signal} received, shutting down...`);
  stopped = true;
  stopLoops();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (bot) {
    try { bot.quit(); } catch (_) {}
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

/* ------------------------------------------------------------------ */
/*  Go                                                                 */
/* ------------------------------------------------------------------ */

log('starting...');
log(`words: ${WORDS.length} loaded`);
createBot();
