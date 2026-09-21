# День релізу: відправити «Клює» на рев'ю в Google Play

Усе, що можна було підготувати заздалегідь, уже готово. Лишаються дії, які
може зробити лише власник акаунтів. Тексти для полів — у
[`google-play.md`](google-play.md), тут лише порядок.

## Що вже лежить готове

| Що                             | Де                                            |
| ------------------------------ | --------------------------------------------- |
| Підписаний AAB для Play        | `~/Desktop/Kliuye-1.0.0.aab`                  |
| Іконка 512×512                 | `assets/store/play-icon-512.png`              |
| Банер 1024×500                 | `assets/store/feature-graphic.png`            |
| Скріншоти телефона             | `assets/store/screenshots/`                   |
| Політика приватності (HTML)    | `docs/privacy/index.html`                     |
| Ключ завантаження (upload key) | `secrets/upload-keystore.jks` + `.properties` |

> **Ключ завантаження — зроби резервну копію сьогодні.** Скопіюй теку
> `secrets/` на флешку чи в менеджер паролів. Без неї наступні версії
> застосунку не підписати тим самим ключем. Якщо його все ж втрачено, Google
> дозволяє скинути upload key через підтримку Play Console, але це дні
> очікування.

## 1. Опублікувати політику приватності (≈10 хв)

1. github.com → **New repository** → назва `kliuye`, **Public** → Create.
2. У терміналі, з теки проєкту:
   ```bash
   git add -A
   git commit -m "chore: prepare 1.0.0 for Google Play"
   git branch -M main
   git remote add origin https://github.com/dimaskq/kliuye.git
   git push -u origin main
   ```
3. Репозиторій → **Settings → Pages → Deploy from a branch** → `main` / `/docs` → Save.
4. Через 1–2 хвилини відкрий https://dimaskq.github.io/kliuye/privacy/ у
   режимі інкогніто — сторінка має відкритися.

Якщо акаунт GitHub називається не `dimaskq`, зміни адресу в
`src/config/links.ts` і перезбери AAB (див. «Якщо треба перезібрати AAB» внизу).

## 2. Акаунт розробника (якщо ще немає)

play.google.com/console → Personal → оплата $25 → верифікація особи й
телефону. Верифікація може тривати до кількох днів — це єдиний крок, на який
не впливаєш.

## 3. Створити застосунок (≈5 хв)

**Create app** → назва `Клює — прогноз кльову` · мова за замовчуванням
**Українська – uk-UA** · App · Free · поставити обидві галочки декларацій →
Create.

## 4. Заповнити все, що просить Dashboard (≈40 хв)

Play Console сам веде по списку «Set up your app». Відповіді — у
[`google-play.md`](google-play.md), розділи 3 і 4:

- [ ] **Privacy policy** → `https://dimaskq.github.io/kliuye/privacy/`
- [ ] **App access** → All functionality is available without special access
- [ ] **Ads** → No
- [ ] **Content rating** → анкета IARC, скрізь «Ні»
- [ ] **Target audience** → 13–15, 16–17, 18+
- [ ] **News app** → No · **Government** → No · **Financial** → none · **Health** → none
- [ ] **Data safety** → таблиця з розділу 4 `google-play.md`
- [ ] **Advertising ID** → No
- [ ] **Store listing** → назва, короткий і повний опис, іконка, банер,
      скріншоти з `assets/store/screenshots/`, категорія Sports, e-mail
- [ ] Переклади лістингу en-US і bg-BG — **Store listing → Manage translations**

## 5. Завантажити збірку й відправити на рев'ю

1. **Test and release → Testing → Closed testing** → Create track (або
   відкрий «Closed testing - Alpha»).
2. **Testers** → додай щонайменше **12** e-mail (або Google Group) і країни.
3. **Create new release** → Play App Signing → **Use Google-generated key**
   (за замовчуванням) → завантаж `~/Desktop/Kliuye-1.0.0.aab`.
4. Release name `1.0.0`, release notes — розділ 5 `google-play.md`.
5. **Next → Save → Send for review.** Готово: це і є відправка на рев'ю.

Рев'ю закритого треку триває від кількох годин до кількох днів. Після
схвалення тестувальники мають прийняти запрошення за посиланням і лишатися в
тесті **14 днів поспіль**; тоді на Dashboard з'явиться **Apply for production**.

## Якщо треба перезібрати AAB

Після будь-якої зміни в коді або адреси політики:

```bash
export JAVA_HOME=$(ls -d ~/.local/share/jdk-17*) ANDROID_HOME=$HOME/Android/Sdk
npx expo prebuild --platform android --clean --no-install
cd android && ./gradlew bundleRelease && cd ..
cp android/app/build/outputs/bundle/release/app-release.aab ~/Desktop/Kliuye-1.0.0.aab
```

Кожне **наступне** завантаження в Play вимагає більшого `versionCode`:
збільш `android.versionCode` в `app.config.ts` (2, 3, …) перед збіркою.
