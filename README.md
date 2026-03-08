# 📱 توار — اپ Android (Expo)

## ✅ مزیت Expo: بدون Android Studio، APK می‌گیری!

---

## 🚀 مراحل دریافت APK (فقط ۵ مرحله)

### مرحله ۱ — Node.js نصب کن
دانلود از: https://nodejs.org (نسخه LTS)

---

### مرحله ۲ — پوشه پروژه رو extract کن
فایل zip رو باز کن، پوشه `TovarExpo` رو یه جایی بذار (مثلاً Desktop)

---

### مرحله ۳ — پکیج‌ها رو نصب کن
پنجره CMD یا Terminal باز کن:
```bash
cd Desktop/TovarExpo
npm install
```
(چند دقیقه طول می‌کشه)

---

### مرحله ۴ — حساب Expo بساز (رایگانه)
برو به: https://expo.dev/signup
ثبت‌نام کن (نیاز به کارت اعتباری نداره)

---

### مرحله ۵ — EAS CLI نصب کن و Build بگیر
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

- بعد از `eas login`، ایمیل و پسورد Expo رو وارد کن
- یه سوال می‌پرسه «Create a new EAS project?» — بزن **Y**
- Build روی سرورهای Expo انجام میشه (حدود ۱۰-۱۵ دقیقه)
- لینک APK برات میاد — دانلود کن، روی گوشی نصب کن ✅

---

## 📲 نصب APK روی گوشی

۱. فایل APK رو دانلود کن
۲. به گوشیت انتقال بده (کابل، تلگرام، یا لینک مستقیم)
۳. روی گوشی: **Settings > Security > Unknown Sources = ON**
۴. فایل APK رو باز کن و نصب کن

---

## 🔧 تغییر آدرس سرور

اگه IP سرور عوض شد، فایل `src/utils/config.js` رو باز کن:
```javascript
export const SERVER_URL = 'http://185.208.79.216:8080';
export const WS_URL = 'ws://185.208.79.216:8080/ws';
```

---

## ❓ مشکلات رایج

**خطای «Unable to connect»:**
- چک کن سرور روشنه و پورت 8080 باز هست
- از همون شبکه‌ای باش که سرور قابل دسترسه

**خطای «Unknown Sources»:**
Settings > Apps > Special App Access > Install Unknown Apps > فعال کن

**خطای npm:**
```bash
npm cache clean --force
npm install
```

---

## ⚡ تست سریع بدون Build

اگه گوشیت رو داری و می‌خوای سریع تست کنی:
۱. نصب کن: **Expo Go** از Play Store
۲. داخل پروژه بزن: `npx expo start`
۳. QR Code رو با Expo Go اسکن کن → اپ بلافاصله باز میشه!

(این فقط برای تست هست، نه نصب دائمی)
