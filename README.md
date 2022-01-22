# Build Your Own Testing Platform in the Cloud Workshop

## Introduction 

In this workshop, we'll deploy a Docker container image to Heroku, which we'll use to run automated tests from our local machine while being able to observe them in the cloud.  

### Tools We'll Need

- Node.js v14 - I recommend installing [Node Version Manager](https://github.com/nvm-sh/nvm) and then installing and using Node v14.
- Signup for [a free Heroku account](https://signup.heroku.com/login)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- [ModHeader Chrome Extension](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj/related?hl=en)
- A GitHub account with the git client installed.
- [Git Bash for Windows](https://git-scm.com/downloads), if running Windows.
- (Optional) [Docker Desktop](https://www.docker.com/products/docker-desktop) (with HyperV or WSL2 enabled, if on Windows 10+. See [Docker's Windows Installation Guide](https://docs.docker.com/desktop/windows/install/)).
- (Optional) [WebKitWebDriver Epiphany Cloud Docker Container Image](https://hub.docker.com/repository/docker/jamesmortensen/webkitwebdriver-epiphany-cloud) - Use `docker pull jamesmortensen/webkitwebdriver-epiphany-cloud:latest` to pull the container image.


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


## Section 1 - Setup our Cloud Desktop on Heroku

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

#### Option 1 - Use the Docker CLI with Docker Desktop

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

#### Option 2 - Use the Heroku Deploy Cloud Container GitHub Action

There are two challenges that may impede pulling the container image from Docker Hub and then pushing it to the Heroku Container Registry. First, Docker Desktop's licensing terms, after January 31, 2022, make Docker Desktop a licensed, paid product for organizations exceeding $10,000,000 in revenue or which have greater than 250 total employees. 

Another challenge for Windows users is the complexity of configuring either HyperV or WSL2 to enable virtualization, which is required to run Docker Desktop.

One alternative is to [run the Docker Engine in a VM](https://www.codeluge.com/post/setting-up-docker-on-macos-m1-arm64-to-use-debian-10.4-docker-engine/), but setting that up or exploring other alternatives is a completely separate challenge altogether and can be quite complex.

Another alternative, which we're going to use, takes advantage of the fact that the open source Docker Engine runs natively on Linux, without Docker Desktop. GitHub Actions runners come preinstalled with everything that we need to pull the container image from Docker Hub, login to the Heroku Container Registry, push the container image to that registry, and then deploy the container on our Heroku app.

In your fork of the [Build Your Own Testing Platform in the Cloud Workshop](https://github.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop) GitHub repository is a GitHub Action with a workflow dispatch. This means we can trigger the action manually. Before you use the action, let's fork the project so that you have your own copy of this repository that you can work with. In the top right section of the page, click the "Fork" icon:

![Fork the Build Your Own Testing Platform in the Cloud Workshop repository](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/fork-build-your-own-testing-platform-in-cloud.png)

Another dialog will pop up asking you what profile/organization you'd like to fork to. I recommend choosing your personal profile. After a moment, the page should refresh, and you'll see the forked repository. Instead of seeing "jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop", you'll instead see "YOUR_NAME/build-your-own-testing-platform-in-the-cloud-workshop". Except below that, you'll see the original repo which your fork is derived from. Below is an example of an ARM64 fork of the SeleniumHQ/docker-selenium repository, as an example of what a forked repo looks like:

![Example fork of the SeleniumHQ/docker-selenium repository](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/example-fork-of-docker-selenium-github-repo.png)

Now that you've forked it, let's go to the "Actions" tab and click on the "Heroku Deploy Cloud Container" action:

![Click Actions then Heroku Deploy Cloud Container Action](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/click-actions-then-heroku.png)

You'll see there's 0 workflow runs, and that's because you haven't run any actions in this repo yet. We're about to change that. Click the "Run workflow" dropdown, located to the right of the blue notification, and this will pop up a form we'll need to fill out:

<img src="https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/heroku-deploy-action-workflow-dispatch-form.png" alt="Heroku Deploy Action Workflow Dispatch Form" width="450" />

Enter the following values in the form: 
- Email address you used to signup with Heroku
- Heroku API Token, which you'll find by running `heroku auth:token` in the terminal

```
$ heroku auth:token
 ›   Warning: token will expire 01/10/2022
 ›   Use heroku authorizations:create to generate a long-term token
YOUR_HEROKU_AUTH_TOKEN
```

- Heroku app name

The container image we're using is jamesmortensen/webkitwebdriver-epiphany-cloud:latest, and it's already filled out for us in the form by default. At this point, check that the values you entered are correct, and click "Run workflow"

At this point, you'll see a workflow run begin to execute. Click on the running workflow name, right next to the yellow circle:

![Heroku Deploy Action Running](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/heroku-deploy-action-running.png)

Next, click the "deploy" icon to see the logs:

![Click Heroku Deploy Icon in GitHub Actions](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/click-heroku-deploy-icon.png)


You'll see the action runner pulling the docker container image from Docker Hub:

![GitHub Actions runner pulling Docker container image](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/heroku-deploy-pulling-step.png)

At the end of the workflow run, you should see something like this in the logs:

![GitHub Actions Heroku deployment completed](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/heroku-deployment-action-completed.png)


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


## Section 2 - Learning about the Cloud Desktop

Now that we have our desktop deployed to the cloud, there are many different things that we could do with this. But for our purposes, we'll use it to offload automated testing from our local machine to this desktop.  We'll open MiniBrowser.  

### Step 1 - Launch MiniBrowser

Since MiniBrowser doesn't have a desktop icon, we'll need to launch it from the terminal. MiniBrowser is located in the `/usr/lib/x86_64-linux-gnu/webkit2gtk-4.0` folder and is not in our system path, but there's an alias in the `.bashrc` script to make it easier to launch. 

Right click on the desktop, mouseover Applications -> Shells, and then click "Bash".

![Applications, then Shells, then click Bash](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/application-shells-bash.png)

This will open a bash terminal. In the terminal, type `MiniBrowser` and press enter.  You should now see the browser launch on the Debian desktop.

NOTE: You can launch MiniBrowser with the absolute path, as shown in the screenshot, if you're on a system that doesn't alias it, but on this container, you can simply type `MiniBrowser` without the path.

![WebkitGTK MiniBrowser on Microsoft Edge in Windows 10](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/webkitgtk-from-windows-10.png)

In the above screenshot, you can probably tell that the host operating system is Windows 10, and inside the browser tab, we're seeing a Debian 11 Desktop with another browser running on that desktop. Perhaps your system is macOS, or even Linux. As long as you have installed ModHeader and the browser you're using is a Chromium based browser, such as Google Chrome, Microsoft Edge, Brave, Yandex, Epic, etc, then you'll be able to connect to your cloud desktop.

### Step 2 - Fun Check #1, View OS and Browser Type and Version

To prove that the browser running inside the Debian desktop is indeed Linux and not running on your host operating system, there are a couple fun checks we can do.  First, in the address bar, navigate to https://whatismybrowser.com. Be sure to type this in the MiniBrowser's address bar, not in your host browser's address bar.

![Top of whatismybrowser.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismybrowser-top-of-page.png)

Now, scroll down towards the bottom until you get to the userAgent string. Here we can verify the OS is Linux, the architecture is x86_64, and the browser version is like Safari 15.0, just one mini-version behind Safari latest at 15.1.

![Top of whatismybrowser.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismybrowser-useragent.png)

### Step 3 - Fun Check #2, View the Public IP Address of the Cloud Desktop

Another fun thing to do is to go to https://whatismyip.com. Again, do this in MiniBrowser, not on your host's browser.  In my case, I see that the server is running somewhere in Dublin, Ireland, not from my network in Chennai, India.

![whatismyip.com](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/whatismyip.png)

### Step 4 - Fun Check #3, View the Status of the WebKitWebDriver

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

### Step 5 - Fun Check #4, The House of Mirrors

Another fun thing we can do is create our very own house of mirrors. Have you ever noticed what happens when two mirrors in a room are set face to face to each other? When you look in one mirror, you see an infinite repetition of the room out to a point into infinity. 

Let's login to our Heroku account from within the cloud desktop's MiniBrowser by going to https://heroku.com. Once logged in, navigate to your app's Config Vars, and copy your VNC_SECRET_PW to the clipboard. Since this is on Linux, you'll need to use Ctrl-C, like on Windows, not like on macOS. 

After copying the password, navigate to http://localhost:7900 in the MiniBrowser. You'll see the noVNC window:

![noVNC in the container](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/novnc-in-container.png)

Let's click "Connect", and enter the password you copied from the Heroku Config Vars. Remember, regardless of whether or not your computer is Windows or macOS, you're interacting with a Linux desktop, so you'll need to right click in the textbox and click "paste".

Once pasted, click "send credentials", and get ready for the house of mirrors. You should now see this:

![House of Mirrors in MiniBrowser](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/house-of-mirrors-in-minibrowser.png)

Try clicking on something inside the browser to change the focus. For instance, this is what you'll see if you click on the bash terminal:

![House of Mirrors focusing on Terminal](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/house-of-mirrors-focusing-on-terminal.png)


While there isn't much usefulness out of doing this, it should make it clear that VNC is just a portal into another desktop. What it does confirm is that the noVNC service is indeed listening on localhost:7900.

We did need the VNC password to login, but did you notice that you didn't need to install ModHeader in MiniBrowser and configure it to send the ACCESS_TOKEN as an authentication header? What happened? Why did this work?

You may need to close the browser and reopen it to break out of the infinitely displayed mirrored desktops.

### Step 6 - Cloud Desktop Usefulness

These are just a few things we can do with this cloud desktop, aside from running the tests, which we'll get into next. Before we do, take a moment to explore the desktop further. You can right click on the desktop to pull up the menu, or you can run various Linux commands in the bash terminal. Take a moment to poke around and explore.

What kinds of other things were you able to do with this cloud desktop?


## Section 3 - Configuring WebdriverIO to Run Tests in the Heroku Cloud Desktop

Now that we have everything setup on the remote side of things, we'll clone the repository which contains a [webdriverio-sample](https://github.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/tree/master/webdriverio-sample) project, which has a wdio configuration file which runs the sample e2e tests on the Heroku Cloud Desktop.

### Step 1 - Clone the Repository and Install Modules

Let's clone the repository, and change the working directory to the folder containing the sample project. Make sure you do this in a new folder that isn't already part of another git repo. For instance, many people keep their git projects in a folder called git. Make sure your primary working directory is that folder and not some other project you're working on.

Once your PWD is correct, clone the repository and change directories:

```
$ git clone https://github.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop.git
```

```
$ cd webdriverio-sample
```

We'll need to install the node modules.

```
$ npm i
```

### Step 2 - Examine Project Configuration

If you've worked with WebdriverIO, you should recognize the structure right away. There's a wdio.conf.js configuration file, a test folder containing specs (the tests), as well as page objects (which wrap the API that communicates with the WebDriver/browsers). There's also node_modules, package.json, and package-lock.json, as well as a utils folder, which contains a logging wrapper.

You may have also noticed another file, `wdio.minibrowser-heroku.conf.js`. This is a derived configuration file, which gets most of the configuration from its parent config file, `wdio.conf.js`, and then only overrides what is explicitly specified. It's conceptually similar to inheritance in Java or any other object-oriented programming language.

`wdio.minibrowser-heroku.conf.js` is configured to communicate with a cloud container. We'll take a moment to go over what's different about this from other configuration files, and then we'll configure some environment variables that point it to YOUR_APP.herokuapp.com and which also includes the ACCESS_TOKEN needed in order to get past the security.

Perhaps the first thing you noticed in this configuration file is that there are extra options that are normally just set as implicit defaults:

```javascript
    port: 443,
    protocol: 'https',
    hostname: process.env.CLOUD_CONTAINER_APP_URL,
    headers: {
        'authorization': 'Bearer ' + process.env.CLOUD_CONTAINER_ACCESS_TOKEN
    },
    strictSSL: true,
```

When you normally run tests locally, you most likely don't set the port, protocol, and hostname. By default, the port is 4444 and the hostname is localhost. But in our case, we need to connect to our remote server on Heroku's infrastructure, so we'll set the hostname to point to our app and we'll set the port as 443. 

Why 443? It's the default port for HTTPS connections. When you browse any website, you've probably noticed you don't need to specify a port number. Every site we visit on the Internet with HTTPS uses port 443 and any site that still lives in the past using unsecured HTTP uses port 80 by default. These ports don't need to be specified because they're implicit. But in order for our test framework to connect to our remote WebDriver, we need to specify the port.

The scheme (also known as the protocol), by default, is HTTP. But in our case, communicating with a server on the public Internet requires us to use HTTPS, so we set the protocol to 'https'. strictSSL tells the system we're only using SSL and no non-secure communications.

You also see that there is a headers option where we again specify the authorization header with the Bearer ACCESS_TOKEN, similar to how we did in ModHeader to connect the browser to the server.

Notice how the hostname and header use environment variables. The values aren't hard-coded. This is because we want to keep the ACCESS_TOKEN secure. If we commit it to GitHub, it's no longer a secret and is subject to being exposed if someone ever were to hack the source code. Also, this project would not be reusable by anyone wanting to run on their own infrastructure.

To plug these values in at runtime, we'll create an `.env` file to store the values for these variables. This file has already been added to `.gitignore` so these secrets don't end up exposed in GitHub when committing changes to tests or other files.

But before we configure the environment variables, we'll look at a couple more things unique to this configuration file. First, we'll look at the capabilities, and then we'll examine the WebdriverIO onPrepare hook.

It's safe to assume that most automation testers do a majority of their testing on Google Chrome. So the capabilities are likely set to use that browser. In our case, we're testing against a WebKit based browser called MiniBrowser, and below you'll see the configuration that let's the testing framework know what kind of browser it needs to communicate with:

```javascript
    capabilities: [{
        maxInstances: 1,
        browserName: 'MiniBrowser',
        browserVersion: '2.34.1',
        'webkitgtk:browserOptions': {
            args: [
                '--automation'
            ],
            binary: `/usr/lib/${ARCH}-linux-gnu/webkit2gtk-4.0/MiniBrowser`
        }
    }],
```

Unlike Chrome, Firefox, Safari, and other browsers, the testing framework doesn't know the default binary location for MiniBrowser, so in the 'webkitgtk:browserOptions' we specify the location of that binary in the cloud. If you remember from earlier, it's at `/usr/lib/x86_64-linux-gnu/webkit2gtk-4.0/MiniBrowser`, and this information is passed to the WebKitWebDriver running on our server. The $ARCH variable is there in case we run the server on a different architectural platform, such as aarch64 (or ARM64) or armhf (like a Raspberry Pi)! By default, we assume x86_64.

The `--automation` flag is also required for MiniBrowser to allow a WebDriver or Selenium Server to automatically control it, so this argument gets passed to the binary at runtime.

Aside from capabilities, you'll see that a WebdriverIO onPrepare hook is implmenented.  WebdriverIO provides us with a series of different hooks we can tie into to run certain code at different points in the testing process.  In the `wdio.conf.js` file, we can find some documentation for the onPrepare` hook.

```javascript
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    // onPrepare: function (config, capabilities) {
    // },
```

It gets called by WebdriverIO one time, before all of the workers get launched to run the tests. WebdriverIO also passes the configuration object and capabilities to the onPrepare hook, and we can use that information to do some setup before the tests run. In fact, the tests won't start running until this function gets a return value. By default, it's unimplemented, but we've implemented it in our configuration file in order to do some health checks on the remote server to make sure it's ready to start receiving information from the WebdriverIO testing framework.

Remember how cloud container platforms, like Heroku and Google Cloud Run work. When there is no traffic, they shut down and remain idle. They don't consume any resources and can be either free of cost or very low cost. Thus, when we make our first network request to YOUR_APP.herokuapp.com after some time, it may take the server a moment to start up all of the resources: The WebKitWebDriver, the VNC server, the noVNC server, the desktop, and other resources. If WebdriverIO starts sending traffic right away, the server may respond with 502 Gateway Errors or other type of server errors.

So our onPrepare hook makes a series of requests to the WebKitWebDriver to check the status. If it gets back a 4xx or 5xx response status code, it waits 4 seconds and tries again. It repeats the health check up to 5 times, and if it doesn't get a 200 OK response code, the onPrepare hook terminates the WebdriverIO test run.

If the server returns 200 OK, then the onPrepare hook instructs WebdriverIO that it's okay to start running the tests.

Take a moment to look at the source code for the onPrepare hook and see if you can understand the logic:

```javascript
    /*
     * In the onPrepare hook, we instruct WebdriverIO to wait for the cloud service health check
     * to return a 200 OK status code. The health check will recheck the server once every
     * 4 seconds (retryTimeout) and make at least 5 attempts (maxAttempts) before terminating 
     * the wdio runner.
     */
    onPrepare(config, capabilities) {
        const opts = {
            retryTimeout: 4000,
            maxAttempts: 5
        }
        const https = require('https');
        const wdioLogger = require('@wdio/logger').default;
        const logger = wdioLogger('wdio-cloud-container-service');
        var attempts = 0;
        logger.warn('Warming up Cloud Container host at: ' + config.hostname + '...');
        const webdriverPath = config.path === undefined ? '' : config.path;
        return new Promise((resolve, reject) => {
            const healthCheckInterval = setInterval(() => {
                console.log(`${config.protocol}://${config.hostname}:${config.port}${webdriverPath}/status`);
                https.get(`${config.protocol}://${config.hostname}:${config.port}${webdriverPath}/status`, {
                    headers: {
                        'authorization': 'Bearer ' + process.env.CLOUD_CONTAINER_ACCESS_TOKEN
                    }
                }, res => {
                    if (++attempts > opts.maxAttempts) {
                        logger.error('Problem launching Cloud Container service. Status: ' + res.statusCode);
                        clearInterval(healthCheckInterval);
                        reject(new Error('Cloud Container Service failed'));
                        return;
                    }
                    let data = [];
                    //logger.warn('Status Code:', res.statusCode);

                    res.on('data', chunk => {
                        data.push(chunk);
                    });

                    res.on('end', () => {
                        //logger.warn('Response ended: ');
                        if (res.statusCode >= 200 && res.statusCode < 400) {
                            clearInterval(healthCheckInterval);
                            resolve();
                        } else {
                            logger.warn('Waiting for Cloud Container service to launch... Status code: ' + res.statusCode);
                        }
                    });
                }).on('error', err => {
                    console.log('Error: ', err.message);
                    reject(err.message);
                });
            }, opts.retryTimeout);
        }).catch((err) => {
            logger.error('SEVERE: Cloud Container service failed to launch. Exiting...');
            process.exit(1);
        });
    }
```

It's a pretty big method, and could definitely use some refactoring to make it easier to understand. Before refactoring it, I would want to write some tests around it so that I don't have to manually check it against a real server. One approach could be to mock https.get so that it simply returns a response code instead of making an actual network request to a real server. A better approach would be to split up each logical block into smaller functions and then simply mock the function that calls https.get.

If you've ever wondered if you could write unit or functional tests for code in your test framework, this is a perfect example of code that could, and should be tested, in order to ensure we can later modify it without breaking anything.

However, since we don't have time for that in this workshop, we'll save that for another time.


### Step 3 - Configure the Environment

Let's move on to configuring the environment variables so we can run some tests. In the webdriverio-samples folder, you'll find a file called `sample.env`. Let's copy it to `.env`

```
$ cp sample.env .env
```

Now, in VSCode, let's open the file and edit the contents. You should see this in the .env file:

```
CLOUD_CONTAINER_APP_URL=YOUR_APP.herokuapp.com
CLOUD_CONTAINER_ACCESS_TOKEN=<<ACCESS_TOKEN FROM HEROKU CONFIG VARS>>
```

Replace YOUR_APP with the subdomain of your Heroku app. Then go back to the Heroku Config Vars in https://heroku.com, where we entered the VNC_SECRET_PW and ACCESS_TOKEN, and copy the ACCESS_TOKEN to the file, replacing `<<ACCESS_TOKEN FROM HEROKU CONFIG VARS>>` with the ACCESS_TOKEN. Save the file.

![Environment Variables](https://raw.githubusercontent.com/jamesmortensen/build-your-own-testing-platform-in-the-cloud-workshop/master/workshop-screenshots/env-variables.png)

You can, and should confirm, that the `.env` file is listed in the project's `.gitignore` file.

```
node_modules
pnpm-lock.yaml
_results_
allure-results
allure-report
.DS_Store
.env
```

Again, we don't want keys, passwords, or other sensitive information, like secrets, committed to the GitHub repository.

### Step 4 - Run the Tests

Before get to the part that everyone's been waiting for, the moment of truth, which is running the tests on our Heroku cloud desktop, let's first verify that we're able to run the tests. I've included about 2 minutes worth of sample tests, which run against https://the-internet.herokuapp.com, a website built specifically for learning how to write tests.  To run the tests, we'll execute the following familiar command, for those of you who already use WebdriverIO:

```
$ npx wdio
```

You should see the tests running in your system's Google Chrome browser, since the default `wdio.conf.js` configuration file is configured to use the chromedriver service to run tests locally on Google Chrome. Once we're satisfied tests are running, we can terminate the test run by pressing CTRL-C in the terminal.

If everything went smooth, that tells us all of our NPM modules are installed and that we're not missing anything critical for WebdriverIO to run tests. So now let's do the same thing, but with MiniBrowser on the Heroku Cloud Desktop:

```
$ npx wdio wdio.minibrowser-heroku.conf.js
```

The output should look similar to when running with the default configuration, with a notable difference. Remember the health check code we looked at, which runs when the onPrepare hook is called? You'll see the health check happening in the terminal. If it's been awhile since you last visited YOUR_APP.herokuapp.com, it may take the server some time to warm up, and you may see a few 401 or 5xx errors. But hopefully you'll also see the health check succeed and the tests begin to run.

If you've been visiting the YOUR_APP.herokuapp.com more frequently, it may already be warmed up, and the system will immediately move to running tests.

If your tests don't start running, there are a few possible things that might be going on that we can troubleshoot:

1. Is the ACCESS_TOKEN configured in `.env`?
2. Is the URL correct?
3. Is YOUR_APP.herokuapp.com accessible in the browser, and when you visit YOUR_APP.herokuapp.com/status, does it show as READY?
4. Are you using Node.js v14? The tests use @wdio/sync mode, so they are not compatible with later versions of Node.js, such as Node.js v16+

If all of those things check out, then look through the logs and see if there's anything that jumps out as the problem. There could be something else going on. For instance, if some time has passed since when this workshop was created and when you're following these instructions, the version of MiniBrowser may have increased. In the cloud desktop bash terminal, run:

```
$ MiniBrowser --version
```

You should see `WebKitGTK 2.34.1`. If this doesn't match the browserVersion from the capabilities, then try updating it and rerun the tests. 

This is just a few reasons why things might be giving you trouble, and the logs can be a helpful ally in trying to figure out exactly what is going wrong so you can fix it. If the logs look like gibberish, or like a foreign language to you, that's ok, just try googling the messages instead to learn more about what they mean.


## Section 4 - Conclude by Configuring Your Tests to Run in the Heroku Cloud Desktop

This last section is one that might be the most helpful for you. If you've followed along in this workshop, then by now, you should have Debian 11, WebKitWebDriver, and MiniBrowser setup running in your own Heroku free account. You should also have a sample WebdriverIO project running on your computer, which is configured to work with your very own Heroku Cloud Desktop.

Assuming it's working properly, you're now armed with the knowledge and tools to try this yourself in your own test project. If you're using WebdriverIO already, then you'll just need to copy wdio.minibrowser-heroku.conf.js to your project's folder containing wdio.conf.js. You'll need to `npm i dotenv`, since it's used to read the environment variables from `.env`, and you'll need to copy that environment file to the project as well.

If you're not using the wdio-video-reporter, you will need to remove this line:

```
const video = require('wdio-video-reporter');
```

The last thing you'll need to deal with is the wdio-eslinter-service. This service checks for missing imports before running tests and saves you a lot of lost time spent waiting for the system to break at runtime. If you don't have it installed, you can install it by following the [wdio-eslinter-service instructions](https://webdriver.io/docs/wdio-eslinter-service/). Otherwise, just remove eslinter from the services in the wdio.minibrowser-heroku.conf.js file, at least for now:

```
    services: [],
```

Since wdio.minibrowser-heroku.conf.js inherits from wdio.conf.js, it should already know where your tests are located. It will inherit the specs option, in other words, and whatever else you have in wdio.conf.js that isn't overridden in wdio.minibrowser-heroku.conf.js. 

If you've made some significant changes to wdio.conf.js, you may need to deal with anything that didn't get inherited. You'll know when you try to run your tests if there's something else missing.

If you're using another WebDriver-based testing framework, such as Selenium Java, Nightwatch.js, SeleniumJS, etc, then you may still be able to configure your tests to run on your Heroku Cloud Desktop. You'll just have to configure it to work with the MiniBrowser and to connect to the remote service. These other platforms all follow a common standard, so their documentation _should_ have instructions to help you get started. 

If you _do_ figure it out, let me know, and we can update this content to help others who are working on platforms outside of WebdriverIO.


## Conclusion

This is an experimental platform. It's secure from outside abuse and runs on the Heroku free plan, but it's still experimental. Some tests may cause the system to exceed resources, which may cause some tests to fail due to socket errors, browser crashes, or driver crashes. 

Conversely, you may also find that things work smoothly. You also might find that upgrading to a Heroku paid plan works much smoother than the free plan, or you may find that the free plan completely meets your needs.

You may also find other uses for this setup. For example, you can also use it for manual testing, thanks to the noVNC server. 

The best outcome we can hope for is that this saves you time and helps you be more productive when running your UI automated tests. If that's the case, then that's great. But if you walked away learning a few new things, and if some new ideas and possibilities are now swimming together in your brain, then that's great as well. 

In this workshop, we created an application on Heroku's free plan, and we configured it with some environment variables to help keep it secure. We then used the Docker CLI to pull a Docker container image from Docker Hub and push it to the Heroku Artifact Registry. Afterwards, we deployed it to our Heroku app and explored the functionality.

We then configured a WebdriverIO sample project to run tests on the cloud desktop, and then we explored doing this for our own tests. In the process, you may have also learned some new options available to you in WebdriverIO's configuration file, such as configuring non-mainstream browsers, such as MiniBrowser.

I hope this has been useful for you.
