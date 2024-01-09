# bakso-doc

`bakso-doc` is a Node.js micro-service that creates PDF documents.

It uses [Puppeteer](https://www.npmjs.com/package/puppeteer) and headless Chrome to request an HTML document and create a PDF.

- Simpler that propietary PDF-building syntaxes. Just use HTML & CSS.
- Simple stateless architecture
- Easy to setup

## Print Stylesheet: Use HTML & CSS to Create Documents 

CSS provides a powerful set of media queries and styles to be able to style a document.
```
@page {
  size: A4 landscape;
}
```

https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing
https://www.smashingmagazine.com/2011/11/how-to-set-up-a-print-style-sheet/

## Architecture

![bakso-doc architecture](docs/bakso-arch.jpg)

`bakso-doc` runs synchronously. When a document is requested, the request does not finish until the entire document is sent back. It is meant to be used in a queue system where the length of time to complete a request is not important.

`bakso-doc` is agnostic to other parts of the document processing system.

### Auth

`bakso-doc` authorizes requests with JWT tokens. The default is to generate a long-lived token for use on the requesting server.

Optionally, the secret can be shared across services and used to both sign and verify the tokens.

## Get Started

Clone the repo:
```
$ git clone https://github.com/awongh/bakso-doc.git && cd bakso-doc
```

Install deps:
```
npm i
```

Generate the secret and set it in the `.env` file:
```
$ touch .env &&
echo "BAKSO_SECRET_KEY=\"$( node -e "console.log(require('crypto').randomBytes(256).toString('base64'));" )\"" >> .env
```

Generate a requesting token:
```
$ npm run generate_token <SECRET GOES HERE>
```

Set the requesting token in the request.

Create a test file called `test.pdf` in the current directory.
```
$ TEMP_TOKEN=$(npm run generate_key <SECRET GOES HERE> | tail -n 1)) &&
curl -X POST -H "Content-Type: application/json" --output test.pdf  -H "Authorization: ${TEMP_TOKEN}" -d '{"pdfParams":{"renderUrl":"https://example.com"}}' http://localhost:5003/download/pdf
```

## PDF Options
See the PDF options as [defined by Pupeteer.](https://pptr.dev/api/puppeteer.pdfoptions)

Example:
```
{
  "name":"myfile",
  "renderUrl":"https://localhost:3000/mydoc",
  "pdfOptions":{
    "width":"8.5in",
    "height":"11in",
    "printBackground":true
  }
}
```