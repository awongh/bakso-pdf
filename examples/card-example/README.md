# example document server

This example Expressjs server renders a customaizable birthday card that is styled for printing as a letter size page.

### Query Params

#### name: Name on the card

#### color: Hex color of the name text.

#### message: Message in the card. 

### Example:
```
http://localhost:3000/birthday_card?color=8f22c9&name=Phil%20James&message=Congrats%20on%2023%20Phil,%20it%27s%20been%20a%20great%20year.%20Many%20happy%20returns%20to%20you%20brrroooooo
```

![card example](birthday_card_example.jpg)

## Run the Example

`cd` to the example directory and install the deps:

```bash
cd examples/card-example && npm i
```

Start the document server (in the examples directory)
```bash
npm start
```

Open a new terminal and start the bakso-doc server.
```bash
npm start
```

Make a cURL request to bakso-doc:
```bash
$ DOC_URL="http://localhost:3006/birthday_card?color=8f22c9&name=Phil%20James&message=Congrats%20on%2023%20Phil,%20it%27s%20been%20a%20great%20year.%20Many%20happy%20returns%20to%20you%20brrroooooo" &&
TEMP_TOKEN=$(npm run generate_token "<YOUR SECRET GOES HERE>" | tail -n 1) &&
curl -X POST -H "Authorization: ${TEMP_TOKEN}" -H "Content-Type: application/json" --output test.pdf -d "{\"pdfParams\":{\"renderUrl\":\"${DOC_URL}\"}}" http://localhost:5003/download/pdf
```