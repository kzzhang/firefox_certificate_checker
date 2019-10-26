var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var _ = require('lodash');
var cors = require('cors');
const sslCertificate = require('get-ssl-certificate');

var app = express();
app.use(cors());
var port = process.env.PORT || 80;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function removeQuotes(string) {
	if (string.charAt(0) == "'" || string.charAt(0) == "\"") {
		return string.substring(1, string.length - 1);
	}
	return string;
}

function equalsToObject(object) {
	var output = {}
	var tokens = object.split("=");
	var currentKey = removeQuotes(tokens[0]);
	for (i = 1; i < tokens.length; i++) {
		var index = tokens[i].lastIndexOf(",");
		var value;
		if (i != tokens.length - 1) {
			value = removeQuotes(tokens[i].substring(0, index));
		} else {
			value = removeQuotes(tokens[i]);
		}
		output[currentKey] = value;
		if (i != tokens.length - 1) {
			currentKey = removeQuotes(tokens[i].substring(index + 1, tokens[i].length));
		}
	}

	return output;
}

function compareCertificates(incomingCertificate, certificate) {
	var incomingCertificateSubject = equalsToObject(incomingCertificate.subject);
	if (!_.isEqual(incomingCertificateSubject, certificate.subject)) {
		return false;
	}

	var incomingCertificateIssuer = equalsToObject(incomingCertificate.issuer);
	if (!_.isEqual(incomingCertificateIssuer, certificate.issuer)) {
		return false;
	}

	var certificateStart = new Date(certificate.valid_from);
	var certificateEnd = new Date(certificate.valid_to);
	if (incomingCertificate.validity.start != certificateStart.valueOf() || incomingCertificate.validity.end != certificateEnd.valueOf()) {
		return false;
	}

	if (incomingCertificate.fingerprint.sha1 != certificate.fingerprint) {
		return false;
	}

	var incomingCertificateSerialTokens = incomingCertificate.serialNumber.split(":");
	var incomingCertificateSerialNumber = "";
	for (i = 0; i < incomingCertificateSerialTokens.length; i++) {
		incomingCertificateSerialNumber += incomingCertificateSerialTokens[i];
	}
	if (incomingCertificateSerialNumber != certificate.serialNumber) {
		return false;
	}

	return true;
}

app.post('/', function(req, res) {
	console.log(req.body.url);

	var incomingCertificate = req.body.certificate;
	var url =  req.body.url.replace(/^https?\:\/\//i, "");
	if (url.charAt(url.length - 1) == '/') {
		url = url.substring(0, url.length - 1);
	}

	sslCertificate.get(url).then(function(certificate) {
		if (compareCertificates(incomingCertificate, certificate)) {
			console.log("Pass - " + url);
			res.type('json')
			res.status(200);
			res.end(req.body.url);
		} else {
			console.log("Fail - " + url);
			res.type('json')
			res.status(400);
			res.end(req.body.url);
		}
	});
});

app.listen(port, function() {
	console.log('CORS-enabled server listening on port: ' + port);
});