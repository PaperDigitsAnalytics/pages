const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Reviews HTML block (compact indentation to reduce mismatch risk)
const REVIEWS_HTML = `
                <section class="reviews-section" aria-label="Klantreviews">
                    <h2 class="reviews-title">Wat klanten zeggen</h2>
                    <div class="reviews-list">
                        <article class="review-card">
                            <div class="review-avatar">
                                <img src="/images/clients/bernice goudt.jpeg" alt="Bernice Goudt, Dopper" loading="lazy">
                            </div>
                            <div class="review-content">
                                <blockquote class="review-quote">PaperDigits tilt onze performance marketing naar een hoger niveau en optimaliseert voor internationale groei. Hun proactieve aanpak en snelle communicatie maken hen onmisbaar voor ons online succes.</blockquote>
                                <div class="review-author">
                                    <span class="review-name">BERNICE GOUDT</span>
                                    <span class="review-role">Marketing Manager, Dopper</span>
                                </div>
                            </div>
                        </article>
                        <article class="review-card">
                            <div class="review-avatar">
                                <img src="/images/clients/koen duits.jpeg" alt="Koen Duits, Fietsenwinkel.nl" loading="lazy">
                            </div>
                            <div class="review-content">
                                <blockquote class="review-quote">We halen alles uit onze performancekanalen en blijven doorontwikkelen op tracking en BI. PaperDigits schakelt snel en leeft ons merk—een prettige en effectieve samenwerking.</blockquote>
                                <div class="review-author">
                                    <span class="review-name">KOEN DUITS</span>
                                    <span class="review-role">Marketing Manager, Fietsenwinkel.nl</span>
                                </div>
                            </div>
                        </article>
                        <article class="review-card">
                            <div class="review-avatar">
                                <img src="/images/clients/age huitema.jpeg" alt="Age Huitema, Quatt" loading="lazy">
                            </div>
                            <div class="review-content">
                                <blockquote class="review-quote">Met hulp van PaperDigits groeide Quatt als nieuw merk uit tot marktleider in warmtepompen. Hun datagedreven aanpak zet schaalbare campagnes op die onze doelgroep in beweging krijgen.</blockquote>
                                <div class="review-author">
                                    <span class="review-name">AGE HUITEMA</span>
                                    <span class="review-role">Marketing Manager, Quatt</span>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <script type="application/ld+json">
                {"@context":"https://schema.org","@graph":[
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Bernice Goudt"},"reviewBody":"PaperDigits tilt onze performance marketing naar een hoger niveau en optimaliseert voor internationale groei. Hun proactieve aanpak en snelle communicatie maken hen onmisbaar voor ons online succes."},
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Koen Duits"},"reviewBody":"We halen alles uit onze performancekanalen en blijven doorontwikkelen op tracking en BI. PaperDigits schakelt snel en leeft ons merk—een prettige en effectieve samenwerking."},
                  {"@type":"Review","about":{"@type":"Organization","name":"PaperDigits"},"author":{"@type":"Person","name":"Age Huitema"},"reviewBody":"Met hulp van PaperDigits groeide Quatt als nieuw merk uit tot marktleider in warmtepompen. Hun datagedreven aanpak zet schaalbare campagnes op die onze doelgroep in beweging krijgen."}
                ]}
                </script>`;

function injectIntoFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('reviews-section')) {
    console.log(`ℹ️  Skipping (already has reviews): ${path.basename(filePath)}`);
    return false;
  }
  // Strategy B: insert right before the first closing </article>
  const closeArticleIdx = html.indexOf('</article>');
  if (closeArticleIdx === -1) {
    console.warn(`⚠️  </article> not found in ${path.basename(filePath)}; skipping`);
    return false;
  }
  const updated = html.slice(0, closeArticleIdx) + '\n\n' + REVIEWS_HTML + '\n' + html.slice(closeArticleIdx);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ Injected reviews into ${path.basename(filePath)}`);
  return true;
}

function main(){
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.html'));
  let count = 0;
  for (const f of files) {
    const full = path.join(CONTENT_DIR, f);
    try { if (injectIntoFile(full)) count++; } catch(e){ console.warn('⚠️  Failed', f, e.message); }
  }
  console.log(`\nDone. Updated ${count}/${files.length} files.`);
}

main();


