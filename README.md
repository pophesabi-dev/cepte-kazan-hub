# Earn On Demand

CEPTEKAZANÇ – GET PAID TO PLATFORMU

Modern, sade, hızlı ve güven veren bir Get-Paid-To (GPT) ödül platformu oluştur.

Platformun adı:

Ceptekazanç

Ana fikir:

Kullanıcılar görev yaparak, anket doldurarak, oyun/uygulama tekliflerini tamamlayarak ve ileride reklam izleyerek puan kazanır. Kazandıkları puanları daha sonra belirlenen ödüllere/çekim yöntemlerine dönüştürebilir.

Siteye ilk kez giren kişi 3-5 saniye içerisinde sitenin ne yaptığını anlamalıdır.

Kesinlikle karmaşık, aşırı animasyonlu veya amatör bir arayüz oluşturma.

Tasarım dili:

Freecash

GReward

Swagbucks

Gemi/ödül uygulamalarının modern dashboard tasarımları

gibi profesyonel GPT platformlarından ilham alabilir fakat tasarımı birebir kopyalama.

1. GENEL TASARIM

Arayüz:

Minimal

Modern

Premium

Güven veren

Mobil uyumlu

Responsive

Hızlı

Kolay anlaşılır

Renk paleti para/kazanç hissi vermeli ancak göz yorucu olmamalı.

Ana renkler:

Yeşil tonları

Koyu lacivert / koyu gri

Beyaz

Çok hafif altın/sarı vurgu

Arka plan sade fakat finans/kazanç temasını hissettirmeli.

Kesinlikle:

Fazla gradient

Fazla neon

Aşırı hareketli arka plan

Gereksiz 3D efekt

Fazla büyük yazılar

Karmaşık menüler

kullanma.

2. LOGO

"CEPTEKAZANÇ" adına uygun modern bir logo oluştur.

Logo:

Para kazanma

Mobil kullanım

Kazanç

Güven

Kolaylık

hissini vermeli.

Logo çok karmaşık olmamalı.

Örneğin:

Telefon + para

C harfi + coin

Cüzdan + telefon

Coin + check işareti

gibi sade bir ikon kullanılabilir.

Logo hem:

Web sitesi

Mobil web

PWA

Favicon

Uygulama ikonu

olarak kullanılabilecek şekilde tasarlanmalı.

3. LANDING PAGE

Ana sayfada kullanıcı siteye girdiğinde doğrudan ne yaptığını anlamalı.

Hero bölümünde:

"CEPTEKAZANÇ"

Ana mesaj:

Görev Yap, Puan Kazan, Kazancını Değerlendir.

Alt açıklama:

"Anketleri tamamla, oyunları ve uygulamaları dene, görevlerini tamamla ve puan kazan."

Ana buton:

Hemen Kazanmaya Başla

İkinci buton:

Nasıl Çalışır?

Hero alanında kullanıcıya GPT sisteminin mantığını görsel olarak anlat.

Örneğin:

Kayıt Ol

Görev Seç

Görevi Tamamla

Puan Kazan

4. KAYIT / GİRİŞ

Kullanıcıların şu yöntemlerle hesap oluşturabilmesini sağla:

Google ile giriş

Facebook ile giriş

E-posta + şifre

Authentication sistemi gerçek backend authentication kullanmalı.

Şifreler kesinlikle plaintext olarak tutulmamalı.

Session yönetimi güvenli yapılmalı.

Cookie kullanılıyorsa:

HttpOnly

Secure

SameSite

gibi güvenlik özellikleri kullanılmalı.

CSRF koruması uygulanmalı.

Rate limiting uygulanmalı.

Brute-force login saldırılarına karşı koruma olmalı.

5. KULLANICI DASHBOARD

Kullanıcı giriş yaptıktan sonra dashboard görmeli.

Üst bölüm:

Toplam Puan
Bugün Kazanılan
Bekleyen Puan
Tamamlanan Görevler

gibi kartlar.

Örneğin:

Toplam Puan
1.250

Bugünkü Kazanç
350

Bekleyen
100

