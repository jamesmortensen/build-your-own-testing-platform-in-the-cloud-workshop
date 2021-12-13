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

### Step 1 - Creating the Heroku App

In the [Heroku Apps Dashboard](https://dashboard.heroku.com/apps), click New -> Create new app

![Click create](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/create-new-heroku-app.png)

Enter a name for the app, such as YOUR_NAME-webkit-webdriver. Replace YOUR_NAME with your own name or something that will be unique to you. The URL must be unique.

![Enter app name](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/enter-heroku-app-name.png)

When finished, click "Create app".


### Step 2 - Configuring Security Tokens

Now that the app has been created, we'll configure some security tokens to keep the service safe. An unsecured WebDriver or Selenium Server can be a huge liability, so be sure to secure your stuff. Let's use [GUID Generator](https://www.guidgenerator.com/online-guid-generator.aspx) to generate some random tokens.

- Set "How many GUIDs do you want" to 2
- Click "Generate some GUIDs!"

You should now see two GUIDs in the Results textbox.

![Generate two GUIDs](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/online-guid-generator.png)


Let's go back to the Heroku Dashboard and click "Settings", then scroll down to the section called "Config Vars". Click "Reveal Config Vars". In the key/value fields provided, copy and paste one of the GUIDs as ACCESS_TOKEN and the other as VNC_SECRET_PW. The result should look something like what we see below:

![GUIDs as Heroku Config Vars](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/heroku-config-vars.png)


### Step 3 - Deploy the Container Image

If you've already pulled the container image jamesmortensen/webkitwebdriver-epiphany-cloud, then you may skip this step. Otherwise, run the following command:

```
$ docker pull jamesmortensen/webkitwebdriver-epiphany-cloud:latest
```

It will take a few moments to pull the container image from Docker Hub.

Once completed, we'll add a tag, which Heroku will recognize when we push the image to the Heroku Container Registry.  Replace "YOUR_APP" with the name of your app in the command below, and then run it:

```
$ docker tag jamesmortensen/webkitwebdriver-epiphany-cloud:latest registry.heroku.com/YOUR_APP/web:latest
```

Next, we'll need to login to the Heroku Container Registry. Run the following command:

```
$ heroku container:login
```

The browser should open and ask you to login to Heroku with your login and password. Once done, the CLI should show you as logged in.

Lastly, push the container image to the Heroku Container Registry:

```
$ docker push registry.heroku.com/YOUR_APP/web:latest
```

Again, this will take some time.  Once it's done, we'll deploy the container image. Be sure to replace YOUR_APP with the name of your app:

```
$ heroku container:web -a YOUR_APP
```


### Step 4 - Verify noVNC Access

noVNC is a VNC client which works via HTTPS and Websockets.  Under the hood, it connects to a VNC server running on the container.  This allows us to view and interact with the Debian 11 Linux desktop running in the cloud.  

To view the desktop, browse to https://YOUR_APP.herokuapp.com. As usual, replace YOUR_APP with the name of your Heroku app.

If you see a white page, which says "401 Authorization Required", then that means the deployment was successful. Congratuations!  

![401 Authorization Required](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/401-authorization-required.png)


This is what the general public sees, as we definitely want this to be secured. But we want to see the desktop. This is where the ACCESS_TOKEN we added to the Config Vars comes into play. To access the site, we'll install the [ModHeader Chrome Extension](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj/related?hl=en). Once installed, click the extensions icon at the top right of the browser, and then click the Modheader extension icon:

![Click Extensions then Modheader](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/click-extensions-then-modheader.png)

We'll then create a rule to modify the request headers for YOUR_APP.herokuapp.com to send the ACCESS_TOKEN as an authorization Bearer token.

Use the + symbol to add a filter, which restricts the modification to only _your_ site. This is important. You don't want to leak your secure access token to every site you visit.

![Modheader Heroku Rule](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/modheader-heroku-rule.png)


