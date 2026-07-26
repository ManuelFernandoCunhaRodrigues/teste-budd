/**
 * Stand-in for the QR renderer.
 *
 * Jest picks this up automatically for the node_modules package. The real
 * component draws an SVG tree with no behaviour worth asserting on; what tests
 * care about is that the payload handed to it is the server's, so the mock keeps
 * `value` visible as a prop.
 */
const React = require('react');

function QRCode({ value }) {
  return React.createElement('QRCode', { value, testID: 'qr-code' });
}

module.exports = QRCode;
module.exports.default = QRCode;
module.exports.__esModule = true;
