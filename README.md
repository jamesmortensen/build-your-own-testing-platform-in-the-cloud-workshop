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

You've hopefully noticed that I just took a screenshot of two tokens. Since they're now public to the world, they're no longer secure. However, don't get too excited about seeing them. As soon as I complete writing this content, I'll delete the app. 

In your case, don't share these tokens. They're the only thing sitting between you and an army of bad people who would want to do bad things with your cloud server, like use it for free while making you pay the bill, for instance.


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
$ heroku container:release web -a YOUR_APP
```


### Step 4 - Verify noVNC Access

noVNC is a VNC client which works via HTTPS and Websockets.  Under the hood, it connects to a VNC server running on the container.  This allows us to view and interact with the Debian 11 Linux desktop running in the cloud.  

To view the desktop, browse to https://YOUR_APP.herokuapp.com. As usual, replace YOUR_APP with the name of your Heroku app.

If you see a white page, which says "401 Authorization Required", then that means the deployment was successful. Congratuations!  

![401 Authorization Required](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/401-authorization-required.png)


This is what the general public sees. We definitely want this to be secured and for all outsiders to be confronted with a 401 security wall. But _you and I_ want to see the desktop, and this is where the ACCESS_TOKEN we added to the Config Vars comes into play. To access the site, we'll install the [ModHeader Chrome Extension](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj/related?hl=en). Once installed, click the extensions icon at the top right of the browser, and then click the Modheader extension icon to bring up the rule profiles pane:

![Click Extensions then Modheader](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/click-extensions-then-modheader.png)

We'll then create a rule to modify the request headers for YOUR_APP.herokuapp.com to send the ACCESS_TOKEN as an authorization Bearer token.

Use the + symbol to add a filter, which restricts the modification to only _your_ site. This is important. You don't want to leak your secure access token to every site you visit.

![Modheader Heroku Rule](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/modheader-heroku-rule.png)

Note that we're only including the ACCESS_TOKEN, not the VNC_SECRET_PW. Again, don't get too excited about seeing my access token. It's just for demo purposes and has been changed in production.

Also, note that there are two filters, one for HTTPS and one for WSS. Since noVNC uses websockets, we must make sure that traffic can get through as well.

Once created, click away from the pane to close it. Go ahead and refresh the page, and now you should see the noVNC client:

![noVNC Connect](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/novnc-connect-client.png)

Click "Connect", and you should be prompted for the VNC_SECRET_PASSWORD. You can retrieve it by copying it from the Heroku Config Vars and pasting it, like below:

![Enter VNC Password](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/enter-vnc-password.png)

Click "Send Credentials" and now you should be logged into the Debian 11 desktop. 

![Debian 11 Cloud Desktop](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/debian-11-cloud-desktop.png)


### Step 5 - Learning about the Cloud Desktop

Now that we have our desktop deployed to the cloud, there are many different things that we could do with this. But for our purposes, we'll use it to offload automated testing from our local machine to this desktop.  We'll open MiniBrowser.  Since MiniBrowser doesn't have a desktop icon, we'll need to launch it from the terminal. MiniBrowser is located in the `/usr/lib/x86_64-linux-gnu/webkit2gtk-4.0` folder and is not in our system path, but there's an alias in the `.bashrc` script to make it easier to launch. 

Right click on the desktop, mouseover Applications -> Shells, and then click "Bash".

![Applications, then Shells, then click Bash](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/application-shells-bash.png)

This will open a bash terminal. In the terminal, type `MiniBrowser` and press enter.  You should now see the browser launch on the Debian desktop:

![WebkitGTK MiniBrowser on Microsoft Edge in Windows 10](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/webkitgtk-from-windows-10.png)

In the above screenshot, you can probably tell that the host operating system is Windows 10, and inside the browser tab, we're seeing a Debian 11 Desktop with another browser running on that desktop. Perhaps your system is macOS, or even Linux. As long as you have installed ModHeader and the browser you're using is a Chromium based browser, such as Google Chrome, Microsoft Edge, Brave, Yandex, Epic, etc, then you'll be able to connect to your cloud desktop.

To prove that the browser running inside the Debian desktop is indeed Linux and not running on your host operating system, there are a couple fun checks we can do.  First, in the address bar, navigate to https://whatismybrowser.com. Be sure to type this in the MiniBrowser's address bar, not in your host browser's address bar.

![Top of whatismybrowser.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismybrowser-top-of-page.png)

Now, scroll down towards the bottom until you get to the userAgent string. Here we can verify the OS is Linux, the architecture is x86_64, and the browser version is like Safari 15.0, just one mini-version behind Safari latest at 15.1.

![Top of whatismybrowser.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismybrowser-useragent.png)

Another fun thing to do is to go to https://whatismyip.com. Again, do this in MiniBrowser, not on your host's browser.  In my case, I see that the server is running somewhere in Dublin, Ireland, not from my network in Chennai, India.

![whatismyip.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismyip.png)

We can also navigate to http://localhost:4444/status and see that there is a WebDriver listening on port 4444, sitting idle yet ready for incoming connections from a test framework. This particular WebDriver is called WebKitWebDriver, similar to how Chrome has ChromeDriver and Firefox has GeckoDriver.

NOTE: If you find the page hanging, check to make sure the scheme is http, not https!

![WebKitWebDriver Status Idle Yet Ready](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/webkitwebdriver-status-idle-yet-ready.png)

While port 4444 isn't public, the container runs an NGINX reverse proxy that listens for traffic requests to /session and /status and forwards them to the WebKitWebDriver listening on localhost:4444. Other traffic is forwarded to the noVNC server, which listens on localhost:7900. If we were running a Selenium Server, we would forward traffic from /wd/hub to localhost:4444. However, since WebKitWebDriver is capable of accepting remote, incoming connections, we don't need a Selenium Server.

To understand the reverse proxy a little bit more, let's try and access the WebDriver from our host browser. In your host OS browser (not the one in the cloud), open a new tab, and navigate to https://YOUR_APP.herokuapp.com/status. Again, replace YOUR_APP with the name of your Heroku app.

In Google Chrome, I see the same message we see when navigating to localhost:4444/status from within the cloud desktop.

![WebKitWebDriver From Host](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/webkitwebdriver-from-host.png)

Keep in mind, we want this to be secure. The only reason we're seeing the status is because we already configured ModHeader to send the access token with all of our requests. To verify it's secure, open an incognito browser on the host, and try to access https://YOUR_APP.herokuapp.com/status.

![401 Authorization Required for WebKitWebDriver Status](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/401-authorization-required-for-status.png)

Many extensions only run when not incognito mode. If you don't see the 401 Authorization Required message and instead see the WebDriver status message, then you may have configured the ModHeader extension to run on incognito browsers as well.  If this is the case, open up another browser, if you have one, and try there.  You can also disable the ModHeader extension and reload the page, if needed. This demonstrates that the services running in the cloud desktop are secure.

These are just a few things we can do with this, aside from running the tests, which we'll get into next. Before we do, take a moment to explore the desktop. You can right click on the desktop to pull up the menu, or you can run various linux commands in the bash terminal. Take a moment to poke around and explore.

What kinds of other things were you able to do with this cloud desktop?



