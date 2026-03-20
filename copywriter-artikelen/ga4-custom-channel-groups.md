---
filename: ga4-custom-channel-groups.html
slug: ga4-custom-channel-groups
timestamp: 2026-03-10T15:33:02.151Z
title: GA4 custom channel groups instellen
description: GA4 deelt je verkeer in standaard kanalen in, maar die kloppen zelden met hoe jij je campagnes hebt opgezet. Custom channel groups geven je grip op je eigen kanaalrapportage.
adDescription: Standaard GA4-kanalen kloppen zelden. Custom groups maken je rapportage betrouwbaar.
adDescription2: Zie welke kanalen converteren op basis van jouw campagnestructuur, niet die van Google.
headline1: Custom channel groups in GA4
headline2: Betere kanaalrapportage
headline3: Jouw structuur, jouw data
category: Analytics
author: Wouter Naber
date: 10 maart 2026
readCount: 239
heroImage: images/google-analytics-user-retention-cohort-heatmap.jpg
heroImageAlt: Schermafbeelding van GA4 kanaalrapportage met aangepaste kanaalgroepen ingesteld
---

# GA4 custom channel groups instellen

GA4 groepeert je verkeer automatisch in kanalen als Organic Search, Paid Search en Direct. Die indeling is generiek. Als jij met branded campagnes, partnerverkeer of retargeting werkt, klopt de rapportage al snel niet meer met hoe jij je budget hebt ingericht.

## Wat je nu ziet in GA4

GA4 gebruikt standaard kanaalgroepen die Google zelf heeft gedefinieerd. Paid Search pakt alles met een gclid. Organic zoekt op utm_medium=organic. Direct vangt al het verkeer op dat nergens anders in past.

Als jij campagnes runt via een affiliate partner, een vergelijkingssite of een extern platform met afwijkende UTM-waarden, dan verdwijnt dat verkeer in Unassigned of Direct. Je rapportage klopt technisch gezien. Maar je ziet niet wat je wilt zien.

## Hoe teams dit nu omzeilen

Veel teams lossen dit op met segmenten of aangepaste rapporten. Ze filteren op utm_source of campagnenaam. Dat werkt voor één rapport op één moment. Maar elk nieuw rapport vraagt opnieuw hetzelfde filter. Elke collega die zonder die instelling kijkt, ziet iets anders.

Anderen exporteren alles naar BigQuery en bouwen hun eigen toewijzingslogica. Dat geeft meer controle, maar vraagt setup en onderhoud. De meeste teams hebben daar niet structureel de tijd voor.

## Hoe channel groups werken

GA4 laat je zelf kanaalgroepen definiëren op basis van UTM-parameters, advertentieplatform of verkeersbron. Je bouwt regels: als utm_source bevat 'criteo' en utm_medium is 'cpc', dan valt dit onder het kanaal Retargeting.

Die regels worden centraal opgeslagen en gelden voor alle standaardrapporten, exploraties en het attribuutiemodel. Je hoeft niet meer per rapport te filteren. Nieuwe sessies worden automatisch in de juiste groep ingedeeld zodra ze binnenkomen.

<!-- Verplicht visueel element -->
<section class="hs-impact" aria-labelledby="ga4-custom-channel-groups-impact-title">
  <h2 id="ga4-custom-channel-groups-impact-title">Waar het verschil vaak zichtbaar wordt</h2>
  <p class="hs-impact__intro">Deze vergelijking laat indicatief zien waar de oude aanpak meestal vastloopt en waar een scherpere aanpak verschil maakt.</p>
  <div class="table-wrap">
    <table class="hs-table">
      <caption class="visually-hidden">Vergelijking huidige aanpak versus scherpere aanpak voor GA4 custom channel groups instellen</caption>
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
          <th scope="row">Bijsturen</th>
          <td><div class="mbar is-bad" style="--w:45%"><span class="mbar__label">op gevoel</span></div></td>
          <td><div class="mbar is-good" style="--w:90%"><span class="mbar__label">concreter</span></div></td>
        </tr>
      </tbody>
    </table>
    <p class="hs-source">Indicatieve benchmark op basis van PaperDigits cases 2024-2026.</p>
  </div>
</section>

## Wat PaperDigits instelt

PaperDigits brengt eerst de campagnestructuur in kaart. Welke bronnen gebruik je, hoe zijn je UTM-tags ingericht, en welke kanalen wil je als aparte groep zien? Branded versus non-branded search, retargeting versus prospecting, eigen kanalen versus externe partners.

Daarna bouwen we de regels in GA4 en controleren we of bestaand verkeer correct wordt ingedeeld. We documenteren de logica zodat nieuwe campagnes automatisch goed binnenkomen en collega's weten wat ze zien.

## Wat je daarna ziet

Waar je nu 28% van je verkeer als Direct of Unassigned ziet, zie je straks welk deel branded search is, welk deel retargeting en welk deel echt direct. Die splitsing verandert hoe je campagnes beoordeelt.

Een retargeting-kanaal dat €9 per klik kost maar een conversieratio van 11% heeft, ziet er heel anders uit dan wanneer het wordt samengevoegd met generieke Paid Search. Je stuurt op echte cijfers, niet op een gemiddelde van ongelijke kanalen.
