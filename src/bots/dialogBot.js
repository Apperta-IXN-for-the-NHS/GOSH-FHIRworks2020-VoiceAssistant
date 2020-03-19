// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const https = require('https');
const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');

class DialogBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.recogniser = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: process.env.LuisAPIHostName
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            const prof = await this.dialog.patientProfile.get(context);
            if (prof !== undefined) {
                const recogniserResult = await this.recogniser.recognize(context);
                const intent = LuisRecognizer.topIntent(recogniserResult);
                await this.dispatchToTopIntentAsync(context, prof, intent);
            } else {
                await this.dialog.run(context, this.dialogState);
            }
            await next();
        });
    }

    getObservations(pid, type) {
        const payload = {
            pid,
            type,
            token: process.env.FHIRAuthToken,
            base_url: 'https://gosh-fhir-synth.azurehealthcareapis.com',
            next_url: null
        };
        return new Promise((resolve, reject) => {
            const req = https.request({
                host: 'fhir-json-tool.azurewebsites.net',
                path: '/api/fhir-json-tool',
                method: 'POST',
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => { resolve(JSON.parse(data)); });
            });
            req.on('error', reject);
            req.write(JSON.stringify(payload));
            req.end();
        });
    }

    async dispatchToTopIntentAsync(context, profile, intent) {
        let type;
        switch (intent) {
        case 'getBloodPressure': {
            type = 'Blood Pressure';
            break;
        }
        case 'getWeight': {
            type = 'weight';
            break;
        }
        case 'getHeight': {
            type = 'height';
            break;
        }
        case 'None':
        default: {
            await context.sendActivity("Sorry I don't understand what you mean.");
            return;
        }
        }
        const res = await this.getObservations(profile.id, type);
        type = res.type;
        if (res.observations && res.observations.length > 0) {
            for (const o of res.observations) {
                let msg = '' + o.timestamp + '\n';
                for (const k in o) {
                    if (k !== 'timestamp') {
                        msg += `  ${ k }: ${ o[k].value } ${ o[k].unit }\n`;
                    }
                }
                await context.sendActivity(msg);
            }
        } else {
            await context.sendActivity('No data points available');
        }
    }

    /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);
        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.DialogBot = DialogBot;
