const pdf = require('pdf-parse');
console.log('Type of pdf:', typeof pdf);
console.log('Keys of pdf:', Object.keys(pdf));
if (typeof pdf === 'function') {
    console.log('It is a function');
} else if (pdf.default && typeof pdf.default === 'function') {
    console.log('It is a function in .default');
}
