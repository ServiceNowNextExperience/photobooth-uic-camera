# Photobooth UIC Component

HTML5 component to use a camera with a ServiceNow Next Experience Framework Component.

**PRO TIP** Be sure to "Pull from repository" each time you start dev and it will make your life easier and you won't be having to stash all your changes every time I modify this readme before you check in.

This repository hosts two things:

1. **Custom Component Code**
   This is the source code for the photobooth-uic-component.
2. **Photobooth UIC Component App**
   This is the application and scope to which the custom code is deployed. This scope is referenced when deploying changes to the component so it should be installed first. It also contains the sys_ux_event records which unfortunately the snc utility will not preserve or generate automatically. Also, it can be used independently if you do not need to make changes to the component's code.

## Usage Scenarios

### Use existing Photobooth UIC Component from another app

If you wish to use the photobooth UIC component from another app, follow these instructions.

1. Use source control in your instance to install the **Photobooth UIC Camera** component app: https://github.com/ServiceNowNextExperience/photobooth-uic-camera (this app)
2. Use source control in your instance to install the **Photobooth** app: https://github.com/ServiceNowNextExperience/photobooth (UIB page app to test the component)
3. Use source control in your instance to install the **Photobooth Core** app: https://github.com/ServiceNowNextExperience/photobooth-core (this has the tables and flows)
4. Open the Photobooth app in UI Builder to see how the component is referenced and configured. You may drag this Photobooth component into your own app as well.

### Develop the component locally

If you wish to modify the code of the component, first install the apps in your instance as instructed above.

Because we are hosting both the code and the "compiled" app scope in the same instance, we'll need to take a couple of extra steps to get started.

1. Before you start custom component dev we need to address a bug in the current snc ui-component utility which causes references to events to get erased on the component each time you deploy. The [UIC Event Fixer](https://github.com/ServiceNowNextExperience/uic-event-fixer) application may be installed into your DEV environment to fix this.
2. If you have not done so yet, configure your computer for ui-component dev by following [Setting up the ServiceNow CLI](https://www.servicenow.com/community/next-experience-articles/setting-up-command-line-interface-cli-for-custom-component-dev/ta-p/2361588).
3. Do not use the instructions in the previous step to create the Photobooth UIC Camera development configuration, but instead us it to create a "Hello World" component config to be sure that everything works before continuing to the next step.
4. Create a new directory called “photobooth-uic-camera” for you project and change directory into it from the command line.
5. Use the following command to configure the folder for local UI Component dev:

`snc ui-component project --name @snc/photobooth-uic-camera --description "Use the HTML5 camera in a photobooth app" --scope "x_snc_pb_camera" –offline`
6. Don't forget to install the NPM dependencies (I always seem to miss this for some reason):

`npm install`
7. You will need to connect this folder, which already has existing content, to git. The SNC tool won’t initialize a project in a non-empty folder and git has the same rule. To get around this we will clone our git repo into a temp folder then copy the ".git" folder from there to our project to tie it to git. (Steps from [Stack Overflow](https://stackoverflow.com/questions/5377960/git-whats-the-best-practice-to-git-clone-into-an-existing-folder))

``` shell
git clone https://github.com/ServiceNowNextExperience/photobooth-uic-camera temp
mv temp/.git photobooth-uic-camera/.git
rm -rf temp
```

8. Return to “photobooth-uic-camera” folder. Git will be confused about the state of your app versus the server. The simple way to get around this is to just stash your current config with this command:
   `git stash`
9. That's it! You should have the latest code locally. If you want to be sure you can always run `git pull`. Now you just need the following two commands, executed from the root of the "photobooth-uic-camera" folder, as you develop the component:

   **Develop locally:**
   `snc ui-component develop --open`

   **Deploy to your default instance:**
   `snc ui-component deploy --force`

### Notes

You may use three scripts configured in pacakge.json as shortcuts for snc ui-component activities:

   1. `npm run dev` open browser in dev mode
   1. `npm run deploy` deploy to the configured environment
   1. `npm run config` configure your server connection and credentials