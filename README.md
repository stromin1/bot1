# Railway Minecraft Bot (Python)

Python bot jo `craft
```

Health: http://localhost:3000

---

## 3. Auth

### Offline mode (aasaan) ✅

Server ki `server.properties` me `online-mode=false`, aur `MC_AUTH=offline`.

### AuthMe / cracked server

`MC_LOGIN_PASSWORD` set karo — spawn ke baad bot khud `/login <password>` bhejega.

### Premium / Microsoft ⚠️

Headless container me device-code login mushkil hai. Locally ek baar
`MC_AUTH=microsoft python bot.py` chalao → `nmp-cache/` folder banega →
usko Railway **Volume** pe mount karo → `MC_AUTH=microsoft` set karke deploy.

---

## 4. Tuning

| Variable ↕▾ | Kaam ↕▾ |
|---|---|
| −`CHAT_INTERVAL_MS` | `60000` = har 1 min, `120000` = 2 min |
| −`MOVE_INTERVAL_MS` | Random walk ka gap (default 9s) |
| −`CHAT_ENABLED` | `false` = chat band |
| −`MOVE_ENABLED` | `false` = sirf khada rahega |
| −`CHAT_WORDS` | Comma separated apne words |
| −`MC_VERSION` | Auto-detect fail ho to `1.20.4` / `1.21.1` |
⚙

---

## 5. Common problems

| Problem ↕▾ | Fix ↕▾ |
|---|---|
| −`Error reading package.json as JSON` | `package.json` adhura hai — is ZIP wali file use karo |
| −`Unsupported protocol version` | `MC_VERSION` pin karo |
| −`You are not whitelisted` | Whitelist me username add karo |
| −Bot kick / `Please login` | `MC_LOGIN_PASSWORD` set karo |
| −`Cannot find module 'mineflayer'` | `npm install` fail hua — logs dekho |
| −Server offline | Panel se server start karo |
⚙

---

## 6. Structure

```
.
├── bot.py            # pura bot logic (Python)
├── requirements.txt 
```

Happy botting 🤖