Tamamlanan Görev
12

Ancak şimdilik gerçek para/puan değerlerini varsayma.

Puanların değerleri admin panelinden sonradan ayarlanabilir olmalı.

6. GÖREVLER

Ana dashboard'da büyük bir:

Görevler

alanı oluştur.

Kategori sistemi:

Anketler

Anket doldurarak puan kazan.

Oyunlar

Oyunları indir, belirli seviyelere ulaş, görevleri tamamla.

Uygulamalar

Belirli uygulamaları indir veya belirlenen aksiyonları gerçekleştir.

Teklifler

Offerwall / offer provider görevleri.

Reklam İzle

İleride Google reklamları üzerinden reklam izleyerek puan kazanma sistemi.

Reklam sistemi şu an aktif olmak zorunda değil.

Şimdilik UI'da:

Yakında

veya

Çok Yakında

şeklinde gösterilebilir.

Google Ads entegrasyonu için ileride kullanılabilecek ayrı bir modüler sistem hazırla.

7. OFFERWALL / PARTNER SİSTEMİ

Yaklaşık 10 adet harici offerwall / görev sağlayıcısı ekleyebileceğim bir yapı oluştur.

Örneğin:

Torox

BitLabs

Offerwall sağlayıcıları

Anket sağlayıcıları

Oyun teklif sağlayıcıları

Ancak API bilgileri şu anda bulunmadığı için sahte API anahtarı veya sahte entegrasyon oluşturma.

Bunun yerine:

Provider / Offerwall Adapter Architecture

oluştur.

Örneğin her provider için:

provider adı

logo

aktif/pasif

API key

API secret

postback URL

callback secret

puan çarpanı

minimum ödül

ülke desteği

kategori

sıralama

gibi alanlar admin panelinden yönetilebilir olsun.

Provider'ları kolayca açıp kapatabileyim.

8. POSTBACK / OFFER TRACKING

Harici offerwall sağlayıcılarından gelecek görev tamamlanma bildirimleri için güvenli postback sistemi oluştur.

Çok önemli:

Bir kullanıcı sadece frontend üzerinden:

/reward
veya
/complete-task

gibi bir endpoint çağırarak puan alamamalı.

Puan verme işlemi sadece güvenilir server-side doğrulama sonrasında yapılmalı.

Postbacklerde:

signature verification

HMAC doğrulaması

timestamp kontrolü

nonce/replay protection

transaction ID kontrolü

duplicate transaction protection

provider doğrulaması

kullan.

Aynı transaction ID ikinci kez geldiğinde tekrar puan verme.

9. PUAN SİSTEMİ

Şu anda ürün/ödül puanlarını belirlemiyorum.

Bu nedenle sistemin puan ekonomisini hard-code yapma.

Admin panelinden ileride:

görev ödülü

puan değeri

minimum çekim

bonus

referral bonus

provider multiplier

ayarlanabilsin.

Puan sistemi için transaction ledger kullan.

Sadece:

user.points += 100

gibi basit bir sistem kullanma.

Bunun yerine immutable transaction kayıtları oluştur.

Örneğin:

OFFER_COMPLETED

SURVEY_COMPLETED

REFERRAL_BONUS

ADMIN_ADJUSTMENT

WITHDRAWAL

REVERSAL

CHARGEBACK

gibi transaction türleri olsun.

Böylece bütün puan hareketleri takip edilebilir olsun.

10. PUAN MANİPÜLASYONUNU ENGELLE

Frontend hiçbir zaman puanın gerçek kaynağı olmamalı.

Kullanıcı browser console açarak:

points = 999999

gibi bir şey yaptığında puanı değiştirememeli.

Tüm kritik işlemler backend tarafından doğrulanmalı.

Frontend'den gelen:

puan

ödül miktarı

görev tamamlandı bilgisi

referral bonusu

withdrawal amount

gibi değerleri güvenme.

Server tarafında yeniden doğrula.

11. AYNI CİHAZDAN ÇOKLU HESAP

Aynı cihazdan çok sayıda hesap oluşturulmasını ve abuse edilmesini azaltacak risk sistemi oluştur.

