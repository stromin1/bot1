# Railway Minecraft Bot

Ek chhota sa Mineflayer bot jo:
- tumhare Minecraft server me join karta hai
- randomly idhar-udhar ghoomta hai (walk + jump)
- chat me random words bolta hai
- disconnect hone pe auto-reconnect karta hai
- Railway ke liye HTTP health endpoint deta hai

> ⚠️ Sirf **Java Edition** servers ke liye kaam karta hai (Bedrock nahi).

---

## 1. Railway pe deploy

### Option A — GitHub se (recommended)

1. Is folder ko GitHub repo me push karo.
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Repo select karo. Railway `package.json` dekh ke Node app khud build kar lega.
4. **Variables** tab me ye add karo:

   | Variable | Value (example) |
   |---|---|
   | `MC_HOST` | `play.yourserver.com` |
   | `MC_PORT` | `25565` |
   | `MC_USERNAME` | `RailwayBot` |
   | `MC_AUTH` | `offline` |
   | `MC_VERSION` | *(khali chhodo = auto)* |
   | `CHAT_INTERVAL_MS` | `30000` |
   | `MOVE_INTERVAL_MS` | `9000` |

5. Deploy ho jayega. Logs me `spawned` dikhe to bot andar hai.

### Option B — Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

---

## 2. Local test

```
cp .env.example .env
# .env me apna server daalo
npm install
npm start
```

Health check: http://localhost:3000

---

## 3. Auth — dhyan se padho

### Offline mode (aasaan) ✅

Server ki `server.properties` me:

```
online-mode=false
```

Aur bot me `MC_AUTH=offline`. Bas.

### Premium / Microsoft account ⚠️

Microsoft login ke liye ek baar browser me device-code flow karna padta hai,
jo Railway ke headless container me karne me dikkat aati hai.

Trick:

1. Locally ek baar `MC_AUTH=microsoft npm start` chalao, browser me login complete karo.
2. Ye file ban jayegi: `~/.minecraft/nmp-cache/` (ya project ke andar `nmp-cache/`).
3. Us folder ko repo me commit kar do (private repo!) ya Railway Volume pe mount karo.
4. Phir Railway pe `MC_AUTH=microsoft` set karke deploy karo.

Sabse simple raasta: **offline-mode server use karo** (personal/friends server ke liye theek hai).

---

## 4. Tuning

| Variable | Kaam |
|---|---|
| `CHAT_INTERVAL_MS` | Kitne ms me ek random message. `60000` = 1 min |
| `MOVE_INTERVAL_MS` | Kitne ms me ek random walk |
| `CHAT_ENABLED` | `false` = bilkul chat nahi karega |
| `MOVE_ENABLED` | `false` = sirf khada rahega |
| `CHAT_WORDS` | Comma-separated apne words |
| `MC_VERSION` | Auto-detect fail ho to pin karo (`1.20.4`, `1.21.1` ...) |

---

## 5. Common problems

| Problem ↕▾ | Fix ↕▾ |
|---|---|
| −`Unsupported protocol version` | `MC_VERSION` pin karo |
| `You are not whitelisted` | Server ki whitelist me username add karo |
| Bot spawn hoke turant kick | Server pe anti-bot / auth plugin ho sakta hai (AuthMe etc.) |
| Chat me kuch nahi dikh raha | Server ka chat filter / muted permission check karo |
| Bot gir ke lava me mar raha | `MOVE_INTERVAL_MS` badhao, ya `MOVE_ENABLED=false` |
| Railway pe crash loop | Logs dekho, `MC_HOST` galat ho sakta hai |
⚙

---

## 6. Structure

```
.
├── index.js          # bot ka pura logic
├── package.json
├── railway.json      # Railway config
├── .env.example
└── README.md
```

Made for Railway. Happy botting 🤖

