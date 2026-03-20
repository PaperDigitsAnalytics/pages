---
filename: meting-van-nieuwsbriefinschrijvingen-in-ga4-en-gtm.html
slug: meting-van-nieuwsbriefinschrijvingen-in-ga4-en-gtm
timestamp: 2026-03-17T12:39:09.582Z
title: Meting van nieuwsbriefinschrijvingen in GA4 en GTM
description: Nieuwsbriefinschrijvingen verdwijnen vaak in het niets in GA4. Lees hoe je met GTM formulierconversies instelt en per kanaal ziet welke campagnes inschrijvingen opleveren.
adDescription: Nieuwsbriefmeting via GTM. Zie precies welk kanaal elke inschrijving oplevert.
adDescription2: Formuliertracking instellen in GTM zodat GA4 elke inschrijving als conversie registreert.
headline1: Inschrijvingen meten in GA4
headline2: Formuliertracking via GTM
headline3: Weet welk kanaal converteert
category: Google Tag Manager
author: Wouter Naber
date: 17 maart 2026
readCount: 320
heroImage: images/google-analytics-user-retention-cohort-heatmap.jpg
heroImageAlt: Marketeer bekijkt nieuwsbrief-conversiedata in een GA4-dashboard
---

# Meting van nieuwsbriefinschrijvingen in GA4 en GTM

Nieuwsbriefinschrijvingen zijn waardevolle conversies. Maar in de meeste GA4-accounts staan ze nergens. Niet omdat het lastig is, maar omdat het nooit goed opgezet is.

## Je stuurt verkeer, maar ziet geen resultaat

Je stuurt campagnes naar een pagina met een inschrijfformulier. Mensen vullen het in. In GA4 zie je pageviews, sessies en klikgedrag. Maar hoeveel mensen hebben zich ingeschreven? Dat weet je niet.

Je kunt wel kijken in je e-mailplatform. Maar dat vertelt je niet welk kanaal of welke campagne die inschrijving heeft opgeleverd. De verbinding tussen marketinginspanning en resultaat ontbreekt.

## Wat teams al geprobeerd hebben

Sommige teams vergelijken ESP-cijfers handmatig met campagneperiodes. Anderen meten paginaweergaven van de bedankpagina als proxy. Dat geeft een getal, maar geen context.

GA4 heeft ook enhanced measurement. Dat registreert formulierinteracties, maar lang niet altijd een voltooide inschrijving. Je ziet dat iemand een veld heeft aangeraakt. Niet dat ze op verzenden hebben geklikt.

## Een inschrijving is een conversie

Een nieuwsbriefinschrijving is net zo'n conversie als een aankoop of een aanvraag. Dus moet hij zo gemeten worden: op het moment van voltooiing, met context over kanaal, pagina en campagne.

Dat doe je door in GTM een trigger in te richten die afgaat op een succesvolle submit. Niet op een klik, niet op een veldinteractie. Dat event gaat naar GA4 als een named conversie met parameters die je later kunt uitsplitsen.

<!-- Verplicht visueel element -->
<section class="hs-impact" aria-labelledby="meting-van-nieuwsbriefinschrijvingen-in-ga4-en-gtm-impact-title">
  <h2 id="meting-van-nieuwsbriefinschrijvingen-in-ga4-en-gtm-impact-title">Waar het verschil vaak zichtbaar wordt</h2>
  <p class="hs-impact__intro">Deze vergelijking laat indicatief zien waar de oude aanpak meestal vastloopt en waar een scherpere aanpak verschil maakt.</p>
  <div class="table-wrap">
    <table class="hs-table">
      <caption class="visually-hidden">Vergelijking huidige aanpak versus scherpere aanpak voor Meting van nieuwsbriefinschrijvingen in GA4 en GTM</caption>
      <thead>
        <tr>
          <th scope="col">Aspect</th>
          <th scope="col" class="num">Huidige aanpak</th>
          <th scope="col" class="num">Scherpere aanpak</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Rapportagevertrouwen</th>
          <td><div class="mbar is-bad" style="--w:35%"><span class="mbar__label">twijfel</span></div></td>
          <td><div class="mbar is-good" style="--w:85%"><span class="mbar__label">helderder</span></div></td>
        </tr>
        <tr>
          <th scope="row">Handmatig werk</th>
          <td><div class="mbar is-bad" style="--w:55%"><span class="mbar__label">veel</span></div></td>
          <td><div class="mbar is-good" style="--w:30%"><span class="mbar__label">minder</span></div></td>
        </tr>
        <tr>
          <th scope="row">Snelheid van bijsturen</th>
          <td><div class="mbar" style="--w:40%"><span class="mbar__label">later</span></div></td>
          <td><div class="mbar is-good" style="--w:88%"><span class="mbar__label">eerder</span></div></td>
        </tr>
        <tr>
          <th scope="row">Budgetkeuzes</th>
          <td><div class="mbar is-bad" style="--w:45%"><span class="mbar__label">op gevoel</span></div></td>
          <td><div class="mbar is-good" style="--w:90%"><span class="mbar__label">concreter</span></div></td>
        </tr>
      </tbody>
    </table>
    <p class="hs-source">Indicatieve benchmark op basis van PaperDigits cases 2024-2026.</p>
  </div>
</section>

## Wat PaperDigits inricht

PaperDigits kijkt eerst hoe het formulier gebouwd is: native HTML, een plugin of een derde partij zoals Klaviyo of Mailchimp. Per formuliertype is er een andere aanpak in GTM.

We bouwen een trigger op de submit-bevestiging, koppelen een GA4-eventtag en markeren de conversie in GA4. Daarna is elke inschrijving direct zichtbaar per kanaal, campagne en pagina. Geen handmatige koppelingen meer.

## Van gissen naar sturen

Waar je nu een getal ziet in je e-mailplatform zonder context, zie je straks in GA4 precies via welk kanaal elke inschrijving is binnengekomen. Je kunt zien of LinkedIn meer oplevert dan organisch verkeer, of welke landingspagina het beste converteert.

Dat maakt een nieuwsbriefcampagne stuurbaar. Niet achteraf, maar terwijl hij loopt.
