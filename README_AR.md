
# بوت مسنجر لنادي التخصص – جاهز بدون خبرة برمجية كبيرة

هذا مشروع بسيط يشغّل بوت فيسبوك مسنجر لصفحة النادي. يدعم:
- نبذة + فيديو
- التواصل مع صفحة النادي
- روابط مجموعات الدفع
- روابط مجموعات المواد
- خريطة المواد (Drive)
- خطة دراسية (Drive)
- قائمة سريعة (Quick Replies) + زر Get Started + قائمة ثابتة (Persistent Menu)

## المتطلبات
- صفحة فيسبوك للنادي
- تطبيق فيسبوك (Messenger) مربوط مع الصفحة
- **PAGE_ACCESS_TOKEN** من إعدادات Messenger
- **VERIFY_TOKEN** (كلمة سر من اختيارك)

## أسرع نشر: Glitch
1) افتح https://glitch.com → New Project → hello-express  
2) احذف الملفات الموجودة، وأنشئ ملفين:
   - `server.js` → الصق محتوى `server.js` من هذا المشروع
   - `package.json` → الصق محتوى `package.json` من هذا المشروع
3) من قائمة "Tools" → "Secrets" (Environment Variables) أضِف:
   - `PAGE_ACCESS_TOKEN` = توكن الصفحة من منصة المطورين
   - `VERIFY_TOKEN` = أي كلمة سر (اكتب نفس الكلمة أيضاً في إعدادات Webhook على فيسبوك)
4) انسخ رابط مشروعك العام من Glitch (مثلًا `https://your-app.glitch.me`).
5) في منصة مطوري فيسبوك → Messenger → Webhooks:
   - عنوان URL الاستدعاء: `https://your-app.glitch.me/webhook`
   - رمز التحقق: نفس قيمة `VERIFY_TOKEN` التي وضعتها
   - **تحقق وحفظ**
   - أضِف الاشتراكات: `messages`, `messaging_postbacks`
6) فعّل الزر الدائم والقائمة:
   - افتح في المتصفح: `https://your-app.glitch.me/setup` (ستظهر "Setup done ✅")
7) افتح ماسنجر الصفحة وجرب كتابة: `قائمة`

> ملاحظة: أثناء وضع التطوير (Development mode) فقط الأشخاص الذين لديهم Roles (أدمن/مطور/مختبر) على التطبيق يمكنهم التجربة. للنشر للعامة، قد تحتاج لمراجعة إذن `pages_messaging` ثم تبديل التطبيق إلى Live.

## تخصيص الروابط
- افتح `server.js` وابحث عن الكائن `LINKS` و `COURSES`
- غيّر الروابط والنصوص لتناسب تخصصك:
  - `ABOUT_TEXT` / `ABOUT_VIDEO`
  - `CLUB_PAGE`
  - `PAY_GROUPS`, `COURSE_GROUPS`
  - `STUDY_PLAN`, `COURSE_MAP_DRIVE`
  - في `COURSES` أضف: `"اسم المادة": "رابط الدرايف"`

## بدائل للنشر
- **Render**: أنشئ Web Service → Node → اربط GitHub أو ارفع الملفات → بيئة التشغيل ضع `PAGE_ACCESS_TOKEN`, `VERIFY_TOKEN`
- **Replit**: مشروع Node.js → الصق الملفات → Secrets → شغّل المشروع ثم استخدم الرابط العام.

## مشاكل شائعة
- خطأ "تعذر التحقق من صحة عنوان URL الاستدعاء أو رمز التحقق":
  - تأكد أن رابط الـ webhook ينتهي بـ `/webhook`
  - السيرفر يعمل ويستجيب على `GET /webhook` بإرجاع `hub.challenge`
  - `VERIFY_TOKEN` نفسه في السيرفر وفي صفحة فيسبوك
  - الرابط **https** عام (Glitch يوفر ذلك تلقائياً)
- لا تصل الرسائل:
  - تأكد من إضافة الاشتراكات `messages` و `messaging_postbacks`
  - تأكد أن الصفحة مشتركة مع التطبيق (Subscribe) من نفس صفحة الإعداد
  - جرّب من حساب له دور (أثناء التطوير)

بالتوفيق 🌟
