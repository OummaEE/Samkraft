# Resend для Samkraft — DNS-записи + подключение

Домен-отправитель: **samkraft.forfun.info** (создан в Resend, регион EU).
Осталось добавить 3 DNS-записи в Cloudflare, затем я проверю домен и переключу Supabase на Resend.

## Шаг 1. Добавить 3 записи в Cloudflare

Cloudflare → домен **forfun.info** → **DNS → Records → Add record**. Добавь три записи ровно так
(поле «Name» — короткое, Cloudflare сам допишет `.forfun.info`). Все три — **DNS only** (серое облако, не оранжевое).

### Запись 1 — DKIM (TXT)
```
Type:    TXT
Name:    resend._domainkey.samkraft
Content: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtslER3FHBl77SNxwpCoMSPFnyCnQWTl6Tx/cIWqmNUdIqmO1lO+FsQtRlBEhRL+4rI9AqkOwtlBprCRwQkxfAi5WtwBd7DYlYepZFofJS790jhJEYshizuIJbf6wvE+/7fivyd6wGgKCqbe3orki1RbW9/fcwl2eSJY/gXPdXEQIDAQAB
TTL:     Auto
```

### Запись 2 — SPF (MX)
```
Type:        MX
Name:        send.samkraft
Mail server: feedback-smtp.eu-west-1.amazonses.com
Priority:    10
TTL:         Auto
```

### Запись 3 — SPF (TXT)
```
Type:    TXT
Name:    send.samkraft
Content: v=spf1 include:amazonses.com ~all
TTL:     Auto
```

> Записи привязаны к поддомену `*.samkraft.forfun.info` и НЕ трогают почту/сайт самого forfun.info.
> Альтернатива вручную: в дашборде Resend у домена есть кнопка «Add records with Cloudflare» —
> подключаешь Cloudflare одним кликом, и Resend сам пропишет эти же записи.

## Шаг 2. Скажи мне «готово»
Я запущу проверку домена в Resend (обычно 1–5 минут после добавления записей) и пришлю статус.

## Шаг 3. Переключить Supabase с Gmail на Resend (я подскажу точно)
Когда домен станет verified, в Supabase → Authentication → Emails → SMTP Settings заменить на:
```
Host:         smtp.resend.com
Port:         465
Username:     resend
Password:     <RESEND_API_KEY_SAMKRAFT из .env — re_8z9...>
Sender email: noreply@samkraft.forfun.info
Sender name:  Samkraft
```
Шаблоны и темы писем остаются те же (они уже вставлены). После этого регистрация с подтверждением
email будет работать быстро и без таймаутов.
