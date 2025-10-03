const collectText = (data) => {
  if (!data) return "";

  let text = "";

  // Title + description
  if (data.title) text += data.title + " ";
  if (data.description) text += data.description + " ";

  // Headings
  if (data.headings) {
    Object.values(data.headings).forEach((arr) => {
      text += arr.join(" ") + " ";
    });
  }

  // Paragraphs
  if (Array.isArray(data.paragraphs)) {
    text += data.paragraphs.join(" ") + " ";
  }

  // Lists
  if (Array.isArray(data.lists)) {
    text += data.lists.join(" ") + " ";
  }

  // Links (flat array in your current crawler)
  if (Array.isArray(data.links)) {
    text += data.links.join(" ") + " ";
  }

  // Full text
  if (data.fullText) text += data.fullText + " ";

  return text.trim();
};
export default collectText;
