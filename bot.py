#!/usr/bin/env python3
"""
Railway Minecraft Bot (Python)
------------------------------
Python bot jo mineflayer (Node.js) ko `javascript` bridge ke through chalata hai:
- server join karta hai
- randomly ghoomta hai
- har CHAT_INTERVAL_MS me random words chat karta hai
- auto-reconnect karta hai
- Railway ke liye HTTP health endpoint deta hai
"""

import os
import json
import time
import random
import signal
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from dotenv import load_dotenv
from javascript import require, On

load_dotenv()

mineflayer = require("mineflayer")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

def _int(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default

def _bool(name, default):
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() not in ("false", "0", "no", "")

CONFIG = {
    "host": os.getenv("MC_HOST", "craftyhaven152.mcsh.gg"),
    "port": _int("MC_PORT", 25565),
    "username": os.getenv("MC_USERNAME", "PyRailwayBot"),
    "auth": os.getenv("MC_AUTH", "offline"),          # offline | microsoft
    "version": (os.getenv("MC_VERSION") or "").strip(),
    "password": (os.getenv("MC_LOGIN_PASSWORD") or "").strip(),
    "chat_enabled": _bool("CHAT_ENABLED", True),
    "chat_interval": _int("CHAT_INTERVAL_MS", 60000),
    "move_enabled": _bool("MOVE_ENABLED", True),
    "move_interval": _int("MOVE_INTERVAL_MS", 9000),
    "web_port": _int("PORT", 3000),
}

DEFAULT_WORDS = [
    "hello", "hi", "yo", "sup", "gg", "nice", "ok", "hmm",
    "bhai", "arre", "kya", "haan", "chal", "letsgo", "lol",
    "good", "crazy", "wait", "true", "wow", "ez",
]

WORDS = [
    w.strip()
    for w in (os.getenv("CHAT_WORDS") or ",".join(DEFAULT_WORDS)).split(",")
    if w.strip()
]

# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------

state = {
    "bot": None,
    "connected": False,
    "pos": None,
    "gen": 0,
    "stopped": False,
    "attempts": 0,
    "started_at": time.time(),
}

def log(*args):
    print("[bot]", *args, flush=True)

def pick(seq):
    return seq[random.randint(0, len(seq) - 1)]

# ---------------------------------------------------------------------------
# Actions
# ---------------------------------------------------------------------------

def random_walk():
    bot = state["bot"]
    if bot is None or not state["connected"]:
        return

    yaw = random.random() * 6.28318
    try:
        bot.look(yaw, 0, True)
        bot.setControlState("forward", True)
        if random.random() < 0.3:
            bot.setControlState("jump", True)
    except Exception as exc:                       # noqa: BLE001
        log("walk error:", exc)
        return

    def release():
        b = state["bot"]
        if b is None:
            return
        try:
            b.setControlState("forward", False)
            b.setControlState("jump", False)
        except Exception:                          # noqa: BLE001
            pass

    threading.Timer(0.9 + random.random() * 1.3, release).start()

def say_something():
    bot = state["bot"]
    if bot is None or not state["connected"]:
        return

    count = 1 + random.randint(0, 1)
    msg = " ".join(pick(WORDS) for _ in range(count))
    try:
        bot.chat(msg)
        log("chat >", msg)
    except Exception as exc:                       # noqa: BLE001
        log("chat error:", exc)

# ---------------------------------------------------------------------------
# Loops
# ---------------------------------------------------------------------------

class Looper(threading.Thread):
    def __init__(self, gen, interval_ms, fn, name):
        super().__init__(daemon=True, name=name)
        self.gen = gen
        self.interval = max(interval_ms, 1000) / 1000.0
        self.fn = fn

    def run(self):
        while not state["stopped"]:
            time.sleep(self.interval)
            if state["stopped"] or self.gen != state["gen"]:
                return
            if not state["connected"]:
                return
            try:
                self.fn()
            except Exception as exc:               # noqa: BLE001
                log(f"{self.name} error:", exc)

def start_loops(gen):
    if CONFIG["move_enabled"]:
        threading.Timer(
            1.5, lambda: random_walk() if gen == state["gen"] else None
        ).start()
        Looper(gen, CONFIG["move_interval"], random_walk, "move-loop").start()

    if CONFIG["chat_enabled"]:
        Looper(gen, CONFIG["chat_interval"], say_something, "chat-loop").start()

    log(
        f"loops started | chat={CONFIG['chat_enabled']} "
        f"({CONFIG['chat_interval']}ms) | move={CONFIG['move_enabled']} "
        f"({