Ancak yalnızca IP adresine güvenme.

Risk sinyalleri:

IP

IP reputation

VPN/proxy/Tor sinyalleri

device/browser risk signals

account age

davranışsal anomaliler

çok hızlı görev tamamlama

çok sayıda hesap

referral abuse

aynı ödeme bilgileri

aynı doğrulanmış telefon

şüpheli login davranışı

gibi sinyallerle bir risk score oluştur.

ÖNEMLİ:

Tek bir sinyale dayanarak gerçek kullanıcıları otomatik olarak kalıcı şekilde banlama.

Örneğin VPN kullanmak tek başına otomatik ban sebebi olmasın.

Riskli kullanıcı:

ekstra doğrulama

withdrawal review

görev kısıtlaması

manuel inceleme

gibi aşamalara alınabilsin.

12. VPN / PROXY

VPN/proxy/Tor tespiti için backend tarafında provider entegrasyonu yapılabilecek bir yapı oluştur.

Admin panelinde:

VPN detection:
ON/OFF

Proxy detection:
ON/OFF

Tor detection:
ON/OFF

gibi ayarlar bulunabilsin.

Risk seviyesine göre aksiyon belirlenebilsin:

LOW
MEDIUM
HIGH

Örneğin HIGH risk kullanıcı withdrawal istediğinde manuel inceleme gerektirsin.

13. TELEFON DOĞRULAMA

Kullanıcı para/ödül çekmek istediğinde telefon doğrulaması iste.

Akış:

Kullanıcı withdrawal seçer.

Telefon numarası ister.

SMS OTP gönderilir.

Kullanıcı kodu girer.

Backend OTP'yi doğrular.

Telefon doğrulanır.

Withdrawal işlemi devam eder.

OTP sistemi:

rate limited

expiration

retry limit

brute-force protection

içermeli.

Telefon numarasını plaintext loglama.

14. REFERRAL / ARKADAŞ DAVET ET

Kullanıcıya özel referral kodu oluştur.

Örneğin:

CEPTEKAZANC-ABC123

veya referral linki.

Kullanıcı:

Arkadaşını Davet Et

bölümünden referral linkini paylaşabilsin.

Referral dashboard:

Davet edilen kişi sayısı

Aktif referral sayısı

Referral kazancı

Bekleyen referral

Toplam referral

gösterilsin.

Ancak referral abuse'u engelle.

Aynı kişinin:

kendi referral linkinden kayıt olması

aynı cihazdan hesap açması

sahte hesap oluşturması

hızlı şekilde referral bonus üretmesi

gibi durumları risk sistemiyle kontrol et.

Referral bonusu sadece gerçek ve doğrulanmış şartlar sağlandığında oluştur.

15. WITHDRAWAL SİSTEMİ

Şimdilik gerçek ödeme sağlayıcılarını bağlama.

Ancak ileride bağlanabilecek şekilde modüler mimari oluştur.

Örneğin:

PayPal

banka/ödeme sağlayıcıları

gift card

kripto gibi seçenekler

ileride eklenebilecek.

Şimdilik withdrawal sayfasında:

Ödül seçenekleri yakında aktif olacak.

gösterilebilir.

Admin panelinden withdrawal yöntemleri açılıp kapatılabilsin.

16. ADMIN PANEL

Çok kapsamlı bir admin panel oluştur.

Admin paneline yalnızca benim belirlediğim admin hesapları erişebilsin.

Normal kullanıcı admin paneline erişememeli.

Frontend'de admin butonunu gizlemek yeterli değildir.

Backend authorization zorunlu.

Role Based Access Control kullan.

Roller:

USER

MODERATOR

ADMIN

SUPER_ADMIN

gibi olabilir.

İlk aşamada sadece SUPER_ADMIN hesabı oluştur.

Admin panelinden:

Kullanıcılar

kullanıcı ara

kullanıcı görüntüle

hesap durumu

kayıt tarihi

son giriş

risk skoru

doğrulamalar

puan geçmişi

