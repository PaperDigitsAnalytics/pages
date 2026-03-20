---
filename: video-tracking-instellen-met-google-tag-manager.html
slug: video-tracking-instellen-met-google-tag-manager
timestamp: 2026-03-17T12:39:09.600Z
title: De overstap naar Server-Side Tagging: Waarom 2026 het jaar van de waarheid is
description: 
adDescription: 
adDescription2: 
headline1: 
headline2: 
headline3: 
category: Google Tag Manager
author: Wouter Naber
date: 17 maart 2026
readCount: 320
heroImage: images/google-analytics-user-retention-cohort-heatmap.jpg
heroImageAlt: De overstap naar Server-Side Tagging: Waarom 2026 het jaar van de waarheid is
---
Video tracking instellen met Google Tag Manager is eenvoudiger dan het lijkt — als je weet waar GTM op wacht.

## Wat je nu ziet in je rapporten

Je hebt video's op je site. Misschien productdemo's, misschien uitlegvideo's. Maar in GA4 zie je alleen paginaweergaven. Wie die video's afspeelt, hoe lang, en of ze erna converteren — dat staat nergens.

Je weet dat mensen op die pagina's komen. Je weet niet wat ze daarna doen.

## Wat teams al geprobeerd hebben

Veel teams zetten YouTube-video's in via een embed en vertrouwen op de "Enhanced Measurement" instelling in GA4. Die logt soms een `video_start`, soms niet. Het hangt af van hoe de embed geladen is, of er consent actief is, en of de YouTube iframe API beschikbaar is.

Anderen hebben handmatig event-code in de pagina gezet. Dat werkt totdat er een nieuwe CMS-versie uitkomt, of iemand de template aanpast zonder het door te geven.

## Waarom het niet werkt zonder de juiste inrichting

GTM heeft de YouTube Video trigger ingebouwd. Maar die werkt alleen als de YouTube iframe API actief is. Bij veel embeds is dat niet het geval — zeker niet als er een cookiewall actief is die scripts blokkeert.

Bovendien logt GTM standaard alleen `video_start`. Voor `video_progress` (25%, 50%, 75%) en `video_complete` moet je de trigger expliciet configureren. Zonder dat zie je alleen wie begon, nooit wie echt keek.

## Wat PaperDigits hier concreet aan doet

We zetten de YouTube iframe API aan via een Custom HTML tag in GTM — dat is één tag die je eenmalig configureert. Daarna activeren we de YouTube Video trigger met de voortgangspercentages die voor jouw situatie relevant zijn.

Vervolgens sturen we die events door naar GA4 als `video_start`, `video_progress` en `video_complete`, met de videotitel en URL als parameters. Zo kun je in GA4 filteren per video en per kijkpercentage.

Als er consent mode actief is, koppelen we de triggers aan de juiste toestemmingsconditie zodat er geen data verloren gaat bij gebruikers die wél toestemming geven.

## Wat je daarna ziet

Daarvoor: video's draaien op je site, maar je weet niet of iemand ze bekijkt.

Daarna: je ziet per video hoeveel procent van de kijkers de helft haalt, en welk deel daarna een contactformulier invult of een bestelling plaatst. Je kunt een pagina met een sterke video onderbouwd prioriteren in je contentstrategie — niet op basis van gevoel, maar op basis van kijkgedrag.
