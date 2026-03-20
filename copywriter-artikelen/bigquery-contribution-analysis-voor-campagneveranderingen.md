---
filename: bigquery-contribution-analysis-voor-campagneveranderingen.html
slug: bigquery-contribution-analysis-voor-campagneveranderingen
timestamp: 2026-03-10T11:15:00.000Z
title: BigQuery contribution analysis voor campagneveranderingen
description: BigQuery contribution analysis helpt verklaren waarom omzet, conversie of vraag verandert. Handig als teams wel zien dát iets verschuift, maar niet waardoor.
adDescription: Gebruik BigQuery contribution analysis om sneller te zien waardoor marketingcijfers veranderen.
adDescription2: Zie welke segmenten omzet, conversie of vraag echt omhoog of omlaag trekken.
headline1: BigQuery contribution analysis
headline2: Waarom cijfers verschuiven
headline3: Zie drivers sneller
category: Analytics
author: Wouter Naber
date: 10 maart 2026
readCount: 233
heroImage: images/Hetportretbureau_LR__T1A1116.jpg
heroImageAlt: BigQuery contribution analysis voor campagneveranderingen
---

# BigQuery contribution analysis voor campagneveranderingen

Je ziet dat omzet daalt. Of conversie stijgt. Of een campagne ineens anders presteert dan vorige maand. Het dashboard laat de beweging zien. De meeting daarna gaat vooral over de vraag wie denkt te weten waarom.

## Verandering zien is iets anders dan verandering verklaren

Dat is precies waar veel rapportage ophoudt. Je ziet dat een KPI omhoog of omlaag gaat, maar niet welke combinatie van kanaal, productgroep, regio of doelgroep daar het sterkst aan bijdraagt. Dan wordt analyse snel handwerk. Iemand filtert op device. Iemand anders kijkt naar landen. Daarna volgt nog een tabblad met campagnes.

Dat levert vaak losse aanwijzingen op, maar zelden een overtuigend beeld van de belangrijkste driver. Zeker niet als meerdere dimensies tegelijk verschuiven.

## Je hebt waarschijnlijk al veel handmatige analyses gedaan

De standaardreactie is logisch. Vergelijk periodes. Splits uit per kanaal. Zet er een segment op. Dat helpt, maar het kost tijd en blijft vaak afhankelijk van welke uitsplitsing iemand toevallig als eerste probeert. Volgens de officiële BigQuery-documentatie is contribution analysis juist bedoeld om veranderingen in een metric in multidimensionale data te verklaren.

Google beschrijft het als een modeltype in BigQuery ML dat segmenten zoekt die de verandering tussen een testset en een controlset het sterkst verklaren. Het voorbeeld in de documentatie gaat over omzetverandering tussen twee jaren, maar hetzelfde principe is voor marketing heel bruikbaar bij campagnewijzigingen of verschuivingen in conversie.

## De use case is sneller zien wat de verschuiving trekt

Dat is het relevante verschil. Je vraagt niet meer alleen of omzet veranderde. Je laat BigQuery zoeken welke combinaties van dimensies die verandering vooral dragen. Bijvoorbeeld een regio plus productcategorie. Of een device plus kanaal. Of een doelgroep plus dag van de week.

Voor marketing betekent dat minder giswerk. Niet omdat een model automatisch de hele waarheid geeft, maar omdat je sneller ziet waar het gesprek moet beginnen. Dat is vaak al winst als cijfers in korte tijd verschuiven en teams snel moeten reageren.

## Zo gebruikt PaperDigits contribution analysis in BigQuery

Wij beginnen niet met een model bouwen op alle data tegelijk. We kijken eerst welke verandering echt uitleg nodig heeft. Gaat het om omzetdaling na een campagnewissel? Om een stijging in CPA? Om een plots verschil tussen markten? Daarna bepalen we wat de juiste test- en vergelijkingsperiode is en welke dimensies commercieel relevant zijn.

Pas dan zetten we contribution analysis in, zodat de uitkomst ook echt iets zegt over een beslissing. Soms levert dat een duidelijke driver op. Soms laat het zien dat meerdere kleinere verschuivingen samen de verandering verklaren. In beide gevallen scheelt het vooral tijd en richting in analyse.

## Waar je nu door filters zoekt, zie je straks sneller welke combinatie echt verschuift

Het nuttigste effect zit meestal in scherpte. Minder tijd kwijt aan losse hypotheses die nergens landen. Eerder zicht op welke markt, productgroep of kanaalcombinatie de beweging echt trekt. En sneller onderscheid tussen een symptoom en de onderliggende driver.

Contribution analysis in BigQuery vervangt daarmee geen analyst. Het voorkomt vooral dat elke verandering opnieuw begint met hetzelfde handmatige zoekwerk.
