# RAMSIDER R6.9j — замена Beta v2.1

Дата: 26.10.2026. Журнал: CHG0149. Задание владельца: заменить прежний пакет 2.1 новым комплектом целиком, работать на Beta и завершить все применимые проверки. Main уже чистый и опубликованный `31a256ec7c99a84fe7740c0badca4dd94c5c142b`; новая версия в него не попадает. В Beta выполнено слияние Main (документация), конфликты истории сохранены с обеих сторон.

## Источники и границы

Источник — `design/комплект_для_Александра_r6.9j/`. Инвентарь: 349 файлов. `site/` — 48 текущих runtime-файлов, побайтно совпадают с соответствующими файлами `пакет_r6.9j/`. Root README/ЗАДАНИЕ/ИЗМЕНЕНИЯ задают происхождение; полный и облегчённый обзор — средства просмотра тех же страниц через iframe, не архитектура приложения. История, диффы и QA-папки поясняют решения и не заменяют новый браузерный QA. Историческая задача «не публиковать» относится к подготовке исходного кандидата; текущая команда владельца разрешает интеграцию на Beta. Полноценный магазин не запускаем.

Сохраняем сам комплект неизменным как локальный исходник. Не публикуем его исходные логи/внутренние пути/неподтверждённый WhatsApp-контакт. В рабочий код импортируем только проверенное семантическое содержимое, переводные ключи, стили и ECAS SVG. Pending `data-whatsapp-url` исключаем, кнопка остаётся недоступной. Частные license/policy также не публикуем. Все пять supplied TTF побайтно равны уже существующим public/fonts: новых копий/удалённых шрифтов нет.

Внешняя главная 941px с artwork/видео/технологиями остаётся основной главной. Обновляем связанные с 2.1 маршруты, входы, FAQ и footer-навигацию; не заменяем её корневым `index→compare` автономного пакета. Фильм не меняется, QA на общем компьютере только без звука.

## Маршруты и ссылки

| Вход / имя источника | Маршрут приложения / поведение |
| --- | --- |
| Две Create Your UNO и hero Reserve | `/{locale}/reserve` |
| Compare / PRO / GOLD / Set | `/{locale}/compare`, `/pro`, `/gold`, `/product-info#included` |
| reserve / pro / gold / compare | Существующие адреса сохраняются, содержимое заменяется |
| product-card.html | `/{locale}/product-info`, существующие якоря сохраняются |
| capsules.html | `/{locale}/capsules` |
| terms / returns / privacy | Существующие адреса, новые исходники |
| terms-of-sale / delivery-policy / contact / age-gate | Новые `/{locale}/…` |
| старый privacy-ru | Совместимый переход на актуальную Privacy; устаревший текст больше не выдаётся за текущий |
| /contact, /privacy, /delivery-policy, /terms-of-sale | Canonical EN URL, все query-пары сохраняются |
| `/?src=wall` | Новый compare с сохранением query; обычный `/` сохраняет существующую главную |
| QR contact src=flyer/booklet/presentation | Contact, поле src только `[A-Za-z0-9_-]{1,64}`, иначе пусто |

Файловые `.html`/directory-index ссылки источника преобразуем в существующие Next URL. Сохраняем model query, все параметры и hash. Договор: plain `#clause-…`/`#section-…` в AR разрешается к `ar-…`; EN↔AR переключение зеркально меняет якорь, не теряет clause. Не используем универсальный SPA catch-all.

В общем footer главной доступны все новые продуктовые/юридические разделы и Contact. Сохраняем подтверждённую компанию, native email, social icons, исходную текстуру и safe-area отступы. Принятое владельцем распределение ссылок по всей строке (CHG0146) сохраняется при расширении набора.

## Визуальный контракт

Основной эталон — текущие отдельные HTML пакета на реальном WebKit402×874 CSS px/DPR3. Второй экран440×956/DPR3 проверяется как responsive; в дополнение320/375/768/1280/1440, длинные переводы, AR, текст200%, synthetic safe insets. Масштаб новых страниц — 1 source CSS px = 1 browser CSS px, не402/941. Новая максимальная ширина941px (старые1080px отменены).

