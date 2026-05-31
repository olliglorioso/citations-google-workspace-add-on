function formatCitationMarker_(citation, number, style) {
  if (style === 'APA') {
    var author = citation.author || 'Unknown';
    var year = citation.year || 'n.d.';
    return '(' + author + ', ' + year + ')';
  }

  return '[' + number + ']';
}

function formatBibliographyEntry_(citation, number, style) {
  if (style === 'APA') {
    return formatApaEntry_(citation);
  }

  return formatIeeeEntry_(citation, number);
}

function formatIeeeEntry_(citation, number) {
  var entry = '[' + number + '] ';
  var parts = [];

  if (citation.author) {
    parts.push(citation.author);
  }
  if (citation.title) {
    parts.push('"' + citation.title + '"');
  }
  if (citation.venue) {
    parts.push(citation.venue);
  }
  if (citation.year) {
    parts.push(citation.year);
  }

  entry += parts.join(', ');
  entry += formatIdentifierSuffix_(citation);
  return endWithPeriod_(entry);
}

function formatApaEntry_(citation) {
  var author = citation.author || 'Unknown author';
  var year = citation.year || 'n.d.';
  var title = citation.title || 'Untitled work';
  var entry = author + '. (' + year + '). ' + title + '.';

  if (citation.venue) {
    entry += ' ' + citation.venue + '.';
  }
  entry += formatIdentifierSuffix_(citation);

  return endWithPeriod_(entry);
}

function formatIdentifierSuffix_(citation) {
  if (citation.doi) {
    return ' doi:' + citation.doi;
  }
  if (citation.url) {
    return ' ' + citation.url;
  }
  return '';
}

function endWithPeriod_(value) {
  return /[.!?]$/.test(value) ? value : value + '.';
}
