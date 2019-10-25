let server = "firefox-certificate-checker.herokuapp.com/";
let request = new XMLHttpRequest();
let certificatesMap = new Map();

console.log("Firefox Certificate Checker background script loaded!");

let checkedWebsites = { urls: ['<all_urls>'] };
let extraInfoSpec = ['blocking']; 

browser.webRequest.onHeadersReceived.addListener(async function(details){
  var requestId = details.requestId;

  var securityInfo = await browser.webRequest.getSecurityInfo(requestId, {
    certificateChain: true,
    rawDER: false
  });

  certificatesMap.set(details.url, securityInfo)
}, checkedWebsites, extraInfoSpec)

async function checkTabSecurityInfo(url) {
  setTimeout(function() {
    let securityInfo = certificatesMap.get(url);
    let certificatesList = securityInfo.certificates;
    let certificate = certificatesList[0];

    sendCert(url, certificate);
  }, 2000);
}

async function sendCert(website, cert) {
	request.open("POST", server);
	request.setRequestHeader("Content-Type", "application/json");
	request.overrideMimeType("application/json");
	request.onload = function()
	{
	    if (request.status == 400) {
	    	browser.notifications.create("Bad Certificate Detected!", {
		    	"type": "basic",
			    "title": "Bad Certificate Detected!",
			    "message": "The certificate at URL " + request.response + " was different from what we found from our server."
			});
	    } else if (request.status == 200) {
	    	console.log("Valid response received for URL: " + request.response);
	    }
	};
	var bodyMap = {};
	bodyMap["url"] = website;
	bodyMap["certificate"] = cert;
	request.send(JSON.stringify(bodyMap));
}

function handleUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.url) {
    console.log("Tab: " + tabId +
                " URL changed to " + changeInfo.url);
    checkTabSecurityInfo(changeInfo.url);
  }
}

browser.tabs.onUpdated.addListener(handleUpdated);
