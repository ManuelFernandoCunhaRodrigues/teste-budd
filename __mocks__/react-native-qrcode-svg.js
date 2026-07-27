
const React = require('react');

function QRCode({ value }) {
  return React.createElement('QRCode', { value, testID: 'qr-code' });
}

module.exports = QRCode;
module.exports.default = QRCode;
module.exports.__esModule = true;
