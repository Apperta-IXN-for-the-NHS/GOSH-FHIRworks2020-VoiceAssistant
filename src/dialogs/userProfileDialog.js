// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const {
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { channels } = require('botbuilder-dialogs/lib/choices/channel');
// const { UserProfile } = require('../userProfile');
const { PatientProfile } = require('../patient');
const { PatientHelper } = require('../patienthelper');

const NAME_PROMPT = 'NAME_PROMPT';
const PATIENT_PROFILE = 'PATIENT_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const DAY_PROMPT = 'DAY_PROMPT';
const MONTH_PROMPT = 'MONTH_PROMPT';
const YEAR_PROMPT = 'YEAR_PROMPT';
const POSTCODE_PROMPT = 'POSTCODE_PROMPT';

const CONFIRM_PROMPT = 'CONFIRM_PROMPT';

class UserProfileDialog extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialog');

        this.patientProfile = userState.createProperty(PATIENT_PROFILE);

        const year = new Date().getFullYear();

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new NumberPrompt(YEAR_PROMPT, this.validateRange.bind(this, year - 200, year)));
        this.addDialog(new NumberPrompt(MONTH_PROMPT, this.validateRange.bind(this, 1, 12)));
        this.addDialog(new NumberPrompt(DAY_PROMPT, this.validateRange.bind(this, 1, 31)));
        this.addDialog(new TextPrompt(POSTCODE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        // Name, dobDay, dobMonth, dobYear, postcode

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.yearStep.bind(this),
            this.monthStep.bind(this),
            this.dayStep.bind(this),
            this.postcodeStep.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'Enter patient\'s official name.');
    }

    async yearStep(step) {
        step.values.name = step.result;
        const year = new Date().getFullYear();
        const promptOptions = { prompt: 'Enter patient\'s birth year.', retryPrompt: `The value entered must be greater than ${ year - 200 } and less than or equal to ${ year }` };
        return await step.prompt(YEAR_PROMPT, promptOptions);
    }

    async monthStep(step) {
        step.values.dobYear = step.result;
        const promptOptions = { prompt: 'Enter patient\'s birth month.', retryPrompt: 'The value entered must be between 1 and 12' };
        return await step.prompt(MONTH_PROMPT, promptOptions);
    }

    async dayStep(step) {
        step.values.dobMonth = step.result;
        const promptOptions = { prompt: 'Enter patient\'s birth day.', retryPrompt: 'The value entered must be between 1 and 31' };
        return await step.prompt(DAY_PROMPT, promptOptions);
    }

    async postcodeStep(step) {
        step.values.dobDay = step.result;
        return await step.prompt(POSTCODE_PROMPT, 'Enter patient\'s postcode.');
    }

    async confirmStep(step) {
        step.values.postcode = step.result;

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CONFIRM_PROMPT, { prompt: 'Is this okay?' });
    }

    async summaryStep(step) {
        if (step.result) {
            // Get the current profile object from user state.
            const patientProfile = await this.patientProfile.get(step.context, new PatientProfile());

            patientProfile.name = step.values.name;
            let month = step.values.dobMonth;
            if (month > 0 && month <= 9) {
                month = '0' + month;
            }
            patientProfile.dob = {
                year: step.values.dobYear,
                month,
                day: step.values.dobDay
            };
            patientProfile.postcode = step.values.postcode;

            let msg = `I have your patient name as ${ patientProfile.name }`;
            msg += ` born on ${ patientProfile.dob.day }/${ patientProfile.dob.month }/${ patientProfile.dob.year }`;
            msg += ` and postcode as ${ patientProfile.postcode }.\n`;

            await step.context.sendActivity(msg);

            msg = 'Searching for matching records\n';
            await step.context.sendActivity(msg);

            msg = '';

            const helper = new PatientHelper(patientProfile);
            const foundPatients = await helper.findRecord();
            const numFound = foundPatients.length;
            msg += `Found ${ numFound } record`;
            if (numFound !== 1) {
                msg += 's. Please try again.\n';
            } else {
                msg += '.\n';
                this.patientProfile.set(step.context, foundPatients[0]);
            }

            await step.context.sendActivity(msg);
            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
            return await step.endDialog();
        } else {
            await this.patientProfile.delete(step.context);
            return await step.replaceDialog(this.initialDialogId, { restartMsg: 'Okay the current profile has been deleted.' });
        }
    }

    async validateRange(min, max, promptContext) {
        if (promptContext.recognized.succeeded) {
            const val = promptContext.recognized.value;
            return val >= min && val <= max;
        } else {
            return false;
        }
    }
}

module.exports.UserProfileDialog = UserProfileDialog;
