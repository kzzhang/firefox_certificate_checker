# firefox_certificate_checker
Firefox extension that checks to see if the SSL certificate for navigated-to websites is valid. This is done by retrieving the same webite's certificate from a server hosted in the cloud and comparing the two. If there is any discrepancy, a notification will be created, alerting the user of what website might potentially be insecure.

# Installing
This extension is NOT published to the Firefox extension store - use at your own risk. To run, clone the repo. Then go to about:debugging on the Firefox browser and select "This Firefox" on the left hand side. Select the option to load a temporary add on and select any file from within the "extension" folder of this git repo. The extension will then be running.

The extension talks to a server running on a Heroku instance - there is no need to set up your own instance.
