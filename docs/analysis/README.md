# Analyse de Migration — num_zer0

> Migration Grizzly SMS → SMS Online Pro

## Structure

```
analysis/
├── README.md                        ← Ce fichier
├── plan/                            ← Plan d'implémentation & overview
│   ├── 00-OVERVIEW.md               ← Vue d'ensemble du projet
│   └── 00-PLAN-IMPLEMENTATION.md    ← Plan détaillé de migration
├── grizzly/                         ← Analyse de l'ancien provider
│   └── 01-grizzly-sms-full-analysis.md
├── codebase/                        ← Analyse du code existant
│   ├── 03-admin-dashboard-analysis.md
│   ├── 04-credits-payments-analysis.md
│   └── 05-services-structure-analysis.md
├── sms-online-pro/                  ← Analyse du nouveau provider
│   ├── 01-api-bundle-analysis.md    ← Analyse initiale (bundle React)
│   ├── 02-docs-officielle.md        ← Documentation officielle complète
│   ├── services-list.txt            ← 644 services référencés
│   ├── viewer.html                  ← Explorateur HTML des services
│   └── icons/                       ← Système de sprites
│       ├── 02-icons-system-analysis.md
│       ├── service-full.css
│       ├── sprite-mapping.txt
│       └── sprite-mapping-clean.txt
└── memory/                          ← Notes journalières
    └── 2026-05-23.md
```