referral geçmişi

görev geçmişi

withdrawal geçmişi

Offerwalls

provider ekle

provider sil

aktif/pasif

API bilgileri

postback ayarları

multiplier

ülke

kategori

sıralama

Görevler

görevleri görüntüle

görev aktif/pasif

ödül

kategori

provider

limitler

Puanlar

transaction ledger

manuel düzeltme

reversal

chargeback

Withdrawals

pending

approved

rejected

manual review

Referrals

referral listesi

abuse kontrolü

bonuslar

Güvenlik

risk skorları

IP riskleri

VPN/proxy tespitleri

şüpheli hesaplar

login denemeleri

audit log

Site Ayarları

logo

site adı

açıklama

renkler

maintenance mode

referral ayarları

withdrawal ayarları

puan ayarları

reklam ayarları

17. AUDIT LOG

Admin panelinde yapılan kritik işlemleri kaydet.

Örneğin:

admin login

kullanıcı banlama

puan değiştirme

withdrawal onaylama

provider değiştirme

ayar değiştirme

Her kayıt:

admin

işlem

tarih

IP

hedef kullanıcı

eski değer

yeni değer

gibi bilgiler içersin.

Audit log kullanıcı tarafından değiştirilememeli.

18. GÜVENLİK

Uygulamayı production seviyesinde güvenlik prensipleriyle geliştir.

Özellikle:

SQL Injection

XSS

CSRF

SSRF

IDOR

Broken Access Control

Authentication bypass

privilege escalation

session hijacking

brute force

rate limit bypass

replay attacks

duplicate rewards

race conditions

referral abuse

reward manipulation

withdrawal manipulation

API abuse

webhook spoofing

gibi açıkları engelle.

Kullanıcı ID'sini değiştirerek başka kullanıcının hesabına erişilememeli.

Örneğin:

/user/123

yerine:

/user/124

yazıldığında başka kullanıcının bilgileri dönmemeli.

Her endpoint server-side authorization kontrolünden geçmeli.

19. RACE CONDITION KORUMASI

Özellikle puan ve withdrawal işlemlerinde race condition önle.

Aynı isteğin aynı anda 100 kere gönderilmesi:

+100 puan

işleminin 100 kere gerçekleşmesine izin vermemeli.

Database transaction / locking / idempotency mekanizmaları kullan.

20. RATE LIMIT

Özellikle:

login

register

OTP

referral

withdrawal

offer completion

postback

API endpointleri

için rate limiting uygula.

Rate limit frontend'de değil backend'de uygulanmalı.

21. DATABASE

İyi yapılandırılmış ilişkisel database kullan.

Örneğin PostgreSQL tercih edilebilir.

Temel tablolar:

users
profiles
sessions
roles
user_roles
points_ledger
offers
offer_providers
offer_completions
postbacks
referrals
withdrawals
withdrawal_methods
phone_verifications
risk_events
risk_scores
admin_audit_logs
login_attempts
site_settings

gibi tablolar oluştur.

Database ilişkilerini düzgün kur.

22. PRIVACY

Kullanıcı verilerini gereksiz yere toplama.

Şifreleri hashle.

API secret gibi bilgileri frontend'e gönderme.

Secret key'leri environment variables / secret manager üzerinden kullan.

Admin panelinde API secret'ın tamamını ekranda açık şekilde gösterme.

23. MOBİL UYGULAMA / PWA

Site mobilde çok iyi çalışmalı.

Ayrıca PWA desteği ekle.

Kullanıcı:

"Telefonuna ekle"

diyerek Ceptekazanç'ı uygulama gibi kullanabilsin.

PWA:

manifest

icons

splash screen

responsive UI

service worker

install prompt

içermeli.

Şimdilik native Android/iOS uygulaması üretmek zorunda değilsin.

Ancak mimari ileride React Native / Flutter uygulamasına bağlanabilecek şekilde API-first hazırlanmalı.

24. NAVIGATION

Desktop:

Logo

Ana Sayfa
Görevler
Anketler
Oyunlar
Kazançlarım
Arkadaşını Davet Et
Çekim
Profil