Сохраняем DOM-структуру, текущую типографику, фон sand/paper, размеры, интервалы, source css cascade: inline/head styles и подключённые CSS строго в порядке каждого HTML; gold.css последний. OpenSans300/400/700, OpenSansButton400, BankGothic400. Для AR — системные Tahoma/Geeza/Arial, body1.65/headings1.4 и зеркальные поля/радио/таблицы/шаги. Не навязываем OpenSans арабскому письму. Действующее правило Title Case применяется к английским маркетинговым заголовкам через явную карту authored locale keys (`editorial-overrides.json`), без CSS/runtime capitalize; это отмеченное отличие от sentence-case источника. Полные юридические оригиналы не меняются.

Золото: только перечисленные золотые тексты/рамки/декорации получают 8s gold-flow, обычный текст/надписи кнопок/активная EN/AR остаются по исходнику. Маски ::after не должны перехватывать pointer, перекрывать подписи и фоновые поверхности. Reduced motion останавливает движение; reference/actual comparison выполняем в одинаковом стабильном reduced-motion состоянии, отдельно проверяем обычную анимацию.

Mobile comparison <=600px: один вертикальный столбец PRO, затем GOLD; семантические заголовки сохраняются. <=800px hero/compare pills на всю ширину. Комплект использует новые металлические точки14px. Точный текст/порядок/варианты покрытия/капсул берутся из текущих HTML и locale keys, не из v2.1.

Доступность: label/error associations, >=44px targets, native select фактически измеряется (урок2.1); keyboard/focus, reduced motion, no clipped wraps. Если необходима AA/usable-target коррекция источника, она локальная, описанная и повторно снятая. Никаких новых production raster assets/конверсий/изменений геометрии прежнего artwork.

## Контент и языки

Source1416EN/1416AR ключей используются как схема; перевод на сервере даёт правильный первый HTML. EN/AR — полные текущие интерфейсы; другие9 URL сохраняют локализованный chrome и явно обозначенный EN original с правильным lang/LTR. Старый RU product/legal текст2.1 не оставляем как новую версию. Полные11 переводов не утверждаем.

Полный Terms of Sale содержит самостоятельные статьи EN и AR. Арабская статья — авторитетный supplied literal текст; `ar.json sale.line.*` содержит EN и не годится для генерации арабского договора. Оба оригинала сохраняем дословно после HTML decode/normalization, номера и15 разделов/подпункты/якоря проверяются. Гарантия12месяцев устройство/6месяцев батарея согласована со сводками; старая заметка о несверенной гарантии удалена.

Privacy и Delivery содержат английский оригинал даже в `/ar/`, с арабской оболочкой и явным уведомлением Published in English. Самим юридический перевод не изобретаем. В договоре и сводках остаются предоставленные различия по валюте/порядку оплаты доставки — не переписываем юридический оригинал самостоятельно, отмечаем как ограничение реального запуска. MoIAT-CAD approval scheduled before shipment не превращаем в готовое подтверждение. ECAS/TDRA модель/область/номера сохраняем текстом, копии по запросу; на новых страницах не создаём PDF-ссылки. Прежние независимо разрешённые документы главной вне объёма замены2.1.

## Конфигурация и суммы

| Модель | Устройство AED | Первый AED | Финальный AED | USD reference total / initial / final |
| --- | ---: | ---: | ---: | --- |
| PRO | 3670 | 2200 | 1470 | 999 / 599 / 400 |
| GOLD | 7340 | 3700 | 3640 | 1999 / 999 / 1000 |

Восемь options: extra battery120USD; Pro capsule four zones40; separate charger75; ceramic bowl30; self-fill packs20/50/100 units —30/50/80; hose/mouthpiece/connector PRO100/GOLD200. Все USD только справочные. Пакеты20/50/100 взаимоисключающие, можно снять последний. Выбор модели пересчитывает hose reference, все binding/summary и текущий preview.

