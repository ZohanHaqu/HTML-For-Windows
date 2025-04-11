const readline = require("readline");
const fs = require("fs-extra");
const path = require("path");
const htmlparser2 = require("htmlparser2");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> "
});

// App data directory for storing unsupported content
const appDataDir = path.join(__dirname, "appdata");
fs.ensureDirSync(appDataDir);

console.log("HTML5 Interactive Shell");

const args = process.argv.slice(2); // Get command-line arguments

if (args.length > 0) {
  // If an HTML file is passed as an argument, try to load and parse it
  const htmlFile = args[0];
  const filePath = path.resolve(__dirname, htmlFile);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err.message);
      process.exit(1);
    } else {
      console.log(`Loading HTML from file: ${filePath}`);
      parseHtmlInput(data);
    }
  });
} else {
  // Otherwise, run the interactive shell
  rl.prompt();
  rl.on("line", (input) => {
    if (input.trim() === ":exit") {
      rl.close();
      return;
    }

    try {
      parseHtmlInput(input);
    } catch (err) {
      console.error("Error parsing HTML:", err.message);
    }

    rl.prompt();
  }).on("close", () => {
    console.log("HTML Interpreter Shell exited.");
    process.exit(0);
  });
}

function parseHtmlInput(input) {
  try {
    const handler = new htmlparser2.DefaultHandler((error, dom) => {
      if (error) {
        console.error("Error parsing HTML:", error.message);
      } else {
        // Process the DOM
        processNode(dom);
      }
    });

    const parser = new htmlparser2.Parser(handler);
    parser.parseComplete(input);
  } catch (err) {
    console.error("Error parsing HTML:", err.message);
  }
}

function processNode(nodes) {
  nodes.forEach(node => {
    if (node.type === "tag") {
      // Handle unsupported or invalid tags
      if (isUnsupportedElement(node)) {
        displayUnsupportedWarning(node);
      } else if (!isValidTag(node)) {
        displayInvalidTagError(node);
      } else {
        // Process valid tags by outputting their text content
        node.children.forEach(child => processNode([child]));
      }
    } else if (node.type === "text") {
      // Output text content
      const trimmed = node.data.trim();
      if (trimmed.length > 0) {
        console.log(trimmed);
      }
    }
  });
}

function isUnsupportedElement(node) {
  // Check for unsupported tags
  const unsupportedTags = ["script", "style", "iframe", "object", "embed"];
  return unsupportedTags.includes(node.name.toLowerCase());
}

function isValidTag(node) {
  // List of valid HTML tags (this can be extended based on your needs)
  const validTags = [
    "html", "head", "body", "h1", "h2", "h3", "p", "a", "div", "span",
    "ul", "ol", "li", "strong", "em", "br", "img", "table", "tr", "td", "th", 
    "form", "input", "button", "label", "select", "option"
  ];

  // Check if the tag is in the valid tags list
  return validTags.includes(node.name.toLowerCase());
}

function displayUnsupportedWarning(node) {
  // Display a warning in the shell for unsupported elements
  console.log(`W: Unfortunately, the <${node.name}> tag is not supported in the shell.`);
}

function displayInvalidTagError(node) {
  // Display an error in the shell for invalid tags
  console.log(`E: Invalid tag or not tagged as a supported tag: <${node.name}>`);
}

