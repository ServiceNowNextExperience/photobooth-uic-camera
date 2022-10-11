# Photobooth UIC Component

HTML5 component to use a camera with a ServiceNow Next Experience Framework Component.

This repository hosts two things:

1. **Custom Component Code**
   This is the source code for the photobooth-uic-component.
2. **Photobooth UIC Component App**
   This is the application and scope to which the custom code is deployed. This scope is referenced when deploying changes to the component so it should be installed first. Also, it can be used independently if you do not need to make changes to the component's code.

## Usage Scenarios

### Use existing Photobooth UIC Component from another app

If you wish to use the photobooth UIC component from another app, follow these instructions.

1. Use source control in your instance to install the **Photobooth UIC Camera** component app: https://github.com/ServiceNowNextExperience/photobooth-uic-camera (this app)
2. Use source control in your instance to install the **Photobooth** app: https://github.com/ServiceNowNextExperience/photobooth (UIB page app to test the component)
3. Use source control in your instance to install the **Photobooth Core** app: https://github.com/ServiceNowNextExperience/photobooth-core (this has the tables and flows)
4. Open the Photobooth app in UI Builder to see how the component is referenced and configured. You may drag this Photobooth component into your own app as well.

### Edit the component

If you wish to modify the code of the component, first install the apps in your instance as instructed above.

Becuase we are hosting both the code and the "compiled" app scope in the same instance, we'll need to take a couple of extra steps to get started.

NOTE: The scope name must change unless you're a ServiceNow employee. You may set that at the end of the "now-ui.json" file as well as with the "--scope" command when setting up your new project using SNC.

1. Before you start custom component dev we need to address a bug in the current snc ui-component utility which causes references to dispatched and handled events to get overwritten each time you deploy the component. To resolve this first deploy the [UIC Event Fixer](https://github.com/ServiceNowNextExperience/uic-event-fixer) application into your DEV environment only.
2. If you have not done so yet, configure your environment for ui-component dev by following the [ServiceNow CLI docs](https://docs.servicenow.com/bundle/tokyo-application-development/page/build/servicenow-cli/concept/servicenow-cli.html), being sure to also follow my pointers from my document's [ServiceNow Command Line Interface (CLI)](https://www.servicenow.com/community/next-experience-articles/cross-origin-resource-sharing-cors-in-ui-builder-uib/ta-p/2341273#toc-hId--1595374477) section.
3. Do NOT try to create a new development config for this app (but be sure to create a "test" one to make sure that everything is working).
4. Create a new directory called “photobooth-uic-camera” for you project and change directory into it.
5. **I am NOT a ServiceNow employee:** If you are not a ServiceNow employee you will need to create a new scope when configuring your local environment. You may simply leave off the word "--scope" and everything after it in the following command to auto-create a scope, or else create one in your instance using Studio and specify it here. **NOTE:** You will also need to fork this project and change the scope name in the "now-ui.json" file.
6. Use the following command to configure the folder for local dev:

`snc ui-component project --name @snc/photobooth-uic-camera --description "Use the HTML5 camera in a photobooth app" --scope "x_snc_pb_camera" –offline`

7. Don't forget to install the NPM dependencies (I always seem to):

`npm install`

8. You will need to connect this folder, which already has existing content, to git. The SNC tool won’t initialize a project in a non-empty folder and git has the same rule. To get around this we will clone our git repo into a temp folder then copy the ".git" folder from there to our project to tie it to git. (Steps from [Stack Overflow](https://stackoverflow.com/questions/5377960/git-whats-the-best-practice-to-git-clone-into-an-existing-folder))

`git clone https://github.com/ServiceNowNextExperience/photobooth-uic-camera temp`
`mv temp/.git photobooth-uic-camera/.git`
`rm -rf temp`

9. Return to “photobooth-uic-camera” folder. Git will be confused about the state of your app versus the server. The simple way to get around this is to just stash your current config with this command:

`git stash`

10. That's it! You should have the latest code locally. If you want to be sure you can always run "git pull" to be sure. Now you just need the following two commands, executed from the root of the "photobooth-uic-camera" folder as you develop the component:

    **Develop locally:**
    `snc ui-component develop --open`

    **Deploy to your default instance:**
    `snc ui-component deploy --force`
