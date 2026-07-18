# Настройка писем Samkraft (SMTP) — пошагово

Шведские шаблоны готовы в этой папке: `confirm-signup.html`, `reset-password.html`, `magic-link.html`.
Все с подписью **«Med vänliga hälsningar, Samkraft-teamet»** (шв. аналог «С уважением, команда Samkraft»).

---

## Почему у forfun письма были «лажа» (чтобы не повторить)

Почти всегда причина одна: использовался **встроенный отправитель Supabase** (без своего SMTP). Он:
- жёстко ограничен (несколько писем в час), помечен «только для тестов»;
- шлёт от чужого адреса без DKIM/SPF → Gmail/Outlook кидают в спам или режут.

Лечится это подключением **своего SMTP**. Ниже два пути — быстрый и правильный.

---

## Куда вставлять (общее для обоих путей)

Supabase Dashboard → **Authentication → Emails**:

1. Вкладка **SMTP Settings** → включить «Enable Custom SMTP» → вписать данные (см. путь A или Б).
2. Sender name: `Samkraft`
3. Вкладки шаблонов — вставить HTML из файлов и темы:

| Шаблон | Subject | Файл |
|---|---|---|
| Confirm signup | `Bekräfta din e-postadress – Samkraft` | confirm-signup.html |
| Reset password | `Återställ ditt lösenord – Samkraft` | reset-password.html |
| Magic Link | `Din inloggningslänk – Samkraft` | magic-link.html |

---

## Путь A — Gmail SMTP ✅ ВЫБРАН И ПРОВЕРЕН

Я проверила логин по SMTP и отправила реальное тестовое письмо на evgeniya.leonidovna@gmail.com — дошло.

Supabase Dashboard → Authentication → Emails → **SMTP Settings** → Enable Custom SMTP:

```
Host:         smtp.gmail.com
Port:         465
Username:     evgeniya.leonidovna@gmail.com
Password:     <App Password из .env — 16 букв, тот что начинается на "ntox">
Sender email: evgeniya.leonidovna@gmail.com
Sender name:  Samkraft
```

> В .env два значения GMAIL_APP_PASSWORD. Рабочее — **16 строчных букв** (в секции TikTok, начинается на `ntox`).
> Второе (`P1CE6e1x…`) — это НЕ app password, с ним Gmail откажет.

После сохранения SMTP — вставь три шаблона и темы (таблица выше) и включи подтверждение email
(Authentication → Providers → Email → «Confirm email» = ON).

Минусы Gmail (помнить на будущее): адрес отправителя — твой личный gmail; лимит ~500 писем/день;
изредка спам. Для пилота с Кристиной этого достаточно; перед публичным запуском — путь Б (Resend).

---

## Путь Б — Resend (правильно, лучшая доставляемость, рекомендую для запуска)

Даёт письма от `noreply@…` с настоящей подписью DKIM → не улетают в спам. 3000 писем/мес бесплатно.

Нужен домен. Своего `samkraft.se` у тебя нет, поэтому два варианта:
- **быстро и бесплатно:** поддомен уже твоего `forfun.info` (например `mejl.forfun.info`) — я могу прописать DNS-записи в Cloudflare сама за минуту;
- **правильно для бренда:** купить `samkraft.se` (~100 kr/год у loopia.se или one.com), тогда адрес будет `noreply@samkraft.se`.

Шаги:
1. Зарегистрируйся на resend.com (бесплатно), подтверди свой email.
2. Domains → Add Domain → введи домен/поддомен.
3. Resend покажет DNS-записи (SPF, DKIM, DMARC). **Пришли их мне** — пропишу в Cloudflare через API. (Если домен — поддомен forfun.info, это делается сразу.)
4. Resend → API Keys → создай ключ → в разделе SMTP он даст:
```
Host:        smtp.resend.com
Port:        465
Username:    resend
Password:    <RESEND_API_KEY>
Sender email: noreply@<твой-домен>
Sender name:  Samkraft
```
5. Вставь это в Supabase SMTP Settings.

Отправитель у получателя будет выглядеть как **Samkraft <noreply@…>** — имя «Samkraft» на первом плане.

---

## Моя рекомендация

Для теста прямо сейчас — **путь A (Gmail)**, чтобы Кристина и первые волонтёры смогли регистрироваться сегодня. Перед публичным запуском — **путь Б (Resend)** ради доставляемости. Скажи, каким путём идём, и по Resend я сразу помогу с DNS.

---

## Регистрация через Google (отдельная задача)

Ошибка «provider is not enabled» — потому что провайдер не включён. Нужны Google-креды (в .env их нет):

1. console.cloud.google.com → создай проект «Samkraft».
2. APIs & Services → OAuth consent screen → External → заполни (название Samkraft, твой email).
3. Credentials → Create Credentials → OAuth client ID → Web application.
4. Authorized redirect URI (взять из Supabase → Authentication → Providers → Google):
   `https://sulyulmqypuzzgsbudfx.supabase.co/auth/v1/callback`
5. Скопируй **Client ID** и **Client Secret** → Supabase → Authentication → Providers → Google → включить, вставить, Save.
6. Пришли мне Client ID/Secret, если хочешь, чтобы я проверила — или вставь сама.

После этого кнопка «Fortsätt med Google» заработает.
