// Centralized configuration and heavy lifting functions
const AI_SHORTCUTS = [
  { name: "ChatGPT", url: "https://chat.openai.com", cat: "Writing" },
  { name: "Claude", url: "https://claude.ai", cat: "Writing" },
  { name: "Midjourney", url: "https://midjourney.com", cat: "Design" },
  { name: "GitHub Copilot", url: "https://github.com/features/copilot", cat: "Coding" },
  { name: "Perplexity", url: "https://perplexity.ai", cat: "Research" }
];

const Helpers = {
  fileToDataURL: (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }),
  
  downloadURI: (uri, name) => {
    chrome.downloads.download({ url: uri, filename: name });
  }
};