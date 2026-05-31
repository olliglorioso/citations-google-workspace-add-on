function getDocumentProperties_() {
  return PropertiesService.getDocumentProperties();
}

function getCitationStore_() {
  var raw = getDocumentProperties_().getProperty('citations');
  if (!raw) {
    return [];
  }

  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function setCitationStore_(citations) {
  getDocumentProperties_().setProperty('citations', JSON.stringify(citations));
}

function normalizeCitation_(form) {
  return {
    key: cleanField_(form.key),
    author: cleanField_(form.author),
    year: cleanField_(form.year),
    title: cleanField_(form.title),
    venue: cleanField_(form.venue),
    doi: cleanField_(form.doi),
    url: cleanField_(form.url)
  };
}

function cleanField_(value) {
  return String(value || '').trim();
}

function findCitationIndex_(citations, citation) {
  var key = citationKey_(citation);
  for (var index = 0; index < citations.length; index += 1) {
    if (citationKey_(citations[index]) === key) {
      return index;
    }
  }
  return -1;
}

function citationKey_(citation) {
  return [
    citation.key,
    citation.author,
    citation.year,
    citation.title,
    citation.venue,
    citation.doi,
    citation.url
  ].join('|').toLowerCase();
}

function formatCitationListForSidebar_(citations) {
  return citations.map(function(citation, index) {
    return {
      number: index + 1,
      label: formatSidebarLabel_(citation, index + 1)
    };
  });
}

function formatSidebarLabel_(citation, number) {
  var pieces = [];
  if (citation.author) {
    pieces.push(citation.author);
  }
  if (citation.year) {
    pieces.push('(' + citation.year + ')');
  }
  if (citation.title) {
    pieces.push(citation.title);
  }

  return '[' + number + '] ' + (pieces.join(' ') || 'Untitled citation');
}
