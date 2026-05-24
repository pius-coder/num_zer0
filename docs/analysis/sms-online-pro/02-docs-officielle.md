# Documentation Officielle SMS Online Pro — API Complète

**Source :** https://sms-online.pro/docs/api/en/  
**Date :** 23 Mai 2026  
**Pages :** 18 (11 activation + 7 rent)

---

## Base URL

```
https://sms-online.pro/stubs/handler_api.php
```

Méthode : GET ou POST  
Auth : `api_key` (paramètre requête)

---

## 1. getNumber — Demander un numéro (V1)

```
handler_api.php?action=getNumber&api_key=$key&country=$country&service=$service
  &ref=$ref&phoneException=$phoneException&maxPrice=$maxPrice&operator=$operator
```

| Paramètre | Type | Req. | Description |
|-----------|------|------|-------------|
| api_key | string | ✅ | Clé API |
| service | string | ✅ | Code du service (voir table) |
| country | integer | ✅ | Code pays (voir table) |
| ref | string | | ID de parrainage |
| phoneException | string | | Exclure préfixes (7918,7900111) |
| maxPrice | float | | Prix max pour Free Price |
| operator | string | | Opérateur (virgule = multiple) |

**Réponse :** `ACCESS_NUMBER:$id:$phone`

**Erreurs :** WRONG_MAX_PRICE, BAD_ACTION, BAD_SERVICE, BAD_KEY, ERROR_SQL, BANNED, WRONG_EXCEPTION_PHONE, NO_BALANCE_FORWARD

---

## 2. getNumberV2 — Demander un numéro (V2, JSON)

```
handler_api.php?action=getNumberV2&api_key=$key&country=$country&service=$service
  &ref=$ref&phoneException=$phoneException&maxPrice=$maxPrice&operator=$operator
```

**Réponse JSON :**
```json
{
  "activationId": 123456,
  "phoneNumber": "79295******",
  "activationCost": 7.50,
  "currency": 840,
  "countryCode": "0",
  "canGetAnotherSms": "1",
  "activationTime": "2025-05-14 11:10:42",
  "activationOperator": null
}
```

| Champ | Description |
|-------|-------------|
| activationId | ID commande |
| phoneNumber | Numéro masqué |
| activationCost | Prix |
| currency | ISO 4217 (840=USD) |
| canGetAnotherSms | Peut recevoir un autre SMS |
| activationTime | Date activation |
| activationOperator | Opérateur |

**Erreur supplémentaire :** ORDER_ALREADY_EXISTS

---

## 3. setStatus — Changer statut activation

```
handler_api.php?action=setStatus&api_key=$key&status=$status&id=$id
```

| Status | Description |
|--------|-------------|
| 1 | Confirmer dispo (SMS envoyé) |
| 3 | Demander un autre code |
| 6 | Compléter l'activation |
| 8 | Annuler (remboursement) |

**Réponses :** ACCESS_READY, ACCESS_RETRY_GET, ACCESS_ACTIVATION, ACCESS_CANCEL  
**Erreurs :** EARLY_CANCEL_DENIED (< 2min), NO_ACTIVATION, BAD_STATUS, BAD_ACTION

---

## 4. getStatus — Statut activation

```
handler_api.php?action=getStatus&api_key=$key&id=$id
```

| Réponse | Description |
|---------|-------------|
| STATUS_WAIT_CODE | En attente SMS |
| STATUS_CANCEL | Annulée |
| STATUS_OK:$code | ✅ Code reçu : $code |
| STATUS_WAIT_RETRY:$code | Attente nouveau code |

---

## 5. getBalance — Solde

```
handler_api.php?action=getBalance&api_key=$key
```

**Réponse :** `ACCESS_BALANCE:$amount`

---

## 6. getNumbersStatus — Quantité dispo par service

```
handler_api.php?action=getNumbersStatus&api_key=$key&country=$country
```

**Réponse JSON :**
```json
{ "fb": 523, "wa": 35235, "tg": 46346, "ig": 3434 }
```

---

## 7. getPrices — Prix par pays/service

```
handler_api.php?action=getPrices&api_key=$key&country=$country&service=$service
```

**Réponse JSON :**
```json
{"Country":{"Service":{"cost":Cost,"count":Count}}}
```

---

## 8. getOperators — Opérateurs par pays

```
handler_api.php?action=getOperators&api_key=$key&country=$country
```

**Réponse JSON :**
```json
{
  "status": "success",
  "countryOperators": {
    "1": ["kyivstar", "vodafone", "life", "lycamobile", "mts", ...],
    "2": ["tele2", "beeline", "activ", "kcell", ...]
  }
}
```

---

## 9. getTopCountriesByService — Top pays pour un service

```
handler_api.php?action=getTopCountriesByService&api_key=$key&service=$service&freePrice=$bool
```

