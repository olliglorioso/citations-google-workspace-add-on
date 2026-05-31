function onOpen() {
  SlidesApp.getUi()
    .createMenu('Citations')
    .addItem('Open citation sidebar', 'showCitationSidebar')
    .addItem('Add/update bibliography slide', 'rebuildBibliographySlide')
    .addSeparator()
    .addItem('Clear saved citations', 'clearSavedCitations')
    .addToUi();
}

function showCitationSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Citations');
  SlidesApp.getUi().showSidebar(html);
}

function insertCitationFromSidebar(form) {
  var citation = form.bibtex
    ? citationFromBibTeX_(form.bibtex)
    : normalizeCitation_(form);
  var citations = getCitationStore_();
  var existingIndex = findCitationIndex_(citations, citation);

  if (existingIndex === -1) {
    citations.push(citation);
    existingIndex = citations.length - 1;
    setCitationStore_(citations);
  }

  var style = form.style || 'IEEE';
  var marker = formatCitationMarker_(citations[existingIndex], existingIndex + 1, style);
  insertMarkerOnCurrentSlide_(marker);

  return {
    marker: marker,
    count: citations.length,
    citations: formatCitationListForSidebar_(citations)
  };
}

function rebuildBibliographySlide(style) {
  style = style || 'IEEE';

  var presentation = SlidesApp.getActivePresentation();
  var citations = getCitationStore_();
  if (citations.length === 0) {
    SlidesApp.getUi().alert('No citations have been saved yet.');
    return { count: 0 };
  }

  removeExistingBibliographySlide_(presentation);

  var slide = createEmptySlide_(presentation);
  var slideId = slide.getObjectId();
  getDocumentProperties_().setProperty('bibliographySlideId', slideId);

  var pageWidth = presentation.getPageWidth();
  var pageHeight = presentation.getPageHeight();
  var margin = 36;

  var titleBox = slide.insertTextBox('References', margin, 28, pageWidth - margin * 2, 36);
  titleBox.getText().getTextStyle().setFontSize(24).setBold(true);

  var bodyText = citations.map(function(citation, index) {
    return formatBibliographyEntry_(citation, index + 1, style);
  }).join('\n\n');

  var bodyBox = slide.insertTextBox(bodyText, margin, 78, pageWidth - margin * 2, pageHeight - 104);
  bodyBox.getText().getTextStyle().setFontSize(11);

  return { count: citations.length };
}

function createEmptySlide_(presentation) {
  var preferredLayouts = [
    SlidesApp.PredefinedLayout.BLANK,
    SlidesApp.PredefinedLayout.TITLE_ONLY,
    SlidesApp.PredefinedLayout.TITLE,
    SlidesApp.PredefinedLayout.SECTION_HEADER
  ];

  for (var index = 0; index < preferredLayouts.length; index += 1) {
    try {
      var slide = presentation.appendSlide(preferredLayouts[index]);
      clearSlideElements_(slide);
      return slide;
    } catch (error) {
      // Some themes remove predefined layouts from the current master.
    }
  }

  var layouts = presentation.getLayouts();
  if (layouts.length > 0) {
    var fallbackSlide = presentation.appendSlide(layouts[0]);
    clearSlideElements_(fallbackSlide);
    return fallbackSlide;
  }

  throw new Error('Could not create a bibliography slide because this presentation has no usable slide layouts.');
}

function clearSlideElements_(slide) {
  slide.getPageElements().forEach(function(element) {
    element.remove();
  });
}

function getSavedCitationsForSidebar() {
  return {
    citations: formatCitationListForSidebar_(getCitationStore_())
  };
}

function deleteCitationFromSidebar(number) {
  var citations = getCitationStore_();
  var index = Number(number) - 1;

  if (index < 0 || index >= citations.length) {
    throw new Error('Citation not found.');
  }

  citations.splice(index, 1);
  setCitationStore_(citations);

  return {
    count: citations.length,
    citations: formatCitationListForSidebar_(citations)
  };
}

function clearSavedCitations() {
  var ui = SlidesApp.getUi();
  var response = ui.alert(
    'Clear saved citations?',
    'This clears the add-on citation list for this presentation. Existing text already inserted on slides is not removed.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response !== ui.Button.OK) {
    return { cleared: false };
  }

  getDocumentProperties_().deleteProperty('citations');
  getDocumentProperties_().deleteProperty('bibliographySlideId');
  return { cleared: true, citations: [] };
}

function insertMarkerOnCurrentSlide_(marker) {
  var presentation = SlidesApp.getActivePresentation();
  var selection = presentation.getSelection();
  var page = selection && selection.getCurrentPage();
  var slide = page && page.getPageType && page.getPageType() === SlidesApp.PageType.SLIDE
    ? page
    : presentation.getSlides()[0];

  var pageWidth = presentation.getPageWidth();
  var box = slide.insertTextBox(marker, pageWidth - 112, 24, 78, 24);
  box.getText().getTextStyle().setFontSize(12).setBold(true);
}

function removeExistingBibliographySlide_(presentation) {
  var slideId = getDocumentProperties_().getProperty('bibliographySlideId');
  if (!slideId) {
    return;
  }

  presentation.getSlides().forEach(function(slide) {
    if (slide.getObjectId() === slideId) {
      slide.remove();
    }
  });
}
