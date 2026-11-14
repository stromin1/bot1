# Railway
```

---

## 2. Local test

```
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Health: http://localhost:3000

---

## 3. Auth — ye zaroor padho

### Offline mode (aasaan) ✅

Server ki `server.properties` me `online-mode=false` ho, aur `.env` me
`MC_AUTH=offline`. Bas.

### Premium / Microsoft ⚠️

Headless container me Microsoft login (device code) karna mushkil hai.

Trick:

1. Locally `MC_AUTH=microsoft python bot.py` chalao, browser me login complete karo.
2. `nmp-cache/` folder ban jayega — usko Railway **Volume** pe mount karo
(ya private repo me commit karo).
3. Railway pe `MC_AUTH=microsoft` set karke deploy karo.

Simple raasta: offline-mode server.

---

## 4. Tuning

| Variable ↕▾ | Kaam ↕▾ |
|---|---|
| −`CHAT_INTERVAL_MS` | `60000` = har 1 min. `120000` = 2 min |
| −`MOVE_INTERVAL_MS` | Kitne ms me random walk (default 9s) |
| −`CHAT_ENABLED` | `false` = chat band |
| −`MOVE_ENABLED` | `false` = sirf khada rahega |
| −`CHAT_WORDS` | Comma separated apne words |
| −`MC_VERSION` | Auto-detect fail ho to `1.20.4` / `1.21.1` pin karo |
⚙

---

## 5. Common problems

| Problem ↕▾ | Fix ↕▾ |
|---|---|
| −`Unsupported protocol version` | `MC_VERSION` pin karo |
| `You are not whitelisted` | Whitelist me username add karo |
| Bot spawn hoke kick | Server pe AuthMe / anti-bot plugin |
| `Cannot find module 'mineflayer'` | `npm install` nahi chala — `nixpacks.toml` check karo |
| Server offline | Hosting panel se server start karo |
| Railway crash loop | Logs dekho, `MC_HOST` galat |
⚙

---

## 6. Structure

```
.
├── bot.py           
```

Happy botting 🤖