**Réponse JSON :**
```json
{
  "0": { "country": 0, "count": 43575, "price": 15.00, "retail_price": 30.00 },
  ...
}
```

---

## 10. Rent API — Location de numéros

### 10.1 getRentNumber — Commander location

```
handler_api.php?action=getRentNumber&api_key=$key&service=$service&country=$country&rent_time=$hours&operator=$operator
```

`rent_time` : 2, 4, 12, 24, 48, 72 heures...

**Réponse :**
```json
{
  "status": "success",
  "phone": { "id": 29169009, "endDate": "2025-09-30 00:36:18", "number": "33780736225" }
}
```

**Erreurs :** NO_BALANCE, WRONG_COUNTRY, CHANNELS_LIMIT, ACCOUNT_INACTIVE, NO_NUMBERS

---

### 10.2 continueRentNumber — Prolonger location

```
handler_api.php?action=continueRentNumber&api_key=$key&id=$id&rent_time=$hours
```

Même format de réponse que getRentNumber.

---

### 10.3 getRentStatus — Statut + messages reçus

```
handler_api.php?action=getRentStatus&api_key=$key&id=$id&page=$page&size=$size
```

**Réponse :**
```json
{
  "status": "success",
  "service": "wa",
  "currency": 840,
  "quantity": "2",
  "values": {
    "0": {
      "phoneFrom": "WhatsApp",
      "text": "Your sms-code is: 8362",
      "service": "wa",
      "date": "2025-08-22T08:54:25+00:00"
    }
  }
}
```

**Erreurs :** INVALID_PHONE, STATUS_FINISH, STATUS_WAIT_CODE, STATUS_CANCEL

---

### 10.4 setRentStatus — Changer statut location

```
handler_api.php?action=setRentStatus&api_key=$key&id=$id&status=$status
```

| Status | Description |
|--------|-------------|
| 1 | Terminer |
| 2 | Annuler |

**Erreurs :** INVALID_PHONE, INCORECT_STATUS, ALREADY_FINISH, ALREADY_CANCEL, CANT_CANCEL (>20min), SERVER_ERROR

---

### 10.5 getRentServicesAndCountries — Services/pays dispo pour location

```
handler_api.php?action=getRentServicesAndCountries&api_key=$key&rent_time=$hours&country=$country
```

**Réponse :** Prix, quantité, search_name pour chaque service.

---

### 10.6 getRentList — Liste locations en cours

```
handler_api.php?action=getRentList&api_key=$key
```

**Réponse :**
```json
{
  "status": "success",
  "values": {
    "0": { "id": "16", "phone": "33780736225" },
    "1": { "id": "17", "phone": "33780736226" }
  }
}
```

---

### 10.7 continueRentInfo — Infos de prolongation

```
handler_api.php?action=continueRentInfo&api_key=$key&id=$id&hours=$hours&needHistory=$needHistory
```

**Réponse :** price, currency, maxHours, history.

---

## Services & Pays

**Services :** 644 codes dans la doc publique (ex: ig, fb, wa, tg, vk, ok...).  
**Sprite :** 2035 icônes — les 644 sont le sous-ensemble actif/référencé dans la doc.

**Pays :** 186 codes numériques (ex: 0=RU, 1=UA, 2=KZ, 3=CN, 41=CM...)

---

## Différence entre V1 et V2

| Aspect | V1 (getNumber) | V2 (getNumberV2) |
|--------|----------------|-------------------|
| Réponse | ACCESS_NUMBER:$id:$phone | JSON complet |
| ActivationCost | Non | ✅ Oui |
| Currency (ISO 4217) | Non | ✅ 840=USD |
| canGetAnotherSms | Non | ✅ |
| activationTime | Non | ✅ |
| ORDER_ALREADY_EXISTS | Non | ✅ |

---

## Correspondance avec Grizzly SMS

| Grizzly | SMS Online Pro | Changement ? |
|---------|---------------|--------------|
| `handler_api.php` | `handler_api.php` | ✅ Même format |
| api_key | api_key | ✅ Même auth |
| getNumber | getNumber / getNumberV2 | ✅ + V2 disponible |
| setStatus (1,3,6,8) | setStatus (1,3,6,8) | ✅ Mêmes codes |
| getStatus | getStatus | ✅ Mêmes réponses |
| getBalance | getBalance | ✅ |
| getNumbersStatus | getNumbersStatus | ✅ |
| getPrices | getPrices | ✅ |
| - | getOperators | ✅ Nouveau |
| - | getTopCountriesByService | ✅ Nouveau |
| rentNumber | rentNumber + 6 endpoints | ✅ Plus complet |
| URL base | **different** | ⚠️ À changer |
| Codes services | potentiellement différents | ⚠️ À mapper |
| Codes pays | potentiellement différents | ⚠️ À mapper |
