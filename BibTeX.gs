function citationFromBibTeX_(bibtex) {
  var entry = parseBibTeXEntry_(bibtex);
  var fields = entry.fields;

  return {
    key: entry.key,
    author: cleanBibTeXValue_(fields.author || fields.editor || ''),
    year: cleanBibTeXValue_(fields.year || fields.date || ''),
    title: cleanBibTeXValue_(fields.title || ''),
    venue: cleanBibTeXValue_(fields.journal || fields.booktitle || fields.publisher || fields.organization || ''),
    doi: cleanBibTeXValue_(fields.doi || ''),
    url: cleanBibTeXValue_(fields.url || '')
  };
}

function parseBibTeXEntry_(bibtex) {
  var text = String(bibtex || '').trim();
  if (!text) {
    throw new Error('Paste a BibTeX entry first.');
  }

  var header = text.match(/^@\s*([A-Za-z]+)\s*\{\s*([^,]+)\s*,/);
  if (!header) {
    throw new Error('Could not parse the BibTeX entry header.');
  }

  var bodyStart = header[0].length;
  var bodyEnd = text.lastIndexOf('}');
  if (bodyEnd <= bodyStart) {
    throw new Error('Could not parse the BibTeX entry body.');
  }

  return {
    type: header[1].toLowerCase(),
    key: header[2].trim(),
    fields: parseBibTeXFields_(text.slice(bodyStart, bodyEnd))
  };
}

function parseBibTeXFields_(body) {
  var fields = {};
  var index = 0;

  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body.charAt(index))) {
      index += 1;
    }

    var nameStart = index;
    while (index < body.length && /[A-Za-z0-9_-]/.test(body.charAt(index))) {
      index += 1;
    }

    var fieldName = body.slice(nameStart, index).toLowerCase();
    if (!fieldName) {
      break;
    }

    while (index < body.length && /\s/.test(body.charAt(index))) {
      index += 1;
    }
    if (body.charAt(index) !== '=') {
      throw new Error('Could not parse BibTeX field: ' + fieldName);
    }
    index += 1;

    while (index < body.length && /\s/.test(body.charAt(index))) {
      index += 1;
    }

    var parsed = parseBibTeXValue_(body, index);
    fields[fieldName] = parsed.value;
    index = parsed.nextIndex;
  }

  return fields;
}

function parseBibTeXValue_(body, index) {
  var quote = body.charAt(index);
  if (quote === '{') {
    return parseBracedBibTeXValue_(body, index);
  }
  if (quote === '"') {
    return parseQuotedBibTeXValue_(body, index);
  }

  var start = index;
  while (index < body.length && body.charAt(index) !== ',') {
    index += 1;
  }
  return {
    value: body.slice(start, index).trim(),
    nextIndex: index
  };
}

function parseBracedBibTeXValue_(body, index) {
  var depth = 0;
  var start = index + 1;

  while (index < body.length) {
    var ch = body.charAt(index);
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return {
          value: body.slice(start, index),
          nextIndex: index + 1
        };
      }
    }
    index += 1;
  }

  throw new Error('Unclosed braced BibTeX field.');
}

function parseQuotedBibTeXValue_(body, index) {
  var start = index + 1;
  index += 1;

  while (index < body.length) {
    if (body.charAt(index) === '"' && body.charAt(index - 1) !== '\\') {
      return {
        value: body.slice(start, index),
        nextIndex: index + 1
      };
    }
    index += 1;
  }

  throw new Error('Unclosed quoted BibTeX field.');
}

function cleanBibTeXValue_(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\\&/g, '&')
    .replace(/\\_/g, '_')
    .replace(/\\%/g, '%')
    .replace(/\\#/g, '#')
    .trim();
}