AED аксессуаров не вычисляем по курсу. При выбранном аксессуаре AED device amounts остаются видимыми, initial/total помечены как неокончательные/по запросу; actual AED settlement initial/total unknown, финальный AED device balance неизменен. Справочные USD initial/total включают аксессуары. EUR markets показывают pending reference conversion + USD, без придуманного EUR курса. Catalogue версионирован в приложении и валидируется; не нужен лишний runtime JSON fetch, варианты готовы до активации контролов.

Country — canonical ISO code, полный источник; IN/TH/TR/QA запрещены, preview submit disabled, неизвестный/пустой country тоже blocked. OTHER/произвольная страна и старый contact-request сценарий2.1 удаляются. Введённые имя/email необязательны в локальном preview; непустой email валидируется, поля trim. Согласия18+/Terms+Privacy unchecked и обязательны. Никаких cookie/analytics/checkout API.

Preview не создаёт заказ, не сохраняет персональные данные, не отправляет email/сообщение и не принимает оплату. Первый реальный card payment создаёт заказ только в будущем работающем магазине. Исторический7-day unpaid hold/invoice promise удаляется. Источник с фиктивным RS-2026-00001 заменяем явным PREVIEW, сохраняя копирование/fallback. Изменение конфигурации/поля сбрасывает подтверждение; language switch сохраняет введённые данные, выбор, ошибки и preview, переводя всю динамику. Query model и reload/history restore не затирают последующий ручной выбор при EN↔AR.

## Возраст и контакты

Реальный session gate для reserve/pro/gold/compare/product-info/capsules плюс отдельный age-gate URL. До подтверждения protected content hidden/inert, noJS не даёт обхода и показывает инструкцию. Legal/contact доступны без возрастного тупика. Confirm18+ сохраняет только session age flag, открывает контент и переводит focus к heading. Storage blocked: текущая страница доступна после клика, после новой навигации спрашиваем снова. Leave очищает flag и уходит на about:blank. pageshow/BFCache повторно проверяет flag. Standalone next принимает только allowlisted same-origin product URL с query/hash, внешние/encoded обходы отвергаются. Возрастная проверка не распространяется без отдельного основания на неизменённую artwork-главную.

Contact: business/support native mailto с объяснением mail app; WhatsApp и submit disabled. Source fieldset disabled сохраняем, сервер не подключаем. Query src ограничен, обновляется при history; никакого хранилища/аналитики. Неподтверждённый WhatsApp URL/телефон исключён из импортируемых данных и публикуемого HTML.

## Архитектура и этапы приёмки

Next+strict TS, статические Server Components для каждого locale/document, импортированный проверенный semantic AST и server-only original translations; browser controllers ограничены age/i18n/form/contact/anchors. Старая реализация/копия2.1 удаляется из активных routes/data/CSS/FAQ; её доказательства остаются историей. Не используем iframe/встроенный отдельный HTML-сайт/клиентский пустой shell. CSS namespaced, body/html selectors scoped на wrapper с сохранением pseudo/:is/:not/:has/commas, gold keyframes локальны. Подключаем только нужные странице переводы, не весь multilingual blob.

