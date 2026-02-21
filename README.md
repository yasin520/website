# Kido Studio Website

Statik landing sitesi (GitHub Pages uyumlu) ve API entegrasyonuna hazir temel yapi.

## Proje yapisi

- `index.html`: Ana sayfa
- `blackhole.html`: Blackhole app sayfasi
- `hydronudge.html`: Hydronudge app sayfasi
- `css/`: Sayfa bazli stiller
- `js/config.js`: API ve store URL konfigurasyonu
- `js/kido.js`: Tema, dil, animasyon, notify formu ve store link baglama

## API ve store ayari

`js/config.js` dosyasini duzenle:

```js
window.KIDO_CONFIG = {
  apiBaseUrl: "https://api.senin-domainin.com",
  endpoints: {
    notify: "/notify"
  },
  storeLinks: {
    blackhole: {
      ios: "https://apps.apple.com/...",
      android: "https://play.google.com/store/apps/details?id=..."
    },
    hydronudge: {
      ios: "",
      android: ""
    }
  }
};
```

- `apiBaseUrl` veya `endpoints.notify` bos kalirsa notify formu backend'e istek atmaz.
- `storeLinks` bos kalirsa ilgili store butonlari otomatik pasif gorunur.

## GitHub Pages ile yayinlama

1. Repo olustur (`website` gibi).
2. Bu klasoru repoya push et.
3. GitHub'da `Settings > Pages` ac.
4. `Source` olarak `Deploy from a branch` sec.
5. Branch olarak `main`, folder olarak `/ (root)` sec.
6. Kaydet ve verilen `https://kullaniciadi.github.io/repo-adi/` adresini ac.

## Ilk push komutlari (repo daha olusmadiysa)

```bash
git init
git add .
git commit -m "Prepare site for GitHub Pages and API config"
git branch -M main
git remote add origin https://github.com/<kullanici>/<repo>.git
git push -u origin main
```
