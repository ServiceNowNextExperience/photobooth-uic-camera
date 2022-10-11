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

1. Use source control in your instance to install the **Photobooth UIC Camera** component app: https://github.com/ServiceNowNextExperience/photobooth-uic-camera
2. Use source control in your instance to install the **Photobooth** app: https://github.com/ServiceNowNextExperience/photobooth
3. Open the Photobooth app in UI Builder to see how the component is referenced and configured. You may drag this Photobooth component into your own app.

### Edit the component

If you wish to modify the code of the component, first install the apps in your instance as instructed above.

1. Before you start custom component dev we need to address a bug in the current snc ui-component utility which causes references to dispatched and handled events to get overwritten each time you deploy the component. To resolve this first deploy the [UIC Event Fixer](https://github.com/ServiceNowNextExperience/uic-event-fixer) application into your DEV environment only.
2. If you have not done so yet, configure your environment for ui-component dev by following the [ServiceNow CLI docs](https://docs.servicenow.com/bundle/tokyo-application-development/page/build/servicenow-cli/concept/servicenow-cli.html), being sure to also follow my pointers from my document's [ServiceNow Command Line Interface (CLI)](https://www.servicenow.com/community/next-experience-articles/cross-origin-resource-sharing-cors-in-ui-builder-uib/ta-p/2341273#toc-hId--1595374477) section.
3. You will notice that the scopeName in "now-ui.json" matches the name of the scope that you installed to the instances: "x_snc_pb_camera". Thus when you deploy the component it delete and recreate the necessary records in that scope.
4. That's it! You just need these two commands (executed from the root of your photobooth-uic-camera folder).
   Develop locally:

   `snc ui-component develop --open`

   Deploy to your default instance:

   `snc ui-component deploy --force`
