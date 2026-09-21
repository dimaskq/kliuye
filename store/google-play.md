# Google Play — перший реліз «Клює» 1.0.0

Усе, що треба ввести в Play Console, і порядок дій. Технічні деталі збірки —
у [`RELEASE.md`](../RELEASE.md).

## 1. Одноразова підготовка

1. **Акаунт розробника Google Play** — play.google.com/console, внесок $25,
   верифікація особи (паспорт/ID) і телефону. Тип акаунта — _Personal_.
2. **Обов'язкове закрите тестування.** Для особистих акаунтів, створених після
   листопада 2023, Google не дає вийти в Production, поки застосунок не пройде
   _Closed testing_ з **щонайменше 12 тестувальниками, які були підписані
   14 днів поспіль**. Закладайте ці два тижні в план; тестувальників зручно
   зібрати в Google Group і додати групу в трек.
3. **Мапа не потребує ключів.** Вона працює на MapLibre з безкоштовними
   плитками OpenFreeMap — ні Google Cloud, ні білінгу не треба.
4. **EAS-проєкт:** `npx eas login && npx eas init` — він запише справжній
   `projectId` (зараз у `app.config.ts` стоїть заглушка з нулями, яку підставляє
   `EAS_PROJECT_ID`).
5. **Політика приватності онлайн** — див. розділ 6. URL:
   `https://dimaskq.github.io/kliuye/privacy/`.
