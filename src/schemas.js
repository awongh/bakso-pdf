// https://pptr.dev/api/puppeteer.pdfoptions/#properties

const pdfOptionsSchema = {
  type: 'object',
  properties: {
    displayHeaderFooter: {
      type: 'boolean',
      description: 'Whether to show the header and footer.',
      default: false,
    },
    footerTemplate: {
      type: 'string',
      description:
        'HTML template for the print footer. Has the same constraints and support for special classes as PDFOptions.headerTemplate.',
    },
    format: {
      type: 'string',
      // todo: add enum for format string options
      description: 'PaperFormat',
      default: 'letter',
    },
    headerTemplate: {
      type: 'string',
      description:
        'HTML template for the print header. Should be valid HTML with specific classes for injection.',
    },
    height: {
      type: ['string', 'number'],
      description:
        'Sets the height of paper. You can pass in a number or a string with a unit.',
    },
    landscape: {
      type: 'boolean',
      description: 'Whether to print in landscape orientation.',
      default: false,
    },
    margin: {
      // todo: add enum for margin options
      type: 'string',
      description: 'Set the PDF margins.',
      default: null,
    },
    omitBackground: {
      type: 'boolean',
      description:
        'Hides default white background and allows generating PDFs with transparency.',
      default: false,
    },
    pageRanges: {
      type: 'string',
      description:
        'Paper ranges to print, e.g., 1-5, 8, 11-13. The empty string, which means all pages are printed.',
      default: '',
    },
    path: {
      type: 'string',
      description: 'The path to save the file to.',
      default: null,
    },
    preferCSSPageSize: {
      type: 'boolean',
      description:
        'Give any CSS @page size declared in the page priority over what is declared in the width or height or format option.',
      default: false,
    },
    printBackground: {
      type: 'boolean',
      description: 'Set to true to print background graphics.',
      default: false,
    },
    scale: {
      type: 'number',
      description:
        'Scales the rendering of the web page. Amount must be between 0.1 and 2.',
      default: 1,
    },
    tagged: {
      type: 'boolean',
      description: 'Generate tagged (accessible) PDF.',
      default: false,
    },
    timeout: {
      type: 'number',
      description: 'Timeout in milliseconds. Pass 0 to disable timeout.',
      default: 30000,
    },
    width: {
      type: ['string', 'number'],
      description:
        'Sets the width of paper. You can pass in a number or a string with a unit.',
    },
  },
  additionalProperties: false,
};

module.exports.pdfOptionsSchema = pdfOptionsSchema;

const baksoParamsSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    renderUrl: { type: 'string' },
    pageOptions: {
      type: 'object',
      properties: {
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
    },
    pdfOptions: { $ref: '#/definitions/pdfOptions' },
  },
  // required: ['foo'],
  additionalProperties: false,
  definitions: {
    pdfOptions: pdfOptionsSchema,
  },
  required: ['name', 'renderUrl'],
};

module.exports.baksoParamsSchema = baksoParamsSchema;
