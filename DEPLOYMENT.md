# Gurme Enginar — Yayın Rehberi

**Mimari:** Netlify (Frontend) + Render (Backend) + MongoDB Atlas (Veritabanı). Üç servis de ücretsiz katmanda başlar.

> ⏱ Tahmini süre: ~30 dakika
> 💰 Aylık maliyet: $0 (ücretsiz katmanlar)

---

## ✅ Ön Hazırlık

1. **GitHub hesabı** (yoksa açın: https://github.com)
2. Kodu GitHub'a push edin:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create gurme-enginar --public --source=. --push
   # ya da elle: https://github.com/new
   ```

---

## 1️⃣ MongoDB Atlas (Veritabanı) — ~10 dk

1. https://www.mongodb.com/cloud/atlas/register adresinden ücretsiz hesap açın.
2. **Build a Database** → **M0 FREE** seçin (Bölge: Frankfurt veya yakını).
3. **Database Access** → **Add New Database User**
   - Username: `gurme`
   - Password: güçlü bir şifre üretin ve **kaydedin** (Atlas size bir kez gösterir).
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
   *(Render'ın değişken IP'leri olduğu için bu en pratik yol — daha sonra Render IP listesiyle daraltabilirsiniz.)*
5. **Database** → **Connect** → **Drivers** → Python 3.x → Connection string'i kopyalayın:
   ```
   mongodb+srv://gurme:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   `<password>` kısmını gerçek şifrenizle değiştirin. **Bu URL'i bir kenara yazın.**

---

## 2️⃣ Render (Backend) — ~10 dk

1. https://render.com adresine GitHub ile giriş yapın.
2. **New +** → **Web Service** → GitHub repo'nuzu seçin (`gurme-enginar`).
3. Render `render.yaml` dosyasını otomatik algılar. Onaylayın.
4. **Environment Variables** bölümüne şunları girin:

   | Key | Value |
   |---|---|
   | `MONGO_URL` | (Atlas'tan kopyaladığınız bağlantı dizesi) |
   | `DB_NAME` | `gurme_enginar` |
   | `CORS_ORIGINS` | *(şimdilik boş bırakın, Netlify URL'i öğrenince doldururuz)* |
   | `EMERGENT_LLM_KEY` | Emergent profilinizden alın (Profile → Universal Key) |

5. **Create Web Service** butonuna basın. Build ~3-5 dk sürer.
6. Yayın tamamlanınca size **`https://gurme-enginar-api.onrender.com`** gibi bir URL verir. **Kaydedin.**
7. Test edin: tarayıcıda `https://<your-render-url>/api/` açın. Şunu görmelisiniz:
   ```json
   {"app":"Gurme Enginar","status":"online","ts":"..."}
   ```

> ⚠ **Ücretsiz katman uyarısı:** Render free tier 15 dakika boşta kalırsa servisi uyutur. İlk istek 30-50 saniye sürebilir. Production için $7/ay Starter plan veya bir cron-ping servisi (cron-job.org → 14 dk'da bir `/api/` ping atın) kullanın.

---

## 3️⃣ Netlify (Frontend) — ~5 dk

1. https://app.netlify.com adresine GitHub ile giriş yapın.
2. **Add new site** → **Import an existing project** → GitHub → `gurme-enginar` repo seçin.
3. Netlify `netlify.toml` dosyasını otomatik algılar. Şu ayarları doğrulayın:
   - **Base directory:** `frontend/`
   - **Build command:** `yarn install --frozen-lockfile && yarn build`
   - **Publish directory:** `frontend/build`
4. **Add environment variables** bölümünde:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | Render URL'iniz (örn `https://gurme-enginar-api.onrender.com`) — **sonunda `/` olmamalı** |
   | `CI` | `false` |

5. **Deploy site** butonuna basın. Build ~2-3 dk sürer.
6. Yayın tamamlanınca size **`https://random-name-12345.netlify.app`** verir.
7. (İsteğe bağlı) **Site settings → Change site name** ile `gurme-enginar.netlify.app` gibi anlamlı bir ad seçin.

---

## 4️⃣ CORS'u Güncelle — ~2 dk

Netlify URL'inizi öğrendiğinize göre Render'a geri dönün:

1. Render dashboard → `gurme-enginar-api` → **Environment**
2. `CORS_ORIGINS` değişkenini güncelleyin:
   ```
   https://gurme-enginar.netlify.app
   ```
   (Sonunda `/` olmamalı. Birden fazla origin varsa virgülle ayırın.)
3. **Save Changes** — Render servisi otomatik yeniden başlatır.

---

## 5️⃣ Test Et

1. Netlify URL'inizi tarayıcıda açın.
2. **Karşılama sayfası** açılmalı (Gurme Enginar hero, canlı önizleme).
3. "Panele Gir" butonuna basın → Dashboard açılmalı, **3 örnek depo** seedlenmeli.
4. "Şalteri İndir" butonuna basın → kırmızı flash + sesli alarm + bildirim.
5. "Yapay Zeka Analizi → Analiz Et" → Claude'dan Türkçe rapor.
6. Settings → IoT Bağlantısı → endpoint URL'inizi gerçek sensörünüze ekleyin.

---

## 🔧 Sorun Giderme

**"Failed to fetch" / network hatası:**
- CORS_ORIGINS doğru Netlify URL'ini içeriyor mu? Sonunda `/` yok değil mi?
- `REACT_APP_BACKEND_URL` doğru Render URL'i mi? Sonunda `/` yok değil mi?
- Render servisi uyanık mı? `https://<render-url>/api/` doğrudan açın.

**Render servisi sürekli "Failed":**
- MongoDB Atlas Network Access'te `0.0.0.0/0` izinli mi?
- Atlas şifresinde özel karakter varsa URL-encode edilmiş mi? (`@` → `%40`)

**AI Analizi çalışmıyor:**
- `EMERGENT_LLM_KEY` doğru girildi mi? Bakiye var mı? (Emergent → Profile → Universal Key)

**Frontend buildleniyor ama boş sayfa:**
- Browser console'da hata var mı?
- `REACT_APP_BACKEND_URL` set edilmiş mi? Tanımlı değilse build sırasında `undefined` olur.

---

## 🚀 Ekstra İyileştirmeler (İsteğe Bağlı)

- **Custom Domain:** Netlify → Domain settings → Add custom domain (`gurmeengnar.com` gibi). DNS'i Netlify'a yönlendirin. SSL otomatik.
- **Render uyku problemi için ping:** https://cron-job.org → 14 dakikada bir `https://<render-url>/api/` GET isteği atın.
- **Atlas IP daraltma:** Network Access'i Render'ın gerçek IP'leriyle sınırlayın (Render docs > Static Outbound IPs).
- **Sentry / Logtail entegrasyonu:** Production hatalarını takip için.

---

**MikroPlus / Onur S. Alpdoğan** • Gurme Enginar