6. _(Необов'язково, для `eas submit`)_ Service account: Google Cloud →
   IAM → Service account → JSON-ключ → Play Console → _Users and permissions_ →
   запросити e-mail сервісного акаунта з правом _Release apps to testing tracks_.
   Файл покласти в `secrets/google-play-service-account.json` (тека в
   `.gitignore`).

## 2. Збірка й завантаження

```bash
npm run lint && npm run typecheck && npm run i18n:check && npm run test:coverage
# локально, підписано ключем завантаження з secrets/ — див. RELEASE_DAY.md
npx expo prebuild --platform android --clean --no-install && (cd android && ./gradlew bundleRelease)
# або в хмарі EAS (спершу `npx eas credentials` → завантажити той самий keystore)
npx eas build --profile production --platform android
```

- **Перший AAB завантажується вручну**: Play Console → _Testing → Internal
  testing → Create new release_ → завантажити `.aab` з EAS. Google API не
  приймає найперший реліз застосунку.
- Далі — `npx eas submit --profile production --platform android` (іде в
  Internal testing як draft).
- Порядок треків: **Internal** (ви самі, одразу) → **Closed** (12+ людей,
  14 днів) → **Production**.
- App signing: погодитися на _Play App Signing_ (за замовчуванням).

## 3. Сторінка в магазині (Main store listing)

Основна мова лістингу — **українська (uk-UA)**; додати переклади en-US і bg-BG.

| Поле          | Ліміт | Українська                                                                   |
| ------------- | ----- | ---------------------------------------------------------------------------- |
| Назва         | 30    | `Клює — прогноз кльову`                                                      |
| Короткий опис | 80    | `Чи варто сьогодні на рибалку? Індекс кльову, найкраще вікно й мапа водойм.` |

**Повний опис (uk):**

```text
Клює відповідає на одне питання: чи варто сьогодні їхати на рибалку.

ІНДЕКС КЛЬОВУ 0–100
Вісім чинників погоди — тиск і його зміна, вітер, температура повітря й води, хмарність, опади, фаза місяця, час доби — зводяться в одне число й вердикт: від «Глухо» до «Жор».

НАЙКРАЩЕ ВІКНО
Три години, коли риба найактивніша, і крива кльову по годинах — видно, коли виїжджати.

ПІД ВАШУ РИБУ
Щука, окунь, судак, лящ, короп, сом, карась, камбала, калкан та інші — індекс перераховується під кожен вид.

ТИЖДЕНЬ НАПЕРЕД
Прогноз на сім днів, щоб спланувати вихідні.

МАПА
Поставте пін будь-де або знайдіть населений пункт — прогноз буде саме для цієї точки. Збережіть улюблені місця й прокладіть маршрут у вашому застосунку мап. Мапа навколо збережених місць працює й без зв’язку.

СПОВІЩЕННЯ ПРО ЖОР
Нагадування за годину до вікна кльову в дні, коли справді клює.

ЩОДЕННИК УЛОВІВ
Дата, вид, вага, місце, нотатка, фото й відео — усе лишається на вашому телефоні.

ПРИВАТНО
Без реєстрації, без реклами, без стеження. Погодні дані — Open-Meteo.

Індекс — це оцінка на основі відкритих погодних даних, а не гарантія улову. Перевіряйте місцеві правила рибальства.
```

<details>
<summary>English (en-US)</summary>

| Поле          | Текст                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Назва         | `Kliuye — Fishing Forecast`                                           |
| Короткий опис | `Worth going fishing today? A bite index, the best window and a map.` |

```text
Kliuye answers one question: is it worth going fishing today?

BITE INDEX 0–100
Eight weather factors — pressure and its trend, wind, air and water temperature, cloud, rain, moon phase and time of day — become one number and a verdict, from “Dead” to “Feeding frenzy”.

THE BEST WINDOW
The three hours when fish are most active, plus an hour-by-hour bite curve.

FOR YOUR FISH
Pike, perch, zander, bream, carp, catfish, crucian carp, flounder, turbot and more — the index is recalculated for each species.

A WEEK AHEAD
A seven-day forecast to plan the weekend.

MAP
Drop a pin anywhere or search for a town — the forecast is for that exact spot. Save favourite places and get a route in your maps app. The map around saved places works offline.

BITE ALERTS
A reminder an hour before the bite window, on days when fish really bite.

CATCH JOURNAL
Date, species, weight, place, notes, photos and video — all kept on your phone.

PRIVATE
No sign-up, no ads, no tracking. Weather data by Open-Meteo.

The index is an estimate based on open weather data, not a guarantee of a catch. Check your local fishing rules.
```

</details>

<details>
<summary>Български (bg-BG)</summary>

| Поле          | Текст                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Назва         | `Клює — прогноза за кълване`                                                |
| Короткий опис | `Струва ли си днес за риба? Индекс на кълване, най-добър прозорец и карта.` |

```text
Клює отговаря на един въпрос: струва ли си днес да отидете за риба.

ИНДЕКС НА КЪЛВАНЕ 0–100
Осем метеорологични фактора — налягане и промяната му, вятър, температура на въздуха и водата, облачност, валежи, лунна фаза и време от денонощието — се събират в едно число и присъда: от „Мъртво“ до „Силен кълвеж“.

НАЙ-ДОБЪР ПРОЗОРЕЦ
Трите часа, когато рибата е най-активна, и крива на кълването по часове.

ЗА ВАШАТА РИБА
Щука, костур, бяла риба, платика, шаран, сом, каракуда, писия, калкан и други — индексът се преизчислява за всеки вид.

СЕДМИЦА НАПРЕД
Прогноза за седем дни, за да планирате уикенда.

КАРТА
Поставете точка където и да е или потърсете населено място — прогнозата е точно за това място. Запазете любими места и начертайте маршрут в приложението си за карти. Картата около запазените места работи и без връзка.

ИЗВЕСТИЯ ЗА СИЛЕН КЪЛВЕЖ
Напомняне час преди прозореца в дните, когато наистина кълве.

ДНЕВНИК НА УЛОВА
Дата, вид, тегло, място, бележка, снимки и видео — всичко остава на телефона ви.

ПОВЕРИТЕЛНО
Без регистрация, без реклами, без проследяване. Метеорологични данни от Open-Meteo.

Индексът е оценка въз основа на отворени метеорологични данни, а не гаранция за улов. Проверявайте местните правила за риболов.
```

</details>

> Перед вставкою звірити назви вердиктів і видів з `src/i18n/*.json` — вони
> мусять збігатися з тим, що людина побачить у застосунку.

**Графіка** (усе вже в репозиторії):

| Що                 | Вимога Play                | Файл                                  |
| ------------------ | -------------------------- | ------------------------------------- |
| Іконка             | 512×512 PNG                | `assets/store/play-icon-512.png`      |
| Feature graphic    | 1024×500 PNG/JPG           | `assets/store/feature-graphic.png`    |
| Скріншоти телефона | 2–8 шт., 9:16, від 1080 px | зняти з production-білда (див. нижче) |

Скріншоти — з реального білда на телефоні, без вигаданих чисел (вимога
чесності лістингу). Рекомендований набір: «Сьогодні» з індексом; «Тиждень»
з розгорнутим днем; «Мапа» з піном і кнопками; попап «Зберегти місце»;
«Щоденник»; «Я» з профілем. Для кожної мови лістингу — свої скріншоти в цій мові.

**Категорія:** _Sports_ (так класифікують рибальські застосунки), теги —
Fishing, Weather. **Контакти:** e-mail `dmtro.kravchenko@gmail.com`,
сайт `https://dimaskq.github.io/kliuye/`.

## 4. App content (Policy → App content)

| Розділ                | Відповідь                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Privacy policy        | `https://dimaskq.github.io/kliuye/privacy/`                                                                                                                                                                        |
| Ads                   | **No, my app does not contain ads**                                                                                                                                                                                |
| App access            | **All functionality is available without special access** (логіну немає)                                                                                                                                           |
| Content rating (IARC) | Категорія _All other app types_; на всі питання про насильство, секс, мову, наркотики, азарт — «Ні». Користувачі не спілкуються між собою й не діляться контентом; покупок немає. Очікуваний рейтинг — 3+/Everyone |
| Target audience       | **13–15, 16–17, 18+** (без вікових груп до 13 — інакше діє політика Families). Застосунок не приваблює дітей                                                                                                       |
| News app              | No                                                                                                                                                                                                                 |
| Government app        | No                                                                                                                                                                                                                 |
| Financial features    | My app doesn't provide any financial features                                                                                                                                                                      |
| Health apps           | My app does not have any health features                                                                                                                                                                           |
| Advertising ID        | **No** — `AD_ID` заблоковано в `app.config.ts`                                                                                                                                                                     |

### Data safety

Загальні питання:

| Питання                                                               | Відповідь                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Does your app collect or share any of the required user data types?   | **Yes**                                                                              |
| Is all of the user data collected by your app encrypted in transit?   | **Yes** (усі запити — HTTPS)                                                         |
| Do you provide a way for users to request that their data is deleted? | **No** — на серверах нічого не зберігається; дані на пристрої користувач видаляє сам |

Типи даних (усе — _Collected_, **не** _Shared_: Open-Meteo обробляє їх як
постачальник послуги; _Processed ephemerally_ — **Yes**; _Required or optional_
— **Optional**; мета — **App functionality**):

| Категорія    | Тип                   | Чому                                                         |
| ------------ | --------------------- | ------------------------------------------------------------ |
| Location     | Approximate location  | Координати (≈1 км) → Open-Meteo для прогнозу                 |
| App activity | In-app search history | Текст пошуку населеного пункту → Open-Meteo, не зберігається |

**Не** декларуються (не залишають пристрій): щоденник, фото й відео (системний
пікер), ім'я та фото профілю, збережені місця, локальні сповіщення.

## 5. Реліз-ноти 1.0.0

```text
<uk-UA>
Перший реліз: індекс кльову, найкраще вікно, прогноз на тиждень, мапа з пінами й маршрутом, сповіщення про жор і щоденник уловів.
</uk-UA>
<en-US>
First release: bite index, best window, 7-day forecast, map with pins and routes, bite alerts and a catch journal.
</en-US>
<bg-BG>
Първо издание: индекс на кълване, най-добър прозорец, прогноза за седмица, карта с точки и маршрут, известия за кълване и дневник на улова.
</bg-BG>
```

## 6. Політика приватності на GitHub Pages

Сторінка лежить у `docs/privacy/index.html` (три мови, англійська — перша).

1. Створити **публічний** репозиторій `kliuye` на GitHub під акаунтом
   `dimaskq` і запушити проєкт (або лише теку `docs/` в окремий репозиторій з
   такою ж назвою).
2. _Settings → Pages → Build and deployment → Deploy from a branch →_
   `main` / `/docs`.
3. Через 1–2 хвилини відкрити `https://dimaskq.github.io/kliuye/privacy/` без
   логіну — сторінка має відкриватися.
4. Якщо ім'я акаунта чи репозиторію інше — змінити URL у
   `src/config/links.ts`, у цьому файлі й у Play Console.

Коли з'явиться реклама чи покупки — **спершу** оновити політику й форму Data
safety, потім випускати версію.