ve sağ üst:

Puan
Bildirim
Profil

olsun.

Mobilde bottom navigation kullanılabilir:

Ana Sayfa
Görevler
Kazanç
Davet
Profil

25. GÖREV KARTLARI

Görevler şu şekilde gösterilebilir:

[Provider Logo]

Yeni oyun görevini tamamla

"Seviye 10'a ulaş"

??? Puan

[Görevi Gör]

Puan miktarı henüz belirlenmediği için UI'da gerçek bir değer uydurma.

Bunun yerine:

Ödül daha sonra belirlenecek

veya admin tarafından ayarlanabilir placeholder kullan.

26. İSTATİSTİKLER

Dashboard'da kullanıcıya:

toplam kazanç

bugün

bu hafta

tamamlanan görev

referral

gibi istatistikler göster.

Grafik gerekiyorsa sade grafik kullan.

Aşırı dashboard karmaşası oluşturma.

27. BİLDİRİMLER

Notification sistemi oluştur.

Örneğin:

"Anket ödülünüz hesabınıza eklendi."

"Çekim talebiniz incelemeye alındı."

"Yeni görevler geldi."

gibi bildirimler.

28. DESTEK

Dashboard'a:

Destek

bölümü ekle.

FAQ sistemi oluştur.

İleride destek ticket sistemi eklenebilecek şekilde tasarla.

29. EMPTY STATES

Henüz veri olmadığında boş beyaz ekran gösterme.

Örneğin:

"Henüz tamamlanmış görevin yok."

"İlk görevini tamamlayarak puan kazanmaya başla."

gibi açıklayıcı empty state kullan.

30. HATA YÖNETİMİ

Kullanıcıya teknik hata mesajları gösterme.

Örneğin:

"SQL error..."

gibi bilgiler kesinlikle görünmemeli.

Kullanıcıya:

"Bir sorun oluştu. Lütfen tekrar deneyin."

gibi güvenli mesaj göster.

Gerçek hata detayları server-side loglarda tutulmalı.

31. SECURITY TEST / SELF AUDIT

Uygulamayı oluşturduktan sonra kendi kendine kapsamlı bir güvenlik incelemesi yap.

Şunları test et:

Kullanıcı başka kullanıcının hesabına erişebiliyor mu?

Kullanıcı frontend'den puan değiştirebiliyor mu?

Aynı görev iki kere ödüllendirilebiliyor mu?

Aynı postback iki kere ödül veriyor mu?

Race condition ile puan çoğaltılabiliyor mu?

Referral sistemi abuse edilebiliyor mu?

Withdrawal miktarı manipüle edilebiliyor mu?

Admin endpointlerine USER erişebiliyor mu?

IDOR mevcut mu?

JWT/session manipülasyonu mümkün mü?

Rate limit bypass edilebiliyor mu?

OTP brute force yapılabiliyor mu?

Webhook sahte olarak gönderilebiliyor mu?

SQL injection mümkün mü?

XSS mümkün mü?

CSRF mümkün mü?

API secret frontend'e sızıyor mu?

Kullanıcı başka kullanıcının transaction geçmişini görebiliyor mu?

Aynı cihazdan abuse kontrolü çalışıyor mu?

VPN/proxy risk sistemi çalışıyor mu?

Açık bulursan önce düzelt, sonra tekrar test et.

Gerçek bir production güvenlik garantisi veremeyeceğini kabul et; ancak OWASP prensiplerine göre güvenlik kontrollerini uygula.

32. TESTLER

Unit test + integration test + end-to-end test oluştur.

Özellikle:

Authentication
Authorization
Points
Offers
Postbacks
Referrals
Withdrawals
Admin
Rate limiting
Security

test edilmeli.

33. DEMO MODE

Henüz gerçek provider/API entegrasyonları olmadığı için bir DEMO MODE oluştur.

Demo modunda:

örnek görevler

örnek providerlar

örnek dashboard verileri

gösterilebilir.

Fakat demo verileri gerçek puan olarak işlenmemeli.

