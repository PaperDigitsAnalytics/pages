---
filename: bigquery-voor-kanaalsturing-met-crm-data.html
slug: bigquery-voor-kanaalsturing-met-crm-data
timestamp: 2026-03-10T10:20:00.000Z
title: BigQuery voor kanaalsturing met CRM-data
description: BigQuery wordt pas echt interessant voor marketing wanneer je advertentiekosten, GA4-gedrag en CRM-uitkomsten in dezelfde rapportage kunt lezen.
adDescription: Koppel Ads, GA4 en CRM in BigQuery en stuur op kanaalbijdrage die sales herkent.
adDescription2: Minder losse exports. Meer rapportage waarin marketing en sales hetzelfde verhaal zien.
headline1: BigQuery met CRM-data
headline2: Kanaalsturing die klopt
headline3: Minder losse exports
category: Analytics
author: Wouter Naber
date: 10 maart 2026
readCount: 441
heroImage: images/Hetportretbureau_LR__T1A1116.jpg
heroImageAlt: BigQuery voor kanaalsturing met CRM-data
---

# BigQuery voor kanaalsturing met CRM-data

Je ziet in Google Ads welke campagnes formulieren opleveren. Je ziet in GA4 wat bezoekers op de site doen. En in het CRM zie je welke leads uiteindelijk klant worden. Het lastige deel begint pas daarna: al die cijfers zeggen iets anders over hetzelfde kanaal.

## Veel marketingteams rapporteren nog in losse werkelijkheden

Dat voelt vaak normaler dan het is. Ads wordt gebruikt voor spend en conversies. GA4 voor gedrag en kanaalverkeer. HubSpot of Salesforce voor leadstatus en omzet. Elk systeem is bruikbaar voor zijn eigen taak. Alleen wordt kanaalsturing lastig zodra je één vraag wilt beantwoorden: welk kanaal levert niet alleen volume op, maar ook klanten?

Dan ontstaan de bekende discussies. Marketing ziet in het advertentieplatform genoeg conversies om door te schalen. Sales ziet vooral formulieren die niet verder komen. Finance vraagt waarom gerapporteerde omzet per kanaal niet aansluit op de omzet in het eigen systeem. Het probleem is dan niet een gebrek aan cijfers. Het probleem is dat niemand met precies dezelfde bron rekent.

## Je hebt waarschijnlijk al exports, dashboards en koppelingen gebouwd

Veel teams lossen dat op met extra lagen. Een export uit Google Ads. Een CSV uit het CRM. Een dashboard in Looker Studio of Power BI. Dat is logisch. Volgens Google Analytics kun je alle ruwe GA4-events exporteren naar BigQuery, en Google Cloud laat ook zien dat je externe bronnen zoals CRM-data naast die GA4-data kunt zetten voor rapportage buiten sampling en quota om.

Alleen blijft het zonder vaste onderlaag vaak handwerk. Bestandsnamen veranderen. Kanaaldefinities schuiven. Leadstatussen worden net anders geïnterpreteerd. Dan krijg je wel een dashboard, maar nog geen rapportage waar marketing, sales en finance op dezelfde manier naar kijken.

## BigQuery wordt nuttig zodra het de plek wordt waar bronnen samenkomen

Daar zit de echte use case. BigQuery is niet interessant omdat het veel data aankan. Het wordt interessant zodra je advertentiekosten, sitegedrag en CRM-uitkomsten in dezelfde dataset kunt lezen. Volgens Google Analytics exporteer je in BigQuery alle ruwe events uit GA4. Volgens Google Cloud kun je Google Ads-data via de BigQuery Data Transfer Service als terugkerende transfer laden, inclusief refresh windows voor recente correcties en backfills voor historische gaten.

Dat verandert wat je kunt zien. Niet alleen welke campagne een lead opleverde, maar ook welke zoekwoorden of kanalen later klanten opleveren met echte omzet of marge. Dan verschuift je rapportage van platformsucces naar bedrijfsbijdrage.

## Zo richt PaperDigits BigQuery in voor kanaalbeslissingen

Wij beginnen niet met tabellen. We beginnen met de vraag welke uitkomst voor het bedrijf telt. Is dat een sales qualified lead, een offerte, een order of omzet na retouren? Daarna leggen we vast welke data daarvoor nodig is uit Ads, GA4 en CRM, en welke definities overal gelijk moeten zijn.

Vervolgens bouwen we de datastroom zo op dat kanaalkosten, sessies, leadstatussen en omzet naast elkaar komen te staan in een rapportage die wél bedoeld is om beslissingen te nemen. Niet elk team hoeft dan nog zijn eigen export bij te houden. En niet elke meeting hoeft opnieuw te beginnen bij de vraag welk getal eigenlijk klopt.

## Waar je nu per platform kijkt, zie je straks wat een kanaal het bedrijf echt oplevert

Het verschil is meestal minder spectaculair dan mensen verwachten. Je krijgt niet opeens perfecte attributie. Je krijgt iets nuttigers. Eerder zicht op campagnes die veel leads brengen maar weinig klanten. Meer onderbouwing voor kanalen die in een advertentieplatform klein lijken, maar in CRM of omzetdata juist sterk zijn.

BigQuery vervangt daarmee geen marketingverstand. Het haalt vooral een bekend soort mist uit het gesprek. En juist daar begint meestal betere kanaalsturing.
