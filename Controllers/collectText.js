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

  // Navigation
  if (Array.isArray(data.navigation)) {
    text += data.navigation.map((nav) => nav.text).join(" ") + " ";
  }

  // Links (internal + external)
  if (data.links) {
    if (data.links.internal) text += data.links.internal.join(" ") + " ";
    if (data.links.external) text += data.links.external.join(" ") + " ";
  }

  // Images alt texts
  if (Array.isArray(data.images)) {
    text += data.images.map((img) => img.alt || "").join(" ") + " ";
  }

  // Full text if available
  if (data.fullText) text += data.fullText + " ";

  return text;
};
export default collectText;
