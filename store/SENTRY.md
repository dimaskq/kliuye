# Звіти про збої: Sentry

> **Статус (31.10.2026):** у релізі 1.3.0 (versionCode 4). Код, токен у
> `secrets/sentry.env`, збірка із завантаженими source maps — зроблено.
> Лишилося: Data safety в Play (розділ 6), налаштування приватності проєкту в
> Sentry (розділ 1, крок 5) і перевірка на телефоні (розділ 5). Проєкт у Sentry
> — `react-native`.

Інструкція, як додати збір звітів про збої так, щоб не зламати головну обіцянку
застосунку («без акаунтів, аналітики й стеження») і правило з
[`RELEASE.md`](../RELEASE.md) §6: **лише за явною згодою, окремим релізом, з
переписаною політикою приватності й формами Play та Apple.**

## Чому Sentry, а не Firebase Crashlytics

|                                           | **Sentry**                                                                                             | **Firebase Crashlytics**                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Помилки JavaScript (а їх у нас більшість) | Читабельний стек із назвами файлів і рядків (source maps)                                              | Лише «non-fatal» через `recordError`, стек JS без source maps — нечитабельний                                                 |
| Нативні падіння (Android/iOS)             | Так                                                                                                    | Так, тут Crashlytics найсильніший                                                                                             |
| Що треба додати в проєкт                  | Один пакет + плагін Expo + `metro.config.js`                                                           | `@react-native-firebase/app` + `/crashlytics`, `google-services.json`, `GoogleService-Info.plist`, статичні фреймворки на iOS |
| Чиї сервери                               | Sentry, можна обрати **регіон ЄС**                                                                     | Google/Firebase                                                                                                               |
| Ідентифікатори                            | Жодних, якщо `sendDefaultPii: false`                                                                   | Firebase Installation ID на кожен пристрій                                                                                    |
| Ціна                                      | Безкоштовний план Developer (кілька тисяч помилок/міс — перевір актуальні ліміти на sentry.io/pricing) | Безкоштовно без лімітів                                                                                                       |

Висновок: у нас **немає жодного іншого сервісу Firebase**, а більшість можливих
помилок — у JavaScript. Тягнути Firebase заради одного Crashlytics — більше
коду, більше даних про користувача і гірші звіти про саме ті помилки, які нам
важливі. **Sentry.**

## Як це має виглядати для користувача

- У **Налаштуваннях** новий перемикач: **«Надсилати звіти про збої»**, під ним
  пояснення: «Анонімно: що зламалося і на якому екрані. Без імені, геопозиції
  й фото». **Вимкнений за замовчуванням.**
- Поки він вимкнений, SDK **навіть не ініціалізується** — жоден байт не йде в
  Sentry.
- Вимкнув — `Sentry.close()`, збір припиняється одразу.

Збоїв до першого вмикання ми не побачимо — це свідома ціна згоди. Щоб більше
людей увімкнули, можна додати той самий перемикач на останній крок онбордингу
(«Що далі»), теж вимкнений за замовчуванням.

---

## 1. Акаунт і проєкт (≈10 хв)

1. sentry.io → Sign up. **Data storage location → EU (Frankfurt)** — обирається
   один раз при створенні організації, потім не змінити.
2. Create project → платформа **React Native** → назва `kliuye`.
3. Скопіюй **DSN** (вигляд `https://…@o….ingest.de.sentry.io/…`). Він не
   секретний — його можна тримати в коді.
4. Settings → Auth Tokens → **Create New Token** (права `project:releases`,
   `org:read`). Це **секрет**: поклади його в `secrets/sentry.env`:
   ```bash
   SENTRY_AUTH_TOKEN=sntrys_…
   ```
   Тека `secrets/` уже в `.gitignore` — перевір, що файл не потрапив у git.
5. Project Settings → **Security & Privacy**: увімкни **Data Scrubber**,
   **Use Default Scrubbers**, **Prevent Storing of IP Addresses**.

## 2. Пакет і конфігурація

```bash
npx expo install @sentry/react-native
```

**`app.config.ts`** — у масив `plugins`, перед `./plugins/withReleaseSigning`:

```ts
/* Crash reports, only after the angler opts in (Settings). Uploads source maps
   during the release build when SENTRY_AUTH_TOKEN is set. */
[
  '@sentry/react-native/expo',
  { url: 'https://de.sentry.io/', organization: 'dem-kravchenko', project: 'react-native' },
],
```

**`metro.config.js`** (у проєкті його ще немає — створити в корені):

```js
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/* Debug IDs tie the release bundle to its source maps, so a stack trace from
   a phone reads as our own files and lines. */
module.exports = getSentryExpoConfig(__dirname);
```

**`src/config/sentry.ts`**:

```ts
/** Public by design: it only lets the app send events, not read them. */
export const SENTRY_DSN = 'https://…@o….ingest.de.sentry.io/…';
```

## 3. Ініціалізація лише за згодою

**`src/services/crashReports.ts`** — весь Sentry в одному місці:

```ts
import * as Sentry from '@sentry/react-native';

import { SENTRY_DSN } from '@/config/sentry';

let running = false;

/** Fetch breadcrumbs carry the forecast URL, and with it the coordinates. */
function withoutQuery(url: unknown): unknown {
  return typeof url === 'string' ? url.split('?')[0] : url;
}

export function startCrashReports(): void {
  if (running || __DEV__) return;
  running = true;
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    /* Errors only: no tracing, no profiling, no replays, no screenshots. */
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    maxBreadcrumbs: 30,
    beforeBreadcrumb(crumb) {
      if (crumb.data?.['url'] !== undefined) crumb.data['url'] = withoutQuery(crumb.data['url']);
      return crumb;
    },
    beforeSend(event) {
      delete event.user;
      if (event.request?.url !== undefined)
        event.request.url = String(withoutQuery(event.request.url));
      return event;
    },
  });
}

export function stopCrashReports(): void {
  if (!running) return;
  running = false;
  void Sentry.close();
}
```

