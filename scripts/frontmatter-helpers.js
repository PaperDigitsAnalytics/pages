function clampWords(text, maxChars) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (s.length <= maxChars) return s;
  const cut = s.slice(0, maxChars + 1);
  const space = cut.lastIndexOf(' ');
  return (space > Math.floor(maxChars * 0.65) ? cut.slice(0, space) : s.slice(0, maxChars)).trim();
}

function fallbackMeta(topic, draft) {
  const baseTitle = String((draft && draft.title) || topic.title || '').trim();
  return {
    title: clampWords(baseTitle || topic.title || topic.slug, 120),
    description: clampWords((draft && draft.description) || `${baseTitle || topic.title} legt uit waar het in de praktijk vaak schuurt en hoe je het beter inricht.`, 300),
    adDescription: clampWords((draft && draft.adDescription) || `${baseTitle || topic.title} helder ingericht zonder onnodige complexiteit.`, 90),
    adDescription2: clampWords((draft && draft.adDescription2) || `Praktische uitleg over ${String(topic.title || topic.slug).toLowerCase()}.`, 90),
    headline1: clampWords((draft && draft.headline1) || baseTitle || topic.title || topic.slug, 30),
    headline2: clampWords((draft && draft.headline2) || 'Praktisch uitgelegd', 30),
    headline3: clampWords((draft && draft.headline3) || 'PaperDigits', 30),
    heroImageAlt: clampWords((draft && draft.heroImageAlt) || baseTitle || topic.title || topic.slug, 150),
  };
}

module.exports = { clampWords, fallbackMeta };
