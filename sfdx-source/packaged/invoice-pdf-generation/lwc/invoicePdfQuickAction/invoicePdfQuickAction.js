import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';

import savePdfToInvoice from '@salesforce/apex/InvoicePdfController.savePdfToInvoice';
import getOrganizationProfiles from '@salesforce/apex/InvoicePdfController.getOrganizationProfiles';

import LANGUAGE_FIELD from '@salesforce/schema/Invoice__c.PdfLanguage__c';

import BUTTON_LABEL_SAVE from '@salesforce/label/c.Button_Label_SaveToAttachments';
import TOAST_TITLE_SUCCESS from '@salesforce/label/c.Toast_Title_PdfSaveSuccess';
import TOAST_TITLE_ERROR from '@salesforce/label/c.Toast_Title_GenericError';

export default class InvoicePdfQuickAction extends LightningElement {
    @api invoiceId;
    @track isWorking = false;

    @track organizationProfiles;
    @track availableLanguages;

    @wire( getPicklistValues, { recordTypeId : '012000000000000AAA', fieldApiName : LANGUAGE_FIELD})
    getLanguagePicklistValues ({data}) {
        if (data) {
            this.availableLanguages = Array.from(data.values);
        }
    }

    @wire(getRecord, { recordId: '$invoiceId', fields: [LANGUAGE_FIELD] })
    setDataFromInvoice ({data}) {
        if (data) {
            this.selectedLanguage = data.fields.PdfLanguage__c.value;
        }
    }

    @track selectedProfile;
    @track selectedLanguage;

    LABELS = {
        BUTTON_LABEL_SAVE,
        TOAST_TITLE_SUCCESS,
        TOAST_TITLE_ERROR
    }

    connectedCallback() {

        getOrganizationProfiles({})
        .then( (data) => {
            let profiles = [];
            data.forEach( (entry) => {
                profiles.push({
                    label : entry.Name,
                    value : entry.Id
                })
            });
            this.organizationProfiles = profiles;

            if (profiles && profiles.length >= 1) {
                this.selectedProfile = profiles[0].value;
            }
            
        })
        .catch( () => {
            this.organizationProfiles = [];
        });
    }

    handleProfileSelection(event) {
        this.selectedProfile = event.detail.value;
    }

    handleLanguageSelection(event) {
        this.selectedLanguage = event.detail.value;
    }

    get invoicePdfUrl() {
        return '/apex/InvoicePdf?Id=' + this.invoiceId + '&orgProfileId=' + this.selectedProfile + '&lang=' + this.selectedLanguage;
    }

    savePdf() {
        this.isWorking = true;
        
        savePdfToInvoice({
            invoiceId : this.invoiceId,
            orgProfileId : this.selectedProfile,
            renderLanguage : this.selectedLanguage
        })
        .then( () => {
            let successToast = new ShowToastEvent({
                title : this.LABELS.TOAST_TITLE_SUCCESS,
                variant : 'success'
            });
            this.dispatchEvent(successToast);
            this.dispatchEvent(new CustomEvent('savesuccess'));
            this.isWorking = false;
        })
        .catch( (error) => {
            let errorToast = new ShowToastEvent({
                title : this.LABELS.TOAST_TITLE_ERROR,
                variant : 'error',
                message : error.body.message
            });
            this.dispatchEvent(errorToast);
            this.isWorking = false;
        })
    }
}