# Build Your Own Testing Platform in the Cloud Workshop

## Introduction 

In this workshop, we'll deploy a Docker container image to Heroku, which we'll use to run automated tests from our local machine while being able to observe them in the cloud.  

### Tools We'll Need

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (with HyperVT/WSL enabled, if on Windows).
- Node.js v14 - I recommend installing [Node Version Manager](https://github.com/nvm-sh/nvm) and then installing and using Node v14.
- Signup for [a free Heroku account](https://signup.heroku.com/login)
- [ModHeader Chrome Extension](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj/related?hl=en)
- A GitHub account with the git client installed.
- [Git Bash for Windows](https://git-scm.com/downloads), if running Windows.
- [WebKitWebDriver Epiphany Cloud Docker Container Image](https://hub.docker.com/repository/docker/jamesmortensen/webkitwebdriver-epiphany-cloud) - Use `git pull jamesmortensen/webkitwebdriver-epiphany-cloud:latest` to pull the container image.

### The Problem(s)

- Running tests locally ties up our system so we can't do anything else.
- We could run headlessly, but the results may not be consistent.
- We could run the tests in a Selenium Docker container image, but this may slow down our computer.
- We could use a third-party testing cloud provider, but they can be expensive, even for low usage.

### The Solution

We'll use pre-built Docker container images which have the following components installed:

- WebKitWebDriver - Listens for test instructions from our testing framework and sends instructions to the browser.
- Epiphany and MiniBrowser - Lightweight WebKit browsers, similar to Safari in many ways but don't require expensive macOS hardware.
- VNC and noVNC - Tools which let us view the virtual desktop in a browser and watch the tests executing.
- NGINX - A reverse proxy which allows us to expose a single port on cloud-container platforms, such as Heroku or Google Cloud Run, and then forward that traffic to the appropriate service, either the noVNC server or the WebDriver service.

We'll learn how to deploy the Docker container image to Heroku, and we'll configure it so that it's properly secured from outside abuse.

We'll then configure WebdriverIO to run some tests, but using the WebDriver and browser on the Heroku cloud instead of on our local machine.  This means we're free to do other things on our system, without it using as many resources.  We'll also be able to use this in CI servers when we need to run tests on a WebKit-based browser and don't have a cloud-based macOS platform to run on.


## Section 1 - The Heroku Setup

We'll start by setting up Heroku. If you don't have a free Heroku account, [create one now](https://signup.heroku.com/login).  To setup Heroku, we'll create an app, and then we'll download and install the Heroku CLI tool. We'll then configure an ACCESS_TOKEN and VNC_SECRET_PASSWORD Heroku Config Variables in the settings.  Lastly, we'll use the Docker CLI to pull the jamesmortensen/webkitwebdriver-epiphany-cloud container image, and then we'll push it to the Heroku Registry and deploy it.

### Step 1

In the [Heroku Apps Dashboard](https://dashboard.heroku.com/apps), click New -> Create new app

![Click create](http://url/to/img.png)

![Enter app name]()