Kod içerisinde DEMO_MODE açıkça belirtilmeli.

Production'a geçerken kapatılabilmeli.

34. SEO

Landing page SEO uyumlu olsun.

Title:

Ceptekazanç – Görev Yap, Puan Kazan

Meta description:

Ceptekazanç ile anketleri tamamla, oyunları ve uygulamaları dene, görevlerini tamamlayarak puan kazan.

SEO için:

semantic HTML

Open Graph

favicon

sitemap

robots.txt

oluştur.

35. PERFORMANS

Site hızlı açılmalı.

Optimize et:

images

lazy loading

database queries

caching

API requests

bundle size

Gereksiz kütüphaneler kullanma.

36. ERİŞİLEBİLİRLİK

WCAG prensiplerine mümkün olduğunca uy.

yeterli kontrast

keyboard navigation

semantic HTML

aria-label

focus states

mobil kullanılabilirlik

sağla.

37. TASARIM FELSEFESİ

En önemli kural:

Kullanıcı siteye girdiğinde "Ben burada nasıl para/puan kazanacağım?" sorusunun cevabını hemen görmeli.

Ana sayfa gereksiz bilgilerle dolu olmamalı.

Öncelik:

Görevleri göster

Kazanç mantığını anlat

Kullanıcıyı kayıt olmaya yönlendir

Güven oluştur

Dashboard'da görevleri kolayca buldur

38. GELECEKTE EKLENEBİLECEK SİSTEMLER İÇİN MİMARİ

Şu anda aktif olmayan ancak mimaride yer bırakılabilecek özellikler:

Google Ads / reklam izleme

10+ offerwall

daha fazla anket sağlayıcısı

oyun görevleri

gift card sistemi

farklı ödeme yöntemleri

bonus kodları

günlük bonus

streak sistemi

leaderboard

achievement sistemi

kampanyalar

özel görevler

kullanıcı seviyeleri

premium/VIP sistemleri

push notifications

native Android/iOS uygulaması

Bunları şu anda aktif etme.

Mimarinin ileride eklenmesine uygun olmasını sağla.

39. KOD KALİTESİ

Kod:

temiz

modüler

okunabilir

sürdürülebilir

component-based

API-first

secure-by-default

olmalı.

Secrets kesinlikle source code içine yazılmamalı.

.env.example oluştur.

Database migration sistemi kullan.

README oluştur.

Kurulum adımlarını açıkla.

Development / staging / production ayrımını mümkün olduğunca destekle.

40. SONUÇ

Önce çalışan bir MVP oluştur.

MVP'de:

Landing page

Register/Login

Dashboard

Görevler

Anketler

Oyunlar

Offerwall alanları

Referral

Points ledger

Profile

Phone verification altyapısı

Withdrawal altyapısı

Admin panel

Security/risk sistemi

PWA

bulunsun.

Gerçek ödeme sistemi veya gerçek offerwall API bilgileri yoksa bunları uydurma.

Placeholder/mock provider kullan.

Ancak mimari gerçek API entegrasyonlarının daha sonra kolayca eklenmesine uygun olsun.

ÇOK ÖNEMLİ

Uygulamayı yalnızca güzel görünen bir frontend olarak oluşturma.

Backend, database, authentication, authorization, points ledger, fraud prevention, webhook validation ve admin güvenliği gerçek şekilde tasarlanmalı.

Frontend'de yapılan hiçbir değişikliğe güvenme.

Kullanıcının puanını yalnızca backend belirlemeli.

Özellikle ödül sistemi için server-authoritative architecture kullan.

Kodun sonunda oluşturduğun mimariyi, database şemasını, API endpointlerini, güvenlik kontrollerini ve test sonuçlarını açıklayan bir README oluştur.

Siteyi geliştirdikten sonra mevcut kod üzerinde bir security review yap ve bulduğun problemleri kendin düzelt.

Ceptekazanç'in tasarımı sade, profesyonel, güven veren ve kazanç odaklı olmalı.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cepte-kazan-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b83bc81f-695a-40cc-9a2f-1af3e275c6b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