**Перемикач** — у `src/store/preferences.ts` додати `'crashReports'` у
`TOGGLE_IDS` і `crashReports: false` у `DEFAULT_TOGGLES`. Рядки налаштувань
будуються з цього списку, тож екран підхопить його сам; потрібні лише тексти
в чотирьох `src/i18n/*.json` (див. як зроблено `offlineMaps`) — `npm run
i18n:check` підкаже, яких ключів бракує.

**Підключити** — у `src/providers/AppProviders.tsx`, поряд з іншими ефектами:

```ts
const crashReports = usePreferences((state) => state.toggles.crashReports);

useEffect(() => {
  if (crashReports) startCrashReports();
  else stopCrashReports();
}, [crashReports]);
```

**Обгорнути корінь** — у `app/_layout.tsx`:

```ts
import * as Sentry from '@sentry/react-native';
…
function RootLayout() { … }
export default Sentry.wrap(RootLayout);
```

`Sentry.wrap` без `init` нічого не надсилає, тож для тих, хто не дав згоди,
він безпечний.

**Тести.** У `tests/setup.ts` замокати пакет, щоб Jest не тягнув нативний
модуль:

```ts
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  close: jest.fn(() => Promise.resolve()),
  wrap: (component: unknown) => component,
  captureException: jest.fn(),
}));
```

І тест: перемикач вимкнений → `init` не викликався; увімкнули → викликався з
`sendDefaultPii: false`; вимкнули → `close`.

## 4. Збірка

Як завжди ([`RELEASE_DAY.md`](RELEASE_DAY.md), «Якщо треба перезібрати AAB»),
але з токеном — тоді Gradle сам завантажить source maps у Sentry:

```bash
export JAVA_HOME=$(ls -d ~/.local/share/jdk-17*) ANDROID_HOME=$HOME/Android/Sdk
set -a; . secrets/sentry.env; set +a
npx expo prebuild --platform android --clean --no-install
cd android && ./gradlew bundleRelease && cd ..
```

Без токена збірка теж пройде, але стеки в Sentry будуть нечитабельні. Якщо
крок завантаження заважає збірці без мережі — `SENTRY_DISABLE_AUTO_UPLOAD=true`.

Не забудь підняти `android.versionCode` в `app.config.ts`.

## 5. Перевірити, що працює

1. На тестовому треку встанови збірку, увімкни перемикач.
2. Тимчасово додай на `app/dev-catalog.tsx` кнопку
   `Sentry.captureException(new Error('Kliuye test error'))` (або
   `Sentry.nativeCrash()` для нативного падіння) і натисни.
3. За хвилину — sentry.io → Issues: подія є, стек показує наші файли
   (`src/...`), а не `index.android.bundle:1:23456`.
4. Відкрий подію і переконайся, що там **немає**: IP, user, координат в URL
   (`latitude=` не має бути ніде в breadcrumbs).
5. Вимкни перемикач, натисни ще раз — нова подія **не** має з'явитися.
6. Прибери тестову кнопку.

## 6. Обов'язкові зміни в текстах (той самий реліз, до відправки на рев'ю)

**Політика приватності** — `docs/privacy/index.html`, усі три мови:

- У «Коротко» та в розділі 4 прибрати «No … crash reporting» і написати:
  «Звіти про збої — лише якщо ви увімкнете їх у Налаштуваннях. Звіт містить
  опис помилки, екран, модель телефона й версію системи; без імені,
  геопозиції, фото й IP-адреси. Обробник — Functional Software Inc. (Sentry),
  дані зберігаються в ЄС, видаляються через 90 днів.»
- У таблицю сторонніх сервісів — рядок Sentry з посиланням на
  https://sentry.io/privacy/.
- Оновити дату «Effective …».

**Google Play → App content → Data safety:**

- App info and performance → **Crash logs** і **Diagnostics** → Collected.
- Not shared (Sentry — обробник від нашого імені, це не «sharing»).
- **Optional** (користувач сам вмикає).
- Purpose: **App functionality**.
- Encrypted in transit: Yes.

**Apple** (коли дійде до iOS) — у `app.config.ts` → `ios.privacyManifests` →
`NSPrivacyCollectedDataTypes` додати `NSPrivacyCollectedDataTypeCrashData`,
`Linked: false`, `Tracking: false`, purpose `AppFunctionality`. Сам SDK Sentry
має власний privacy manifest для «required reason API».

**`RELEASE.md` §6** — переписати з «Off in v1» на те, як воно тепер працює, і
посилання сюди.

## 7. Чого не вмикати

Навіть якщо майстер (`npx @sentry/wizard`) чи документація пропонують:

- **Session Replay** (`mobileReplayIntegration`) — записує екран, а там
  щоденник, фото й місця.
- **User Feedback** (`feedbackIntegration`) — у нас уже є «Написати
  розробнику».
- **Tracing / Profiling** (`tracesSampleRate > 0`) — це вже аналітика
  продуктивності, а не збої.
- **`sendDefaultPii: true`** — додає IP та інші дані користувача.

Майстер `npx @sentry/wizard@latest -i reactNative` зручний, але вмикає
частину з цього за замовчуванням і пише в `android/`, яку `prebuild --clean`
перезаписує. Тому — руками, за цією інструкцією.
