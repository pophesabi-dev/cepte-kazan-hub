
insert into public.offer_providers (slug, name, category, is_active, sort_order, min_reward) values
  ('demo-surveys','Demo Anket Ağı','SURVEY',true,10,0),
  ('demo-games','Demo Oyun Ağı','GAME',true,20,0),
  ('demo-apps','Demo Uygulama Ağı','APP',true,30,0),
  ('demo-offerwall','Demo Offerwall','OFFERWALL',true,40,0),
  ('torox','Torox','OFFERWALL',false,50,0),
  ('bitlabs','BitLabs','SURVEY',false,60,0),
  ('provider-7','Sağlayıcı 7','OFFERWALL',false,70,0),
  ('provider-8','Sağlayıcı 8','GAME',false,80,0),
  ('provider-9','Sağlayıcı 9','APP',false,90,0),
  ('ads-module','Reklam Modülü','ADS',false,100,0);

insert into public.provider_secrets (provider_id)
  select id from public.offer_providers;

insert into public.offers (provider_id, title, description, requirement, category, reward_points, is_demo, sort_order)
select p.id, v.title, v.description, v.requirement, v.category, null, true, v.sort_order
from (values
  ('demo-surveys','Kısa profil anketi','Profilini tamamla ve sana uygun anketleri aç.','5 dakikalık anket','SURVEY',1),
  ('demo-surveys','Alışveriş alışkanlıkları anketi','Kısa bir tüketici anketini tamamla.','10 soruluk anket','SURVEY',2),
  ('demo-surveys','Mobil kullanım anketi','Telefon kullanım alışkanlıkların hakkında anket.','8 dakikalık anket','SURVEY',3),
  ('demo-games','Strateji oyununda 10. seviye','Oyunu indir ve 10. seviyeye ulaş.','Seviye 10','GAME',4),
  ('demo-games','Bulmaca oyununda 50 bölüm','Oyunu indir ve 50. bölümü tamamla.','Bölüm 50','GAME',5),
  ('demo-apps','Uygulamayı indir ve aç','Uygulamayı yükle ve ilk açılışı tamamla.','Kurulum + ilk açılış','APP',6),
  ('demo-apps','Hesap oluştur','Uygulamada ücretsiz hesap oluştur.','Kayıt tamamlama','APP',7),
  ('demo-offerwall','Günlük teklif duvarı','Teklif duvarındaki görevlerden birini tamamla.','Değişken','OFFERWALL',8)
) as v(slug,title,description,requirement,category,sort_order)
join public.offer_providers p on p.slug = v.slug;

insert into public.withdrawal_methods (slug, name, is_active, min_points, sort_order) values
  ('paypal','PayPal',false,10000,1),
  ('bank','Banka Havalesi',false,10000,2),
  ('giftcard','Hediye Kartı',false,5000,3),
  ('crypto','Kripto',false,20000,4);
