
# FHIR Voice Assistant

  

This bot has been created using [Bot Framework](https://dev.botframework.com), [LUIS](https://eu.luis.ai/), [FHIR API](https://github.com/goshdrive/FHIRworks_2020), [FHIR to JSON](https://toolsuite.azurewebsites.net/tool-page/FHIR-to%20JSON%20Schema), and provides clinicians with a natural way to query patient information. The bot can be used via text commands or a speech to text filter can be used so that it can be used without interacting with a keyboard.

  

## Prerequisites

  

-  [Node.js](https://nodejs.org) version 10.14 or higher

  

```bash

# determine node version

node --version

```

  

- LUIS Account

  

- Azure VALuis Cognitive Services Resource

  

- Azure Web App Bot Resource

  

# To run the bot locally

- Edit auth.py with auth deftails and generate FHIR toolsuite auth token

		python auth.py

- Insert authentication keys and tokens into .env file
- Install modules
		
		npm install
- Run the bot
		
		npm run start

  

# Testing the bot using Bot Framework Emulator

  

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

  

- Install the Bot Framework Emulator version 4.5.2 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

## Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator

- File -> Open Bot

- Enter a Bot URL of `http://localhost:3978/api/messages` and credentials
