const express = require('express');
require('dotenv').config();
const app = express();

const css = `
  body{
    display:flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  h1{
    font-family:Impact, Haettenschweiler, ‘Arial Narrow Bold’, sans-serif;
    letter-spacing:5px;
    font-size:69px;
    text-align:center;
  }
  .main-header{
    color:#ff1b1b;
  }
  h2{
    margin:48px 0;
  }
  .sub-header{
    letter-spacing:1px;
    font-family:Garamond, ‘Hoefler Text’, ‘Times New Roman’, Times, serif;
    font-size:37px;
    font-style:italic;
  }
  h3{
    font-family: "Segoe UI", Candara, "Bitstream Vera Sans", "DejaVu Sans", "Bitstream Vera Sans", "Trebuchet MS", Verdana, "Verdana Ref", sans-serif;
    padding: 41px;
    border: 2px dotted #727272;
    border-radius: 17px;
    width: 66%;
    font-weight: normal;
    font-size: 21px;
    margin-top: 59px;
  }
  @page {
    size:letter;
    margin: 2cm;
  }
`;

app.get('/birthday_card', (req, res) => {

  const { name, color, message } = req.query;

  if (!name || !color || !message) {
    res.status(400).send('bad params');
    return;
  }

  const html = `
    <html>
    <head>
      <style>
        ${css}
        h1{
          color:#${color};
        }
      </style>
    </head>
    <body>
      <div>
        <h1 class="main-header">Happy Birthday</h1>
        <h1>${name}!</h1>
      </div>
      <h2><span class="sub-header">Best wishes on your special day</span></h2>
      <h3>${message}</h3>
    </body>
    </html>
  `;
  res.send(html);
});

const PORT = process.env.PORT || '3006';
app.listen(PORT, () => console.log('Server started!'));