Gate1: эта спецификация, source inventory/hash/font parity, реальные исходные402 screenshots и независимый scope PASS до реализации.
Gate2/3 slice1: reserve+age+i18n+accessories/price/countries/preview → actual402/440 против source, все соответствующие states; исправления и re-audit.
Gate2/3 slice2: models/compare/product/capsules/gold → screenshots EN/AR, responsive table/animation/ECAS; затем re-audit.
Gate2/3 slice3: full legal/contact/aliases/FAQ/footer/main links → source originals/anchors/screens/URLs, re-audit.
Gate4: EN↔AR while typed/errors/preview, model query/reload/back, mutually-exclusive packs/all8/options pricing, invalid email/consents/countries, clipboard fallback, noJS/storageblocked/age decline/BFCache/nextsecurity, QR/query aliases, keyboard/targets/RTL/200%/safe areas/narrow-tablet-desktop/all11overflow; actual representative images.
Gate5: native Codex actualdiff review, type/lint/test/build, production render/cache/initialJS/bytes/LCP/CLS/scroll and interactive latency (не называть двухкадровый probe fieldINP), no new movie/audio/regression; affected screenshot rechecks after fixes.
Gate6: assembled main→CTA→newroutes→back/footer full scope, complete CHANGELOG/MEMORY/LESSONS/actualapprovals, private exclusions/staged review, Beta-only commit/push/deploy where authorized with exactSHA all expectedprojects and canonicalPro/Max smoke. Physical Safari/VoiceOver/fieldINP/Lighthouse не утверждаем без соответствующих запусков. Все failed gates сохраняются, обычный QA не передаётся владельцу.

## Выполненная проверка и ограничения

Срезы реализации и полная интеграция проверены в реальном WebKit при 402×874 и 440×956, DPR3; исходный HTML отдельно снят в том же движке. Для Pro сохранены 42 пары эталон/результат, разрешено только вертикальное выравнивание точки прокрутки в пределах 1 CSS px. Сравнение учитывает объявленные текстовые правки; юридические оригиналы не исправлялись. Проверены отдельные поля, выбор страны, согласия, PREVIEW, клавиатура, полный договор EN/AR и его якоря. Нет заявления о физическом Safari, VoiceOver или полном соответствии WCAG.

Дополнительно выполнены адаптация 320/375/короткий402/768/1440, CSS zoom200%, синтетические safe-area отступы, all-11-locale overflow, смена EN↔AR с сохранением данных, история Back, noJS/blocked storage и настоящая ошибка изображения/Retry. Последний медиатест блокирует service worker только в тестовом контексте, чтобы перехват действительно вызвал отказ; production media не менялись. В footer сохранено space-between в каждой строке; новая английская ссылка сокращена до Terms of Sale.

При холодном запуске шрифты меняли ширину ссылки Compare и логотипа, вызывая перенос шапки. Резервирование измеренных итоговых ширин 179/174,3 px (не больше контейнера) сохраняет финальный эталон и устраняет большой скачок. Статический head-marker документа предотвращает ранний запрос фона главной. Последние лабораторные данные находятся в `docs/evidence/r69j/performance.json` и `performance-age.json`: Chromium402/DPR3, 4Мбит/с, 100мс, CPU×4; это отдельные прогоны, не field INP или Lighthouse. Измерение двух кадров после клика также не называется INP. Ранее наблюдавшийся единичный p95 скролла33,4мс сохранён в истории; последующие изолированные значения16,7–16,8мс не доказывают плавность на каждом устройстве.

Полный исходный комплект и приватные licence/policy не входят в коммит. В юридическом оригинале сохраняются переданные владельцем реквизиты; исключено дополнительное неподтверждённое WhatsApp action-метаданное. API, оплата, отправка писем, WhatsApp и business-submit отсутствуют или отключены. Перед полноценной торговлей нужны подключённые сервисы и согласование отмеченных расхождений договора и кратких описаний. Открытые прежние CHG0145 (исходящие медиаошибки при уходе со страницы) и CHG0148 (несовместимый с тихим QA старый измеритель фильма) не объявляются исправленными.

Повторяемость проверки договора: `tests/e2e/preorder.spec.ts` не требует временный сервер исходников. Он сверяет нормализованный текст двух полных статей с `docs/evidence/r69j/legal-originals.json`; контрольные суммы сняты независимо с оригинальных EN/AR страниц в WebKit после их собственной локализации. В файле сохранены SHA каждой исходной HTML-страницы и разные контрольные суммы двух языков. Ранее сравнение с живым сервером оригиналов также прошло; после завершения QA этот сервер можно остановить.
